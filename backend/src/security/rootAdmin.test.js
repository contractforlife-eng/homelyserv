import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOT_ADMIN_EMAIL, isRecoveryEmail, isRootAdmin, isRootAdminId } from './rootAdmin.js';

test('Root Admin identity comparison is normalized and role-independent', () => {
  assert.equal(ROOT_ADMIN_EMAIL, 'emad@homelyserv.com');
  assert.equal(isRootAdmin({ email: '  EMAD@HOMELYSERV.COM ' }), true);
  assert.equal(isRootAdmin({ email: 'other@homelyserv.com', role: 'ADMIN' }), false);
});

test('Root Admin lookup supports canonical ObjectId and legacy email request identities', async () => {
  const calls = [];
  const User = {
    findById(id) {
      calls.push(['id', id]);
      return { select: async () => ({ email: 'EMAD@HomelyServ.com', role: 'ADMIN' }) };
    },
    findOne(query) {
      calls.push(['email', query.email]);
      return { select: async () => ({ email: 'emad@homelyserv.com', role: 'ADMIN' }) };
    },
  };

  assert.equal(await isRootAdminId(User, '507f1f77bcf86cd799439011'), true);
  assert.equal(await isRootAdminId(User, ' EMAD@HOMELYSERV.COM '), true);
  assert.deepEqual(calls, [
    ['id', '507f1f77bcf86cd799439011'],
    ['email', 'emad@homelyserv.com'],
  ]);
});

test('recovery identity is read only from backend configuration', () => {
  const previous = process.env.ROOT_ADMIN_RECOVERY_EMAIL;
  process.env.ROOT_ADMIN_RECOVERY_EMAIL = 'recovery@example.test';
  try {
    assert.equal(isRecoveryEmail(' RECOVERY@EXAMPLE.TEST '), true);
    assert.equal(isRecoveryEmail('other@example.test'), false);
  } finally {
    if (previous === undefined) delete process.env.ROOT_ADMIN_RECOVERY_EMAIL;
    else process.env.ROOT_ADMIN_RECOVERY_EMAIL = previous;
  }
});
