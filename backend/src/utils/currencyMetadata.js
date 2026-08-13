import { supportedCountries } from './supportedCountries.js';

// Explicit legacy fallback for callers that deliberately choose fallback
// behavior. Country lookup itself returns null for unknown/malformed input.
export const LEGACY_DEFAULT_CURRENCY = 'EGP';

const COUNTRY_CODE_ALIASES = Object.freeze({
  UK: 'GB'
});

// Curated marketplace metadata only. Inclusion does not imply that every
// payment provider can process the currency; provider capability is separate.
export const COUNTRY_TO_DEFAULT_CURRENCY = Object.freeze({
  EG: 'EGP', SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD',
  OM: 'OMR', JO: 'JOD', LB: 'LBP', PS: 'ILS', IQ: 'IQD', SY: 'SYP',
  YE: 'YER', LY: 'LYD', TN: 'TND', DZ: 'DZD', MA: 'MAD', MR: 'MRU',
  SD: 'SDG', SS: 'SSP', SO: 'SOS', DJ: 'DJF', ER: 'ERN', ET: 'ETB',
  KE: 'KES', TZ: 'TZS', UG: 'UGX', RW: 'RWF', BI: 'BIF', CD: 'CDF',
  CG: 'XAF', GA: 'XAF', CM: 'XAF', NG: 'NGN', GH: 'GHS', CI: 'XOF',
  SN: 'XOF', ML: 'XOF', NE: 'XOF', TD: 'XAF', CF: 'XAF', BJ: 'XOF',
  TG: 'XOF', BF: 'XOF', GW: 'XOF', GN: 'GNF', SL: 'SLE', LR: 'LRD',
  GM: 'GMD', ZA: 'ZAR', NA: 'NAD', BW: 'BWP', ZM: 'ZMW', ZW: 'ZWG',
  MW: 'MWK', MZ: 'MZN', MG: 'MGA', MU: 'MUR', US: 'USD', CA: 'CAD',
  MX: 'MXN', GB: 'GBP', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
  PT: 'EUR', NL: 'EUR', BE: 'EUR', CH: 'CHF', AT: 'EUR', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', FI: 'EUR', IE: 'EUR', GR: 'EUR', TR: 'TRY',
  RU: 'RUB', UA: 'UAH', PL: 'PLN', IN: 'INR', PK: 'PKR', BD: 'BDT',
  LK: 'LKR', CN: 'CNY', JP: 'JPY', KR: 'KRW', ID: 'IDR', PH: 'PHP',
  VN: 'VND', TH: 'THB', MY: 'MYR', SG: 'SGD', AU: 'AUD', NZ: 'NZD',
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', VE: 'VES'
});

/**
 * Normalize a country input to an uppercase ISO-style alpha-2 code.
 * The existing repository alias UK is accepted and canonicalized to GB.
 * Returns null for missing, malformed, or non-string input.
 */
export const normalizeCountryCode = (code) => {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return COUNTRY_CODE_ALIASES[normalized] || normalized;
};

/**
 * Normalize a currency input to an uppercase ISO 4217-style alpha-3 code.
 * Normalization does not itself mean the currency is supported.
 */
export const normalizeCurrencyCode = (code) => {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

/**
 * Return the curated default currency for a supported country, or null when
 * the country is unknown. Callers must opt into LEGACY_DEFAULT_CURRENCY
 * explicitly rather than silently assigning EGP to malformed country input.
 */
export const getDefaultCurrencyForCountry = (code) => {
  const normalizedCountry = normalizeCountryCode(code);
  return normalizedCountry
    ? COUNTRY_TO_DEFAULT_CURRENCY[normalizedCountry] || null
    : null;
};

export const SUPPORTED_CURRENCIES = Object.freeze(
  [...new Set(Object.values(COUNTRY_TO_DEFAULT_CURRENCY))].sort()
);

const supportedCurrencySet = new Set(SUPPORTED_CURRENCIES);

export const isSupportedCurrency = (code) => {
  const normalizedCurrency = normalizeCurrencyCode(code);
  return normalizedCurrency !== null && supportedCurrencySet.has(normalizedCurrency);
};

// A normalized backend view derived from the existing registration metadata.
// This is metadata only and does not mutate the existing UK registration value.
export const supportedCountryCurrencyMetadata = Object.freeze(
  supportedCountries.map(({ code, name }) => Object.freeze({
    code: normalizeCountryCode(code),
    name,
    defaultCurrency: getDefaultCurrencyForCountry(code)
  }))
);

// Fail fast during development if the curated mapping drifts from the existing
// supported-country source or introduces duplicate/empty canonical metadata.
const normalizedCountryCodes = supportedCountryCurrencyMetadata.map(({ code }) => code);
if (
  normalizedCountryCodes.some((code) => !code) ||
  new Set(normalizedCountryCodes).size !== normalizedCountryCodes.length ||
  supportedCountryCurrencyMetadata.some(({ defaultCurrency }) => !defaultCurrency)
) {
  throw new Error('Invalid or incomplete supported country currency metadata');
}

