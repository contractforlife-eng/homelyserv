import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSubscriptionGrantSnapshot } from './subscriptionGrantService.js';
import { reconcileSubscriptionRefund } from './subscriptionRefundReconciliationService.js';
import { isManualPremiumTargetRole, normalizePlanProjection } from './premiumService.js';
import { getSubscriptionPlan } from '../config/subscription.js';
import { getProviderCapability } from '../config/providerCapabilities.js';

test('annual grant snapshots accept exactly 365 days', () => {
  const snapshot = resolveSubscriptionGrantSnapshot({
    plan: 'annual',
    purchaserRole: 'EMPLOYER',
    durationDays: 365,
  }, 'WORKER');

  assert.deepEqual(snapshot, {
    plan: 'annual',
    purchaserRole: 'EMPLOYER',
    durationDays: 365,
    legacy: false,
  });
  assert.throws(() => resolveSubscriptionGrantSnapshot({
    plan: 'annual', purchaserRole: 'EMPLOYER', durationDays: 364,
  }, 'WORKER'), /duration snapshot is invalid/);
});

test('weekly, monthly, and legacy subscription durations remain unchanged', () => {
  assert.equal(resolveSubscriptionGrantSnapshot({ plan: 'weekly', purchaserRole: 'WORKER', durationDays: 7 }).durationDays, 7);
  assert.equal(resolveSubscriptionGrantSnapshot({ plan: 'monthly', purchaserRole: 'WORKER', durationDays: 30 }).durationDays, 30);
  assert.deepEqual(resolveSubscriptionGrantSnapshot({}, 'EMPLOYER'), {
    plan: 'legacy_monthly', purchaserRole: 'EMPLOYER', durationDays: 30, legacy: true,
  });
});

test('annual refund reconciliation recognizes a valid annual grant snapshot', () => {
  const startsAt = new Date('2026-01-01T00:00:00.000Z');
  const endsAt = new Date('2027-01-01T00:00:00.000Z');
  const result = reconcileSubscriptionRefund({
    id: 'payment-annual',
    purpose: 'SUBSCRIPTION',
    userId: 'user-annual',
    status: 'completed',
    fulfillmentStatus: 'fulfilled',
    providerAmount: '149.99',
    providerCurrency: 'USD',
    metadata: { plan: 'annual', purchaserRole: 'EMPLOYER', durationDays: 365 },
    Refunds: [],
    SubscriptionGrant: {
      paymentId: 'payment-annual',
      userId: 'user-annual',
      plan: 'annual',
      purchaserRole: 'EMPLOYER',
      durationDays: 365,
      startsAt,
      endsAt,
      status: 'active',
    },
  });

  assert.equal(result.state, 'MATCHED');
  assert.equal(result.grantPlan, 'annual');
  assert.equal(result.grantDurationDays, 365);
});

test('annual projection is distinct while manual and legacy plans remain unchanged', () => {
  assert.equal(normalizePlanProjection('annual'), 'annual');
  assert.equal(normalizePlanProjection('weekly'), 'weekly');
  assert.equal(normalizePlanProjection('monthly'), 'monthly');
  assert.equal(normalizePlanProjection('manual'), 'manual');
  assert.equal(normalizePlanProjection('legacy_monthly'), 'legacy_monthly');
  assert.equal(normalizePlanProjection('historical_plan'), 'legacy_unknown');
});

test('manual Premium target roles are limited to Employer and Worker', () => {
  assert.equal(isManualPremiumTargetRole('EMPLOYER'), true);
  assert.equal(isManualPremiumTargetRole('worker'), true);
  assert.equal(isManualPremiumTargetRole('ADMIN'), false);
  assert.equal(isManualPremiumTargetRole('SUPPORT'), false);
  assert.equal(isManualPremiumTargetRole(''), false);
});

test('the current automated/manual purchase authority recognizes annual', () => {
  assert.equal(getSubscriptionPlan('annual').durationDays, 365);
  assert.equal(getSubscriptionPlan('weekly').durationDays, 7);
  assert.equal(getSubscriptionPlan('monthly').durationDays, 30);
  assert.equal(getProviderCapability({
    provider: 'paypal', purpose: 'SUBSCRIPTION', transactionCurrency: 'USD',
  }).supported, false);
});
