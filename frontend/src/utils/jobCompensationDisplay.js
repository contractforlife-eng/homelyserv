const LEGACY_JOB_COMPENSATION_CURRENCY = 'EGP';

const UI_LOCALES = Object.freeze({
  en: 'en-US',
  ar: 'ar-EG',
  fr: 'fr-FR',
  ru: 'ru-RU',
  tr: 'tr-TR',
  de: 'de-DE'
});

const toFiniteAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const resolveJobCompensationCurrency = (job) => {
  if (typeof job?.compensationCurrency === 'string') {
    const normalized = job.compensationCurrency.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(normalized)) return normalized;
  }

  return LEGACY_JOB_COMPENSATION_CURRENCY;
};

export const formatJobCompensation = (job, t, language = 'en') => {
  const min = toFiniteAmount(job?.salaryMin);
  const max = toFiniteAmount(job?.salaryMax);
  if (min === null && max === null) return '—';

  const locale = UI_LOCALES[language] || UI_LOCALES.en;
  const currency = resolveJobCompensationCurrency(job);
  const formatAmount = (amount) => Math.round(amount).toLocaleString(locale);

  if (min !== null && max !== null && min === max) {
    return t('jobCompensation.exact', { amount: formatAmount(min), currency });
  }
  if (min !== null && max !== null) {
    return t('jobCompensation.range', {
      min: formatAmount(min),
      max: formatAmount(max),
      currency
    });
  }
  if (min !== null) {
    return t('jobCompensation.from', { amount: formatAmount(min), currency });
  }
  return t('jobCompensation.upTo', { amount: formatAmount(max), currency });
};

