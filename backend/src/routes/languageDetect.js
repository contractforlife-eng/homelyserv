// backend/src/routes/languageDetect.js
// ============================================================
// PUBLIC country → language detection for the website i18n bootstrap.
//
// Privacy contract (by design):
//   - Client IP is resolved with the EXISTING trusted helper
//     resolveRegistrationIp() — no second IP-resolution implementation.
//   - Country comes from the EXISTING installed geoip-lite dependency
//     (offline database, no external GeoIP API, no network calls).
//   - The IP and country are NEVER stored. Nothing is persisted.
//   - The response contains only: success, country, language.
//     The visitor's IP never reaches frontend JavaScript.
//
// Normal misses (no IP, private/local IP, GeoIP miss, lookup error)
// return { success: true, country: null, language: null } — never a 500.
// ============================================================
import express from 'express';
import geoip from 'geoip-lite';
import {
  resolveRegistrationIp,
  isPrivateOrLocalIp,
} from '../services/registrationGeographyService.js';

// ------------------------------------------------------------
// Country → language mapping (approved list).
// Multilingual countries (CH, BE, CA, LU) are intentionally NOT
// listed here — they are resolved by MULTILINGUAL_COUNTRIES below.
// Any country not mapped defaults to English.
// ------------------------------------------------------------
export const COUNTRY_LANGUAGE = Object.freeze({
  // Arabic → ar
  EG: 'ar', SA: 'ar', AE: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar',
  JO: 'ar', LB: 'ar', SY: 'ar', IQ: 'ar', PS: 'ar', YE: 'ar', MA: 'ar',
  DZ: 'ar', TN: 'ar', LY: 'ar', SD: 'ar', MR: 'ar', SO: 'ar',

  // Russian → ru (UA and MD are deliberately NOT mapped to Russian)
  RU: 'ru', BY: 'ru', KZ: 'ru', AM: 'ru', KG: 'ru', TJ: 'ru',

  // French → fr (unambiguous Francophone countries & territories only;
  // countries with competing official supported languages stay English)
  FR: 'fr', MC: 'fr',
  CI: 'fr', SN: 'fr', ML: 'fr', BF: 'fr', TG: 'fr', BJ: 'fr', NE: 'fr',
  CD: 'fr', CG: 'fr', GA: 'fr', GQ: 'fr', HT: 'fr',
  RE: 'fr', YT: 'fr', GP: 'fr', MQ: 'fr', GF: 'fr', PF: 'fr', NC: 'fr',
  WF: 'fr', PM: 'fr', TF: 'fr', BL: 'fr', MF: 'fr',

  // German → de (CH uses the multilingual rule below)
  DE: 'de', AT: 'de', LI: 'de',

  // Turkish → tr
  TR: 'tr',
});

// ------------------------------------------------------------
// Multilingual countries: candidates = official languages ∩ our six
// locales. The browser language breaks the tie INSIDE the candidate
// list; otherwise the country default applies. The browser never
// overrides the country with a language the country does not use.
//
//   Switzerland : de, fr (it unsupported) → default de
//                 de browser → de | fr browser → fr | en/it browser → de
//   Belgium     : fr, de (nl is NOT supported → English, never another
//                 supported language) → fr browser → fr | de browser → de
//                 | nl or any other browser → en
//   Canada      : fr, en → fr browser → fr | en browser → en | else → fr
//   Luxembourg  : fr, de → fr browser → fr | de browser → de | else → fr
// ------------------------------------------------------------
export const MULTILINGUAL_COUNTRIES = Object.freeze({
  CH: Object.freeze({ candidates: Object.freeze(['de', 'fr']), defaultLanguage: 'de' }),
  BE: Object.freeze({ candidates: Object.freeze(['fr', 'de']), defaultLanguage: 'en' }),
  CA: Object.freeze({ candidates: Object.freeze(['fr', 'en']), defaultLanguage: 'fr' }),
  LU: Object.freeze({ candidates: Object.freeze(['fr', 'de']), defaultLanguage: 'fr' }),
});

// "fr-FR" / "FR" / "fr_CA" → "fr"; anything unusable → null.
export const normalizeBrowserLanguage = (value) => {
  if (typeof value !== 'string') return null;
  const tag = value.trim().toLowerCase();
  if (!tag) return null;
  const base = tag.split('-')[0].split('_')[0];
  return /^[a-z]{2,3}$/.test(base) ? base : null;
};

// country → language. Returns null only when no country was resolved.
// Unknown/unmapped countries resolve to English.
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

// First tag of an Accept-Language header ("fr-FR,fr;q=0.9" → "fr-FR").
const firstAcceptLanguage = (header) => {
  if (typeof header !== 'string' || !header) return null;
  const first = header.split(',')[0] || '';
  const tag = first.split(';')[0].trim();
  return tag || null;
};

// ------------------------------------------------------------
// Router factory (lookup/IP resolution injected for tests, mirrors
// createRegistrationGeographyRouter).
// ------------------------------------------------------------
export const createLanguageDetectRouter = ({
  lookup = (ip) => geoip.lookup(ip),
  resolveIp = resolveRegistrationIp,
  isPrivateOrLocal = isPrivateOrLocalIp,
} = {}) => {
  const router = express.Router();

  router.get('/language-detect', (req, res) => {
    try {
      const browserLanguage =
        (typeof req.query.browser === 'string' && req.query.browser.slice(0, 64)) ||
        firstAcceptLanguage(req.get('accept-language')) ||
        null;

      const ip = resolveIp(req);
      if (!ip || isPrivateOrLocal(ip)) {
        return res.json({ success: true, country: null, language: null });
      }

      const result = lookup(ip);
      const country =
        typeof result?.country === 'string' ? result.country.trim().toUpperCase() : null;
      if (!country || !/^[A-Z]{2}$/.test(country)) {
        return res.json({ success: true, country: null, language: null });
      }

      return res.json({
        success: true,
        country,
        language: resolveLanguageForCountry(country, browserLanguage),
      });
    } catch {
      // A GeoIP failure is a normal condition for this endpoint — the
      // frontend simply keeps its browser-language fallback.
      return res.json({ success: true, country: null, language: null });
    }
  });

  return router;
};

export default createLanguageDetectRouter();


