import { formatCurrencyAmount, getStoredCurrency } from './currencyPresentation';

export const resolveCompensationCurrency = (record) => {
  return getStoredCurrency(record);
};

export const formatCompensationAmount = (amount, record, fallback = '—') => {
  if (amount === null || amount === undefined || amount === '') return fallback;
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return fallback;
  return formatCurrencyAmount(numericAmount, resolveCompensationCurrency(record));
};
