import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPayPalSubscriptionOrderId,
  getPayPalProviderEvidenceMissingFilter,
  getPayPalProviderClaimTimestamp,
  isActionablePayPalSubscription,
  isPayPalProviderClaimStale,
  normalizePayPalSubscriptionAttemptKey,
} from './paypalSubscriptionIdempotency.js';

const input = {
  userId: 'user-1',
  purpose: 'SUBSCRIPTION',
  planId: 'monthly',
  purchaserRole: 'WORKER',
  attemptKey: 'attempt-1234567890',
};

test('same PayPal subscription attempt produces the same order id', () => {
  assert.equal(buildPayPalSubscriptionOrderId(input), buildPayPalSubscriptionOrderId(input));
  assert.notEqual(buildPayPalSubscriptionOrderId(input), buildPayPalSubscriptionOrderId({ ...input, attemptKey: 'attempt-0987654321' }));
  assert.notEqual(buildPayPalSubscriptionOrderId(input), buildPayPalSubscriptionOrderId({ ...input, planId: 'annual' }));
  assert.notEqual(buildPayPalSubscriptionOrderId(input), buildPayPalSubscriptionOrderId({ ...input, purchaserRole: 'EMPLOYER' }));
});

test('provider claim treats null and absent PayPal evidence as missing', () => {
  assert.deepEqual(getPayPalProviderEvidenceMissingFilter(), {
    AND: [
      { OR: [{ paypalOrderId: null }, { paypalOrderId: { isSet: false } }] },
      { OR: [{ approvalUrl: null }, { approvalUrl: { isSet: false } }] },
    ],
  });
});

test('attempt keys are validated and only actionable matching payments are reusable', () => {
  assert.equal(normalizePayPalSubscriptionAttemptKey('short'), null);
  assert.equal(normalizePayPalSubscriptionAttemptKey(input.attemptKey), input.attemptKey);
  assert.equal(isActionablePayPalSubscription({
    paymentMethod: 'paypal',
    purpose: 'SUBSCRIPTION',
    userId: input.userId,
    status: 'pending',
    metadata: { plan: input.planId, purchaserRole: input.purchaserRole },
  }, input), true);
  assert.equal(isActionablePayPalSubscription({
    paymentMethod: 'paypal',
    purpose: 'SUBSCRIPTION',
    userId: input.userId,
    status: 'failed',
    metadata: { plan: input.planId, purchaserRole: input.purchaserRole },
  }, input), false);
  assert.equal(isActionablePayPalSubscription({
    paymentMethod: 'paypal',
    purpose: 'SUBSCRIPTION',
    userId: input.userId,
    status: 'pending',
    metadata: { plan: 'annual', purchaserRole: input.purchaserRole },
  }, input), false);
});

test('claim freshness uses metadata first and existing Payment timestamps as fallback', () => {
  const now = Date.parse('2026-08-23T12:00:00.000Z');
  const recent = { metadata: { paypalProviderClaimedAt: '2026-08-23T11:59:30.000Z' }, updatedAt: '2026-08-23T11:00:00.000Z' };
  const old = { updatedAt: '2026-08-23T11:58:00.000Z' };
  assert.equal(getPayPalProviderClaimTimestamp(recent), Date.parse('2026-08-23T11:59:30.000Z'));
  assert.equal(isPayPalProviderClaimStale(recent, now), false);
  assert.equal(isPayPalProviderClaimStale(old, now), true);
});
