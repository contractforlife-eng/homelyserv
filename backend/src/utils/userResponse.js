import { resolveAccountDefaultCurrency } from './currencyMetadata.js';

/**
 * Add derived account-default metadata to an already-sanitized User response.
 * This helper never mutates the source object or persists effectiveCurrency.
 */
export const enrichUserResponse = (userData) => ({
  ...userData,
  effectiveCurrency: resolveAccountDefaultCurrency(userData)
});
