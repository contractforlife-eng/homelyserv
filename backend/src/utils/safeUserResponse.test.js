import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUserResponse } from './safeUserResponse.js';

test('sanitized user responses exclude authentication secrets and metadata', () => {
  const result = sanitizeUserResponse({
    id: 'user-1',
    fullName: 'Support User',
    password: 'hash',
    passwordResetTokenHash: 'reset-hash',
    emailVerificationTokenHash: 'verification-hash',
    tokenVersion: 4,
    refreshToken: 'refresh-token',
  });

  assert.deepEqual(result, { id: 'user-1', fullName: 'Support User' });
});
