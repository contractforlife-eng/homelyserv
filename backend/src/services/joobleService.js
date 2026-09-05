// backend/src/services/joobleService.js
// ============================================================
// EXPERIMENTAL JOOBLE MULTI-MARKET INTEGRATION SERVICE — Phase 1
// Server-side proxy for Jooble Jobs API (supporting TR & EG).
// Heavy 12-hour in-memory cache to strictly preserve limited quota.
// Never exposes JOOBLE_TR_API_KEY, JOOBLE_EG_API_KEY or upstream path URLs.
// ============================================================
import axios from 'axios';

const UPSTREAM_TIMEOUT_MS = 8000;

// 12 HOURS TTL (43,200,000 ms) for extreme quota preservation
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;
const memoryCache = new Map();

// Supported Jooble Market Configurations
export const JOOBLE_MARKET_CONFIG = Object.freeze({
  tr: {
    country: 'tr',
    baseUrl: 'https://tr.jooble.org/api',
    getApiKey: () => process.env.JOOBLE_TR_API_KEY,
    label: 'Jooble TR'
  },
  eg: {
    country: 'eg',
    baseUrl: 'https://eg.jooble.org/api',
    getApiKey: () => process.env.JOOBLE_EG_API_KEY,
    label: 'Jooble EG'
  }
});

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

// Profession to Egypt query keyword mapping (English terms commonly indexed in Jooble EG)
export const EGYPT_PROFESSION_MAP = Object.freeze({
  nanny: 'babysitter',
  babysitter: 'babysitter',
  elderly_caregiver: 'caregiver',
  elderly_care: 'caregiver',
  nurse: 'nurse',
  driver: 'driver',
  cook: 'cook',
  cleaner: 'cleaner',
  housekeeping: 'cleaner',
  maid: 'cleaner',
  gardener: 'gardener',
  security_guard: 'security guard',
  security: 'security guard',
  tutor: 'tutor',
  private_tutor: 'tutor',
  house_manager: 'house manager',
  personal_assistant: 'personal assistant',
  handyman: 'handyman',
  painter: 'painter'
});

/**
 * Builds deterministic cache key from search inputs with market isolation.
 * Egypt and Turkey never share cache entries.
 * Never includes user identifiers, tokens, or credentials.
 */
export const buildJoobleCacheKey = ({ market = 'tr', keywords, location, page }) => {
  const normMarket = (market || 'tr').toLowerCase().trim();
  const normKeywords = (keywords || '').toLowerCase().trim();
  const normLoc = (location || '').toLowerCase().trim();
  const normPage = parseInt(page, 10) || 1;
  return `jooble:${normMarket}:k${normKeywords}:loc${normLoc}:p${normPage}`;
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
 * Strips HTML tags and decodes common HTML entities into safe plain text.
 * Never produces executable HTML. Returns clean plain text.
 */
const stripHtml = (html) => {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&#0*60;/g, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#0*62;/g, '>')
    .replace(/&ndash;/gi, '-')
    .replace(/&#0*8211;/g, '-')
    .replace(/&mdash;/gi, '—')
    .replace(/&#0*8212;/g, '—')
    .replace(/&hellip;/gi, '...')
    .replace(/&#0*8230;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Normalizes raw Jooble job item into safe HomelyServ DTO.
 */
export const transformJoobleJob = (raw, market = 'tr') => {
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
    market
  };
};

/**
 * Core multi-market search function for Jooble (TR & EG).
 *
 * @param {Object} options
 * @param {string} [options.country='tr'] - Market country code ('tr' or 'eg')
 * @param {string} [options.what] - Keywords / query / profession
 * @param {string} [options.where] - Location query
 * @param {number} [options.page=1] - Page number (1-indexed)
 * @param {string} [options.profession] - Worker's registered profession
 * @returns {Promise<Object>}
 */
export const searchJoobleJobs = async ({ country = 'tr', what = '', where = '', page = 1, profession = '' } = {}) => {
  const normMarket = String(country || 'tr').toLowerCase().trim();
  const marketConfig = JOOBLE_MARKET_CONFIG[normMarket];

  if (!marketConfig) {
    return {
      success: true,
      supported: false,
      country: normMarket,
      jobs: [],
      total: 0,
      reason: 'COUNTRY_NOT_SUPPORTED'
    };
  }

  const apiKey = marketConfig.getApiKey();

  if (!apiKey) {
    return {
      success: true,
      supported: true,
      provider: 'jooble',
      country: normMarket,
      configured: false,
      jobs: [],
      total: 0,
      reason: 'JOOBLE_NOT_CONFIGURED'
    };
  }

  let searchKeywords = (typeof what === 'string' ? what.trim() : '');

  // If search query is empty, try mapping worker's profession to market-specific equivalent
  if (!searchKeywords && profession) {
    const profKey = String(profession).toLowerCase().trim();
    if (normMarket === 'eg') {
      searchKeywords = EGYPT_PROFESSION_MAP[profKey] || profKey;
    } else {
      searchKeywords = TURKISH_PROFESSION_MAP[profKey] || profKey;
    }
  }

  // If query is still shorter than 2 characters, protect quota and do not send broad empty search
  if (!searchKeywords || searchKeywords.length < 2) {
    return {
      success: true,
      supported: true,
      provider: 'jooble',
      country: normMarket,
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
    market: normMarket,
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

  const endpoint = `${marketConfig.baseUrl}/${encodeURIComponent(apiKey)}`;

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
      .map((raw) => transformJoobleJob(raw, normMarket))
      .filter((j) => j && j.redirectUrl);

    const resultPayload = {
      success: true,
      supported: true,
      configured: true,
      provider: 'jooble',
      country: normMarket,
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
    console.error(`[Jooble ${normMarket.toUpperCase()} Upstream Error] Status: ${status || 'NETWORK_ERROR'}, Message: ${err.message}`);

    if (status === 429) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'jooble',
        country: normMarket,
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
        country: normMarket,
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
      country: normMarket,
      jobs: [],
      total: 0,
      error: 'JOOBLE_UPSTREAM_ERROR'
    };
  }
};

/**
 * Backward compatibility helper for Turkey search
 */
export const searchJoobleTurkeyJobs = async (options = {}) => {
  return searchJoobleJobs({ ...options, country: 'tr' });
};

/**
 * Search helper for Egypt Jooble
 */
export const searchJoobleEgyptJobs = async (options = {}) => {
  return searchJoobleJobs({ ...options, country: 'eg' });
};

export default {
  searchJoobleJobs,
  searchJoobleTurkeyJobs,
  searchJoobleEgyptJobs,
  transformJoobleJob,
  buildJoobleCacheKey,
  clearJoobleCache,
  JOOBLE_MARKET_CONFIG,
  TURKISH_PROFESSION_MAP,
  EGYPT_PROFESSION_MAP
};
