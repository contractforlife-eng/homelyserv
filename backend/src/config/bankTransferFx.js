// Server-only reviewed FX configuration for the active USD Bank Transfer rail.
// Rates are deliberately environment-provided and never bundled into the client.
export const BANK_TRANSFER_FX_CURRENCIES = Object.freeze(['EGP', 'EUR', 'GBP', 'TRY']);
export const BANK_TRANSFER_FX_QUOTE_CURRENCY = 'USD';

const read = (env, key) => {
  const value = env?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const suffixFor = (currency) => `${currency}_USD`;

export const getBankTransferFxConfig = (env = process.env) => Object.freeze(
  Object.fromEntries(BANK_TRANSFER_FX_CURRENCIES.map((currency) => {
    const suffix = suffixFor(currency);
    return [currency, Object.freeze({
      baseCurrency: currency,
      quoteCurrency: BANK_TRANSFER_FX_QUOTE_CURRENCY,
      rate: read(env, `BANK_TRANSFER_FX_${suffix}_RATE`),
      rateDirection: read(env, `BANK_TRANSFER_FX_${suffix}_RATE_DIRECTION`) || `${currency}_TO_USD`,
      source: read(env, `BANK_TRANSFER_FX_${suffix}_SOURCE`),
      version: read(env, `BANK_TRANSFER_FX_${suffix}_VERSION`),
      effectiveAt: read(env, `BANK_TRANSFER_FX_${suffix}_EFFECTIVE_AT`),
      maxAgeSeconds: read(env, `BANK_TRANSFER_FX_${suffix}_MAX_AGE_SECONDS`),
    })];
  })),
);

export default getBankTransferFxConfig;
