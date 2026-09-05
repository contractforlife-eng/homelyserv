// backend/src/services/joobleService.js
// ============================================================
// EXPERIMENTAL JOOBLE TURKEY INTEGRATION SERVICE — Phase 1
// Server-side proxy for Jooble Turkey Jobs API.
// Heavy 12-hour in-memory cache to strictly preserve limited quota.
// Never exposes JOOBLE_TR_API_KEY or upstream path URLs.
// ============================================================
import axios from 'axios';

const JOOBLE_TR_BASE_URL = 'https://tr.jooble.org/api';
const UPSTREAM_TIMEOUT_MS = 8000;

// 12 HOURS TTL (43,200,000 ms) for extreme quota preservation
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;
const memoryCache = new Map();

// Profession to Turkish query keyword mapping
export const TURKISH_PROFESSION_MAP = Object.freeze({
  nanny: 'bebek bakıcısı',
  babysitter: 'çocuk bakıcısı',
  elderly_caregiver: 'yaşlı bakıcısı',
  elderly_care: 'yaşlı bakıcısı',
  nurse: 'hemşire',
  driver: 'şoför',
  cook: 'aşçı',
  cleaner: 'temizlik görevlisi',
  housekeeping: 'temizlik görevlisi',
  maid: 'temizlik görevlisi',
  gardener: 'bahçıvan',
  security_guard: 'güvenlik görevlisi',
  security: 'güvenlik görevlisi',
  tutor: 'özel ders',
  private_tutor: 'özel ders',
  house_manager: 'ev yöneticisi',
  personal_assistant: 'kişisel asistan',
  handyman: 'tamirat ustası',
  painter: 'boyacı'
});

/**
 * Builds deterministic cache key from search inputs.
 * Never includes user identifiers, tokens, or credentials.
 */
export const buildJoobleCacheKey = ({ keywords, location, page }) => {
  const normKeywords = (keywords || '').toLowerCase().trim();
  const normLoc = (location || '').toLowerCase().trim();
  const normPage = parseInt(page, 10) || 1;
  return `jooble:tr:k${normKeywords}:loc${normLoc}:p${normPage}`;
};

/**
 * Retrieves valid entry from in-memory cache.
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
 * Stores payload in cache (including zero-result responses).
 */
const setInCache = (key, data) => {
  const now = Date.now();

  // Prune expired entries
  if (memoryCache.size >= CACHE_MAX_ENTRIES) {
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiresAt) {
        memoryCache.delete(k);
      }
    }
  }

  // FIFO eviction if still capped
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
 * Clears Jooble in-memory cache (for testing).
 */
export const clearJoobleCache = () => {
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
 * Normalizes raw Jooble job item into safe HomelyServ DTO.
 */
export const transformJoobleJob = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const rawSalary = typeof raw.salary === 'string' && raw.salary.trim() ? stripHtml(raw.salary.trim()) : null;

  return {
    id: raw.id ? `jooble_${String(raw.id)}` : `jooble_${Math.random().toString(36).substring(2, 9)}`,
    title: typeof raw.title === 'string' ? stripHtml(raw.title) : 'Untitled Position',
    company: typeof raw.company === 'string' && raw.company.trim() ? stripHtml(raw.company) : null,
    location: typeof raw.location === 'string' && raw.location.trim() ? stripHtml(raw.location) : null,
    description: typeof raw.snippet === 'string' ? stripHtml(raw.snippet) : '',
    salaryDisplay: rawSalary,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    currencySymbol: null,
    createdAt: raw.updated ? new Date(raw.updated).toISOString() : new Date().toISOString(),
    redirectUrl: typeof raw.link === 'string' && raw.link.startsWith('http') ? raw.link : null,
    contractType: raw.type || null,
    category: null,
    source: 'jooble',
    provider: 'jooble',
    market: 'tr'
  };
};

/**
 * Searches jobs on Jooble Turkey with quota protection & caching.
 *
 * @param {Object} options
 * @param {string} [options.what] - Keywords / query / profession
 * @param {string} [options.where] - Location query
 * @param {number} [options.page=1] - Page number (1-indexed)
 * @param {string} [options.profession] - Worker's registered profession
 * @returns {Promise<Object>}
 */
export const searchJoobleTurkeyJobs = async ({ what = '', where = '', page = 1, profession = '' } = {}) => {
  const apiKey = process.env.JOOBLE_TR_API_KEY;

  if (!apiKey) {
    return {
      success: true,
      supported: true,
      provider: 'jooble',
      country: 'tr',
      configured: false,
      jobs: [],
      total: 0,
      reason: 'JOOBLE_NOT_CONFIGURED'
    };
  }

  let searchKeywords = (typeof what === 'string' ? what.trim() : '');

  // If search query is empty, try mapping worker's profession to Turkish equivalent
  if (!searchKeywords && profession) {
    const profKey = String(profession).toLowerCase().trim();
    searchKeywords = TURKISH_PROFESSION_MAP[profKey] || profKey;
  }

  // If query is still shorter than 2 characters, protect quota and do not send broad empty search
  if (!searchKeywords || searchKeywords.length < 2) {
    return {
      success: true,
      supported: true,
      provider: 'jooble',
      country: 'tr',
      configured: true,
      jobs: [],
      total: 0,
      reason: 'SEARCH_TERM_REQUIRED'
    };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLocation = typeof where === 'string' ? where.trim().slice(0, 100) : '';
  const safeKeywords = searchKeywords.slice(0, 100);

  // Check cache
  const cacheKey = buildJoobleCacheKey({
    keywords: safeKeywords,
    location: safeLocation,
    page: safePage
  });

  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      cached: true
    };
  }

  // Construct request payload
  const requestBody = {
    keywords: safeKeywords,
    page: safePage
  };
  if (safeLocation) {
    requestBody.location = safeLocation;
  }

  const endpoint = `${JOOBLE_TR_BASE_URL}/${encodeURIComponent(apiKey)}`;

  try {
    const response = await axios.post(endpoint, requestBody, {
      timeout: UPSTREAM_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    const data = response.data;
    const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const jobs = rawJobs
      .map(transformJoobleJob)
      .filter((j) => j && j.redirectUrl);

    const resultPayload = {
      success: true,
      supported: true,
      configured: true,
      provider: 'jooble',
      country: 'tr',
      page: safePage,
      total: typeof data?.totalCount === 'number' ? data.totalCount : jobs.length,
      jobs,
      cached: false
    };

    // Cache successful responses (INCLUDING ZERO RESULTS)
    setInCache(cacheKey, resultPayload);

    return resultPayload;
  } catch (err) {
    // Sanitized logging only — NEVER log err.config.url or raw path containing API key
    const status = err.response?.status;
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    console.error(`[Jooble Upstream Error] Status: ${status || 'NETWORK_ERROR'}, Message: ${err.message}`);

    if (status === 429) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'jooble',
        country: 'tr',
        jobs: [],
        total: 0,
        error: 'JOOBLE_RATE_LIMITED'
      };
    }

    if (isTimeout) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'jooble',
        country: 'tr',
        jobs: [],
        total: 0,
        error: 'JOOBLE_TIMEOUT'
      };
    }

    return {
      success: true,
      supported: true,
      configured: true,
      provider: 'jooble',
      country: 'tr',
      jobs: [],
      total: 0,
      error: 'JOOBLE_UPSTREAM_ERROR'
    };
  }
};

export default {
  searchJoobleTurkeyJobs,
  transformJoobleJob,
  buildJoobleCacheKey,
  clearJoobleCache,
  TURKISH_PROFESSION_MAP
};
