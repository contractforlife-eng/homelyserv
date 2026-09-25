// src/utils/healthcareLocalization.js
// Centralized healthcare localization helper for HomelyServ Healthcare Directory.
import {
  HEALTHCARE_TAXONOMY_TRANSLATIONS,
  PROVIDER_NAME_TRANSLATIONS
} from '../i18n/healthcareTaxonomyTranslations.js';
import {
  healthcareProviderTranslationService
} from '../services/healthcareProviderTranslationService.js';

/**
 * Mapping from canonical / raw provider type values to translation keys in healthcareTranslations.js
 */
export const PROVIDER_TYPE_KEY_MAP = {
  doctor: 'doctor',
  Doctor: 'doctor',
  physician: 'doctor',
  Physician: 'doctor',
  gp: 'doctor',
  GP: 'doctor',

  hospital: 'hospital',
  Hospital: 'hospital',

  clinic: 'clinic',
  Clinic: 'clinic',
  polyclinic: 'clinic',
  Polyclinic: 'clinic',

  pharmacy: 'pharmacy',
  Pharmacy: 'pharmacy',

  laboratory: 'laboratory',
  Laboratory: 'laboratory',
  lab: 'laboratory',
  Lab: 'laboratory',

  diagnostic_center: 'diagnosticCenter',
  'Diagnostic Center': 'diagnosticCenter',
  diagnostic: 'diagnosticCenter',
  Diagnostic: 'diagnosticCenter',
  scan: 'diagnosticCenter',
  Scan: 'diagnosticCenter',

  care_home: 'careHome',
  'Care Home': 'careHome',

  optical: 'optical',
  Optical: 'optical',

  specialized_center: 'specializedCenter',
  'Specialized Center': 'specializedCenter',

  other: 'other',
  Other: 'other'
};

/**
 * Mapping from canonical finite services in the dataset to service translation keys
 */
export const SERVICE_KEY_MAP = {
  ER: 'er',
  er: 'er',
  Emergency: 'er',
  'Emergency Room': 'er',

  Inpatient: 'inpatient',
  inpatient: 'inpatient',

  'Outpatient services': 'outpatient',
  'Outpatient Services': 'outpatient',
  Outpatient: 'outpatient',
  outpatient: 'outpatient',

  'Outpatient services and Emergency': 'outpatientAndEmergency',
  'Outpatient Services and Emergency': 'outpatientAndEmergency',

  isolation: 'isolation',
  Isolation: 'isolation',

  Multidisciplinary: 'multidisciplinary',
  multidisciplinary: 'multidisciplinary',

  Optics: 'optics',
  optics: 'optics'
};

/**
 * Normalize language code to standard 2-letter format ('en', 'ar', 'fr', 'ru', 'tr', 'de')
 */
const getNormalizedLang = (lang) => {
  if (!lang || typeof lang !== 'string') return 'en';
  const prefix = lang.slice(0, 2).toLowerCase();
  if (['en', 'ar', 'fr', 'ru', 'tr', 'de'].includes(prefix)) {
    return prefix;
  }
  return 'en';
};

/**
 * Safely localize a provider type.
 * Returns localized string if found, otherwise returns original value.
 * Never returns blank text.
 *
 * @param {string} rawType
 * @param {Function} t - i18next translation function
 * @returns {string}
 */
export const getLocalizedProviderType = (rawType, t) => {
  if (!rawType || typeof rawType !== 'string') return '';
  const trimmed = rawType.trim();
  const normalizedKey = PROVIDER_TYPE_KEY_MAP[trimmed] || PROVIDER_TYPE_KEY_MAP[trimmed.toLowerCase()];
  
  if (normalizedKey && typeof t === 'function') {
    const translationKey = `healthcarePage.types.${normalizedKey}`;
    const translated = t(translationKey);
    if (translated && translated !== translationKey) {
      return translated;
    }
  }
  return trimmed;
};

/**
 * Safely localize a medical specialty.
 * Checks the comprehensive taxonomy dictionary for en, ar, fr, ru, tr, de.
 * If found, returns the localized version.
 * If not found, safely returns the original value. Never returns blank.
 *
 * @param {string} rawSpecialty
 * @param {string|Function} langOrT - Language code ('ar', 'fr', etc.) or i18n object with language property
 * @returns {string}
 */
export const getLocalizedSpecialty = (rawSpecialty, langOrT) => {
  if (!rawSpecialty || typeof rawSpecialty !== 'string') return '';
  const trimmed = rawSpecialty.trim();

  let lang = 'en';
  if (typeof langOrT === 'string') {
    lang = getNormalizedLang(langOrT);
  } else if (langOrT && typeof langOrT === 'object' && langOrT.language) {
    lang = getNormalizedLang(langOrT.language);
  }

  const specEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.specialties[trimmed];
  if (specEntry && specEntry[lang]) {
    return specEntry[lang];
  }

  // Case-insensitive lookup fallback
  const lower = trimmed.toLowerCase();
  const foundKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.specialties).find(
    k => k.toLowerCase() === lower
  );
  if (foundKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.specialties[foundKey]?.[lang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.specialties[foundKey][lang];
  }

  return trimmed;
};

/**
 * Safely localize a service item.
 * If recognized in canonical service list or taxonomy, returns localized string.
 * Otherwise returns the original service string. Never returns blank.
 *
 * @param {string} rawService
 * @param {string|Function} langOrT - Language code or i18next translation function
 * @returns {string}
 */
export const getLocalizedService = (rawService, langOrT) => {
  if (!rawService || typeof rawService !== 'string') return '';
  const trimmed = rawService.trim();

  // Try direct taxonomy lookup first
  let lang = 'en';
  if (typeof langOrT === 'string') {
    lang = getNormalizedLang(langOrT);
  } else if (typeof langOrT === 'function') {
    // If t function, try t first
    const key = SERVICE_KEY_MAP[trimmed];
    if (key) {
      const translationKey = `healthcarePage.serviceNames.${key}`;
      const translated = langOrT(translationKey);
      if (translated && translated !== translationKey) {
        return translated;
      }
    }
  }

  const sEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.services[trimmed];
  if (sEntry && sEntry[lang]) {
    return sEntry[lang];
  }

  const lower = trimmed.toLowerCase();
  const foundKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.services).find(
    k => k.toLowerCase() === lower
  );
  if (foundKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.services[foundKey]?.[lang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.services[foundKey][lang];
  }

  return trimmed;
};

/**
 * Safely localize a country name.
 * Maps standardized country names present in dataset to localized string.
 * Falls back to original canonical string. Never returns blank.
 *
 * @param {string} rawCountry
 * @param {string} lang - Language code
 * @returns {string}
 */
export const getLocalizedCountry = (rawCountry, lang = 'en') => {
  if (!rawCountry || typeof rawCountry !== 'string') return '';
  const trimmed = rawCountry.trim();
  const normalizedLang = getNormalizedLang(lang);

  const countryEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.countries[trimmed];
  if (countryEntry && countryEntry[normalizedLang]) {
    return countryEntry[normalizedLang];
  }

  const lower = trimmed.toLowerCase();
  const foundKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.countries).find(
    k => k.toLowerCase() === lower
  );
  if (foundKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.countries[foundKey]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.countries[foundKey][normalizedLang];
  }

  return trimmed;
};

/**
 * Canonical variant lookup mapping for common spelling, prefix, and casing variations in regional data.
 */
const GEOGRAPHIC_VARIANT_MAP = {
  // Sharkia / Sharqia variations
  'sharkia': 'Sharqia',
  'sharqia': 'Sharqia',
  'sharqiya': 'Sharqia',
  'al sharqia': 'Sharqia',
  'al sharqiya': 'Sharqia',
  'el sharqia': 'Sharqia',

  // Embaba / Imbaba
  'embaba': 'Imbaba',
  'imbaba': 'Imbaba',

  // Gerga / Tama
  'gerga': 'Gerga',
  'girga': 'Gerga',
  'tama': 'Tama',
  'tima': 'Tama',

  // Kafr El Sheikh variations
  'kafr el sheikh': 'Kafr El Sheikh',
  'kafr al sheikh': 'Kafr El Sheikh',
  'kafr el-sheikh': 'Kafr El Sheikh',

  // Malawi / Mallawi
  'malawi': 'Mallawi',
  'mallawi': 'Mallawi',

  // Rasheed / Rashid
  'rasheed': 'Rashid',
  'rashid': 'Rashid',
  'rosetta': 'Rashid',

  // Fayoum / Faiyum
  'fayoum': 'Fayoum',
  'faiyum': 'Fayoum',

  // Beni Suef / Bani Suef
  'bani suef': 'Bani Suef',
  'beni suef': 'Bani Suef',

  // Minya / Menia
  'minya': 'Minya',
  'menia': 'Minya',

  // Fakous / Faqous
  'fakous': 'Faqous',
  'faqous': 'Faqous',

  // Kafr Sakr / Kafr Saqr
  'kafr sakr': 'Kafr Saqr',
  'kafr saqr': 'Kafr Saqr',

  // Koum Ombo / Kom Ombo
  'koum ombo': 'Koum Ombo',
  'kom ombo': 'Koum Ombo',

  // Koum Hamada / Kom Hamada
  'koum hamada': 'Koum Hamada',
  'kom hamada': 'Koum Hamada',

  // Edfu / Eddfo
  'edfu': 'Edfu',
  'eddfo': 'Edfu',

  // Zahraa Al Maadi / Zahraa El Maadi
  'zahraa al maadi': 'Zahraa El Maadi',
  'zahraa el maadi': 'Zahraa El Maadi',

  // South Sinai variations
  'south sinai': 'South Sinai',
  'north sinai': 'North Sinai'
};

/**
 * Normalizes a raw string to compare against variant map
 */
const normalizeGeoKey = (str) => {
  if (!str) return '';
  return str.trim().toLowerCase();
};

/**
 * Safely localize a standardized region / governorate / emirate / state.
 * If in controlled standardized taxonomy, returns localized string.
 * Otherwise checks city dictionary (cross-field fallback), then falls back to original. Never returns blank.
 *
 * @param {string} rawRegion
 * @param {string} lang - Language code
 * @returns {string}
 */
export const getLocalizedRegion = (rawRegion, lang = 'en') => {
  if (!rawRegion || typeof rawRegion !== 'string') return '';
  const trimmed = rawRegion.trim();
  const normalizedLang = getNormalizedLang(lang);

  // 1. Direct match in regions
  const regEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[trimmed];
  if (regEntry && regEntry[normalizedLang]) {
    return regEntry[normalizedLang];
  }

  // 2. Case-insensitive match in regions
  const lower = normalizeGeoKey(trimmed);
  const foundKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.regions).find(
    k => k.toLowerCase() === lower
  );
  if (foundKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[foundKey]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[foundKey][normalizedLang];
  }

  // 3. Variant map match in regions
  const variantTarget = GEOGRAPHIC_VARIANT_MAP[lower];
  if (variantTarget && HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[variantTarget]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[variantTarget][normalizedLang];
  }

  // 4. Cross-field fallback to cities (e.g. Tanta recorded as region)
  const cityEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[trimmed];
  if (cityEntry && cityEntry[normalizedLang]) {
    return cityEntry[normalizedLang];
  }
  const foundCityKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.cities).find(
    k => k.toLowerCase() === lower
  );
  if (foundCityKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[foundCityKey]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[foundCityKey][normalizedLang];
  }
  if (variantTarget && HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[variantTarget]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[variantTarget][normalizedLang];
  }

  return trimmed;
};

/**
 * Safely localize a standardized city.
 * If in controlled standardized municipal taxonomy, returns localized string.
 * Otherwise checks region dictionary (cross-field fallback), then falls back to original. Never returns blank.
 *
 * @param {string} rawCity
 * @param {string} lang - Language code
 * @returns {string}
 */
export const getLocalizedCity = (rawCity, lang = 'en') => {
  if (!rawCity || typeof rawCity !== 'string') return '';
  const trimmed = rawCity.trim();
  const normalizedLang = getNormalizedLang(lang);

  // 1. Direct match in cities
  const cityEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[trimmed];
  if (cityEntry && cityEntry[normalizedLang]) {
    return cityEntry[normalizedLang];
  }

  // 2. Case-insensitive match in cities
  const lower = normalizeGeoKey(trimmed);
  const foundKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.cities).find(
    k => k.toLowerCase() === lower
  );
  if (foundKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[foundKey]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[foundKey][normalizedLang];
  }

  // 3. Variant map match in cities
  const variantTarget = GEOGRAPHIC_VARIANT_MAP[lower];
  if (variantTarget && HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[variantTarget]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.cities[variantTarget][normalizedLang];
  }

  // 4. Cross-field fallback to regions (e.g. Giza or Damietta entered as city/region)
  const regEntry = HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[trimmed];
  if (regEntry && regEntry[normalizedLang]) {
    return regEntry[normalizedLang];
  }
  const foundRegKey = Object.keys(HEALTHCARE_TAXONOMY_TRANSLATIONS.regions).find(
    k => k.toLowerCase() === lower
  );
  if (foundRegKey && HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[foundRegKey]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[foundRegKey][normalizedLang];
  }
  if (variantTarget && HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[variantTarget]?.[normalizedLang]) {
    return HEALTHCARE_TAXONOMY_TRANSLATIONS.regions[variantTarget][normalizedLang];
  }

  return trimmed;
};

/**
 * Safely localize a healthcare provider's commercial / institution name.
 * Uses scalable translation cache service:
 * 1. Checks explicit DB Arabic name precedence.
 * 2. Checks verified taxonomy translations.
 * 3. Checks persistent dynamic translation cache.
 * 4. Falls back safely and instantly to original provider name. Never blocks UI.
 *
 * @param {string} rawProviderName - Canonical provider name
 * @param {string} lang - Language code
 * @param {string} [explicitArabicName] - Optional providerNameArabic from database record
 * @param {Function} [onUpdate] - Optional callback for background translation updates
 * @returns {string} Localized or original provider name
 */
export const getLocalizedProviderName = (rawProviderName, lang = 'en', explicitArabicName = '', onUpdate = null) => {
  return healthcareProviderTranslationService.resolveProviderName(
    rawProviderName,
    lang,
    explicitArabicName,
    onUpdate
  );
};

