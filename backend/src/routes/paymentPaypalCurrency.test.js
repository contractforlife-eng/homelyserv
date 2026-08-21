import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpectedPayPalCharge } from './payment.js';

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
