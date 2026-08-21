import {
  formatMoneyDecimal,
  multiplyMoneyByDecimal,
  toMinorUnits,
} from '../utils/money.js';
import {
  getTryUsdRateConfig,
  TRY_USD_BASE_CURRENCY,
  TRY_USD_QUOTE_CURRENCY,
  TRY_USD_RATE_DIRECTION,
} from '../config/fxRates.js';

export const TRY_USD_MINIMUM_PROVIDER_AMOUNT = '1.00';
export const FX_ERROR_CODES = Object.freeze({
  INVALID_CONFIGURATION: 'INVALID_FX_CONFIGURATION',
  INVALID_BOOK_AMOUNT: 'INVALID_FX_BOOK_AMOUNT',
  RATE_TOO_LOW: 'FX_PROVIDER_AMOUNT_BELOW_MINIMUM',
  STALE_RATE: 'STALE_FX_RATE',
});

export class FxConversionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FxConversionError';
    this.code = code;
  }
}

const isPlainDecimal = (value) => (
  typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim())
);

const isPositiveDecimal = (value) => (
  isPlainDecimal(value) && /[1-9]/.test(value.trim().replace('.', ''))
);

const requireText = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, `${label} is required`);
  }
  return value.trim();
};

const parseEffectiveAt = (value) => {
  const text = requireText(value, 'effectiveAt');
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp)) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'effectiveAt must be a valid timestamp');
  }
  return { text, timestamp };
};

const validateMaxAgeSeconds = (value) => {
  if (value == null || String(value).trim() === '') return null;
  if (!/^\d+$/.test(String(value).trim()) || Number(value) <= 0 || !Number.isSafeInteger(Number(value))) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'maxAgeSeconds must be a positive integer');
  }
  return Number(value);
};

const validateRateConfig = (config, now) => {
  if (!config || config.baseCurrency !== TRY_USD_BASE_CURRENCY || config.quoteCurrency !== TRY_USD_QUOTE_CURRENCY) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'Unsupported FX currency pair');
  }
  if (config.rateDirection !== TRY_USD_RATE_DIRECTION) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'Unsupported FX rate direction');
  }
  if (!isPositiveDecimal(config.rate)) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'rate must be a positive decimal string');
  }
  const rateVersion = requireText(config.rateVersion, 'rateVersion');
  const source = requireText(config.source, 'source');
  const effectiveAt = parseEffectiveAt(config.effectiveAt);
  const maxAgeSeconds = validateMaxAgeSeconds(config.maxAgeSeconds);
  if (maxAgeSeconds != null && now - effectiveAt.timestamp > maxAgeSeconds * 1000) {
    throw new FxConversionError(FX_ERROR_CODES.STALE_RATE, 'FX rate is stale');
  }
  if (effectiveAt.timestamp > now) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_CONFIGURATION, 'effectiveAt cannot be in the future');
  }
  return { rateVersion, source, effectiveAt, maxAgeSeconds };
};

const validateBookAmount = (bookAmount) => {
  if (typeof bookAmount === 'number' && !Number.isFinite(bookAmount)) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_BOOK_AMOUNT, 'bookAmount must be finite');
  }
  const text = String(bookAmount ?? '').trim();
  if (!isPlainDecimal(text) || toMinorUnits(text, TRY_USD_BASE_CURRENCY) <= 0) {
    throw new FxConversionError(FX_ERROR_CODES.INVALID_BOOK_AMOUNT, 'bookAmount must be a positive decimal');
  }
  return formatMoneyDecimal(text, TRY_USD_BASE_CURRENCY);
};

/**
 * Convert a TRY book amount using an explicitly supplied, reviewed rate
 * configuration. The default environment configuration has no active rate.
 * This function is not wired into payment creation in TRY-1.
 */
export const convertTryToUsd = ({ bookAmount, config = getTryUsdRateConfig(), now = Date.now() } = {}) => {
  const normalizedBookAmount = validateBookAmount(bookAmount);
  const validated = validateRateConfig(config, now);
  const providerAmount = multiplyMoneyByDecimal(
    normalizedBookAmount,
    config.rate,
    TRY_USD_QUOTE_CURRENCY,
  );
  if (toMinorUnits(providerAmount, TRY_USD_QUOTE_CURRENCY) < toMinorUnits(TRY_USD_MINIMUM_PROVIDER_AMOUNT, TRY_USD_QUOTE_CURRENCY)) {
    throw new FxConversionError(FX_ERROR_CODES.RATE_TOO_LOW, 'Converted provider amount is below the PayPal minimum');
  }

  return Object.freeze({
    bookAmount: normalizedBookAmount,
    bookCurrency: TRY_USD_BASE_CURRENCY,
    providerAmount: formatMoneyDecimal(providerAmount, TRY_USD_QUOTE_CURRENCY),
    providerCurrency: TRY_USD_QUOTE_CURRENCY,
    exchangeRate: String(config.rate).trim(),
    rateDirection: TRY_USD_RATE_DIRECTION,
    exchangeRateSource: validated.source,
    exchangeRateVersion: validated.rateVersion,
    exchangeRateTimestamp: validated.effectiveAt.text,
  });
};

export default {
  FX_ERROR_CODES,
  FxConversionError,
  TRY_USD_MINIMUM_PROVIDER_AMOUNT,
  convertTryToUsd,
};
