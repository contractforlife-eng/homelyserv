// backend/src/controllers/hireControllerOwnership.test.js
// ============================================================
// Ownership tests for the TEACHER / DOCTOR Hires page.
//
// Proves that GET /api/hires/my-hires and GET /api/hires/offers return ONLY
// the authenticated caller's OWN records for EMPLOYER, TEACHER and DOCTOR, so a
// Teacher/Doctor can never see another Employer's, Teacher's or Doctor's
// hiring activity. Also proves the WORKER branch is unchanged.
//
// The mocked findMany simulates the database by applying the `where` clause
// the controller passed, so ownership is verified end-to-end rather than by
// inspecting the query text alone.
// Run: node --test src/controllers/hireControllerOwnership.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../lib/prisma.js';
import { getMyHires, getMyOffers } from './hireController.js';

const EMPLOYER_ID = '6666666666666666666666a';
const TEACHER_ID = '6666666666666666666666b';
const DOCTOR_ID = '6666666666666666666666c';
const OTHER_EMPLOYER_ID = '6666666666666666666666d';
const WORKER_USER_ID = '6666666666666666666666e';
const NO_PROFILE_WORKER_ID = '6666666666666666666666f';
const WORKER_PROFILE_ID = 'wp-worker-self';

const makeRow = (prefix, employerId) => ({
  id: `hire-${prefix}`,
  employerId,
  workerId: `wp-${prefix}`,
  offerId: `offer-${prefix}`,
  status: 'active',
  agreedSalary: 100,
  compensationCurrency: 'EGP',
  createdAt: new Date('2026-01-01'),
});

const HIRES = [
  makeRow('employer', EMPLOYER_ID),
  makeRow('teacher', TEACHER_ID),
  makeRow('doctor', DOCTOR_ID),
  makeRow('other', OTHER_EMPLOYER_ID),
  { ...makeRow('asworker', EMPLOYER_ID), workerId: WORKER_PROFILE_ID },
];

const OFFERS = [
  { id: 'offer-employer', employerId: EMPLOYER_ID, workerId: 'wp-employer', status: 'pending', salary: 100, compensationCurrency: 'EGP' },
  { id: 'offer-teacher', employerId: TEACHER_ID, workerId: 'wp-teacher', status: 'pending', salary: 100, compensationCurrency: 'EGP' },
  { id: 'offer-teacher-old', employerId: TEACHER_ID, workerId: 'wp-teacher', status: 'rejected', salary: 100, compensationCurrency: 'EGP' },
  { id: 'offer-doctor', employerId: DOCTOR_ID, workerId: 'wp-doctor', status: 'accepted', salary: 200, compensationCurrency: 'EGP' },
  { id: 'offer-other', employerId: OTHER_EMPLOYER_ID, workerId: 'wp-other', status: 'pending', salary: 400, compensationCurrency: 'EGP' },
];

const matchesOwner = (row, where = {}) => {
  if (where.employerId !== undefined && String(row.employerId) !== String(where.employerId)) return false;
  if (where.workerId !== undefined && String(row.workerId) !== String(where.workerId)) return false;
  return true;
};

// Install the minimal prisma surface the two list controllers touch.
const installMocks = () => {
  const saved = {
    hireFindMany: prisma.hire.findMany,
    offerFindMany: prisma.offer.findMany,
    workerProfileFindMany: prisma.workerProfile.findMany,
    workerProfileFindUnique: prisma.workerProfile.findUnique,
    userFindMany: prisma.user.findMany,
    subscriptionFindMany: prisma.subscription.findMany,
    manualPremiumGrantFindMany: prisma.manualPremiumGrant.findMany,
    employerProfileFindMany: prisma.employerProfile.findMany,
  };

  prisma.hire.findMany = async ({ where } = {}) =>
    HIRES.filter((row) => matchesOwner(row, where));
  prisma.offer.findMany = async ({ where } = {}) =>
    OFFERS.filter((row) => matchesOwner(row, where));
  prisma.workerProfile.findMany = async () => [];
  prisma.workerProfile.findUnique = async ({ where } = {}) =>
    where?.userId === WORKER_USER_ID ? { id: WORKER_PROFILE_ID, userId: WORKER_USER_ID } : null;
  prisma.user.findMany = async () => [];
  prisma.subscription.findMany = async () => [];
  prisma.manualPremiumGrant.findMany = async () => [];
  prisma.employerProfile.findMany = async () => [];

  return () => {
    prisma.hire.findMany = saved.hireFindMany;
    prisma.offer.findMany = saved.offerFindMany;
    prisma.workerProfile.findMany = saved.workerProfileFindMany;
    prisma.workerProfile.findUnique = saved.workerProfileFindUnique;
    prisma.user.findMany = saved.userFindMany;
    prisma.subscription.findMany = saved.subscriptionFindMany;
    prisma.manualPremiumGrant.findMany = saved.manualPremiumGrantFindMany;
    prisma.employerProfile.findMany = saved.employerProfileFindMany;
  };
};

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (payload) => { res.body = payload; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  return res;
};

const callAs = async (handler, { userId, userRole }) => {
  const restore = installMocks();
  try {
    const res = makeRes();
    await handler({ userId, userRole, params: {}, body: {} }, res);
    return res;
  } finally {
    restore();
  }
};
test('TEACHER retrieves only their OWN hires', async () => {
  const res = await callAs(getMyHires, { userId: TEACHER_ID, userRole: 'TEACHER' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((h) => h.id), ['hire-teacher']);
  assert.ok(res.body.every((h) => String(h.employerId) === TEACHER_ID));
});

test('DOCTOR retrieves only their OWN hires', async () => {
  const res = await callAs(getMyHires, { userId: DOCTOR_ID, userRole: 'DOCTOR' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((h) => h.id), ['hire-doctor']);
  assert.ok(res.body.every((h) => String(h.employerId) === DOCTOR_ID));
});

test('EMPLOYER hires behaviour is unchanged (own hires by employerId)', async () => {
  const res = await callAs(getMyHires, { userId: EMPLOYER_ID, userRole: 'EMPLOYER' });
  assert.deepEqual(res.body.map((h) => h.id), ['hire-employer', 'hire-asworker']);
});

test('TEACHER sees only their OWN offers (pending and declined)', async () => {
  const res = await callAs(getMyOffers, { userId: TEACHER_ID, userRole: 'TEACHER' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((o) => o.id).sort(), ['offer-teacher', 'offer-teacher-old']);
  assert.ok(res.body.every((o) => String(o.employerId) === TEACHER_ID));
});

test('DOCTOR sees only their OWN offers', async () => {
  const res = await callAs(getMyOffers, { userId: DOCTOR_ID, userRole: 'DOCTOR' });
  assert.deepEqual(res.body.map((o) => o.id), ['offer-doctor']);
});

test('No Teacher/Doctor response ever leaks a foreign employer record', async () => {
  for (const [userId, userRole] of [[TEACHER_ID, 'TEACHER'], [DOCTOR_ID, 'DOCTOR']]) {
    for (const handler of [getMyHires, getMyOffers]) {
      const res = await callAs(handler, { userId, userRole });
      assert.ok(
        res.body.every((row) => String(row.employerId) === String(userId)),
        `${userRole} leaked a foreign record via ${handler.name}`,
      );
    }
  }
});

test('WORKER branch is unchanged (hires where the user is the WorkerProfile)', async () => {
  const res = await callAs(getMyHires, { userId: WORKER_USER_ID, userRole: 'WORKER' });
  assert.deepEqual(res.body.map((h) => h.id), ['hire-asworker']);
});

test('WORKER with no WorkerProfile still gets an empty list', async () => {
  const res = await callAs(getMyHires, { userId: NO_PROFILE_WORKER_ID, userRole: 'WORKER' });
  assert.deepEqual(res.body, []);
});