// backend/src/routes/studentChatAuthorization.test.js
// ============================================================
// STUDENT CHAT AUTHORIZATION TEST SUITE (PHASE 9B)
//
// Verifies private chat authorization between students:
// 1. Student -> Student with no friendship = DENY (403)
// 2. Student -> Student with PENDING friendship = DENY (403)
// 3. Student -> Student with REJECTED friendship = DENY (403)
// 4. Student -> Student with BLOCKED friendship = DENY (403)
// 5. Student -> Student with ACCEPTED friendship = ALLOW (200)
// 6. Reverse direction with ACCEPTED friendship = ALLOW (200)
// 7. ensure-conversation cannot bypass authorization (403 on invalid friendship)
// 8. Message sending cannot bypass authorization (403 on invalid friendship)
// 9. Denied access does not create a conversation
// 10. Denied access does not create a message
// 11. Student -> Co-Admin remains allowed (200)
// 12. Student -> Sup-Admin remains allowed (200)
// 13. Student -> Sup-Help remains allowed (200)
// 14. Student -> Worker remains denied (403)
// 15. Student -> Employer remains denied (403)
// 16. Student -> Doctor remains denied (403) without clinical relationship
// 17. ACCEPTED friendship remains sufficient even when no active class exists
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import StudentFriendship from '../models/StudentFriendship.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import chatRouter from './chat.js';

User.findOneAndUpdate = () => Promise.resolve({});
DoctorAppointment.countDocuments = async () => 0;
DoctorPatientLink.findOne = () => ({ select: async () => null });

const JWT_SECRET = 'student-chat-auth-test-secret-2026-abcdef';
process.env.JWT_SECRET = JWT_SECRET;

const authHeader = (userId, role) => ({
  authorization: `Bearer ${jwt.sign({ userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' })}`,
  'content-type': 'application/json',
});

const STUDENT_A = '665f1a2b3c4d5e6f7a8b9101';
const STUDENT_B = '665f1a2b3c4d5e6f7a8b9102';
const STUDENT_C = '665f1a2b3c4d5e6f7a8b9103';
const ADMIN_ID = '665f1a2b3c4d5e6f7a8b9104';
const SUPPORT_ID = '665f1a2b3c4d5e6f7a8b9105';
const SUPHELP_ID = '665f1a2b3c4d5e6f7a8b9106';
const WORKER_ID = '665f1a2b3c4d5e6f7a8b9107';
const EMPLOYER_ID = '665f1a2b3c4d5e6f7a8b9108';
const DOCTOR_ID = '665f1a2b3c4d5e6f7a8b9109';

const mkUser = (id, fullName, role) => ({
  _id: id,
  id,
  fullName,
  email: `${id.slice(-6)}@homelyserv.test`,
  role,
  isActive: true,
  isSuspended: false,
  tokenVersion: 0,
  profileImage: null,
  toObject() { return { ...this }; },
});

const users = [
  mkUser(STUDENT_A, 'Alice Student', 'STUDENT'),
  mkUser(STUDENT_B, 'Bob Student', 'STUDENT'),
  mkUser(STUDENT_C, 'Charlie Student', 'STUDENT'),
  mkUser(ADMIN_ID, 'Co Admin Person', 'ADMIN'),
  mkUser(SUPPORT_ID, 'Sup Admin Person', 'SUPPORT'),
  mkUser(SUPHELP_ID, 'Sup Help Person', 'SUPPORT_HELPER'),
  mkUser(WORKER_ID, 'Worker Person', 'WORKER'),
  mkUser(EMPLOYER_ID, 'Employer Person', 'EMPLOYER'),
  mkUser(DOCTOR_ID, 'Doctor Person', 'DOCTOR'),
];

const userById = new Map(users.map((u) => [String(u._id), u]));
const convMap = new Map();
const messages = [];
let friendships = [];

const resetState = () => {
  convMap.clear();
  messages.length = 0;
  friendships = [];
};

User.findById = (id) => {
  const user = userById.get(String(id)) || null;
  return { select: async () => user };
};

prisma.user.findMany = async ({ where, select } = {}) => {
  let result = users.slice();
  if (where?.id?.in) result = result.filter((u) => where.id.in.map(String).includes(String(u._id)));
  if (where?.id?.not) result = result.filter((u) => String(u._id) !== String(where.id.not));
  if (where?.role?.in) result = result.filter((u) => where.role.in.includes(u.role));
  if (where?.role) result = result.filter((u) => u.role === where.role);
  return result.map((u) => {
    const out = {};
    for (const key of Object.keys(select || {})) {
      if (key === 'id') out.id = u._id;
      else if (key in u) out[key] = u[key];
    }
    return select ? out : { ...u };
  });
};

prisma.user.findUnique = async ({ where, select } = {}) => {
  const user = userById.get(String(where?.id)) || null;
  if (!user) return null;
  const out = {};
  for (const key of Object.keys(select || {})) {
    if (key === 'id') out.id = user._id;
    else if (key in user) out[key] = user[key];
  }
  return select ? out : { ...user };
};

prisma.userBlock = { findUnique: async () => null, deleteMany: async () => {}, upsert: async () => ({}) };
prisma.subscription = { findMany: async () => [] };
prisma.manualPremiumGrant = { findMany: async () => [] };
prisma.doctorAppointment = { findFirst: async () => null, count: async () => 0 };
prisma.hire = { findFirst: async () => null };
prisma.payment = { findMany: async () => [] };
prisma.workerProfile = { findUnique: async () => null };
prisma.employerProfile = { findUnique: async () => null };

Conversation.findOne = async (query) => {
  const conv = convMap.get(query?.conversationId);
  return conv ? { ...conv } : null;
};
Conversation.find = (query) => {
  let list = Array.from(convMap.values());
  if (query?.conversationId?.$in) {
    list = list.filter((c) => query.conversationId.$in.includes(c.conversationId));
  }
  return {
    sort: () => list.map((c) => ({ ...c })),
    distinct: (field) => [...new Set(list.map((c) => c[field]))],
  };
};
Conversation.create = async (data) => {
  const doc = { _id: `conv_doc_${convMap.size}`, status: 'ACTIVE', ...data };
  convMap.set(doc.conversationId, doc);
  return { ...doc };
};
Conversation.updateOne = async (query, update) => {
  const conv = convMap.get(query?.conversationId);
  if (conv) Object.assign(conv, update?.$set || update);
  return { modifiedCount: 1 };
};
Conversation.findOneAndUpdate = async (query, update) => {
  const conv = convMap.get(query?.conversationId);
  if (conv) {
    Object.assign(conv, update?.$set || update);
    return { ...conv };
  }
  return null;
};

Message.create = async (data) => {
  const doc = {
    _id: `msg_${messages.length}`,
    createdAt: new Date(),
    read: false,
    ...data,
    toObject() { return { ...this }; },
  };
  messages.push(doc);
  return { ...doc };
};
Message.findOne = async (query) => {
  const found = messages.find((m) => m.conversationId === query?.conversationId) || null;
  return found ? { ...found } : null;
};
Message.find = () => ({
  sort: () => messages.slice(),
  limit: () => messages.slice(),
  distinct: async () => [],
});
Message.countDocuments = async () => messages.length;
Message.distinct = async () => [];
Message.aggregate = async () => [];
Message.updateMany = async () => ({ modifiedCount: 0 });

StudentFriendship.findOne = (query) => {
  let match = null;
  if (query?.userLow && query?.userHigh) {
    match = friendships.find(
      (f) => String(f.userLow) === String(query.userLow) &&
             String(f.userHigh) === String(query.userHigh) &&
             (!query.status || f.status === query.status)
    );
  }
  return {
    lean: async () => (match ? { ...match } : null),
  };
};

const addFriendship = (u1, u2, status) => {
  const s1 = String(u1);
  const s2 = String(u2);
  const userLow = s1 < s2 ? s1 : s2;
  const userHigh = s1 < s2 ? s2 : s1;
  const doc = {
    _id: `sf_${friendships.length + 1}`,
    requesterUserId: s1,
    recipientUserId: s2,
    userLow,
    userHigh,
    status,
    createdAt: new Date(),
  };
  friendships.push(doc);
  return doc;
};

// ---------------- Server + helpers ----------------
const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

const call = (path, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
  const payload = body ? Buffer.from(body) : null;
  const req = http.request(
    `${baseUrl}${path}`,
    {
      method,
      agent: false,
      headers: { ...headers, ...(payload ? { 'content-length': payload.length } : {}) },
      timeout: 10000,
    },
    (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
        resolve({ status: res.statusCode, body: parsed });
      });
    }
  );
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const canonicalId = (a, b) => `conv_${[String(a), String(b)].sort().join('_')}`;

test('Student Chat Authorization Suite (Phase 9B)', async (t) => {
  await t.test('1. Student -> Student with no friendship = DENY (403)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0, 'No conversation created');
  });

  await t.test('2. Student -> Student with PENDING friendship = DENY (403)', async () => {
    resetState();
    addFriendship(STUDENT_A, STUDENT_B, 'PENDING');
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('3. Student -> Student with REJECTED friendship = DENY (403)', async () => {
    resetState();
    addFriendship(STUDENT_A, STUDENT_B, 'REJECTED');
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('4. Student -> Student with BLOCKED friendship = DENY (403)', async () => {
    resetState();
    addFriendship(STUDENT_A, STUDENT_B, 'BLOCKED');
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('5. Student -> Student with ACCEPTED friendship = ALLOW (200)', async () => {
    resetState();
    addFriendship(STUDENT_A, STUDENT_B, 'ACCEPTED');
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversationId, canonicalId(STUDENT_A, STUDENT_B));
    assert.equal(convMap.size, 1);
  });

  await t.test('6. Reverse direction with ACCEPTED friendship = ALLOW (200)', async () => {
    resetState();
    // A originally sent request to B, accepted
    addFriendship(STUDENT_A, STUDENT_B, 'ACCEPTED');
    // B initiates conversation with A
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_B, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_B, user2Id: STUDENT_A }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversationId, canonicalId(STUDENT_B, STUDENT_A));
    assert.equal(convMap.size, 1);
  });

  await t.test('7. ensure-conversation cannot bypass authorization on invalid friendship', async () => {
    resetState();
    // No friendship between A and C
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_C }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.has(canonicalId(STUDENT_A, STUDENT_C)), false);
  });

  await t.test('8. Message sending cannot bypass authorization', async () => {
    resetState();
    // Without friendship, direct /api/chat/send fails
    const res = await call('/api/chat/send', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ recipientId: STUDENT_C, text: 'Hello unauthorized' }),
    });
    assert.equal(res.status, 403);
    assert.equal(messages.length, 0);
  });

  await t.test('9. Denied access does not create a conversation', async () => {
    resetState();
    await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_C }),
    });
    assert.equal(convMap.size, 0);
  });

  await t.test('10. Denied access does not create a message', async () => {
    resetState();
    await call('/api/chat/send', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ recipientId: STUDENT_C, text: 'Denied message' }),
    });
    assert.equal(messages.length, 0);
  });

  await t.test('11. Student -> Co-Admin remains allowed (200)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: ADMIN_ID }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversationId, canonicalId(STUDENT_A, ADMIN_ID));
    assert.equal(convMap.size, 1);
  });

  await t.test('12. Student -> Sup-Admin remains allowed (200)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: SUPPORT_ID }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversationId, canonicalId(STUDENT_A, SUPPORT_ID));
    assert.equal(convMap.size, 1);
  });

  await t.test('13. Student -> Sup-Help remains allowed (200)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: SUPHELP_ID }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.conversationId, canonicalId(STUDENT_A, SUPHELP_ID));
    assert.equal(convMap.size, 1);
  });

  await t.test('14. Student -> Worker remains denied (403)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: WORKER_ID }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('15. Student -> Employer remains denied (403)', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: EMPLOYER_ID }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('16. Student -> Doctor remains denied (403) without clinical relationship', async () => {
    resetState();
    const res = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: DOCTOR_ID }),
    });
    assert.equal(res.status, 403);
    assert.equal(convMap.size, 0);
  });

  await t.test('17. ACCEPTED friendship remains sufficient even when no active class exists', async () => {
    resetState();
    addFriendship(STUDENT_A, STUDENT_B, 'ACCEPTED');
    // Ensure conversation
    const ensureRes = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ user1Id: STUDENT_A, user2Id: STUDENT_B }),
    });
    assert.equal(ensureRes.status, 200);

    // Send actual message
    const sendRes = await call('/api/chat/send', {
      method: 'POST',
      headers: authHeader(STUDENT_A, 'STUDENT'),
      body: JSON.stringify({ recipientId: STUDENT_B, text: 'Hi friend!' }),
    });
    assert.equal(sendRes.status, 201);
    assert.equal(messages.length >= 1, true);
  });
});
