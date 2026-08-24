import {
  formatMoneyDecimal,
  multiplyMoneyByDecimal,
  toMinorUnits,
} from '../utils/money.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { fetchFrankfurterQuote, validateFrankfurterQuote } from './frankfurterFxService.js';

export const BANK_TRANSFER_FX_QUOTE_CURRENCY = 'USD';
export const BANK_TRANSFER_FX_CACHE_TTL_MS = 15 * 60 * 1000;
export const BANK_TRANSFER_FX_MAX_WORKING_DAYS = 3;

export const BANK_TRANSFER_FX_ERROR_CODES = Object.freeze({
  INVALID_CONFIGURATION: 'INVALID_BANK_TRANSFER_FX_CONFIGURATION',
  INVALID_AMOUNT: 'INVALID_BANK_TRANSFER_FX_AMOUNT',
  UNSUPPORTED_CURRENCY: 'UNSUPPORTED_BANK_TRANSFER_FX_CURRENCY',
  STALE_RATE: 'STALE_BANK_TRANSFER_FX_RATE',
  INVALID_SETTLEMENT: 'INVALID_BANK_TRANSFER_FX_SETTLEMENT',
  PROVIDER_UNAVAILABLE: 'BANK_TRANSFER_FX_PROVIDER_UNAVAILABLE',
});

export class BankTransferFxError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BankTransferFxError';
    this.code = code;
  }
}

const quoteCache = new Map();
const isDecimal = (value) => typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim());

const normalizeAmount = (amount, currency) => {
  const text = String(amount ?? '').trim();
  if (!isDecimal(text) || toMinorUnits(text, currency) <= 0) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_AMOUNT, 'Canonical amount must be positive');
  }
  return formatMoneyDecimal(text, currency);
};

const normalizeCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  if (!currency || !isSupportedCurrency(currency)) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY, 'Unsupported canonical currency');
  }
  return currency;
};

const identityEvidence = (amount, now) => Object.freeze({
  canonicalAmount: amount,
  canonicalCurrency: 'USD',
  settlementAmount: formatMoneyDecimal(amount, 'USD'),
  settlementCurrency: 'USD',
  exchangeRate: '1',
  rateDirection: 'SOURCE_TO_USD',
  exchangeRateSource: 'identity',
  exchangeRateVersion: 'identity',
  exchangeRateTimestamp: new Date(now).toISOString(),
  exchangeRateFetchedAt: new Date(now).toISOString(),
  exchangeRateProvider: 'identity',
});

export const clearBankTransferFxCache = () => quoteCache.clear();

const getValidatedQuote = async ({ currency, now, quoteProvider = fetchFrankfurterQuote }) => {
  const cached = quoteCache.get(currency);
  if (cached && now - cached.cachedAt <= BANK_TRANSFER_FX_CACHE_TTL_MS) {
    return cached.quote;
  }

  try {
    const fetched = await quoteProvider(currency, { now });
    const quote = validateFrankfurterQuote({
      quote: fetched,
      sourceCurrency: currency,
      now,
      maxWorkingDays: BANK_TRANSFER_FX_MAX_WORKING_DAYS,
    });
    quoteCache.set(currency, { cachedAt: now, quote });
    return quote;
  } catch (error) {
    if (error instanceof BankTransferFxError) throw error;
    throw new BankTransferFxError(
      error?.code || BANK_TRANSFER_FX_ERROR_CODES.PROVIDER_UNAVAILABLE,
      'Bank transfer FX quote is unavailable',
    );
  }
};

export const resolveBankTransferUsdSettlement = async ({
  canonicalAmount,
  canonicalCurrency,
  now = Date.now(),
  quoteProvider = fetchFrankfurterQuote,
} = {}) => {
  const currency = normalizeCurrency(canonicalCurrency);
  const normalizedCanonicalAmount = normalizeAmount(canonicalAmount, currency);

  if (currency === BANK_TRANSFER_FX_QUOTE_CURRENCY) {
    return identityEvidence(normalizedCanonicalAmount, now);
  }

  let quote;
  try {
    quote = await getValidatedQuote({ currency, now, quoteProvider });
  } catch (error) {
    if (error instanceof BankTransferFxError) throw error;
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.PROVIDER_UNAVAILABLE, 'Bank transfer FX quote is unavailable');
  }

  const settlementAmount = multiplyMoneyByDecimal(normalizedCanonicalAmount, quote.rate, BANK_TRANSFER_FX_QUOTE_CURRENCY);
  if (toMinorUnits(settlementAmount, BANK_TRANSFER_FX_QUOTE_CURRENCY) <= 0) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_SETTLEMENT, 'USD settlement amount is invalid');
  }

  return Object.freeze({
    canonicalAmount: normalizedCanonicalAmount,
    canonicalCurrency: currency,
    settlementAmount: formatMoneyDecimal(settlementAmount, BANK_TRANSFER_FX_QUOTE_CURRENCY),
    settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY,
    exchangeRate: quote.rate,
    rateDirection: 'SOURCE_TO_USD',
    exchangeRateSource: quote.source,
    exchangeRateVersion: quote.version,
    exchangeRateTimestamp: quote.effectiveAt,
    exchangeRateFetchedAt: quote.fetchedAt,
    exchangeRateProvider: 'Frankfurter',
  });
};

// Capability discovery is deliberately non-throwing and never exposes rate
// values. It uses the same cached, validated quote path as payment creation.
export const getBankTransferFxCapability = async ({
  canonicalCurrency,
  now = Date.now(),
  quoteProvider = fetchFrankfurterQuote,
} = {}) => {
  let currency;
  try {
    currency = normalizeCurrency(canonicalCurrency);
  } catch (error) {
    return Object.freeze({ available: false, settlementCurrency: 'USD', code: error?.code || BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY });
  }

  if (currency === 'USD') {
    return Object.freeze({ available: true, settlementCurrency: 'USD', code: null });
  }

  try {
    await getValidatedQuote({ currency, now, quoteProvider });
    return Object.freeze({ available: true, settlementCurrency: 'USD', code: null });
  } catch (error) {
    return Object.freeze({
      available: false,
      settlementCurrency: 'USD',
      code: error?.code || BANK_TRANSFER_FX_ERROR_CODES.PROVIDER_UNAVAILABLE,
    });
  }
};

export default resolveBankTransferUsdSettlement;
