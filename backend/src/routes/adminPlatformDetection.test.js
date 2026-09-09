// backend/src/routes/adminPlatformDetection.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import adminRouter from './admin.js';
import {
  detectPlatform,
  extractAppVersion,
  trackUserActivityThrottled,
  recordDirectActivity,
  _clearActivityThrottleCache,
  ACTIVITY_THROTTLE_MS
} from '../services/platformDetectionService.js';
import { authenticate } from '../middleware/auth.js';

const secret = 'admin-platform-test-secret-2026-homelyserv-secure-key';
process.env.JWT_SECRET = secret;

const ADMIN_ID = '507f1f77bcf86cd799439001';
const USER_ID = '507f1f77bcf86cd799439002';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: 'Bearer ' + createToken(payload),
  'content-type': 'application/json'
});

const wrapQuery = (doc) => {
  const query = {
    select() { return query; },
    sort() { return query; },
    then(resolve, reject) { return Promise.resolve(doc).then(resolve, reject); }
  };
  return query;
};

test('1. Platform detection: Explicit header takes precedence', () => {
  assert.equal(detectPlatform({ headers: { 'x-client-platform': 'web', 'user-agent': 'Android Mobile' } }), 'web');
  assert.equal(detectPlatform({ headers: { 'x-client-platform': 'android', 'user-agent': 'Mozilla/5.0' } }), 'android');
  assert.equal(detectPlatform({ headers: { 'x-client-platform': 'ios', 'user-agent': 'Mozilla/5.0' } }), 'ios');
  assert.equal(detectPlatform({ headers: { 'x-client-platform': 'AnDrOiD' } }), 'android');
});

test('2. Platform detection: User-Agent fallback when header missing or invalid', () => {
  assert.equal(detectPlatform({ headers: { 'user-agent': 'Android 10 Mobile wv' } }), 'android');
  assert.equal(detectPlatform({ headers: { 'user-agent': 'iPhone; CPU iPhone OS' } }), 'ios');
  assert.equal(detectPlatform({ headers: { 'user-agent': 'Mozilla/5.0 (Windows NT) Chrome' } }), 'web');
  assert.equal(detectPlatform(null), 'unknown');
  assert.equal(detectPlatform({ headers: {} }), 'unknown');
  assert.equal(detectPlatform({ headers: { 'user-agent': 'CustomBot/1.0' } }), 'unknown');
});

test('3. App version extraction from X-Client-Version header', () => {
  assert.equal(extractAppVersion({ headers: { 'x-client-version': '1.0.18' } }), '1.0.18');
  assert.equal(extractAppVersion({ headers: {} }), null);
  assert.equal(extractAppVersion(null), null);
});

test('4. Activity throttling: only 1 DB update per 15-minute window', async () => {
  _clearActivityThrottleCache();
  let dbUpdateCount = 0;
  let lastSetDoc = null;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;

  User.findByIdAndUpdate = async (id, update) => {
    dbUpdateCount++;
    lastSetDoc = update;
    return { _id: id };
  };

  try {
    const testReq = { headers: { 'x-client-platform': 'android' } };

    trackUserActivityThrottled(USER_ID, testReq);
    assert.equal(dbUpdateCount, 1);
    assert.equal(lastSetDoc?.$set?.lastPlatform, 'android');
    assert.ok(lastSetDoc?.$set?.lastActiveAt instanceof Date);

    for (let i = 0; i < 10; i++) {
      trackUserActivityThrottled(USER_ID, testReq);
    }
    assert.equal(dbUpdateCount, 1, 'Subsequent requests must be throttled');

    _clearActivityThrottleCache();
    trackUserActivityThrottled(USER_ID, testReq);
    assert.equal(dbUpdateCount, 2, 'Request after throttle reset must update DB');
  } finally {
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    _clearActivityThrottleCache();
  }
});

test('5. Auth middleware tracks activity on authenticated requests', async () => {
  _clearActivityThrottleCache();
  let updatedPlatform = null;
  const originalFindById = User.findById;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;

  User.findById = (id) => wrapQuery({ _id: id, tokenVersion: 0, isSuspended: false });
  User.findByIdAndUpdate = async (id, update) => {
    updatedPlatform = update?.$set?.lastPlatform;
    return { _id: id };
  };

  try {
    const req = {
      headers: {
        authorization: 'Bearer ' + createToken({ userId: USER_ID, role: 'WORKER', tokenVersion: 0 }),
        'x-client-platform': 'ios'
      }
    };
    const res = { status(c) { return this; }, json(d) { return this; } };
    let nextCalled = false;

    await authenticate(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(updatedPlatform, 'ios');
  } finally {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    _clearActivityThrottleCache();
  }
});

test('6. GET /api/admin/users returns lastPlatform and lastActiveAt', async () => {
  const originalFind = User.find;
  const originalFindById = User.findById;

  const mockUsers = [
    { _id: '507f1f77bcf86cd799439011', fullName: 'Android User', email: 'android@example.com', role: 'WORKER', lastPlatform: 'android', lastActiveAt: new Date(), lastAppVersion: '1.0.18', toObject() { return { ...this }; } },
    { _id: '507f1f77bcf86cd799439012', fullName: 'Web User', email: 'web@example.com', role: 'CLIENT', lastPlatform: 'web', lastActiveAt: new Date(Date.now() - 3600000), lastAppVersion: null, toObject() { return { ...this }; } },
    { _id: '507f1f77bcf86cd799439013', fullName: 'Legacy User', email: 'legacy@example.com', role: 'CLIENT', toObject() { return { ...this }; } }
  ];

  User.findById = (id) => wrapQuery({ _id: id, role: 'ADMIN', tokenVersion: 0, isSuspended: false });
  User.find = () => wrapQuery(mockUsers);

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN', tokenVersion: 0 })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.users.length, 3);

    const u1 = data.users.find(u => u.email === 'android@example.com');
    assert.equal(u1.lastPlatform, 'android');
    assert.equal(u1.lastAppVersion, '1.0.18');
    assert.ok(u1.lastActiveAt);

    const u2 = data.users.find(u => u.email === 'web@example.com');
    assert.equal(u2.lastPlatform, 'web');
    assert.ok(u2.lastActiveAt);

    const u3 = data.users.find(u => u.email === 'legacy@example.com');
    assert.equal(u3.lastPlatform, undefined);
  } finally {
    User.find = originalFind;
    User.findById = originalFindById;
    await new Promise((r) => server.close(r));
  }
});

test('7. CORS preflight OPTIONS permits X-Client-Platform and X-Client-Version headers', async () => {
  const corsMiddleware = cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Guest-Token',
      'X-Client-Platform',
      'X-Client-Version',
      'Accept',
      'Origin',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ]
  });

  const app = express();
  app.use(corsMiddleware);
  app.options('*', corsMiddleware);
  app.post('/api/auth/login', (req, res) => res.json({ success: true }));

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'x-client-platform,x-client-version,content-type'
      }
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    const allowHeaders = res.headers.get('access-control-allow-headers') || '';
    assert.ok(allowHeaders.toLowerCase().includes('x-client-platform'));
    assert.ok(allowHeaders.toLowerCase().includes('x-client-version'));
  } finally {
    await new Promise((r) => server.close(r));
  }
});

