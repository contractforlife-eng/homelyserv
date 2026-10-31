import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import PushOutbox from '../models/PushOutbox.js';
import { getMessaging, isFcmDisabled } from './fcmInit.js';
import crypto from 'crypto';

const WORKER_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
export const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes lock lease
const BATCH_SIZE = 25;
const BASE_RETRY_DELAY_MS = 5000; // 5s exponential backoff
const UNCONFIGURED_RETRY_DELAY_MS = 60 * 1000; // 1 minute deferral when unconfigured
export const PROVIDER_TIMEOUT_MS = 15000; // 15-second bounded FCM provider timeout
export const NOTIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24-hour lifetime policy

/**
 * Rollout activation boundary:
 * In production, an explicit PUSH_ROLLOUT_BOUNDARY is strictly required to activate
 * outbox reconciliation and delivery, preventing accidental historical replays.
 * If unset in production, reconciliation is safely paused.
 */
export function getRolloutBoundary() {
  const envBoundary = process.env.PUSH_ROLLOUT_BOUNDARY;
  if (envBoundary) {
    const parsed = new Date(envBoundary);
    if (!isNaN(parsed.getTime())) return parsed;
    console.error(`[PushOutbox] Invalid PUSH_ROLLOUT_BOUNDARY format: "${envBoundary}". Expected ISO 8601.`);
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return null; // Production requires explicit activation boundary
  }

  // Local/development test fallback
  return new Date('2026-10-31T00:00:00.000Z');
}

export const VALID_CHANNEL_IDS = new Set([
  'messages',
  'jobs_offers',
  'hire',
  'payments',
  'system',
]);

const safeUserId = (value) => String(value || 'unknown').slice(-8);

export function resolveChannelForNotification(type, entityType) {
  if (type === 'NEW_MESSAGE' || entityType === 'MESSAGE') {
    return 'messages';
  }
  if (
    type === 'NEW_HIRE' ||
    type === 'HIRE_ACCEPTED' ||
    type === 'HIRE_REJECTED' ||
    entityType === 'OFFER' ||
    entityType === 'JOB_APPLICATION'
  ) {
    return 'jobs_offers';
  }
  if (entityType === 'HIRE' || type === 'HIRE_STATUS_UPDATE') {
    return 'hire';
  }
  if (
    type === 'PAYMENT_SUCCESS' ||
    type === 'PAYMENT_FAILED' ||
    type === 'ADMIN_PAYMENT_REVIEW_REQUIRED' ||
    entityType === 'PAYMENT'
  ) {
    return 'payments';
  }
  return 'system';
}

export function sanitizePreviewContent(title, message, type) {
  const safeTitle = typeof title === 'string' ? title.trim() : 'HomelyServ';
  let safeBody = typeof message === 'string' ? message.trim() : 'You have a new update';

  // Safe lockscreen preview masking: never expose raw private chat texts or medical notes
  if (type === 'NEW_MESSAGE' && safeTitle.toLowerCase().includes('message')) {
    safeBody = 'You have a new message on HomelyServ';
  } else if (type?.startsWith('APPOINTMENT') || type === 'VERIFICATION_STATUS') {
    if (type === 'APPOINTMENT_REQUESTED') safeBody = 'New appointment request received';
    else if (type === 'APPOINTMENT_CONFIRMED') safeBody = 'Your appointment has been confirmed';
    else if (type === 'APPOINTMENT_CANCELLED') safeBody = 'Your appointment has been cancelled';
    else if (type === 'APPOINTMENT_COMPLETED') safeBody = 'Your consultation is completed';
    else if (type === 'VERIFICATION_STATUS') safeBody = 'There is an update to your verification status';
  }

  return { safeTitle, safeBody };
}

function normalizeStringValue(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

export function sanitizeData(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const normalized = normalizeStringValue(value);
    if (normalized !== null) {
      out[key] = normalized;
    }
  }
  return out;
}

/**
 * Enqueue a notification for durable push delivery.
 * Uses the persisted notification's createdAt to anchor the expiresAt lifetime
 * so recovery never resets notification age.
 */
export async function enqueuePushOutbox(userId, notification, options = {}) {
  if (!userId || !notification?.id) return null;

  const outboxModel = options.PushOutbox || PushOutbox;

  try {
    const channelId = resolveChannelForNotification(notification.type, notification.entityType);
    const { safeTitle, safeBody } = sanitizePreviewContent(
      notification.title,
      notification.message,
      notification.type
    );

    const dataPayload = {
      ...(notification.data && typeof notification.data === 'object' ? notification.data : {}),
      notificationId: String(notification.id),
      type: String(notification.type || 'SYSTEM'),
      entityType: notification.entityType ? String(notification.entityType) : '',
      entityId: notification.entityId ? String(notification.entityId) : '',
      link: notification.link ? String(notification.link) : '/',
    };

    // Calculate expiry based on the original persisted notification creation time
    const createdAtTime = notification.createdAt
      ? new Date(notification.createdAt).getTime()
      : Date.now();
    const expiresAt = new Date(createdAtTime + NOTIFICATION_LIFETIME_MS);

    // If already expired at enqueue time, do not queue
    if (expiresAt.getTime() <= Date.now()) {
      console.warn(`[PushOutbox] Notification ${notification.id} is already expired; skipping enqueue.`);
      return null;
    }

    const outboxItem = await outboxModel.findOneAndUpdate(
      { notificationId: String(notification.id) },
      {
        $setOnInsert: {
          notificationId: String(notification.id),
          userId: String(userId),
          type: notification.type || 'SYSTEM',
          title: safeTitle,
          body: safeBody,
          channelId,
          data: sanitizeData(dataPayload),
          status: 'pending',
          attempts: 0,
          maxAttempts: 5,
          expiresAt,
          nextRetryAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lockClaimToken: null,
          deviceStates: [],
        },
      },
      { upsert: true, new: true }
    );

    // Opportunistically trigger immediate worker pass
    setImmediate(() => {
      processPushOutboxPass().catch(() => {});
    });

    return outboxItem;
  } catch (err) {
    console.error(`[PushOutbox] Failed to enqueue notificationId=${notification?.id}:`, err.message);
    return null;
  }
}

// Persistent cursor for reconciliation across worker passes to ensure fair coverage
let lastReconciliationCursor = null;

/**
 * Full-Lifetime Bounded Reconciliation:
 * Scans all un-enqueued notifications within their full 24-hour lifetime back to the
 * rollout boundary. Uses persistent cursoring and bounded pagination to ensure all
 * eligible records are eventually reached without front-page starvation or DB load spikes.
 * Recovery strictly preserves original creation time for expiration calculation.
 */
export async function reconcileOrphanedNotifications(options = {}) {
  const rolloutBoundary = options.rolloutBoundary || getRolloutBoundary();
  if (!rolloutBoundary) {
    console.info('[PushOutbox-Reconciliation] Paused: PUSH_ROLLOUT_BOUNDARY is not configured.');
    return { checked: 0, recovered: 0, paused: true };
  }

  const prismaClient = options.prisma || prisma;
  const outboxModel = options.PushOutbox || PushOutbox;
  const pageSize = options.pageSize || 100;
  const maxPages = options.maxPages || 5; // Bounded batch per pass

  const now = new Date();
  const fullLifetimeStart = new Date(now.getTime() - NOTIFICATION_LIFETIME_MS);
  const eligibleStart = new Date(Math.max(rolloutBoundary.getTime(), fullLifetimeStart.getTime()));

  let totalChecked = 0;
  let totalRecovered = 0;
  let cursor = options.initialCursor !== undefined ? options.initialCursor : lastReconciliationCursor;

  try {
    for (let page = 0; page < maxPages; page++) {
      const query = {
        where: {
          createdAt: {
            gte: eligibleStart,
            lte: now,
          },
        },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          entityType: true,
          entityId: true,
          link: true,
          data: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
      };

      if (cursor) {
        query.skip = 1;
        query.cursor = { id: cursor };
      }

      let batch = await prismaClient.notification.findMany(query);

      // If persistent cursor reached the end of eligible records, wrap around to head
      if ((!batch || batch.length === 0) && cursor) {
        cursor = null;
        lastReconciliationCursor = null;
        query.skip = 0;
        delete query.cursor;
        batch = await prismaClient.notification.findMany(query);
      }

      if (!batch || batch.length === 0) break;

      totalChecked += batch.length;
      cursor = batch[batch.length - 1].id;
      lastReconciliationCursor = cursor;

      const notificationIds = batch.map((n) => String(n.id));
      const existingOutboxRecords = await outboxModel
        .find({ notificationId: { $in: notificationIds } })
        .select('notificationId')
        .lean();

      const existingIdSet = new Set(existingOutboxRecords.map((r) => r.notificationId));

      for (const notif of batch) {
        if (!existingIdSet.has(String(notif.id))) {
          await enqueuePushOutbox(notif.userId, notif, { PushOutbox: outboxModel });
          totalRecovered++;
          console.info(`[PushOutbox-Reconciliation] Recovered orphaned notificationId=${notif.id} ageMs=${now - new Date(notif.createdAt)}`);
        }
      }

      if (batch.length < pageSize) {
        lastReconciliationCursor = null; // Reached end of table; next pass starts at newest
        break;
      }
    }

    return { checked: totalChecked, recovered: totalRecovered, cursor: lastReconciliationCursor };
  } catch (err) {
    console.error('[PushOutbox-Reconciliation] Error during pass:', err.message);
    return { checked: totalChecked, recovered: totalRecovered, error: err.message };
  }
}

/**
 * Execute a provider send with a bounded timeout promise.
 */
function sendWithProviderTimeout(sendPromise, timeoutMs = PROVIDER_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      timer = null;
      const err = new Error(`FCM provider timeout exceeded (${timeoutMs}ms)`);
      err.code = 'PROVIDER_TIMEOUT';
      reject(err);
    }, timeoutMs);

    sendPromise
      .then((val) => {
        if (timer) {
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch((err) => {
        if (timer) {
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

/**
 * Process a batch of pending/retryable push outbox items with lease renewal and unique claim tokens.
 */
export async function processPushOutboxPass(workerId = WORKER_ID, options = {}) {
  const outboxModel = options.PushOutbox || PushOutbox;
  const now = new Date();
  const lockCutoff = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  // 1. Mark expired items that exceeded their original expiresAt policy
  await outboxModel.updateMany(
    {
      status: { $in: ['pending', 'processing'] },
      expiresAt: { $lt: now },
    },
    {
      $set: {
        status: 'failed',
        lastError: 'EXPIRED: Exceeded notification expiresAt policy',
        lockedAt: null,
        lockedBy: null,
        lockClaimToken: null,
      },
    }
  );

  // 2. Find candidate IDs to lock
  const candidates = await outboxModel
    .find({
      status: { $in: ['pending', 'processing'] },
      nextRetryAt: { $lte: now },
      expiresAt: { $gte: now },
      $or: [{ lockedAt: null }, { lockedAt: { $lt: lockCutoff } }],
    })
    .sort({ nextRetryAt: 1 })
    .limit(BATCH_SIZE)
    .select('_id')
    .lean();

  if (!candidates || candidates.length === 0) {
    return { processed: 0, successCount: 0, failureCount: 0 };
  }

  let processed = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const candidate of candidates) {
    // Generate a unique claim token for this lease acquisition
    const claimToken = `${workerId}-${crypto.randomBytes(6).toString('hex')}`;

    // Acquire exclusive lease per outbox item with unique claim token
    const item = await outboxModel.findOneAndUpdate(
      {
        _id: candidate._id,
        $or: [{ lockedAt: null }, { lockedAt: { $lt: lockCutoff } }],
      },
      {
        $set: {
          status: 'processing',
          lockedAt: now,
          lockedBy: workerId,
          lockClaimToken: claimToken,
        },
      },
      { new: true }
    );

    if (!item) continue; // Race: acquired by another worker

    processed++;

    // Lease Renewal Helper: extends the lease lock while work is actively progressing
    const renewLease = async () => {
      const renewed = await outboxModel.updateOne(
        { _id: item._id, lockClaimToken: claimToken },
        { $set: { lockedAt: new Date() } }
      );
      return renewed.matchedCount > 0;
    };

    // Lease Ownership Check: verifies this worker still owns the item before committing sends
    const checkOwnership = async () => {
      const current = await outboxModel.findOne({ _id: item._id }).select('lockClaimToken').lean();
      return current?.lockClaimToken === claimToken;
    };

    try {
      const result = await deliverOutboxItem(item, {
        renewLease,
        checkOwnership,
        claimToken,
        outboxModel,
        ...options,
      });

      // Handle unconfigured/disabled FCM: defer delivery without burning delivery attempts
      if (result.unconfigured) {
        await outboxModel.updateOne(
          { _id: item._id, lockClaimToken: claimToken },
          {
            $set: {
              status: 'pending',
              nextRetryAt: new Date(Date.now() + UNCONFIGURED_RETRY_DELAY_MS),
              lockedAt: null,
              lockedBy: null,
              lockClaimToken: null,
              lastError: result.error || 'FCM not configured; deferred until configuration is available',
            },
          }
        );
        continue;
      }

      if (result.ownershipLost) {
        console.warn(`[PushOutbox] Worker ${workerId} aborted delivery: lease claim token lost for item ${item._id}`);
        failureCount++;
        continue;
      }

      if (result.success) {
        // Enforce strict claim token ownership check on completion
        const updated = await outboxModel.updateOne(
          { _id: item._id, lockClaimToken: claimToken },
          {
            $set: {
              status: 'completed',
              processedAt: new Date(),
              lockedAt: null,
              lockedBy: null,
              lockClaimToken: null,
              deviceStates: result.deviceStates || [],
              lastError: null,
            },
          }
        );
        if (updated.matchedCount > 0) {
          successCount++;
        } else {
          console.warn(`[PushOutbox] Worker ${workerId} lost claim token ownership on completion of item ${item._id}`);
          failureCount++;
        }
      } else {
        failureCount++;
        const currentAttempts = (item.attempts || 0) + 1;
        const hasMoreAttempts = currentAttempts < item.maxAttempts;
        const backoffDelay = Math.min(
          BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempts - 1),
          15 * 60 * 1000
        );

        const updated = await outboxModel.updateOne(
          { _id: item._id, lockClaimToken: claimToken },
          {
            $set: {
              status: hasMoreAttempts ? 'pending' : 'failed',
              nextRetryAt: new Date(Date.now() + backoffDelay),
              lockedAt: null,
              lockedBy: null,
              lockClaimToken: null,
              deviceStates: result.deviceStates || [],
              lastError: result.error || 'Delivery failed',
            },
            $inc: { attempts: 1 },
          }
        );
        if (updated.matchedCount === 0) {
          console.warn(`[PushOutbox] Worker ${workerId} lost claim token on failure update of item ${item._id}`);
        }
      }
    } catch (err) {
      failureCount++;
      const currentAttempts = (item.attempts || 0) + 1;
      const hasMoreAttempts = currentAttempts < item.maxAttempts;
      await outboxModel.updateOne(
        { _id: item._id, lockClaimToken: claimToken },
        {
          $set: {
            status: hasMoreAttempts ? 'pending' : 'failed',
            nextRetryAt: new Date(Date.now() + BASE_RETRY_DELAY_MS),
            lockedAt: null,
            lockedBy: null,
            lockClaimToken: null,
            lastError: err.message,
          },
          $inc: { attempts: 1 },
        }
      );
    }
  }

  return { processed, successCount, failureCount };
}

/**
 * Deliver a single locked outbox item to recipient active devices with bounded timeout
 * and ongoing lease ownership verification.
 */
async function deliverOutboxItem(item, context = {}) {
  const safeId = safeUserId(item.userId);
  const checkOwnership = context.checkOwnership || (async () => true);
  const renewLease = context.renewLease || (async () => true);

  if (isFcmDisabled()) {
    console.info(`[FCM-Outbox] user=${safeId} notificationId=${item.notificationId} skipped=disabled`);
    return { success: true, deviceStates: [], note: 'FCM disabled' };
  }

  const messaging = context.messaging !== undefined ? context.messaging : getMessaging();
  if (!messaging) {
    console.info(`[FCM-Outbox] user=${safeId} notificationId=${item.notificationId} deferred=unconfigured`);
    return { success: false, unconfigured: true, error: 'Firebase Admin messaging unconfigured' };
  }

  // Check user settings preferences
  let settings = {};
  try {
    const user = await User.findById(item.userId).select('settings');
    if (user) {
      settings = user.settings || {};
    }
  } catch {
    // Ignore preference lookup error; proceed with delivery
  }

  if (settings.notifications === false) {
    console.info(`[FCM-Outbox] user=${safeId} skipped=notifications-disabled`);
    return { success: true, deviceStates: [], note: 'User disabled notifications' };
  }

  if (settings.pushNotifications === false) {
    console.info(`[FCM-Outbox] user=${safeId} skipped=push-disabled`);
    return { success: true, deviceStates: [], note: 'User disabled pushNotifications' };
  }

  const prismaClient = context.prisma || prisma;
  const devices = await prismaClient.pushDevice.findMany({
    where: {
      userId: String(item.userId),
      revokedAt: null,
      platform: 'android',
      tokenType: 'fcm',
    },
    select: { id: true, token: true },
  });

  const activeDevices = devices.filter((d) => d.token && d.token.trim().length > 0);
  if (activeDevices.length === 0) {
    console.info(`[FCM-Outbox] user=${safeId} activeDevices=0 skipped=no-active-device`);
    return { success: true, deviceStates: [], note: 'No active devices' };
  }

  const safeData =
    item.data instanceof Map ? Object.fromEntries(item.data) : sanitizeData(item.data);

  // Filter out devices already sent successfully in a previous partial attempt
  const previousSentTokens = new Set(
    (item.deviceStates || []).filter((s) => s.status === 'sent').map((s) => s.token)
  );

  const devicesToSend = activeDevices.filter((d) => !previousSentTokens.has(d.token));
  if (devicesToSend.length === 0) {
    return { success: true, deviceStates: item.deviceStates };
  }

  // Pre-flight lease ownership check before sending to provider
  const stillOwnedBeforeSend = await checkOwnership();
  if (!stillOwnedBeforeSend) {
    return { ownershipLost: true, success: false, error: 'Lease expired before sending to provider' };
  }

  // Renew lease right before dispatching
  await renewLease();

  // Send sequentially or bounded to prevent lease starvation on multi-device users
  const deviceStates = [...(item.deviceStates || [])];
  const invalidTokenErrors = [];
  let sentCount = 0;
  let errorCount = 0;

  for (const device of devicesToSend) {
    // Check ownership before each individual device send
    const owned = await checkOwnership();
    if (!owned) {
      console.warn(`[PushOutbox] Lease ownership lost during multi-device dispatch; aborting remaining sends.`);
      return { ownershipLost: true, success: false, deviceStates, error: 'Lease ownership lost mid-dispatch' };
    }

    try {
      const sendPromise = messaging.send({
        token: device.token,
        notification: { title: item.title, body: item.body },
        data: safeData,
        android: {
          notification: {
            channelId: item.channelId,
          },
        },
      });

      await sendWithProviderTimeout(sendPromise, PROVIDER_TIMEOUT_MS);
      sentCount++;
      deviceStates.push({
        deviceId: device.id,
        token: device.token,
        status: 'sent',
        sentAt: new Date(),
      });

      // Renew lease after successful individual send
      await renewLease();
    } catch (err) {
      errorCount++;
      const code = err?.code || '';
      const isInvalid =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument' ||
        code === 'messaging/sender-id-mismatch';

      if (isInvalid) {
        invalidTokenErrors.push({ deviceId: device.id, token: device.token });
      }

      deviceStates.push({
        deviceId: device.id,
        token: device.token,
        status: isInvalid ? 'invalid_token' : 'failed',
        error: err?.message || 'FCM error',
      });
    }
  }

  if (invalidTokenErrors.length > 0) {
    try {
      await prismaClient.pushDevice.updateMany({
        where: {
          id: { in: invalidTokenErrors.map((e) => e.deviceId) },
          userId: String(item.userId),
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'FCM_INVALID',
        },
      });
    } catch {
      // Best-effort token cleanup
    }
  }

  const allSent = errorCount === 0;
  return {
    success: allSent,
    deviceStates,
    error: allSent ? null : `${errorCount} devices failed delivery`,
  };
}

let outboxWorkerTimer = null;
let reconciliationWorkerTimer = null;

export function startPushOutboxWorker(intervalMs = 15000) {
  if (outboxWorkerTimer || process.env.NODE_ENV === 'test') return outboxWorkerTimer;
  const run = () =>
    processPushOutboxPass().catch((err) => {
      console.error('[PushOutboxWorker] Error during pass:', err.message);
    });
  outboxWorkerTimer = setInterval(run, intervalMs);
  outboxWorkerTimer.unref?.();
  run();

  // Run full-lifetime reconciliation every 5 minutes
  const runReconciliation = () =>
    reconcileOrphanedNotifications().catch((err) => {
      console.error('[PushReconciliation] Error during pass:', err.message);
    });
  reconciliationWorkerTimer = setInterval(runReconciliation, 5 * 60 * 1000);
  reconciliationWorkerTimer.unref?.();
  runReconciliation();

  return outboxWorkerTimer;
}

export function stopPushOutboxWorker() {
  if (outboxWorkerTimer) {
    clearInterval(outboxWorkerTimer);
    outboxWorkerTimer = null;
  }
  if (reconciliationWorkerTimer) {
    clearInterval(reconciliationWorkerTimer);
    reconciliationWorkerTimer = null;
  }
}
