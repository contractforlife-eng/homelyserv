// backend/src/services/jobicyService.js
// ============================================================
// EXPERIMENTAL JOBICY INTEGRATION SERVICE — Remote Opportunities
// Server-side proxy for Jobicy Remote Jobs API v2.
// 4-hour in-memory cache to preserve network quota & latency.
// Never sends personal data, JWTs, or user identities upstream.
// ============================================================
import axios from 'axios';

const JOBICY_SEARCH_URL = 'https://jobicy.com/api/v2/remote-jobs';
const UPSTREAM_TIMEOUT_MS = 8000;

// 4 HOURS TTL (14,400,000 ms)
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;
const memoryCache = new Map();

/**
 * Builds deterministic cache key from normalized search inputs.
 */
export const buildJobicyCacheKey = ({ tag = '', geo = '', industry = '', count = 20 } = {}) => {
  const normTag = (tag || '').toLowerCase().trim();
  const normGeo = (geo || '').toLowerCase().trim();
  const normIndustry = (industry || '').toLowerCase().trim();
  const normCount = parseInt(count, 10) || 20;
  return `jobicy:t${normTag}:g${normGeo}:ind${normIndustry}:c${normCount}`;
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
 * Clears Jobicy in-memory cache (for testing).
 */
export const clearJobicyCache = () => {
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
 * Formats salary cleanly from Jobicy numeric fields.
 */
const formatJobicySalary = (raw) => {
  const rawMin = parseFloat(raw.annualSalaryMin);
  const rawMax = parseFloat(raw.annualSalaryMax);
  const currency = typeof raw.salaryCurrency === 'string' && raw.salaryCurrency.trim()
    ? raw.salaryCurrency.toUpperCase().trim()
    : null;

  const min = !isNaN(rawMin) && rawMin > 0 ? rawMin : null;
  const max = !isNaN(rawMax) && rawMax > 0 ? rawMax : null;

  if (!min && !max) {
    return { min: null, max: null, display: null, currency: null, symbol: null };
  }

  const symbol = currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : (currency ? `${currency} ` : '')));

  let display = null;
  if (min !== null && max !== null) {
    if (min === max) {
      display = `${symbol}${Math.round(min).toLocaleString('en-US')} / year`;
    } else {
      display = `${symbol}${Math.round(min).toLocaleString('en-US')} - ${symbol}${Math.round(max).toLocaleString('en-US')} / year`;
    }
  } else if (min !== null) {
    display = `${symbol}${Math.round(min).toLocaleString('en-US')}+ / year`;
  } else if (max !== null) {
    display = `Up to ${symbol}${Math.round(max).toLocaleString('en-US')} / year`;
  }

  return { min, max, display, currency, symbol };
};

/**
 * Normalizes raw Jobicy job item into safe HomelyServ DTO.
 */
export const transformJobicyJob = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const rawId = raw.id ? String(raw.id) : Math.random().toString(36).substring(2, 9);
  const title = typeof raw.jobTitle === 'string' ? stripHtml(raw.jobTitle) : 'Untitled Remote Position';
  const company = typeof raw.companyName === 'string' ? stripHtml(raw.companyName) : 'Remote Company';

  const rawGeo = typeof raw.jobGeo === 'string' ? stripHtml(raw.jobGeo) : 'Worldwide';
  const location = `Remote (${rawGeo})`;

  const descriptionRaw = raw.jobExcerpt || raw.jobDescription || '';
  const description = typeof descriptionRaw === 'string' ? stripHtml(descriptionRaw) : '';

  const { min: salaryMin, max: salaryMax, display: salaryDisplay, currency, symbol: currencySymbol } = formatJobicySalary(raw);

  const redirectUrl = typeof raw.url === 'string' && raw.url.startsWith('http')
    ? raw.url
    : null;

  let contractType = null;
  if (Array.isArray(raw.jobType)) {
    contractType = raw.jobType.map(stripHtml).filter(Boolean).join(', ');
  } else if (typeof raw.jobType === 'string') {
    contractType = stripHtml(raw.jobType);
  }

  let category = null;
  if (Array.isArray(raw.jobIndustry)) {
    category = raw.jobIndustry.map(stripHtml).filter(Boolean).join(', ');
  } else if (typeof raw.jobIndustry === 'string') {
    category = stripHtml(raw.jobIndustry);
  }

  const createdAt = raw.pubDate ? new Date(raw.pubDate).toISOString() : new Date().toISOString();

  return {
    id: `jobicy_${rawId}`,
    title,
    company,
    location,
    description,
    salaryDisplay,
    salaryMin,
    salaryMax,
    currency,
    currencySymbol,
    createdAt,
    redirectUrl,
    contractType,
    category,
    source: 'jobicy',
    provider: 'jobicy',
    market: 'remote',
    remote: true,
    geoRestriction: rawGeo
  };
};

/**
 * Searches remote jobs on Jobicy API with quota protection & caching.
 *
 * @param {Object} options
 * @param {string} [options.what] - Keywords / tags / job role
 * @param {string} [options.geo] - Geographic filter (e.g. worldwide, emea, usa)
 * @param {string} [options.industry] - Industry category
 * @param {number} [options.count=20] - Results count (max 50)
 * @returns {Promise<Object>}
 */
export const searchJobicyJobs = async ({ what = '', geo = '', industry = '', count = 20 } = {}) => {
  const safeTag = (typeof what === 'string' ? what.trim().slice(0, 100) : '');
  const safeGeo = (typeof geo === 'string' ? geo.trim().slice(0, 50) : '');
  const safeIndustry = (typeof industry === 'string' ? industry.trim().slice(0, 50) : '');
  const safeCount = Math.min(50, Math.max(1, parseInt(count, 10) || 20));

  // If search query is empty, enforce search term requirement for Phase 1
  if (!safeTag && !safeIndustry) {
    return {
      success: true,
      supported: true,
      provider: 'jobicy',
      market: 'remote',
      remote: true,
      configured: true,
      jobs: [],
      total: 0,
      reason: 'SEARCH_TERM_REQUIRED'
    };
  }

  const cacheKey = buildJobicyCacheKey({
    tag: safeTag,
    geo: safeGeo,
    industry: safeIndustry,
    count: safeCount
  });

  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      cached: true
    };
  }

  const params = {
    count: safeCount
  };
  if (safeTag) params.tag = safeTag;
  if (safeGeo) params.geo = safeGeo;
  if (safeIndustry) params.industry = safeIndustry;

  try {
    const response = await axios.get(JOBICY_SEARCH_URL, {
      params,
      timeout: UPSTREAM_TIMEOUT_MS,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HomelyServ-RemoteJobAggregator/1.0'
      }
    });

    const data = response.data;
    const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];
    const jobs = rawJobs
      .map(transformJobicyJob)
      .filter((j) => j && j.redirectUrl);

    const totalCount = typeof data?.totalJobs === 'number'
      ? data.totalJobs
      : (typeof data?.jobCount === 'number' ? data.jobCount : jobs.length);

    const resultPayload = {
      success: true,
      supported: true,
      configured: true,
      provider: 'jobicy',
      market: 'remote',
      remote: true,
      page: 1,
      total: totalCount,
      jobs,
      cached: false
    };

    // Cache successful responses (INCLUDING ZERO RESULTS)
    setInCache(cacheKey, resultPayload);

    return resultPayload;
  } catch (err) {
    const status = err.response?.status;
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    console.error(`[Jobicy Upstream Error] Status: ${status || 'NETWORK_ERROR'}, Message: ${err.message}`);

    if (status === 429) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'jobicy',
        market: 'remote',
        remote: true,
        jobs: [],
        total: 0,
        error: 'JOBICY_RATE_LIMITED'
      };
    }

    if (isTimeout) {
      return {
        success: true,
        supported: true,
        configured: true,
        provider: 'jobicy',
        market: 'remote',
        remote: true,
        jobs: [],
        total: 0,
        error: 'JOBICY_TIMEOUT'
      };
    }

    return {
      success: true,
      supported: true,
      configured: true,
      provider: 'jobicy',
      market: 'remote',
      remote: true,
      jobs: [],
      total: 0,
      error: 'JOBICY_UPSTREAM_ERROR'
    };
  }
};

export default {
  searchJobicyJobs,
  transformJobicyJob,
  buildJobicyCacheKey,
  clearJobicyCache
};
