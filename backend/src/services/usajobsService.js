// backend/src/services/usajobsService.js
// ============================================================
// EXPERIMENTAL USAJOBS INTEGRATION SERVICE — Phase 1
// Server-side proxy for USAJOBS Search API (U.S. Federal Jobs).
// Heavy 6-hour in-memory cache to strictly preserve limited quota.
// Never exposes USAJOBS_API_KEY, USAJOBS_EMAIL or credentials.
// ============================================================
import axios from 'axios';

const USAJOBS_SEARCH_URL = 'https://data.usajobs.gov/api/search';
const UPSTREAM_TIMEOUT_MS = 8000;

// 6 HOURS TTL (21,600,000 ms)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;
const memoryCache = new Map();

// Profession to USAJOBS keyword search mapping
export const USAJOBS_PROFESSION_MAP = Object.freeze({
  nurse: 'nurse',
  driver: 'driver',
  security_guard: 'security guard',
  security: 'security guard',
  cook: 'cook',
  cleaner: 'housekeeping',
  housekeeping: 'housekeeping',
  maid: 'housekeeping',
  caregiver: 'caregiver',
  elderly_caregiver: 'caregiver',
  elderly_care: 'caregiver',
  nanny: 'childcare',
  babysitter: 'childcare',
  tutor: 'tutor',
  private_tutor: 'tutor',
  personal_assistant: 'administrative assistant',
  house_manager: 'administrative assistant',
  gardener: 'groundskeeper',
  handyman: 'maintenance',
  painter: 'painter'
});

/**
 * Builds deterministic cache key from search inputs.
 * Never includes user identifiers, tokens, or credentials.
 */
export const buildUsajobsCacheKey = ({ keywords = '', location = '', page = 1, resultsPerPage = 20 } = {}) => {
  const normKeywords = (keywords || '').toLowerCase().trim();
  const normLoc = (location || '').toLowerCase().trim();
  const normPage = parseInt(page, 10) || 1;
  const normRpp = parseInt(resultsPerPage, 10) || 20;
  return `usajobs:us:k${normKeywords}:loc${normLoc}:p${normPage}:rpp${normRpp}`;
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
 * Clears USAJOBS in-memory cache (for testing).
 */
export const clearUsajobsCache = () => {
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
 * Formats salary safely from USAJOBS PositionRemuneration array.
 */
const formatUsajobsSalary = (remunerationArray) => {
  if (!Array.isArray(remunerationArray) || remunerationArray.length === 0) {
    return { min: null, max: null, display: null };
  }

  const rem = remunerationArray[0] || {};
  const rawMin = parseFloat(rem.MinimumRange);
  const rawMax = parseFloat(rem.MaximumRange);
  const min = !isNaN(rawMin) && rawMin > 0 ? rawMin : null;
  const max = !isNaN(rawMax) && rawMax > 0 ? rawMax : null;

  let interval = '';
  const code = (rem.RateIntervalCode || '').toUpperCase().trim();
  const desc = (rem.Description || '').toLowerCase().trim();

  if (code === 'PA' || desc.includes('year') || desc.includes('per annum')) {
    interval = ' / year';
  } else if (code === 'PH' || desc.includes('hour') || desc.includes('per hour')) {
    interval = ' / hour';
  } else if (code === 'PM' || desc.includes('month') || desc.includes('per month')) {
    interval = ' / month';
  } else if (code === 'BW' || desc.includes('bi-weekly') || desc.includes('biweekly')) {
    interval = ' / bi-week';
  } else if (code === 'PD' || desc.includes('day') || desc.includes('per day')) {
    interval = ' / day';
  }

  let display = null;
  if (min !== null && max !== null) {
    if (min === max) {
      display = `$${Math.round(min).toLocaleString('en-US')}${interval}`;
    } else {
      display = `$${Math.round(min).toLocaleString('en-US')} - $${Math.round(max).toLocaleString('en-US')}${interval}`;
    }
  } else if (min !== null) {
    display = `$${Math.round(min).toLocaleString('en-US')}+${interval}`;
  } else if (max !== null) {
    display = `Up to $${Math.round(max).toLocaleString('en-US')}${interval}`;
  }

  return { min, max, display };
};

/**
 * Normalizes raw USAJOBS search result item into safe HomelyServ DTO.
 */
export const transformUsajobsJob = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const desc = raw.MatchedObjectDescriptor || {};
  const objectId = raw.MatchedObjectId || desc.PositionID || Math.random().toString(36).substring(2, 9);

  const title = typeof desc.PositionTitle === 'string' ? stripHtml(desc.PositionTitle) : 'Untitled Federal Position';
  const department = typeof desc.DepartmentName === 'string' ? stripHtml(desc.DepartmentName) : '';
  const organization = typeof desc.OrganizationName === 'string' ? stripHtml(desc.OrganizationName) : '';
  const company = department || organization || 'U.S. Federal Government';

  const location = typeof desc.PositionLocationDisplay === 'string'
    ? stripHtml(desc.PositionLocationDisplay)
    : (Array.isArray(desc.PositionLocation) && desc.PositionLocation[0]?.LocationName ? stripHtml(desc.PositionLocation[0].LocationName) : 'United States');

  const summary = desc.UserArea?.Details?.JobSummary || desc.QualificationSummary || '';
  const description = typeof summary === 'string' ? stripHtml(summary) : '';

  const { min: salaryMin, max: salaryMax, display: salaryDisplay } = formatUsajobsSalary(desc.PositionRemuneration);

  const redirectUrl = typeof desc.PositionURI === 'string' && desc.PositionURI.startsWith('http')
    ? desc.PositionURI
    : (Array.isArray(desc.ApplyURI) && desc.ApplyURI[0]?.startsWith('http') ? desc.ApplyURI[0] : null);

  const contractType = Array.isArray(desc.PositionSchedule) && desc.PositionSchedule[0]?.Name
    ? desc.PositionSchedule[0].Name
    : (Array.isArray(desc.PositionOfferingType) && desc.PositionOfferingType[0]?.Name ? desc.PositionOfferingType[0].Name : null);

  const category = Array.isArray(desc.JobCategory) && desc.JobCategory[0]?.Name
    ? desc.JobCategory[0].Name
    : 'Federal Service';

  const createdAt = desc.PublicationStartDate
    ? new Date(desc.PublicationStartDate).toISOString()
    : new Date().toISOString();

  return {
    id: `usajobs_${String(objectId)}`,
    title,
    company,
    location,
    description,
    salaryDisplay,
    salaryMin,
    salaryMax,
    currency: 'USD',
    currencySymbol: '$',
    createdAt,
    redirectUrl,
    contractType,
    category,
    source: 'usajobs',
    provider: 'usajobs',
    market: 'us'
  };
};

/**
 * Searches jobs on USAJOBS API with quota protection & caching.
 *
 * @param {Object} options
 * @param {string} [options.what] - Keywords / query / profession
 * @param {string} [options.where] - Location query
 * @param {number} [options.page=1] - Page number (1-indexed)
 * @param {number} [options.resultsPerPage=20] - Results per page
 * @param {string} [options.profession] - Worker's registered profession
 * @returns {Promise<Object>}
 */
export const searchUsajobsJobs = async ({ what = '', where = '', page = 1, resultsPerPage = 20, profession = '' } = {}) => {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;

  if (!apiKey || !email) {
    return {
      success: true,
      supported: true,
      provider: 'usajobs',
      country: 'us',
      configured: false,
      jobs: [],
      total: 0,
      reason: 'USAJOBS_NOT_CONFIGURED'
    };
  }

  let searchKeywords = (typeof what === 'string' ? what.trim() : '');

  // If search query is empty, try mapping worker's profession to USAJOBS keyword
  if (!searchKeywords && profession) {
    const profKey = String(profession).toLowerCase().trim();
    searchKeywords = USAJOBS_PROFESSION_MAP[profKey] || profKey;
  }

  // If query is still shorter than 2 characters, protect quota
  if (!searchKeywords || searchKeywords.length < 2) {
    return {
      success: true,
      supported: true,
      provider: 'usajobs',
      country: 'us',
      configured: true,
      jobs: [],
      total: 0,
      reason: 'SEARCH_TERM_REQUIRED'
    };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeRpp = Math.min(50, Math.max(1, parseInt(resultsPerPage, 10) || 20));
  const safeLocation = typeof where === 'string' ? where.trim().slice(0, 100) : '';
  const safeKeywords = searchKeywords.slice(0, 100);

  // Check cache
  const cacheKey = buildUsajobsCacheKey({
    keywords: safeKeywords,
    location: safeLocation,
    page: safePage,
    resultsPerPage: safeRpp
  });

  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      cached: true
    };
  }

  const params = {
    Keyword: safeKeywords,
    Page: safePage,
    ResultsPerPage: safeRpp
  };
  if (safeLocation) {
    params.LocationName = safeLocation;
  }

  try {
    const response = await axios.get(USAJOBS_SEARCH_URL, {
      params,
      timeout: UPSTREAM_TIMEOUT_MS,
      headers: {
        'Authorization-Key': apiKey,
        'User-Agent': email,
        Host: 'data.usajobs.gov',
        Accept: 'application/json'
      }
    });

    const data = response.data;
    const rawItems = Array.isArray(data?.SearchResult?.SearchResultItems)
      ? data.SearchResult.SearchResultItems
      : [];

    const jobs = rawItems
      .map(transformUsajobsJob)
      .filter((j) => j && j.redirectUrl);

    const totalCount = typeof data?.SearchResult?.SearchResultCountAll === 'number'
      ? data.SearchResult.SearchResultCountAll
      : (typeof data?.SearchResult?.SearchResultCount === 'number' ? data.SearchResult.SearchResultCount : jobs.length);

    const resultPayload = {
      success: true,
      supported: true,
      configured: true,
      provider: 'usajobs',
      country: 'us',
      page: safePage,
      total: totalCount,
      jobs,
      cached: false
    };

    // Cache successful responses (INCLUDING ZERO RESULTS)
    setInCache(cacheKey, resultPayload);

    return resultPayload;
  } catch (err) {
    // Sanitized logging only — NEVER log authorization header or email
    const status = err.response?.status;
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    console.error(`[USAJOBS Upstream Error] Status: ${status || 'NETWORK_ERROR'}, Message: ${err.message}`);

    if (status === 429) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'usajobs',
        country: 'us',
        jobs: [],
        total: 0,
        error: 'USAJOBS_RATE_LIMITED'
      };
    }

    if (isTimeout) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'usajobs',
        country: 'us',
        jobs: [],
        total: 0,
        error: 'USAJOBS_TIMEOUT'
      };
    }

    return {
      success: true,
      supported: true,
      configured: true,
      provider: 'usajobs',
      country: 'us',
      jobs: [],
      total: 0,
      error: 'USAJOBS_UPSTREAM_ERROR'
    };
  }
};

export default {
  searchUsajobsJobs,
  transformUsajobsJob,
  buildUsajobsCacheKey,
  clearUsajobsCache,
  USAJOBS_PROFESSION_MAP
};
