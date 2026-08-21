import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpectedPayPalCharge, resolveExpectedProviderEvidence } from './payment.js';

test('EGP PayPal conversion is server-side, canonical, and independent of provider currency input', () => {
  assert.deepEqual(getExpectedPayPalCharge(300), {
    amount: '9.90',
    currency: 'USD',
  });
  assert.deepEqual(getExpectedPayPalCharge(1000), {
    amount: '33.00',
    currency: 'USD',
  });
});

test('Turkey subscription capture evidence uses persisted USD evidence without enabling direct TRY', () => {
  const expected = resolveExpectedProviderEvidence({
    paymentMethod: 'paypal',
    purpose: 'SUBSCRIPTION',
    amount: 169,
    currency: 'TRY',
    providerAmount: '4.23',
    providerCurrency: 'USD',
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
  });
  assert.deepEqual(expected, { amount: '4.23', currency: 'USD', persisted: true });
});
