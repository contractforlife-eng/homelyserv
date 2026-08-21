import { normalizeCountryCode } from '../utils/currencyMetadata.js';

export const SUBSCRIPTION_PRICE_BOOK_VERSION = '2026-08-v1';

const ROLES = Object.freeze({ EMPLOYER: 'EMPLOYER', WORKER: 'WORKER' });

const freezeBook = (market, currency, plans) => Object.freeze({
  market,
  currency,
  plans: Object.freeze(Object.fromEntries(
    Object.entries(plans).map(([plan, details]) => [plan, Object.freeze({
      durationDays: details.durationDays,
      prices: Object.freeze({ ...details.prices }),
    })]),
  )),
});

// This is configuration foundation only. It is intentionally not imported by
// payment creation or fulfillment code in this phase.
export const SUBSCRIPTION_PRICE_BOOKS = Object.freeze({
  EGYPT: freezeBook('EGYPT', 'EGP', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 100, WORKER: 75 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 300, WORKER: 200 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 2700, WORKER: 1800 } },
  }),
  USA: freezeBook('USA', 'USD', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 5.99, WORKER: 3.99 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 14.99, WORKER: 9.99 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 149.99, WORKER: 99.99 } },
  }),
  EU: freezeBook('EU', 'EUR', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 4.99, WORKER: 3.49 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 12.99, WORKER: 8.99 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 129.99, WORKER: 89.99 } },
  }),
  UK: freezeBook('UK', 'GBP', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 4.99, WORKER: 3.49 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 12.99, WORKER: 8.99 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 129.99, WORKER: 89.99 } },
  }),
  TURKEY: freezeBook('TURKEY', 'TRY', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 99, WORKER: 69 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 249, WORKER: 169 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 1999, WORKER: 1399 } },
  }),
  GLOBAL: freezeBook('GLOBAL', 'USD', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 5.99, WORKER: 3.99 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 14.99, WORKER: 9.99 } },
    annual: { durationDays: 365, prices: { EMPLOYER: 149.99, WORKER: 99.99 } },
  }),
  // Legacy users without a country retain the current purchasable price book.
  // Annual is deliberately absent until the purchase flow is reviewed.
  LEGACY_EGP: freezeBook('LEGACY_EGP', 'EGP', {
    weekly: { durationDays: 7, prices: { EMPLOYER: 100, WORKER: 75 } },
    monthly: { durationDays: 30, prices: { EMPLOYER: 300, WORKER: 200 } },
  }),
});

const COUNTRY_TO_BOOK = Object.freeze({
  EG: 'EGYPT',
  US: 'USA',
  DE: 'EU',
  FR: 'EU',
  GB: 'UK',
  TR: 'TURKEY',
});

const normalizeRole = (role) => (
  typeof role === 'string' ? role.trim().toUpperCase() : ''
);

const normalizePlan = (plan) => (
  typeof plan === 'string' ? plan.trim().toLowerCase() : ''
);

export const resolveSubscriptionMarket = (countryCode) => {
  if (typeof countryCode !== 'string' || countryCode.trim() === '') {
    return { market: 'LEGACY_EGP', countryCode: null };
  }

  const normalizedCountryCode = normalizeCountryCode(countryCode);
  if (!normalizedCountryCode) throw new Error('Invalid countryCode');

  return {
    market: COUNTRY_TO_BOOK[normalizedCountryCode] || 'GLOBAL',
    countryCode: normalizedCountryCode,
  };
};

/**
 * Resolve a future subscription quote from the authenticated user only.
 * Extra caller fields such as amount, currency, market, and role are ignored.
 */
export const resolveSubscriptionPriceBook = ({ user, plan } = {}) => {
  const role = normalizeRole(user?.role);
  if (!Object.hasOwn(ROLES, role)) throw new Error('Invalid subscription role');

  const normalizedPlan = normalizePlan(plan);
  const resolvedMarket = resolveSubscriptionMarket(user?.countryCode);
  const book = SUBSCRIPTION_PRICE_BOOKS[resolvedMarket.market];
  const selectedPlan = book.plans[normalizedPlan];
  if (!selectedPlan) throw new Error('Unsupported subscription plan for market');

  return Object.freeze({
    market: book.market,
    countryCode: resolvedMarket.countryCode,
    role,
    plan: normalizedPlan,
    amount: selectedPlan.prices[role],
    currency: book.currency,
    durationDays: selectedPlan.durationDays,
    priceBookVersion: SUBSCRIPTION_PRICE_BOOK_VERSION,
  });
};

export const getCurrentPurchasableSubscriptionPlans = () => Object.freeze(['weekly', 'monthly']);

export default {
  SUBSCRIPTION_PRICE_BOOK_VERSION,
  SUBSCRIPTION_PRICE_BOOKS,
  resolveSubscriptionMarket,
  resolveSubscriptionPriceBook,
  getCurrentPurchasableSubscriptionPlans,
};
