import {
  SUBSCRIPTION_PRICE_BOOK_VERSION,
  resolveSubscriptionPriceBook,
} from '../config/subscriptionPriceBooks.js';
import { canResolveTrySubscriptionProviderEvidence } from './trySubscriptionProviderEvidenceService.js';

const LEGACY_MARKET = 'LEGACY_EGP';
const PURCHASE_ENABLED_MARKETS = new Set(['EGYPT', LEGACY_MARKET, 'USA', 'EU', 'UK', 'GLOBAL']);
const PLANS = ['weekly', 'monthly', 'annual'];

export const isSubscriptionPurchaseMarketEnabled = (market, { user, plan } = {}) => {
  if (market === 'TURKEY') {
    return canResolveTrySubscriptionProviderEvidence({ user, plan });
  }
  return PURCHASE_ENABLED_MARKETS.has(market);
};

const resolvePlanQuote = (user, plan) => {
  try {
    return resolveSubscriptionPriceBook({ user, plan });
  } catch (error) {
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
          purchaseEnabled: isSubscriptionPurchaseMarketEnabled(resolved.market, { user, plan }),
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
