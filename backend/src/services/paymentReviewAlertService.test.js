import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_PAYMENT_REVIEW_NOTIFICATION_TYPE,
  buildAdminPaymentReviewAlert,
  isCanonicalAdminReviewPayment,
  notifyAdminsForPaymentReview,
} from './paymentReviewAlertService.js';
import { ADMIN_PAYMENT_REVIEW_COUNTER_WHERE } from './sidebarCountersService.js';

const payment = {
  id: 'payment-1',
  orderId: 'ORDER-1',
  purpose: 'SUBSCRIPTION',
  paymentMethod: 'vodafone_cash',
  status: 'pending',
  fulfillmentStatus: 'pending',
  manualReviewState: 'pending_verification',
};

test('canonical Admin review predicate requires all three lifecycle fields', () => {
  assert.equal(isCanonicalAdminReviewPayment(payment), true);
  assert.equal(isCanonicalAdminReviewPayment({ ...payment, status: 'completed' }), false);
  assert.equal(isCanonicalAdminReviewPayment({ ...payment, fulfillmentStatus: 'completed' }), false);
  assert.equal(isCanonicalAdminReviewPayment({ ...payment, manualReviewState: 'awaiting_transfer' }), false);
});

test('Admin review alert contains safe generic content and Admin Payments target', () => {
  assert.deepEqual(buildAdminPaymentReviewAlert(payment), {
    type: ADMIN_PAYMENT_REVIEW_NOTIFICATION_TYPE,
    title: 'Payment Requires Review',
    message: 'A new payment is waiting for verification.',
    priority: 'HIGH',
    entityType: 'PAYMENT',
    entityId: 'payment-1',
    link: '/admin/payments',
    data: {
      paymentReview: 'required',
      paymentId: 'payment-1',
      purpose: 'SUBSCRIPTION',
      paymentMethod: 'vodafone_cash',
      orderId: 'ORDER-1',
    },
  });
});

test('Admin counter uses only canonical review-required fields', () => {
  assert.deepEqual(ADMIN_PAYMENT_REVIEW_COUNTER_WHERE, {
    status: 'pending',
    fulfillmentStatus: 'pending',
    manualReviewState: 'pending_verification',
  });
});

test('Admin review delivery targets Admin users only and sends one in-app/push pair per Admin', async () => {
  const notifications = [];
  const pushes = [];
  const result = await notifyAdminsForPaymentReview(payment, {
    findAdmins: async () => [{ _id: 'admin-1' }, { _id: 'admin-2' }],
    createNotification: async (userId, payload) => notifications.push({ userId, payload }),
    sendPushToUser: async (userId, payload) => pushes.push({ userId, payload }),
  });

  assert.equal(result.notified, 2);
  assert.deepEqual(notifications.map((item) => item.userId), ['admin-1', 'admin-2']);
  assert.deepEqual(pushes.map((item) => item.userId), ['admin-1', 'admin-2']);
  assert.equal(pushes[0].payload.channelId, 'payments');
  assert.equal(pushes[0].payload.title, 'Payment Requires Review');
});

test('non-review states do not deliver Admin alerts', async () => {
  let calls = 0;
  const result = await notifyAdminsForPaymentReview(
    { ...payment, manualReviewState: 'awaiting_transfer' },
    { findAdmins: async () => { calls += 1; return [{ _id: 'admin-1' }]; } },
  );

  assert.deepEqual(result, { notified: 0, skipped: true });
  assert.equal(calls, 0);
});
