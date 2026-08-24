import {
  formatMoneyDecimal,
  multiplyMoneyByDecimal,
  toMinorUnits,
} from '../utils/money.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { fetchFrankfurterQuote, validateFrankfurterQuote } from './frankfurterFxService.js';

export const PAYPAL_PROVIDER_CURRENCY = 'USD';
export const PAYPAL_FX_CACHE_TTL_MS = 15 * 60 * 1000;

// PayPal Orders API currency codes. The resolver intersects this set with
// HomelyServ's canonical currency metadata before accepting a transaction.
export const PAYPAL_NATIVE_CURRENCIES = Object.freeze([
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS',
  'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'RUB',
  'SGD', 'SEK', 'CHF', 'THB', 'USD',
]);

export const PAYPAL_FX_ERROR_CODES = Object.freeze({
  INVALID_AMOUNT: 'INVALID_PAYPAL_FX_AMOUNT',
  UNSUPPORTED_CURRENCY: 'UNSUPPORTED_PAYPAL_CURRENCY',
  PROVIDER_UNAVAILABLE: 'PAYPAL_FX_PROVIDER_UNAVAILABLE',
  INVALID_SETTLEMENT: 'INVALID_PAYPAL_FX_SETTLEMENT',
});

export class PayPalFxError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PayPalFxError';
    this.code = code;
  }
}

const nativeSet = new Set(PAYPAL_NATIVE_CURRENCIES);
const quoteCache = new Map();
const isDecimal = (value) => typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim());

const normalizeCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  if (!currency || !isSupportedCurrency(currency)) {
    throw new PayPalFxError(PAYPAL_FX_ERROR_CODES.UNSUPPORTED_CURRENCY, 'Unsupported PayPal currency');
  }
  return currency;
};

const normalizeAmount = (amount, currency) => {
  const text = String(amount ?? '').trim();
  if (!isDecimal(text) || toMinorUnits(text, currency) <= 0) {
    throw new PayPalFxError(PAYPAL_FX_ERROR_CODES.INVALID_AMOUNT, 'Invalid PayPal payment amount');
  }
  return formatMoneyDecimal(text, currency);
};

const identityEvidence = (amount, currency, now) => Object.freeze({
  sourceCurrency: currency,
  sourceAmount: amount,
  settlementCurrency: currency,
  settlementAmount: amount,
  exchangeRate: '1',
  rateDirection: 'SOURCE_TO_PROVIDER',
  exchangeRateSource: 'identity',
  exchangeRateVersion: 'identity',
  exchangeRateTimestamp: new Date(now).toISOString(),
  exchangeRateFetchedAt: new Date(now).toISOString(),
  exchangeRateProvider: 'identity',
});

export const isPayPalNativeCurrency = (currency) => {
  const normalized = normalizeCurrencyCode(currency);
  return Boolean(normalized && isSupportedCurrency(normalized) && nativeSet.has(normalized));
};

export const clearPayPalFxCache = () => quoteCache.clear();

const getValidatedQuote = async ({ currency, now, quoteProvider = fetchFrankfurterQuote }) => {
  const cached = quoteCache.get(currency);
  if (cached && now - cached.cachedAt <= PAYPAL_FX_CACHE_TTL_MS) return cached.quote;

  try {
    const fetched = await quoteProvider(currency, { now });
    const quote = validateFrankfurterQuote({
      quote: fetched,
      sourceCurrency: currency,
      now,
      maxWorkingDays: 3,
    });
    quoteCache.set(currency, { cachedAt: now, quote });
    return quote;
  } catch (error) {
    if (error instanceof PayPalFxError) throw error;
    throw new PayPalFxError(
      error?.code || PAYPAL_FX_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'PayPal currency conversion is temporarily unavailable',
    );
  }
};

export const resolvePayPalProviderEvidence = async ({
  sourceAmount,
  sourceCurrency,
  now = Date.now(),
  quoteProvider = fetchFrankfurterQuote,
} = {}) => {
  const currency = normalizeCurrency(sourceCurrency);
  const amount = normalizeAmount(sourceAmount, currency);

  if (isPayPalNativeCurrency(currency)) {
    return Object.freeze({
      providerAmount: amount,
      providerCurrency: currency,
      mode: 'DIRECT',
      fxEvidence: null,
    });
  }

  let quote;
  try {
    quote = await getValidatedQuote({ currency, now, quoteProvider });
  } catch (error) {
    if (error instanceof PayPalFxError) throw error;
    throw new PayPalFxError(PAYPAL_FX_ERROR_CODES.PROVIDER_UNAVAILABLE, 'PayPal currency conversion is temporarily unavailable');
  }

  const providerAmount = multiplyMoneyByDecimal(amount, quote.rate, PAYPAL_PROVIDER_CURRENCY);
  if (toMinorUnits(providerAmount, PAYPAL_PROVIDER_CURRENCY) <= 0) {
    throw new PayPalFxError(PAYPAL_FX_ERROR_CODES.INVALID_SETTLEMENT, 'PayPal settlement amount is invalid');
  }

  return Object.freeze({
    providerAmount: formatMoneyDecimal(providerAmount, PAYPAL_PROVIDER_CURRENCY),
    providerCurrency: PAYPAL_PROVIDER_CURRENCY,
    mode: 'FRANKFURTER_SOURCE_TO_USD',
    fxEvidence: Object.freeze({
      sourceCurrency: currency,
      sourceAmount: amount,
      settlementCurrency: PAYPAL_PROVIDER_CURRENCY,
      settlementAmount: formatMoneyDecimal(providerAmount, PAYPAL_PROVIDER_CURRENCY),
      exchangeRate: quote.rate,
      rateDirection: 'SOURCE_TO_USD',
      exchangeRateSource: quote.source,
      exchangeRateVersion: quote.version,
      exchangeRateTimestamp: quote.effectiveAt,
      exchangeRateFetchedAt: quote.fetchedAt,
      exchangeRateProvider: 'Frankfurter',
    }),
  });
};

export const getPayPalFxCapability = async ({
  currency,
  configured,
  now = Date.now(),
  quoteProvider = fetchFrankfurterQuote,
} = {}) => {
  let normalized;
  try {
    normalized = normalizeCurrency(currency);
  } catch (error) {
    return Object.freeze({ available: false, providerCurrency: null, mode: 'UNSUPPORTED', code: error.code });
  }
  if (!configured) return Object.freeze({ available: false, providerCurrency: null, mode: 'UNSUPPORTED', code: 'CONFIGURATION_REQUIRED' });
  if (isPayPalNativeCurrency(normalized)) {
    return Object.freeze({ available: true, providerCurrency: normalized, mode: 'DIRECT', code: null });
  }
  try {
    await getValidatedQuote({ currency: normalized, now, quoteProvider });
    return Object.freeze({ available: true, providerCurrency: PAYPAL_PROVIDER_CURRENCY, mode: 'FRANKFURTER_SOURCE_TO_USD', code: null });
  } catch (error) {
    return Object.freeze({ available: false, providerCurrency: PAYPAL_PROVIDER_CURRENCY, mode: 'FRANKFURTER_SOURCE_TO_USD', code: error?.code || PAYPAL_FX_ERROR_CODES.PROVIDER_UNAVAILABLE });
  }
};

export const buildPayPalFxEvidenceMetadata = (evidence) => (
  evidence?.fxEvidence
    ? {
        fxMode: evidence.mode,
        ...evidence.fxEvidence,
      }
    : null
);

export default resolvePayPalProviderEvidence;
