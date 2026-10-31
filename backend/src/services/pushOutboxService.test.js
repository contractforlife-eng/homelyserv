import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveChannelForNotification,
  sanitizePreviewContent,
  sanitizeData,
  reconcileOrphanedNotifications,
} from './pushOutboxService.js';
import { parseServiceAccount } from './fcmInit.js';

test('Channel mapping routes all notification categories correctly', () => {
  assert.equal(resolveChannelForNotification('NEW_MESSAGE', 'MESSAGE'), 'messages');
  assert.equal(resolveChannelForNotification('SYSTEM', 'MESSAGE'), 'messages');
  assert.equal(resolveChannelForNotification('NEW_HIRE', 'OFFER'), 'jobs_offers');
  assert.equal(resolveChannelForNotification('HIRE_ACCEPTED', 'OFFER'), 'jobs_offers');
  assert.equal(resolveChannelForNotification('SYSTEM', 'JOB_APPLICATION'), 'jobs_offers');
  assert.equal(resolveChannelForNotification('SYSTEM', 'HIRE'), 'hire');
  assert.equal(resolveChannelForNotification('HIRE_STATUS_UPDATE', 'HIRE'), 'hire');
  assert.equal(resolveChannelForNotification('PAYMENT_SUCCESS', 'PAYMENT'), 'payments');
  assert.equal(resolveChannelForNotification('ADMIN_PAYMENT_REVIEW_REQUIRED', 'PAYMENT'), 'payments');
  assert.equal(resolveChannelForNotification('APPOINTMENT_REQUESTED', null), 'system');
  assert.equal(resolveChannelForNotification('COMPLAINT_ASSIGNED', 'COMPLAINT'), 'system');
  assert.equal(resolveChannelForNotification('UNKNOWN', null), 'system');
});

test('Sanitizes lockscreen preview for sensitive chats and medical appointments', () => {
  const chatPreview = sanitizePreviewContent('New message from Alice', 'Can you meet at my home tonight?', 'NEW_MESSAGE');
  assert.equal(chatPreview.safeTitle, 'New message from Alice');
  assert.equal(chatPreview.safeBody, 'You have a new message on HomelyServ');

  const apptPreview = sanitizePreviewContent('Doctor Appointment', 'Dr. Smith confirmed consultation for Diabetes management', 'APPOINTMENT_CONFIRMED');
  assert.equal(apptPreview.safeBody, 'Your appointment has been confirmed');

  const reqPreview = sanitizePreviewContent('Appointment Request', 'Patient requested appointment for cardiac checkup', 'APPOINTMENT_REQUESTED');
  assert.equal(reqPreview.safeBody, 'New appointment request received');

  const normalPreview = sanitizePreviewContent('Job Application', 'John applied to your job posting', 'SYSTEM');
  assert.equal(normalPreview.safeBody, 'John applied to your job posting');
});

test('Sanitizes string and numerical data payloads cleanly without crashes', () => {
  const raw = {
    notificationId: 'notif-123',
    count: 42,
    active: true,
    nested: { object: 'should be dropped' },
    nullVal: null,
    undefinedVal: undefined,
  };
  const sanitized = sanitizeData(raw);
  assert.equal(sanitized.notificationId, 'notif-123');
  assert.equal(sanitized.count, '42');
  assert.equal(sanitized.active, 'true');
  assert.equal(sanitized.nested, undefined);
  assert.equal(sanitized.nullVal, undefined);
});

test('parseServiceAccount parses both raw JSON and Base64-encoded credentials', () => {
  const validObj = {
    type: 'service_account',
    project_id: 'homelyserv-prod',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n',
  };

  // 1. Raw JSON string
  const parsedRaw = parseServiceAccount(JSON.stringify(validObj));
  assert.ok(parsedRaw);
  assert.equal(parsedRaw.project_id, 'homelyserv-prod');

  // 2. Base64-encoded JSON string
  const base64Str = Buffer.from(JSON.stringify(validObj)).toString('base64');
  const parsedB64 = parseServiceAccount(base64Str);
  assert.ok(parsedB64);
  assert.equal(parsedB64.project_id, 'homelyserv-prod');

  // 3. Invalid inputs
  assert.equal(parseServiceAccount(''), null);
  assert.equal(parseServiceAccount('   '), null);
  assert.equal(parseServiceAccount('not-json-or-base64'), null);
  assert.equal(parseServiceAccount(JSON.stringify({ incomplete: true })), null);
});

test('reconcileOrphanedNotifications recovers un-enqueued records within rollout boundary', async () => {
  const rolloutBoundary = new Date('2026-10-31T00:00:00.000Z');

  const mockPrisma = {
    notification: {
      findMany: async () => [
        {
          id: 'recovered-notif-1',
          userId: 'user-rec-1',
          type: 'NEW_HIRE',
          title: 'Offer Accepted',
          message: 'Worker accepted offer',
          entityType: 'HIRE',
          entityId: 'hire-1',
          createdAt: new Date('2026-10-31T12:00:00.000Z'),
        },
      ],
    },
  };

  const enqueued = [];
  const mockOutbox = {
    find: () => ({
      select: () => ({
        lean: async () => [], // No existing outbox items -> orphaned
      }),
    }),
    findOneAndUpdate: async (filter, update) => {
      enqueued.push({ filter, update });
      return { _id: 'outbox-rec-1' };
    },
  };

  const result = await reconcileOrphanedNotifications({
    rolloutBoundary,
    lookbackMs: 24 * 60 * 60 * 1000,
    prisma: mockPrisma,
    PushOutbox: mockOutbox,
  });

  assert.equal(result.checked, 1);
  assert.equal(result.recovered, 1);
  assert.equal(enqueued.length, 1);
  assert.equal(enqueued[0].filter.notificationId, 'recovered-notif-1');
});
