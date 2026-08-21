export const SUBSCRIPTION_QUOTE_PLAN_ORDER = ['weekly', 'monthly', 'annual'];

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  TRY: '₺'
};

export const formatSubscriptionAmount = (amount, currency) => {
  if (amount === null || amount === undefined || !currency) return '';

  const numericAmount = Number(amount);
  const displayAmount = Number.isFinite(numericAmount)
    ? (Number.isInteger(numericAmount)
      ? String(numericAmount)
      : numericAmount.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))
    : String(amount);
  const symbol = CURRENCY_SYMBOLS[String(currency).toUpperCase()];

  return symbol ? `${symbol}${displayAmount}` : `${displayAmount} ${currency}`;
};

export const getRenderableSubscriptionPlans = (quote) => {
  const plans = quote?.plans || {};
  return SUBSCRIPTION_QUOTE_PLAN_ORDER
    .filter((planId) => plans[planId] && typeof plans[planId] === 'object')
    .map((planId) => ({ id: planId, ...plans[planId] }));
};

export const getPreferredSubscriptionPlan = (quote, currentPlan = 'monthly') => {
  const plans = getRenderableSubscriptionPlans(quote);
  const current = plans.find(({ id }) => id === currentPlan);
  const enabled = plans.find(({ purchaseEnabled }) => purchaseEnabled === true);
  if (current?.purchaseEnabled === true || !enabled) return current?.id || plans[0]?.id || null;

  return enabled.id;
};

export const isSubscriptionPlanPurchaseEnabled = (quote, planId) => (
  quote?.plans?.[planId]?.purchaseEnabled === true
);
