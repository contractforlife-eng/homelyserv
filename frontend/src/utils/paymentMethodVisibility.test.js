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

test('EGP commission capability advertises PayPal plus manual methods and hides Paymob', () => {
  assert.deepEqual(ids(['paypal', 'paymob']), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('EGP subscription uses the same approved method visibility contract', () => {
  assert.deepEqual(ids(['paypal', 'paymob']), ['paypal', 'vodafone_cash', 'instapay', 'bank_transfer']);
});

test('a Paymob-only capability response does not fabricate an unavailable PayPal checkout', () => {
  assert.deepEqual(ids(['paymob']), ['vodafone_cash', 'instapay', 'bank_transfer']);
});

test('manual methods remain visible while automated capabilities load', () => {
  assert.deepEqual(ids([]), ['vodafone_cash', 'instapay', 'bank_transfer']);
});

test('manual methods can be hidden without changing PayPal capability filtering', () => {
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paypal', 'paymob'], { showEgyptianManualMethods: false }).map(({ id }) => id),
    ['paypal', 'bank_transfer']
  );
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paymob'], { showEgyptianManualMethods: false }).map(({ id }) => id),
    ['bank_transfer']
  );
});

test('currency-specific Bank Transfer capability hides only unavailable Bank Transfer', () => {
  assert.deepEqual(
    getVisiblePaymentMethods(methods, ['paypal'], { bankTransferAvailable: false }).map(({ id }) => id),
    ['paypal', 'vodafone_cash', 'instapay']
  );
});
