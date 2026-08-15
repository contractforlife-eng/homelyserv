import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizePaidChatRelationship, canContactWorker } from './paymentAuthService.js';

const ids = {
  employer: '111111111111111111111111',
  worker: '222222222222222222222222',
  workerProfile: '333333333333333333333333',
  admin: '444444444444444444444444',
  support: '555555555555555555555555',
  hire: '666666666666666666666666'
};

const makeDb = ({ payments = [], matchingHire = true, hire = {} } = {}) => ({
  payment: {
    findMany: async () => payments.filter((payment) => payment.status == null || payment.status === 'completed')
  },
  hire: {
    findFirst: async ({ where }) => {
      if (!matchingHire) return null;
      const candidate = {
        id: ids.hire,
        employerId: ids.employer,
        workerId: ids.workerProfile,
        paymentStatus: 'completed',
        status: 'active',
        ...hire
      };
      const hireIds = where.id?.in || [];
      return hireIds.includes(candidate.id)
        && candidate.employerId === where.employerId
        && candidate.workerId === where.workerId
        && candidate.paymentStatus === where.paymentStatus
        && candidate.status === where.status
        ? { id: candidate.id }
        : null;
    }
  },
  user: {
    findUnique: async ({ where }) => ({
      [ids.employer]: { id: ids.employer, role: 'EMPLOYER' },
      [ids.worker]: { id: ids.worker, role: 'WORKER' },
      [ids.admin]: { id: ids.admin, role: 'ADMIN' },
      [ids.support]: { id: ids.support, role: 'SUPPORT' }
    }[where.id] || null)
  },
  workerProfile: {
    findUnique: async ({ where }) => {
      if (where.id === ids.workerProfile || where.userId === ids.worker) {
        return { id: ids.workerProfile, userId: ids.worker };
      }
      return null;
    }
  },
  employerProfile: {
    findUnique: async () => null
  }
});

const modernPayment = {
  status: 'completed',
  purpose: 'COMMISSION',
  hireId: ids.hire,
  userId: ids.employer,
  offerId: null,
  jobTitle: 'Cook',
  metadata: { createdFrom: 'payment-intent' },
  fulfillmentStatus: 'fulfilled'
};

const legacyPayment = {
  status: 'completed',
  purpose: null,
  hireId: null,
  userId: ids.employer,
  offerId: null,
  jobTitle: 'Cook',
  metadata: { createdFrom: 'payment-intent' }
};

test('fulfilled modern commission with matching paid active Hire unlocks contact', async () => {
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, makeDb({ payments: [modernPayment] })), true);
});

test('completed commission remains locked until fulfillment is fulfilled', async () => {
  for (const fulfillmentStatus of ['pending', 'processing', 'failed']) {
    assert.equal(await canContactWorker(
      ids.employer,
      ids.workerProfile,
      makeDb({ payments: [{ ...modernPayment, fulfillmentStatus }] })
    ), false);
  }
});

test('pending or failed financial payment remains locked', async () => {
  for (const status of ['pending', 'failed']) {
    assert.equal(await canContactWorker(
      ids.employer,
      ids.workerProfile,
      makeDb({ payments: [{ ...modernPayment, status }] })
    ), false);
  }
});

test('fulfilled commission remains locked when Hire payment or activation is incomplete', async () => {
  assert.equal(await canContactWorker(
    ids.employer,
    ids.workerProfile,
    makeDb({ payments: [modernPayment], hire: { paymentStatus: 'pending' } })
  ), false);
  assert.equal(await canContactWorker(
    ids.employer,
    ids.workerProfile,
    makeDb({ payments: [modernPayment], hire: { status: 'offer_sent' } })
  ), false);
});

test('a fulfilled commission for another relationship remains locked', async () => {
  assert.equal(await canContactWorker(
    ids.employer,
    ids.workerProfile,
    makeDb({ payments: [modernPayment], hire: { workerId: '777777777777777777777777' } })
  ), false);
  assert.equal(await canContactWorker(
    ids.employer,
    ids.workerProfile,
    makeDb({ payments: [modernPayment], hire: { employerId: '888888888888888888888888' } })
  ), false);
});

test('subscription and Premium cannot satisfy modern commission chat authorization', async () => {
  assert.equal(await canContactWorker(
    ids.employer,
    ids.workerProfile,
    makeDb({ payments: [{ ...modernPayment, purpose: 'SUBSCRIPTION' }] })
  ), false);
});

test('modern commission without a matching employer/worker Hire remains locked', async () => {
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, makeDb({ payments: [modernPayment], matchingHire: false })), false);
});

test('narrow historical contact payment remains grandfathered', async () => {
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, makeDb({ payments: [legacyPayment] })), true);
});

test('subscription or unrelated legacy-shaped payment cannot unlock contact', async () => {
  const db = makeDb({
    payments: [
      { ...legacyPayment, purpose: 'SUBSCRIPTION' },
      { ...legacyPayment, metadata: {}, jobTitle: null }
    ]
  });
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, db), false);
});

test('unpaid Employer/Worker relationship is blocked bidirectionally', async () => {
  const db = makeDb();
  const employerSend = await authorizePaidChatRelationship({
    senderId: ids.employer,
    senderRole: 'EMPLOYER',
    recipientId: ids.worker
  }, db);
  const workerSend = await authorizePaidChatRelationship({
    senderId: ids.worker,
    senderRole: 'WORKER',
    recipientId: ids.employer
  }, db);
  assert.deepEqual(employerSend, { required: true, allowed: false });
  assert.deepEqual(workerSend, { required: true, allowed: false });
});

test('paid Employer/Worker relationship is allowed bidirectionally', async () => {
  const db = makeDb({ payments: [modernPayment] });
  const employerSend = await authorizePaidChatRelationship({
    senderId: ids.employer,
    senderRole: 'EMPLOYER',
    recipientId: ids.worker
  }, db);
  const workerSend = await authorizePaidChatRelationship({
    senderId: ids.worker,
    senderRole: 'WORKER',
    recipientId: ids.employer
  }, db);
  assert.deepEqual(employerSend, { required: true, allowed: true });
  assert.deepEqual(workerSend, { required: true, allowed: true });
});

test('a failed fulfillment can unlock after the same payment is retried successfully', async () => {
  const failed = makeDb({ payments: [{ ...modernPayment, fulfillmentStatus: 'failed' }] });
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, failed), false);

  const retried = makeDb({ payments: [{ ...modernPayment, fulfillmentStatus: 'fulfilled' }] });
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, retried), true);
});

test('Admin and Support sends remain exempt', async () => {
  const db = makeDb();
  assert.deepEqual(await authorizePaidChatRelationship({
    senderId: ids.admin,
    senderRole: 'ADMIN',
    recipientId: ids.worker
  }, db), { required: false, allowed: true });
  assert.deepEqual(await authorizePaidChatRelationship({
    senderId: ids.support,
    senderRole: 'SUPPORT',
    recipientId: ids.worker
  }, db), { required: false, allowed: true });
  assert.deepEqual(await authorizePaidChatRelationship({
    senderId: ids.employer,
    senderRole: 'EMPLOYER',
    recipientId: ids.support
  }, db), { required: false, allowed: true });
});
