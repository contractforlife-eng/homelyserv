import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBankTransferOrderId,
  isActionableBankTransfer,
  normalizeBankTransferAttemptKey,
} from './bankTransferIdempotency.js';

test('same logical attempt produces the same deterministic order id', () => {
  const input = { userId: 'user-1', purpose: 'SUBSCRIPTION', planId: 'monthly', attemptKey: 'attempt-1234567890' };
  assert.equal(buildBankTransferOrderId(input), buildBankTransferOrderId(input));
  assert.notEqual(buildBankTransferOrderId(input), buildBankTransferOrderId({ ...input, planId: 'yearly' }));
  assert.notEqual(buildBankTransferOrderId(input), buildBankTransferOrderId({ ...input, hireId: 'hire-1', purpose: 'COMMISSION', planId: '' }));
});

test('attempt keys are narrowly validated and actionable states are reusable', () => {
  assert.equal(normalizeBankTransferAttemptKey('short'), null);
  assert.equal(normalizeBankTransferAttemptKey('attempt-1234567890'), 'attempt-1234567890');
  assert.equal(isActionableBankTransfer({ paymentMethod: 'bank_transfer', currency: 'USD', status: 'pending', manualReviewState: 'awaiting_transfer' }), true);
  assert.equal(isActionableBankTransfer({ paymentMethod: 'bank_transfer', currency: 'USD', status: 'completed', manualReviewState: 'verified' }), false);
  assert.equal(isActionableBankTransfer({ paymentMethod: 'bank_transfer', currency: 'EUR', status: 'pending', manualReviewState: 'awaiting_transfer' }), false);
});
