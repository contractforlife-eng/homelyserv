const STRICT_DISPLAY_RATE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const CANONICAL_CURRENCY_PATTERN = /^[A-Z]{3}$/;

export const formatWorkerRate = (worker, t, fallbackKey) => {
  const rawRate = worker?.hourlyRateDisplayValue ?? worker?.hourlyRate;
  if (typeof rawRate !== 'string' && typeof rawRate !== 'number') {
    return t(fallbackKey);
  }

  const rate = String(rawRate).trim();
  if (!STRICT_DISPLAY_RATE_PATTERN.test(rate)) {
    return t(fallbackKey);
  }

  const currency = typeof worker?.hourlyRateCurrency === 'string' &&
    CANONICAL_CURRENCY_PATTERN.test(worker.hourlyRateCurrency)
    ? worker.hourlyRateCurrency
    : 'EGP';

  return `${rate} ${currency}`;
};
