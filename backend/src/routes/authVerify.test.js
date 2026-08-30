import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authRouter from './auth.js';

const secret = 'auth-verify-test-secret-value-2026';
const userId = '507f1f77bcf86cd799439011';
process.env.JWT_SECRET = secret;

const tokenFor = (tokenVersion = 0) => jwt.sign(
  { userId, role: 'WORKER', tokenVersion },
  secret,
  { expiresIn: '7d' }
);

const createUser = ({ tokenVersion = 0, status = 'ACTIVE' } = {}) => ({
  _id: userId,
  fullName: 'Verify Test User',
  email: 'verify-test@example.com',
  role: 'WORKER',
  status,
  isSuspended: status === 'SUSPENDED',
  tokenVersion,
  password: 'not-returned',
  toObject() {
    return { ...this };
  }
});

const withServer = async ({ currentVersion = 0, user = createUser() } = {}, run) => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async (selection) => {
      if (selection === 'tokenVersion isSuspended') {
        return user ? { tokenVersion: currentVersion, isSuspended: user.isSuspended } : null;
      }
      if (selection === '-password') {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          toObject: user.toObject
        };
      }
      return user;
    }
  });

  const app = express();
  app.use('/api/auth', authRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
};

const getVerify = (base, token) => fetch(`${base}/api/auth/verify`, {
  headers: { authorization: `Bearer ${token}` }
});

test('valid current JWT keeps the existing verify response shape', async () => {
  await withServer({}, async (base) => {
    const response = await getVerify(base, tokenFor(0));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.user.fullName, 'Verify Test User');
    assert.equal(body.user.password, undefined);
  });
});

test('expired or invalid JWT is rejected', async () => {
  await withServer({}, async (base) => {
    const expired = jwt.sign({ userId, role: 'WORKER', tokenVersion: 0 }, secret, { expiresIn: '-1s' });
    const invalid = `${tokenFor(0)}-invalid`;

    assert.equal((await getVerify(base, expired)).status, 401);
    assert.equal((await getVerify(base, invalid)).status, 401);
  });
});

test('tokenVersion mismatch is rejected by the shared middleware', async () => {
  await withServer({ currentVersion: 2 }, async (base) => {
    const response = await getVerify(base, tokenFor(1));
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'JWT_TOKEN_VERSION_MISMATCH');
  });
});

test('missing user is rejected by the shared middleware', async () => {
  await withServer({ user: null }, async (base) => {
    const response = await getVerify(base, tokenFor(0));
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'JWT_USER_NOT_FOUND');
  });
});

test('suspended users are rejected by the shared middleware', async () => {
  await withServer({ user: createUser({ status: 'SUSPENDED' }) }, async (base) => {
    const response = await getVerify(base, tokenFor(0));
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.code, 'ACCOUNT_SUSPENDED');
  });
});

test('reactivating a user restores access for an otherwise valid JWT', async () => {
  const user = createUser({ status: 'SUSPENDED' });
  await withServer({ user }, async (base) => {
    const suspendedResponse = await getVerify(base, tokenFor(0));
    assert.equal(suspendedResponse.status, 403);

    user.isSuspended = false;
    user.status = 'ACTIVE';

    const activeResponse = await getVerify(base, tokenFor(0));
    const body = await activeResponse.json();
    assert.equal(activeResponse.status, 200);
    assert.equal(body.success, true);
  });
});
