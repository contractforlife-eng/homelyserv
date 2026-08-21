import {
  SUBSCRIPTION_PRICE_BOOK_VERSION,
  resolveSubscriptionPriceBook,
} from '../config/subscriptionPriceBooks.js';

const LEGACY_MARKET = 'LEGACY_EGP';
const PURCHASE_ENABLED_MARKETS = new Set(['EGYPT', LEGACY_MARKET]);
const PLANS = ['weekly', 'monthly', 'annual'];

const resolvePlanQuote = (user, plan) => {
  try {
    return resolveSubscriptionPriceBook({ user, plan });
  } catch (error) {
    // The legacy book intentionally has no annual entry in this phase.
    if (plan === 'annual' && error.message === 'Unsupported subscription plan for market') {
      return null;
    }
    throw error;
  }
};

/**
 * Build a book-price quote from the authenticated database User.
 * This service has no database or provider side effects.
 */
export const buildSubscriptionQuote = (user) => {
  const resolvedPlans = PLANS.map((plan) => ({ plan, resolved: resolvePlanQuote(user, plan) }));
  const reference = resolvedPlans.find(({ resolved }) => resolved)?.resolved;
  if (!reference) throw new Error('No subscription price book available');

  const plans = Object.fromEntries(resolvedPlans.map(({ plan, resolved }) => [
    plan,
    resolved
      ? {
          amount: resolved.amount,
          currency: resolved.currency,
          durationDays: resolved.durationDays,
          purchaseEnabled: plan !== 'annual' && PURCHASE_ENABLED_MARKETS.has(resolved.market),
        }
      : null,
  ]));

  return {
    market: reference.market,
    countryCode: reference.countryCode,
    purchaserRole: reference.role,
    currency: reference.currency,
    priceBookVersion: SUBSCRIPTION_PRICE_BOOK_VERSION,
    plans,
  };
};

export default buildSubscriptionQuote;
