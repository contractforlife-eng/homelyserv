// backend/src/routes/supAdminSupervision.test.js
// ============================================================
// Phase A: Sup-Admin (SUPPORT) Safe Sup-Help Supervision Tests
// Covers all 16 security matrix scenarios.
// Uses node:test + mocked Prisma and Mongoose - fast, isolated, no external DB required.
// ============================================================
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import PublicSupportConversation from "../models/PublicSupportConversation.js";
import PublicSupportMessage from "../models/PublicSupportMessage.js";
import supportRouter from "./support.js";
import supHelpRouter from "./supHelp.js";
import chatRouter from "./chat.js";
import complaintsRouter from "./complaints.js";
import publicSupportRouter from "./publicSupport.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_12345";

const createAuthHeader = (userId, role) => {
  const token = jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "1h" });
  return `Bearer ${token}`;
};

const testUsers = {
  "665f1a2b3c4d5e6f7a8b9c01": { _id: "665f1a2b3c4d5e6f7a8b9c01", id: "665f1a2b3c4d5e6f7a8b9c01", fullName: "Helper Eve", email: "helper@test.com", role: "SUPPORT_HELPER", tokenVersion: 0, profileImage: null, createdAt: new Date() },
  "665f1a2b3c4d5e6f7a8b9c02": { _id: "665f1a2b3c4d5e6f7a8b9c02", id: "665f1a2b3c4d5e6f7a8b9c02", fullName: "Support Carol", email: "support@test.com", role: "SUPPORT", tokenVersion: 0, profileImage: null, createdAt: new Date() },
  "665f1a2b3c4d5e6f7a8b9c03": { _id: "665f1a2b3c4d5e6f7a8b9c03", id: "665f1a2b3c4d5e6f7a8b9c03", fullName: "Admin Dave", email: "admin@test.com", role: "ADMIN", tokenVersion: 0, profileImage: null, createdAt: new Date() },
  "665f1a2b3c4d5e6f7a8b9c04": { _id: "665f1a2b3c4d5e6f7a8b9c04", id: "665f1a2b3c4d5e6f7a8b9c04", fullName: "Worker Alice", email: "worker@test.com", role: "WORKER", tokenVersion: 0, profileImage: null, createdAt: new Date() },
  "665f1a2b3c4d5e6f7a8b9c05": { _id: "665f1a2b3c4d5e6f7a8b9c05", id: "665f1a2b3c4d5e6f7a8b9c05", fullName: "Helper Bob", email: "helper2@test.com", role: "SUPPORT_HELPER", tokenVersion: 0, profileImage: null, createdAt: new Date() },
};

const withTestServer = async ({ complaints = [], conversations = [], messages = [] }, run) => {
  const complaintsMap = new Map();
  complaints.forEach((c) => complaintsMap.set(c.id, JSON.parse(JSON.stringify(c))));

  const convMap = new Map();
  conversations.forEach((c) => convMap.set(String(c._id || c.id), { ...c, _id: c._id || c.id }));

  const msgList = [...messages.map((m) => JSON.parse(JSON.stringify(m)))];

  const saved = {
    findById: User.findById,
    uFU: prisma.user.findUnique,
    uFM: prisma.user.findMany,
    cFM: prisma.complaint.findMany,
    cFU: prisma.complaint.findUnique,
    cFF: prisma.complaint.findFirst,
    cU:  prisma.complaint.update,
    cCo: prisma.complaint.count,
    cGr: prisma.complaint.groupBy,
    tC:  prisma.complaintTimeline?.create,
    rC:  prisma.complaintReply?.create,
    nC:  prisma.complaintNote?.create,
    convFind: PublicSupportConversation.find,
    convFindById: PublicSupportConversation.findById,
    convCountDocuments: PublicSupportConversation.countDocuments,
    msgFind: PublicSupportMessage.find,
    msgCreate: PublicSupportMessage.create,
    convOne: Conversation.findOne,
    convF: Conversation.find,
    convC: Conversation.create,
    convUpd: Conversation.updateOne,
    msgOne: Message.findOne,
    msgF: Message.find,
    msgC: Message.create,
    msgCount: Message.countDocuments,
  };

  const internalConvs = new Map();
  const internalMsgs = [];

  Conversation.findOne = (filter = {}) => {
    return {
      sort: () => ({
        lean: async () => {
          if (filter.conversationId) return internalConvs.get(filter.conversationId) || null;
          return null;
        },
      }),
      then: (resolve) => {
        if (filter.conversationId) resolve(internalConvs.get(filter.conversationId) || null);
        else resolve(null);
      }
    };
  };

  Conversation.find = (filter = {}) => ({
    sort: () => ({
      limit: () => ({
        lean: async () => Array.from(internalConvs.values()),
      }),
      lean: async () => Array.from(internalConvs.values()),
    }),
  });

  Conversation.create = async (data) => {
    const item = { ...data, _id: `conv_${Date.now()}` };
    internalConvs.set(data.conversationId, item);
    return item;
  };

  Conversation.updateOne = async (filter, update) => {
    const item = internalConvs.get(filter.conversationId) || { ...filter };
    if (update.$set) Object.assign(item, update.$set);
    internalConvs.set(filter.conversationId, item);
    return { modifiedCount: 1 };
  };

  Message.findOne = (filter = {}) => ({
    sort: () => ({
      lean: async () => null,
      then: (resolve) => resolve(null),
    }),
  });

  Message.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Message.countDocuments = async () => 0;

  User.findById = (id) => ({
    select: async () => {
      const u = testUsers[String(id)];
      return u ? { ...u } : null;
    },
  });

  prisma.user.findUnique = async ({ where }) => {
    const id = where.id || where._id;
    return testUsers[id] ? { ...testUsers[id] } : null;
  };

  prisma.user.findMany = async ({ where }) => {
    const role = where?.role;
    return Object.values(testUsers).filter((u) => !role || u.role === role);
  };

  const decorateComplaint = (c) => {
    if (!c) return null;
    const res = { ...c };
    const helperId = c.assignedSupport || c.assignedSupportId;
    res.assignedSupport = helperId || null;
    res.assignedTo = helperId || null;
    res.User = testUsers[c.userId] || { id: c.userId, fullName: "Test User", email: "user@test.com" };
    res.AssignedSupport = helperId && testUsers[helperId] ? { ...testUsers[helperId] } : null;
    res.Timeline = c.Timeline || [];
    res.Replies = c.Replies || [];
    res.Notes = c.Notes || [];
    return res;
  };

  prisma.complaint.findUnique = async ({ where }) => {
    return decorateComplaint(complaintsMap.get(where.id));
  };

  prisma.complaint.findFirst = async ({ where }) => {
    for (const c of complaintsMap.values()) {
      if (where?.id && c.id !== where.id) continue;
      return decorateComplaint(c);
    }
    return null;
  };

  prisma.complaint.findMany = async () => {
    return Array.from(complaintsMap.values()).map(decorateComplaint);
  };

  prisma.complaint.count = async (args = {}) => {
    let items = Array.from(complaintsMap.values());
    if (args.where) {
      const w = args.where;
      if (w.status) {
        if (typeof w.status === 'string') items = items.filter(c => c.status === w.status);
        else if (w.status.in) items = items.filter(c => w.status.in.includes(c.status));
        else if (w.status.notIn) items = items.filter(c => !w.status.notIn.includes(c.status));
      }
      if (w.assignedSupport === null) {
        items = items.filter(c => !c.assignedSupport && !c.assignedTo);
      }
      if (w.OR) {
        items = items.filter(c => {
          return w.OR.some(cond => {
            if (cond.assignedSupport) return c.assignedSupport === cond.assignedSupport || c.assignedTo === cond.assignedSupport;
            if (cond.assignedTo) return c.assignedTo === cond.assignedTo || c.assignedSupport === cond.assignedTo;
            if (cond.assignedTo === null) return !c.assignedTo && !c.assignedSupport;
            return false;
          });
        });
      }
      if (w.escalatedBy) {
        items = items.filter(c => c.escalatedBy === w.escalatedBy);
      }
    }
    return items.length;
  };

  prisma.complaint.groupBy = async (args = {}) => {
    if (args.by?.includes('assignedSupport')) {
      const counts = {};
      for (const c of complaintsMap.values()) {
        const helperId = c.assignedSupport || c.assignedTo;
        if (!helperId) continue;
        if (args.where?.status?.notIn && args.where.status.notIn.includes(c.status)) continue;
        counts[helperId] = (counts[helperId] || 0) + 1;
      }
      return Object.entries(counts).map(([assignedSupport, count]) => ({
        assignedSupport,
        _count: { id: count }
      }));
    }
    return [];
  };

  prisma.complaint.update = async ({ where, data }) => {
    const existing = complaintsMap.get(where.id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...data };
    complaintsMap.set(where.id, updated);
    return decorateComplaint(updated);
  };

  if (!prisma.complaintTimeline) prisma.complaintTimeline = {};
  prisma.complaintTimeline.create = async ({ data }) => ({ id: "timeline_1", ...data });

  if (!prisma.complaintReply) prisma.complaintReply = {};
  prisma.complaintReply.create = async ({ data }) => ({ id: "reply_1", ...data });

  if (!prisma.complaintNote) prisma.complaintNote = {};
  prisma.complaintNote.create = async ({ data }) => ({ id: "note_1", ...data });

  PublicSupportConversation.find = (filter = {}) => {
    let items = Array.from(convMap.values());
    if (filter.assignedTo?.$in) {
      items = items.filter((item) => filter.assignedTo.$in.includes(String(item.assignedTo)));
    }
    if (filter.status?.$in) {
      items = items.filter((item) => filter.status.$in.includes(item.status));
    }
    if (filter.status?.$ne) {
      items = items.filter((item) => item.status !== filter.status.$ne);
    }
    if (filter.$and) {
      for (const cond of filter.$and) {
        if (cond.status?.$in) {
          items = items.filter((item) => cond.status.$in.includes(item.status));
        }
        if (cond.status?.$ne) {
          items = items.filter((item) => item.status !== cond.status.$ne);
        }
      }
    }
    return {
      select: () => ({
        lean: async () => items.map((c) => ({ ...c })),
      }),
      sort: () => ({
        limit: () => ({
          lean: async () => items.map((c) => ({ ...c })),
        }),
      }),
      lean: async () => items.map((c) => ({ ...c })),
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

  PublicSupportConversation.countDocuments = async () => convMap.size;

  PublicSupportMessage.find = () => ({
    sort: () => ({
      limit: () => ({
        lean: async () => msgList.map((m) => ({ ...m })),
      }),
    }),
  });

  PublicSupportMessage.create = async (doc) => {
    const item = { _id: `msg_${Date.now()}`, ...doc };
    msgList.push(item);
    return item;
  };

  const app = express();
  app.use(express.json());
  app.use("/api", complaintsRouter);
  app.use("/api/support", supportRouter);
  app.use("/api/sup-help", supHelpRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/public-support", publicSupportRouter);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    await run(baseUrl);
  } finally {
    server.close();
    User.findById = saved.findById;
    prisma.user.findUnique = saved.uFU;
    prisma.user.findMany = saved.uFM;
    prisma.complaint.findMany = saved.cFM;
    prisma.complaint.findUnique = saved.cFU;
    prisma.complaint.findFirst = saved.cFF;
    prisma.complaint.update = saved.cU;
    prisma.complaint.count = saved.cCo;
    prisma.complaint.groupBy = saved.cGr;
    prisma.complaintTimeline.create = saved.tC;
    prisma.complaintReply.create = saved.rC;
    prisma.complaintNote.create = saved.nC;
    PublicSupportConversation.find = saved.convFind;
    PublicSupportConversation.findById = saved.convFindById;
    PublicSupportConversation.countDocuments = saved.convCountDocuments;
    PublicSupportMessage.find = saved.msgFind;
    PublicSupportMessage.create = saved.msgCreate;
    Conversation.findOne = saved.convOne;
    Conversation.find = saved.convF;
    Conversation.create = saved.convC;
    Conversation.updateOne = saved.convUpd;
    Message.findOne = saved.msgOne;
    Message.find = saved.msgF;
    Message.create = saved.msgC;
    Message.countDocuments = saved.msgCount;
  }
};

// ============================================================
// TESTS
// ============================================================

test("1. GET /api/support/sup-help-team is accessible by SUPPORT", async () => {
  await withTestServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.totalHelpers, 2);
    assert.equal(Array.isArray(body.helpers), true);
  });
});

test("2. GET /api/support/sup-help-team is BLOCKED for SUPPORT_HELPER, WORKER, and unauthenticated", async () => {
  await withTestServer({}, async (baseUrl) => {
    const res1 = await fetch(`${baseUrl}/api/support/sup-help-team`);
    assert.equal(res1.status, 401);

    const res2 = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c04", "WORKER") },
    });
    assert.equal(res2.status, 403);

    const res3 = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(res3.status, 403);
  });
});

test("3. GET /api/support/sup-help-team returns accurate workload metrics and never leaks passwords", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS" },
    { id: "665f1a2b3c4d5e6f7a8b9c22", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "OPEN" },
    { id: "665f1a2b3c4d5e6f7a8b9c23", assignedSupport: "665f1a2b3c4d5e6f7a8b9c05", status: "WAITING_FOR_USER" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    const body = await res.json();
    assert.equal(body.success, true);
    for (const h of body.helpers) {
      assert.equal(h.password, undefined);
      assert.equal(h.hashedPassword, undefined);
    }
    const eve = body.helpers.find((h) => h.id === "665f1a2b3c4d5e6f7a8b9c01");
    assert.ok(eve);
    assert.equal(eve.role, "SUPPORT_HELPER");
  });
});

test("4. GET /api/support/complaints as SUPPORT allows listing complaints assigned to SUPPORT_HELPER", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaints.length, 1);
    assert.equal(body.complaints[0].id, "665f1a2b3c4d5e6f7a8b9c21");
  });
});

test("5. GET /api/support/complaints/:id as SUPPORT allows viewing a complaint assigned to a SUPPORT_HELPER", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.id, "665f1a2b3c4d5e6f7a8b9c21");
  });
});

test("6. POST /api/support/complaints/:id/reply as SUPPORT is BLOCKED (403) for non-escalated helper complaints", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ message: "Sup admin trying to reply" }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("7. POST /api/support/complaints/:id/notes as SUPPORT is BLOCKED (403) for non-escalated helper complaints", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ note: "Sup admin note" }),
    });
    assert.equal(res.status, 403);
  });
});

test("8. PUT /api/support/complaints/:id/status as SUPPORT is BLOCKED (403) for non-escalated helper complaints", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    assert.equal(res.status, 403);
  });
});

test("9. POST /api/support/complaints/:id/close as SUPPORT is BLOCKED (403) for non-escalated helper complaints", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 403);
  });
});

test("10. POST /api/support/complaints/:id/assign as SUPPORT allows claiming a complaint escalated to SUPPORT", async () => {
  const complaints = [
    {
      id: "665f1a2b3c4d5e6f7a8b9c25",
      userId: "665f1a2b3c4d5e6f7a8b9c04",
      assignedSupport: "665f1a2b3c4d5e6f7a8b9c01",
      status: "ESCALATED",
      subject: "Escalated Issue",
      Timeline: [{ action: "ESCALATED", newValue: "SUPPORT", createdAt: new Date() }],
    },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c25/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.assignedTo, "665f1a2b3c4d5e6f7a8b9c02");
  });
});

test("11. POST /api/support/complaints/:id/assign as SUPPORT is BLOCKED (400) for non-escalated complaint assigned to helper", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", status: "IN_PROGRESS", subject: "Helper Issue" },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });
});

test("12. GET /api/public-support/staff/conversations as SUPPORT includes helper-assigned sessions", async () => {
  const conversations = [
    { _id: "665f1a2b3c4d5e6f7a8b9c10", id: "665f1a2b3c4d5e6f7a8b9c10", publicId: "pub_1", visitorName: "Guest", visitorEmail: "guest@test.com", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", language: "en", lastMessage: "Hello", lastMessageAt: new Date() },
  ];
  await withTestServer({ conversations }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/public-support/staff/conversations`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.conversations.length, 1);
    assert.equal(body.conversations[0].id, "665f1a2b3c4d5e6f7a8b9c10");
    assert.ok(body.conversations[0].assignedHelper);
    assert.equal(body.conversations[0].assignedHelper.fullName, "Helper Eve");
  });
});

test("13. GET /api/public-support/staff/conversations/:id as SUPPORT allows reading messages of helper session", async () => {
  const conversations = [
    { _id: "665f1a2b3c4d5e6f7a8b9c10", id: "665f1a2b3c4d5e6f7a8b9c10", publicId: "pub_1", visitorName: "Guest", visitorEmail: "guest@test.com", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", language: "en", lastMessage: "Hello", lastMessageAt: new Date() },
  ];
  const messages = [
    { _id: "msg_1", conversationId: "665f1a2b3c4d5e6f7a8b9c10", senderType: "VISITOR", body: "Need help", createdAt: new Date() },
    { _id: "msg_2", conversationId: "665f1a2b3c4d5e6f7a8b9c10", senderType: "STAFF", body: "I am here to help", createdAt: new Date() },
  ];
  await withTestServer({ conversations, messages }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/public-support/staff/conversations/665f1a2b3c4d5e6f7a8b9c10`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.messages.length, 2);
  });
});

test("14. POST /api/public-support/staff/conversations/:id/messages as SUPPORT is BLOCKED (403) for helper session", async () => {
  const conversations = [
    { _id: "665f1a2b3c4d5e6f7a8b9c10", id: "665f1a2b3c4d5e6f7a8b9c10", publicId: "pub_1", visitorName: "Guest", visitorEmail: "guest@test.com", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", language: "en", lastMessage: "Hello", lastMessageAt: new Date() },
  ];
  await withTestServer({ conversations }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/public-support/staff/conversations/665f1a2b3c4d5e6f7a8b9c10/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ body: "Sup-Admin intruding message", clientMessageId: "msg_c_1" }),
    });
    assert.equal(res.status, 403);
  });
});

test("15. POST /api/public-support/staff/conversations/:id/close as SUPPORT is BLOCKED (403) for helper session", async () => {
  const conversations = [
    { _id: "665f1a2b3c4d5e6f7a8b9c10", id: "665f1a2b3c4d5e6f7a8b9c10", publicId: "pub_1", visitorName: "Guest", visitorEmail: "guest@test.com", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", language: "en", lastMessage: "Hello", lastMessageAt: new Date() },
  ];
  await withTestServer({ conversations }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/public-support/staff/conversations/665f1a2b3c4d5e6f7a8b9c10/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 403);
  });
});

test("16. POST /api/public-support/staff/conversations/:id/claim as SUPPORT is BLOCKED for helper session", async () => {
  const conversations = [
    { _id: "665f1a2b3c4d5e6f7a8b9c10", id: "665f1a2b3c4d5e6f7a8b9c10", publicId: "pub_1", visitorName: "Guest", visitorEmail: "guest@test.com", status: "ASSIGNED", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", assignedRole: "SUPPORT_HELPER", language: "en", lastMessage: "Hello", lastMessageAt: new Date() },
  ];
  await withTestServer({ conversations }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/public-support/staff/conversations/665f1a2b3c4d5e6f7a8b9c10/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.ok(res.status === 400 || res.status === 409);
  });
});

test("17. Sup-Help Dashboard Open Tickets includes permitted unassigned claimable complaints", async () => {
  const complaints = [
    { id: "comp_unassigned_1", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Unassigned issue", status: "NEW", priority: "High", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/sup-help/dashboard`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.stats.openTickets, 1, "Open tickets must include permitted unassigned claimable complaints");
    assert.equal(body.stats.assignedToMe, 0, "Assigned to me should be 0 before claim");
  });
});

test("18. Sup-Help claim updates both Sup-Help dashboard and Sup-Admin supervision workload", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c11", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Claimable issue", status: "NEW", priority: "High", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // 1. Helper Eve claims the complaint
    const claimRes = await fetch(`${baseUrl}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9c11/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(claimRes.status, 200);

    // 2. Helper Eve checks dashboard stats: openTickets=1, assignedToMe=1
    const dashRes = await fetch(`${baseUrl}/api/sup-help/dashboard`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER") },
    });
    assert.equal(dashRes.status, 200);
    const dashBody = await dashRes.json();
    assert.equal(dashBody.stats.openTickets, 1);
    assert.equal(dashBody.stats.assignedToMe, 1);

    // 3. Sup-Admin checks Sup-Help Team supervision: Eve has activeComplaints=1
    const teamRes = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(teamRes.status, 200);
    const teamBody = await teamRes.json();
    assert.equal(teamBody.success, true);
    const eve = teamBody.helpers.find((h) => h.id === "665f1a2b3c4d5e6f7a8b9c01");
    assert.ok(eve, "Eve should be in the Sup-Help team list");
    assert.equal(eve.activeComplaints, 1, "Eve's active complaints workload must be 1");
  });
});

test("19. POST /api/chat/ensure-conversation between SUPPORT and SUPPORT_HELPER creates canonical staff thread", async () => {
  await withTestServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/chat/ensure-conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({
        user1Id: "665f1a2b3c4d5e6f7a8b9c02",
        user1Name: "Support Carol",
        user1Role: "SUPPORT",
        user2Id: "665f1a2b3c4d5e6f7a8b9c01",
        user2Name: "Helper Eve",
        user2Role: "SUPPORT_HELPER",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.conversationId, "Should return canonical conversationId");
    assert.ok(body.conversationId.startsWith("conv_"), "Conversation ID must start with conv_");

    // Re-ensuring produces the exact same conversationId (no duplicate thread)
    const res2 = await fetch(`${baseUrl}/api/chat/ensure-conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({
        user1Id: "665f1a2b3c4d5e6f7a8b9c02",
        user1Name: "Support Carol",
        user1Role: "SUPPORT",
        user2Id: "665f1a2b3c4d5e6f7a8b9c01",
        user2Name: "Helper Eve",
        user2Role: "SUPPORT_HELPER",
      }),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.conversationId, body.conversationId);
  });
});
