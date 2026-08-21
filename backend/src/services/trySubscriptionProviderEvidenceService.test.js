import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isTurkeySubscriptionPayment,
  resolvePersistedTrySubscriptionEvidence,
  resolveTrySubscriptionProviderEvidence,
  resolveTrySubscriptionProviderEvidenceForUser,
  TRY_TO_USD_CONVERTED_MODE,
} from './trySubscriptionProviderEvidenceService.js';

const FX = Object.freeze({
  baseCurrency: 'TRY',
  quoteCurrency: 'USD',
  rate: '0.025',
  rateDirection: 'TRY_TO_USD',
  rateVersion: 'TEST-TRY-USD-v1',
  effectiveAt: '2026-08-20T00:00:00.000Z',
  source: 'TEST_FIXTURE_ONLY',
});

const snapshot = (plan, role, durationDays) => ({
  plan,
  purchaserRole: role,
  durationDays,
  market: 'TURKEY',
  countryCode: 'TR',
  priceBookVersion: '2026-08-v1',
});

const payment = (overrides = {}) => {
  const metadata = {
    ...snapshot('monthly', 'WORKER', 30),
    exchangeRate: FX.rate,
    rateDirection: FX.rateDirection,
    exchangeRateSource: FX.source,
    exchangeRateVersion: FX.rateVersion,
    exchangeRateTimestamp: FX.effectiveAt,
  };
  return {
    id: 'payment-1',
    paymentMethod: 'paypal',
    purpose: 'SUBSCRIPTION',
    amount: 169,
    currency: 'TRY',
    providerAmount: '4.23',
    providerCurrency: 'USD',
    metadata,
    ...overrides,
  };
};

test('resolves all Turkey plans and roles through one internal conversion mode', () => {
  const cases = [
    [69, 'WORKER', 'weekly', 7, '1.73'],
    [169, 'WORKER', 'monthly', 30, '4.23'],
    [1399, 'WORKER', 'annual', 365, '34.98'],
    [99, 'EMPLOYER', 'weekly', 7, '2.48'],
    [249, 'EMPLOYER', 'monthly', 30, '6.23'],
    [1999, 'EMPLOYER', 'annual', 365, '49.98'],
  ];
  for (const [bookAmount, role, plan, durationDays, providerAmount] of cases) {
    const result = resolveTrySubscriptionProviderEvidence({
      bookAmount,
      subscriptionSnapshot: snapshot(plan, role, durationDays),
      fxConfig: FX,
      now: Date.parse('2026-08-21T00:00:00.000Z'),
    });
    assert.equal(result.mode, TRY_TO_USD_CONVERTED_MODE);
    assert.equal(result.providerAmount, providerAmount);
    assert.equal(result.providerCurrency, 'USD');
    assert.equal(result.fxMetadata.rateDirection, 'TRY_TO_USD');
  }
});

test('server-authoritative user entry point ignores client-shaped pricing fields', () => {
  const result = resolveTrySubscriptionProviderEvidenceForUser({
    user: {
      role: 'worker',
      countryCode: ' tr ',
      amount: 1,
      currency: 'USD',
      market: 'GLOBAL',
    },
    plan: 'monthly',
    fxConfig: FX,
    now: Date.parse('2026-08-21T00:00:00.000Z'),
  });
  assert.equal(result.subscriptionSnapshot.purchaserRole, 'WORKER');
  assert.equal(result.subscriptionSnapshot.market, 'TURKEY');
  assert.equal(result.subscriptionSnapshot.plan, 'monthly');
  assert.equal(result.providerAmount, '4.23');
});

test('persisted Turkey evidence validates against the stored FX snapshot', () => {
  const result = resolvePersistedTrySubscriptionEvidence(payment());
  assert.equal(result.mode, TRY_TO_USD_CONVERTED_MODE);
  assert.equal(result.providerAmount, '4.23');
});

test('persisted evidence rejects tampered provider amount, currency, or FX metadata', () => {
  for (const overrides of [
    { providerAmount: '4.24' },
    { providerCurrency: 'TRY' },
    { metadata: { ...payment().metadata, rateDirection: 'USD_TO_TRY' } },
    { metadata: { ...payment().metadata, market: 'GLOBAL' } },
    { metadata: { ...payment().metadata, countryCode: 'US' } },
    { metadata: { ...payment().metadata, durationDays: 365 } },
    { metadata: { ...payment().metadata, exchangeRateVersion: '' } },
  ]) {
    assert.throws(() => resolvePersistedTrySubscriptionEvidence(payment(overrides)));
  }
});

test('direct TRY and non-Turkey payments are not classified as Turkey converted payments', () => {
  assert.equal(isTurkeySubscriptionPayment(payment()), true);
  assert.equal(isTurkeySubscriptionPayment(payment({ providerCurrency: 'TRY' })), false);
  assert.equal(isTurkeySubscriptionPayment(payment({ currency: 'USD' })), false);
  assert.equal(isTurkeySubscriptionPayment(payment({ purpose: 'COMMISSION' })), false);
});
