const STRICT_DISPLAY_RATE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
import { getAccountCurrency, normalizeCurrencyCode } from './currencyPresentation';

export const resolveWorkerRateCurrency = (worker) =>
  normalizeCurrencyCode(worker?.hourlyRateCurrency) || getAccountCurrency(worker);

export const getComparableWorkerRate = (worker) => {
  const rawRate = worker?.hourlyRateDisplayValue ?? worker?.hourlyRate;
  if (typeof rawRate !== 'string' && typeof rawRate !== 'number') return null;

  const rate = String(rawRate).trim();
  if (!STRICT_DISPLAY_RATE_PATTERN.test(rate)) return null;

  const amount = Number(rate);
  if (!Number.isFinite(amount)) return null;

  return {
    amount,
    currency: resolveWorkerRateCurrency(worker)
  };
};

export const compareWorkerRates = (a, b, currency, direction = 1) => {
  const aRate = getComparableWorkerRate(a);
  const bRate = getComparableWorkerRate(b);
  const aComparable = aRate?.currency === currency;
  const bComparable = bRate?.currency === currency;

  if (aComparable && bComparable) {
    return direction * (aRate.amount - bRate.amount);
  }
  if (aComparable) return -1;
  if (bComparable) return 1;
  return 0;
};

export const formatWorkerRate = (worker, t, fallbackKey) => {
  const rawRate = worker?.hourlyRateDisplayValue ?? worker?.hourlyRate;
  if (typeof rawRate !== 'string' && typeof rawRate !== 'number') {
    return t(fallbackKey);
  }

  const rate = String(rawRate).trim();
  if (!STRICT_DISPLAY_RATE_PATTERN.test(rate)) {
    return t(fallbackKey);
  }

  const currency = resolveWorkerRateCurrency(worker);

  return `${rate} ${currency}`;
};
