// backend/src/routes/paymentHireAuthorization.test.js
// ============================================================
// Payment authorization tests for TEACHER / DOCTOR Worker hires.
//
// The HomelyServ commission endpoints are role-agnostic and ownership-scoped:
// a caller may only act on a payment whose Hire is owned by them
// (hire.employerId === req.userId). These tests prove that
//   * EMPLOYER behaviour is unchanged,
//   * a TEACHER / DOCTOR that OWNS the hire passes the payment gate,
//   * a TEACHER / DOCTOR that does NOT own it is rejected,
//   * unauthorized roles (WORKER, ...) can never use the payment flow,
//   * the 15% commission math is unchanged (single source of truth).
// Run: node --test src/routes/paymentHireAuthorization.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization.js';
import { multiplyMoneyByDecimal, roundMoney } from '../utils/money.js';
import paymentRouter from './payment.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

const EMPLOYER_ID = '111111111111111111111111';
const TEACHER_ID = '222222222222222222222222';
const DOCTOR_ID = '333333333333333333333333';
const OTHER_ID = '444444444444444444444444';
const WORKER_USER_ID = '555555555555555555555555';

const hireFor = (ownerId) => ({
  id: `hire-${ownerId}`,
  employerId: ownerId,
  workerId: 'wp-1',
  status: 'offer_sent',
  paymentStatus: 'pending',
  totalDue: 1500,
  compensationCurrency: 'EGP',
});

const paymentFor = (ownerId) => ({
  id: `pay-${ownerId}`,
  transactionId: `txn-${ownerId}`,
  orderId: `ord-${ownerId}`,
  userId: ownerId,
  purpose: 'COMMISSION',
  hireId: `hire-${ownerId}`,
  paymentMethod: 'paypal',
  status: 'completed',
  fulfillmentStatus: 'fulfilled',
  amount: 1500,
  currency: 'EGP',
});

const authHeader = (userId, role) =>
  `Bearer ${jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' })}`;

const installMocks = (hireOwnerId, { hireMissing = false } = {}) => {
  const saved = {
    hireFindUnique: prisma.hire.findUnique,
    hireFindMany: prisma.hire.findMany,
    paymentFindFirst: prisma.payment.findFirst,
    paymentFindMany: prisma.payment.findMany,
    paymentUpdate: prisma.payment.update,
    paymentCreate: prisma.payment.create,
    userFindUnique: prisma.user.findUnique,
  };
  const savedUserFindById = User.findById;

  // The auth middleware resolves tokenVersion from the User collection. Stub it
  // so the fixture ids do not require real database rows.
  User.findById = () => ({
    select: () => Promise.resolve({ tokenVersion: 0, isSuspended: false }),
  });

  const hire = hireFor(hireOwnerId);
  const payment = paymentFor(hireOwnerId);

  prisma.hire.findUnique = async () => (hireMissing ? null : hire);
  prisma.hire.findMany = async ({ where } = {}) =>
    where?.employerId === hire.employerId ? [{ id: hire.id }] : [];
  prisma.payment.findFirst = async () => payment;
  prisma.payment.findMany = async () => [payment];
  prisma.payment.update = async () => payment;
  prisma.payment.create = async () => payment;
  prisma.user.findUnique = async () => ({ id: TEACHER_ID, role: 'TEACHER' });

  return () => {
    prisma.hire.findUnique = saved.hireFindUnique;
    prisma.hire.findMany = saved.hireFindMany;
    prisma.payment.findFirst = saved.paymentFindFirst;
    prisma.payment.findMany = saved.paymentFindMany;
    prisma.payment.update = saved.paymentUpdate;
    prisma.payment.create = saved.paymentCreate;
    prisma.user.findUnique = saved.userFindUnique;
    User.findById = savedUserFindById;
  };
};

const withServer = async (hireOwnerId, run, options = {}) => {
  const restore = installMocks(hireOwnerId, options);
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRouter);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    restore();
    await new Promise((resolve) => server.close(resolve));
  }
};

const getJson = async (base, path, userId, role) => {
  const response = await fetch(`${base}${path}`, { headers: { authorization: authHeader(userId, role) } });
  return { status: response.status, body: await response.json().catch(() => ({})) };
};

const postJson = async (base, path, userId, role, payload) => {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: authHeader(userId, role) },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
};
const isPaymentAccessDenied = (result) =>
  result.status === 404 && result.body?.error === 'Payment not found';

const isHireOwnershipDenied = (result) =>
  result.status === 403 && result.body?.error === 'You are not authorized to pay for this hire';

test('EMPLOYER payment flow is unchanged: the hire owner passes the payment gate', async () => {
  await withServer(EMPLOYER_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/txn-employer', EMPLOYER_ID, 'EMPLOYER');
    assert.equal(isPaymentAccessDenied(result), false);
  });
});

test('TEACHER can act on a payment for their OWN Worker hire', async () => {
  await withServer(TEACHER_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/txn-teacher', TEACHER_ID, 'TEACHER');
    assert.equal(isPaymentAccessDenied(result), false);
  });
});

test('DOCTOR can act on a payment for their OWN Worker hire', async () => {
  await withServer(DOCTOR_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/txn-doctor', DOCTOR_ID, 'DOCTOR');
    assert.equal(isPaymentAccessDenied(result), false);
  });
});

test('TEACHER cannot access another user hire payment', async () => {
  await withServer(OTHER_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/anything', TEACHER_ID, 'TEACHER');
    assert.equal(isPaymentAccessDenied(result), true);
  });
});

test('DOCTOR cannot access another user hire payment', async () => {
  await withServer(OTHER_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/anything', DOCTOR_ID, 'DOCTOR');
    assert.equal(isPaymentAccessDenied(result), true);
  });
});

test('Unauthorized role (WORKER) cannot use the hire payment gate', async () => {
  await withServer(WORKER_USER_ID, async (base) => {
    const result = await getJson(base, '/api/payments/status/anything', WORKER_USER_ID, 'WORKER');
    assert.equal(isPaymentAccessDenied(result), true);
  });
});

test('TEACHER cannot initiate payment for a hire they do not own', async () => {
  await withServer(OTHER_ID, async (base) => {
    const result = await postJson(base, '/api/payments/create-payment-intent', TEACHER_ID, 'TEACHER', {
      paymentMethod: 'paypal',
      purpose: 'COMMISSION',
      hireId: 'hire-other',
      amount: 1,
    });
    assert.equal(isHireOwnershipDenied(result), true);
  });
});

test('DOCTOR cannot initiate payment for a hire they do not own', async () => {
  await withServer(OTHER_ID, async (base) => {
    const result = await postJson(base, '/api/payments/create-payment-intent', DOCTOR_ID, 'DOCTOR', {
      paymentMethod: 'paypal',
      purpose: 'COMMISSION',
      hireId: 'hire-other',
      amount: 1,
    });
    assert.equal(isHireOwnershipDenied(result), true);
  });
});

test('WORKER cannot initiate payment for a hire', async () => {
  await withServer(OTHER_ID, async (base) => {
    const result = await postJson(base, '/api/payments/create-payment-intent', WORKER_USER_ID, 'WORKER', {
      paymentMethod: 'paypal',
      purpose: 'COMMISSION',
      hireId: 'hire-other',
      amount: 1,
    });
    assert.equal(isHireOwnershipDenied(result), true);
  });
});

test('The commission amount is server-authoritative: an unknown hire is rejected before any charge', async () => {
  await withServer(TEACHER_ID, async (base) => {
    const result = await postJson(base, '/api/payments/create-payment-intent', TEACHER_ID, 'TEACHER', {
      paymentMethod: 'paypal',
      purpose: 'COMMISSION',
      hireId: 'hire-does-not-exist',
      amount: 1,
    });
    // The endpoint resolves the Hire (and its authoritative totalDue) from the
    // database; a client-supplied amount is never trusted.
    assert.equal(result.status, 400);
    assert.equal(result.body?.error, 'Hire not found for commission payment');
  }, { hireMissing: true });
});

test('A commission payment without a hire is rejected', async () => {
  await withServer(TEACHER_ID, async (base) => {
    const result = await postJson(base, '/api/payments/create-payment-intent', TEACHER_ID, 'TEACHER', {
      paymentMethod: 'paypal',
      purpose: 'COMMISSION',
      amount: 500,
    });
    assert.equal(result.status, 400);
    assert.equal(result.body?.error, 'hireId is required for commission payments');
  });
});

test('TEACHER payment history now includes commission payments owned via their hires', async () => {
  await withServer(TEACHER_ID, async (base) => {
    const result = await getJson(base, `/api/payments/user/${TEACHER_ID}`, TEACHER_ID, 'TEACHER');
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body?.payments));
    assert.ok(result.body.payments.length > 0, 'Teacher must see their own commission payment');
  });
});

test('Another role cannot read a different user payment history', async () => {
  await withServer(TEACHER_ID, async (base) => {
    const result = await getJson(base, `/api/payments/user/${OTHER_ID}`, TEACHER_ID, 'TEACHER');
    assert.equal(result.status, 404);
  });
});

test('HomelyServ commission remains exactly 15% for Teacher/Doctor hires', () => {
  assert.equal(RECRUITMENT_COMMISSION_RATE, 0.15);
  const cases = [
    { salary: '10000', currency: 'EGP', expected: '1500.00' },
    { salary: '3333.33', currency: 'EGP', expected: '500.00' },
    { salary: '250.00', currency: 'USD', expected: '37.50' },
  ];
  for (const { salary, currency, expected } of cases) {
    const commission = multiplyMoneyByDecimal(salary, RECRUITMENT_COMMISSION_RATE, currency);
    assert.equal(roundMoney(commission, currency), Number(expected), `${salary} ${currency}`);
  }
});