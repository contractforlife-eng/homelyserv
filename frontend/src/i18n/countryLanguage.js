// frontend/src/i18n/countryLanguage.js
// ============================================================
// Country-based automatic language selection.
//
// Priority (approved architecture):
//   MANUAL language  >  COUNTRY language  >  BROWSER language  >  English
//
// Privacy: the frontend only asks our own backend
// GET /api/language-detect for a 2-letter country code.
//   - No GPS / navigator.geolocation permission is ever requested.
//   - The visitor's IP never reaches JavaScript (computed server-side).
//   - No external GeoIP API, no new dependency, no analytics.
//   - localStorage stores ONLY the country code + timestamp.
//
// This module intentionally does NOT import ./index.js (it uses the shared
// `i18next` singleton — the same instance ./index.js initializes), so it can
// be unit-tested in plain Node without a DOM.
// ============================================================
import axios from 'axios';
import i18n from 'i18next';
import { API_BASE } from '../config/api.js';

// Mirrors i18n/index.js LANGUAGE_STORAGE_KEY — the single language value
// key read by every authenticated layout and selector.
const LANGUAGE_STORAGE_KEY = 'homelyserv_language';

// "manual" = explicitly chosen via a user-facing selector.
// "auto"   = written by this automatic pipeline (or absent = legacy auto).
export const LANGUAGE_SOURCE_KEY = 'homelyserv_language_src';

// Cache: { country: "EG", at: <timestamp> } — country only, never an IP.
export const COUNTRY_CACHE_KEY = 'homelyserv_country';
const COUNTRY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4000;

// ------------------------------------------------------------
// Country → language mapping (kept in parity with
// backend/src/routes/languageDetect.js — approved list).
// Multilingual countries (CH, BE, CA, LU) are handled by rules below.
// ------------------------------------------------------------
export const COUNTRY_LANGUAGE = Object.freeze({
  EG: 'ar', SA: 'ar', AE: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar',
  JO: 'ar', LB: 'ar', SY: 'ar', IQ: 'ar', PS: 'ar', YE: 'ar', MA: 'ar',
  DZ: 'ar', TN: 'ar', LY: 'ar', SD: 'ar', MR: 'ar', SO: 'ar',

  RU: 'ru', BY: 'ru', KZ: 'ru', AM: 'ru', KG: 'ru', TJ: 'ru',

  FR: 'fr', MC: 'fr',
  CI: 'fr', SN: 'fr', ML: 'fr', BF: 'fr', TG: 'fr', BJ: 'fr', NE: 'fr',
  CD: 'fr', CG: 'fr', GA: 'fr', GQ: 'fr', HT: 'fr',
  RE: 'fr', YT: 'fr', GP: 'fr', MQ: 'fr', GF: 'fr', PF: 'fr', NC: 'fr',
  WF: 'fr', PM: 'fr', TF: 'fr', BL: 'fr', MF: 'fr',

  DE: 'de', AT: 'de', LI: 'de',

  TR: 'tr',
});

// candidates = official languages ∩ the six supported locales;
// browser language breaks the tie only inside the candidate list.
// Belgium: Dutch (nl) is NOT supported — an unsupported browser language
// must fall back to English, never to another unrelated supported language.
//   fr / fr-* → fr | de / de-* → de | nl / nl-* → en | any other → en
export const MULTILINGUAL_COUNTRIES = Object.freeze({
  CH: Object.freeze({ candidates: Object.freeze(['de', 'fr']), defaultLanguage: 'de' }),
  BE: Object.freeze({ candidates: Object.freeze(['fr', 'de']), defaultLanguage: 'en' }),
  CA: Object.freeze({ candidates: Object.freeze(['fr', 'en']), defaultLanguage: 'fr' }),
  LU: Object.freeze({ candidates: Object.freeze(['fr', 'de']), defaultLanguage: 'fr' }),
});

// 'en' plus every map value = exactly the six supported locales.
const SUPPORTED_LANGUAGE_CODES = new Set(['en', ...Object.values(COUNTRY_LANGUAGE)]);
// "fr-FR" / "FR" / "fr_CA" → "fr"; anything unusable → null.
export const normalizeBrowserLanguage = (value) => {
  if (typeof value !== 'string') return null;
  const tag = value.trim().toLowerCase();
  if (!tag) return null;
  const base = tag.split('-')[0].split('_')[0];
  return /^[a-z]{2,3}$/.test(base) ? base : null;
};

// country → language (same contract as the backend). null only when no
// country was resolved; unknown/unmapped countries resolve to English.
export const resolveLanguageForCountry = (country, browserLanguage) => {
  if (!country || typeof country !== 'string') return null;
  const code = country.trim().toUpperCase();
  const rule = MULTILINGUAL_COUNTRIES[code];
  if (rule) {
    const browser = normalizeBrowserLanguage(browserLanguage);
    if (browser && rule.candidates.includes(browser)) return browser;
    return rule.defaultLanguage;
  }
  return COUNTRY_LANGUAGE[code] || 'en';
};

const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

// deps.storage: undefined → real localStorage; null → storage unavailable.
const resolveStorage = (deps) =>
  deps.storage !== undefined ? deps.storage : defaultStorage();

const browserLanguage = (deps) =>
  deps.browserLanguage ?? (typeof navigator !== 'undefined' ? navigator.language || '' : '');

// ------------------------------------------------------------
// Country cache: { country, at } with a 7-day TTL. Never an IP.
// ------------------------------------------------------------
export const readCountryCache = (storage, now = Date.now) => {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(COUNTRY_CACHE_KEY));
    if (typeof parsed?.country !== 'string' || typeof parsed?.at !== 'number') return null;
    if (now() - parsed.at > COUNTRY_CACHE_TTL_MS) return null; // expired → refetch
    return parsed;
  } catch {
    return null;
  }
};

export const writeCountryCache = (country, storage, now = Date.now) => {
  if (!storage || typeof country !== 'string') return;
  try {
    storage.setItem(COUNTRY_CACHE_KEY, JSON.stringify({ country, at: now() }));
  } catch {
    // Storage unavailable — detection simply re-runs next visit.
  }
};

// ------------------------------------------------------------
// Apply an AUTOMATIC language result.
//   - Never overwrites a manual choice (race guard: re-checked at the
//     exact moment the async country response is applied).
//   - Writes src = "auto"; automatic results are never marked manual.
// ------------------------------------------------------------
export const applyAutomaticLanguage = (language, deps = {}) => {
  if (!language || !SUPPORTED_LANGUAGE_CODES.has(language)) return false;
  const storage = resolveStorage(deps);
  const instance = deps.i18n || i18n;
  // RACE GUARD — a manual selection made while the country request was
  // in flight always wins.
  if (storage && storage.getItem(LANGUAGE_SOURCE_KEY) === 'manual') return false;
  if (storage) {
    try {
      storage.setItem(LANGUAGE_STORAGE_KEY, language);
      storage.setItem(LANGUAGE_SOURCE_KEY, 'auto');
    } catch {
      // Storage unavailable — still switch the in-memory language.
    }
  }
  instance.changeLanguage(language);
  return true;
};

// Handle GET /api/language-detect data. Keeps the browser-language
// fallback on any failure (missing/unsuccessful response, null language).
export const handleCountryResponse = (data, deps = {}) => {
  if (!data || data.success !== true) return false;
  const storage = resolveStorage(deps);
  if (storage && typeof data.country === 'string' && data.country) {
    writeCountryCache(data.country, storage, deps.now);
  }
  return applyAutomaticLanguage(data.language, deps);
};

const detectCountry = async (deps = {}) => {
  try {
    const language = browserLanguage(deps);
    const response = await axios.get(`${API_BASE}/api/language-detect`, {
      params: language ? { browser: language } : undefined,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return handleCountryResponse(response?.data, deps);
  } catch {
    // Backend unavailable / timeout / offline → keep browser language.
    return false;
  }
};

// ------------------------------------------------------------
// Startup entry point — called once from main.jsx AFTER the synchronous
// i18n initialization. Non-blocking: the cached country (if fresh) is
// applied immediately, then the backend is refreshed in the background.
// Never throws, never shows an error, never blocks React rendering.
// ------------------------------------------------------------
export const startCountryLanguageDetection = (deps = {}) => {
  try {
    const storage = resolveStorage(deps);
    const cached = readCountryCache(storage, deps.now);
    if (cached) {
      // Manual language still wins inside applyAutomaticLanguage.
      applyAutomaticLanguage(
        resolveLanguageForCountry(cached.country, browserLanguage(deps)),
        deps
      );
    }
    const detect = deps.detectCountry || detectCountry;
    detect(deps); // fire-and-forget refresh (updates the cache TTL)
  } catch {
    // Startup must never fail because of language detection.
  }
};


