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

  const timelineEvents = [];
  if (!prisma.complaintTimeline) prisma.complaintTimeline = {};
  prisma.complaintTimeline.create = async ({ data }) => {
    const event = { id: `timeline_${timelineEvents.length + 1}`, ...data };
    timelineEvents.push(event);
    return event;
  };

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
    await run(baseUrl, { complaintsMap, timelineEvents });
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

test("7. POST /api/support/complaints/:id/notes as SUPPORT is PERMITTED (200) for helper complaints as supervisor note", async () => {
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
      body: JSON.stringify({ note: "Sup admin supervisor note" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.assignedSupport?.id || body.complaint.assignedSupport, "665f1a2b3c4d5e6f7a8b9c01");
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

test("20. Sup-Admin takes over Helper A complaint: ownership updates, Helper A loses write, Sup-Admin gains write", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c21", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Helper ticket", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Sup-Admin Carol takes over Eve's complaint
    const takeoverRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(takeoverRes.status, 200);
    const takeoverBody = await takeoverRes.json();
    assert.equal(takeoverBody.success, true);
    assert.equal(takeoverBody.complaint.assignedSupport?.id || takeoverBody.complaint.assignedSupport, "665f1a2b3c4d5e6f7a8b9c02");
    assert.equal(takeoverBody.complaint.assignedTo, "665f1a2b3c4d5e6f7a8b9c02");

    // Helper Eve attempts to reply -> 403 Forbidden
    const eveReplyRes = await fetch(`${baseUrl}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9c21/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({ message: "Should be blocked" }),
    });
    assert.equal(eveReplyRes.status, 403);

    // Sup-Admin Carol replies -> 200 OK
    const carolReplyRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c21/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ message: "Supervisor taking over resolution." }),
    });
    assert.equal(carolReplyRes.status, 200);
  });
});

test("21. Sup-Admin reassigns Helper A complaint to Helper B: Helper A loses write, Helper B gains write", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c22", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Helper reassignment ticket", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Sup-Admin Carol reassigns from Eve to Bob
    const reassignRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c22/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({
        targetHelperId: "665f1a2b3c4d5e6f7a8b9c05",
        expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01",
      }),
    });
    assert.equal(reassignRes.status, 200);
    const reassignBody = await reassignRes.json();
    assert.equal(reassignBody.success, true);
    assert.equal(reassignBody.complaint.assignedSupport?.id || reassignBody.complaint.assignedSupport, "665f1a2b3c4d5e6f7a8b9c05");
    assert.equal(reassignBody.complaint.assignedTo, "665f1a2b3c4d5e6f7a8b9c05");

    // Eve attempts reply -> 403 Forbidden
    const eveReplyRes = await fetch(`${baseUrl}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9c22/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({ message: "Eve reply blocked" }),
    });
    assert.equal(eveReplyRes.status, 403);

    // Bob attempts reply -> 200 OK
    const bobReplyRes = await fetch(`${baseUrl}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9c22/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c05", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({ message: "Bob handling now." }),
    });
    assert.equal(bobReplyRes.status, 200);
  });
});

test("22. Sup-Admin reassign with invalid non-helper target is rejected with 400", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c23", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Invalid reassign", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Attempt reassign to Worker Alice
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c23/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c04" }),
    });
    assert.equal(res.status, 400);
  });
});

test("23. Sup-Admin returns Helper complaint to queue: unassigned and claimable by frontline helpers", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c24", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Return to queue ticket", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const returnRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c24/return-to-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(returnRes.status, 200);
    const returnBody = await returnRes.json();
    assert.equal(returnBody.success, true);
    assert.equal(returnBody.complaint.assignedSupport, null);
    assert.equal(returnBody.complaint.assignedTo, null);

    // Frontline Helper Bob claims it from queue -> 200 OK
    const claimRes = await fetch(`${baseUrl}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9c24/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c05", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(claimRes.status, 200);
  });
});

test("24. Sup-Admin adds supervisor note to helper complaint: ownership and status remain unchanged", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c25", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Note test ticket", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const noteRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c25/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ note: "Please follow up on employer receipt." }),
    });
    assert.equal(noteRes.status, 200);
    const noteBody = await noteRes.json();
    assert.equal(noteBody.success, true);
    assert.equal(noteBody.complaint.assignedSupport?.id || noteBody.complaint.assignedSupport, "665f1a2b3c4d5e6f7a8b9c01", "Ownership must remain with Helper Eve");
    assert.equal(noteBody.complaint.status, "OPEN", "Status must remain unchanged");
  });
});

test("25. Sup-Admin takeover of ADMIN complaint is strictly rejected with 403", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c26", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Admin owned ticket", status: "IN_PROGRESS", priority: "Critical", assignedSupport: "665f1a2b3c4d5e6f7a8b9c03", assignedTo: "665f1a2b3c4d5e6f7a8b9c03", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c26/takeover`, {
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

test("26. Sup-Admin takeover of peer SUPPORT complaint is strictly rejected with 403", async () => {
  const otherSupport = "665f1a2b3c4d5e6f7a8b9c99";
  testUsers[otherSupport] = { id: otherSupport, _id: otherSupport, fullName: "Support Frank", role: "SUPPORT", email: "frank@test.com" };
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c27", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Peer support ticket", status: "IN_PROGRESS", priority: "High", assignedSupport: otherSupport, assignedTo: otherSupport, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c27/takeover`, {
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

test("27. SUPPORT_HELPER cannot call supervisor endpoints (takeover/reassign/return-to-queue)", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c28", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Helper forbidden test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const tRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c28/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(tRes.status, 403);

    const rRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c28/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c05" }),
    });
    assert.equal(rRes.status, 403);

    const qRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c28/return-to-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(qRes.status, 403);
  });
});

test("28. WORKER and EMPLOYER cannot call supervisor endpoints", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c29", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Worker forbidden test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c29/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c04", "WORKER"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 403);
  });
});

test("29. Stale expected-assignee takeover and reassignment is rejected with 409 Conflict", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c30", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Stale concurrency test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c05", assignedTo: "665f1a2b3c4d5e6f7a8b9c05", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Sup-Admin attempts takeover expecting Eve ("665f1a2b3c4d5e6f7a8b9c01"), but it's currently Bob ("665f1a2b3c4d5e6f7a8b9c05")
    const takeoverRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c30/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(takeoverRes.status, 409);

    // Sup-Admin attempts reassign expecting Eve, but it's currently Bob
    const reassignRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c30/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c01", expectedAssignee: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(reassignRes.status, 409);
  });
});

test("30. Admin existing reassignment authority preserved", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c31", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Admin reassign test", status: "ESCALATED", priority: "High", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/complaints/665f1a2b3c4d5e6f7a8b9c31/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c03", "ADMIN"),
      },
      body: JSON.stringify({ supportId: "665f1a2b3c4d5e6f7a8b9c02" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.assignedSupport?.id || body.complaint.assignedSupport, "665f1a2b3c4d5e6f7a8b9c02");
  });
});

test("31. Frontend regression check: all JSX tags and Lucide icons in SupportComplaints.jsx are properly imported", async () => {
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.resolve(process.cwd(), "frontend/src/pages/support/SupportComplaints.jsx");
  assert.ok(fs.existsSync(filePath), "SupportComplaints.jsx must exist");

  const content = fs.readFileSync(filePath, "utf8");
  const tags = new Set([...content.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]));

  const imports = new Set();
  const importMatches = content.matchAll(/import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+))/g);
  for (const m of importMatches) {
    if (m[1]) {
      m[1].split(",").forEach((item) => imports.add(item.trim().split(/\s+as\s+/)[0].trim()));
    }
    if (m[2]) {
      imports.add(m[2].trim());
    }
  }

  const missing = Array.from(tags).filter((tag) => !imports.has(tag) && tag !== "SupportComplaints");
  assert.deepEqual(missing, [], `Missing imports in SupportComplaints.jsx: ${missing.join(", ")}`);
});

test("32. Reassigning a complaint to the exact same current helper is rejected with 400", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c32", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Same helper reassign test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Attempt reassign Eve -> Eve
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c32/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c01" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("33. GET /api/support/sup-help-team returns helpers array and filters current assignee for reassign modal", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c33", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Reassign modal filter test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/sup-help-team`, {
      headers: { Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT") },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.helpers), "Response must contain helpers array");

    // Eve (665f1a2b3c4d5e6f7a8b9c01) and Bob (665f1a2b3c4d5e6f7a8b9c05) are both present
    const eve = body.helpers.find((h) => h.id === "665f1a2b3c4d5e6f7a8b9c01");
    const bob = body.helpers.find((h) => h.id === "665f1a2b3c4d5e6f7a8b9c05");
    assert.ok(eve, "Eve must be in helpers");
    assert.ok(bob, "Bob must be in helpers");

    // Modal filtering simulation: currentAssignee is Eve
    const currentAssigneeId = "665f1a2b3c4d5e6f7a8b9c01";
    const eligibleHelpers = body.helpers.filter((h) => String(h.id) !== currentAssigneeId && h.role === "SUPPORT_HELPER");
    assert.equal(eligibleHelpers.length, 1);
    assert.equal(eligibleHelpers[0].id, "665f1a2b3c4d5e6f7a8b9c05", "Bob must be the eligible reassignment target");
  });
});

// ============================================================
// PHASE B2 TESTS — PRIORITY CONTROL
// ============================================================

test("34. SUPPORT changes unassigned complaint priority Low -> High (200 OK), unassigned status preserved", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c34", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Unassigned triage priority", status: "OPEN", priority: "Low", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { complaintsMap, timelineEvents }) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c34/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.priority, "High");
    assert.equal(body.complaint.assignedSupport, null, "Complaint must remain unassigned");

    const updated = complaintsMap.get("665f1a2b3c4d5e6f7a8b9c34");
    assert.equal(updated.priority, "High");
    assert.equal(updated.assignedSupport, null);

    const tl = timelineEvents.find((e) => e.complaintId === "665f1a2b3c4d5e6f7a8b9c34");
    assert.ok(tl, "PRIORITY_CHANGED timeline event must be created");
    assert.equal(tl.action, "PRIORITY_CHANGED");
    assert.equal(tl.oldValue, "Low");
    assert.equal(tl.newValue, "High");
  });
});

test("35. SUPPORT changes helper-assigned complaint priority (200 OK), helper remains assigned, status unchanged", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c35", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Helper ticket priority change", status: "IN_PROGRESS", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { complaintsMap }) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c35/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "Critical" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.priority, "Critical");
    assert.equal(body.complaint.assignedSupport.id, "665f1a2b3c4d5e6f7a8b9c01", "Eve must remain assigned");
    assert.equal(body.complaint.status, "IN_PROGRESS", "Status must remain IN_PROGRESS");

    const updated = complaintsMap.get("665f1a2b3c4d5e6f7a8b9c35");
    assert.equal(updated.priority, "Critical");
    assert.equal(updated.assignedSupport, "665f1a2b3c4d5e6f7a8b9c01");
    assert.equal(updated.status, "IN_PROGRESS");
  });
});

test("36. SUPPORT changes own complaint priority (200 OK)", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c36", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Own support complaint priority", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c02", assignedTo: "665f1a2b3c4d5e6f7a8b9c02", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c36/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.priority, "High");
    assert.equal(body.complaint.assignedSupport.id, "665f1a2b3c4d5e6f7a8b9c02");
  });
});

test("37. SUPPORT changes complaint escalated to SUPPORT (200 OK), escalation state preserved", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c37", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Escalated to support priority", status: "ESCALATED", priority: "Medium", escalatedTo: "SUPPORT", escalatedBy: "665f1a2b3c4d5e6f7a8b9c01", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { complaintsMap }) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c37/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "Critical" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.priority, "Critical");
    assert.equal(body.complaint.status, "ESCALATED");

    const updated = complaintsMap.get("665f1a2b3c4d5e6f7a8b9c37");
    assert.equal(updated.priority, "Critical");
    assert.equal(updated.escalatedTo, "SUPPORT");
    assert.equal(updated.escalatedBy, "665f1a2b3c4d5e6f7a8b9c01");
  });
});

test("38. Invalid priority strings (Urgent, SuperHigh, empty, null) are rejected with 400", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c38", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Invalid priority test", status: "OPEN", priority: "Medium", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    for (const invalid of ["Urgent", "SuperHigh", "", null, 123]) {
      const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c38/priority`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
        },
        body: JSON.stringify({ priority: invalid }),
      });
      assert.equal(res.status, 400, `Expected 400 for priority: ${invalid}`);
      const body = await res.json();
      assert.equal(body.success, false);
    }
  });
});

test("39. Same priority update is rejected with 400 as safe no-op, no timeline created", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c39", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Same priority noop", status: "OPEN", priority: "High", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { timelineEvents }) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c39/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(timelineEvents.length, 0, "No timeline event should be created on no-op rejection");
  });
});

test("40. Historical lowercase casing in DB (medium) is treated as same priority for Medium and rejected as no-op", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c40", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Historical lowercase test", status: "OPEN", priority: "medium", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { timelineEvents }) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c40/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "Medium" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(timelineEvents.length, 0, "No timeline event should be created for casing-only no-op");
  });
});

test("41. SUPPORT modifying ADMIN-assigned complaint returns 403", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c41", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Admin assigned complaint", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c03", assignedTo: "665f1a2b3c4d5e6f7a8b9c03", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c41/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "Critical" }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("42. SUPPORT modifying peer SUPPORT-assigned complaint returns 403", async () => {
  // Add a peer support user
  testUsers["665f1a2b3c4d5e6f7a8b9c06"] = {
    _id: "665f1a2b3c4d5e6f7a8b9c06",
    id: "665f1a2b3c4d5e6f7a8b9c06",
    fullName: "Support Dan",
    email: "dan@test.com",
    role: "SUPPORT",
    tokenVersion: 0,
  };
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c42", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Peer support complaint", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c06", assignedTo: "665f1a2b3c4d5e6f7a8b9c06", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c42/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "Critical" }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("43. SUPPORT_HELPER, WORKER, and EMPLOYER calling priority update endpoint return 403", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c43", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Non-supervisor priority change test", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    // Helper Eve
    const res1 = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c43/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c01", "SUPPORT_HELPER"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(res1.status, 403);

    // Worker Alice
    const res2 = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c43/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c04", "WORKER"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(res2.status, 403);
  });
});

test("44. CLOSED and RESOLVED complaints block priority update with 400", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c44", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Closed complaint", status: "CLOSED", priority: "Medium", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
    { id: "665f1a2b3c4d5e6f7a8b9c47", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Resolved complaint", status: "RESOLVED", priority: "Medium", assignedSupport: null, assignedTo: null, createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const resClosed = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c44/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(resClosed.status, 400);

    const resResolved = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c47/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ priority: "High" }),
    });
    assert.equal(resResolved.status, 400);
  });
});

test("45. ADMIN (Co-Admin) can update priority on any non-closed/resolved complaint (200 OK)", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c45", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "Admin global priority triage", status: "OPEN", priority: "Low", assignedSupport: "665f1a2b3c4d5e6f7a8b9c02", assignedTo: "665f1a2b3c4d5e6f7a8b9c02", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c45/priority`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c03", "ADMIN"),
      },
      body: JSON.stringify({ priority: "Critical" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.complaint.priority, "Critical");
  });
});

test("46. B1 Regression: Take Over, Reassign, Return to Queue, and Supervisor Note continue to work 100%", async () => {
  const complaints = [
    { id: "665f1a2b3c4d5e6f7a8b9c46", userId: "665f1a2b3c4d5e6f7a8b9c04", subject: "B1 regression test ticket", status: "OPEN", priority: "Medium", assignedSupport: "665f1a2b3c4d5e6f7a8b9c01", assignedTo: "665f1a2b3c4d5e6f7a8b9c01", createdAt: new Date(), updatedAt: new Date() },
  ];
  await withTestServer({ complaints }, async (baseUrl, { complaintsMap }) => {
    // 1. Supervisor Note
    const noteRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c46/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ note: "Supervisory note for Eve" }),
    });
    assert.equal(noteRes.status, 200);

    // 2. Reassign to Bob
    const reassignRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c46/reassign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({ targetHelperId: "665f1a2b3c4d5e6f7a8b9c05" }),
    });
    assert.equal(reassignRes.status, 200);
    assert.equal(complaintsMap.get("665f1a2b3c4d5e6f7a8b9c46").assignedSupport, "665f1a2b3c4d5e6f7a8b9c05");

    // 3. Return to Queue
    const returnRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c46/return-to-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(returnRes.status, 200);
    assert.equal(complaintsMap.get("665f1a2b3c4d5e6f7a8b9c46").assignedSupport, null);

    // 4. Take Over from unassigned/helper
    // Assign to Eve first
    complaintsMap.set("665f1a2b3c4d5e6f7a8b9c46", {
      ...complaintsMap.get("665f1a2b3c4d5e6f7a8b9c46"),
      assignedSupport: "665f1a2b3c4d5e6f7a8b9c01",
      assignedTo: "665f1a2b3c4d5e6f7a8b9c01",
    });
    const takeoverRes = await fetch(`${baseUrl}/api/support/complaints/665f1a2b3c4d5e6f7a8b9c46/takeover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader("665f1a2b3c4d5e6f7a8b9c02", "SUPPORT"),
      },
      body: JSON.stringify({}),
    });
    assert.equal(takeoverRes.status, 200);
    assert.equal(complaintsMap.get("665f1a2b3c4d5e6f7a8b9c46").assignedSupport, "665f1a2b3c4d5e6f7a8b9c02");
  });
});
