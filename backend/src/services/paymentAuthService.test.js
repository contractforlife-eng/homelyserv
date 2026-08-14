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

const makeDb = ({ payments = [], matchingHire = true } = {}) => ({
  payment: {
    findMany: async () => payments
  },
  hire: {
    findFirst: async () => matchingHire ? { id: ids.hire } : null
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
  purpose: 'COMMISSION',
  hireId: ids.hire,
  userId: ids.employer,
  offerId: null,
  jobTitle: 'Cook',
  metadata: { createdFrom: 'payment-intent' }
};

const legacyPayment = {
  purpose: null,
  hireId: null,
  userId: ids.employer,
  offerId: null,
  jobTitle: 'Cook',
  metadata: { createdFrom: 'payment-intent' }
};

test('modern completed commission with matching Hire unlocks contact without requiring fulfillment', async () => {
  assert.equal(await canContactWorker(ids.employer, ids.workerProfile, makeDb({ payments: [modernPayment] })), true);
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
