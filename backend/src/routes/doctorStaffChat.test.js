// backend/src/routes/doctorStaffChat.test.js
// ============================================================
// DOCTOR -> HOMELYSERV STAFF CHAT (existing chat architecture)
//
// Verifies the real authorization behavior of the Doctor staff-contact
// path without creating any new chat system:
//   1-3. Doctor can discover Co-Admin / Sup-Admin / Sup-Help
//   4-6. Doctor can start a conversation with each of them
//   7.   An existing conversation is reused (never duplicated)
//   8-9. A Doctor cannot target a WORKER / EMPLOYER through it
//   10.  Worker/Employer staff-directory access stays rejected and the
//        existing staff caller behavior is unchanged
//   11.  Doctor <-> patient rules are unchanged
//   12.  A doctorId in the request body grants nothing
//
// Everything runs against in-memory mocks and one local test server.
// No real user, conversation or message is read or written.
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
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import chatRouter from './chat.js';

const JWT_SECRET = 'doctor-staff-chat-test-secret-2026-abcdef';
process.env.JWT_SECRET = JWT_SECRET;

const authHeader = (userId, role) => ({
  authorization: `Bearer ${jwt.sign({ userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' })}`,
  'content-type': 'application/json',
});

const DOCTOR_ID = '665f1a2b3c4d5e6f7a8b90001';
const OTHER_DOCTOR_ID = '665f1a2b3c4d5e6f7a8b90002';
const ADMIN_ID = '665f1a2b3c4d5e6f7a8b90003';
const SUPPORT_ID = '665f1a2b3c4d5e6f7a8b90004';
const SUPHELP_ID = '665f1a2b3c4d5e6f7a8b90005';
const WORKER_ID = '665f1a2b3c4d5e6f7a8b90006';
const EMPLOYER_ID = '665f1a2b3c4d5e6f7a8b90007';
const PATIENT_ID = '665f1a2b3c4d5e6f7a8b90008';

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
  mkUser(DOCTOR_ID, 'Dr. Doctor One', 'DOCTOR'),
  mkUser(OTHER_DOCTOR_ID, 'Dr. Doctor Two', 'DOCTOR'),
  mkUser(ADMIN_ID, 'Co Admin Person', 'ADMIN'),
  mkUser(SUPPORT_ID, 'Sup Admin Person', 'SUPPORT'),
  mkUser(SUPHELP_ID, 'Sup Help Person', 'SUPPORT_HELPER'),
  mkUser(WORKER_ID, 'Worker Person', 'WORKER'),
  mkUser(EMPLOYER_ID, 'Employer Person', 'EMPLOYER'),
  mkUser(PATIENT_ID, 'Patient Person', 'USER'),
];

// ---------------- In-memory chat state ----------------
const userById = new Map(users.map((u) => [String(u._id), u]));
const convMap = new Map();
const messages = [];
let relatedPatientIds = [];

/** Clear conversation/message state and set the clinical-relationship set. */
const resetChatState = (patientIds = []) => {
  convMap.clear();
  messages.length = 0;
  relatedPatientIds = patientIds.map(String);
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
const applyQuery = (list, query = {}) => {
  if (query.conversationId) {
    if (query.conversationId.$in) {
      return list.filter((m) => query.conversationId.$in.includes(m.conversationId));
    }
    return list.filter((m) => m.conversationId === query.conversationId);
  }
  if (query.$or) {
    return list.filter((m) => query.$or.some((clause) => (
      Object.entries(clause).every(([key, value]) => m[key] === value)
    )));
  }
  return list;
};
Message.find = (query) => {
  const list = applyQuery(messages, query).map((m) => ({ ...m }));
  return {
    sort: () => list,
    select: () => ({ sort: () => list }),
    limit: () => list,
    distinct: async (field) => [...new Set(list.map((m) => m[field]))],
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};
Message.findOne = (query) => {
  const found = applyQuery(messages, query)[0] || null;
  return {
    sort: () => found,
    select: () => found,
    then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
  };
};
Message.countDocuments = async (query) => applyQuery(messages, query).length;
Message.distinct = async (field, query) => [...new Set(applyQuery(messages, query).map((m) => m[field]))];
Message.aggregate = async () => [];
Message.updateMany = async () => ({ modifiedCount: 0 });

// Clinical relationship control used by the authorization layer: only the
// listed patient ids have an established CONFIRMED/COMPLETED appointment.
DoctorAppointment.countDocuments = async (filter) => (
  relatedPatientIds.includes(String(filter?.patientId)) ? 1 : 0
);
DoctorPatientLink.findOne = async () => null;

// ---------------- Server + helpers ----------------
const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

// Raw http.request instead of fetch: no client socket pooling, so repeated
// calls inside the same test stay fully independent.
const call = (path, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
  const payload = body ? Buffer.from(body) : null;
  const req = http.request(
    `${baseUrl}${path}`,
    {
      method,
      // agent:false disables keep-alive so sockets close with the response and
      // server.close() in test.after() is never blocked by an idle connection.
      agent: false,
      headers: { ...headers, ...(payload ? { 'content-length': payload.length } : {}) },
      timeout: 15000,
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
    },
  );
  req.on('timeout', () => req.destroy(new Error('request timeout')));
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

// Same deterministic id the backend builds: conv_<sorted participant pair>.
const canonicalId = (a, b) => `conv_${[String(a), String(b)].sort().join('_')}`;

const ensureBody = (callerId, targetId, targetRole) => ({
  user1Id: callerId,
  user1Name: 'Dr. Doctor One',
  user1Role: 'DOCTOR',
  user2Id: targetId,
  user2Name: 'Staff Member',
  user2Role: targetRole,
});


prisma.userBlock = { findUnique: async () => null, deleteMany: async () => {}, upsert: async () => ({}) };
// Identity enrichment reads entitlement rows; keep it off any real database.
prisma.subscription = { findMany: async () => [] };
prisma.manualPremiumGrant = { findMany: async () => [] };

test('Doctor <-> HomelyServ staff chat (existing chat architecture)', async (t) => {
  await t.test('1-3. Doctor discovers Co-Admin, Sup-Admin and Sup-Help (never workers/employers)', async () => {
    resetChatState();
    const { status, body } = await call('/api/chat/staff-directory', {
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.staff.map((s) => s.role).sort(), ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER']);
    const ids = body.staff.map((s) => String(s.id));
    assert.ok(ids.includes(ADMIN_ID), 'Co-Admin discoverable');
    assert.ok(ids.includes(SUPPORT_ID), 'Sup-Admin discoverable');
    assert.ok(ids.includes(SUPHELP_ID), 'Sup-Help discoverable');
    assert.ok(!ids.includes(WORKER_ID), 'no workers');
    assert.ok(!ids.includes(EMPLOYER_ID), 'no employers');
    assert.ok(!ids.includes(DOCTOR_ID), 'caller excluded');
    // Minimal safe fields only (no password/token leakage).
    assert.deepEqual(Object.keys(body.staff[0]).sort(), ['email', 'fullName', 'id', 'profileImage', 'role']);
  });

  await t.test('4-6. Doctor can start a conversation with ADMIN, SUPPORT and SUPPORT_HELPER', async () => {
    resetChatState();
    const targets = [[ADMIN_ID, 'ADMIN'], [SUPPORT_ID, 'SUPPORT'], [SUPHELP_ID, 'SUPPORT_HELPER']];

    for (const [staffId, staffRole] of targets) {
      const { status, body } = await call('/api/chat/ensure-conversation', {
        method: 'POST',
        headers: authHeader(DOCTOR_ID, 'DOCTOR'),
        body: JSON.stringify(ensureBody(DOCTOR_ID, staffId, staffRole)),
      });
      assert.equal(status, 200, `ensure-conversation with ${staffRole}`);
      assert.equal(body.conversationId, canonicalId(DOCTOR_ID, staffId));
      const conv = convMap.get(body.conversationId);
      assert.ok(conv, 'conversation metadata created');
      // Same classification already used by Worker/Employer <-> Support.
      assert.equal(conv.type, 'SUPPORT');
      assert.ok(conv.participantIds.map(String).includes(DOCTOR_ID));
      assert.ok(conv.participantIds.map(String).includes(staffId));
    }
  });

  await t.test('7. Existing Doctor <-> staff conversation is reused, never duplicated', async () => {
    resetChatState();
    const options = {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify(ensureBody(DOCTOR_ID, SUPPORT_ID, 'SUPPORT')),
    };
    const first = await call('/api/chat/ensure-conversation', options);
    assert.equal(first.status, 200);
    const conversationsAfterFirst = convMap.size;
    const messagesAfterFirst = messages.length;

    // A second ensure for the same pair must reopen the SAME canonical thread.
    const second = await call('/api/chat/ensure-conversation', options);
    assert.equal(second.status, 200);
    assert.equal(second.body.conversationId, first.body.conversationId);
    assert.equal(second.body.conversationId, canonicalId(DOCTOR_ID, SUPPORT_ID));
    assert.equal(convMap.size, conversationsAfterFirst, 'no duplicate conversation');

  await t.test('8-9. Doctor cannot target a WORKER or EMPLOYER through the staff path', async () => {
    resetChatState();
    for (const [targetId, label] of [[WORKER_ID, 'WORKER'], [EMPLOYER_ID, 'EMPLOYER']]) {
      // The crafted body claims a staff role; the real DB role must win.
      const { status } = await call('/api/chat/ensure-conversation', {
        method: 'POST',
        headers: authHeader(DOCTOR_ID, 'DOCTOR'),
        body: JSON.stringify(ensureBody(DOCTOR_ID, targetId, 'SUPPORT')),
      });
      assert.equal(status, 403, `targeting a ${label} must be rejected`);
    }
    assert.equal(convMap.size, 0, 'no conversation for a rejected target');
  });

  await t.test('10. Worker/Employer staff-directory stays rejected; staff callers unchanged', async () => {
    resetChatState();
    for (const [callerId, role] of [[WORKER_ID, 'WORKER'], [EMPLOYER_ID, 'EMPLOYER']]) {
      const { status } = await call('/api/chat/staff-directory', { headers: authHeader(callerId, role) });
      assert.equal(status, 403, `${role} must not read the staff directory`);
    }
    for (const [callerId, role] of [[SUPPORT_ID, 'SUPPORT'], [ADMIN_ID, 'ADMIN'], [SUPHELP_ID, 'SUPPORT_HELPER']]) {
      const { status, body } = await call('/api/chat/staff-directory', { headers: authHeader(callerId, role) });
      assert.equal(status, 200, `${role} keeps staff-directory access`);
      assert.ok(!body.staff.map((s) => String(s.id)).includes(String(callerId)));
    }
  });

  await t.test('11. Doctor <-> patient chat rules are unchanged', async () => {
    resetChatState([PATIENT_ID]);
    const allowed = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify(ensureBody(DOCTOR_ID, PATIENT_ID, 'USER')),
    });
    assert.equal(allowed.status, 200, 'patient with a clinical relationship stays allowed');
    assert.equal(convMap.get(allowed.body.conversationId).type, 'PRIVATE');

    resetChatState([]);
    const denied = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify(ensureBody(DOCTOR_ID, PATIENT_ID, 'USER')),
    });
    assert.equal(denied.status, 403, 'unrelated user stays blocked');
    assert.equal(convMap.size, 0);
  });

  await t.test('12. A doctorId in the request body grants nothing', async () => {
    resetChatState();
    const { status, body } = await call('/api/chat/ensure-conversation', {
      method: 'POST',
      headers: authHeader(OTHER_DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify({ ...ensureBody(OTHER_DOCTOR_ID, ADMIN_ID, 'ADMIN'), doctorId: DOCTOR_ID }),
    });
    assert.equal(status, 200, 'the authenticated doctor may still reach staff');
    assert.equal(body.conversationId, canonicalId(OTHER_DOCTOR_ID, ADMIN_ID));
    const conv = convMap.get(body.conversationId);
    assert.ok(!conv.participantIds.map(String).includes(String(DOCTOR_ID)));
  });
});

    assert.equal(messages.length, messagesAfterFirst, 'no duplicate seed message');
  });

