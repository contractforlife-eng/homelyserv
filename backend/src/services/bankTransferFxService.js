import {
  formatMoneyDecimal,
  multiplyMoneyByDecimal,
  toMinorUnits,
} from '../utils/money.js';
import {
  BANK_TRANSFER_FX_CURRENCIES,
  BANK_TRANSFER_FX_QUOTE_CURRENCY,
  getBankTransferFxConfig,
} from '../config/bankTransferFx.js';

export const BANK_TRANSFER_FX_ERROR_CODES = Object.freeze({
  INVALID_CONFIGURATION: 'INVALID_BANK_TRANSFER_FX_CONFIGURATION',
  INVALID_AMOUNT: 'INVALID_BANK_TRANSFER_FX_AMOUNT',
  UNSUPPORTED_CURRENCY: 'UNSUPPORTED_BANK_TRANSFER_FX_CURRENCY',
  STALE_RATE: 'STALE_BANK_TRANSFER_FX_RATE',
  INVALID_SETTLEMENT: 'INVALID_BANK_TRANSFER_FX_SETTLEMENT',
});

export class BankTransferFxError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BankTransferFxError';
    this.code = code;
  }
}

const isDecimal = (value) => typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim());
const requireText = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION, `${label} is required`);
  }
  return value.trim();
};

const validateRate = (config, now) => {
  if (!config || !BANK_TRANSFER_FX_CURRENCIES.includes(config.baseCurrency) || config.quoteCurrency !== BANK_TRANSFER_FX_QUOTE_CURRENCY) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION, 'Unsupported FX currency pair');
  }
  if (!isDecimal(config.rate) || !/[1-9]/.test(config.rate.trim())) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION, 'FX rate must be positive');
  }
  if (requireText(config.rateDirection, 'FX rateDirection') !== `${config.baseCurrency}_TO_USD`) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION, 'FX rateDirection is invalid');
  }
  const source = requireText(config.source, 'FX source');
  const version = requireText(config.version, 'FX version');
  const effectiveAt = requireText(config.effectiveAt, 'FX effectiveAt');
  const timestamp = Date.parse(effectiveAt);
  if (!Number.isFinite(timestamp) || timestamp > now) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION, 'FX effectiveAt is invalid');
  }
  if (config.maxAgeSeconds != null && String(config.maxAgeSeconds).trim() !== '') {
    if (!/^\d+$/.test(String(config.maxAgeSeconds)) || Number(config.maxAgeSeconds) <= 0 || now - timestamp > Number(config.maxAgeSeconds) * 1000) {
      throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.STALE_RATE, 'FX rate is stale or maxAgeSeconds is invalid');
    }
  }
  return { source, version, effectiveAt, timestamp };
};

const normalizeAmount = (amount, currency) => {
  const text = String(amount ?? '').trim();
  if (!isDecimal(text) || toMinorUnits(text, currency) <= 0) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_AMOUNT, 'Canonical amount must be positive');
  }
  return formatMoneyDecimal(text, currency);
};

export const resolveBankTransferUsdSettlement = ({ canonicalAmount, canonicalCurrency, config = getBankTransferFxConfig(), now = Date.now() } = {}) => {
  const currency = String(canonicalCurrency || '').trim().toUpperCase();
  if (currency !== BANK_TRANSFER_FX_QUOTE_CURRENCY && !BANK_TRANSFER_FX_CURRENCIES.includes(currency)) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY, 'Unsupported canonical currency');
  }
  const normalizedCanonicalAmount = normalizeAmount(canonicalAmount, currency);

  if (currency === BANK_TRANSFER_FX_QUOTE_CURRENCY) {
    return Object.freeze({
      canonicalAmount: normalizedCanonicalAmount,
      canonicalCurrency: currency,
      settlementAmount: formatMoneyDecimal(normalizedCanonicalAmount, BANK_TRANSFER_FX_QUOTE_CURRENCY),
      settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY,
      exchangeRate: '1',
      rateDirection: 'USD_TO_USD',
      exchangeRateSource: 'IDENTITY',
      exchangeRateVersion: 'IDENTITY',
      exchangeRateTimestamp: new Date(now).toISOString(),
    });
  }

  const fx = validateRate(config?.[currency], now);
  const settlementAmount = multiplyMoneyByDecimal(normalizedCanonicalAmount, config[currency].rate, BANK_TRANSFER_FX_QUOTE_CURRENCY);
  if (toMinorUnits(settlementAmount, BANK_TRANSFER_FX_QUOTE_CURRENCY) <= 0) {
    throw new BankTransferFxError(BANK_TRANSFER_FX_ERROR_CODES.INVALID_SETTLEMENT, 'USD settlement amount is invalid');
  }

  return Object.freeze({
    canonicalAmount: normalizedCanonicalAmount,
    canonicalCurrency: currency,
    settlementAmount: formatMoneyDecimal(settlementAmount, BANK_TRANSFER_FX_QUOTE_CURRENCY),
    settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY,
    exchangeRate: String(config[currency].rate).trim(),
    rateDirection: config[currency].rateDirection,
    exchangeRateSource: fx.source,
    exchangeRateVersion: fx.version,
    exchangeRateTimestamp: fx.effectiveAt,
  });
};

// Capability discovery is deliberately non-throwing and never exposes rate
// values. Conversion continues to use resolveBankTransferUsdSettlement(),
// which remains the authoritative amount/rounding path.
export const getBankTransferFxCapability = ({ canonicalCurrency, config = getBankTransferFxConfig(), now = Date.now() } = {}) => {
  const currency = String(canonicalCurrency || '').trim().toUpperCase();
  if (currency === BANK_TRANSFER_FX_QUOTE_CURRENCY) {
    return Object.freeze({ available: true, settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY, code: null });
  }
  if (!BANK_TRANSFER_FX_CURRENCIES.includes(currency)) {
    return Object.freeze({ available: false, settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY, code: BANK_TRANSFER_FX_ERROR_CODES.UNSUPPORTED_CURRENCY });
  }

  try {
    validateRate(config?.[currency], now);
    return Object.freeze({ available: true, settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY, code: null });
  } catch (error) {
    return Object.freeze({
      available: false,
      settlementCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY,
      code: error?.code || BANK_TRANSFER_FX_ERROR_CODES.INVALID_CONFIGURATION,
    });
  }
};

export default resolveBankTransferUsdSettlement;
