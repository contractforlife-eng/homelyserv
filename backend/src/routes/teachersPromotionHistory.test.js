// backend/src/routes/teachersPromotionHistory.test.js
// ============================================================
// TEACHER PROMOTION HISTORY ROUTE REGRESSION TESTS
// ============================================================
// Regression guard: the route registration for
//   GET /api/teachers/promotion-history
// was accidentally removed in 47922be (recorded-courses commit),
// leaving the controller + import orphaned and every request
// falling through to the catch-all 404 "Route not found" handler.
//
// Verifies:
// 1. The route is mounted on the real teachers router (no 404).
// 2. An authenticated TEACHER receives 200 with success + history.
// 3. Only the controller's intended safe fields are exposed.
// 4. Unauthenticated requests are rejected (401) by the real
//    `authenticate` middleware, and a non-teacher role is rejected (403).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import teachersRouter from './teachers.js';
import prisma from '../lib/prisma.js';

const secret = 'teacher-promotion-history-test-secret-2026-homelyserv';
process.env.JWT_SECRET = secret;

const TEACHER_ID = '507f1f77bcf86cd7994390a1';
const STUDENT_ID = '507f1f77bcf86cd7994390a2';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

// Sensitive provider fields the controller must never echo back.
const paidPayment = {
  id: 'pay-premium-1',
  orderId: 'BT-order-premium-1',
  transactionId: 'TXN-premium-1',
  amount: 300,
  currency: 'EGP',
  paymentMethod: 'paypal',
  status: 'completed',
  fulfillmentStatus: 'fulfilled',
  manualReviewState: null,
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  completedAt: new Date('2026-08-01T10:05:00.000Z'),
  metadata: { plan: 'monthly' },
  paypalOrderId: '8PT12345SECRET',
  captureId: '3AB98765SECRET',
  SubscriptionGrant: {
    plan: 'monthly',
    status: 'active',
    startsAt: new Date('2026-08-01T10:05:00.000Z'),
    endsAt: new Date('2026-09-01T10:05:00.000Z'),
  },
};
test('Teacher promotion-history route: mounted, authorized, and safe', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/teachers', teachersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Auth middleware resolves the session via User.findById().select(...)
  const origUserFindById = User.findById;
  // authenticate() also fires a non-blocking activity write via
  // User.findByIdAndUpdate(); stub it so no mongoose buffering handle is left
  // pending at teardown (keeps this suite deterministic offline).
  const origUserFindByIdAndUpdate = User.findByIdAndUpdate;
  User.findByIdAndUpdate = async () => null;
  User.findById = (id) => ({
    select: () => {
      if (String(id) === TEACHER_ID) {
        return Promise.resolve({ _id: TEACHER_ID, role: 'TEACHER', tokenVersion: 0, isSuspended: false });
      }
      if (String(id) === STUDENT_ID) {
        return Promise.resolve({ _id: STUDENT_ID, role: 'STUDENT', tokenVersion: 0, isSuspended: false });
      }
      return Promise.resolve(null);
    }
  });

  // Prisma surfaces read by getTeacherPromotionHistory / getActivePremiumEntitlement.
  const origPaymentFindMany = prisma.payment.findMany;
  const origSubscriptionFindMany = prisma.subscription.findMany;
  const origSubscriptionFindFirst = prisma.subscription.findFirst;
  const origGrantFindUnique = prisma.manualPremiumGrant.findUnique;

  prisma.payment.findMany = async () => [paidPayment];
  prisma.subscription.findMany = async () => [];
  // getActivePremiumEntitlement resolves the live entitlement from an active
  // (non-manual) subscription; mirror that so currentPremium is populated.
  prisma.subscription.findFirst = async () => ({
    id: 'sub-premium-1',
    plan: 'monthly',
    status: 'active',
    startDate: new Date('2026-08-01T10:05:00.000Z'),
    endDate: new Date('2026-09-01T10:05:00.000Z'),
  });
  prisma.manualPremiumGrant.findUnique = async () => null;


const EXPECTED_RECORD_KEYS = [
  'amount', 'createdAt', 'currency', 'date', 'endDate', 'id', 'paymentMethod',
  'paymentStatus', 'plan', 'reference', 'source', 'startDate', 'status',
  'subscriptionStatus'
].sort();
  try {
    await t.test('mounted: authenticated teacher gets 200, not the 404 catch-all', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/promotion-history`, {
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.notEqual(body.message, 'Route not found');
      assert.ok(Array.isArray(body.history));
    });

    await t.test('returns the current premium entitlement and history records', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/promotion-history`, {
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(res.status, 200);
      const body = await res.json();

      assert.ok(body.currentPremium);
      assert.equal(body.currentPremium.plan, 'monthly');
      assert.equal(body.currentPremium.status, 'active');

      assert.equal(body.history.length, 1);
      const record = body.history[0];
      assert.equal(record.source, 'paid');
      assert.equal(record.plan, 'monthly');
      assert.equal(record.status, 'completed');
      assert.equal(record.amount, 300);
      assert.equal(record.currency, 'EGP');
      assert.equal(record.paymentMethod, 'paypal');
      assert.equal(record.reference, 'TXN-premium-1');
    });

    await t.test('exposes only the intended safe fields (no provider secrets)', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/promotion-history`, {
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(res.status, 200);
      const body = await res.json();

      const serialized = JSON.stringify(body);
      // Provider internals / credentials must never reach the client.
      assert.equal(serialized.includes('8PT12345SECRET'), false, 'paypalOrderId value leaked');
      assert.equal(serialized.includes('3AB98765SECRET'), false, 'captureId value leaked');
      assert.equal(serialized.includes('paypalOrderId'), false, 'paypalOrderId key leaked');
      assert.equal(serialized.includes('captureId'), false, 'captureId key leaked');

      // Whitelisted record keys only.
      assert.deepEqual(Object.keys(body.history[0]).sort(), EXPECTED_RECORD_KEYS);
    });

    await t.test('rejects unauthenticated requests (401 via real auth middleware)', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/promotion-history`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    await t.test('rejects a non-teacher role (403 via requireTeacher)', async () => {
      const res = await fetch(`${baseUrl}/api/teachers/promotion-history`, {
        headers: authHeader({ userId: STUDENT_ID, role: 'STUDENT', tokenVersion: 0 })
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
    });
  } finally {
    server.close();
    User.findById = origUserFindById;
    User.findByIdAndUpdate = origUserFindByIdAndUpdate;
    prisma.payment.findMany = origPaymentFindMany;
    prisma.subscription.findMany = origSubscriptionFindMany;
    prisma.subscription.findFirst = origSubscriptionFindFirst;
    prisma.manualPremiumGrant.findUnique = origGrantFindUnique;
  }
});

