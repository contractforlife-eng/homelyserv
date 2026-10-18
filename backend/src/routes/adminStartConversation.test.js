// backend/src/routes/adminStartConversation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import prisma from '../lib/prisma.js';
import adminRouter from './admin.js';

const secret = 'admin-start-conversation-test-secret-2026';
process.env.JWT_SECRET = secret;

const ADMIN_ID = '507f1f77bcf86cd799439001';
const CO_ADMIN_ID = '507f1f77bcf86cd799439004';
const WORKER_ID = '507f1f77bcf86cd799439011';
const EMPLOYER_ID = '507f1f77bcf86cd799439012';
const DOCTOR_ID = '507f1f77bcf86cd799439013';
const TEACHER_ID = '507f1f77bcf86cd799439014';
const STUDENT_ID = '507f1f77bcf86cd799439015';
const SUPPORT_ID = '507f1f77bcf86cd799439016';
const SUPHELP_ID = '507f1f77bcf86cd799439017';
const OTHER_ADMIN_ID = '507f1f77bcf86cd799439018';

User.findOneAndUpdate = () => Promise.resolve({});

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const mockUsers = new Map([
  [ADMIN_ID, { id: ADMIN_ID, _id: ADMIN_ID, fullName: 'Admin User', email: 'admin@homelyserv.com', role: 'ADMIN', tokenVersion: 0, isSuspended: false }],
  [CO_ADMIN_ID, { id: CO_ADMIN_ID, _id: CO_ADMIN_ID, fullName: 'Co-Admin User', email: 'coadmin@homelyserv.com', role: 'ADMIN', tokenVersion: 0, isSuspended: false }],
  [WORKER_ID, { id: WORKER_ID, _id: WORKER_ID, fullName: 'Worker User', email: 'worker@homelyserv.com', role: 'WORKER', tokenVersion: 0, isSuspended: false }],
  [EMPLOYER_ID, { id: EMPLOYER_ID, _id: EMPLOYER_ID, fullName: 'Employer User', email: 'employer@homelyserv.com', role: 'EMPLOYER', tokenVersion: 0, isSuspended: false }],
  [DOCTOR_ID, { id: DOCTOR_ID, _id: DOCTOR_ID, fullName: 'Doctor User', email: 'doctor@homelyserv.com', role: 'DOCTOR', tokenVersion: 0, isSuspended: false }],
  [TEACHER_ID, { id: TEACHER_ID, _id: TEACHER_ID, fullName: 'Teacher User', email: 'teacher@homelyserv.com', role: 'TEACHER', tokenVersion: 0, isSuspended: false }],
  [STUDENT_ID, { id: STUDENT_ID, _id: STUDENT_ID, fullName: 'Student User', email: 'student@homelyserv.com', role: 'STUDENT', tokenVersion: 0, isSuspended: false }],
  [SUPPORT_ID, { id: SUPPORT_ID, _id: SUPPORT_ID, fullName: 'Support User', email: 'support@homelyserv.com', role: 'SUPPORT', tokenVersion: 0, isSuspended: false }],
  [SUPHELP_ID, { id: SUPHELP_ID, _id: SUPHELP_ID, fullName: 'SupHelp User', email: 'suphelp@homelyserv.com', role: 'SUPPORT_HELPER', tokenVersion: 0, isSuspended: false }],
  [OTHER_ADMIN_ID, { id: OTHER_ADMIN_ID, _id: OTHER_ADMIN_ID, fullName: 'Other Admin', email: 'otheradmin@homelyserv.com', role: 'ADMIN', tokenVersion: 0, isSuspended: false }]
]);

const wrapQuery = (doc) => ({
  select() {
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const withTestServer = async (run) => {
  const originalFindById = User.findById;
  const originalUserFindUnique = prisma.user.findUnique;
  const originalConvFindOne = Conversation.findOne;
  const originalConvCreate = Conversation.create;
  const originalMsgCreate = Message.create;

  const createdConversations = [];
  const createdMessages = [];

  User.findById = (id) => {
    const u = mockUsers.get(String(id));
    if (!u) return wrapQuery(null);
    return wrapQuery({
      ...u,
      toObject() { return { ...u }; }
    });
  };

  prisma.user.findUnique = async ({ where }) => {
    const u = mockUsers.get(String(where.id));
    return u || null;
  };

  Conversation.findOne = async ({ conversationId }) => {
    return createdConversations.find(c => c.conversationId === conversationId) || null;
  };

  Conversation.create = async (data) => {
    createdConversations.push(data);
    return data;
  };

  Message.create = async (data) => {
    createdMessages.push(data);
    return data;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`, { createdConversations, createdMessages });
  } finally {
    User.findById = originalFindById;
    prisma.user.findUnique = originalUserFindUnique;
    Conversation.findOne = originalConvFindOne;
    Conversation.create = originalConvCreate;
    Message.create = originalMsgCreate;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('POST /api/admin/start-conversation suite', async (t) => {
  await t.test('1. Unauthenticated request is rejected with 401', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: WORKER_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 401);
    });
  });

  await t.test('2. Non-admin role (WORKER) is rejected with 403', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: WORKER_ID, role: 'WORKER' }),
        body: JSON.stringify({ userId: EMPLOYER_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 403);
    });
  });

  await t.test('3. Missing userId is rejected with 400', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ scope: 'USERS' })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Missing userId');
    });
  });

  await t.test('4. Nonexistent target user is rejected with 404', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: '507f1f77bcf86cd799439999', scope: 'USERS' })
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'User not found');
    });
  });

  await t.test('5. Co-Admin starting conversation with WORKER succeeds (201)', async () => {
    await withTestServer(async (baseUrl, { createdConversations, createdMessages }) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: WORKER_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.existing, false);
      assert.ok(data.conversationId);
      assert.equal(createdConversations.length, 1);
      assert.equal(createdMessages.length, 1);
      assert.equal(createdConversations[0].type, 'SUPPORT');
    });
  });

  await t.test('6. Co-Admin starting conversation with EMPLOYER succeeds (201)', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: EMPLOYER_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'SUPPORT');
    });
  });

  await t.test('7. Co-Admin starting conversation with DOCTOR succeeds (201)', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: DOCTOR_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'SUPPORT');
    });
  });

  await t.test('8. Co-Admin starting conversation with TEACHER succeeds (201)', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: TEACHER_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'SUPPORT');
    });
  });

  await t.test('9. Co-Admin starting conversation with STUDENT succeeds (201)', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: STUDENT_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'SUPPORT');
    });
  });

  await t.test('10. Co-Admin starting conversation with SUPPORT (scope STAFF) succeeds (201) as INTERNAL', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: SUPPORT_ID, scope: 'STAFF' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'INTERNAL');
    });
  });

  await t.test('11. Co-Admin starting conversation with SUPPORT_HELPER (scope STAFF) succeeds (201) as INTERNAL', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: SUPHELP_ID, scope: 'STAFF' })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'INTERNAL');
    });
  });

  await t.test('12. Reusing existing conversation does not duplicate (200 with existing: true)', async () => {
    await withTestServer(async (baseUrl, { createdConversations, createdMessages }) => {
      // First call: creates conversation
      const res1 = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: WORKER_ID, scope: 'USERS' })
      });
      assert.equal(res1.status, 201);
      assert.equal(createdConversations.length, 1);
      assert.equal(createdMessages.length, 1);

      // Second call: reuses existing
      const res2 = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: CO_ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: WORKER_ID, scope: 'USERS' })
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.equal(data2.existing, true);
      // No new conversation or message was created
      assert.equal(createdConversations.length, 1);
      assert.equal(createdMessages.length, 1);
    });
  });

  await t.test('13. Prohibited scope mismatch: USERS scope targeting SUPPORT staff returns 403', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: SUPPORT_ID, scope: 'USERS' })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Target is not an approved user participant');
    });
  });

  await t.test('14. Prohibited scope mismatch: STAFF scope targeting WORKER returns 403', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/start-conversation`, {
        method: 'POST',
        headers: authHeader({ userId: ADMIN_ID, role: 'ADMIN' }),
        body: JSON.stringify({ userId: WORKER_ID, scope: 'STAFF' })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.error, 'Target is not an approved staff participant');
    });
  });
});
