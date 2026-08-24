import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCanonicalPremiumState,
  createInitialPremiumState,
  createUnknownPremiumState,
  preservePremiumStateForUser,
} from './premiumSessionState.js';

const now = new Date('2026-01-01T00:00:00.000Z');
const response = (isPremium, plan = 'monthly') => ({
  success: true,
  isPremium,
  active: isPremium,
  subscription: isPremium ? {
    plan,
    source: plan === 'manual' ? 'manual' : 'paid',
    status: 'active',
    startDate: '2025-12-01T00:00:00.000Z',
    endDate: '2027-02-01T00:00:00.000Z',
  } : null,
});

test('unknown is distinct from explicit non-Premium', () => {
  assert.equal(createUnknownPremiumState('worker').known, false);
  assert.equal(createUnknownPremiumState('worker').isPremium, null);
  assert.deepEqual(createInitialPremiumState('worker', { isPremium: false }), {
    userId: 'worker', known: true, isPremium: false, subscription: null,
  });
});

test('known Premium is preserved during route re-entry/refetch', () => {
  const known = applyCanonicalPremiumState('worker', response(true));
  assert.equal(preservePremiumStateForUser(known, 'worker', {}).isPremium, true);
});

test('known non-Premium remains non-Premium during refetch', () => {
  const known = applyCanonicalPremiumState('worker', response(false));
  assert.equal(preservePremiumStateForUser(known, 'worker', {}).isPremium, false);
});

test('canonical responses update Premium state in both directions', () => {
  assert.equal(applyCanonicalPremiumState('worker', response(true)).isPremium, true);
  assert.equal(applyCanonicalPremiumState('worker', response(false)).isPremium, false);
});

test('manual and paid canonical sources remain presentation-equivalent', () => {
  const paid = applyCanonicalPremiumState('worker', response(true, 'monthly'));
  const manual = applyCanonicalPremiumState('worker', response(true, 'manual'));
  assert.equal(paid.isPremium, true);
  assert.equal(manual.isPremium, true);
  assert.equal(manual.subscription.source, 'manual');
  assert.equal(new Date(manual.subscription.endDate) > now, true);
});

test('localStorage is not consulted by session state', () => {
  assert.equal(createInitialPremiumState('worker', {}).known, false);
});
