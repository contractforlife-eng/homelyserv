// backend/src/services/adzunaService.js
// ============================================================
// EXPERIMENTAL ADZUNA INTEGRATION SERVICE — Phase 1B Hardening
// Server-side proxy for Adzuna Jobs API with in-memory caching.
// Keeps credentials private and transforms results into safe DTOs.
// ============================================================
import axios from 'axios';
import { normalizeCountryCode } from '../utils/currencyMetadata.js';

// ISO 3166-1 alpha-2 countries supported by Adzuna API
export const ADZUNA_SUPPORTED_COUNTRIES = Object.freeze(new Set([
  'gb', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es',
  'fr', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'ru', 'sg', 'za'
]));

// Isolated currency mapping strictly tied to Adzuna external job market
export const ADZUNA_COUNTRY_CURRENCIES = Object.freeze({
  gb: { code: 'GBP', symbol: '£' },
  us: { code: 'USD', symbol: '$' },
  ca: { code: 'CAD', symbol: 'CA$' },
  au: { code: 'AUD', symbol: 'A$' },
  nz: { code: 'NZD', symbol: 'NZ$' },
  de: { code: 'EUR', symbol: '€' },
  fr: { code: 'EUR', symbol: '€' },
  at: { code: 'EUR', symbol: '€' },
  be: { code: 'EUR', symbol: '€' },
  es: { code: 'EUR', symbol: '€' },
  it: { code: 'EUR', symbol: '€' },
  nl: { code: 'EUR', symbol: '€' },
  ch: { code: 'CHF', symbol: 'CHF' },
  pl: { code: 'PLN', symbol: 'zł' },
  br: { code: 'BRL', symbol: 'R$' },
  mx: { code: 'MXN', symbol: 'MX$' },
  in: { code: 'INR', symbol: '₹' },
  sg: { code: 'SGD', symbol: 'S$' },
  za: { code: 'ZAR', symbol: 'R' }
});

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const UPSTREAM_TIMEOUT_MS = 8000;

// ============================================================
// IN-MEMORY CACHE IMPLEMENTATION (Phase 1B)
// Pure Map, no external dependencies, capped size, 15 min TTL.
// ============================================================
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_MAX_ENTRIES = 100;
const memoryCache = new Map();

/**
 * Builds a deterministic, clean cache key from normalized search inputs.
 * Never includes user identifiers, JWTs, or secrets.
 */
export const buildCacheKey = ({ country, page, what, where, resultsPerPage }) => {
  const normCountry = (country || '').toLowerCase().trim();
  const normPage = parseInt(page, 10) || 1;
  const normWhat = (what || '').toLowerCase().trim();
  const normWhere = (where || '').toLowerCase().trim();
  const normRpp = parseInt(resultsPerPage, 10) || 20;
  return `adzuna:${normCountry}:p${normPage}:w${normWhat}:loc${normWhere}:rpp${normRpp}`;
};

/**
 * Retrieves a non-expired entry from memory cache.
 */
const getFromCache = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
};

/**
 * Sets a cache entry, pruning oldest/expired items if size limit is exceeded.
 */
const setInCache = (key, data) => {
  const now = Date.now();

  // Prune expired entries first
  if (memoryCache.size >= CACHE_MAX_ENTRIES) {
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiresAt) {
        memoryCache.delete(k);
      }
    }
  }

  // If still at capacity, delete oldest inserted key (FIFO via Map iterator)
  if (memoryCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    data,
    expiresAt: now + CACHE_TTL_MS
  });
};

/**
 * Clears in-memory cache (useful for testing).
 */
export const clearAdzunaCache = () => {
  memoryCache.clear();
};

/**
 * Strips HTML tags safely from string to prevent XSS.
 */
const stripHtml = (html) => {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Normalizes an Adzuna raw job object into HomelyServ's safe read-only DTO.
 */
export const transformAdzunaJob = (raw, countryCode = null) => {
  if (!raw || typeof raw !== 'object') return null;

  const marketCurrency = countryCode && ADZUNA_COUNTRY_CURRENCIES[countryCode.toLowerCase()]
    ? ADZUNA_COUNTRY_CURRENCIES[countryCode.toLowerCase()]
    : null;

  return {
    id: raw.id ? `adzuna_${String(raw.id)}` : `adzuna_${Math.random().toString(36).substring(2, 9)}`,
    title: typeof raw.title === 'string' ? stripHtml(raw.title) : 'Untitled Position',
    company: raw.company?.display_name ? stripHtml(raw.company.display_name) : null,
    location: raw.location?.display_name ? stripHtml(raw.location.display_name) : (Array.isArray(raw.location?.area) ? raw.location.area.join(', ') : null),
    description: typeof raw.description === 'string' ? stripHtml(raw.description) : '',
    salaryMin: typeof raw.salary_min === 'number' && Number.isFinite(raw.salary_min) ? raw.salary_min : null,
    salaryMax: typeof raw.salary_max === 'number' && Number.isFinite(raw.salary_max) ? raw.salary_max : null,
    currency: marketCurrency?.code || null,
    currencySymbol: marketCurrency?.symbol || null,
    createdAt: raw.created ? new Date(raw.created).toISOString() : new Date().toISOString(),
    redirectUrl: typeof raw.redirect_url === 'string' ? raw.redirect_url : null,
    contractType: raw.contract_type || raw.contract_time || null,
    category: raw.category?.label || null,
    source: 'adzuna'
  };
};

/**
 * Fetches jobs from the official Adzuna API with in-memory caching and error classification.
 *
 * @param {Object} options
 * @param {string} options.country - 2-letter country code
 * @param {string} [options.what] - Search query / keywords
 * @param {string} [options.where] - Location query
 * @param {number} [options.page=1] - Page number (1-indexed)
 * @param {number} [options.resultsPerPage=20]
 * @returns {Promise<{ supported: boolean, jobs: Array, total?: number, reason?: string, error?: string, cached?: boolean }>}
 */
export const searchAdzunaJobs = async ({ country, what = '', where = '', page = 1, resultsPerPage = 20 } = {}) => {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return {
      supported: true,
      jobs: [],
      total: 0,
      configured: false,
      reason: 'ADZUNA_NOT_CONFIGURED'
    };
  }

  const normalized = normalizeCountryCode(country);
  const countryCode = normalized ? normalized.toLowerCase() : null;

  if (!countryCode || !ADZUNA_SUPPORTED_COUNTRIES.has(countryCode)) {
    return {
      supported: false,
      jobs: [],
      total: 0,
      configured: true,
      country: countryCode || country || null,
      reason: 'COUNTRY_NOT_SUPPORTED'
    };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeRpp = Math.min(50, Math.max(1, parseInt(resultsPerPage, 10) || 20));
  const safeWhat = typeof what === 'string' ? what.trim().slice(0, 100) : '';
  const safeWhere = typeof where === 'string' ? where.trim().slice(0, 100) : '';

  // Check in-memory cache
  const cacheKey = buildCacheKey({
    country: countryCode,
    page: safePage,
    what: safeWhat,
    where: safeWhere,
    resultsPerPage: safeRpp
  });

  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      cached: true
    };
  }

  const endpoint = `${ADZUNA_BASE_URL}/${encodeURIComponent(countryCode)}/search/${safePage}`;

  const params = {
    app_id: appId,
    app_key: appKey,
    results_per_page: safeRpp
  };

  if (safeWhat) {
    params.what = safeWhat;
  }
  if (safeWhere) {
    params.where = safeWhere;
  }

  try {
    const response = await axios.get(endpoint, {
      params,
      timeout: UPSTREAM_TIMEOUT_MS,
      headers: {
        Accept: 'application/json'
      }
    });

    const data = response.data;
    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const jobs = rawResults
      .map((raw) => transformAdzunaJob(raw, countryCode))
      .filter((j) => j && j.redirectUrl); // Only include items with valid redirect link

    const resultPayload = {
      supported: true,
      configured: true,
      country: countryCode,
      page: safePage,
      total: typeof data?.count === 'number' ? data.count : jobs.length,
      jobs,
      cached: false
    };

    // Cache ONLY successful responses
    setInCache(cacheKey, resultPayload);

    return resultPayload;
  } catch (err) {
    console.error('Adzuna upstream error:', err.message);

    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const status = err.response?.status;

    if (status === 404) {
      return {
        supported: false,
        jobs: [],
        total: 0,
        configured: true,
        reason: 'COUNTRY_NOT_SUPPORTED'
      };
    }

    if (status === 429) {
      return {
        supported: true,
        configured: true,
        jobs: [],
        total: 0,
        error: 'ADZUNA_RATE_LIMITED'
      };
    }

    if (isTimeout) {
      return {
        supported: true,
        configured: true,
        jobs: [],
        total: 0,
        error: 'ADZUNA_TIMEOUT'
      };
    }

    return {
      supported: true,
      configured: true,
      jobs: [],
      total: 0,
      error: 'ADZUNA_UPSTREAM_ERROR'
    };
  }
};

export default {
  searchAdzunaJobs,
  transformAdzunaJob,
  buildCacheKey,
  clearAdzunaCache,
  ADZUNA_SUPPORTED_COUNTRIES,
  ADZUNA_COUNTRY_CURRENCIES
};
