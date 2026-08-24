import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePremiumStatus } from './premiumStatus.js';

const now = new Date('2026-01-01T00:00:00.000Z');
const entitlement = (overrides = {}) => ({
  success: true,
  isPremium: true,
  active: true,
  subscription: {
    plan: 'monthly',
    source: 'paid',
    status: 'active',
    startDate: '2025-12-01T00:00:00.000Z',
    endDate: '2026-02-01T00:00:00.000Z',
    ...overrides,
  },
});

test('paid Premium is active', () => {
  assert.equal(normalizePremiumStatus(entitlement(), now).isPremium, true);
});

test('manual Premium is active without paid-plan metadata', () => {
  const status = normalizePremiumStatus(entitlement({ plan: 'manual', source: 'manual', isManual: true, isPaid: false }), now);
  assert.equal(status.isPremium, true);
  assert.equal(status.subscription.source, 'manual');
});

test('expired manual Premium is inactive', () => {
  const status = normalizePremiumStatus(entitlement({ plan: 'manual', source: 'manual', endDate: '2025-12-31T23:59:59.000Z' }), now);
  assert.equal(status.isPremium, false);
  assert.equal(status.subscription, null);
});

test('inactive paid Premium is inactive', () => {
  const status = normalizePremiumStatus(entitlement({ status: 'inactive' }), now);
  assert.equal(status.isPremium, false);
});

test('missing entitlement remains eligible for purchase presentation', () => {
  const status = normalizePremiumStatus({ success: true, isPremium: false, active: false, subscription: null }, now);
  assert.equal(status.active, false);
});
