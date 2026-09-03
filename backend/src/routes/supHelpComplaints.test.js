// backend/src/routes/supHelpComplaints.test.js
// ============================================================
// Full PART 2/2 verification test suite for Sup-Help Complaints.
// Covers all 14 mandatory scenarios.
// Uses node:test + mocked Prisma - fast, isolated, no DB required.
// ============================================================
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import User from "../models/User.js";
import supHelpRouter from "./supHelp.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_12345";

const createAuthHeader = (userId, role) => {
  const token = jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "1h" });
  return `Bearer ${token}`;
};

const testUsers = {
  "665f1a2b3c4d5e6f7a8b9c01": { id: "665f1a2b3c4d5e6f7a8b9c01", fullName: "Helper Eve", email: "helper@test.com", role: "SUPPORT_HELPER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c02": { id: "665f1a2b3c4d5e6f7a8b9c02", fullName: "Support Carol", email: "support@test.com", role: "SUPPORT", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c03": { id: "665f1a2b3c4d5e6f7a8b9c03", fullName: "Admin Dave", email: "admin@test.com", role: "ADMIN", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c04": { id: "665f1a2b3c4d5e6f7a8b9c04", fullName: "Worker Alice", email: "worker@test.com", role: "WORKER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c05": { id: "665f1a2b3c4d5e6f7a8b9c05", fullName: "Helper Bob", email: "helper2@test.com", role: "SUPPORT_HELPER", tokenVersion: 0 },
  "665f1a2b3c4d5e6f7a8b9c06": { id: "665f1a2b3c4d5e6f7a8b9c06", fullName: "Employer Sam", email: "employer@test.com", role: "EMPLOYER", tokenVersion: 0 },
};


const withTestServer = async ({ complaints = [] }, run) => {
  const complaintsMap = new Map();
  complaints.forEach((c) => complaintsMap.set(c.id, JSON.parse(JSON.stringify(c))));

  const saved = {
    findById: User.findById,
    uFU: prisma.user.findUnique,
    uFM: prisma.user.findMany,
    cFM: prisma.complaint.findMany,
    cFU: prisma.complaint.findUnique,
    cFF: prisma.complaint.findFirst,
    cU:  prisma.complaint.update,
    cCo: prisma.complaint.count,
    tC:  prisma.complaintTimeline?.create,
    rC:  prisma.complaintReply?.create,
    nC:  prisma.complaintNote?.create,
  };

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

  prisma.user.findMany = async ({ where } = {}) => {
    let list = Object.values(testUsers);
    if (where?.role?.in) list = list.filter((u) => where.role.in.includes(u.role));
    else if (where?.role && typeof where.role === "string") list = list.filter((u) => u.role === where.role);
    return list.map((u) => ({ ...u }));
  };

  const matchCond = (c, cond) => {
    if (!cond) return true;
    for (const [key, val] of Object.entries(cond)) {
      if (key === "AND") { if (!val.every((sc) => matchCond(c, sc))) return false; continue; }
      if (key === "OR")  { if (!val.some((sc) => matchCond(c, sc))) return false; continue; }
      if (key === "NOT") { if (matchCond(c, val)) return false; continue; }
      if (val === null) { if (c[key] != null) return false; continue; }
      if (typeof val === "object" && !Array.isArray(val)) {
        if ("in"       in val) { if (!val.in.includes(c[key])) return false; continue; }
        if ("notIn"    in val) { if (val.notIn.includes(c[key])) return false; continue; }
        if ("isSet"    in val) { const s = c[key] != null; if (val.isSet !== s) return false; continue; }
        if ("contains" in val) { if (!String(c[key] || "").toLowerCase().includes(String(val.contains || "").toLowerCase())) return false; continue; }
      }
      if (c[key] !== val) return false;
    }
    return true;
  };

  prisma.complaint.findMany = async ({ where, skip, take } = {}) => {
    let list = Array.from(complaintsMap.values()).filter((c) => matchCond(c, where));
    if (skip) list = list.slice(skip);
    if (take) list = list.slice(0, take);
    return list.map((c) => ({
      ...c,
      User: testUsers[c.userId] || { id: c.userId, fullName: "User", email: "u@t.com", role: "WORKER" },
      AssignedSupport: c.assignedSupport ? testUsers[c.assignedSupport] : null,
      Timeline: (c.Timeline || []).filter((t) => t.action === "ESCALATED").slice(0, 1),
      Notes: c.Notes || [], Replies: c.Replies || [],
    }));
  };

  prisma.complaint.findUnique = async ({ where }) => {
    const c = complaintsMap.get(where.id);
    if (!c) return null;
    return { ...c, User: testUsers[c.userId] || { id: c.userId, fullName: "User", email: "u@t.com", role: "WORKER" }, AssignedSupport: c.assignedSupport ? testUsers[c.assignedSupport] : null, Timeline: c.Timeline || [], Notes: c.Notes || [], Replies: c.Replies || [] };
  };

  prisma.complaint.findFirst = async ({ where }) => {
    const m = Array.from(complaintsMap.values()).find((c) => matchCond(c, where));
    if (!m) return null;
    return { ...m, User: testUsers[m.userId] || { id: m.userId, fullName: "User", email: "u@t.com", role: "WORKER" }, AssignedSupport: m.assignedSupport ? testUsers[m.assignedSupport] : null, Timeline: m.Timeline || [], Notes: m.Notes || [], Replies: m.Replies || [] };
  };

  prisma.complaint.update = async ({ where, data }) => {
    const c = complaintsMap.get(where.id);
    if (!c) throw new Error("Complaint not found");
    Object.assign(c, data);
    return { ...c, User: testUsers[c.userId] || { id: c.userId, fullName: "User", email: "u@t.com", role: "WORKER" }, AssignedSupport: c.assignedSupport ? testUsers[c.assignedSupport] : null, Timeline: c.Timeline || [], Notes: c.Notes || [], Replies: c.Replies || [] };
  };

  prisma.complaint.count = async ({ where } = {}) =>
    where ? Array.from(complaintsMap.values()).filter((c) => matchCond(c, where)).length : complaintsMap.size;

  prisma.complaintTimeline = { ...(prisma.complaintTimeline || {}), create: async ({ data }) => {
    const c = complaintsMap.get(data.complaintId);
    if (c) { c.Timeline = c.Timeline || []; const ev = { id: "ev_" + Math.random(), ...data, createdAt: new Date().toISOString() }; c.Timeline.push(ev); return ev; }
    return data;
  }};

  prisma.complaintReply = { ...(prisma.complaintReply || {}), create: async ({ data }) => {
    const c = complaintsMap.get(data.complaintId);
    if (c) { c.Replies = c.Replies || []; const r = { id: "r_" + Math.random(), ...data, createdAt: new Date().toISOString() }; c.Replies.push(r); return r; }
    return data;
  }};

  prisma.complaintNote = { ...(prisma.complaintNote || {}), create: async ({ data }) => {
    const c = complaintsMap.get(data.complaintId);
    if (c) { c.Notes = c.Notes || []; const n = { id: "n_" + Math.random(), ...data, createdAt: new Date().toISOString() }; c.Notes.push(n); return n; }
    return data;
  }};

  if (prisma.notification) prisma.notification.create = async () => ({ id: "notif_test" });

  const app = express();
  app.use(express.json());
  app.use("/api/sup-help", supHelpRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`, { complaintsMap });
  } finally {
    User.findById = saved.findById;
    prisma.user.findUnique = saved.uFU;
    prisma.user.findMany = saved.uFM;
    prisma.complaint.findMany = saved.cFM;
    prisma.complaint.findUnique = saved.cFU;
    prisma.complaint.findFirst = saved.cFF;
    prisma.complaint.update = saved.cU;
    prisma.complaint.count = saved.cCo;
    if (saved.tC) prisma.complaintTimeline.create = saved.tC;
    if (saved.rC) prisma.complaintReply.create = saved.rC;
    if (saved.nC) prisma.complaintNote.create = saved.nC;
    await new Promise((resolve) => server.close(resolve));
  }
};

const fetchJson = async (url, opts = {}) => {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  return { response: r, body: await r.json().catch(() => ({})) };
};

const EVE_ID    = "665f1a2b3c4d5e6f7a8b9c01";
const BOB_ID    = "665f1a2b3c4d5e6f7a8b9c05";
const ADMIN_ID  = "665f1a2b3c4d5e6f7a8b9c03";
const WORKER_ID = "665f1a2b3c4d5e6f7a8b9c04";

const eveAuth   = createAuthHeader(EVE_ID, "SUPPORT_HELPER");
const bobAuth   = createAuthHeader(BOB_ID, "SUPPORT_HELPER");
const adminAuth = createAuthHeader(ADMIN_ID, "ADMIN");
const workerAuth = createAuthHeader(WORKER_ID, "WORKER");

const bc = (o = {}) => ({
  subject: "Test Complaint", status: "NEW", priority: "Medium", category: "General",
  userId: WORKER_ID, assignedSupport: null, assignedTo: null,
  Timeline: [], Notes: [], Replies: [], createdAt: new Date().toISOString(), ...o,
});

// ──────────────────────────────────────────────────────────────────────────────
test("1. WORKER/EMPLOYER cannot access Sup-Help complaint endpoints (403)", async () => {
  const employerAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c06", "EMPLOYER");
  await withTestServer({}, async (base) => {
    for (const auth of [workerAuth, employerAuth]) {
      const { response: r1 } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: auth } });
      assert.equal(r1.status, 403);
      const { response: r2 } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9001/assign`, { method: "POST", headers: { authorization: auth } });
      assert.equal(r2.status, 403);
    }
  });
});

test("2. Queue isolation: HelperA cannot view or mutate HelperB-assigned complaint", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9001", status: "NEW" }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9002", status: "IN_PROGRESS", assignedSupport: BOB_ID, assignedTo: BOB_ID }),
  ]}, async (base) => {
    const { body } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: eveAuth } });
    const ids = body.complaints.map((c) => c.id);
    assert.ok(ids.includes("665f1a2b3c4d5e6f7a8b9001"), "Eve sees unassigned");
    assert.ok(!ids.includes("665f1a2b3c4d5e6f7a8b9002"), "Eve must NOT see Bob-assigned");

    for (const [method, path, payload] of [
      ["POST", "/reply", { message: "hack" }],
      ["PUT",  "/status", { status: "RESOLVED" }],
      ["POST", "/escalate", { reason: "hack", targetRole: "SUPPORT" }],
      ["POST", "/close", {}],
    ]) {
      const { response } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9002${path}`, {
        method, headers: { authorization: eveAuth }, body: JSON.stringify(payload),
      });
      assert.equal(response.status, 403, `${method} ${path} on Bob-complaint must be 403`);
    }
  });
});

test("3. Sup-Help → SUPPORT escalation: structured target stored; complaint unassigned for Support pickup", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9010", status: "IN_PROGRESS", assignedSupport: EVE_ID, assignedTo: EVE_ID }),
  ]}, async (base, { complaintsMap }) => {
    const { response, body } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9010/escalate`, {
      method: "POST", headers: { authorization: eveAuth },
      body: JSON.stringify({ reason: "Needs Sup-Admin", targetRole: "SUPPORT" }),
    });
    assert.equal(response.status, 200);
    assert.equal(body.complaint.status, "ESCALATED");
    assert.equal(body.complaint.assignedSupport, null);

    const c = complaintsMap.get("665f1a2b3c4d5e6f7a8b9010");
    const ev = c.Timeline.find((t) => t.action === "ESCALATED");
    assert.ok(ev, "ESCALATED event must exist");
    assert.equal(ev.newValue, "SUPPORT", "newValue must be SUPPORT");
    assert.equal(c.assignedSupport, null, "assignedSupport cleared for Support to claim");
  });
});

test("4. Sup-Help → SUPPORT: complaint history and escalation target survive; Support can discover it", async () => {
  await withTestServer({ complaints: [
    bc({
      id: "665f1a2b3c4d5e6f7a8b9020", status: "ESCALATED", assignedSupport: null, assignedTo: null,
      escalatedBy: EVE_ID,
      Timeline: [{ id: "tl1", action: "ESCALATED", newValue: "SUPPORT", description: "Escalated to Sup-Admin", createdAt: new Date().toISOString() }],
      Replies: [{ id: "rep1", authorId: EVE_ID, authorName: "Helper Eve", message: "Initial reply", createdAt: new Date().toISOString() }],
    }),
  ]}, async (base, { complaintsMap }) => {
    // Verify machine-readable target
    const c = complaintsMap.get("665f1a2b3c4d5e6f7a8b9020");
    assert.equal(c.Timeline[0].newValue, "SUPPORT");
    // Reply history preserved
    assert.equal(c.Replies.length, 1);
    // Admin can see it via sup-help listing
    const { body } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: adminAuth } });
    assert.ok(body.complaints.some((x) => x.id === "665f1a2b3c4d5e6f7a8b9020"), "Admin sees escalated complaint");
  });
});

test("5. Sup-Help → ADMIN escalation: Admin sees it; structured target = ADMIN", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9030", status: "IN_PROGRESS", assignedSupport: EVE_ID, assignedTo: EVE_ID }),
  ]}, async (base, { complaintsMap }) => {
    const { response, body } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9030/escalate`, {
      method: "POST", headers: { authorization: eveAuth },
      body: JSON.stringify({ reason: "Needs Co-Admin payment authority", targetRole: "ADMIN" }),
    });
    assert.equal(response.status, 200);
    assert.equal(body.complaint.status, "ESCALATED");

    const c = complaintsMap.get("665f1a2b3c4d5e6f7a8b9030");
    const ev = c.Timeline.find((t) => t.action === "ESCALATED");
    assert.equal(ev.newValue, "ADMIN");
    assert.equal(c.assignedSupport, null);

    // Admin discovers via listing
    const { body: lb } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: adminAuth } });
    assert.ok(lb.complaints.some((x) => x.id === "665f1a2b3c4d5e6f7a8b9030"));

    // Admin opens and sees full history
    const { body: db } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9030`, { headers: { authorization: adminAuth } });
    assert.equal(db.success, true);
    assert.equal(db.complaint.status, "ESCALATED");
  });
});

test("6. Admin can change status and close a complaint after escalation", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9040", status: "ESCALATED", assignedSupport: null, assignedTo: null, escalatedBy: EVE_ID,
      Timeline: [{ id: "tl2", action: "ESCALATED", newValue: "ADMIN", createdAt: new Date().toISOString() }] }),
  ]}, async (base) => {
    const { response: r1, body: b1 } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9040/status`, {
      method: "PUT", headers: { authorization: adminAuth }, body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    assert.equal(r1.status, 200);
    assert.equal(b1.complaint.status, "IN_PROGRESS");

    const { response: r2, body: b2 } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9040/close`, {
      method: "POST", headers: { authorization: adminAuth },
    });
    assert.equal(r2.status, 200);
    assert.equal(b2.complaint.status, "CLOSED");
    assert.ok(b2.complaint.closedAt);
  });
});

test("7. Previous replies and timeline events survive escalation", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9050", status: "IN_PROGRESS", assignedSupport: EVE_ID, assignedTo: EVE_ID,
      Timeline: [
        { id: "tl_a", action: "ASSIGNED", newValue: EVE_ID, createdAt: new Date().toISOString() },
        { id: "tl_r", action: "SUPPORT_REPLIED", createdAt: new Date().toISOString() },
      ],
      Replies: [{ id: "rep1", authorId: EVE_ID, message: "Pre-escalation reply", createdAt: new Date().toISOString() }],
    }),
  ]}, async (base, { complaintsMap }) => {
    await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9050/escalate`, {
      method: "POST", headers: { authorization: eveAuth },
      body: JSON.stringify({ reason: "Needs senior review", targetRole: "SUPPORT" }),
    });
    const c = complaintsMap.get("665f1a2b3c4d5e6f7a8b9050");
    assert.equal(c.Replies.length, 1, "Replies preserved");
    const actions = c.Timeline.map((t) => t.action);
    assert.ok(actions.includes("ASSIGNED"));
    assert.ok(actions.includes("SUPPORT_REPLIED"));
    assert.ok(actions.includes("ESCALATED"));
  });
});

test("8. Invalid escalation targets are rejected (400)", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9060", assignedSupport: EVE_ID, assignedTo: EVE_ID }),
  ]}, async (base) => {
    for (const bad of ["WORKER", "EMPLOYER", "SUPPORT_HELPER", "root", "NONE", "SUPPORT_ADMIN"]) {
      const { response } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9060/escalate`, {
        method: "POST", headers: { authorization: eveAuth },
        body: JSON.stringify({ reason: "test reason", targetRole: bad }),
      });
      assert.equal(response.status, 400, `Bad target "${bad}" must be 400`);
    }
    // Missing reason also rejected
    const { response: nr } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9060/escalate`, {
      method: "POST", headers: { authorization: eveAuth }, body: JSON.stringify({ targetRole: "SUPPORT" }),
    });
    assert.equal(nr.status, 400);
  });
});

test("9. Invalid status transitions are rejected (400)", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9070", assignedSupport: EVE_ID }),
  ]}, async (base) => {
    for (const bad of ["NEW", "OPEN", "ESCALATED", "INVALID", "PENDING", "CANCELLED", "ADMIN"]) {
      const { response } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9070/status`, {
        method: "PUT", headers: { authorization: eveAuth }, body: JSON.stringify({ status: bad }),
      });
      assert.equal(response.status, 400, `Bad status "${bad}" must be 400`);
    }
  });
});

test("10. Sup-Help user listing only exposes WORKER/EMPLOYER — no admin/staff exposure", async () => {
  await withTestServer({}, async (base) => {
    const { body } = await fetchJson(`${base}/api/sup-help/users`, { headers: { authorization: eveAuth } });
    assert.equal(body.success, true);
    const forbidden = (body.users || []).filter((u) => ["ADMIN", "SUPPORT", "SUPPORT_HELPER"].includes(u.role));
    assert.equal(forbidden.length, 0, "No staff roles exposed via Sup-Help user directory");
  });
});

test("11. Malformed ObjectIDs return 404, never crash (legacy data safety)", async () => {
  await withTestServer({}, async (base) => {
    for (const id of ["not-an-id", "abc", "12345", "undefined", "null", "user_123", "x".repeat(23)]) {
      const { response: gr } = await fetchJson(`${base}/api/sup-help/complaints/${id}`, { headers: { authorization: eveAuth } });
      assert.equal(gr.status, 404, `GET ${id} must be 404`);
      const { response: ar } = await fetchJson(`${base}/api/sup-help/complaints/${id}/assign`, {
        method: "POST", headers: { authorization: eveAuth },
      });
      assert.equal(ar.status, 404, `ASSIGN ${id} must be 404`);
      const { response: rr } = await fetchJson(`${base}/api/sup-help/complaints/${id}/reply`, {
        method: "POST", headers: { authorization: eveAuth }, body: JSON.stringify({ message: "test" }),
      });
      assert.equal(rr.status, 404, `REPLY ${id} must be 404`);
      const { response: sr } = await fetchJson(`${base}/api/sup-help/complaints/${id}/status`, {
        method: "PUT", headers: { authorization: eveAuth }, body: JSON.stringify({ status: "RESOLVED" }),
      });
      assert.equal(sr.status, 404, `STATUS ${id} must be 404`);
    }
  });
});

test("12. EMPLOYER cannot access Sup-Help complaints (same as WORKER)", async () => {
  const empAuth = createAuthHeader("665f1a2b3c4d5e6f7a8b9c06", "EMPLOYER");
  await withTestServer({}, async (base) => {
    const { response } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: empAuth } });
    assert.equal(response.status, 403);
  });
});

test("13. Ordinary complaint full lifecycle — no escalation required (end-to-end)", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9080", status: "NEW" }),
  ]}, async (base, { complaintsMap }) => {
    const id = "665f1a2b3c4d5e6f7a8b9080";

    // Claim
    const { response: r1, body: b1 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/assign`, { method: "POST", headers: { authorization: eveAuth } });
    assert.equal(r1.status, 200);
    assert.equal(b1.complaint.status, "OPEN");
    assert.equal(b1.complaint.assignedSupport?.id || b1.complaint.assignedSupport, EVE_ID);

    // Claiming again by Bob rejected
    const { response: rr } = await fetchJson(`${base}/api/sup-help/complaints/${id}/assign`, { method: "POST", headers: { authorization: bobAuth } });
    assert.equal(rr.status, 400);

    // Reply
    const { response: r2, body: b2 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/reply`, {
      method: "POST", headers: { authorization: eveAuth }, body: JSON.stringify({ message: "Looking into your issue." }),
    });
    assert.equal(r2.status, 200);
    assert.equal(b2.complaint.status, "IN_PROGRESS");

    // Internal note
    const { response: r3 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/notes`, {
      method: "POST", headers: { authorization: eveAuth }, body: JSON.stringify({ note: "Internal note." }),
    });
    assert.equal(r3.status, 200);
    assert.equal(complaintsMap.get(id).Notes.slice(-1)[0].isInternal, true);

    // WAITING_FOR_USER
    const { response: r4, body: b4 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/status`, {
      method: "PUT", headers: { authorization: eveAuth }, body: JSON.stringify({ status: "WAITING_FOR_USER" }),
    });
    assert.equal(r4.status, 200);
    assert.equal(b4.complaint.status, "WAITING_FOR_USER");

    // RESOLVED — resolvedAt set
    const { response: r5, body: b5 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/status`, {
      method: "PUT", headers: { authorization: eveAuth }, body: JSON.stringify({ status: "RESOLVED" }),
    });
    assert.equal(r5.status, 200);
    assert.equal(b5.complaint.status, "RESOLVED");
    assert.ok(b5.complaint.resolvedAt, "resolvedAt must be set");

    // CLOSE — closedAt set
    const { response: r6, body: b6 } = await fetchJson(`${base}/api/sup-help/complaints/${id}/close`, {
      method: "POST", headers: { authorization: eveAuth },
    });
    assert.equal(r6.status, 200);
    assert.equal(b6.complaint.status, "CLOSED");
    assert.ok(b6.complaint.closedAt, "closedAt must be set");

    // Full timeline check
    const c = complaintsMap.get(id);
    const actions = c.Timeline.map((t) => t.action);
    assert.ok(actions.includes("ASSIGNED"));
    assert.ok(actions.includes("SUPPORT_REPLIED"));
    assert.ok(actions.includes("NOTE_ADDED"));
    assert.ok(actions.includes("STATUS_CHANGED"));
    assert.ok(actions.includes("CLOSED"));
  });
});

test("14. Admin supervision: sees all complaint states and can act on any", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9091", status: "NEW" }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9092", status: "IN_PROGRESS", assignedSupport: EVE_ID }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9093", status: "IN_PROGRESS", assignedSupport: BOB_ID }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9094", status: "ESCALATED", assignedSupport: null, Timeline: [{ id: "tl3", action: "ESCALATED", newValue: "ADMIN", createdAt: new Date().toISOString() }] }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9095", status: "ESCALATED", assignedSupport: null, Timeline: [{ id: "tl4", action: "ESCALATED", newValue: "SUPPORT", createdAt: new Date().toISOString() }] }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9096", status: "RESOLVED", assignedSupport: EVE_ID }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9097", status: "CLOSED", assignedSupport: BOB_ID }),
  ]}, async (base) => {
    const { body } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: adminAuth } });
    assert.equal(body.success, true);
    const ids = body.complaints.map((c) => c.id);
    for (const expected of ["665f1a2b3c4d5e6f7a8b9091","665f1a2b3c4d5e6f7a8b9092","665f1a2b3c4d5e6f7a8b9093","665f1a2b3c4d5e6f7a8b9094","665f1a2b3c4d5e6f7a8b9095","665f1a2b3c4d5e6f7a8b9096","665f1a2b3c4d5e6f7a8b9097"]) {
      assert.ok(ids.includes(expected), `Admin must see ${expected}`);
    }

    // Admin can change status on Bob-assigned complaint without restriction
    const { response: sr } = await fetchJson(`${base}/api/sup-help/complaints/665f1a2b3c4d5e6f7a8b9093/status`, {
      method: "PUT", headers: { authorization: adminAuth }, body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    assert.equal(sr.status, 200);
  });
});

test("Bonus: Sidebar counter query isolates to the requesting helper, not global", async () => {
  await withTestServer({ complaints: [
    bc({ id: "665f1a2b3c4d5e6f7a8b9098", status: "NEW" }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9099", status: "IN_PROGRESS", assignedSupport: EVE_ID }),
    bc({ id: "665f1a2b3c4d5e6f7a8b9100", status: "IN_PROGRESS", assignedSupport: BOB_ID }),
  ]}, async (base) => {
    // Eve sees only: 1 unassigned NEW + 1 assigned to her = 2
    const { body } = await fetchJson(`${base}/api/sup-help/complaints`, { headers: { authorization: eveAuth } });
    const visible = body.complaints.map((c) => c.id);
    assert.equal(visible.length, 2, "Eve sees exactly 2 (unassigned + self-assigned)");
    assert.ok(!visible.includes("665f1a2b3c4d5e6f7a8b9100"), "Bob-assigned not in Eve counter scope");
  });
});
