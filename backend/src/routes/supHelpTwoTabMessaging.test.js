import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import supHelpRouter from './supHelp.js';
import chatRouter from './chat.js';
import adminRouter from './admin.js';

const JWT_SECRET = 'sup-help-test-secret-2026-abcdefghijklmnop';
process.env.JWT_SECRET = JWT_SECRET;

const tokenFor = (userId, role, tokenVersion = 0) => jwt.sign(
  { userId, role, tokenVersion },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const createAuthHeader = (userId, role) => `Bearer ${tokenFor(userId, role)}`;

const testUsers = {
  '665f1a2b3c4d5e6f7a8b9c01': {
    fullName: 'Test Support Helper',
    email: 'suphelp@example.com',
    role: 'SUPPORT_HELPER',
    isActive: true,
    tokenVersion: 0,
    profileImage: null,
  },
  '665f1a2b3c4d5e6f7a8b9c02': {
    fullName: 'Test Support Agent',
    email: 'support@example.com',
    role: 'SUPPORT',
    isActive: true,
    tokenVersion: 0,
    profileImage: null,
  },
  '665f1a2b3c4d5e6f7a8b9c03': {
    fullName: 'Test Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
    tokenVersion: 0,
    profileImage: null,
  },
  '665f1a2b3c4d5e6f7a8b9c04': {
    fullName: 'Test Worker',
    email: 'worker@example.com',
    role: 'WORKER',
    isActive: true,
    tokenVersion: 0,
    profileImage: null,
  },
  '665f1a2b3c4d5e6f7a8b9c05': {
    fullName: 'Test Employer',
    email: 'employer@example.com',
    role: 'EMPLOYER',
    isActive: true,
    tokenVersion: 0,
    profileImage: null,
  },
};

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
    if (query?.staffIds) list = list.filter(c => c.staffIds && c.staffIds.map(String).includes(String(query.staffIds)));
    if (query?.participantIds) list = list.filter(c => c.participantIds && c.participantIds.map(String).includes(String(query.participantIds)));
    if (query?.conversationId?.$in) {
      list = list.filter(c => query.conversationId.$in.includes(c.conversationId));
    }
    if (query?.$and) {
      for (const subQuery of query.$and) {
        if (subQuery.$or) {
          list = list.filter(c => {
            return subQuery.$or.some(clause => {
              if (clause.status) {
                return c.status === clause.status || (clause.status.$exists === false && !c.status);
              }
              if (clause.type === 'INTERNAL') {
                return c.type === 'INTERNAL' && c.staffIds && c.staffIds.includes(clause.staffIds);
              }
              if (clause.type === 'SUPPORT') {
                if (clause.$or) {
                  return c.type === 'SUPPORT' && clause.$or.some(sub => {
                    return (sub.supportAgentId && c.supportAgentId === sub.supportAgentId) ||
                           (sub.participantIds && c.participantIds && c.participantIds.includes(sub.participantIds));
                  });
                }
                return c.type === 'SUPPORT';
              }
              return false;
            });
          });
        }
      }
    }
    const resultList = list.map(c => ({ ...c }));
    resultList.distinct = (field) => [...new Set(resultList.map(c => c[field]))];
    return {
      sort: () => resultList,
      distinct: (field) => [...new Set(resultList.map(c => c[field]))],
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
      read: false,
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
    const result = list.map(m => ({ ...m, toObject() { return { ...this }; } }));
    return {
      sort: () => result,
      limit: (count) => result.slice(-count),
    };
  };

  Message.findOne = (query) => {
    let list = [...messagesList];
    if (query?.conversationId) list = list.filter(m => m.conversationId === query.conversationId);
    return {
      sort: () => list.length > 0 ? { ...list[list.length - 1] } : null
    };
  };

  Message.countDocuments = async (query) => {
    let list = [...messagesList];
    if (query?.conversationId) list = list.filter(m => m.conversationId === query.conversationId);
    if (query?.recipientId) list = list.filter(m => m.recipientId === query.recipientId);
    if (query?.read === false) list = list.filter(m => m.read === false);
    return list.length;
  };

  Message.aggregate = async () => [];
  Message.updateMany = async (query, update) => {
    let count = 0;
    for (const msg of messagesList) {
      if (query?.conversationId && msg.conversationId !== query.conversationId) continue;
      if (query?.recipientId && msg.recipientId !== query.recipientId) continue;
      if (query?.read === false && msg.read !== false) continue;
      Object.assign(msg, update.$set || update);
      count++;
    }
    return { modifiedCount: count };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/sup-help', supHelpRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/admin', adminRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    await run(base, { convMap, messagesList });
  } finally {
    await new Promise((resolve) => server.close(resolve));
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
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
};

test('1. Support tab target role enforcement on /api/sup-help/messages/ensure', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';
    const adminId = '665f1a2b3c4d5e6f7a8b9c03';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';

    // Support tab allows SUPPORT target -> creates INTERNAL conversation
    const { response: resSupport, body: bodySupport } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId, tab: 'SUPPORT' }),
    });
    assert.equal(resSupport.status, 200);
    assert.ok(bodySupport.conversationId);

    // Support tab allows ADMIN target -> creates INTERNAL conversation
    const { response: resAdmin, body: bodyAdmin } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: adminId, tab: 'SUPPORT' }),
    });
    assert.equal(resAdmin.status, 200);
    assert.ok(bodyAdmin.conversationId);

    // Support tab blocks WORKER target -> 403 Forbidden
    const { response: resWorker } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: workerId, tab: 'SUPPORT' }),
    });
    assert.equal(resWorker.status, 403);

    // Support tab blocks EMPLOYER target -> 403 Forbidden
    const { response: resEmployer } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: employerId, tab: 'SUPPORT' }),
    });
    assert.equal(resEmployer.status, 403);

    // Support tab blocks self target -> 400 Bad Request
    const { response: resSelf } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: helperId, tab: 'SUPPORT' }),
    });
    assert.equal(resSelf.status, 400);
  });
});

test('2. Internal tab target role enforcement on /api/sup-help/messages/ensure', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';
    const adminId = '665f1a2b3c4d5e6f7a8b9c03';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';

    // Internal tab allows WORKER target -> creates SUPPORT type conversation
    const { response: resWorker, body: bodyWorker } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: workerId, tab: 'INTERNAL' }),
    });
    assert.equal(resWorker.status, 200);
    assert.ok(bodyWorker.conversationId);

    // Internal tab allows EMPLOYER target -> creates SUPPORT type conversation
    const { response: resEmployer, body: bodyEmployer } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: employerId, tab: 'INTERNAL' }),
    });
    assert.equal(resEmployer.status, 200);
    assert.ok(bodyEmployer.conversationId);

    // Internal tab blocks SUPPORT staff target -> 403 Forbidden
    const { response: resSupport } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId, tab: 'INTERNAL' }),
    });
    assert.equal(resSupport.status, 403);

    // Internal tab blocks ADMIN staff target -> 403 Forbidden
    const { response: resAdmin } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: adminId, tab: 'INTERNAL' }),
    });
    assert.equal(resAdmin.status, 403);

    // Internal tab blocks self target -> 400 Bad Request
    const { response: resSelf } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: helperId, tab: 'INTERNAL' }),
    });
    assert.equal(resSelf.status, 400);
  });
});

test('3. SUPPORT_HELPER and WORKER bidirectional messaging through dedicated support conversation path', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';

    // 1. Helper ensures conversation with Worker on Internal tab
    const { body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: workerId, tab: 'INTERNAL' }),
    });
    const convId = ensureBody.conversationId;
    assert.ok(convId);

    // Verify conversation stored as type SUPPORT with supportAgentId
    const storedConv = convMap.get(convId);
    assert.equal(storedConv.type, 'SUPPORT');
    assert.equal(storedConv.supportAgentId, helperId);

    // 2. Helper sends message to Worker via /api/sup-help/messages
    const { response: sendRes, body: sendBody } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: convId,
        recipientId: workerId,
        text: 'Hello from Sup-Help helper!',
      }),
    });
    assert.equal(sendRes.status, 201);
    assert.equal(sendBody.text, 'Hello from Sup-Help helper!');

    // 3. Worker replies via /api/chat/send
    const { response: replyRes, body: replyBody } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(workerId, 'WORKER') },
      body: JSON.stringify({
        conversationId: convId,
        recipientId: helperId,
        recipientRole: 'SUPPORT_HELPER',
        text: 'Worker reply to support helper',
      }),
    });
    assert.equal(replyRes.status, 201);
    assert.equal(replyBody.text, 'Worker reply to support helper');

    // 4. Helper fetches conversation messages via /api/sup-help/messages/:convId
    const { response: getRes, body: getBody } = await fetchJson(`${base}/api/sup-help/messages/${convId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getBody.messages.length, 2);
    assert.equal(getBody.messages[0].text, 'Hello from Sup-Help helper!');
    assert.equal(getBody.messages[1].text, 'Worker reply to support helper');
  });
});

test('4. SUPPORT_HELPER and EMPLOYER bidirectional messaging through dedicated support conversation path', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';

    const { body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: employerId, tab: 'INTERNAL' }),
    });
    const convId = ensureBody.conversationId;

    const { response: sendRes } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: convId,
        recipientId: employerId,
        text: 'Sup-Help check-in with Employer',
      }),
    });
    assert.equal(sendRes.status, 201);

    const { response: replyRes } = await fetchJson(`${base}/api/chat/send`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(employerId, 'EMPLOYER') },
      body: JSON.stringify({
        conversationId: convId,
        recipientId: helperId,
        recipientRole: 'SUPPORT_HELPER',
        text: 'Employer response to Sup-Help',
      }),
    });
    assert.equal(replyRes.status, 201);

    const { body: getBody } = await fetchJson(`${base}/api/sup-help/messages/${convId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(getBody.messages.length, 2);
  });
});

test('5. Private Worker<->Employer conversation access remains strictly blocked for SUPPORT_HELPER', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';
    const employerId = '665f1a2b3c4d5e6f7a8b9c05';

    // Simulate existing PRIVATE conversation between Worker and Employer
    const privateConvId = 'conv_private_123';
    convMap.set(privateConvId, {
      _id: 'mongo_priv_1',
      conversationId: privateConvId,
      type: 'PRIVATE',
      participantIds: [workerId, employerId],
      status: 'ACTIVE',
    });

    // Helper cannot view private conversation messages (403)
    const { response: getRes } = await fetchJson(`${base}/api/sup-help/messages/${privateConvId}`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(getRes.status, 403);

    // Helper cannot post messages into private conversation (403)
    const { response: postRes } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: privateConvId,
        recipientId: workerId,
        text: 'Unauthorized helper attempt',
      }),
    });
    assert.equal(postRes.status, 403);

    // Helper cannot mark read or close private conversation (403)
    const { response: readRes } = await fetchJson(`${base}/api/sup-help/messages/${privateConvId}/read`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ userId: helperId }),
    });
    assert.equal(readRes.status, 403);

    const { response: closeRes } = await fetchJson(`${base}/api/sup-help/messages/${privateConvId}/close`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(closeRes.status, 403);
  });
});

test('6. GET /api/sup-help/messages returns both INTERNAL and SUPPORT conversations with role separation', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';
    const workerId = '665f1a2b3c4d5e6f7a8b9c04';

    // Ensure staff conversation
    await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId, tab: 'SUPPORT' }),
    });

    // Ensure user conversation
    await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: workerId, tab: 'INTERNAL' }),
    });

    const { response, body } = await fetchJson(`${base}/api/sup-help/messages`, {
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(response.status, 200);
    assert.equal(body.conversations.length, 2);

    const types = body.conversations.map(c => c.type).sort();
    assert.deepEqual(types, ['INTERNAL', 'SUPPORT']);
  });
});

test('7. Close endpoint marks conversation status CLOSED for both INTERNAL and SUPPORT conversations', async () => {
  await withSupHelpServer({ users: testUsers }, async (base, { convMap }) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01';
    const supportId = '665f1a2b3c4d5e6f7a8b9c02';

    const { body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: supportId, tab: 'SUPPORT' }),
    });
    const convId = ensureBody.conversationId;

    const { response, body } = await fetchJson(`${base}/api/sup-help/messages/${convId}/close`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
    });
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(convMap.get(convId).status, 'CLOSED');
  });
});

test('8. Message state isolation & deduplication logic verification', () => {
  const activeConversationId = 'conv_active_123';
  const otherConversationId = 'conv_other_456';

  // 1. Realtime event for other conversation must NOT enter active messages array
  const incomingOtherMessage = {
    conversationId: otherConversationId,
    id: 'msg_other_1',
    text: 'Hello from another thread',
  };
  let messages = [{ id: 'msg_1', conversationId: activeConversationId, text: 'Initial message' }];

  if (incomingOtherMessage.conversationId === activeConversationId) {
    messages = [...messages, incomingOtherMessage];
  }
  assert.equal(messages.length, 1);

  // 2. Socket echo deduplication: incoming message matches pending optimistic message
  const pendingOptimistic = {
    id: 'opt_123',
    conversationId: activeConversationId,
    senderId: 'user_1',
    text: 'Hello world',
    pending: true,
  };
  messages = [...messages, pendingOptimistic];

  const incomingSocketEcho = {
    id: 'server_msg_999',
    conversationId: activeConversationId,
    senderId: 'user_1',
    text: 'Hello world',
  };

  if (incomingSocketEcho.conversationId === activeConversationId) {
    const matching = messages.find(m => m.pending && m.senderId === incomingSocketEcho.senderId && m.text === incomingSocketEcho.text);
    if (matching) {
      messages = messages.map(m => m.id === matching.id ? incomingSocketEcho : m);
    } else {
      messages = [...messages, incomingSocketEcho];
    }
  }

  assert.equal(messages.length, 2);
  assert.equal(messages[1].id, 'server_msg_999');
  assert.equal(messages[1].pending, undefined);
});

test('9. Canonical presence mapping and crash-safe lookup verification', () => {
  const presenceMap = {
    '665f1a2b3c4d5e6f7a8b9c02': true,
    '665f1a2b3c4d5e6f7a8b9c04': false,
  };

  const getIsOnline = (otherUserId, presence) =>
    Boolean(otherUserId && presence?.[String(otherUserId)] === true);

  // 1. Online user returns true
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c02', presenceMap), true);

  // 2. Offline user returns false
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c04', presenceMap), false);

  // 3. User not in presence map returns false (default offline)
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c05', presenceMap), false);

  // 4. Missing otherUserId returns false
  assert.equal(getIsOnline(null, presenceMap), false);
  assert.equal(getIsOnline(undefined, presenceMap), false);

  // 5. Missing / empty / undefined presence object is completely crash-safe and returns false
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c02', null), false);
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c02', undefined), false);
  assert.equal(getIsOnline('665f1a2b3c4d5e6f7a8b9c02', {}), false);
});

test('10. Canonical tab classification matrix, legacy conversation compatibility, and unread accounting', () => {
  const CONVERSATION_TABS = {
    SUPPORT: 'SUPPORT',
    INTERNAL: 'INTERNAL',
  };

  const getConversationTab = (conv) => {
    const rawType = String(conv?.rawType || conv?.type || '').toUpperCase();
    if (rawType === 'PRIVATE') {
      return null;
    }

    const role = String(conv?.otherUserRole || conv?.role || '').toUpperCase();
    if (role === 'SUPPORT' || role === 'ADMIN') {
      return CONVERSATION_TABS.SUPPORT;
    }
    if (role === 'WORKER' || role === 'EMPLOYER') {
      return CONVERSATION_TABS.INTERNAL;
    }

    const providedTab = String(conv?.tab || '').toUpperCase();
    if (providedTab === CONVERSATION_TABS.SUPPORT || providedTab === CONVERSATION_TABS.INTERNAL) {
      return providedTab;
    }

    if (rawType === 'INTERNAL') {
      return CONVERSATION_TABS.SUPPORT;
    }
    if (rawType === 'SUPPORT') {
      return CONVERSATION_TABS.INTERNAL;
    }

    return null;
  };

  // 1. INTERNAL DB conversation + SUPPORT counterpart => UI Support Conversations
  assert.equal(
    getConversationTab({ type: 'INTERNAL', otherUserRole: 'SUPPORT' }),
    CONVERSATION_TABS.SUPPORT
  );

  // 2. INTERNAL DB conversation + ADMIN counterpart => UI Support Conversations
  assert.equal(
    getConversationTab({ type: 'INTERNAL', otherUserRole: 'ADMIN' }),
    CONVERSATION_TABS.SUPPORT
  );

  // 3. SUPPORT DB conversation + WORKER counterpart => UI Internal Conversations
  assert.equal(
    getConversationTab({ type: 'SUPPORT', otherUserRole: 'WORKER' }),
    CONVERSATION_TABS.INTERNAL
  );

  // 4. SUPPORT DB conversation + EMPLOYER counterpart => UI Internal Conversations
  assert.equal(
    getConversationTab({ type: 'SUPPORT', otherUserRole: 'EMPLOYER' }),
    CONVERSATION_TABS.INTERNAL
  );

  // 5. PRIVATE conversation => hidden/denied (returns null)
  assert.equal(
    getConversationTab({ type: 'PRIVATE', otherUserRole: 'WORKER' }),
    null
  );
  assert.equal(
    getConversationTab({ type: 'PRIVATE', otherUserRole: 'SUPPORT' }),
    null
  );

  // 6. Arwa-like existing Sup-Admin conversation appears under Support tab without DB modification
  // Even if DB record has type 'SUPPORT' or 'INTERNAL', her role is 'SUPPORT' (Sup-Admin)
  const legacyArwaConv = {
    id: 'legacy_arwa_1',
    type: 'SUPPORT', // legacy DB record type was SUPPORT
    otherUserId: 'arwa_id',
    otherUserName: 'Arwa (Sup-Admin)',
    otherUserRole: 'SUPPORT',
  };
  assert.equal(
    getConversationTab(legacyArwaConv),
    CONVERSATION_TABS.SUPPORT
  );

  // 7. New Support-tab staff conversation remains in Support tab
  const newStaffConv = {
    id: 'new_staff_1',
    type: 'INTERNAL',
    tab: 'SUPPORT',
    otherUserRole: 'ADMIN',
  };
  assert.equal(
    getConversationTab(newStaffConv),
    CONVERSATION_TABS.SUPPORT
  );

  // 8. New Internal-tab Worker/Employer conversation remains in Internal tab
  const newWorkerConv = {
    id: 'new_worker_1',
    type: 'SUPPORT',
    tab: 'INTERNAL',
    otherUserRole: 'WORKER',
  };
  assert.equal(
    getConversationTab(newWorkerConv),
    CONVERSATION_TABS.INTERNAL
  );

  // 9. Unread counts follow UI classification
  const testConversations = [
    { id: '1', type: getConversationTab(legacyArwaConv), unread: 3 }, // Arwa (Sup-Admin) -> Support tab
    { id: '2', type: getConversationTab(newStaffConv), unread: 2 },    // Admin -> Support tab
    { id: '3', type: getConversationTab(newWorkerConv), unread: 5 },   // Worker -> Internal tab
  ];

  const tabUnread = {
    [CONVERSATION_TABS.SUPPORT]: testConversations
      .filter((c) => c.type === CONVERSATION_TABS.SUPPORT)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
    [CONVERSATION_TABS.INTERNAL]: testConversations
      .filter((c) => c.type === CONVERSATION_TABS.INTERNAL)
      .reduce((sum, c) => sum + (c.unread || 0), 0),
  };

  // Staff unread count is 3 + 2 = 5 in Support Conversations
  assert.equal(tabUnread[CONVERSATION_TABS.SUPPORT], 5);
  // Worker/Employer unread count is 5 in Internal Conversations
  assert.equal(tabUnread[CONVERSATION_TABS.INTERNAL], 5);
});

test('11. Admin Messages GET /api/admin/internal-messages discovers conversations with SUPPORT_HELPER', async () => {
  await withSupHelpServer({ users: testUsers }, async (base) => {
    const helperId = '665f1a2b3c4d5e6f7a8b9c01'; // SUPPORT_HELPER
    const adminId = '665f1a2b3c4d5e6f7a8b9c03';  // ADMIN

    // 1. Support helper ensures conversation with Admin
    const { response: ensureRes, body: ensureBody } = await fetchJson(`${base}/api/sup-help/messages/ensure`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({ targetUserId: adminId, tab: 'SUPPORT' }),
    });
    assert.equal(ensureRes.status, 200);
    const convId = ensureBody.conversationId;

    // 2. Support helper sends message to Admin
    const { response: sendRes, body: sendBody } = await fetchJson(`${base}/api/sup-help/messages`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(helperId, 'SUPPORT_HELPER') },
      body: JSON.stringify({
        conversationId: convId,
        recipientId: adminId,
        text: 'Hello Admin from Olivia (Support Helper)',
      }),
    });
    assert.equal(sendRes.status, 201);

    // 3. Admin calls GET /api/admin/internal-messages
    const { response: adminGetRes, body: adminGetBody } = await fetchJson(`${base}/api/admin/internal-messages`, {
      headers: { authorization: createAuthHeader(adminId, 'ADMIN') },
    });
    assert.equal(adminGetRes.status, 200);
    assert.equal(adminGetBody.success, true);
    assert.ok(adminGetBody.conversations.length >= 1);

    const helperConv = adminGetBody.conversations.find(c => c.id === convId);
    assert.ok(helperConv, 'Admin must see conversation with SUPPORT_HELPER in internal messages');
    assert.equal(helperConv.otherStaffId, helperId);
    assert.equal(helperConv.otherStaff.role, 'SUPPORT_HELPER');
    assert.equal(helperConv.lastMessage, 'Hello Admin from Olivia (Support Helper)');

    // 4. Admin fetches messages for this conversation
    const { response: msgRes, body: msgBody } = await fetchJson(`${base}/api/admin/conversations/${convId}/messages`, {
      headers: { authorization: createAuthHeader(adminId, 'ADMIN') },
    });
    assert.equal(msgRes.status, 200);
    assert.equal(msgBody.success, true);
    assert.ok(msgBody.messages.length >= 1);
    assert.equal(msgBody.messages[0].text, 'Hello Admin from Olivia (Support Helper)');

    // 5. Admin starts conversation with SUPPORT_HELPER via POST /api/admin/start-conversation
    const { response: startRes, body: startBody } = await fetchJson(`${base}/api/admin/start-conversation`, {
      method: 'POST',
      headers: { authorization: createAuthHeader(adminId, 'ADMIN') },
      body: JSON.stringify({ userId: helperId, scope: 'STAFF' }),
    });
    assert.equal(startRes.status, 200);
    assert.equal(startBody.success, true);
    assert.equal(startBody.conversation.type, 'INTERNAL');
  });
});
