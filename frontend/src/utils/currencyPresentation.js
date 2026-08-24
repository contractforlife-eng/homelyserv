import { countries, getCountryByCode } from './countries';

export const LEGACY_DEFAULT_CURRENCY = 'EGP';
export const SUPPORTED_CURRENCIES = Object.freeze(
  [...new Set(countries.map(({ currency }) => currency).filter(Boolean))].sort()
);

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export const normalizeCurrencyCode = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return CURRENCY_CODE_PATTERN.test(normalized) ? normalized : null;
};

export const getAccountCurrency = (account = {}) => {
  const explicitPreference = normalizeCurrencyCode(account.preferredCurrency);
  if (explicitPreference) return explicitPreference;

  const effectiveCurrency = normalizeCurrencyCode(account.effectiveCurrency);
  if (effectiveCurrency) return effectiveCurrency;

  const countryCode = String(account.countryCode || '').trim().toUpperCase();
  const repositoryCountryCode = countryCode === 'GB' ? 'UK' : countryCode;
  const countryCurrency = getCountryByCode(repositoryCountryCode)?.currency;
  return normalizeCurrencyCode(countryCurrency) || LEGACY_DEFAULT_CURRENCY;
};

export const getStoredCurrency = (record, fallback = LEGACY_DEFAULT_CURRENCY) => (
  normalizeCurrencyCode(record?.currency)
  || normalizeCurrencyCode(record?.compensationCurrency)
  || normalizeCurrencyCode(record?.hourlyRateCurrency)
  || normalizeCurrencyCode(fallback)
  || LEGACY_DEFAULT_CURRENCY
);

export const formatCurrencyAmount = (amount, currency, locale = 'en-US') => {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  const normalizedCurrency = normalizeCurrencyCode(currency) || LEGACY_DEFAULT_CURRENCY;
  if (!Number.isFinite(numericAmount)) return '—';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    currencyDisplay: 'code',
    maximumFractionDigits: 2,
}).format(numericAmount);
};

export const formatNumericAmount = (amount, locale = 'en-US') => {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return '—';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(numericAmount);
};

export const groupCurrencyTotals = (records, amountSelector, currencySelector) => {
  const totals = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    const amount = Number(amountSelector(record));
    if (!Number.isFinite(amount)) continue;

    const currency = normalizeCurrencyCode(currencySelector(record)) || LEGACY_DEFAULT_CURRENCY;
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }

  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
};

export const formatCurrencyTotals = (totals, locale = 'en-US') => (
  totals.map(({ currency, amount }) => formatCurrencyAmount(amount, currency, locale)).join(' · ')
);
