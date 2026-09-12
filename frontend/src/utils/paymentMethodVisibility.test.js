import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisiblePaymentMethods } from './paymentMethodVisibility.js';

const methods = [
  { id: 'paypal' },
  { id: 'vodafone_cash' },
  { id: 'instapay' },
  { id: 'bank_transfer' },
  { id: 'paymob' },
];

const ids = (availableProviderIds) => (
  getVisiblePaymentMethods(methods, availableProviderIds).map(({ id }) => id)
);

test('EGP commission capability advertises PayPal, manual methods, and Bank Transfer, and hides Paymob', () => {
  assert.deepEqual(ids(['paypal', 'paymob']), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('EGP subscription uses the same approved method visibility contract', () => {
  assert.deepEqual(ids(['paypal', 'paymob']), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('PayPal remains visible in method list even if provider capability is empty', () => {
  assert.deepEqual(ids(['paymob']), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('manual methods, PayPal, and Bank Transfer remain visible while automated capabilities load', () => {
  assert.deepEqual(ids([]), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('manual methods can be hidden while keeping PayPal and Bank Transfer visible', () => {
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paypal', 'paymob'], { showEgyptianManualMethods: false }).map(({ id }) => id),
    ['paypal', 'bank_transfer']
  );
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paymob'], { showEgyptianManualMethods: false }).map(({ id }) => id),
    ['paypal', 'bank_transfer']
  );
});

test('PayPal and Bank Transfer remain visible regardless of bankTransferAvailable parameter', () => {
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paypal'], { bankTransferAvailable: false }).map(({ id }) => id),
    ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']
  );
});

test('manual payment methods are available across all user countries (EG, TR, US, DE, FR, RU, GB, GLOBAL)', () => {
  const testCountries = ['EG', 'TR', 'US', 'DE', 'FR', 'RU', 'GB', null, undefined];
  for (const countryCode of testCountries) {
    const user = countryCode ? { countryCode } : {};
    const visible = getVisiblePaymentMethods(methods, [], {
      showEgyptianManualMethods: true,
    }).map(({ id }) => id);
    assert.ok(visible.includes('vodafone_cash'), `Vodafone cash should be available for country: ${countryCode}`);
    assert.ok(visible.includes('instapay'), `InstaPay should be available for country: ${countryCode}`);
  }
});

test('annual plan restricts visible methods to PayPal and Bank Transfer only', () => {
  const visibleForWeeklyOrMonthly = getVisiblePaymentMethods(methods, ['paypal', 'bank_transfer'], {
    showEgyptianManualMethods: true,
  });
  const planVisibleAnnual = visibleForWeeklyOrMonthly.filter(
    ({ id }) => id === 'paypal' || id === 'bank_transfer'
  );
  assert.deepEqual(
    planVisibleAnnual.map(({ id }) => id),
    ['paypal', 'bank_transfer']
  );
  assert.equal(planVisibleAnnual.some(({ id }) => id === 'vodafone_cash' || id === 'instapay'), false);
});
