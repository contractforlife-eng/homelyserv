import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import adminRouter from '../src/routes/admin.js';
import User from '../src/models/User.js';
import { WallWallet, WallEntry } from '../src/models/Wall.js';
import { getJwtSecret } from '../src/config/jwtSecret.js';

describe('Server-Side Co-Admin Authorization & Idempotency Suite', () => {

  const jwtSecret = getJwtSecret();

  const createToken = (role = 'ADMIN', userId = '507f1f77bcf86cd799439011') => {
    return jwt.sign(
      { userId, id: userId, role, tokenVersion: 1 },
      jwtSecret,
      { expiresIn: '1h' }
    );
  };

  const createServer = () => {
    const app = express();
    app.use(express.json());
    // Mock user lookup for tokenVersion check in authenticate middleware
    const origFindById = User.findById;
    User.findById = (id) => ({
      select: () => Promise.resolve({
        _id: id,
        tokenVersion: 1,
        isActive: true,
        email: 'test@homelyserv.com',
        role: 'ADMIN',
      })
    });

    app.use('/api/admin', adminRouter);
    return http.createServer(app);
  };

  const requestHelper = (server, method, path, headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
      server.listen(0, () => {
        const port = server.address().port;
        const options = {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            server.close();
            try {
              const parsed = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, raw: data });
            }
          });
        });

        req.on('error', err => {
          server.close();
          reject(err);
        });

        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    });
  };

  it('denies non-Co-Admin roles (WORKER, EMPLOYER, SUPPORT, SUPPORT_HELPER, DOCTOR, TEACHER, STUDENT) with 403', async () => {
    const nonCoAdminRoles = [
      'WORKER',
      'EMPLOYER',
      'SUPPORT',
      'SUPPORT_HELPER',
      'DOCTOR',
      'TEACHER',
      'STUDENT'
    ];

    for (const role of nonCoAdminRoles) {
      const server = createServer();
      const token = createToken(role);

      const res = await requestHelper(
        server,
        'POST',
        '/api/admin/users/507f1f77bcf86cd799439099/wall-wallet/adjust',
        { Authorization: `Bearer ${token}` },
        {
          action: 'GRANT',
          quantity: 100,
          reason: 'Test grant by unauthorized role',
          idempotencyKey: 'key_' + Math.random().toString(36).slice(2),
        }
      );

      assert.equal(res.status, 403, `Expected 403 for role ${role}, got ${res.status}`);
    }
  });

  it('denies GET /api/admin/users/:id/wall-wallet for non-Co-Admin roles with 403', async () => {
    const server = createServer();
    const token = createToken('SUPPORT');
    const res = await requestHelper(
      server,
      'GET',
      '/api/admin/users/507f1f77bcf86cd799439099/wall-wallet',
      { Authorization: `Bearer ${token}` }
    );
    assert.equal(res.status, 403);
  });

  it('permits Co-Admin (role ADMIN) and returns idempotent response for duplicate request', async () => {
    const targetUserId = '507f1f77bcf86cd799439099';
    const adminToken = createToken('ADMIN');

    const origStartSession = mongoose.startSession;
    const origUserFindById = User.findById;
    mongoose.startSession = async () => ({
      withTransaction: async (fn) => fn(),
      endSession: async () => {},
    });
    const origWalletFindById = WallWallet.findById;
    const origEntryFindOne = WallEntry.findOne;
    const origEntryFind = WallEntry.find;
    const origEntryCreate = WallEntry.create;

    const mockEntries = new Map();
    const mockWallets = new Map();

    WallEntry.find = () => ({
      sort: function() { return this; },
      session: function() { return this; },
      then: (resolve) => resolve([])
    });

    WallWallet.findById = (id) => ({
      session: function() { return this; },
      save: async () => {},
      lean: async () => ({
        _id: id,
        balance: 1000,
        lots: [{
          lotId: 'grant_pre_test',
          type: 'ADMIN_GRANT',
          originalQuantity: 1000,
          remainingQuantity: 1000,
          acquiredAt: new Date(),
          expiresAt: null
        }],
        lotsMigrated: true,
      }),
      balance: 1000,
      lots: [{
        lotId: 'grant_pre_test',
        type: 'ADMIN_GRANT',
        originalQuantity: 1000,
        remainingQuantity: 1000,
        acquiredAt: new Date(),
        expiresAt: null
      }],
      lotsMigrated: true,
      then: (resolve) => resolve({
        _id: id,
        balance: 1000,
        lots: [{
          lotId: 'grant_pre_test',
          type: 'ADMIN_GRANT',
          originalQuantity: 1000,
          remainingQuantity: 1000,
          acquiredAt: new Date(),
          expiresAt: null
        }],
        lotsMigrated: true,
        save: async () => {}
      })
    });

    WallEntry.findOne = (query) => ({
      session: function() { return this; },
      lean: async () => mockEntries.get(query.key) || null,
      then: (resolve) => resolve(mockEntries.get(query.key) || null)
    });

    WallEntry.create = async (docs) => {
      for (const d of docs) {
        mockEntries.set(d.key, d);
      }
      return docs;
    };

    User.findById = (id) => ({
      select: () => Promise.resolve({
        _id: id,
        fullName: 'Target Member',
        role: 'WORKER',
        tokenVersion: 1,
        isActive: true,
      })
    });

    try {
      const idempotencyKey = 'key_unique_test_auth_12345';

      // 1st request
      const server1 = createServer();
      const res1 = await requestHelper(
        server1,
        'POST',
        `/api/admin/users/${targetUserId}/wall-wallet/adjust`,
        {
          Authorization: `Bearer ${adminToken}`,
          'Idempotency-Key': idempotencyKey,
        },
        {
          action: 'GRANT',
          quantity: 200,
          reason: 'Authorized grant',
        }
      );

      assert.equal(res1.status, 200);
      assert.equal(res1.body.success, true);
      assert.equal(res1.body.reused, false);
      assert.equal(res1.body.quantity, 200);

      // 2nd duplicate request with same key
      const server2 = createServer();
      const res2 = await requestHelper(
        server2,
        'POST',
        `/api/admin/users/${targetUserId}/wall-wallet/adjust`,
        {
          Authorization: `Bearer ${adminToken}`,
          'Idempotency-Key': idempotencyKey,
        },
        {
          action: 'GRANT',
          quantity: 200,
          reason: 'Authorized grant',
        }
      );

      assert.equal(res2.status, 200);
      assert.equal(res2.body.success, true);
      assert.equal(res2.body.reused, true);
      assert.equal(res2.body.quantity, 200);
    } finally {
      mongoose.startSession = origStartSession;
      User.findById = origUserFindById;
      WallWallet.findById = origWalletFindById;
      WallEntry.findOne = origEntryFindOne;
      WallEntry.find = origEntryFind;
      WallEntry.create = origEntryCreate;
    }
  });

  it('rejects invalid inputs on the server: missing reason, non-integer quantity, invalid action', async () => {
    const targetUserId = '507f1f77bcf86cd799439099';
    const adminToken = createToken('ADMIN');

    const origStartSession = mongoose.startSession;
    const origUserFindById = User.findById;
    mongoose.startSession = async () => ({
      withTransaction: async (fn) => fn(),
      endSession: async () => {},
    });
    User.findById = (id) => ({
      select: () => Promise.resolve({
        _id: id,
        fullName: 'Target Member',
        role: 'DOCTOR',
        tokenVersion: 1,
        isActive: true,
      })
    });

    try {
      // 1. Missing reason
      const server1 = createServer();
      const resNoReason = await requestHelper(
        server1,
        'POST',
        `/api/admin/users/${targetUserId}/wall-wallet/adjust`,
        { Authorization: `Bearer ${adminToken}` },
        {
          action: 'GRANT',
          quantity: 100,
          reason: '',
          idempotencyKey: 'key_valid_12345678',
        }
      );
      assert.equal(resNoReason.status, 400);

      // 2. Non-integer / negative quantity
      const server2 = createServer();
      const resBadQty = await requestHelper(
        server2,
        'POST',
        `/api/admin/users/${targetUserId}/wall-wallet/adjust`,
        { Authorization: `Bearer ${adminToken}` },
        {
          action: 'GRANT',
          quantity: -50,
          reason: 'Valid reason here',
          idempotencyKey: 'key_valid_12345678',
        }
      );
      assert.equal(resBadQty.status, 400);

      // 3. Invalid action
      const server3 = createServer();
      const resBadAction = await requestHelper(
        server3,
        'POST',
        `/api/admin/users/${targetUserId}/wall-wallet/adjust`,
        { Authorization: `Bearer ${adminToken}` },
        {
          action: 'STEAL',
          quantity: 50,
          reason: 'Valid reason here',
          idempotencyKey: 'key_valid_12345678',
        }
      );
      assert.equal(resBadAction.status, 400);
    } finally {
      mongoose.startSession = origStartSession;
      User.findById = origUserFindById;
    }
  });
});
