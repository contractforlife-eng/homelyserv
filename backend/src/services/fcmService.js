import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import { getMessaging, isFcmDisabled } from './fcmInit.js';

const VALID_CHANNEL_IDS = new Set([
  'messages',
  'jobs_offers',
  'hire',
  'payments',
  'system',
]);

const safeUserId = (value) => String(value || 'unknown').slice(-8);

function normalizeStringValue(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function sanitizeData(input) {
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

export async function sendPushToUser(userId, { title, body, data = {}, channelId = 'system' }) {
  const safeId = safeUserId(userId);
  if (isFcmDisabled()) {
    console.info(`[FCM] user=${safeId} activeDevices=0 success=0 failure=0 skipped=disabled`);
    return { disabled: true, attempted: 0, successCount: 0, failureCount: 0 };
  }

  const messaging = getMessaging();
  if (!messaging) {
    console.info(`[FCM] user=${safeId} activeDevices=0 success=0 failure=0 skipped=uninitialized`);
    return { disabled: true, attempted: 0, successCount: 0, failureCount: 0 };
  }

  let settings = {};
  try {
    const user = await User.findById(userId).select('settings');
    if (user) {
      settings = user.settings || {};
    }
  } catch {
    // Preference lookup failure must not break delivery; default to sending.
  }

  if (settings.notifications === false) {
    console.info(`[FCM] user=${safeId} activeDevices=0 success=0 failure=0 skipped=notifications-disabled`);
    return { disabled: false, attempted: 0, successCount: 0, failureCount: 0 };
  }

  if (settings.pushNotifications === false) {
    console.info(`[FCM] user=${safeId} activeDevices=0 success=0 failure=0 skipped=push-disabled`);
    return { disabled: false, attempted: 0, successCount: 0, failureCount: 0 };
  }

  try {
    const devices = await prisma.pushDevice.findMany({
      where: {
        userId: String(userId),
        revokedAt: null,
        platform: 'android',
        tokenType: 'fcm',
      },
      select: { id: true, token: true },
    });

    const activeDevices = devices.filter((d) => d.token && d.token.trim().length > 0);
    if (activeDevices.length === 0) {
      console.info(`[FCM] user=${safeId} activeDevices=0 success=0 failure=0 skipped=no-active-device`);
      return { disabled: false, attempted: 0, successCount: 0, failureCount: 0 };
    }

    const safeChannel = VALID_CHANNEL_IDS.has(channelId) ? channelId : 'system';
    const safeTitle = typeof title === 'string' ? title : '';
    const safeBody = typeof body === 'string' ? body : '';
    const safeData = sanitizeData(data);

    const results = await Promise.allSettled(
      activeDevices.map((device) =>
        messaging.send({
          token: device.token,
          notification: { title: safeTitle, body: safeBody },
          data: safeData,
          android: {
            channelId: safeChannel,
          },
        })
      )
    );

    let successCount = 0;
    let failureCount = 0;
    const invalidTokenErrors = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        const error = result.reason;
        const code = error?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument' ||
          code === 'messaging/sender-id-mismatch'
        ) {
          invalidTokenErrors.push({ deviceId: activeDevices[i].id, token: activeDevices[i].token, code });
        }
      }
    }

    if (invalidTokenErrors.length > 0) {
      try {
        await prisma.pushDevice.updateMany({
          where: {
            id: { in: invalidTokenErrors.map((e) => e.deviceId) },
            userId: String(userId),
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'FCM_INVALID',
          },
        });
      } catch {
        // best-effort cleanup only
      }
    }

    console.info(`[FCM] user=${safeId} activeDevices=${activeDevices.length} success=${successCount} failure=${failureCount}`);
    for (const result of results) {
      if (result.status === 'rejected') {
        const code = result.reason?.code || result.reason?.name || 'unknown';
        console.error(`[FCM] send failed user=${safeId} code=${code}`);
      }
    }

    return {
      disabled: false,
      attempted: activeDevices.length,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error(`[FCM] send failed user=${safeId} code=${error?.code || error?.name || 'unknown'}`);
    return { disabled: false, attempted: 0, successCount: 0, failureCount: 0 };
  }
}
