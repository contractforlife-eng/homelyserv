import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../models/User.js';
import { createTokenRecord, hashToken, verifyEmailWithToken } from './verificationService.js';

test('verification tokens remain URL-safe and use a 24-hour TTL', () => {
  const before = Date.now() + (24 * 60 * 60 * 1000);
  const record = createTokenRecord();
  const after = Date.now() + (24 * 60 * 60 * 1000);
  assert.match(record.rawToken, /^[A-Za-z0-9_-]+$/);
  assert.equal(record.tokenHash, hashToken(record.rawToken));
  assert.ok(record.expiresAt.getTime() >= before - 5);
  assert.ok(record.expiresAt.getTime() <= after + 5);
});

test('verification claims the token atomically and clears it', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const originalFindOne = User.findOne;
  let capturedFilter;
  let capturedUpdate;

  User.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return { _id: 'verified-user', emailVerified: true };
  };
  User.findOne = () => ({ select: async () => null });

  try {
    const result = await verifyEmailWithToken('atomic-test-token');
    assert.equal(result.success, true);
    assert.equal(result.status, 'verified');
    assert.equal(capturedFilter.emailVerificationTokenHash, hashToken('atomic-test-token'));
    assert.deepEqual(capturedFilter.emailVerified, { $ne: true });
    assert.ok(capturedFilter.emailVerificationExpiresAt.$gt instanceof Date);
    assert.equal(capturedUpdate.$set.emailVerified, true);
    assert.equal(capturedUpdate.$unset.emailVerificationTokenHash, 1);
    assert.equal(capturedUpdate.$unset.emailVerificationExpiresAt, 1);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
    User.findOne = originalFindOne;
  }
});

test('a consumed or superseded token is classified without mutation', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const originalFindOne = User.findOne;
  User.findOneAndUpdate = async () => null;
  User.findOne = () => ({ select: async () => null });

  try {
    const result = await verifyEmailWithToken('consumed-token');
    assert.deepEqual(result, { success: false, status: 'invalid' });
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
    User.findOne = originalFindOne;
  }
});
