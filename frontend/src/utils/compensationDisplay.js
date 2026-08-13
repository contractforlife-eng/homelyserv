const ISO_CURRENCY_CODE = /^[A-Z]{3}$/;

export const resolveCompensationCurrency = (record) => {
  const candidate = typeof record?.compensationCurrency === 'string'
    ? record.compensationCurrency.trim().toUpperCase()
    : '';
  return ISO_CURRENCY_CODE.test(candidate) ? candidate : 'EGP';
};

export const formatCompensationAmount = (amount, record, fallback = '—') => {
  if (amount === null || amount === undefined || amount === '') return fallback;
  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) return fallback;
  return `${numericAmount.toLocaleString()} ${resolveCompensationCurrency(record)}`;
};

