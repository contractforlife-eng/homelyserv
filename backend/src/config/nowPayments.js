import { normalizeCountryCode } from '../utils/currencyMetadata.js';

export const NOWPAYMENTS_PROVIDER = 'nowpayments';
export const NOWPAYMENTS_DEFAULT_API_BASE_URL = 'https://api.nowpayments.io/v1';

const truthy = new Set(['1', 'true', 'yes', 'on']);

const parseCountryList = (value) => String(value || '')
  .split(',')
  .map((country) => normalizeCountryCode(country))
  .filter(Boolean);

export const getNowPaymentsConfig = (env = process.env) => ({
  enabled: truthy.has(String(env.NOWPAYMENTS_ENABLED || '').trim().toLowerCase()),
  apiKey: typeof env.NOWPAYMENTS_API_KEY === 'string' ? env.NOWPAYMENTS_API_KEY.trim() : '',
  ipnSecret: typeof env.NOWPAYMENTS_IPN_SECRET === 'string' ? env.NOWPAYMENTS_IPN_SECRET.trim() : '',
  apiBaseUrl: typeof env.NOWPAYMENTS_API_BASE_URL === 'string' && env.NOWPAYMENTS_API_BASE_URL.trim()
    ? env.NOWPAYMENTS_API_BASE_URL.trim()
    : NOWPAYMENTS_DEFAULT_API_BASE_URL,
  allowedCountries: parseCountryList(env.NOWPAYMENTS_ALLOWED_COUNTRIES),
  deniedCountries: new Set(['EG', ...parseCountryList(env.NOWPAYMENTS_DENIED_COUNTRIES)]),
});

export const isNowPaymentsCountryAllowed = (countryCode, config = getNowPaymentsConfig()) => {
  const country = normalizeCountryCode(countryCode);
  if (!country || config.deniedCountries.has(country)) return false;
  return config.allowedCountries.includes(country);
};

export const isNowPaymentsConfigured = (config = getNowPaymentsConfig()) => (
  config.enabled
  && Boolean(config.apiKey)
  && Boolean(config.ipnSecret)
  && Boolean(config.apiBaseUrl)
  && config.allowedCountries.length > 0
);

export default {
  NOWPAYMENTS_PROVIDER,
  NOWPAYMENTS_DEFAULT_API_BASE_URL,
  getNowPaymentsConfig,
  isNowPaymentsCountryAllowed,
  isNowPaymentsConfigured,
};
