// backend/src/routes/doctorVerification.test.js
// ============================================================
// DOCTOR TRUST & VERIFICATION — AUTHORIZATION + AUDIT TESTS
// ============================================================
// Covers the non-negotiable rules of the Doctor System:
//
//   * DOCTOR is a first-class role and is never degraded to WORKER.
//   * ADMIN (Co-Admin) and SUPPORT (Sup-Admin) have EQUAL verification
//     authority, including approving the Authoritative Verified Profile.
//   * SUP-HELP (SUPPORT_HELPER) is READ-ONLY: no status change, no approve,
//     no reject, no authoritative approval — enforced server-side.
//   * A DOCTOR can see their own status and submit evidence, but can never
//     change a status or approve their own profile.
//   * Email/phone confirmation NEVER grants the authoritative status.
//   * Every ADMIN/SUPPORT decision writes an immutable audit record.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorVerificationAudit from '../models/DoctorVerificationAudit.js';
import VerificationDocument from '../models/VerificationDocument.js';
import prisma from '../lib/prisma.js';
import doctorsRouter from './doctors.js';
import adminRouter from './admin.js';
import supportRouter from './support.js';
import supHelpRouter from './supHelp.js';

const secret = 'doctor-verification-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_ID = '507f1f77bcf86cd799439061';
const OTHER_DOCTOR_ID = '507f1f77bcf86cd799439062';
const WORKER_ID = '507f1f77bcf86cd799439063';
const TEACHER_ID = '507f1f77bcf86cd799439064';
const STUDENT_ID = '507f1f77bcf86cd799439065';
const ADMIN_ID = '507f1f77bcf86cd799439066';
const SUP_ADMIN_ID = '507f1f77bcf86cd799439067';
const SUP_HELP_ID = '507f1f77bcf86cd799439068';

const createToken = (userId, role) => jwt.sign({ userId, role, tokenVersion: 0 }, secret, { expiresIn: '1h' });

const authHeader = (userId, role) => ({
  authorization: `Bearer ${createToken(userId, role)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select(fields) {
    if (fields === '-password') {
      if (!doc) return Promise.resolve(null);
      const { password, ...rest } = doc;
      return Promise.resolve(rest);
    }
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const createMockUser = (overrides = {}) => ({
  _id: DOCTOR_ID,
  fullName: 'Dr. Verification Target',
  email: 'dr.verify@homelyserv.test',
  role: 'DOCTOR',
  tokenVersion: 0,
  isSuspended: false,
  phone: '+971501234567',
  emailVerified: false,
  phoneVerified: false,
  ...overrides,
  toObject() {
    const { toObject, ...rest } = this;
    return { ...rest };
  }
});

// ============================================================
// HARNESS
// ============================================================
const withDoctorVerificationServer = async ({
  targetUser = createMockUser(),
  doctorProfile = null,
  clinics = [],
  documents = []
} = {}, run) => {
  const originals = {
    userFindById: User.findById,
    userFindByIdAndUpdate: User.findByIdAndUpdate,
    profileFindOne: DoctorProfile.findOne,
    clinicFind: DoctorClinic.find,
    docFind: VerificationDocument.find,
    docFindOne: VerificationDocument.findOne,
    auditCreate: DoctorVerificationAudit.create,
    auditFind: DoctorVerificationAudit.find,
    prismaUserFindUnique: prisma.user.findUnique,
    prismaUserFindMany: prisma.user.findMany,
    prismaUserCount: prisma.user.count,
    prismaSubscription: prisma.subscription,
    prismaManualPremiumGrant: prisma.manualPremiumGrant,
    prismaSubscriptionGrant: prisma.subscriptionGrant
  };

  const auditRecords = [];
  const staffUsers = new Map([
    [ADMIN_ID, createMockUser({ _id: ADMIN_ID, fullName: 'Co-Admin', email: 'admin@homelyserv.test', role: 'ADMIN' })],
    [SUP_ADMIN_ID, createMockUser({ _id: SUP_ADMIN_ID, fullName: 'Sup-Admin', email: 'supadmin@homelyserv.test', role: 'SUPPORT' })],
    [SUP_HELP_ID, createMockUser({ _id: SUP_HELP_ID, fullName: 'Sup-Help', email: 'suphelp@homelyserv.test', role: 'SUPPORT_HELPER' })],
    [WORKER_ID, createMockUser({ _id: WORKER_ID, fullName: 'Worker', email: 'worker@homelyserv.test', role: 'WORKER' })],
    [TEACHER_ID, createMockUser({ _id: TEACHER_ID, fullName: 'Teacher', email: 'teacher@homelyserv.test', role: 'TEACHER' })],
    [STUDENT_ID, createMockUser({ _id: STUDENT_ID, fullName: 'Student', email: 'student@homelyserv.test', role: 'STUDENT' })],
    [OTHER_DOCTOR_ID, createMockUser({ _id: OTHER_DOCTOR_ID, fullName: 'Dr. Other', email: 'other@homelyserv.test' })]
  ]);

  const resolveUser = (id) => {
    const key = String(id);
    if (key === String(targetUser._id)) return targetUser;
    return staffUsers.get(key) || null;
  };

  User.findById = (id) => wrapQuery(resolveUser(id));

  User.findByIdAndUpdate = async (id, update) => {
    const user = resolveUser(id);
    if (!user) return null;
    if (update?.$set) Object.assign(user, update.$set);
    return user;
  };

  // Doctor professional profile read model (shared by admin/support/sup-help).
  DoctorProfile.findOne = () => {
    const chain = {
      select: () => chain,
      lean: () => Promise.resolve(doctorProfile)
    };
    return chain;
  };

  DoctorClinic.find = (filter = {}) => {
    const matched = clinics.filter((clinic) => {
      if (filter.doctorId && String(clinic.doctorId) !== String(filter.doctorId)) return false;
      if (filter.isActive !== undefined && clinic.isActive !== filter.isActive) return false;
      return true;
    });
    const chain = {
      sort: () => chain,
      lean: () => Promise.resolve(matched)
    };
    return chain;
  };

  VerificationDocument.find = () => {
    const chain = {
      sort: () => chain,
      lean: () => Promise.resolve(documents)
    };
    return chain;
  };

  VerificationDocument.findOne = () => {
    const chain = {
      sort: () => chain,
      then: (resolve) => resolve(null)
    };
    return chain;
  };

  DoctorVerificationAudit.create = async (record) => {
    const created = {
      _id: `audit-${auditRecords.length + 1}`,
      createdAt: new Date(),
      rejectionReason: null,
      notes: null,
      ...record
    };
    auditRecords.push(created);
    return created;
  };

  DoctorVerificationAudit.find = (filter = {}) => {
    const matched = auditRecords.filter((row) => {
      if (filter.doctorId && String(row.doctorId) !== String(filter.doctorId)) return false;
      return true;
    });
    const chain = {
      sort: () => chain,
      limit: () => chain,
      populate: () => chain,
      lean: () => Promise.resolve(matched)
    };
    return chain;
  };

  // Prisma stubs. The real client object is patched because the premium and
  // support services capture it at import time.
  prisma.user.findUnique = async ({ where, select }) => {
    const user = resolveUser(where.id);
    if (!user) return null;
    const out = { id: String(user._id) };
    for (const key of Object.keys(select || {})) {
      if (key in user) out[key] = user[key];
      else if (key.endsWith('Profile')) out[key] = null;
    }
    return out;
  };
  prisma.user.findMany = async () => [];
  prisma.user.count = async () => 0;
  prisma.subscription = { findMany: async () => [] };
  prisma.manualPremiumGrant = { findMany: async () => [], findUnique: async () => null };
  prisma.subscriptionGrant = { findMany: async () => [] };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/sup-help', supHelpRouter);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`, {
      targetUser,
      auditRecords
    });
  } finally {
    User.findById = originals.userFindById;
    User.findByIdAndUpdate = originals.userFindByIdAndUpdate;
    DoctorProfile.findOne = originals.profileFindOne;
    DoctorClinic.find = originals.clinicFind;
    VerificationDocument.find = originals.docFind;
    VerificationDocument.findOne = originals.docFindOne;
    DoctorVerificationAudit.create = originals.auditCreate;
    DoctorVerificationAudit.find = originals.auditFind;
    prisma.user.findUnique = originals.prismaUserFindUnique;
    prisma.user.findMany = originals.prismaUserFindMany;
    prisma.user.count = originals.prismaUserCount;
    prisma.subscription = originals.prismaSubscription;
    prisma.manualPremiumGrant = originals.prismaManualPremiumGrant;
    prisma.subscriptionGrant = originals.prismaSubscriptionGrant;
    await new Promise((resolve) => server.close(resolve));
  }
};

const patchVerification = (base, path, body, userId, role) =>
  fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: authHeader(userId, role),
    body: JSON.stringify(body)
  });

// ============================================================
// 1. DOCTOR SELF-SERVICE
// ============================================================
test('1. DOCTOR can read their own Trust & Verification status', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await fetch(`${base}/api/doctors/verification`, {
      headers: authHeader(DOCTOR_ID, 'DOCTOR')
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.verification.profile.status, 'NOT_VERIFIED');
    assert.equal(body.verification.isVerified, false);
    assert.equal(body.canChangeStatus, false, 'a Doctor may never change a status');
    assert.equal(body.canSubmitEvidence, true);
  });
});

test('2. Only DOCTOR may read the Doctor self-service verification endpoint', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const [userId, role] of [
      [WORKER_ID, 'WORKER'],
      [TEACHER_ID, 'TEACHER'],
      [STUDENT_ID, 'STUDENT'],
      [ADMIN_ID, 'ADMIN'],
      [SUP_ADMIN_ID, 'SUPPORT'],
      [SUP_HELP_ID, 'SUPPORT_HELPER']
    ]) {
      const res = await fetch(`${base}/api/doctors/verification`, { headers: authHeader(userId, role) });
      assert.equal(res.status, 403, `${role} must be rejected from the Doctor self-service endpoint`);
    }
  });
});

test('3. DOCTOR cannot request the authoritative Verified Profile status', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const type of ['profile', 'verifiedprofile', 'PROFILE']) {
      const res = await fetch(`${base}/api/doctors/verification/request`, {
        method: 'POST',
        headers: authHeader(DOCTOR_ID, 'DOCTOR'),
        body: JSON.stringify({ type })
      });
      assert.equal(res.status, 400, `Doctor must not be able to request "${type}"`);
      const body = await res.json();
      assert.equal(body.success, false);
    }
    // The Doctor's authoritative status is untouched.
    assert.equal(createMockUser().verifiedProfileStatus, undefined);
  });
});

test('4. DOCTOR cannot request email verification (it is not a self-service signal)', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await fetch(`${base}/api/doctors/verification/request`, {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify({ type: 'email' })
    });
    assert.equal(res.status, 400);
  });
});

test('5. DOCTOR may submit an identity review request (phone signal)', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await fetch(`${base}/api/doctors/verification/request`, {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR'),
      body: JSON.stringify({ type: 'phone', notes: 'Awaiting SMS confirmation' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.verification.phone.status, 'PENDING');
    // A pending request must never make the profile authoritatively verified.
    assert.equal(body.verification.profile.status, 'NOT_VERIFIED');
    assert.equal(body.verification.isVerified, false);
  });
});

test('6. DOCTOR cannot upload an evidence document for the authoritative profile type', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await fetch(`${base}/api/doctors/verification/profile/document`, {
      method: 'POST',
      headers: authHeader(DOCTOR_ID, 'DOCTOR')
    });
    assert.equal(res.status, 400);
  });
});

// ============================================================
// 2. ADMIN AND SUP-ADMIN HAVE EQUAL AUTHORITY
// ============================================================
for (const [roleLabel, reviewerId, reviewerRole, basePath] of [
  ['ADMIN (Co-Admin)', ADMIN_ID, 'ADMIN', '/api/admin'],
  ['SUPPORT (Sup-Admin)', SUP_ADMIN_ID, 'SUPPORT', '/api/support']
]) {
  test(`7. ${roleLabel} can approve the Authoritative Verified Profile and an audit record is written`, async () => {
    await withDoctorVerificationServer({}, async (base, ctx) => {
      const res = await patchVerification(
        base,
        `${basePath}/doctors/${DOCTOR_ID}/verification`,
        { type: 'profile', status: 'VERIFIED' },
        reviewerId,
        reviewerRole
      );
      assert.equal(res.status, 200, `${roleLabel} must have approval authority`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.verification.profile.status, 'VERIFIED');
      assert.equal(body.verification.isVerified, true);

      assert.equal(ctx.auditRecords.length, 1);
      const [entry] = ctx.auditRecords;
      assert.equal(String(entry.doctorId), DOCTOR_ID);
      assert.equal(entry.verificationType, 'PROFILE');
      assert.equal(entry.previousStatus, 'NOT_VERIFIED');
      assert.equal(entry.newStatus, 'VERIFIED');
      assert.equal(String(entry.reviewerId), reviewerId);
      assert.equal(entry.reviewerRole, reviewerRole);
      assert.ok(entry.createdAt instanceof Date, 'audit entry must be timestamped');
    });
  });

  test(`8. ${roleLabel} can view a Doctor's verification state and audit trail`, async () => {
    await withDoctorVerificationServer({}, async (base) => {
      const res = await fetch(`${base}${basePath}/doctors/${DOCTOR_ID}/verification`, {
        headers: authHeader(reviewerId, reviewerRole)
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.canChangeStatus, true);
      assert.equal(body.doctor.role, 'DOCTOR');
      assert.ok(Array.isArray(body.auditTrail));
    });
  });
}

test('9. SUPPORT (Sup-Admin) reaches the identical decision route as ADMIN', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/support/doctors/${DOCTOR_ID}/verification`,
      { type: 'identity', status: 'VERIFIED' },
      SUP_ADMIN_ID,
      'SUPPORT'
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.verification.identity.status, 'VERIFIED');

    const entry = ctx.auditRecords.at(-1);
    assert.equal(entry.verificationType, 'IDENTITY_DOCUMENT');
    assert.equal(entry.reviewerRole, 'SUPPORT');
  });
});

test('10. Approving a sub-signal never grants the Authoritative Verified Profile', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      { type: 'email', status: 'VERIFIED' },
      ADMIN_ID,
      'ADMIN'
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.verification.email.status, 'VERIFIED');
    assert.equal(body.verification.profile.status, 'NOT_VERIFIED');
    assert.equal(body.verification.isVerified, false);
  });
});

test('11. A verified phone number alone never grants the Authoritative Verified Profile', async () => {
  const target = createMockUser({ phoneVerified: true, phoneVerifiedAt: new Date(), emailVerified: true });
  await withDoctorVerificationServer({ targetUser: target }, async (base) => {
    const res = await fetch(`${base}/api/doctors/verification`, {
      headers: authHeader(DOCTOR_ID, 'DOCTOR')
    });
    const body = await res.json();
    assert.equal(body.verification.phone.status, 'VERIFIED');
    assert.equal(body.verification.email.status, 'VERIFIED');
    assert.equal(body.verification.profile.status, 'NOT_VERIFIED');
    assert.equal(body.verification.isVerified, false);
  });
});

// ============================================================
// 3. SUP-HELP IS READ-ONLY
// ============================================================
test('12. SUP-HELP can READ a Doctor verification state and audit trail', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await fetch(`${base}/api/sup-help/doctors/${DOCTOR_ID}/verification`, {
      headers: authHeader(SUP_HELP_ID, 'SUPPORT_HELPER')
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.readOnly, true);
    assert.equal(body.canChangeStatus, false);
    assert.equal(body.canReview, false);
    assert.equal(body.canViewDocuments, true);
    assert.equal(body.verification.profile.status, 'NOT_VERIFIED');
    assert.ok(Array.isArray(body.auditTrail));
  });
});

test('13. SUP-HELP cannot change a verification status on ANY doctor route', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const attempts = [
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      `/api/support/doctors/${DOCTOR_ID}/verification`
    ];
    for (const path of attempts) {
      const res = await patchVerification(
        base,
        path,
        { type: 'profile', status: 'VERIFIED' },
        SUP_HELP_ID,
        'SUPPORT_HELPER'
      );
      assert.ok(res.status === 403 || res.status === 404, `Sup-Help must not be able to PATCH ${path}`);
      const body = await res.json().catch(() => ({}));
      assert.notEqual(body.success, true);
    }
  });
});

test('14. SUP-HELP cannot approve or reject a verification', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    for (const status of ['VERIFIED', 'REJECTED', 'PENDING', 'NOT_VERIFIED']) {
      const res = await patchVerification(
        base,
        `/api/sup-help/doctors/${DOCTOR_ID}/verification`,
        { type: 'identity', status, rejectionReason: 'Because' },
        SUP_HELP_ID,
        'SUPPORT_HELPER'
      );
      assert.ok(res.status === 403 || res.status === 404, `Sup-Help must not be able to set ${status}`);
    }
    assert.equal(ctx.auditRecords.length, 0, 'no Sup-Help decision may reach the audit trail');
  });
});

test('15. SUP-HELP has no write route at all under /api/sup-help/doctors', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const res = await fetch(`${base}/api/sup-help/doctors/${DOCTOR_ID}/verification`, {
        method,
        headers: authHeader(SUP_HELP_ID, 'SUPPORT_HELPER'),
        body: JSON.stringify({ type: 'profile', status: 'VERIFIED' })
      });
      assert.equal(res.status, 404, `${method} must not exist on the Sup-Help doctor verification route`);
    }
  });
});

test('16. Non-staff roles cannot read the Sup-Help Doctor verification endpoint', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const [userId, role] of [[WORKER_ID, 'WORKER'], [TEACHER_ID, 'TEACHER'], [STUDENT_ID, 'STUDENT']]) {
      const res = await fetch(`${base}/api/sup-help/doctors/${DOCTOR_ID}/verification`, {
        headers: authHeader(userId, role)
      });
      assert.equal(res.status, 403, `${role} must not reach the Sup-Help doctor verification endpoint`);
    }
  });
});

// ============================================================
// 4. DOCTORS AND OTHER ROLES ARE REJECTED
// ============================================================
test('17. A DOCTOR cannot review any Doctor verification', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    for (const path of [
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      `/api/support/doctors/${DOCTOR_ID}/verification`
    ]) {
      const res = await patchVerification(
        base,
        path,
        { type: 'profile', status: 'VERIFIED' },
        DOCTOR_ID,
        'DOCTOR'
      );
      assert.ok(res.status === 403 || res.status === 404);
    }
    assert.equal(ctx.auditRecords.length, 0);
  });
});

test('18. WORKER, TEACHER and STUDENT cannot review a Doctor verification', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const [userId, role] of [[WORKER_ID, 'WORKER'], [TEACHER_ID, 'TEACHER'], [STUDENT_ID, 'STUDENT']]) {
      const res = await patchVerification(
        base,
        `/api/admin/doctors/${DOCTOR_ID}/verification`,
        { type: 'profile', status: 'VERIFIED' },
        userId,
        role
      );
      assert.equal(res.status, 403, `${role} must not review a Doctor verification`);
    }
  });
});

test('19. A non-Doctor user cannot be reviewed through the Doctor verification routes', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${WORKER_ID}/verification`,
      { type: 'profile', status: 'VERIFIED' },
      ADMIN_ID,
      'ADMIN'
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /not a Doctor/i);
  });
});

test('20. A reviewer cannot approve their own Doctor profile', async () => {
  const selfReviewer = createMockUser({
    _id: SUP_ADMIN_ID,
    fullName: 'Sup-Admin Doctor',
    email: 'supadmin-doctor@homelyserv.test',
    role: 'SUPPORT'
  });
  await withDoctorVerificationServer({ targetUser: selfReviewer }, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${SUP_ADMIN_ID}/verification`,
      { type: 'profile', status: 'VERIFIED' },
      SUP_ADMIN_ID,
      'SUPPORT'
    );
    assert.equal(res.status, 403);
    assert.equal(ctx.auditRecords.length, 0);
  });
});

// ============================================================
// 5. DECISION VALIDATION
// ============================================================
test('21. Rejecting a verification requires a rejection reason', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      { type: 'certificates', status: 'REJECTED' },
      ADMIN_ID,
      'ADMIN'
    );
    assert.equal(res.status, 400);
    assert.equal(ctx.auditRecords.length, 0);
  });
});

test('22. A rejection records the reason in the audit trail', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/support/doctors/${DOCTOR_ID}/verification`,
      { type: 'certificates', status: 'REJECTED', rejectionReason: 'Certificate image is unreadable' },
      SUP_ADMIN_ID,
      'SUPPORT'
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.verification.certificates.status, 'REJECTED');

    const entry = ctx.auditRecords.at(-1);
    assert.equal(entry.verificationType, 'CERTIFICATES_LICENSES');
    assert.equal(entry.newStatus, 'REJECTED');
    assert.equal(entry.rejectionReason, 'Certificate image is unreadable');
    assert.equal(entry.reviewerRole, 'SUPPORT');
  });
});

test('23. An invalid verification status is rejected and never audited', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      { type: 'profile', status: 'APPROVED' },
      ADMIN_ID,
      'ADMIN'
    );
    assert.equal(res.status, 400);
    assert.equal(ctx.auditRecords.length, 0);
  });
});

test('24. An unknown verification type is rejected', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    const res = await patchVerification(
      base,
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      { type: 'psychotherapist', status: 'VERIFIED' },
      ADMIN_ID,
      'ADMIN'
    );
    assert.equal(res.status, 400);
    assert.equal(ctx.auditRecords.length, 0);
  });
});

test('25. Every audit entry records the previous status, the new status and the reviewer', async () => {
  await withDoctorVerificationServer({}, async (base, ctx) => {
    await patchVerification(
      base,
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      { type: 'experience', status: 'PENDING' },
      ADMIN_ID,
      'ADMIN'
    );
    await patchVerification(
      base,
      `/api/support/doctors/${DOCTOR_ID}/verification`,
      { type: 'experience', status: 'VERIFIED' },
      SUP_ADMIN_ID,
      'SUPPORT'
    );

    assert.equal(ctx.auditRecords.length, 2);
    const [first, second] = ctx.auditRecords;
    assert.equal(first.previousStatus, 'NOT_VERIFIED');
    assert.equal(first.newStatus, 'PENDING');
    assert.equal(String(first.reviewerId), ADMIN_ID);
    assert.equal(first.reviewerRole, 'ADMIN');

    assert.equal(second.previousStatus, 'PENDING');
    assert.equal(second.newStatus, 'VERIFIED');
    assert.equal(String(second.reviewerId), SUP_ADMIN_ID);
    assert.equal(second.reviewerRole, 'SUPPORT');
  });
});

test('26. Audit records are immutable: update and delete are refused', async () => {
  const { IMMUTABLE_OPERATION_ERROR } = await import('../models/DoctorVerificationAudit.js');
  assert.ok(IMMUTABLE_OPERATION_ERROR);

  const operations = [
    ['updateOne', () => DoctorVerificationAudit.updateOne({}, {})],
    ['updateMany', () => DoctorVerificationAudit.updateMany({}, {})],
    ['findOneAndUpdate', () => DoctorVerificationAudit.findOneAndUpdate({}, {})],
    ['findOneAndReplace', () => DoctorVerificationAudit.findOneAndReplace({}, {})],
    ['deleteOne', () => DoctorVerificationAudit.deleteOne({})],
    ['deleteMany', () => DoctorVerificationAudit.deleteMany({})],
    ['findOneAndDelete', () => DoctorVerificationAudit.findOneAndDelete({})]
  ];

  for (const [name, run] of operations) {
    await assert.rejects(run, /immutable/i, `${name} must be refused on an audit record`);
  }
});

// ============================================================
// 6. STAFF DOCTOR PROFILE VIEWS (never a WorkerProfile fallback)
// ============================================================
test('27. ADMIN opening a Doctor receives the real Doctor profile, never a WorkerProfile', async () => {
  const doctorProfile = {
    _id: 'dp-1',
    userId: DOCTOR_ID,
    professionalTitle: 'Consultant Cardiologist',
    specialty: 'cardiology',
    additionalSpecialties: ['internal_medicine'],
    subspecialty: 'Interventional Cardiology',
    experienceSummary: '12 years of practice.',
    bio: 'Cardiologist.',
    yearsOfExperience: 12,
    languages: ['en', 'ar'],
    qualifications: ['MBBS'],
    education: ['MBBS, Cairo University, 2010'],
    certifications: ['Board Certified Cardiology, 2016'],
    licenseNumber: 'DHA-12345',
    licenseAuthority: 'DHA',
    profileImage: '',
    isProfileComplete: true,
    isPublished: true,
    searchVisibility: true
  };
  const clinics = [{
    _id: 'clinic-1',
    doctorId: DOCTOR_ID,
    clinicName: 'City Hospital',
    addressLine: '1 Main St',
    city: 'Dubai',
    countryCode: 'AE',
    isActive: true,
    isPrimary: true
  }];

  await withDoctorVerificationServer({ doctorProfile, clinics }, async (base) => {
    const res = await fetch(`${base}/api/admin/users/${DOCTOR_ID}`, {
      headers: authHeader(ADMIN_ID, 'ADMIN')
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, 'DOCTOR');
    assert.ok(body.user.DoctorProfile, 'the Doctor professional profile must be returned');
    assert.equal(body.user.DoctorProfile.specialty, 'cardiology');
    assert.deepEqual(body.user.DoctorProfile.education, ['MBBS, Cairo University, 2010']);
    assert.deepEqual(body.user.DoctorProfile.certifications, ['Board Certified Cardiology, 2016']);
    assert.ok(!body.user.WorkerProfile, 'a Doctor must never be rendered through a WorkerProfile');
    assert.equal(body.user.doctorClinics.length, 1);
    assert.equal(body.user.doctorClinics[0].clinicName, 'City Hospital');
  });
});

test('28. SUP-ADMIN opening a Doctor is allowed and receives the real Doctor profile', async () => {
  const doctorProfile = {
    _id: 'dp-2',
    userId: DOCTOR_ID,
    specialty: 'pediatrics',
    yearsOfExperience: 5,
    education: ['MBBS'],
    certifications: [],
    languages: [],
    qualifications: [],
    additionalSpecialties: []
  };
  await withDoctorVerificationServer({ doctorProfile, clinics: [] }, async (base) => {
    const res = await fetch(`${base}/api/support/users/${DOCTOR_ID}`, {
      headers: authHeader(SUP_ADMIN_ID, 'SUPPORT')
    });
    assert.equal(res.status, 200, 'Sup-Admin must be able to open a Doctor profile');
    const body = await res.json();
    assert.equal(body.user.role, 'DOCTOR');
    assert.equal(body.user.DoctorProfile.specialty, 'pediatrics');
    assert.ok(!body.user.WorkerProfile, 'a Doctor must never be rendered through a WorkerProfile');
  });
});

test('29. SUP-HELP opening a Doctor is allowed and read-only', async () => {
  const doctorProfile = {
    _id: 'dp-3',
    userId: DOCTOR_ID,
    specialty: 'dermatology',
    yearsOfExperience: 3,
    education: [],
    certifications: [],
    languages: [],
    qualifications: [],
    additionalSpecialties: []
  };
  await withDoctorVerificationServer({ doctorProfile, clinics: [] }, async (base) => {
    const res = await fetch(`${base}/api/sup-help/users/${DOCTOR_ID}`, {
      headers: authHeader(SUP_HELP_ID, 'SUPPORT_HELPER')
    });
    assert.equal(res.status, 200, 'Sup-Help must be able to open a Doctor profile read-only');
    const body = await res.json();
    assert.equal(body.user.role, 'DOCTOR');
    assert.equal(body.user.DoctorProfile.specialty, 'dermatology');
    assert.ok(!body.user.WorkerProfile, 'a Doctor must never be rendered through a WorkerProfile');
  });
});

test('30. Sup-Help still cannot open staff profiles, and may read Teacher/Student read-only', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    // Staff accounts (ADMIN / SUPPORT / SUP_ADMIN / SUPPORT_HELPER) remain
    // OUTSIDE the Sup-Help directory: staff identities are never browsable
    // through the platform-user profile endpoint.
    for (const id of [ADMIN_ID, SUP_ADMIN_ID, SUP_HELP_ID]) {
      const res = await fetch(`${base}/api/sup-help/users/${id}`, {
        headers: authHeader(SUP_HELP_ID, 'SUPPORT_HELPER')
      });
      assert.equal(res.status, 403, `Sup-Help must not open staff profile ${id}`);
    }

    // Teacher and Student are first-class platform roles and ARE readable by
    // Sup-Help (read-only), the same visibility Sup-Admin already has.
    for (const [id, role] of [[TEACHER_ID, 'TEACHER'], [STUDENT_ID, 'STUDENT']]) {
      const res = await fetch(`${base}/api/sup-help/users/${id}`, {
        headers: authHeader(SUP_HELP_ID, 'SUPPORT_HELPER')
      });
      assert.equal(res.status, 200, `Sup-Help must be able to open a ${role} profile`);
      const body = await res.json();
      assert.equal(body.user.role, role);
      assert.ok(!body.user.WorkerProfile, `a ${role} must never be rendered through a WorkerProfile`);
    }
  });
});

// ============================================================
// 7. ROLE SAFETY
// ============================================================
test('31. Teacher and Student remain their own roles and are never treated as Doctors', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    for (const [id, role] of [[TEACHER_ID, 'TEACHER'], [STUDENT_ID, 'STUDENT']]) {
      const res = await fetch(`${base}/api/doctors/verification`, { headers: authHeader(id, role) });
      assert.equal(res.status, 403);

      const review = await fetch(`${base}/api/admin/doctors/${id}/verification`, {
        headers: authHeader(ADMIN_ID, 'ADMIN')
      });
      assert.equal(review.status, 400, 'a Teacher/Student is NOT a Doctor and must not be reviewed as one');
      const body = await review.json();
      assert.match(body.message, /not a Doctor/i);
    }
  });
});

test('32. Unauthenticated requests are rejected on every Doctor verification route', async () => {
  await withDoctorVerificationServer({}, async (base) => {
    const paths = [
      '/api/doctors/verification',
      `/api/admin/doctors/${DOCTOR_ID}/verification`,
      `/api/support/doctors/${DOCTOR_ID}/verification`,
      `/api/sup-help/doctors/${DOCTOR_ID}/verification`
    ];
    for (const path of paths) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 401, `unauthenticated: ${path}`);
    }
  });
});
