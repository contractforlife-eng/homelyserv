// backend/src/routes/adminManualPremium.test.js
// Admin Manual Premium Grant: role eligibility is enforced by the backend,
// which is the source of truth. Staff/internal roles stay ineligible, and the
// resulting Premium state comes from the real ManualPremiumGrant mechanics.
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import prisma from '../lib/prisma.js';
import adminRouter from './admin.js';
import {
  getActivePremiumUserIds,
  getManualPremiumState,
  getSubscriptionSummaries,
} from '../services/premiumService.js';
import { attachDoctorCards } from '../services/doctorSearchService.js';

const secret = 'admin-manual-premium-test-secret-2026';
process.env.JWT_SECRET = secret;

const ADMIN_ID = '507f1f77bcf86cd799439001';
const WORKER_ACTOR_ID = '507f1f77bcf86cd799439002';
const TARGET_ID = '507f1f77bcf86cd799439010';

const token = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({ authorization: `Bearer ${token(payload)}`, 'content-type': 'application/json' });

const doc = (data) => ({ ...data, toObject: () => ({ ...data, id: String(data._id) }) });
const wrapQuery = (found) => ({
  select: () => Promise.resolve(found),
  then: (resolve, reject) => Promise.resolve(found).then(resolve, reject),
});

// A small in-memory stand-in for prisma.manualPremiumGrant that honours the
// `where` shapes premiumService actually sends, so real expiry/reactivation
// behaviour is exercised rather than stubbed away.
const makeGrantStore = () => {
  const grants = new Map();
  // Prisma operators (`{ in }`, `{ not }`, `{ lt }`, `{ gt }`) arrive as objects.
  // A scalar equality check must therefore only run on scalar filters, otherwise
  // `String({ in: [...] })` is "[object Object]" and every batched lookup would
  // silently match nothing.
  const isOperatorObject = (value) => value !== null && typeof value === 'object';
  const matches = (grant, where = {}) => {
    if (where.userId && !isOperatorObject(where.userId) && String(grant.userId) !== String(where.userId)) return false;
    if (where.userId?.in && !where.userId.in.map(String).includes(String(grant.userId))) return false;
    if (where.status && !isOperatorObject(where.status) && grant.status !== where.status) return false;
    if (where.status?.not && grant.status === where.status.not) return false;
    if (where.endDate?.lt && !(grant.endDate < where.endDate.lt)) return false;
    if (where.endDate?.gt && !(grant.endDate > where.endDate.gt)) return false;
    return true;
  };
  return {
    grants,
    findUnique: async ({ where }) => {
      const grant = grants.get(String(where.userId));
      return grant ? { ...grant } : null;
    },
    findMany: async ({ where }) => [...grants.values()].filter((g) => matches(g, where)).map((g) => ({ ...g })),
    upsert: async ({ where, create, update }) => {
      const id = String(where.userId);
      const existing = grants.get(id);
      if (existing) {
        Object.assign(existing, update || {});
        existing.updatedAt = new Date();
        return { ...existing };
      }
      const now = new Date();
      const created = { id, ...create, createdAt: now, updatedAt: now };
      grants.set(id, created);
      return { ...created };
    },
    updateMany: async ({ where, data }) => {
      const affected = [...grants.values()].filter((g) => matches(g, where));
      for (const grant of affected) Object.assign(grant, data, { updatedAt: new Date() });
      return { count: affected.length };
    },
  };
};

// Minimal mongoose-style chainable stub so the REAL doctorSearchService card
// builder can run without a database.
const chainTo = (result) => {
  const chain = {};
  chain.select = () => chain;
  chain.sort = () => chain;
  chain.lean = () => Promise.resolve(result);
  return chain;
};

const withServer = async (store, run, { doctorProfiles = [], doctorClinics = [] } = {}) => {
  const original = {
    findById: User.findById,
    grant: prisma.manualPremiumGrant,
    subscription: prisma.subscription,
    subscriptionGrant: prisma.subscriptionGrant,
    notification: prisma.notification,
    doctorProfileFind: DoctorProfile.find,
    doctorClinicFind: DoctorClinic.find,
  };
  const targetRoles = new Map();

  User.findById = (id) => {
    const idStr = String(id);
    if (idStr === ADMIN_ID) return wrapQuery(doc({ _id: ADMIN_ID, fullName: 'Root Admin', email: 'admin@homelyserv.com', role: 'ADMIN', tokenVersion: 0, isSuspended: false }));
    if (idStr === WORKER_ACTOR_ID) return wrapQuery(doc({ _id: WORKER_ACTOR_ID, fullName: 'A Worker', email: 'worker@homelyserv.com', role: 'WORKER', tokenVersion: 0, isSuspended: false }));
    if (targetRoles.has(idStr)) {
      // email is intentionally empty: manual activation skips the transaction
      // email branch so the suite never touches a real mail transport.
      return wrapQuery(doc({ _id: idStr, fullName: 'Target User', email: '', role: targetRoles.get(idStr), tokenVersion: 0, isSuspended: false }));
    }
    return wrapQuery(null);
  };

  prisma.manualPremiumGrant = store;
  prisma.subscription = { findMany: async () => [] };
  prisma.subscriptionGrant = { findMany: async () => [] };
  prisma.notification = { create: async ({ data }) => ({ id: 'notif-1', ...data }) };
  DoctorProfile.find = () => chainTo(doctorProfiles);
  DoctorClinic.find = () => chainTo(doctorClinics);

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    return await run(`http://127.0.0.1:${server.address().port}`, targetRoles);
  } finally {
    User.findById = original.findById;
    prisma.manualPremiumGrant = original.grant;
    prisma.subscription = original.subscription;
    prisma.subscriptionGrant = original.subscriptionGrant;
    prisma.notification = original.notification;
    DoctorProfile.find = original.doctorProfileFind;
    DoctorClinic.find = original.doctorClinicFind;
    await new Promise((resolve) => server.close(resolve));
  }
};

const patchPremium = async (base, userId, body, headers) => {
  const res = await fetch(`${base}/api/admin/users/${userId}/premium`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const asAdmin = (payload = { userId: ADMIN_ID, role: 'ADMIN' }) => authHeader(payload);

// The exact payload the Admin UI sends (UserProfileView.handleActivatePremium).
const ACTIVATE = { action: 'activate' };

// ============================================================
// 1-5. Every consumer account type can receive Manual Premium
// ============================================================
for (const role of ['WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT']) {
  test(`Admin can grant Manual Premium to a ${role} account`, async () => {
    const store = makeGrantStore();
    await withServer(store, async (base, targets) => {
      targets.set(TARGET_ID, role);
      const { status, body } = await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
      assert.equal(status, 200, `expected 200 for ${role}, got ${status}: ${JSON.stringify(body)}`);
      assert.equal(body.success, true);
      // The grant really exists and drives Premium status through the normal
      // entitlement path (no role-specific Premium flag anywhere).
      assert.equal(body.subscription.isPremium, true, `${role} must be Premium after grant`);
      assert.equal(body.subscription.hasActiveManualPremium, true);
      assert.equal(body.subscription.latestPlan, 'manual');
      const grant = store.grants.get(TARGET_ID);
      assert.equal(grant.status, 'active');
      assert.ok(grant.endDate > new Date(), 'grant must expire in the future');
      assert.equal(grant.adminId, ADMIN_ID);
    });
  });
}

// ============================================================
// 6-8. Staff/internal accounts are never Premium subscribers
// ============================================================
for (const role of ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
  test(`Manual Premium cannot be granted to a ${role} account`, async () => {
    const store = makeGrantStore();
    await withServer(store, async (base, targets) => {
      targets.set(TARGET_ID, role);
      const { status, body } = await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
      assert.equal(status, 403, `${role} must stay ineligible`);
      assert.equal(body.success, false);
      assert.match(body.message, /Manual Premium is not available/);
      assert.equal(store.grants.size, 0, 'ineligible role must not create a grant');
    });
  });
}

test('the outdated Employer/Worker-only wording is gone', async () => {
  const store = makeGrantStore();
  await withServer(store, async (base, targets) => {
    targets.set(TARGET_ID, 'ADMIN');
    const { body } = await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
    assert.doesNotMatch(body.message, /only for Employer and Worker/i);
    // The rejection message now lists the roles the backend truly supports.
    for (const role of ['WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT']) {
      assert.ok(body.message.includes(role), `message should list ${role}`);
    }
  });
});

// ============================================================
// 9 + guards. Authorization is unchanged: ADMIN actors only
// ============================================================
test('an unauthenticated caller cannot grant Manual Premium', async () => {
  await withServer(makeGrantStore(), async (base, targets) => {
    targets.set(TARGET_ID, 'DOCTOR');
    const res = await fetch(`${base}/api/admin/users/${TARGET_ID}/premium`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ACTIVATE),
    });
    assert.equal(res.status, 401);
  });
});

test('a non-Admin actor (Worker) cannot grant Manual Premium', async () => {
  const store = makeGrantStore();
  await withServer(store, async (base, targets) => {
    targets.set(TARGET_ID, 'DOCTOR');
    const { status } = await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin({ userId: WORKER_ACTOR_ID, role: 'WORKER' }));
    assert.equal(status, 403);
    assert.equal(store.grants.size, 0);
  });
});

test('an Admin cannot grant Manual Premium to their own account', async () => {
  const { status, body } = await withServer(makeGrantStore(), async (base) => {
    const result = await patchPremium(base, ADMIN_ID, ACTIVATE, asAdmin());
    return result;
  });
  assert.equal(status, 403);
  assert.equal(body.message, 'Cannot modify your own premium status');
});

test('a nonexistent user is rejected with 404', async () => {
  await withServer(makeGrantStore(), async (base) => {
    const { status } = await patchPremium(base, '507f1f77bcf86cd799439099', ACTIVATE, asAdmin());
    assert.equal(status, 404);
  });
});

test('an invalid userId is rejected with 400', async () => {
  await withServer(makeGrantStore(), async (base) => {
    const { status } = await patchPremium(base, 'not-an-object-id', ACTIVATE, asAdmin());
    assert.equal(status, 400);
  });
});

// ============================================================
// 12, 15, 16. Premium state is driven by real grant mechanics,
// including expiry. No Doctor/Teacher/Student-specific flag exists.
// ============================================================
test('an active Manual Premium produces active Premium state', async () => {
  const store = makeGrantStore();
  await withServer(store, async (base, targets) => {
    targets.set(TARGET_ID, 'WORKER');
    await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());

    const premiumIds = await getActivePremiumUserIds([TARGET_ID]);
    assert.equal(premiumIds.has(TARGET_ID), true, 'unexpired grant must be an active entitlement');

    const state = await getManualPremiumState(TARGET_ID);
    assert.equal(state.hasActiveManualPremium, true);
    assert.ok(state.manualPremiumEndDate instanceof Date);

    const summaries = await getSubscriptionSummaries([TARGET_ID]);
    assert.equal(summaries.get(TARGET_ID).isPremium, true);
  });
});

test('an expired Manual Premium is no longer recognized as active', async () => {
  const store = makeGrantStore();
  await withServer(store, async (base, targets) => {
    targets.set(TARGET_ID, 'WORKER');
    await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());

    // Force the grant into the past exactly as the clock would.
    store.grants.get(TARGET_ID).endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const premiumIds = await getActivePremiumUserIds([TARGET_ID]);
    assert.equal(premiumIds.has(TARGET_ID), false, 'expired grant must not be an entitlement');

    const state = await getManualPremiumState(TARGET_ID);
    assert.equal(state.hasActiveManualPremium, false);
    assert.equal(state.manualPremiumEndDate, null);

    const summaries = await getSubscriptionSummaries([TARGET_ID]);
    assert.equal(summaries.get(TARGET_ID).isPremium, false);
  });
});

test('deactivating a Manual Premium removes active Premium state', async () => {
  const store = makeGrantStore();
  await withServer(store, async (base, targets) => {
    targets.set(TARGET_ID, 'TEACHER');
    await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
    assert.equal((await getManualPremiumState(TARGET_ID)).hasActiveManualPremium, true);

    const { status } = await patchPremium(base, TARGET_ID, { action: 'deactivate' }, asAdmin());
    assert.equal(status, 200);
    assert.equal((await getManualPremiumState(TARGET_ID)).hasActiveManualPremium, false);
    assert.equal((await getActivePremiumUserIds([TARGET_ID])).has(TARGET_ID), false);
  });
});

// ============================================================
// 13-14. Doctor Search: isPremium comes from the SAME entitlement
// engine. The admin route only writes a ManualPremiumGrant.
// ============================================================
const publishedDoctorProfile = {
  userId: TARGET_ID,
  professionalTitle: 'Consultant',
  specialty: 'Cardiology',
  additionalSpecialties: [],
  subspecialty: '',
  isPublished: true,
  searchVisibility: true,
};

const doctorSearchRow = () => [{ _id: TARGET_ID, role: 'DOCTOR', fullName: 'Dr. Manual Premium' }];

test('a Doctor granted Manual Premium is isPremium: true in Doctor Search', async () => {
  const store = makeGrantStore();
  await withServer(
    store,
    async (base, targets) => {
      targets.set(TARGET_ID, 'DOCTOR');
      const { status, body } = await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
      assert.equal(status, 200);
      assert.equal(body.subscription.isPremium, true);

      // Exactly what routes/doctorSearch.js does: batch entitlement, then build cards.
      const premiumIds = await getActivePremiumUserIds([TARGET_ID]);
      const rows = doctorSearchRow();
      await attachDoctorCards(rows, { premiumIds });

      assert.ok(rows[0].doctor, 'a published doctor must produce a card');
      assert.equal(rows[0].doctor.isPremium, true, 'Manual Premium must surface in Doctor Search');
    },
    { doctorProfiles: [publishedDoctorProfile] },
  );
});

test('a Doctor without any Premium remains isPremium: false in Doctor Search', async () => {
  await withServer(
    makeGrantStore(),
    async (base, targets) => {
      targets.set(TARGET_ID, 'DOCTOR');
      // No grant is ever created for this doctor.
      const premiumIds = await getActivePremiumUserIds([TARGET_ID]);
      const rows = doctorSearchRow();
      await attachDoctorCards(rows, { premiumIds });

      assert.ok(rows[0].doctor);
      assert.equal(rows[0].doctor.isPremium, false);
    },
    { doctorProfiles: [publishedDoctorProfile] },
  );
});

test('an expired Premium removes the Doctor from Doctor Search Premium', async () => {
  const store = makeGrantStore();
  await withServer(
    store,
    async (base, targets) => {
      targets.set(TARGET_ID, 'DOCTOR');
      await patchPremium(base, TARGET_ID, ACTIVATE, asAdmin());
      store.grants.get(TARGET_ID).endDate = new Date(Date.now() - 60 * 1000);

      const premiumIds = await getActivePremiumUserIds([TARGET_ID]);
      const rows = doctorSearchRow();
      await attachDoctorCards(rows, { premiumIds });

      assert.equal(rows[0].doctor.isPremium, false, 'expired entitlement must not show Premium');
    },
    { doctorProfiles: [publishedDoctorProfile] },
  );
});

test('toIdentityObject reflects isPremium for subscriber roles and excludes staff', async () => {
  const { toIdentityObject } = await import('../utils/staffIdentity.js');
  for (const role of ['WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT']) {
    const active = toIdentityObject({ id: TARGET_ID, role, fullName: `Test ${role}` }, true);
    assert.equal(active.isPremium, true, `${role} with entitlement must be isPremium: true`);

    const inactive = toIdentityObject({ id: TARGET_ID, role, fullName: `Test ${role}` }, false);
    assert.equal(inactive.isPremium, false, `${role} without entitlement must be isPremium: false`);
  }

  for (const role of ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
    const staff = toIdentityObject({ id: ADMIN_ID, role, fullName: `Staff ${role}` }, true);
    assert.equal(staff.isPremium, false, `Staff role ${role} must never be isPremium`);
  }
});

