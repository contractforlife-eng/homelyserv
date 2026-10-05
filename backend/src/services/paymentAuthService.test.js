import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizePaidChatRelationship, canContactWorker, resolveUserParty } from './paymentAuthService.js';

const ids = {
  employer: '111111111111111111111111',
  worker: '222222222222222222222222',
  workerProfile: '333333333333333333333333',
  admin: '444444444444444444444444',
  support: '555555555555555555555555',
  hire: '666666666666666666666666',
  teacher: '777777777777777777777777',
  doctor: '888888888888888888888888',
  patient: '999999999999999999999999'
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
      [ids.support]: { id: ids.support, role: 'SUPPORT' },
      [ids.teacher]: { id: ids.teacher, role: 'TEACHER' },
      [ids.doctor]: { id: ids.doctor, role: 'DOCTOR' },
      [ids.patient]: { id: ids.patient, role: 'PATIENT' }
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

test('profile identifiers resolve to canonical User identifiers for peer targeting', async () => {
  const db = makeDb();
  assert.deepEqual(await resolveUserParty(ids.workerProfile, db), {
    userId: ids.worker,
    role: 'WORKER',
    profileId: ids.workerProfile,
  });
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

test('TEACHER and DOCTOR to WORKER requires paid commission and is denied without it', async () => {
  const db = makeDb(); // No payments
  const teacherSend = await authorizePaidChatRelationship({
    senderId: ids.teacher,
    senderRole: 'TEACHER',
    recipientId: ids.worker
  }, db);
  const doctorSend = await authorizePaidChatRelationship({
    senderId: ids.doctor,
    senderRole: 'DOCTOR',
    recipientId: ids.worker
  }, db);

  assert.deepEqual(teacherSend, { required: true, allowed: false });
  assert.deepEqual(doctorSend, { required: true, allowed: false });
});

test('TEACHER and DOCTOR to WORKER is allowed after valid paid commission', async () => {
  const teacherPayment = { ...modernPayment, userId: ids.teacher };
  const teacherDb = makeDb({
    payments: [teacherPayment],
    hire: { employerId: ids.teacher, workerId: ids.workerProfile }
  });
  // Custom hire findFirst matching teacher
  teacherDb.hire.findFirst = async ({ where }) => {
    if (where.employerId === ids.teacher && where.workerId === ids.workerProfile && where.status === 'active' && where.paymentStatus === 'completed') {
      return { id: ids.hire };
    }
    return null;
  };
  teacherDb.payment.findMany = async () => [teacherPayment];

  const teacherSend = await authorizePaidChatRelationship({
    senderId: ids.teacher,
    senderRole: 'TEACHER',
    recipientId: ids.worker
  }, teacherDb);
  assert.deepEqual(teacherSend, { required: true, allowed: true });

  const doctorPayment = { ...modernPayment, userId: ids.doctor };
  const doctorDb = makeDb({
    payments: [doctorPayment],
    hire: { employerId: ids.doctor, workerId: ids.workerProfile }
  });
  doctorDb.hire.findFirst = async ({ where }) => {
    if (where.employerId === ids.doctor && where.workerId === ids.workerProfile && where.status === 'active' && where.paymentStatus === 'completed') {
      return { id: ids.hire };
    }
    return null;
  };
  doctorDb.payment.findMany = async () => [doctorPayment];

  const doctorSend = await authorizePaidChatRelationship({
    senderId: ids.doctor,
    senderRole: 'DOCTOR',
    recipientId: ids.worker
  }, doctorDb);
  assert.deepEqual(doctorSend, { required: true, allowed: true });
});

test('TEACHER to WORKER remains locked when commission belongs to another professional or worker', async () => {
  // Payment belongs to employer, not teacher
  const foreignDb = makeDb({ payments: [modernPayment] });
  const teacherSendWrongOwner = await authorizePaidChatRelationship({
    senderId: ids.teacher,
    senderRole: 'TEACHER',
    recipientId: ids.worker
  }, foreignDb);
  assert.deepEqual(teacherSendWrongOwner, { required: true, allowed: false });

  // Payment belongs to teacher, but Hire is inactive
  const inactiveDb = makeDb({
    payments: [{ ...modernPayment, userId: ids.teacher }],
    matchingHire: false
  });
  const teacherSendInactiveHire = await authorizePaidChatRelationship({
    senderId: ids.teacher,
    senderRole: 'TEACHER',
    recipientId: ids.worker
  }, inactiveDb);
  assert.deepEqual(teacherSendInactiveHire, { required: true, allowed: false });
});

test('TEACHER and DOCTOR to staff remains exempt and allowed', async () => {
  const db = makeDb();
  const teacherToAdmin = await authorizePaidChatRelationship({
    senderId: ids.teacher,
    senderRole: 'TEACHER',
    recipientId: ids.admin
  }, db);
  const doctorToSupport = await authorizePaidChatRelationship({
    senderId: ids.doctor,
    senderRole: 'DOCTOR',
    recipientId: ids.support
  }, db);

  assert.deepEqual(teacherToAdmin, { required: false, allowed: true });
  assert.deepEqual(doctorToSupport, { required: false, allowed: true });
});

