import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import http from 'node:http';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import accountLinkRouter from './accountLink.js';
import User from '../models/User.js';
import {
  LINKING_TOKEN_TTL_SECONDS,
  __resetHomelyMindIntegrationCacheForTests,
} from '../config/homelyMindIntegration.js';
import {
  decodeLinkingToken,
  verifyLinkingTokenSignature,
} from '../controllers/accountLinkController.js';

const JWT_SECRET = 'account-link-jwt-secret-value-for-tests';
const INTEGRATION_SECRET = 'account-link-integration-secret-for-tests';
const AUTH_USER_ID = 'account-link-user-1';
const OTHER_USER_ID = 'account-link-user-2';

const originalFindById = User.findById.bind(User);
const originalRandomBytes = crypto.randomBytes;

function installUserStub() {
  User.findById = (id) => ({
    select: async () => {
      if (String(id) !== AUTH_USER_ID) return null;
      return { _id: AUTH_USER_ID, tokenVersion: 0, isSuspended: false };
    },
    then: (resolve) => {
      const user = String(id) === AUTH_USER_ID
        ? {
            _id: { toString: () => AUTH_USER_ID },
            role: 'ADMIN',
            password: 'hashed-password',
            passwordResetTokenHash: 'reset-hash',
          }
        : null;
      return Promise.resolve(user).then(resolve);
    },
  });
}

function restoreUserStub() {
  User.findById = originalFindById;
}

function createAuthHeader(userId = AUTH_USER_ID) {
  const token = jwt.sign({ userId, role: 'ADMIN', tokenVersion: 0 }, JWT_SECRET);
  return `Bearer ${token}`;
}

async function withServer(run) {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.HOMELYMIND_INTEGRATION_SECRET = INTEGRATION_SECRET;
  __resetHomelyMindIntegrationCacheForTests();
  installUserStub();

  const app = express();
  app.use(express.json());
  app.use('/api/account-link', accountLinkRouter);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    restoreUserStub();
    crypto.randomBytes = originalRandomBytes;
    __resetHomelyMindIntegrationCacheForTests();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

async function requestToken(base, body = {}) {
  const response = await fetch(`${base}/api/account-link/token`, {
    method: 'POST',
    headers: {
      authorization: createAuthHeader(),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

function signatureFor(payload) {
  return crypto
    .createHmac('sha256', INTEGRATION_SECRET)
    .update(`${payload.homelyServUserId}:${payload.expiresAt}:${payload.nonce}`)
    .digest('hex');
}

test('POST /api/account-link/token rejects unauthenticated requests', async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/account-link/token`, { method: 'POST' });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
}));

test('authenticated user receives a minimal signed account-link token', async () => withServer(async (base) => {
  const before = Date.now();
  const { response, body } = await requestToken(base);
  const after = Date.now();
  const payload = decodeLinkingToken(body.token);

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.user.id, AUTH_USER_ID);
  assert.equal(body.user.role, 'ADMIN');
  assert.equal(body.user.password, undefined);
  assert.equal(body.user.passwordResetTokenHash, undefined);
  assert.equal(payload.homelyServUserId, AUTH_USER_ID);
  assert.equal(payload.signature, signatureFor(payload));
  assert.equal(verifyLinkingTokenSignature(payload), true);
  assert.match(payload.nonce, /^[0-9a-f]{32}$/);

  const minExpectedExpiry = before + LINKING_TOKEN_TTL_SECONDS * 1000;
  const maxExpectedExpiry = after + LINKING_TOKEN_TTL_SECONDS * 1000;
  assert.ok(payload.expiresAt >= minExpectedExpiry);
  assert.ok(payload.expiresAt <= maxExpectedExpiry);
  assert.equal(new Date(payload.expiresAt).toISOString(), body.expiresAt);
}));

test('nonces are generated with crypto.randomBytes and are unique', async () => withServer(async (base) => {
  let randomBytesCalls = 0;
  crypto.randomBytes = (size) => {
    randomBytesCalls += 1;
    assert.equal(size, 16);
    return originalRandomBytes(size);
  };

  const first = await requestToken(base);
  const second = await requestToken(base);
  const firstPayload = decodeLinkingToken(first.body.token);
  const secondPayload = decodeLinkingToken(second.body.token);

  assert.equal(randomBytesCalls, 2);
  assert.notEqual(firstPayload.nonce, secondPayload.nonce);
}));

test('tampering with signed fields invalidates the signature', async () => withServer(async (base) => {
  const { body } = await requestToken(base);
  const payload = decodeLinkingToken(body.token);

  assert.equal(verifyLinkingTokenSignature({ ...payload, homelyServUserId: OTHER_USER_ID }), false);
  assert.equal(verifyLinkingTokenSignature({ ...payload, expiresAt: payload.expiresAt + 1 }), false);
  assert.equal(verifyLinkingTokenSignature({ ...payload, nonce: `${payload.nonce}00` }), false);
}));

test('request body cannot override authenticated req.userId', async () => withServer(async (base) => {
  const { response, body } = await requestToken(base, { homelyServUserId: OTHER_USER_ID });
  const payload = decodeLinkingToken(body.token);

  assert.equal(response.status, 200);
  assert.equal(body.user.id, AUTH_USER_ID);
  assert.equal(payload.homelyServUserId, AUTH_USER_ID);
  assert.notEqual(payload.homelyServUserId, OTHER_USER_ID);
}));
