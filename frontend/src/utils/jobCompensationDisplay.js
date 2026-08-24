import { formatNumericAmount, getStoredCurrency } from './currencyPresentation';

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
  return getStoredCurrency(job);
};

export const formatJobCompensation = (job, t, language = 'en') => {
  const min = toFiniteAmount(job?.salaryMin);
  const max = toFiniteAmount(job?.salaryMax);
  if (min === null && max === null) return '—';

  const locale = UI_LOCALES[language] || UI_LOCALES.en;
  const currency = resolveJobCompensationCurrency(job);
  const formatAmount = (amount) => formatNumericAmount(Math.round(amount), locale);

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
