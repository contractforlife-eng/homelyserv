import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import chatRouter from './chat.js';

process.env.JWT_SECRET = 'doctor-staff-chat-test-secret-2026-abcdef';
const DOCTOR_ID = '665f1a2b3c4d5e6f7a8b90001';
const ADMIN_ID = '665f1a2b3c4d5e6f7a8b90003';
const SUPPORT_ID = '665f1a2b3c4d5e6f7a8b90004';

const users = [
  { _id: DOCTOR_ID, id: DOCTOR_ID, fullName: 'Dr', role: 'DOCTOR', email: 'd@t.test', profileImage: null, tokenVersion: 0, isSuspended: false },
  { _id: ADMIN_ID, id: ADMIN_ID, fullName: 'Admin', role: 'ADMIN', email: 'a@t.test', profileImage: null, tokenVersion: 0, isSuspended: false },
  { _id: SUPPORT_ID, id: SUPPORT_ID, fullName: 'Sup', role: 'SUPPORT', email: 's@t.test', profileImage: null, tokenVersion: 0, isSuspended: false },
];
const userById = new Map(users.map((u) => [String(u._id), u]));
const convMap = new Map();
const messages = [];
User.findById = (id) => ({ select: async () => userById.get(String(id)) || null });
prisma.user.findMany = async ({ where, select } = {}) => {
  let r = users.slice();
  if (where?.id?.in) r = r.filter((u) => where.id.in.map(String).includes(String(u._id)));
  if (where?.id?.not) r = r.filter((u) => String(u._id) !== String(where.id.not));
  if (where?.role?.in) r = r.filter((u) => where.role.in.includes(u.role));
  return r.map((u) => {
    const out = {};
    for (const k of Object.keys(select || {})) { if (k === 'id') out.id = u._id; else if (k in u) out[k] = u[k]; }
    return select ? out : { ...u };
  });
};
prisma.user.findUnique = async ({ where, select } = {}) => {
  const u = userById.get(String(where?.id)) || null;
  if (!u) return null;
  const out = {};
  for (const k of Object.keys(select || {})) { if (k === 'id') out.id = u._id; else if (k in u) out[k] = u[k]; }
  return select ? out : { ...u };
};
prisma.userBlock = { findUnique: async () => null, deleteMany: async () => {}, upsert: async () => ({}) };
prisma.subscription = { findMany: async () => [] };
prisma.manualPremiumGrant = { findMany: async () => [] };
Conversation.findOne = async (q) => { const c = convMap.get(q?.conversationId); return c ? { ...c } : null; };
Conversation.create = async (d) => { convMap.set(d.conversationId, d); return { ...d }; };
Conversation.updateOne = async () => ({ modifiedCount: 0 });
Message.create = async (d) => { messages.push(d); return { ...d, _id: `m${messages.length}` }; };
Message.findOne = (q) => { const f = messages.find((m) => m.conversationId === q.conversationId) || null; return { sort: () => f, select: () => f, then: (a, b) => Promise.resolve(f).then(a, b) }; };

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);
const server = app.listen(0);
server.unref();
const base = `http://127.0.0.1:${server.address().port}`;
const auth = (id, role) => ({ authorization: `Bearer ${jwt.sign({ userId: id, role }, process.env.JWT_SECRET)}`, 'content-type': 'application/json' });
const post = (path, body, id, role) => new Promise((res2, rej) => {
  const payload = Buffer.from(JSON.stringify(body));
  const r = http.request(`${base}${path}`, { method: 'POST', headers: { ...auth(id, role), 'content-length': payload.length }, timeout: 8000 }, (rs) => {
    const c = []; rs.on('data', (d) => c.push(d)); rs.on('end', () => res2(rs.statusCode));
  });
  r.on('timeout', () => r.destroy(new Error('timeout')));
  r.on('error', rej);
  r.write(payload); r.end();
});
const body = (t) => ({ user1Id: DOCTOR_ID, user1Name: 'Dr', user1Role: 'DOCTOR', user2Id: t, user2Name: 'S', user2Role: 'X' });

for (const target of [ADMIN_ID, SUPPORT_ID]) {
  console.log('->', target.slice(-2));
  console.log('   status', await post('/api/chat/ensure-conversation', body(target), DOCTOR_ID, 'DOCTOR'));
}
console.log('DONE');
server.close();
