import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../lib/prisma.js';
import paymentRouter, { buildBankTransferFxUnavailableResponse, buildSubscriptionStatusPayload, normalizePayPalOrderStatus } from './payment.js';

const bankTransferCreateHandler = paymentRouter.stack
  .find((layer) => layer.route?.path === '/bank-transfer/create')
  .route.stack.at(-1).handle;

const withEnvironment = async (values, callback) => {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) process.env[key] = value;
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('Bank Transfer FX failures use a safe unavailable response', () => {
  assert.deepEqual(buildBankTransferFxUnavailableResponse(), {
    error: 'Bank transfer is temporarily unavailable for this currency',
    status: 503,
  });
});

test('Bank Transfer FX failure returns safely before creating a Payment', async () => {
  const originalHireLookup = prisma.hire.findUnique;
  const originalPaymentCreate = prisma.payment.create;
  const originalFetch = globalThis.fetch;
  let paymentCreateCalls = 0;
  let responseStatus;
  let responseBody;

  prisma.hire.findUnique = async () => ({
    id: 'hire-1',
    totalDue: '60',
    employerId: 'employer-1',
    workerId: 'worker-1',
    offerId: 'offer-1',
    compensationCurrency: 'EGP',
  });
  prisma.payment.create = async () => {
    paymentCreateCalls += 1;
    throw new Error('Payment creation must not be reached');
  };
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ message: 'internal provider error' }) });

  try {
    await withEnvironment({
      BANK_TRANSFER_USD_ACCOUNT_NAME: 'Test account',
      BANK_TRANSFER_USD_BANK_NAME: 'Test bank',
      BANK_TRANSFER_USD_ACCOUNT_NUMBER: 'test-account',
      BANK_TRANSFER_USD_ROUTING_NUMBER: 'test-routing',
    }, async () => {
      await bankTransferCreateHandler(
        { userId: 'employer-1', user: { email: 'test@example.invalid' }, body: { purpose: 'COMMISSION', hireId: 'hire-1' } },
        {
          status(code) { responseStatus = code; return this; },
          json(body) { responseBody = body; return this; },
        },
      );
    });
  } finally {
    prisma.hire.findUnique = originalHireLookup;
    prisma.payment.create = originalPaymentCreate;
    globalThis.fetch = originalFetch;
  }

  assert.equal(responseStatus, 503);
  assert.deepEqual(responseBody, {
    success: false,
    error: 'Bank transfer is temporarily unavailable for this currency',
  });
  assert.equal(paymentCreateCalls, 0);
});

const now = new Date('2026-01-01T00:00:00.000Z');

const entitlement = (overrides = {}) => ({
  plan: 'monthly',
  status: 'active',
  startDate: new Date('2025-12-01T00:00:00.000Z'),
  endDate: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides,
});

test('paid Subscription entitlement is returned as active Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement(), now);
  assert.equal(payload.isPremium, true);
  assert.equal(payload.active, true);
  assert.equal(payload.subscription.source, 'paid');
  assert.equal(payload.subscription.plan, 'monthly');
});

test('ManualPremiumGrant entitlement is returned as active Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ plan: 'manual' }), now);
  assert.equal(payload.isPremium, true);
  assert.equal(payload.subscription.source, 'manual');
  assert.equal(payload.subscription.isManual, true);
});

test('expired manual grant is not returned as Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ plan: 'manual', endDate: new Date('2025-12-31T23:59:59.000Z') }), now);
  assert.equal(payload.isPremium, false);
  assert.equal(payload.subscription, null);
});

test('inactive paid Subscription is not returned as Premium', () => {
  const payload = buildSubscriptionStatusPayload(entitlement({ status: 'inactive' }), now);
  assert.equal(payload.isPremium, false);
  assert.equal(payload.active, false);
});

test('status normalization preserves paid and manual expiry boundaries', () => {
  assert.equal(buildSubscriptionStatusPayload(entitlement({ endDate: now }), now).isPremium, true);
  assert.equal(buildSubscriptionStatusPayload(entitlement({ plan: 'manual', endDate: now }), now).isPremium, false);
});

test('PayPal statuses are normalized without treating buyer-action states as approved', () => {
  for (const status of ['CREATED', 'SAVED', 'PAYER_ACTION_REQUIRED']) {
    assert.equal(normalizePayPalOrderStatus(status), 'AWAITING_APPROVAL');
  }
  assert.equal(normalizePayPalOrderStatus('APPROVED'), 'APPROVED');
  assert.equal(normalizePayPalOrderStatus('COMPLETED'), 'COMPLETED');
});

test('terminal PayPal statuses do not invite further approval polling', () => {
  for (const status of ['VOIDED', 'FAILED', 'CANCELLED', 'DECLINED']) {
    assert.equal(normalizePayPalOrderStatus(status), 'TERMINAL');
  }
  assert.equal(normalizePayPalOrderStatus('unexpected'), 'UNKNOWN');
});
