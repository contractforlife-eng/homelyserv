import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSubscriptionQuote } from './subscriptionQuoteService.js';

const user = (countryCode, role) => ({ countryCode, role });

test('Egypt Employer quote preserves current weekly/monthly purchasing and enables PayPal annual', () => {
  const quote = buildSubscriptionQuote(user('EG', 'EMPLOYER'));
  assert.equal(quote.market, 'EGYPT');
  assert.equal(quote.currency, 'EGP');
  assert.equal(quote.purchaserRole, 'EMPLOYER');
  assert.deepEqual(quote.plans, {
    weekly: { amount: 100, currency: 'EGP', durationDays: 7, purchaseEnabled: true },
    monthly: { amount: 300, currency: 'EGP', durationDays: 30, purchaseEnabled: true },
    annual: { amount: 2700, currency: 'EGP', durationDays: 365, purchaseEnabled: true },
  });
});

test('Egypt Worker quote preserves current weekly/monthly purchasing', () => {
  const quote = buildSubscriptionQuote(user('eg', 'WORKER'));
  assert.equal(quote.plans.weekly.amount, 75);
  assert.equal(quote.plans.monthly.amount, 200);
  assert.equal(quote.plans.annual.amount, 1800);
  assert.equal(quote.plans.annual.purchaseEnabled, true);
});

test('approved PayPal markets expose purchase-enabled weekly/monthly/annual plans', () => {
  for (const [countryCode, currency, weekly, annual] of [
    ['US', 'USD', 5.99, 149.99],
    ['DE', 'EUR', 4.99, 129.99],
    ['FR', 'EUR', 4.99, 129.99],
    ['GB', 'GBP', 4.99, 129.99],
    ['CA', 'USD', 5.99, 149.99],
    ['AE', 'USD', 5.99, 149.99],
  ]) {
    const quote = buildSubscriptionQuote(user(countryCode, 'EMPLOYER'));
    assert.equal(quote.currency, currency);
    assert.equal(quote.plans.weekly.amount, weekly);
    assert.equal(quote.plans.annual.amount, annual);
    assert.equal(quote.plans.weekly.purchaseEnabled, true);
    assert.equal(quote.plans.monthly.purchaseEnabled, true);
    assert.equal(quote.plans.annual.purchaseEnabled, true);
    for (const plan of Object.values(quote.plans)) {
      assert.equal(Object.hasOwn(plan, 'providerAmount'), false);
      assert.equal(Object.hasOwn(plan, 'providerCurrency'), false);
    }
  }
});

test('Turkey remains display-only', () => {
  const quote = buildSubscriptionQuote(user('TR', 'WORKER'));
  assert.equal(quote.plans.weekly.purchaseEnabled, false);
  assert.equal(quote.plans.monthly.purchaseEnabled, false);
  assert.equal(quote.plans.annual.purchaseEnabled, false);
});

test('Turkey becomes purchase-enabled only with a valid TRY/USD configuration', () => {
  const previous = {
    rate: process.env.TRY_USD_RATE,
    version: process.env.TRY_USD_RATE_VERSION,
    effectiveAt: process.env.TRY_USD_RATE_EFFECTIVE_AT,
    source: process.env.TRY_USD_RATE_SOURCE,
  };
  process.env.TRY_USD_RATE = '0.0208';
  process.env.TRY_USD_RATE_VERSION = '2026-08-21-v1';
  process.env.TRY_USD_RATE_EFFECTIVE_AT = new Date(Date.now() - 60_000).toISOString();
  process.env.TRY_USD_RATE_SOURCE = 'reviewed-mid-market';
  try {
    const quote = buildSubscriptionQuote(user('TR', 'WORKER'));
    assert.equal(quote.plans.weekly.purchaseEnabled, true);
    assert.equal(quote.plans.monthly.purchaseEnabled, true);
    assert.equal(quote.plans.annual.purchaseEnabled, true);
    for (const plan of Object.values(quote.plans)) {
      assert.equal(Object.hasOwn(plan, 'providerAmount'), false);
      assert.equal(Object.hasOwn(plan, 'providerCurrency'), false);
      assert.equal(Object.hasOwn(plan, 'exchangeRate'), false);
    }
  } finally {
    for (const [key, value] of Object.entries({
      TRY_USD_RATE: previous.rate,
      TRY_USD_RATE_VERSION: previous.version,
      TRY_USD_RATE_EFFECTIVE_AT: previous.effectiveAt,
      TRY_USD_RATE_SOURCE: previous.source,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Turkey remains disabled when the FX rate is missing or invalid', () => {
  const previous = {
    rate: process.env.TRY_USD_RATE,
    version: process.env.TRY_USD_RATE_VERSION,
    effectiveAt: process.env.TRY_USD_RATE_EFFECTIVE_AT,
    source: process.env.TRY_USD_RATE_SOURCE,
  };
  try {
    delete process.env.TRY_USD_RATE;
    process.env.TRY_USD_RATE_VERSION = '2026-08-21-v1';
    process.env.TRY_USD_RATE_EFFECTIVE_AT = new Date(Date.now() - 60_000).toISOString();
    process.env.TRY_USD_RATE_SOURCE = 'reviewed-mid-market';
    const quote = buildSubscriptionQuote(user('TR', 'EMPLOYER'));
    assert.equal(quote.plans.weekly.purchaseEnabled, false);
    assert.equal(quote.plans.monthly.purchaseEnabled, false);
    assert.equal(quote.plans.annual.purchaseEnabled, false);
  } finally {
    for (const [key, value] of Object.entries({
      TRY_USD_RATE: previous.rate,
      TRY_USD_RATE_VERSION: previous.version,
      TRY_USD_RATE_EFFECTIVE_AT: previous.effectiveAt,
      TRY_USD_RATE_SOURCE: previous.source,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('missing country preserves legacy EGP behavior with enabled PayPal annual quote', () => {
  const quote = buildSubscriptionQuote(user('', 'WORKER'));
  assert.equal(quote.market, 'LEGACY_EGP');
  assert.equal(quote.plans.weekly.purchaseEnabled, true);
  assert.equal(quote.plans.monthly.purchaseEnabled, true);
  assert.deepEqual(quote.plans.annual, {
    amount: 1800,
    currency: 'EGP',
    durationDays: 365,
    purchaseEnabled: true,
  });
});

test('database role and country are authoritative over caller-shaped extras', () => {
  const quote = buildSubscriptionQuote({
    countryCode: 'TR',
    role: 'WORKER',
    amount: 0,
    currency: 'EGP',
    market: 'EGYPT',
    purchaserRole: 'EMPLOYER',
  });
  assert.equal(quote.market, 'TURKEY');
  assert.equal(quote.purchaserRole, 'WORKER');
  assert.equal(quote.currency, 'TRY');
  assert.equal(quote.plans.monthly.amount, 169);
});

test('unsupported roles and malformed explicit country codes fail safely', () => {
  assert.throws(() => buildSubscriptionQuote(user('EG', 'ADMIN')), /Invalid subscription role/);
  assert.throws(() => buildSubscriptionQuote(user('not-a-country', 'WORKER')), /Invalid countryCode/);
});
