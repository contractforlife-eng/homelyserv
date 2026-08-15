import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePayPalOrderStatus } from './payment.js';

test('PayPal statuses are normalized without treating buyer-action states as approved', () => {
  for (const status of ['CREATED', 'SAVED', 'PAYER_ACTION_REQUIRED']) {
    assert.equal(normalizePayPalOrderStatus(status), 'AWAITING_APPROVAL');
  }
  assert.equal(normalizePayPalOrderStatus('APPROVED'), 'APPROVED');
  assert.equal(normalizePayPalOrderStatus('COMPLETED'), 'COMPLETED');
});

test('terminal PayPal statuses do not invite further approval polling', () => {
  for (const status of ['VOIDED', 'FAILED', 'CANCELLED', 'DECLINED']) {
    assert.equal(normalizePayPalOrderStatus(status), 'TERMINAL');
  }
  assert.equal(normalizePayPalOrderStatus('unexpected'), 'UNKNOWN');
});
