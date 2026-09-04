// backend/src/routes/supHelpLiveSupport.test.js
// ============================================================
// Full Live Support verification test suite for SUPPORT_HELPER.
// Uses node:test with in-memory test mocks.
// ============================================================
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PublicSupportConversation from "../models/PublicSupportConversation.js";
import PublicSupportMessage from "../models/PublicSupportMessage.js";
import publicSupportRouter from "./publicSupport.js";
import { verifyStaffToken } from "../services/publicSupportAccessService.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_12345";

const createAuthHeader = (userId, role) => {
  const token = jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "1h" });
  return `Bearer ${token}`;
};

const createRawToken = (userId, role) => {
  return jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "1h" });
};

const testUsers = {
  "665f1a2b3c4d5e6f7a8b9c01": { _id: "665f1a2b3c4d5e6f7a8b9c01", id: "665f1a2b3c4d5e6f7a8b9c01", fullName: "Helper Eve", email: "helper@test.com", role: "SUPPORT_HELPER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c02": { _id: "665f1a2b3c4d5e6f7a8b9c02", id: "665f1a2b3c4d5e6f7a8b9c02", fullName: "Support Carol", email: "support@test.com", role: "SUPPORT", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c03": { _id: "665f1a2b3c4d5e6f7a8b9c03", id: "665f1a2b3c4d5e6f7a8b9c03", fullName: "Admin Dave", email: "admin@test.com", role: "ADMIN", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c04": { _id: "665f1a2b3c4d5e6f7a8b9c04", id: "665f1a2b3c4d5e6f7a8b9c04", fullName: "Worker Alice", email: "worker@test.com", role: "WORKER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c05": { _id: "665f1a2b3c4d5e6f7a8b9c05", id: "665f1a2b3c4d5e6f7a8b9c05", fullName: "Helper Bob", email: "helper2@test.com", role: "SUPPORT_HELPER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c06": { _id: "665f1a2b3c4d5e6f7a8b9c06", id: "665f1a2b3c4d5e6f7a8b9c06", fullName: "Employer Sam", email: "employer@test.com", role: "EMPLOYER", tokenVersion: 0 },
};

const withTestServer = async ({ conversations = [], messages = [] }, run) => {
  const convMap = new Map();
  conversations.forEach((c) => convMap.set(String(c._id || c.id), { ...c, _id: c._id || c.id }));

  const msgList = [...messages];

  const saved = {
    userFindById: User.findById,
    convFind: PublicSupportConversation.find,
    convFindById: PublicSupportConversation.findById,
    convFindByIdAndUpdate: PublicSupportConversation.findByIdAndUpdate,
    convFindOneAndUpdate: PublicSupportConversation.findOneAndUpdate,
    convCreate: PublicSupportConversation.create,
    convFindOne: PublicSupportConversation.findOne,
    msgFind: PublicSupportMessage.find,
    msgCreate: PublicSupportMessage.create,
    msgFindOne: PublicSupportMessage.findOne,
  };

  const prisma = (await import('../lib/prisma.js')).default;
  const savedPrismaUserFindUnique = prisma.user.findUnique;
  const savedPrismaUserFindMany = prisma.user.findMany;
  const savedPrismaSupportActivityCreate = prisma.supportActivity?.create;

  User.findById = (id) => ({
    select: async () => {
      const u = testUsers[String(id)];
      return u ? { ...u } : null;
    },
  });

  prisma.user.findUnique = async ({ where }) => {
    const u = testUsers[String(where.id)];
    return u ? { ...u } : null;
  };
  prisma.user.findMany = async ({ where } = {}) => {
    let users = Object.values(testUsers);
    if (where?.id?.in) users = users.filter((u) => where.id.in.includes(String(u.id)));
    if (where?.role) users = users.filter((u) => u.role === where.role);
    return users.map((u) => ({ ...u }));
  };
  if (prisma.supportActivity) {
    prisma.supportActivity.create = async () => ({ id: 'act_1' });
  }

  PublicSupportConversation.findOneAndUpdate = async (filter, update) => {
    const id = String(filter._id);
    const c = convMap.get(id);
    if (!c) return null;
    if (filter.status && c.status !== filter.status) return null;
    if (filter.assignedTo !== undefined && String(c.assignedTo || "") !== String(filter.assignedTo || "")) return null;

    const updates = update.$set || update;
    Object.assign(c, updates);
    convMap.set(id, c);
    return {
      ...c,
      save: async function () { return this; },
    };
  };

  PublicSupportConversation.find = (filter = {}) => {
    let items = Array.from(convMap.values());
    if (filter.$and) {
      for (const cond of filter.$and) {
        if (cond.status?.$in) {
          items = items.filter((item) => cond.status.$in.includes(item.status));
        } else if (cond.status?.$ne) {
          items = items.filter((item) => item.status !== cond.status.$ne);
        }
        if (cond.$or) {
          items = items.filter((item) => {
            return cond.$or.some((orCond) => {
              if (orCond.assignedTo === null) return !item.assignedTo;
              if (orCond.assignedTo?.$exists === false) return !item.assignedTo;
              return String(item.assignedTo) === String(orCond.assignedTo);
            });
          });
        }
      }
    } else if (filter.status?.$in) {
      items = items.filter((item) => filter.status.$in.includes(item.status));
    } else if (filter.status?.$ne) {
      items = items.filter((item) => item.status !== filter.status.$ne);
    }
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => items.map((c) => ({ ...c })),
        }),
      }),
    };
  };

  PublicSupportConversation.findById = async (id) => {
    const c = convMap.get(String(id));
    if (!c) return null;
    return {
      ...c,
      save: async function () {
        convMap.set(String(this._id), { ...this });
        return this;
      },
    };
  };

  PublicSupportConversation.findByIdAndUpdate = async (id, update) => {
    const c = convMap.get(String(id));
    if (!c) return null;
    Object.assign(c, update);
    convMap.set(String(id), c);
    return {
      ...c,
      save: async function () { return this; },
    };
  };

  PublicSupportConversation.create = async (doc) => {
    const id = doc._id || `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const savedDoc = {
      _id: id,
      status: "BOT",
      guestUnreadCount: 0,
      staffUnreadCount: 0,
      lastMessage: "",
      lastMessageAt: new Date(),
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
      save: async function () {
        convMap.set(String(this._id), { ...this });
        return this;
      },
    };
    convMap.set(String(id), savedDoc);
    return savedDoc;
  };

  PublicSupportConversation.findOne = async (filter) => {
    return Array.from(convMap.values()).find((c) => {
      if (filter.publicId && c.publicId !== filter.publicId) return false;
      return true;
    }) || null;
  };

  PublicSupportMessage.find = (filter = {}) => {
    let items = msgList.filter((m) => String(m.conversationId) === String(filter.conversationId));
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => items.map((m) => ({ ...m })),
        }),
      }),
    };
  };

  PublicSupportMessage.create = async (doc) => {
    const id = doc._id || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newMsg = {
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc,
    };
    msgList.push(newMsg);
    return newMsg;
  };

  PublicSupportMessage.findOne = async (filter) => {
    return msgList.find((m) => {
      if (filter.conversationId && String(m.conversationId) !== String(filter.conversationId)) return false;
      if (filter.clientMessageId && m.clientMessageId !== filter.clientMessageId) return false;
      return true;
    }) || null;
  };

  const app = express();
  app.use(express.json());
  app.use("/api/public-support", publicSupportRouter);

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const request = async (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, ok: res.ok, data };
  };

  try {
    await run({ request, convMap, msgList });
  } finally {
    User.findById = saved.userFindById;
    PublicSupportConversation.find = saved.convFind;
    PublicSupportConversation.findById = saved.convFindById;
    PublicSupportConversation.findByIdAndUpdate = saved.convFindByIdAndUpdate;
    PublicSupportConversation.findOneAndUpdate = saved.convFindOneAndUpdate;
    PublicSupportConversation.create = saved.convCreate;
    PublicSupportConversation.findOne = saved.convFindOne;
    PublicSupportMessage.find = saved.msgFind;
    PublicSupportMessage.create = saved.msgCreate;
    PublicSupportMessage.findOne = saved.msgFindOne;
    prisma.user.findUnique = savedPrismaUserFindUnique;
    prisma.user.findMany = savedPrismaUserFindMany;
    if (prisma.supportActivity) prisma.supportActivity.create = savedPrismaSupportActivityCreate;
    await new Promise((resolve) => server.close(resolve));
  }
};

// ============================================================
// TESTS
// ============================================================

test("1. SUPPORT_HELPER can list waiting/unassigned Live Support conversations", async () => {
  const conversations = [
    { _id: "665f00000000000000000001", publicId: "pub-1", visitorName: "John Doe", visitorEmail: "john@example.com", language: "en", status: "WAITING_FOR_SUPPORT", assignedTo: null, lastMessage: "Need help", lastMessageAt: new Date() },
    { _id: "665f00000000000000000002", publicId: "pub-2", visitorName: "Jane Smith", visitorEmail: "jane@example.com", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", lastMessage: "Checking in", lastMessageAt: new Date() },
    { _id: "665f00000000000000000003", publicId: "pub-3", visitorName: "Bob Other", visitorEmail: "bob@example.com", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c05", assignedRole: "SUPPORT_HELPER", lastMessage: "Private to Bob", lastMessageAt: new Date() },
  ];

  await withTestServer({ conversations }, async ({ request }) => {
    const authHeader = createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");
    const res = await request("/api/public-support/staff/conversations", {
      headers: { Authorization: authHeader },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    // Eve should see waiting (pub-1) and own (pub-2), but NOT Bob's assigned (pub-3)
    const ids = res.data.conversations.map((c) => c.id);
    assert.ok(ids.includes("665f00000000000000000001"), "Should see waiting conversation");
    assert.ok(ids.includes("665f00000000000000000002"), "Should see own assigned conversation");
    assert.ok(!ids.includes("665f00000000000000000003"), "Should NOT see another helper's assigned conversation");
  });
});

test("2. SUPPORT_HELPER can claim permitted unassigned conversation", async () => {
  const conversations = [
    { _id: "665f00000000000000000010", publicId: "pub-10", visitorName: "Visitor A", language: "en", status: "WAITING_FOR_SUPPORT", assignedTo: null },
  ];

  await withTestServer({ conversations }, async ({ request }) => {
    const authHeader = createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");
    const res = await request("/api/public-support/staff/conversations/665f00000000000000000010/claim", {
      method: "POST",
      headers: { Authorization: authHeader },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.conversation.status, "ASSIGNED");
    assert.equal(res.data.conversation.assignedTo, "665f1a2b3c4d5e6f7a8b9c01");
    assert.equal(res.data.conversation.assignedRole, "SUPPORT_HELPER");
  });
});

test("3. Queue isolation: Helper A cannot claim or mutate Helper B's assigned conversation", async () => {
  const conversations = [
    { _id: "665f00000000000000000020", publicId: "pub-20", visitorName: "Visitor B", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c05", assignedRole: "SUPPORT_HELPER" },
  ];

  await withTestServer({ conversations }, async ({ request }) => {
    const helperAAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");

    // Attempt to view
    const viewRes = await request("/api/public-support/staff/conversations/665f00000000000000000020", {
      headers: { Authorization: helperAAuth },
    });
    assert.equal(viewRes.status, 403, "Viewing Helper B conversation must be 403");

    // Attempt to claim
    const claimRes = await request("/api/public-support/staff/conversations/665f00000000000000000020/claim", {
      method: "POST",
      headers: { Authorization: helperAAuth },
    });
    assert.equal(claimRes.status, 409, "Claiming already-assigned conversation must be 409");

    // Attempt to send message
    const msgRes = await request("/api/public-support/staff/conversations/665f00000000000000000020/messages", {
      method: "POST",
      headers: { Authorization: helperAAuth },
      body: JSON.stringify({ body: "Hijack attempt" }),
    });
    assert.equal(msgRes.status, 403, "Messaging Helper B conversation must be 403");

    // Attempt to close
    const closeRes = await request("/api/public-support/staff/conversations/665f00000000000000000020/close", {
      method: "POST",
      headers: { Authorization: helperAAuth },
    });
    assert.equal(closeRes.status, 403, "Closing Helper B conversation must be 403");
  });
});

test("4. SUPPORT_HELPER can read conversation history and send replies", async () => {
  const conversations = [
    { _id: "665f00000000000000000030", publicId: "pub-30", visitorName: "Visitor C", visitorEmail: "vc@test.com", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER" },
  ];
  const messages = [
    { _id: "msg-1", conversationId: "665f00000000000000000030", senderType: "VISITOR", body: "Hello I need help with booking" },
  ];

  await withTestServer({ conversations, messages }, async ({ request, msgList }) => {
    const authHeader = createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");

    // Read conversation
    const getRes = await request("/api/public-support/staff/conversations/665f00000000000000000030", {
      headers: { Authorization: authHeader },
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.data.messages.length, 1);
    assert.equal(getRes.data.messages[0].body, "Hello I need help with booking");

    // Send reply
    const sendRes = await request("/api/public-support/staff/conversations/665f00000000000000000030/messages", {
      method: "POST",
      headers: { Authorization: authHeader },
      body: JSON.stringify({ body: "Hello! I am happy to help you." }),
    });
    assert.equal(sendRes.status, 201);
    assert.equal(sendRes.data.message.senderType, "STAFF");
    assert.equal(sendRes.data.message.senderRole, "SUPPORT_HELPER");
    assert.equal(sendRes.data.message.body, "Hello! I am happy to help you.");

    // Verify stored message
    const lastMsg = msgList[msgList.length - 1];
    assert.equal(lastMsg.senderRole, "SUPPORT_HELPER");
    assert.equal(lastMsg.senderId, "665f1a2b3c4d5e6f7a8b9c01");
  });
});

test("5. SUPPORT_HELPER can close an assigned Live Support conversation", async () => {
  const conversations = [
    { _id: "665f00000000000000000040", publicId: "pub-40", visitorName: "Visitor D", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER" },
  ];

  await withTestServer({ conversations }, async ({ request, convMap }) => {
    const authHeader = createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");
    const res = await request("/api/public-support/staff/conversations/665f00000000000000000040/close", {
      method: "POST",
      headers: { Authorization: authHeader },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.conversation.status, "CLOSED");
    assert.equal(res.data.conversation.closeReason, "STAFF_CLOSED");

    const updated = convMap.get("665f00000000000000000040");
    assert.equal(updated.status, "CLOSED");
    assert.ok(updated.closedAt, "closedAt must be set");
  });
});

test("6. Admin supervision: ADMIN sees all conversations and can intervene on Sup-Help conversations", async () => {
  const conversations = [
    { _id: "665f00000000000000000050", publicId: "pub-50", visitorName: "Visitor E", language: "en", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER" },
  ];

  await withTestServer({ conversations }, async ({ request }) => {
    const adminAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c03", "ADMIN");

    // Admin can view Helper-assigned conversation
    const getRes = await request("/api/public-support/staff/conversations/665f00000000000000000050", {
      headers: { Authorization: adminAuth },
    });
    assert.equal(getRes.status, 200);

    // Admin can send message
    const msgRes = await request("/api/public-support/staff/conversations/665f00000000000000000050/messages", {
      method: "POST",
      headers: { Authorization: adminAuth },
      body: JSON.stringify({ body: "Admin supervisory intervention" }),
    });
    assert.equal(msgRes.status, 201);
    assert.equal(msgRes.data.message.senderRole, "ADMIN");

    // Admin can close
    const closeRes = await request("/api/public-support/staff/conversations/665f00000000000000000050/close", {
      method: "POST",
      headers: { Authorization: adminAuth },
    });
    assert.equal(closeRes.status, 200);
  });
});

test("7. Unauthorized roles (WORKER, EMPLOYER) are rejected with 403 on staff routes", async () => {
  await withTestServer({}, async ({ request }) => {
    const workerAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c04", "WORKER");
    const employerAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c06", "EMPLOYER");

    const wRes = await request("/api/public-support/staff/conversations", {
      headers: { Authorization: workerAuth },
    });
    assert.equal(wRes.status, 403, "WORKER must receive 403");

    const eRes = await request("/api/public-support/staff/conversations", {
      headers: { Authorization: employerAuth },
    });
    assert.equal(eRes.status, 403, "EMPLOYER must receive 403");
  });
});

test("8. verifyStaffToken authorizes SUPPORT_HELPER, SUPPORT, ADMIN, and rejects others", async () => {
  const savedFindById = User.findById;
  User.findById = (id) => ({
    select: async () => testUsers[String(id)] || null,
  });

  try {
    const helperToken = createRawToken("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER");
    const supportToken = createRawToken("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT");
    const adminToken = createRawToken("665f1a2b3c4d5e6f7a8b9c03", "ADMIN");
    const workerToken = createRawToken("665f1a2b3c4d5e6f7a8b9c04", "WORKER");

    const helperResult = await verifyStaffToken(helperToken);
    assert.ok(helperResult, "SUPPORT_HELPER token must verify");
    assert.equal(helperResult.role, "SUPPORT_HELPER");

    const supportResult = await verifyStaffToken(supportToken);
    assert.ok(supportResult, "SUPPORT token must verify");

    const adminResult = await verifyStaffToken(adminToken);
    assert.ok(adminResult, "ADMIN token must verify");

    const workerResult = await verifyStaffToken(workerToken);
    assert.equal(workerResult, null, "WORKER token must be rejected");
  } finally {
    User.findById = savedFindById;
  }
});

// ============================================================
// PHASE B3 — SUPERVISOR TAKEOVER & TRANSFER TESTS
// ============================================================

test("9. B3: SUPPORT takes over SUPPORT_HELPER session successfully", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c10";
  const initialConversation = {
    _id: convId,
    publicId: "pub-takeover-1",
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c01", // Helper Eve
    assignedRole: "SUPPORT_HELPER",
    visitorName: "Visitor John",
    lastMessage: "Need help",
  };
  const initialMessages = [
    { _id: "m1", conversationId: convId, senderType: "VISITOR", body: "Hello" },
    { _id: "m2", conversationId: convId, senderType: "STAFF", senderId: "665f1a2b3c4d5e6f7a8b9c01", senderRole: "SUPPORT_HELPER", body: "Hi I am Eve" },
  ];

  await withTestServer({ conversations: [initialConversation], messages: initialMessages }, async ({ request, convMap }) => {
    const res = await request(`/api/public-support/staff/conversations/${convId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") }, // Carol
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.conversation.assignedTo, "665f1a2b3c4d5e6f7a8b9c02");
    assert.equal(res.data.conversation.assignedRole, "SUPPORT");
    assert.equal(res.data.conversation.status, "ASSIGNED");

    // Verify DB state
    const updated = convMap.get(convId);
    assert.equal(String(updated.assignedTo), "665f1a2b3c4d5e6f7a8b9c02");
    assert.equal(updated.assignedRole, "SUPPORT");
    assert.equal(updated.publicId, "pub-takeover-1");

    // Old helper send blocked (403)
    const oldHelperSend = await request(`/api/public-support/staff/conversations/${convId}/messages`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
      body: JSON.stringify({ body: "Eve trying to reply after takeover" }),
    });
    assert.equal(oldHelperSend.status, 403);

    // Old helper close blocked (403)
    const oldHelperClose = await request(`/api/public-support/staff/conversations/${convId}/close`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(oldHelperClose.status, 403);

    // New owner Carol send allowed (201)
    const carolSend = await request(`/api/public-support/staff/conversations/${convId}/messages`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ body: "Hello, supervisor Carol taking over." }),
    });
    assert.equal(carolSend.status, 201);

    // New owner Carol close allowed (200)
    const carolClose = await request(`/api/public-support/staff/conversations/${convId}/close`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(carolClose.status, 200);
  });
});

test("10. B3: SUPPORT transfers session from Helper A to Helper B successfully", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c11";
  const initialConversation = {
    _id: convId,
    publicId: "pub-transfer-1",
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c01", // Helper Eve
    assignedRole: "SUPPORT_HELPER",
    visitorName: "Visitor Sarah",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request }) => {
    const res = await request(`/api/public-support/staff/conversations/${convId}/reassign`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({
        targetHelperId: "665f1a2b3c4d5e6f7a8b9c05", // Helper Bob
        expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01",
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.conversation.assignedTo, "665f1a2b3c4d5e6f7a8b9c05");
    assert.equal(res.data.conversation.assignedRole, "SUPPORT_HELPER");

    // Helper A Eve loses mutation
    const eveSend = await request(`/api/public-support/staff/conversations/${convId}/messages`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
      body: JSON.stringify({ body: "Eve message" }),
    });
    assert.equal(eveSend.status, 403);

    // Helper B Bob gains mutation
    const bobSend = await request(`/api/public-support/staff/conversations/${convId}/messages`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c05", "SUPPORT_HELPER") },
      body: JSON.stringify({ body: "Bob message" }),
    });
    assert.equal(bobSend.status, 201);
  });
});

test("11. B3: Transfer rejects non-helper targets and same current assignee", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c12";
  const initialConversation = {
    _id: convId,
    publicId: "pub-transfer-2",
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c01", // Helper Eve
    assignedRole: "SUPPORT_HELPER",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request }) => {
    // Target is WORKER -> 400
    const resWorker = await request(`/api/public-support/staff/conversations/${convId}/reassign`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c04" }), // Worker Alice
    });
    assert.equal(resWorker.status, 400);

    // Target is ADMIN -> 400
    const resAdmin = await request(`/api/public-support/staff/conversations/${convId}/reassign`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c03" }), // Admin Dave
    });
    assert.equal(resAdmin.status, 400);

    // Target is same current assignee Eve -> 400
    const resSame = await request(`/api/public-support/staff/conversations/${convId}/reassign`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(resSame.status, 400);
  });
});

test("12. B3: SUPPORT returns helper session to waiting queue", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c13";
  const initialConversation = {
    _id: convId,
    publicId: "pub-return-1",
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c01", // Helper Eve
    assignedRole: "SUPPORT_HELPER",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request, convMap }) => {
    const res = await request(`/api/public-support/staff/conversations/${convId}/return-to-queue`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.conversation.status, "WAITING_FOR_SUPPORT");
    assert.equal(res.data.conversation.assignedTo, null);
    assert.equal(res.data.conversation.assignedRole, null);

    const inDb = convMap.get(convId);
    assert.equal(inDb.status, "WAITING_FOR_SUPPORT");
    assert.equal(inDb.assignedTo, null);
    assert.equal(inDb.assignedRole, null);
  });
});

test("13. B3: SUPPORT takeover of ADMIN or peer SUPPORT session is blocked (403)", async () => {
  const adminConvId = "665f1a2b3c4d5e6f7a8b9c14";
  const peerConvId = "665f1a2b3c4d5e6f7a8b9c15";
  const conversations = [
    {
      _id: adminConvId,
      status: "ASSIGNED",
      assignedTo: "665f1a2b3c4d5e6f7a8b9c03", // Admin Dave
      assignedRole: "ADMIN",
    },
    {
      _id: peerConvId,
      status: "ASSIGNED",
      assignedTo: "665f1a2b3c4d5e6f7a8b9c06", // Support Frank
      assignedRole: "SUPPORT",
    },
  ];

  await withTestServer({ conversations }, async ({ request }) => {
    // SUPPORT Carol tries to take over Admin Dave's session -> 403
    const resAdminTakeover = await request(`/api/public-support/staff/conversations/${adminConvId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(resAdminTakeover.status, 403);

    // SUPPORT Carol tries to take over peer Support Frank's session -> 403
    const resPeerTakeover = await request(`/api/public-support/staff/conversations/${peerConvId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(resPeerTakeover.status, 403);
  });
});

test("14. B3: SUPPORT_HELPER calling supervisor endpoints is blocked (403)", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c16";
  const initialConversation = {
    _id: convId,
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c05", // Bob
    assignedRole: "SUPPORT_HELPER",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request }) => {
    const resTakeover = await request(`/api/public-support/staff/conversations/${convId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(resTakeover.status, 403);

    const resReassign = await request(`/api/public-support/staff/conversations/${convId}/reassign`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c05" }),
    });
    assert.equal(resReassign.status, 403);

    const resReturn = await request(`/api/public-support/staff/conversations/${convId}/return-to-queue`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(resReturn.status, 403);
  });
});

test("15. B3: Stale expectedAssignee returns 409 Conflict", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c17";
  const initialConversation = {
    _id: convId,
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c05", // Bob
    assignedRole: "SUPPORT_HELPER",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request }) => {
    // Supervisor Carol expects Eve to own the session, but Bob actually owns it
    const res = await request(`/api/public-support/staff/conversations/${convId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }), // Eve
    });
    assert.equal(res.status, 409);
    assert.equal(res.data.success, false);
  });
});

test("16. B3: ADMIN preserves global supervisor takeover authority", async () => {
  const convId = "665f1a2b3c4d5e6f7a8b9c18";
  const initialConversation = {
    _id: convId,
    status: "ASSIGNED",
    assignedTo: "665f1a2b3c4d5e6f7a8b9c02", // Support Carol
    assignedRole: "SUPPORT",
  };

  await withTestServer({ conversations: [initialConversation] }, async ({ request }) => {
    // Admin Dave takes over Support Carol's session -> allowed
    const res = await request(`/api/public-support/staff/conversations/${convId}/takeover`, {
      method: "POST",
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c03", "ADMIN") },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.conversation.assignedTo, "665f1a2b3c4d5e6f7a8b9c03");
    assert.equal(res.data.conversation.assignedRole, "ADMIN");
  });
});
