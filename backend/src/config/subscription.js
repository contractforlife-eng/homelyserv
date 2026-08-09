// backend/src/config/subscription.js
// ============================================================
// SINGLE SOURCE OF TRUTH — Premium subscription pricing & duration.
// The backend is authoritative for pricing: the amount a customer pays
// for a SUBSCRIPTION is ALWAYS derived here from the authenticated user's
// role. The frontend may display these values for marketing, but it must
// never dictate the charged amount.
//
// Official business rules to preserve:
//   Employer Premium = 200 EGP / 30 days
//   Worker Premium   = 100 EGP / 30 days
//   Commission rate = 15%  (backend/src/config/monetization.js)
// ============================================================

export const PREMIUM_PRICES = {
  EMPLOYER: 200, // EGP
  WORKER: 100    // EGP
};

export const PREMIUM_DURATION_DAYS = 30;

export const PAYMENT_PURPOSES = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  COMMISSION: 'COMMISSION'
};

export const getPremiumPriceForRole = (role) => {
  return role === 'EMPLOYER' ? PREMIUM_PRICES.EMPLOYER : PREMIUM_PRICES.WORKER;
};

export default {
  PREMIUM_PRICES,
  PREMIUM_DURATION_DAYS,
  PAYMENT_PURPOSES,
  getPremiumPriceForRole
};