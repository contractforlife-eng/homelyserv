import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSubscriptionStatusPayload, normalizePayPalOrderStatus } from './payment.js';

const now = new Date('2026-01-01T00:00:00.000Z');

const entitlement = (overrides = {}) => ({
  plan: 'monthly',
  status: 'active',
  startDate: new Date('2025-12-01T00:00:00.000Z'),
  endDate: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides,
});

test('paid Subscription entitlement is returned as active Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement(), now);
  assert.equal(payload.isPremium, true);
  assert.equal(payload.active, true);
  assert.equal(payload.subscription.source, 'paid');
  assert.equal(payload.subscription.plan, 'monthly');
});

test('ManualPremiumGrant entitlement is returned as active Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ plan: 'manual' }), now);
  assert.equal(payload.isPremium, true);
  assert.equal(payload.subscription.source, 'manual');
  assert.equal(payload.subscription.isManual, true);
});

test('expired manual grant is not returned as Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ plan: 'manual', endDate: new Date('2025-12-31T23:59:59.000Z') }), now);
  assert.equal(payload.isPremium, false);
  assert.equal(payload.subscription, null);
});

test('inactive paid Subscription is not returned as Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ status: 'inactive' }), now);
  assert.equal(payload.isPremium, false);
  assert.equal(payload.active, false);
});

test('status normalization preserves paid and manual expiry boundaries', () => {
  assert.equal(buildSubscriptionStatusPayload(entitlement({ endDate: now }), now).isPremium, true);
  assert.equal(buildSubscriptionStatusPayload(entitlement({ plan: 'manual', endDate: now }), now).isPremium, false);
});

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
