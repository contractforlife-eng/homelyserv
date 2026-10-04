// backend/src/services/hireAuthorization.test.js
// ============================================================
// Regression tests for the shared hire authorization rules.
// Proves that the Employer hiring behaviour is unchanged, that
// TEACHER/DOCTOR can hire WORKER accounts, that they can NEVER hire a
// non-WORKER role, and that no other role may open a hire offer.
// Run: node --test src/services/hireAuthorization.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HIRING_CALLER_ROLES,
  EMPLOYABLE_PROVIDER_ROLES,
  PROVIDER_HIRER_ROLES,
  canSendHireOffer,
  isProviderHirerRole,
  resolveAllowedOfferTargetRoles,
  canHireTargetRole,
} from './hireAuthorization.js';

const NON_WORKER_ROLES = [
  'EMPLOYER',
  'DOCTOR',
  'TEACHER',
  'STUDENT',
  'ADMIN',
  'SUPPORT',
  'SUPPORT_HELPER',
  'USER',
];

test('EMPLOYER, TEACHER and DOCTOR may open a hire offer', () => {
  assert.deepEqual([...HIRING_CALLER_ROLES], ['EMPLOYER', 'TEACHER', 'DOCTOR']);
  for (const role of ['EMPLOYER', 'TEACHER', 'DOCTOR', 'employer', 'Teacher', 'DOCTOR']) {
    assert.equal(canSendHireOffer(role), true, role);
  }
});

test('No other role may open a hire offer', () => {
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER', 'USER', '', null, undefined]) {
    assert.equal(canSendHireOffer(role), false, String(role));
  }
});

test('EMPLOYER behaviour is unchanged: any employable service provider', () => {
  assert.deepEqual(resolveAllowedOfferTargetRoles('EMPLOYER'), [...EMPLOYABLE_PROVIDER_ROLES]);
  assert.equal(canHireTargetRole('EMPLOYER', 'WORKER'), true);
  assert.equal(canHireTargetRole('EMPLOYER', 'DOCTOR'), true);
  assert.equal(canHireTargetRole('EMPLOYER', 'TEACHER'), true);
  assert.equal(canHireTargetRole('EMPLOYER', 'STUDENT'), false);
  assert.equal(canHireTargetRole('EMPLOYER', 'SUPPORT_HELPER'), false);
});

test('TEACHER may hire a WORKER', () => {
  assert.equal(isProviderHirerRole('TEACHER'), true);
  assert.deepEqual(resolveAllowedOfferTargetRoles('TEACHER'), ['WORKER']);
  assert.equal(canHireTargetRole('TEACHER', 'WORKER'), true);
});

test('TEACHER cannot hire any non-WORKER role', () => {
  for (const role of NON_WORKER_ROLES) {
    assert.equal(canHireTargetRole('TEACHER', role), false, role);
  }
});

test('DOCTOR may hire a WORKER', () => {
  assert.equal(isProviderHirerRole('DOCTOR'), true);
  assert.deepEqual(resolveAllowedOfferTargetRoles('DOCTOR'), ['WORKER']);
  assert.equal(canHireTargetRole('DOCTOR', 'WORKER'), true);
});

test('DOCTOR cannot hire any non-WORKER role', () => {
  for (const role of NON_WORKER_ROLES) {
    assert.equal(canHireTargetRole('DOCTOR', role), false, role);
  }
});

test('PROVIDER_HIRER_ROLES is exactly TEACHER and DOCTOR', () => {
  assert.deepEqual([...PROVIDER_HIRER_ROLES], ['TEACHER', 'DOCTOR']);
});