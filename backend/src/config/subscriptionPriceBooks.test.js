import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUBSCRIPTION_PRICE_BOOK_VERSION,
  getCurrentPurchasableSubscriptionPlans,
  resolveSubscriptionMarket,
  resolveSubscriptionPriceBook,
} from './subscriptionPriceBooks.js';

const quote = (countryCode, role, plan, extra = {}) => resolveSubscriptionPriceBook({
  user: { ...extra, countryCode, role },
  plan,
});

test('resolves approved markets and normalizes country codes', () => {
  assert.equal(resolveSubscriptionMarket(' EG ').market, 'EGYPT');
  assert.equal(resolveSubscriptionMarket('us').market, 'USA');
  assert.equal(resolveSubscriptionMarket('DE').market, 'EU');
  assert.equal(resolveSubscriptionMarket('FR').market, 'EU');
  assert.equal(resolveSubscriptionMarket('GB').market, 'UK');
  assert.equal(resolveSubscriptionMarket('TR').market, 'TURKEY');
  assert.equal(resolveSubscriptionMarket('CA').market, 'GLOBAL');
  assert.equal(resolveSubscriptionMarket('AE').market, 'GLOBAL');
  assert.equal(resolveSubscriptionMarket('AU').market, 'GLOBAL');
  assert.equal(resolveSubscriptionMarket('   ').market, 'LEGACY_EGP');
  assert.equal(resolveSubscriptionMarket(undefined).market, 'LEGACY_EGP');
});

test('returns exact approved prices for both roles and all future plans', () => {
  assert.deepEqual(quote('EG', 'EMPLOYER', 'weekly'), {
    market: 'EGYPT', countryCode: 'EG', role: 'EMPLOYER', plan: 'weekly', amount: 100, currency: 'EGP', durationDays: 7, priceBookVersion: SUBSCRIPTION_PRICE_BOOK_VERSION,
  });
  assert.equal(quote('US', 'WORKER', 'annual').amount, 99.99);
  assert.equal(quote('DE', 'EMPLOYER', 'monthly').currency, 'EUR');
  assert.equal(quote('GB', 'WORKER', 'annual').amount, 89.99);
  assert.equal(quote('TR', 'EMPLOYER', 'annual').amount, 1999);
  assert.equal(quote('TR', 'WORKER', 'monthly').amount, 169);
  assert.equal(quote('CA', 'WORKER', 'weekly').amount, 3.99);
});

test('legacy missing-country users retain weekly/monthly EGP and receive a disabled annual quote', () => {
  assert.equal(quote('', 'EMPLOYER', 'monthly').amount, 300);
  assert.equal(quote(null, 'WORKER', 'weekly').currency, 'EGP');
  assert.deepEqual(quote('', 'WORKER', 'annual'), {
    market: 'LEGACY_EGP', countryCode: null, role: 'WORKER', plan: 'annual', amount: 1800, currency: 'EGP', durationDays: 365, priceBookVersion: SUBSCRIPTION_PRICE_BOOK_VERSION,
  });
});

test('only weekly and monthly remain currently purchasable', () => {
  assert.deepEqual(getCurrentPurchasableSubscriptionPlans(), ['weekly', 'monthly']);
});

test('invalid role, plan, and malformed country are rejected', () => {
  assert.throws(() => quote('US', 'ADMIN', 'weekly'), /Invalid subscription role/);
  assert.throws(() => quote('US', 'WORKER', 'quarterly'), /Unsupported subscription plan/);
  assert.throws(() => quote('not-a-country', 'WORKER', 'weekly'), /Invalid countryCode/);
});

test('caller-supplied pricing fields cannot affect the server resolver', () => {
  const resolved = quote('TR', 'WORKER', 'monthly', {
    amount: 0,
    currency: 'EGP',
    market: 'EGYPT',
    role: 'EMPLOYER',
    priceBookVersion: 'attacker-version',
  });
  assert.equal(resolved.amount, 169);
  assert.equal(resolved.currency, 'TRY');
  assert.equal(resolved.market, 'TURKEY');
  assert.equal(resolved.role, 'WORKER');
  assert.equal(resolved.priceBookVersion, SUBSCRIPTION_PRICE_BOOK_VERSION);
});
