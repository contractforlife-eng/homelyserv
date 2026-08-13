// backend/src/config/subscription.js
// ============================================================
// SINGLE SOURCE OF TRUTH — Premium subscription pricing & duration.
// The backend is authoritative for pricing: the amount a customer pays
// for a SUBSCRIPTION is ALWAYS derived here from the authenticated user's
// role. The frontend may display these values for marketing, but it must
// never dictate the charged amount.
//
// Official business rules to preserve:
//   weekly:  Employer 100 EGP, Worker 75 EGP, 7 days
//   monthly: Employer 300 EGP, Worker 200 EGP, 30 days
//   Commission rate = 15%  (backend/src/config/monetization.js)
// ============================================================

export const SUBSCRIPTION_CURRENCY = 'EGP';
export const SUBSCRIPTION_PLANS = {
  weekly: {
    durationDays: 7,
    prices: { EMPLOYER: 100, WORKER: 75 }
  },
  monthly: {
    durationDays: 30,
    prices: { EMPLOYER: 300, WORKER: 200 }
  }
};

export const PAYMENT_PURPOSES = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  COMMISSION: 'COMMISSION'
};

export const normalizeSubscriptionPlanId = (plan) => (
  typeof plan === 'string' ? plan.trim().toLowerCase() : ''
);

export const isSupportedSubscriptionPlan = (plan) => (
  Object.hasOwn(SUBSCRIPTION_PLANS, normalizeSubscriptionPlanId(plan))
);

export const getSubscriptionPlan = (plan) => {
  const normalized = normalizeSubscriptionPlanId(plan);
  return isSupportedSubscriptionPlan(normalized)
    ? { id: normalized, ...SUBSCRIPTION_PLANS[normalized] }
    : null;
};

export const getSubscriptionPrice = (plan, role) => {
  const config = getSubscriptionPlan(plan);
  return config?.prices?.[role] ?? null;
};

export const getSubscriptionDurationDays = (plan) => {
  return getSubscriptionPlan(plan)?.durationDays ?? null;
};

export default {
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_PLANS,
  PAYMENT_PURPOSES,
  normalizeSubscriptionPlanId,
  isSupportedSubscriptionPlan,
  getSubscriptionPlan,
  getSubscriptionPrice,
  getSubscriptionDurationDays
};
