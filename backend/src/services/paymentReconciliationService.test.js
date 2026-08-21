import assert from 'node:assert/strict';
import test from 'node:test';
import reconcilePayment from './paymentReconciliationService.js';

const payment = (overrides = {}) => ({
  id: 'payment-1',
  paymentMethod: 'paypal',
  purpose: 'SUBSCRIPTION',
  amount: 169,
  currency: 'TRY',
  providerAmount: '4.23',
  providerCurrency: 'USD',
  status: 'pending',
  fulfillmentStatus: 'pending',
  metadata: {
    plan: 'monthly',
    purchaserRole: 'WORKER',
    durationDays: 30,
    market: 'TURKEY',
    countryCode: 'TR',
    priceBookVersion: '2026-08-v1',
    exchangeRate: '0.025',
    rateDirection: 'TRY_TO_USD',
    exchangeRateSource: 'TEST_FIXTURE_ONLY',
    exchangeRateVersion: 'TEST-TRY-USD-v1',
    exchangeRateTimestamp: '2026-08-20T00:00:00.000Z',
  },
  Refunds: [],
  ...overrides,
});

test('accepts valid persisted Turkey TRY/USD provider evidence', () => {
  const result = reconcilePayment(payment());
  assert.equal(result.state, 'MATCHED');
  assert.equal(result.acquisition.mode, 'TRY_TO_USD_CONVERTED');
});

test('rejects wrong provider amount, currency, and missing FX snapshot', () => {
  for (const overrides of [
    { providerAmount: '4.24' },
    { providerCurrency: 'EUR' },
    { metadata: { ...payment().metadata, exchangeRateVersion: undefined } },
    { metadata: { ...payment().metadata, exchangeRate: undefined } },
  ]) {
    const result = reconcilePayment(payment(overrides));
    assert.equal(result.state, 'MISMATCH');
    assert.ok(result.reasons.length > 0);
  }
});

test('rejects wrong Turkey market identity, book currency, and direct TRY evidence', () => {
  for (const overrides of [
    { metadata: { ...payment().metadata, market: 'GLOBAL' } },
    { metadata: { ...payment().metadata, countryCode: 'US' } },
    { currency: 'USD' },
    { providerCurrency: 'TRY' },
  ]) {
    const result = reconcilePayment(payment(overrides));
    assert.equal(result.state, 'MISMATCH');
  }
});

test('uses the persisted snapshot and rejects a changed persisted rate', () => {
  const result = reconcilePayment(payment({ metadata: { ...payment().metadata, exchangeRate: '0.030' } }));
  assert.equal(result.state, 'MISMATCH');
  assert.ok(result.reasons.some(({ code }) => code === 'INVALID_TRY_SUBSCRIPTION_FX_SNAPSHOT'));
});
