import test from 'node:test';
import assert from 'node:assert/strict';
import { addRequiredAction, getApplicationRequiredActions } from '../controllers/applicationController.js';
import { reconcilePendingActionNotifications } from '../services/actionNotificationReconciliationService.js';
import prisma from '../lib/prisma.js';
import PushOutbox from '../models/PushOutbox.js';
import User from '../models/User.js';
import crypto from 'crypto';

const VALID_APP_ID = '507f1f77bcf86cd799439011';
const VALID_WORKER_ID = '507f1f77bcf86cd799439012';
const VALID_JOB_ID = '507f1f77bcf86cd799439013';
const VALID_EMPLOYER_ID = '507f1f77bcf86cd799439014';
const OTHER_EMPLOYER_ID = '507f1f77bcf86cd799439015';

// Mock User.findById to avoid Mongoose buffering queries in isolated test environment
User.findById = () => ({
  select: async () => ({ settings: { notifications: true } }),
});

test('addRequiredAction validates required title and instructions', async () => {
  const req = {
    params: { id: VALID_APP_ID },
    body: { title: '', instructions: '' },
    userId: VALID_EMPLOYER_ID,
    userRole: 'EMPLOYER',
  };
  let status = 0;
  let jsonResult = null;
  const res = {
    status(s) { status = s; return this; },
    json(j) { jsonResult = j; return this; },
  };

  await addRequiredAction(req, res);
  assert.equal(status, 400);
  assert.equal(jsonResult.success, false);
  assert.match(jsonResult.message, /Action title is required/i);
});

test('addRequiredAction validates appointment fields require date, time and timezone together', async () => {
  const req = {
    params: { id: VALID_APP_ID },
    body: {
      title: 'Medical checkup',
      instructions: 'Please visit clinic',
      appointmentDate: '2026-12-01',
    },
    userId: VALID_EMPLOYER_ID,
    userRole: 'EMPLOYER',
  };
  let status = 0;
  let jsonResult = null;
  const res = {
    status(s) { status = s; return this; },
    json(j) { jsonResult = j; return this; },
  };

  await addRequiredAction(req, res);
  assert.equal(status, 400);
  assert.equal(jsonResult.success, false);
  assert.match(jsonResult.message, /timezone are all required/i);
});

test('addRequiredAction validates invalid IANA timezone', async () => {
  const req = {
    params: { id: VALID_APP_ID },
    body: {
      title: 'Medical checkup',
      instructions: 'Please visit clinic',
      appointmentDate: '2026-12-01',
      appointmentTime: '10:00',
      timeZone: 'Invalid/NonExistent_Zone',
    },
    userId: VALID_EMPLOYER_ID,
    userRole: 'EMPLOYER',
  };
  let status = 0;
  let jsonResult = null;
  const res = {
    status(s) { status = s; return this; },
    json(j) { jsonResult = j; return this; },
  };

  await addRequiredAction(req, res);
  assert.equal(status, 400);
  assert.equal(jsonResult.success, false);
  assert.match(jsonResult.message, /IANA time zone/i);
});

test('addRequiredAction enforces employer ownership against stored job and application relationship', async () => {
  const origFindUnique = prisma.jobApplication.findUnique;
  const origJobPostFind = prisma.jobPost.findUnique;

  prisma.jobApplication.findUnique = async () => ({
    id: VALID_APP_ID,
    employerId: VALID_EMPLOYER_ID,
    workerId: VALID_WORKER_ID,
    jobPostId: VALID_JOB_ID,
    status: 'applied',
  });
  prisma.jobPost.findUnique = async () => ({
    id: VALID_JOB_ID,
    employerId: VALID_EMPLOYER_ID,
    jobTitle: 'Senior Caregiver',
  });

  try {
    const req = {
      params: { id: VALID_APP_ID },
      body: {
        title: 'Skills test',
        instructions: 'Take coding test',
      },
      userId: OTHER_EMPLOYER_ID, // Unauthorized employer
      userRole: 'EMPLOYER',
    };
    let status = 0;
    let jsonResult = null;
    const res = {
      status(s) { status = s; return this; },
      json(j) { jsonResult = j; return this; },
    };

    await addRequiredAction(req, res);
    assert.equal(status, 403);
    assert.equal(jsonResult.success, false);
    assert.match(jsonResult.message, /Access denied/i);
  } finally {
    prisma.jobApplication.findUnique = origFindUnique;
    prisma.jobPost.findUnique = origJobPostFind;
  }
});

test('getApplicationRequiredActions enforces authorization', async () => {
  const origFindUnique = prisma.jobApplication.findUnique;
  prisma.jobApplication.findUnique = async () => ({
    id: VALID_APP_ID,
    employerId: VALID_EMPLOYER_ID,
    workerId: VALID_WORKER_ID,
  });

  try {
    const req = {
      params: { id: VALID_APP_ID },
      userId: '507f1f77bcf86cd799439099',
      userRole: 'WORKER',
    };
    let status = 0;
    let jsonResult = null;
    const res = {
      status(s) { status = s; return this; },
      json(j) { jsonResult = j; return this; },
    };

    await getApplicationRequiredActions(req, res);
    assert.equal(status, 403);
    assert.equal(jsonResult.success, false);
    assert.match(jsonResult.message, /Access denied/i);
  } finally {
    prisma.jobApplication.findUnique = origFindUnique;
  }
});

test('addRequiredAction persists action without modifying application status', async () => {
  const origFindUnique = prisma.jobApplication.findUnique;
  const origJobPostFind = prisma.jobPost.findUnique;
  const origRunCommandRaw = prisma.$runCommandRaw;
  const origNotificationCreate = prisma.notification.create;
  const origPushOutboxFindOneAndUpdate = PushOutbox.findOneAndUpdate;

  let rawCommands = [];
  let pushOutboxEnqueued = [];
  prisma.notification.create = async ({ data }) => ({ id: 'notif_123', ...data });
  PushOutbox.findOneAndUpdate = async (filter, update) => {
    pushOutboxEnqueued.push({ filter, update });
    return { notificationId: filter.notificationId };
  };

  prisma.jobApplication.findUnique = async () => ({
    id: VALID_APP_ID,
    employerId: VALID_EMPLOYER_ID,
    workerId: VALID_WORKER_ID,
    jobPostId: VALID_JOB_ID,
    status: 'shortlisted', // e.g. interview scheduled
  });
  prisma.jobPost.findUnique = async () => ({
    id: VALID_JOB_ID,
    employerId: VALID_EMPLOYER_ID,
    jobTitle: 'Senior Caregiver',
  });
  prisma.$runCommandRaw = async (cmd) => {
    rawCommands.push(cmd);
    if (cmd.find === 'job_applications') {
      return { cursor: { firstBatch: [{ _id: VALID_APP_ID, requiredActions: [] }] } };
    }
    if (cmd.findAndModify === 'job_applications') {
      return { ok: 1, value: { _id: VALID_APP_ID, requiredActions: [cmd.update.$push.requiredActions] } };
    }
    return { ok: 1 };
  };

  try {
    const req = {
      params: { id: VALID_APP_ID },
      body: {
        title: 'Attend Medical Examination',
        instructions: 'Visit Al-Nour Medical Lab before Thursday.',
        organizationName: 'Al-Nour Lab',
        address: '15 El-Gomhoureya St, Cairo',
        appointmentDate: '2026-11-20',
        appointmentTime: '09:30',
        timeZone: 'Africa/Cairo',
      },
      userId: VALID_EMPLOYER_ID,
      userRole: 'EMPLOYER',
    };
    let status = 0;
    let jsonResult = null;
    const res = {
      status(s) { status = s; return this; },
      json(j) { jsonResult = j; return this; },
    };

    await addRequiredAction(req, res);
    assert.equal(status, 201);
    assert.equal(jsonResult.success, true);
    assert.equal(jsonResult.action.title, 'Attend Medical Examination');
    assert.equal(jsonResult.action.organizationName, 'Al-Nour Lab');

    // Confirm that findAndModify executed atomic conditional query and NOT $set status
    const pushCmd = rawCommands.find(c => c.findAndModify === 'job_applications');
    assert.ok(pushCmd);
    assert.ok(pushCmd.update.$push);
    assert.equal(pushCmd.update.$push.requiredActions.title, 'Attend Medical Examination');
    assert.equal(pushCmd.update.$set, undefined); // Status was NOT modified

    // Confirm that push outbox was enqueued and notificationHandedOff was set to true
    assert.equal(pushOutboxEnqueued.length, 1);
    const updateCmd = rawCommands.find(c => c.update === 'job_applications');
    assert.ok(updateCmd);
    assert.equal(updateCmd.updates[0].u.$set['requiredActions.$.notificationHandedOff'], true);
  } finally {
    prisma.jobApplication.findUnique = origFindUnique;
    prisma.jobPost.findUnique = origJobPostFind;
    prisma.$runCommandRaw = origRunCommandRaw;
    prisma.notification.create = origNotificationCreate;
    PushOutbox.findOneAndUpdate = origPushOutboxFindOneAndUpdate;
  }
});

test('addRequiredAction rejects key reuse with different action content (409 Conflict)', async () => {
  const origFindUnique = prisma.jobApplication.findUnique;
  const origJobPostFind = prisma.jobPost.findUnique;
  const origRunCommandRaw = prisma.$runCommandRaw;

  const existingContentHash = 'original_hash_123';
  const existingAction = {
    id: 'act_existing_123',
    title: 'Original Title',
    instructions: 'Original instructions',
    idempotencyKey: 'idem_key_abc',
    contentHash: existingContentHash,
    createdAt: '2026-11-03T12:00:00.000Z',
    createdBy: VALID_EMPLOYER_ID,
  };

  prisma.jobApplication.findUnique = async () => ({
    id: VALID_APP_ID,
    employerId: VALID_EMPLOYER_ID,
    workerId: VALID_WORKER_ID,
    jobPostId: VALID_JOB_ID,
    status: 'applied',
  });
  prisma.jobPost.findUnique = async () => ({
    id: VALID_JOB_ID,
    employerId: VALID_EMPLOYER_ID,
    jobTitle: 'Senior Caregiver',
  });
  prisma.$runCommandRaw = async (cmd) => {
    if (cmd.find === 'job_applications') {
      return { cursor: { firstBatch: [{ _id: VALID_APP_ID, requiredActions: [existingAction] }] } };
    }
    return { ok: 1 };
  };

  try {
    const req = {
      params: { id: VALID_APP_ID },
      body: {
        title: 'Tampered Different Title', // Different content!
        instructions: 'Different instructions',
        idempotencyKey: 'idem_key_abc',
      },
      userId: VALID_EMPLOYER_ID,
      userRole: 'EMPLOYER',
    };
    let status = 0;
    let jsonResult = null;
    const res = {
      status(s) { status = s; return this; },
      json(j) { jsonResult = j; return this; },
    };

    await addRequiredAction(req, res);
    assert.equal(status, 409);
    assert.equal(jsonResult.success, false);
    assert.match(jsonResult.message, /different action content/i);
  } finally {
    prisma.jobApplication.findUnique = origFindUnique;
    prisma.jobPost.findUnique = origJobPostFind;
    prisma.$runCommandRaw = origRunCommandRaw;
  }
});

test('addRequiredAction supports identical retried idempotencyKey returning 200 without duplicate', async () => {
  const origFindUnique = prisma.jobApplication.findUnique;
  const origJobPostFind = prisma.jobPost.findUnique;
  const origRunCommandRaw = prisma.$runCommandRaw;

  const contentPayload = {
    title: 'Attend Medical Examination',
    instructions: 'Visit Al-Nour Medical Lab',
    organizationName: null,
    address: null,
    appointmentDate: null,
    appointmentTime: null,
    timeZone: null,
  };
  const contentHash = crypto.createHash('sha256').update(JSON.stringify(contentPayload)).digest('hex').slice(0, 32);

  const existingAction = {
    id: 'act_existing_123',
    title: 'Attend Medical Examination',
    instructions: 'Visit Al-Nour Medical Lab',
    idempotencyKey: 'idem_key_exact_match',
    contentHash,
    createdAt: '2026-11-03T12:00:00.000Z',
    createdBy: VALID_EMPLOYER_ID,
  };

  prisma.jobApplication.findUnique = async () => ({
    id: VALID_APP_ID,
    employerId: VALID_EMPLOYER_ID,
    workerId: VALID_WORKER_ID,
    jobPostId: VALID_JOB_ID,
    status: 'applied',
  });
  prisma.jobPost.findUnique = async () => ({
    id: VALID_JOB_ID,
    employerId: VALID_EMPLOYER_ID,
    jobTitle: 'Senior Caregiver',
  });
  prisma.$runCommandRaw = async (cmd) => {
    if (cmd.find === 'job_applications') {
      return { cursor: { firstBatch: [{ _id: VALID_APP_ID, requiredActions: [existingAction] }] } };
    }
    return { ok: 1 };
  };

  try {
    const req = {
      params: { id: VALID_APP_ID },
      body: {
        title: 'Attend Medical Examination',
        instructions: 'Visit Al-Nour Medical Lab',
        idempotencyKey: 'idem_key_exact_match',
      },
      userId: VALID_EMPLOYER_ID,
      userRole: 'EMPLOYER',
    };
    let status = 0;
    let jsonResult = null;
    const res = {
      status(s) { status = s; return this; },
      json(j) { jsonResult = j; return this; },
    };

    await addRequiredAction(req, res);
    assert.equal(status, 200);
    assert.equal(jsonResult.success, true);
    assert.equal(jsonResult.action.id, 'act_existing_123');
    assert.equal(jsonResult.requiredActions.length, 1);
  } finally {
    prisma.jobApplication.findUnique = origFindUnique;
    prisma.jobPost.findUnique = origJobPostFind;
    prisma.$runCommandRaw = origRunCommandRaw;
  }
});

test('Notification failure recovery: actionNotificationReconciliationWorker recovers unhanded-off actions', async () => {
  const unhandedOffAction = {
    id: 'act_unhanded_123',
    title: 'Attend Lab Test',
    instructions: 'Go to lab',
    notificationHandedOff: false,
    createdAt: new Date().toISOString(),
  };

  let createdNotifications = [];
  const mockCreateNotif = async (userId, payload) => {
    const notif = { id: 'notif_recovered_999', userId, ...payload };
    createdNotifications.push(notif);
    return notif;
  };

  let outboxEnqueued = [];
  const mockEnqueuePushOutbox = async (userId, notification) => {
    outboxEnqueued.push({ userId, notificationId: notification.id });
    return { id: 'outbox_recovered' };
  };

  let updateCommands = [];
  const mockPrisma = {
    $runCommandRaw: async (cmd) => {
      if (cmd.find === 'job_applications') {
        return {
          cursor: {
            firstBatch: [
              {
                _id: VALID_APP_ID,
                workerId: VALID_WORKER_ID,
                jobPostId: VALID_JOB_ID,
                requiredActions: [unhandedOffAction],
              },
            ],
          },
        };
      }
      if (cmd.update === 'job_applications') {
        updateCommands.push(cmd);
        return { ok: 1 };
      }
      return { ok: 1 };
    },
    jobPost: {
      findUnique: async () => ({ id: VALID_JOB_ID, jobTitle: 'Senior Caregiver' }),
    },
  };

  const result = await reconcilePendingActionNotifications({
    prisma: mockPrisma,
    createNotification: mockCreateNotif,
    enqueuePushOutbox: mockEnqueuePushOutbox,
  });

  assert.equal(result.checked, 1);
  assert.equal(result.recovered, 1);
  assert.equal(createdNotifications.length, 1);
  assert.equal(createdNotifications[0].entityType, 'JOB_APPLICATION');
  assert.equal(createdNotifications[0].entityId, VALID_APP_ID);

  // Confirmed that outbox was enqueued and update marked notificationHandedOff: true
  assert.equal(outboxEnqueued.length, 1);
  assert.equal(outboxEnqueued[0].notificationId, 'notif_recovered_999');
  assert.equal(updateCommands.length, 1);
  const updatePayload = updateCommands[0].updates[0];
  assert.equal(updatePayload.u.$set['requiredActions.$.notificationHandedOff'], true);
  assert.equal(updatePayload.u.$set['requiredActions.$.notificationId'], 'notif_recovered_999');
});

test('Deduplication: Process interruption after bell persistence but before action flag update', async () => {
  const origPushOutboxFindOneAndUpdate = PushOutbox.findOneAndUpdate;
  PushOutbox.findOneAndUpdate = async () => {
    throw new Error('PushOutbox.findOneAndUpdate should not be called when enqueuePushOutbox is injected');
  };
  // Scenario:
  // Step 1: Bell notification is already persisted with eventKey = `job_app_action:${VALID_APP_ID}:${actionId}`.
  // Step 2: The process was interrupted before notificationHandedOff was set on the action.
  // Step 3: Reconciliation runs. It MUST resolve to the exact SAME notification ID and NOT insert a duplicate bell notification.
  const actionId = 'act_interrupted_101';
  const eventKey = `job_app_action:${VALID_APP_ID}:${actionId}`;
  const existingNotifId = '507f1f77bcf86cd799439999';

  let bellStore = [
    {
      _id: { $oid: existingNotifId },
      userId: { $oid: VALID_WORKER_ID },
      eventKey,
      title: 'Action Required for Job Application',
      message: 'New required action for your job application',
    },
  ];

  let outboxEnqueued = [];
  const mockEnqueuePushOutbox = async (userId, notification) => {
    outboxEnqueued.push({ userId, notificationId: notification.id });
    return { id: 'outbox_1' };
  };

  const actionDoc = {
    id: actionId,
    title: 'Attend Lab Test',
    instructions: 'Go to lab for blood test',
    notificationHandedOff: false,
    createdAt: new Date().toISOString(),
  };

  let updateCommands = [];
  const mockPrisma = {
    $runCommandRaw: async (cmd) => {
      if (cmd.find === 'job_applications') {
        return {
          cursor: {
            firstBatch: [
              {
                _id: VALID_APP_ID,
                workerId: VALID_WORKER_ID,
                jobPostId: VALID_JOB_ID,
                requiredActions: [actionDoc],
              },
            ],
          },
        };
      }
      if (cmd.findAndModify === 'Notification') {
        const found = bellStore.find((n) => n.eventKey === cmd.query.eventKey);
        if (found) {
          return { value: found };
        }
        const newDoc = {
          _id: { $oid: 'new_notif_' + Date.now() },
          ...cmd.update.$setOnInsert,
        };
        bellStore.push(newDoc);
        return { value: newDoc };
      }
      if (cmd.update === 'job_applications') {
        updateCommands.push(cmd);
        return { ok: 1 };
      }
      return { ok: 1 };
    },
    jobPost: {
      findUnique: async () => ({ id: VALID_JOB_ID, jobTitle: 'Senior Caregiver' }),
    },
  };

  const origPrisma = prisma.$runCommandRaw;
  try {
    prisma.$runCommandRaw = mockPrisma.$runCommandRaw;

    const result = await reconcilePendingActionNotifications({
      prisma: mockPrisma,
      enqueuePushOutbox: mockEnqueuePushOutbox,
    });

    assert.equal(result.checked, 1);
    assert.equal(result.recovered, 1);
    // Bell notification store must still have only 1 notification (no duplicates created)
    assert.equal(bellStore.length, 1);
    assert.equal(bellStore[0]._id.$oid, existingNotifId);

    // Handoff updated the action with the existing notification ID
    assert.equal(updateCommands.length, 1);
    const updatePayload = updateCommands[0].updates[0];
    assert.equal(updatePayload.u.$set['requiredActions.$.notificationHandedOff'], true);
    assert.equal(updatePayload.u.$set['requiredActions.$.notificationId'], existingNotifId);

    // Outbox entry was confirmed for that same notification ID
    assert.equal(outboxEnqueued.length, 1);
    assert.equal(outboxEnqueued[0].notificationId, existingNotifId);
  } finally {
    prisma.$runCommandRaw = origPrisma;
    PushOutbox.findOneAndUpdate = origPushOutboxFindOneAndUpdate;
  }
});

test('Deduplication: Two reconciliation workers processing the same action concurrently', async () => {
  const origPushOutboxFindOneAndUpdate = PushOutbox.findOneAndUpdate;
  PushOutbox.findOneAndUpdate = async () => {
    throw new Error('PushOutbox.findOneAndUpdate should not be called when enqueuePushOutbox is injected');
  };
  // Scenario:
  // Two reconciliation workers (Worker A and Worker B) pick up the unhanded-off action at the same time.
  // Both call createNotification concurrently using the stable eventKey.
  // Both resolve to the exact same notification ID, and exactly one logical bell notification exists.
  const actionId = 'act_concurrent_202';
  const eventKey = `job_app_action:${VALID_APP_ID}:${actionId}`;

  let bellStore = [];
  let outboxEnqueued = [];

  const mockPrisma = {
    $runCommandRaw: async (cmd) => {
      if (cmd.find === 'job_applications') {
        return {
          cursor: {
            firstBatch: [
              {
                _id: VALID_APP_ID,
                workerId: VALID_WORKER_ID,
                jobPostId: VALID_JOB_ID,
                requiredActions: [
                  {
                    id: actionId,
                    title: 'Background Verification',
                    instructions: 'Submit Police Certificate',
                    notificationHandedOff: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            ],
          },
        };
      }
      if (cmd.findAndModify === 'Notification') {
        // Atomic simulation: only one can insert
        const found = bellStore.find((n) => n.eventKey === cmd.query.eventKey);
        if (found) {
          return { value: found };
        }
        const created = {
          _id: { $oid: 'notif_concurrent_winner_777' },
          ...cmd.update.$setOnInsert,
        };
        bellStore.push(created);
        return { value: created };
      }
      if (cmd.update === 'job_applications') {
        return { ok: 1 };
      }
      return { ok: 1 };
    },
    jobPost: {
      findUnique: async () => ({ id: VALID_JOB_ID, jobTitle: 'Nurse Assistant' }),
    },
  };

  const mockEnqueue = async (userId, notif) => {
    outboxEnqueued.push({ userId, notificationId: notif.id });
    return { id: 'outbox_entry' };
  };

  const origPrisma = prisma.$runCommandRaw;
  try {
    prisma.$runCommandRaw = mockPrisma.$runCommandRaw;

    // Run both workers concurrently
    const [resultA, resultB] = await Promise.all([
      reconcilePendingActionNotifications({ prisma: mockPrisma, enqueuePushOutbox: mockEnqueue }),
      reconcilePendingActionNotifications({ prisma: mockPrisma, enqueuePushOutbox: mockEnqueue }),
    ]);

    // Exactly one bell notification in database
    assert.equal(bellStore.length, 1);
    assert.equal(bellStore[0]._id.$oid, 'notif_concurrent_winner_777');

    // Both workers resolved to the identical notification ID
    assert.equal(outboxEnqueued.length, 2);
    assert.equal(outboxEnqueued[0].notificationId, 'notif_concurrent_winner_777');
    assert.equal(outboxEnqueued[1].notificationId, 'notif_concurrent_winner_777');
  } finally {
    prisma.$runCommandRaw = origPrisma;
    PushOutbox.findOneAndUpdate = origPushOutboxFindOneAndUpdate;
  }
});

test('Deduplication: Bell persistence followed by outbox enqueue failure and successful retry', async () => {
  const origPushOutboxFindOneAndUpdate = PushOutbox.findOneAndUpdate;
  PushOutbox.findOneAndUpdate = async () => {
    throw new Error('PushOutbox.findOneAndUpdate should not be called when enqueuePushOutbox is injected');
  };
  // Scenario:
  // Pass 1: Bell notification is created successfully, but PushOutbox enqueue throws an error.
  // Pass 1 MUST NOT mark notificationHandedOff: true on the action.
  // Pass 2 (Retry): Re-runs. Resolves the existing bell notification via eventKey, succeeds in enqueuing PushOutbox,
  // and marks notificationHandedOff: true.
  const actionId = 'act_push_fail_303';
  const eventKey = `job_app_action:${VALID_APP_ID}:${actionId}`;
  const persistentNotifId = '507f1f77bcf86cd799438888';

  let bellStore = [];
  let updateCommands = [];
  let pushAttempts = 0;
  let outboxStore = [];

  const mockPrisma = {
    $runCommandRaw: async (cmd) => {
      if (cmd.find === 'job_applications') {
        return {
          cursor: {
            firstBatch: [
              {
                _id: VALID_APP_ID,
                workerId: VALID_WORKER_ID,
                jobPostId: VALID_JOB_ID,
                requiredActions: [
                  {
                    id: actionId,
                    title: 'Safety Training',
                    instructions: 'Complete online training module',
                    notificationHandedOff: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            ],
          },
        };
      }
      if (cmd.findAndModify === 'Notification') {
        const found = bellStore.find((n) => n.eventKey === cmd.query.eventKey);
        if (found) {
          return { value: found };
        }
        const created = {
          _id: { $oid: persistentNotifId },
          ...cmd.update.$setOnInsert,
        };
        bellStore.push(created);
        return { value: created };
      }
      if (cmd.update === 'job_applications') {
        updateCommands.push(cmd);
        return { ok: 1 };
      }
      return { ok: 1 };
    },
    jobPost: {
      findUnique: async () => ({ id: VALID_JOB_ID, jobTitle: 'Safety Officer' }),
    },
  };

  const flakingEnqueue = async (userId, notif) => {
    pushAttempts++;
    if (pushAttempts === 1) {
      throw new Error('Simulated transient push outbox connection failure');
    }
    outboxStore.push({ userId, notificationId: notif.id });
    return { id: 'outbox_created' };
  };

  const origPrisma = prisma.$runCommandRaw;
  try {
    prisma.$runCommandRaw = mockPrisma.$runCommandRaw;

    // Pass 1: fails outbox enqueue
    const result1 = await reconcilePendingActionNotifications({
      prisma: mockPrisma,
      enqueuePushOutbox: flakingEnqueue,
    });

    assert.equal(result1.recovered, 0); // Not marked recovered because outbox failed
    assert.equal(updateCommands.length, 0); // Action notificationHandedOff was NOT set to true
    assert.equal(bellStore.length, 1); // Bell notification WAS created
    assert.equal(outboxStore.length, 0);

    // Pass 2: Retry succeeds
    const result2 = await reconcilePendingActionNotifications({
      prisma: mockPrisma,
      enqueuePushOutbox: flakingEnqueue,
    });

    assert.equal(result2.recovered, 1);
    assert.equal(bellStore.length, 1); // Still exactly ONE bell notification
    assert.equal(outboxStore.length, 1); // Outbox entry created for identical notification ID
    assert.equal(outboxStore[0].notificationId, persistentNotifId);
    assert.equal(updateCommands.length, 1);
    assert.equal(updateCommands[0].updates[0].u.$set['requiredActions.$.notificationHandedOff'], true);
    assert.equal(updateCommands[0].updates[0].u.$set['requiredActions.$.notificationId'], persistentNotifId);
  } finally {
    prisma.$runCommandRaw = origPrisma;
    PushOutbox.findOneAndUpdate = origPushOutboxFindOneAndUpdate;
  }
});
