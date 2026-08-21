import {
  formatSubscriptionAmount,
  getRenderableSubscriptionPlans,
  getPreferredSubscriptionPlan,
  isSubscriptionPlanPurchaseEnabled
} from './subscriptionQuotePresentation.js';

const quote = (currency, amounts, purchaseEnabled = false) => ({
  currency,
  plans: {
    weekly: { amount: amounts[0], currency, durationDays: 7, purchaseEnabled },
    monthly: { amount: amounts[1], currency, durationDays: 30, purchaseEnabled },
    annual: { amount: amounts[2], currency, durationDays: 365, purchaseEnabled: false }
  }
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const cases = [
  ['USA worker', quote('USD', [3.99, 9.99, 99.99]), ['$3.99', '$9.99', '$99.99']],
  ['EU worker', quote('EUR', [3.49, 8.99, 89.99]), ['€3.49', '€8.99', '€89.99']],
  ['UK worker', quote('GBP', [3.49, 8.99, 89.99]), ['£3.49', '£8.99', '£89.99']],
  ['Turkey worker', quote('TRY', [69, 169, 1399]), ['₺69', '₺169', '₺1399']],
  ['Egypt employer', quote('EGP', [100, 300, 2700], true), ['100 EGP', '300 EGP', '2700 EGP']]
];

cases.forEach(([label, data, expected]) => {
  getRenderableSubscriptionPlans(data).forEach((plan, index) => {
    assert(formatSubscriptionAmount(plan.amount, plan.currency) === expected[index], `${label}: amount formatting`);
  });
});

const legacyQuote = { plans: {
  weekly: { amount: 100, currency: 'EGP', durationDays: 7, purchaseEnabled: true },
  monthly: { amount: 300, currency: 'EGP', durationDays: 30, purchaseEnabled: true },
  annual: { amount: 2700, currency: 'EGP', durationDays: 365, purchaseEnabled: false }
} };
assert(getRenderableSubscriptionPlans(legacyQuote).length === 3, 'legacy quote renders server-returned annual');
assert(formatSubscriptionAmount(legacyQuote.plans.annual.amount, legacyQuote.plans.annual.currency) === '2700 EGP', 'legacy annual amount displays');
assert(getPreferredSubscriptionPlan(quote('USD', [3.99, 9.99, 99.99]), 'monthly') === 'monthly', 'current plan is preserved');
assert(getPreferredSubscriptionPlan(quote('EGP', [100, 300, 2700], true), 'annual') === 'weekly', 'disabled current plan falls back to enabled plan');
assert(isSubscriptionPlanPurchaseEnabled(quote('USD', [3.99, 9.99, 99.99]), 'annual') === false, 'annual is not purchasable');
assert(isSubscriptionPlanPurchaseEnabled(quote('EGP', [100, 300, 2700], true), 'weekly') === true, 'Egypt weekly remains enabled');
