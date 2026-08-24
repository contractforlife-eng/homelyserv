import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkerPaymentHistory,
  getWorkerPaymentHistory,
  isMeaningfulPremiumPayment,
} from './workerPaymentHistoryService.js';

const payment = (overrides = {}) => ({
  amount: 60,
  currency: 'EGP',
  paymentMethod: 'paypal',
  status: 'processing',
  fulfillmentStatus: 'pending',
  manualReviewState: null,
  metadata: {},
  createdAt: '2026-08-01T00:00:00.000Z',
  completedAt: null,
  ...overrides,
});

test('transient PayPal attempts are hidden from Premium history', () => {
  const result = buildWorkerPaymentHistory({
    payments: [
      payment({ status: 'pending' }),
      payment({ status: 'processing' }),
      payment({ status: 'processing', metadata: { paypalOrderStatus: 'CREATED' } }),
      payment({ status: 'processing', metadata: { paypalOrderStatus: 'PAYER_ACTION_REQUIRED' } }),
    ],
  });

  assert.deepEqual(result.paid, []);
});

test('completed and final failed PayPal outcomes remain visible', () => {
  const result = buildWorkerPaymentHistory({
    payments: [
      payment({ status: 'completed', fulfillmentStatus: 'fulfilled' }),
      payment({ status: 'failed', fulfillmentStatus: 'failed' }),
    ],
  });

  assert.deepEqual(result.paid.map(({ status }) => status), ['completed', 'failed']);
});

test('fulfilled payment outcomes remain visible even when payment status is not completed', () => {
  assert.equal(isMeaningfulPremiumPayment(payment({ status: 'processing', fulfillmentStatus: 'fulfilled' })), true);
});

test('manual review outcomes remain visible while unclassified manual payments stay hidden', () => {
  const visibleStates = ['awaiting_transfer', 'proof_submitted', 'pending_verification', 'verified', 'rejected'];
  const result = buildWorkerPaymentHistory({
    payments: [
      ...visibleStates.map((manualReviewState) => payment({
        paymentMethod: 'bank_transfer',
        status: manualReviewState === 'verified' ? 'completed' : 'pending',
        manualReviewState,
      })),
      payment({ paymentMethod: 'vodafone_cash', status: 'pending', manualReviewState: null }),
      payment({ paymentMethod: 'instapay', status: 'processing', manualReviewState: 'unknown' }),
    ],
  });

  assert.equal(result.paid.length, visibleStates.length);
  assert.deepEqual(result.paid.map(({ status, paymentStatus }) => ({ status, paymentStatus })), [
    { status: 'pending', paymentStatus: 'pending' },
    { status: 'pending', paymentStatus: 'pending' },
    { status: 'pending', paymentStatus: 'pending' },
    { status: 'completed', paymentStatus: 'completed' },
    { status: 'pending', paymentStatus: 'pending' },
  ]);
});

test('unknown and non-final payment states are hidden without changing their records', () => {
  for (const status of ['created', 'saved', 'approved', 'unknown', '']) {
    assert.equal(isMeaningfulPremiumPayment(payment({ status })), false);
  }
});

test('paid Premium history keeps the historical transaction amount and currency', () => {
  const result = buildWorkerPaymentHistory({
    payments: [{
      amount: 8.99,
      currency: 'EUR',
      paymentMethod: 'paypal',
      status: 'completed',
      metadata: { plan: 'monthly' },
      createdAt: '2026-08-01T00:00:00.000Z',
      completedAt: '2026-08-01T00:01:00.000Z',
      SubscriptionGrant: {
        plan: 'monthly',
        startsAt: '2026-08-01T00:01:00.000Z',
        endsAt: '2026-08-31T00:01:00.000Z',
      },
    }],
  });

  assert.deepEqual(result.paid[0], {
    source: 'paid',
    plan: 'monthly',
    status: 'completed',
    paymentStatus: 'completed',
    subscriptionStatus: null,
    startDate: '2026-08-01T00:01:00.000Z',
    endDate: '2026-08-31T00:01:00.000Z',
    amount: 8.99,
    currency: 'EUR',
    provider: 'paypal',
    paymentDate: '2026-08-01T00:01:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
  });
});

test('manual Premium history contains no fabricated payment amount', () => {
  const result = buildWorkerPaymentHistory({
    manualGrant: {
      status: 'active',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-31T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  });

  assert.equal(result.manual.length, 1);
  assert.equal(result.manual[0].source, 'manual');
  assert.equal(result.manual[0].amount, null);
  assert.equal(result.manual[0].currency, null);
});

test('grant and legacy manual history remain visible and payment queries stay user-scoped', async () => {
  const calls = [];
  const db = {
    payment: { findMany: async (query) => { calls.push(['payment', query]); return []; } },
    manualPremiumGrant: { findUnique: async (query) => { calls.push(['grant', query]); return null; } },
    subscription: { findMany: async (query) => { calls.push(['subscription', query]); return []; } },
  };

  const result = buildWorkerPaymentHistory({
    payments: [],
    manualGrant: { status: 'active', createdAt: '2026-08-01T00:00:00.000Z' },
    legacyManualSubscriptions: [{ status: 'expired', createdAt: '2026-07-01T00:00:00.000Z' }],
  });
  await getWorkerPaymentHistory('worker-123', db);

  assert.equal(result.manual.length, 2);
  assert.deepEqual(calls.map(([type, query]) => [type, query.where]), [
    ['payment', { userId: 'worker-123', purpose: 'SUBSCRIPTION' }],
    ['grant', { userId: 'worker-123' }],
    ['subscription', { userId: 'worker-123', plan: 'manual' }],
  ]);
});
