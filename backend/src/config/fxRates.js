// TRY/USD configuration is intentionally opt-in. There is no production rate
// in source control; deployment must provide all reviewed values explicitly.
export const TRY_USD_RATE_DIRECTION = 'TRY_TO_USD';
export const TRY_USD_BASE_CURRENCY = 'TRY';
export const TRY_USD_QUOTE_CURRENCY = 'USD';

export const getTryUsdRateConfig = (env = process.env) => Object.freeze({
  baseCurrency: TRY_USD_BASE_CURRENCY,
  quoteCurrency: TRY_USD_QUOTE_CURRENCY,
  rate: typeof env.TRY_USD_RATE === 'string' ? env.TRY_USD_RATE.trim() : null,
  rateDirection: typeof env.TRY_USD_RATE_DIRECTION === 'string'
    ? env.TRY_USD_RATE_DIRECTION.trim()
    : TRY_USD_RATE_DIRECTION,
  rateVersion: typeof env.TRY_USD_RATE_VERSION === 'string'
    ? env.TRY_USD_RATE_VERSION.trim()
    : null,
  effectiveAt: typeof env.TRY_USD_RATE_EFFECTIVE_AT === 'string'
    ? env.TRY_USD_RATE_EFFECTIVE_AT.trim()
    : null,
  source: typeof env.TRY_USD_RATE_SOURCE === 'string'
    ? env.TRY_USD_RATE_SOURCE.trim()
    : null,
  maxAgeSeconds: typeof env.TRY_USD_RATE_MAX_AGE_SECONDS === 'string'
    ? env.TRY_USD_RATE_MAX_AGE_SECONDS.trim()
    : null,
});

export default {
  TRY_USD_RATE_DIRECTION,
  TRY_USD_BASE_CURRENCY,
  TRY_USD_QUOTE_CURRENCY,
  getTryUsdRateConfig,
};
