import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkerPaymentHistory } from './workerPaymentHistoryService.js';

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
