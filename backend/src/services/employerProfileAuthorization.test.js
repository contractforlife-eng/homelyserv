import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeEmployerProfileView,
  EMPLOYER_PROFILE_PUBLIC_FIELDS,
  EMPLOYER_PROFILE_CONTACT_FIELDS,
} from './employerProfileAuthorization.js';

const ids = {
  employer: '111111111111111111111111',
  otherEmployer: '222222222222222222222222',
  worker: '333333333333333333333333',
  workerProfile: '444444444444444444444444',
  hire: '555555555555555555555555',
};

const makeDb = ({ paid = false } = {}) => ({
  workerProfile: {
    findUnique: async ({ where }) => (
      where.userId === ids.worker || where.id === ids.workerProfile
        ? { id: ids.workerProfile, userId: ids.worker }
        : null
    ),
  },
  payment: {
    findMany: async () => paid ? [{
      status: 'completed',
      purpose: 'COMMISSION',
      hireId: ids.hire,
      userId: ids.employer,
      offerId: null,
      jobTitle: 'Cook',
      metadata: {},
      fulfillmentStatus: 'fulfilled',
    }] : [],
  },
  hire: {
    findFirst: async ({ where }) => paid
      && where.id?.in?.includes(ids.hire)
      && where.employerId === ids.employer
      && where.workerId === ids.workerProfile
      ? { id: ids.hire }
      : null,
  },
});

test('Employer can view their own profile and contact fields may be exposed', async () => {
  assert.deepEqual(await authorizeEmployerProfileView({
    requesterId: ids.employer,
    requesterRole: 'EMPLOYER',
    targetUserId: ids.employer,
    targetRole: 'EMPLOYER',
  }), { allowed: true, exposeContact: true, reason: 'OWN_PROFILE' });
});

test('unrelated Employer cannot view another Employer profile', async () => {
  assert.deepEqual(await authorizeEmployerProfileView({
    requesterId: ids.otherEmployer,
    requesterRole: 'EMPLOYER',
    targetUserId: ids.employer,
    targetRole: 'EMPLOYER',
  }), { allowed: false, exposeContact: false, reason: 'EMPLOYER_SELF_ONLY' });
});

test('Worker requires the existing paid commission relationship', async () => {
  const request = {
    requesterId: ids.worker,
    requesterRole: 'WORKER',
    targetUserId: ids.employer,
    targetRole: 'EMPLOYER',
  };

  assert.deepEqual(await authorizeEmployerProfileView({ ...request, db: makeDb() }), {
    allowed: false,
    exposeContact: false,
    reason: 'PAID_RELATIONSHIP_REQUIRED',
  });
  assert.deepEqual(await authorizeEmployerProfileView({ ...request, db: makeDb({ paid: true }) }), {
    allowed: true,
    exposeContact: true,
    reason: 'PAID_RELATIONSHIP',
  });
});

test('Admin and Support can view a safe Employer profile without contact exposure', async () => {
  for (const requesterRole of ['ADMIN', 'SUPPORT']) {
    assert.deepEqual(await authorizeEmployerProfileView({
      requesterId: ids.otherEmployer,
      requesterRole,
      targetUserId: ids.employer,
      targetRole: 'EMPLOYER',
    }), { allowed: true, exposeContact: false, reason: 'STAFF_ACCESS' });
  }
});

test('non-Employer targets are rejected', async () => {
  assert.deepEqual(await authorizeEmployerProfileView({
    requesterId: ids.otherEmployer,
    requesterRole: 'ADMIN',
    targetUserId: ids.worker,
    targetRole: 'WORKER',
  }), { allowed: false, exposeContact: false, reason: 'EMPLOYER_PROFILE_REQUIRED' });
});

test('profile projection allowlist excludes authentication and internal fields', () => {
  const allowed = new Set([
    ...EMPLOYER_PROFILE_PUBLIC_FIELDS,
    ...EMPLOYER_PROFILE_CONTACT_FIELDS,
  ]);
  for (const blockedField of [
    'password', 'passwordResetTokenHash', 'passwordResetExpiresAt', 'passwordResetAt',
    'mustChangePassword', 'emailVerificationTokenHash', 'emailVerificationExpiresAt',
    'emailVerificationLastSentAt', 'tokenVersion', 'suspensionReason', 'suspendedAt',
    'isSuspended', 'status', 'settings',
  ]) {
    assert.equal(allowed.has(blockedField), false, `${blockedField} must not be projected`);
  }
});
