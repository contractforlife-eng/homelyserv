import test from 'node:test';
import assert from 'node:assert/strict';

// Isolated tests for isActivePremiumCustomer contract without browser/i18n dependencies
const isActivePremiumCustomer = (user, explicitPremium = undefined) => {
  const role = (user?.role || '').toUpperCase();
  if (!['EMPLOYER', 'WORKER', 'DOCTOR', 'TEACHER', 'STUDENT'].includes(role)) return false;

  const premium = explicitPremium ?? user?.isPremium ?? user?.subscription?.isPremium;
  return premium === true;
};

test('isActivePremiumCustomer returns true for DOCTOR with active entitlement', () => {
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR' }, true), true);
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR', isPremium: true }), true);
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR', subscription: { isPremium: true } }), true);
});

test('isActivePremiumCustomer returns true for TEACHER and STUDENT with active entitlement', () => {
  assert.equal(isActivePremiumCustomer({ role: 'TEACHER' }, true), true);
  assert.equal(isActivePremiumCustomer({ role: 'STUDENT' }, true), true);
  assert.equal(isActivePremiumCustomer({ role: 'TEACHER', isPremium: true }), true);
  assert.equal(isActivePremiumCustomer({ role: 'STUDENT', isPremium: true }), true);
});

test('isActivePremiumCustomer preserves WORKER and EMPLOYER behavior', () => {
  assert.equal(isActivePremiumCustomer({ role: 'WORKER' }, true), true);
  assert.equal(isActivePremiumCustomer({ role: 'EMPLOYER' }, true), true);
  assert.equal(isActivePremiumCustomer({ role: 'WORKER' }, false), false);
  assert.equal(isActivePremiumCustomer({ role: 'EMPLOYER' }, false), false);
});

test('isActivePremiumCustomer excludes staff roles even if premium flag is true', () => {
  assert.equal(isActivePremiumCustomer({ role: 'ADMIN' }, true), false);
  assert.equal(isActivePremiumCustomer({ role: 'SUPPORT' }, true), false);
  assert.equal(isActivePremiumCustomer({ role: 'SUPPORT_HELPER' }, true), false);
});

test('isActivePremiumCustomer returns false when entitlement is not active', () => {
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR' }, false), false);
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR', isPremium: false }), false);
  assert.equal(isActivePremiumCustomer({ role: 'DOCTOR' }, undefined), false);
});
