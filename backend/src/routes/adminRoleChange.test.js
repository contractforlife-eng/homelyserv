// backend/src/routes/adminRoleChange.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import adminRouter from './admin.js';

const secret = 'admin-role-change-test-secret-2026';
process.env.JWT_SECRET = secret;

const ADMIN_ID = '507f1f77bcf86cd799439001';
const WORKER_ID = '507f1f77bcf86cd799439002';
const ROOT_ADMIN_ID = '507f1f77bcf86cd799439003';
const TARGET_USER_ID = '507f1f77bcf86cd799439010';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const createMockUser = (overrides = {}) => {
  const data = {
    _id: TARGET_USER_ID,
    fullName: 'Target User',
    email: 'target@example.com',
    role: 'WORKER',
    tokenVersion: 0,
    desiredJob: 'Cleaning',
    profileImage: null,
    isSuspended: false,
    ...overrides
  };

  return {
    ...data,
    toObject() {
      return { ...data, id: String(data._id) };
    },
    async save() {
      data.role = this.role;
      data.tokenVersion = this.tokenVersion;
      return this;
    }
  };
};

const wrapQuery = (doc) => ({
  select() {
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const withAdminServer = async ({ mockUser = createMockUser(), activeComplaints = 0 } = {}, run) => {
  const originalFindById = User.findById;
  const originalFindOne = User.findOne;
  const originalComplaintCount = prisma.complaint.count;
  const originalWorkerProfileFindUnique = prisma.workerProfile.findUnique;
  const originalWorkerProfileUpdate = prisma.workerProfile.update;
  const originalWorkerProfileUpsert = prisma.workerProfile.upsert;

  User.findById = (id) => {
    const idStr = String(id);
    if (idStr === ADMIN_ID) {
      return wrapQuery(createMockUser({ _id: ADMIN_ID, email: 'admin@homelyserv.com', role: 'ADMIN' }));
    }
    if (idStr === WORKER_ID) {
      return wrapQuery(createMockUser({ _id: WORKER_ID, email: 'worker@example.com', role: 'WORKER' }));
    }
    if (idStr === ROOT_ADMIN_ID) {
      return wrapQuery(createMockUser({ _id: ROOT_ADMIN_ID, email: 'emad@homelyserv.com', role: 'ADMIN' }));
    }
    if (idStr === String(mockUser._id)) {
      return wrapQuery(mockUser);
    }
    return wrapQuery(null);
  };

  User.findOne = (query) => {
    if (query?.email && String(query.email).toLowerCase() === 'emad@homelyserv.com') {
      return wrapQuery(createMockUser({ _id: ROOT_ADMIN_ID, email: 'emad@homelyserv.com', role: 'ADMIN' }));
    }
    return wrapQuery(null);
  };

  prisma.complaint.count = async () => activeComplaints;
  prisma.workerProfile.findUnique = async () => null;
  prisma.workerProfile.update = async () => ({ id: 'wp1' });
  prisma.workerProfile.upsert = async () => ({ id: 'wp1' });

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    User.findById = originalFindById;
    User.findOne = originalFindOne;
    prisma.complaint.count = originalComplaintCount;
    prisma.workerProfile.findUnique = originalWorkerProfileFindUnique;
    prisma.workerProfile.update = originalWorkerProfileUpdate;
    prisma.workerProfile.upsert = originalWorkerProfileUpsert;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('PUT /api/admin/users/:id/role rejects unauthenticated requests with 401', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ newRole: 'SUPPORT' })
    });
    assert.equal(res.status, 401);
  });
});

test('PUT /api/admin/users/:id/role rejects non-admin users with 403', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' }),
      body: JSON.stringify({ newRole: 'SUPPORT' })
    });
    assert.equal(res.status, 403);
  });
});

test('PUT /api/admin/users/:id/role rejects invalid ObjectId with 400', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/invalid-id/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'SUPPORT' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.message, 'Invalid user ID');
  });
});

test('PUT /api/admin/users/:id/role rejects missing newRole with 400', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.message, 'newRole is required');
  });
});

test('PUT /api/admin/users/:id/role rejects disallowed role string with 400', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'SUPERUSER' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /must be one of/);
  });
});

test('PUT /api/admin/users/:id/role rejects admin changing their own role with 403', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${ADMIN_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'WORKER' })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Cannot change your own role/);
  });
});

test('PUT /api/admin/users/:id/role rejects changing role of Root Admin with 403', async () => {
  const rootUser = createMockUser({ _id: ROOT_ADMIN_ID, email: 'emad@homelyserv.com', role: 'ADMIN' });
  await withAdminServer({ mockUser: rootUser }, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${ROOT_ADMIN_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'WORKER' })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Root Admin account is protected/);
  });
});

test('PUT /api/admin/users/:id/role rejects non-root admin promoting to ADMIN with 403', async () => {
  await withAdminServer({}, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN', email: 'admin@homelyserv.com' }),
      body: JSON.stringify({ newRole: 'ADMIN' })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Only the Root Admin can promote users to Admin/);
  });
});

test('PUT /api/admin/users/:id/role rejects changing SUPPORT role if active complaints exist with 409', async () => {
  const supportUser = createMockUser({ role: 'SUPPORT' });
  await withAdminServer({ mockUser: supportUser, activeComplaints: 2 }, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'EMPLOYER' })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.message, /active complaint assignment/);
  });
});

test('PUT /api/admin/users/:id/role returns no-op when role is already set', async () => {
  const workerUser = createMockUser({ role: 'WORKER' });
  await withAdminServer({ mockUser: workerUser }, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'WORKER' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.changed, false);
    assert.equal(workerUser.role, 'WORKER');
  });
});

test('PUT /api/admin/users/:id/role successfully changes role to SUPPORT_HELPER and bumps tokenVersion', async () => {
  const target = createMockUser({ role: 'WORKER', tokenVersion: 2 });
  await withAdminServer({ mockUser: target }, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${TARGET_USER_ID}/role`, {
      method: 'PUT',
      headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
      body: JSON.stringify({ newRole: 'SUPPORT_HELPER' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.changed, true);
    assert.equal(body.newRole, 'SUPPORT_HELPER');
    assert.equal(target.role, 'SUPPORT_HELPER');
    assert.equal(target.tokenVersion, 3);
  });
});
