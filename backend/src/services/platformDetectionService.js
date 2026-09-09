// backend/src/services/platformDetectionService.js
import User from '../models/User.js';

export const VALID_PLATFORMS = ['web', 'android', 'ios', 'unknown'];
export const ACTIVITY_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes

const activityThrottleMap = new Map();

/**
 * Normalizes and detects client platform from request headers / User-Agent.
 * Priority 1: X-Client-Platform header (case-insensitive: 'web', 'android', 'ios')
 * Priority 2: User-Agent fallback
 * Default: 'unknown'
 * 
 * @param {import('express').Request} req
 * @returns {'web'|'android'|'ios'|'unknown'}
 */
export const detectPlatform = (req) => {
  if (!req) return 'unknown';

  // 1. Explicit Client Header
  const clientHeader = req.headers?.['x-client-platform'] || req.headers?.['x-client-platform'.toLowerCase()];
  if (typeof clientHeader === 'string') {
    const normalized = clientHeader.trim().toLowerCase();
    if (['web', 'android', 'ios'].includes(normalized)) {
      return normalized;
    }
  }

  // 2. User-Agent Fallback
  const userAgent = req.headers?.['user-agent'] || '';
  if (typeof userAgent === 'string' && userAgent.trim().length > 0) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('android') || ua.includes('wv') || ua.includes('capacitor')) {
      return 'android';
    }
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      return 'ios';
    }
    if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox') || ua.includes('edge')) {
      return 'web';
    }
  }

  return 'unknown';
};

/**
 * Extracts optional client app version from X-Client-Version header if present.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export const extractAppVersion = (req) => {
  if (!req) return null;
  const versionHeader = req.headers?.['x-client-version'] || req.headers?.['x-app-version'];
  if (typeof versionHeader === 'string' && versionHeader.trim().length > 0) {
    return versionHeader.trim().slice(0, 50);
  }
  return null;
};

/**
 * Helper to update user activity immediately (e.g. on login/register).
 * @param {string|object} userId
 * @param {import('express').Request} req
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export const recordDirectActivity = async (userId, req, options = {}) => {
  if (!userId) return;
  const idStr = String(userId._id || userId.id || userId);
  const detectedPlatform = options.platform || detectPlatform(req);
  const appVersion = options.appVersion || extractAppVersion(req);
  const now = new Date();

  try {
    const updateDoc = {
      lastActiveAt: now,
      lastPlatform: detectedPlatform
    };
    if (appVersion) {
      updateDoc.lastAppVersion = appVersion;
    }

    await User.findByIdAndUpdate(idStr, { $set: updateDoc }, { runValidators: false });
    activityThrottleMap.set(idStr, now.getTime());
  } catch (err) {
    console.error(`[ActivityTracking] Failed direct update for user ${idStr}:`, err.message);
  }
};

/**
 * Throttled non-blocking activity tracking for authenticated API requests.
 * Ensures maximum 1 DB write per user every 15 minutes.
 * 
 * @param {string|object} userId
 * @param {import('express').Request} req
 */
export const trackUserActivityThrottled = (userId, req) => {
  if (!userId) return;
  const idStr = String(userId._id || userId.id || userId);
  const now = Date.now();
  const lastRecorded = activityThrottleMap.get(idStr);

  if (lastRecorded && (now - lastRecorded) < ACTIVITY_THROTTLE_MS) {
    // Throttled: skip DB write
    return;
  }

  // Update in-memory map immediately so concurrent requests do not fire duplicates
  activityThrottleMap.set(idStr, now);

  // Non-blocking asynchronous update
  const detectedPlatform = detectPlatform(req);
  const appVersion = extractAppVersion(req);
  const updateDate = new Date(now);

  const updateDoc = {
    lastActiveAt: updateDate,
    lastPlatform: detectedPlatform
  };
  if (appVersion) {
    updateDoc.lastAppVersion = appVersion;
  }

  User.findByIdAndUpdate(idStr, { $set: updateDoc }, { runValidators: false })
    .catch((err) => {
      console.error(`[ActivityThrottling] Async throttled update error for ${idStr}:`, err.message);
    });
};

/**
 * For testing purposes: reset in-memory throttle cache.
 */
export const _clearActivityThrottleCache = () => {
  activityThrottleMap.clear();
};
