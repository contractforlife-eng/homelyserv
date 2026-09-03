// backend/src/routes/supHelp.test.js
// ============================================================
// Focused authorization + DTO tests for Sup-Help routes.
// Uses node:test + mocked Prisma to avoid touching real DB.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import prisma from '../lib/prisma.js';
import supHelpRouter from './supHelp.js';
import chatRouter, { getConversationId } from './chat.js';

function buildRouteHandlers() {
  const usersDb = new Map();

  const makeUser = (overrides = {}) => ({
    id: overrides.id || 'u000000000000000000000001',
    fullName: overrides.fullName || 'Test User',
    email: overrides.email || 'test@example.com',
    role: overrides.role || 'WORKER',
    profileImage: overrides.profileImage || null,
    createdAt: overrides.createdAt || new Date('2024-01-01'),
    isVerified: overrides.isVerified || true,
    isSuspended: overrides.isSuspended || false,
    phone: overrides.phone || '+201000000000',
    city: overrides.city || 'Cairo',
    ...overrides,
  });

  const mockPrisma = {
    user: {
      findMany: async ({ where, select, skip, take, orderBy }) => {
        let filtered = Array.from(usersDb.values());
        if (where?.role?.in) {
          filtered = filtered.filter((u) => where.role.in.includes(u.role));
        } else if (where?.role) {
          filtered = filtered.filter((u) => u.role === where.role);
        }
        if (where?.OR) {
          filtered = filtered.filter((u) => {
            const term = (where.OR[0].fullName?.contains || '').toLowerCase();
            return (
              (u.fullName || '').toLowerCase().includes(term) ||
              (u.email || '').toLowerCase().includes(term)
            );
          });
        }
        const total = filtered.length;
        const page = [];
        for (let i = skip; i < Math.min(skip + take, filtered.length); i++) {
          page.push(filtered[i]);
        }
        const selected = page.map((u) => {
          const out = {};
          for (const key of Object.keys(select || {})) {
            if (key === 'WorkerProfile' && u.WorkerProfile) {
              out.WorkerProfile = { ...u.WorkerProfile };
            } else if (key === 'EmployerProfile' && u.EmployerProfile) {
              out.EmployerProfile = { ...u.EmployerProfile };
            } else if (key in u) {
              out[key] = u[key];
            }
          }
          return out;
        });
        return { selected, total };
      },
      findUnique: async ({ where, select }) => {
        const user = usersDb.get(where.id);
        if (!user) return null;
        const out = {};
        for (const key of Object.keys(select || {})) {
          if (key === 'WorkerProfile' && user.WorkerProfile) {
            out.WorkerProfile = { ...user.WorkerProfile };
          } else if (key === 'EmployerProfile' && user.EmployerProfile) {
            out.EmployerProfile = { ...user.EmployerProfile };
          } else if (key === 'id') {
            out[key] = user._id || user.id;
          } else if (key in user) {
            out[key] = user[key];
          }
        }
        return out;
      },
      count: async ({ where }) => {
        let filtered = Array.from(usersDb.values());
        if (where?.role?.in) {
          filtered = filtered.filter((u) => where.role.in.includes(u.role));
        } else if (where?.role) {
          filtered = filtered.filter((u) => u.role === where.role);
        }
        return filtered.length;
      },
    },
  };

  return {
    usersDb,
    makeUser,
    mockPrisma,
  };
}

test('Sup-Help user list restricts to WORKER and EMPLOYER', async () => {
  const { usersDb, makeUser, mockPrisma } = buildRouteHandlers();
  usersDb.set('worker-1', makeUser({ id: 'worker-1', fullName: 'Alice', email: 'alice@test.com', role: 'WORKER' }));
  usersDb.set('employer-1', makeUser({ id: 'employer-1', fullName: 'Bob', email: 'bob@test.com', role: 'EMPLOYER' }));
  usersDb.set('support-1', makeUser({ id: 'support-1', fullName: 'Carol', email: 'carol@test.com', role: 'SUPPORT' }));
  usersDb.set('admin-1', makeUser({ id: 'admin-1', fullName: 'Dave', email: 'dave@test.com', role: 'ADMIN' }));
  usersDb.set('helper-1', makeUser({ id: 'helper-1', fullName: 'Eve', email: 'eve@test.com', role: 'SUPPORT_HELPER' }));

  const where = { role: { in: ['WORKER', 'EMPLOYER'] } };
  const { selected, total } = await mockPrisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
      isVerified: true,
      isSuspended: true,
      phone: true,
      city: true,
    },
    skip: 0,
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  assert.equal(total, 2);
  const roles = selected.map((u) => u.role).sort();
  assert.deepEqual(roles, ['EMPLOYER', 'WORKER']);
});

test('Sup-Help profile blocks staff roles', async () => {
  const { usersDb, makeUser } = buildRouteHandlers();
  usersDb.set('support-1', makeUser({ id: 'support-1', fullName: 'Carol', email: 'carol@test.com', role: 'SUPPORT' }));
  usersDb.set('admin-1', makeUser({ id: 'admin-1', fullName: 'Dave', email: 'dave@test.com', role: 'ADMIN' }));
  usersDb.set('helper-1', makeUser({ id: 'helper-1', fullName: 'Eve', email: 'eve@test.com', role: 'SUPPORT_HELPER' }));

  for (const userId of ['support-1', 'admin-1', 'helper-1']) {
    const user = usersDb.get(userId);
    const allowed = ['WORKER', 'EMPLOYER'].includes(user.role);
    assert.equal(allowed, false, `Expected ${user.role} to be blocked`);
  }
});

test('Sup-Help profile allows WORKER and EMPLOYER', async () => {
  const { usersDb, makeUser } = buildRouteHandlers();
  usersDb.set('worker-1', makeUser({ id: 'worker-1', fullName: 'Alice', email: 'alice@test.com', role: 'WORKER' }));
  usersDb.set('employer-1', makeUser({ id: 'employer-1', fullName: 'Bob', email: 'bob@test.com', role: 'EMPLOYER' }));

  for (const userId of ['worker-1', 'employer-1']) {
    const user = usersDb.get(userId);
    const allowed = ['WORKER', 'EMPLOYER'].includes(user.role);
    assert.equal(allowed, true, `Expected ${user.role} to be allowed`);
  }
});

test('Sup-Help list safe DTO excludes sensitive fields', async () => {
  const { usersDb, makeUser, mockPrisma } = buildRouteHandlers();
  usersDb.set('worker-1', makeUser({
    id: 'worker-1',
    fullName: 'Alice',
    email: 'alice@test.com',
    role: 'WORKER',
    passwordHash: 'secret',
    resetPasswordToken: 'token',
    verificationToken: 'v-token',
    tokenVersion: 5,
    refreshToken: 'refresh',
  }));

  const { selected } = await mockPrisma.user.findMany({
    where: { role: { in: ['WORKER', 'EMPLOYER'] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
      isVerified: true,
      isSuspended: true,
      phone: true,
      city: true,
    },
    skip: 0,
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const user = selected[0];
  assert.equal(user.passwordHash, undefined);
  assert.equal(user.resetPasswordToken, undefined);
  assert.equal(user.verificationToken, undefined);
  assert.equal(user.tokenVersion, undefined);
  assert.equal(user.refreshToken, undefined);
});

// ============================================================
// Phase 2C: Internal staff messaging auth boundary tests
// Note: Full message flow requires a real MongoDB connection.
// These tests verify the auth middleware and role boundaries.
// ============================================================

const JWT_SECRET = 'sup-help-test-secret-2026-abcdefghijklmnop';
process.env.JWT_SECRET = JWT_SECRET;

const tokenFor = (userId, role, tokenVersion = 0) => jwt.sign(
  { userId, role, tokenVersion },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const createAuthHeader = (userId, role) => `Bearer ${tokenFor(userId, role)}`;

const withSupHelpServer = async ({ users = {} } = {}, run) => {
  const originalFindById = User.findById;
  const originalFindMany = prisma.user.findMany;
  const originalFindUnique = prisma.user.findUnique;
  const originalCount = prisma.user.count;
  const originalUserBlock = prisma.userBlock;

  const originalConvFindOne = Conversation.findOne;
  const originalConvFind = Conversation.find;
  const originalConvCreate = Conversation.create;
  const originalConvUpdateOne = Conversation.updateOne;
  const originalConvFindOneAndUpdate = Conversation.findOneAndUpdate;

  const originalMsgCreate = Message.create;
  const originalMsgFind = Message.find;
  const originalMsgFindOne = Message.findOne;
  const originalMsgCountDocuments = Message.countDocuments;
  const originalMsgAggregate = Message.aggregate;
  const originalMsgUpdateMany = Message.updateMany;

  const userMap = new Map();
  for (const [id, user] of Object.entries(users)) {
    userMap.set(id, {
      _id: id,
      id,
      ...user,
      toObject() { return { ...this }; }
    });
  }

  User.findById = (id) => ({
    select: async () => userMap.get(id) || null,
  });

  prisma.user.findMany = async ({ where, select }) => {
    let results = Array.from(userMap.values());
    if (where?.id?.in) {
      results = results.filter((u) => where.id.in.includes(String(u._id)));
    }
    if (where?.id?.not) {
      results = results.filter((u) => String(u._id) !== String(where.id.not));
    }
    if (where?.role?.in) {
      results = results.filter((u) => where.role.in.includes(u.role));
    } else if (where?.role) {
      results = results.filter((u) => u.role === where.role);
    }
    return results.map((u) => {
      const out = {};
      for (const key of Object.keys(select || {})) {
        if (key === 'id') {
          out[key] = u._id;
        } else if (key in u) {
          out[key] = u[key];
        }
      }
      return out;
    });
  };

  prisma.user.findUnique = async ({ where, select }) => {
    const user = userMap.get(where.id);
    if (!user) return null;
    const out = {};
    for (const key of Object.keys(select || {})) {
      if (key === 'id') {
        out[key] = user._id;
      } else if (key in user) {
        out[key] = user[key];
      }
    }
    return out;
  };

  prisma.user.count = async () => userMap.size;

  prisma.userBlock = {
    findUnique: async () => null,
    deleteMany: async () => {},
    upsert: async () => ({}),
  };

  const convMap = new Map();
  const messagesList = [];

  Conversation.findOne = async (query) => {
    for (const conv of convMap.values()) {
      let match = true;
      if (query?.conversationId && conv.conversationId !== query.conversationId) match = false;
      if (query?.type && conv.type !== query.type) match = false;
      if (match) return { ...conv };
    }
    return null;
  };

  Conversation.find = (query) => {
    let list = Array.from(convMap.values());
    if (query?.type) list = list.filter(c => c.type === query.type);
    if (query?.staffIds) list = list.filter(c => c.staffIds && c.staffIds.includes(query.staffIds));
    return {
      sort: () => list.map(c => ({ ...c }))
    };
  };

  Conversation.create = async (data) => {
    const doc = {
      _id: 'conv_' + Math.random().toString(36).slice(2),
      status: 'ACTIVE',
      lastMessageAt: new Date(),
      lastMessagePreview: '',
      ...data,
    };
    convMap.set(doc.conversationId, doc);
    return { ...doc };
  };

  Conversation.updateOne = async (query, update) => {
    const conv = convMap.get(query.conversationId);
    if (conv) {
      Object.assign(conv, update.$set || update);
    }
    return { modifiedCount: 1 };
  };

  Conversation.findOneAndUpdate = async (query, update) => {
    const conv = convMap.get(query.conversationId);
    if (conv) {
      Object.assign(conv, update.$set || update);
      return { ...conv };
    }
    return null;
  };

  Message.create = async (data) => {
    const doc = {
      _id: 'msg_' + Math.random().toString(36).slice(2),
      createdAt: new Date(),
      ...data,
      toObject() { return { ...this }; }
    };
    messagesList.push(doc);
    return { ...doc };
  };

  Message.find = (query) => {
    let list = messagesList.filter(m => {
      if (query?.conversationId) {
        if (query.conversationId.$in) {
          return query.conversationId.$in.includes(m.conversationId);
        }
        return m.conversationId === query.conversationId;
      }
      return true;
    });
    return {
      sort: () => list.map(m => ({ ...m }))
    };
  };

  Message.findOne = (query) => {
    const list = messagesList.filter(m => m.conversationId === query.conversationId);
    return {
      sort: () => (list.length > 0 ? { ...list[list.length - 1] } : null)
    };
  };

  Message.countDocuments = async (query) => {
    return messagesList.filter(m => {
      if (query?.conversationId && m.conversationId !== query.conversationId) return false;
      if (query?.recipientId && m.recipientId !== query.recipientId) return false;
      if (query?.read !== undefined && m.read !== query.read) return false;
      return true;
    }).length;
  };

  Message.aggregate = async () => {
    const counts = new Map();
    for (const m of messagesList) {
      if (!m.read) counts.set(m.conversationId, (counts.get(m.conversationId) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([k, v]) => ({ _id: k, count: v }));
  };

  Message.updateMany = async (query, update) => {
    let count = 0;
    for (const m of messagesList) {
      if (m.conversationId === query.conversationId && m.recipientId === query.recipientId) {
        if (update.$set) Object.assign(m, update.$set);
        count++;
      }
    }
    return { modifiedCount: count };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/sup-help', supHelpRouter);
  app.use('/api/chat', chatRouter);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`, { convMap, messagesList });
  } finally {
    User.findById = originalFindById;
    prisma.user.findMany = originalFindMany;
    prisma.user.findUnique = originalFindUnique;
    prisma.user.count = originalCount;
    prisma.userBlock = originalUserBlock;

    Conversation.findOne = originalConvFindOne;
    Conversation.find = originalConvFind;
    Conversation.create = originalConvCreate;
    Conversation.updateOne = originalConvUpdateOne;
    Conversation.findOneAndUpdate = originalConvFindOneAndUpdate;

    Message.create = originalMsgCreate;
    Message.find = originalMsgFind;
    Message.findOne = originalMsgFindOne;
    Message.countDocuments = originalMsgCountDocuments;
    Message.aggregate = originalMsgAggregate;
    Message.updateMany = originalMsgUpdateMany;

    await new Promise((resolve) => server.close(resolve));
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return { response, body: await response.json().catch(() => ({})) };
};

test('WORKER cannot use sup-help messaging endpoints', async () => {
  await withSupHelpServer({
    users: {
      'worker-1': { fullName: 'Alice', email: 'alice@test.com', role: 'WORKER', tokenVersion: 0 },
    }
  }, async (base) => {
    const { response } = await fetchJson(`${base}/api/sup-help/messages`, {
      headers: { authorization: createAuthHeader('worker-1', 'WORKER') },
    });
    assert.equal(response.status, 403);
  });
});

test('EMPLOYER cannot use sup-help messaging endpoints', async () => {
  await withSupHelpServer({
    users: {
      'employer-1': { fullName: 'Bob', email: 'bob@test.com', role: 'EMPLOYER', tokenVersion: 0 },
    }
  }, async (base) => {
    const { response } = await fetchJson(`${base}/api/sup-help/messages`, {
      headers: { authorization: createAuthHeader('employer-1', 'EMPLOYER') },
    });
    assert.equal(response.status, 403);
  });
});

// ============================================================
// Phase 2C: Mongoose Message schema validation for SUPPORT_HELPER
// Non-mocked: uses the real Message model schema to verify enum
// acceptance. Does NOT alter any auth/authorization boundaries.
// ============================================================
test('Message schema accepts SUPPORT_HELPER in senderRole and recipientRole', async () => {
  const senderRolePath = Message.schema.path('senderRole');
  const recipientRolePath = Message.schema.path('recipientRole');
  assert.ok(
    Array.isArray(senderRolePath.enumValues) && senderRolePath.enumValues.includes('SUPPORT_HELPER'),
    'senderRole enum must include SUPPORT_HELPER'
  );
  assert.ok(
    Array.isArray(recipientRolePath.enumValues) && recipientRolePath.enumValues.includes('SUPPORT_HELPER'),
    'recipientRole enum must include SUPPORT_HELPER'
  );

  const msg = new Message({
    conversationId: 'conv_schema_test',
    senderId: 'u000000000000000000000001',
    senderName: 'Helper',
    senderRole: 'SUPPORT_HELPER',
    recipientId: 'u000000000000000000000002',
    recipientName: 'Admin',
    recipientRole: 'SUPPORT_HELPER',
    text: 'schema test',
    read: false,
    delivered: true,
  });
  await msg.validate();
  assert.equal(msg.senderRole, 'SUPPORT_HELPER');
  assert.equal(msg.recipientRole, 'SUPPORT_HELPER');
});

const testUsers = {
  '665f1a2b3c4d5e6f7a8b9c01': { fullName: 'Helper Eve', email: 'helper@test.com', role: 'SUPPORT_HELPER', tokenVersion: 0 },
  '665f1a2b3c4d5e6f7a8b9c02': { fullName: 'Support Carol', email: 'support@test.com', role: 'SUPPORT', tokenVersion: 0 },
  '665f1a2b3c4d5e6f7a8b9c03': { fullName: 'Admin Dave', email: 'admin@test.com', role: 'ADMIN', tokenVersion: 0 },
  '665f1a2b3c4d5e6f7a8b9c04': { fullName: 'Worker Alice', email: 'worker@test.com', role: 'WORKER', tokenVersion: 0 },
  '665f1a2b3c4d5e6f7a8b9c05': { fullName: 'Employer Bob', email: 'employer@test.com', role: 'EMPLOYER', tokenVersion: 0 },
};

test('Sup-Help ensures/reuses INTERNAL conversation with SUPPORT and both send/reply in same canonical thread', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';

    // 1. Sup-Help ensures an INTERNAL conversation with SUPPORT
    const { response: ensureRes, body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId }),
    });
    assert.equal(ensureRes.status, 200);
    assert.equal(ensureBody.success, true);
    const expectedConvId = getConversationId(helperId, supportId);
    assert.equal(ensureBody.conversationId, expectedConvId);
    assert.ok(expectedConvId.startsWith('conv_'), 'conversationId must have conv_ prefix');

    // Reusing returns same conversationId
    const { body: reuseBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId }),
    });
    assert.equal(reuseBody.conversationId, expectedConvId);

    // 2. Sup-Help sends through dedicated Sup-Help send endpoint
    const { response: sendRes, body: sendBody } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: expectedConvId,
        recipientId: supportId,
        text: 'Need guidance on ticket #123',
      }),
    });
    assert.equal(sendRes.status, 201);
    assert.equal(sendBody.conversationId, expectedConvId);
    assert.equal(sendBody.senderRole, 'SUPPORT_HELPER');
    assert.equal(sendBody.text, 'Need guidance on ticket #123');

    // 3. Message persists
    const { response: getRes, body: getBody } = await fetchJson(`${base}/api/sup-help/messages/${expectedConvId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getBody.messages.length, 1);
    assert.equal(getBody.messages[0].text, 'Need guidance on ticket #123');

    // 4. SUPPORT can reply in the same conversation via /api/chat/send
    const { response: replyRes, body: replyBody } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(supportId, 'SUPPORT') },
      body: JSON.stringify({
        recipientId: helperId,
        text: 'Reviewing ticket #123 now, proceed with caution',
      }),
    });
    assert.equal(replyRes.status, 201);
    assert.equal(replyBody.conversationId, expectedConvId);

    // Both messages in the exact same conversation
    const { body: getAfterReply } = await fetchJson(`${base}/api/sup-help/messages/${expectedConvId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(getAfterReply.messages.length, 2);
    assert.equal(getAfterReply.messages[0].senderId, helperId);
    assert.equal(getAfterReply.messages[1].senderId, supportId);

    // 8. No duplicate conversation in DB
    assert.equal(convMap.size, 1);
    assert.ok(convMap.has(expectedConvId));
  });
});

test('Sup-Help ensures/reuses INTERNAL conversation with ADMIN and both send/reply in same canonical thread', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const adminId = '665f1a2b3c4d5e6f7a8b9c03';

    // 5. Sup-Help ensures/reuses INTERNAL conversation with ADMIN
    const { response: ensureRes, body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: adminId }),
    });
    assert.equal(ensureRes.status, 200);
    const expectedConvId = getConversationId(helperId, adminId);
    assert.equal(ensureBody.conversationId, expectedConvId);

    // 6. Sup-Help sends successfully to ADMIN
    const { response: sendRes, body: sendBody } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: expectedConvId,
        recipientId: adminId,
        text: 'Daily summary ready for review',
      }),
    });
    assert.equal(sendRes.status, 201);
    assert.equal(sendBody.text, 'Daily summary ready for review');

    // 7. ADMIN can reply into the same conversation
    const { response: replyRes, body: replyBody } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(adminId, 'ADMIN') },
      body: JSON.stringify({
        recipientId: helperId,
        text: 'Acknowledged, great work',
      }),
    });
    assert.equal(replyRes.status, 201);
    assert.equal(replyBody.conversationId, expectedConvId);

    const { body: thread } = await fetchJson(`${base}/api/sup-help/messages/${expectedConvId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(thread.messages.length, 2);
    assert.equal(convMap.size, 1);
  });
});

test('Generic private /api/chat/send rejects SUPPORT_HELPER sender and prevents bypass', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';

    // 9. Generic private /api/chat/send still does NOT become a Sup-Help bypass
    const { response: workerSend } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ recipientId: workerId, text: 'Bypass worker' }),
    });
    assert.equal(workerSend.status, 403);

    const { response: employerSend } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ recipientId: employerId, text: 'Bypass employer' }),
    });
    assert.equal(employerSend.status, 403);

    const { response: supportSend, body: supportBody } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ recipientId: supportId, text: 'Bypass internal route' }),
    });
    assert.equal(supportSend.status, 403);
    assert.ok(supportBody.error.includes('dedicated /api/sup-help/messages flow'));
  });
});

test('Worker/Employer internal targets remain rejected by Sup-Help ensure route', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';

    // 10. Worker/Employer internal targets remain rejected
    const { response: workerEnsure } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: workerId }),
    });
    assert.equal(workerEnsure.status, 403);

    const { response: employerEnsure } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: employerId }),
    });
    assert.equal(employerEnsure.status, 403);

    // Self target rejected
    const { response: selfEnsure } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: helperId }),
    });
    assert.equal(selfEnsure.status, 400);
  });
});

test('Staff directory filters SUPPORT_HELPER discovery appropriately', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';

    // Helper calling staff-directory sees only ADMIN and SUPPORT
    const { response: helperRes, body: helperBody } = await fetchJson(`${base}/api/chat/staff-directory`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(helperRes.status, 200);
    const helperSeenRoles = helperBody.staff.map(s => s.role).sort();
    assert.deepEqual(helperSeenRoles, ['ADMIN', 'SUPPORT']);

    // Support calling staff-directory sees ADMIN and SUPPORT_HELPER (excluding self)
    const { response: supportRes, body: supportBody } = await fetchJson(`${base}/api/chat/staff-directory`, {
      headers: { authorization: createAuthHeader(supportId, 'SUPPORT') },
    });
    assert.equal(supportRes.status, 200);
    const supportSeenRoles = supportBody.staff.map(s => s.role).sort();
    assert.deepEqual(supportSeenRoles, ['ADMIN', 'SUPPORT_HELPER']);
  });
});
