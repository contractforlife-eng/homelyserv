// backend/src/services/notificationService.js
// ============================================================
// NOTIFICATION SERVICE - Single source of truth for creating
// notifications. No controller or page should insert notifications
// directly; all notifications must go through this service.
// ============================================================
import prisma from '../lib/prisma.js';
import { emitToUser } from '../lib/socket.js';
import User from '../models/User.js';
import { enqueuePushOutbox } from './pushOutboxService.js';

// ============================================================
// NOTIFICATION TYPES
// ============================================================
export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_COMPLAINT: 'NEW_COMPLAINT',
  COMPLAINT_ASSIGNED: 'COMPLAINT_ASSIGNED',
  COMPLAINT_REPLY: 'COMPLAINT_REPLY',
  COMPLAINT_ESCALATED: 'COMPLAINT_ESCALATED',
  COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ADMIN_PAYMENT_REVIEW_REQUIRED: 'ADMIN_PAYMENT_REVIEW_REQUIRED',
  PREMIUM_EXPIRES: 'PREMIUM_EXPIRES',
  NEW_HIRE: 'NEW_HIRE',
  HIRE_ACCEPTED: 'HIRE_ACCEPTED',
  HIRE_REJECTED: 'HIRE_REJECTED',
  // Doctor system events (additive; no Worker/Employer behavior changes)
  APPOINTMENT_REQUESTED: 'APPOINTMENT_REQUESTED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  APPOINTMENT_UPDATED: 'APPOINTMENT_UPDATED',
  VERIFICATION_STATUS: 'VERIFICATION_STATUS',
  WALL_GIFT: 'WALL_GIFT',
  WALL_COMMENT: 'WALL_COMMENT',
  SYSTEM: 'SYSTEM',
};

// ============================================================
// PRIORITIES
// ============================================================
export const PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// ============================================================
// DEFAULT ICONS PER TYPE
// ============================================================
const TYPE_DEFAULTS = {
  [NOTIFICATION_TYPES.NEW_MESSAGE]: { icon: '💬', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.NEW_COMPLAINT]: { icon: '📋', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.COMPLAINT_ASSIGNED]: { icon: '👤', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.COMPLAINT_REPLY]: { icon: '💬', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.COMPLAINT_ESCALATED]: { icon: '🚨', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.COMPLAINT_RESOLVED]: { icon: '✅', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: { icon: '💰', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: { icon: '❌', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.ADMIN_PAYMENT_REVIEW_REQUIRED]: { icon: '💳', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.PREMIUM_EXPIRES]: { icon: '👑', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.NEW_HIRE]: { icon: '📋', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.HIRE_ACCEPTED]: { icon: '✅', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.HIRE_REJECTED]: { icon: '❌', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.APPOINTMENT_REQUESTED]: { icon: '📅', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED]: { icon: '✅', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: { icon: '❌', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.APPOINTMENT_COMPLETED]: { icon: '🏥', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.APPOINTMENT_UPDATED]: { icon: '📅', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.VERIFICATION_STATUS]: { icon: '🛡️', priority: PRIORITIES.HIGH },
  [NOTIFICATION_TYPES.WALL_GIFT]: { icon: '🎁', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.WALL_COMMENT]: { icon: '💬', priority: PRIORITIES.NORMAL },
  [NOTIFICATION_TYPES.SYSTEM]: { icon: '⚙️', priority: PRIORITIES.LOW },
};

// ============================================================
// CREATE NOTIFICATION
// ============================================================
/**
 * Determine whether a user should receive realtime notification delivery.
 * In-app notification records are always created regardless of this value.
 */
const shouldNotifyUser = async (userId) => {
  try {
    const user = await User.findById(userId).select('settings');
    if (!user) {
      return true;
    }
    return user.settings?.notifications !== false;
  } catch {
    return true;
  }
};

/**
 * Create a notification for a user.
 * All notification creation must go through this service.
 */
export const createNotification = async (userId, {
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  priority = null,
  icon = null,
  link = null,
  data = {},
  eventKey = null,
  enqueuePush = true,
}) => {
  try {
    if (!userId) {
      console.warn('⚠️ NotificationService: No userId provided');
      return null;
    }

    const defaults = TYPE_DEFAULTS[type] || { icon: '🔔', priority: PRIORITIES.NORMAL };
    let notification;

    if (eventKey && typeof eventKey === 'string' && eventKey.trim()) {
      const cleanEventKey = eventKey.trim();

      // Guard: Ensure unique index is ready before attempting event-key dispatch
      if (process.env.NODE_ENV !== 'test') {
        await ensureNotificationIndexes();
      }

      const rawRes = await prisma.$runCommandRaw({
        findAndModify: 'Notification',
        query: { eventKey: cleanEventKey },
        update: {
          $setOnInsert: {
            userId: { $oid: String(userId) },
            type: type || NOTIFICATION_TYPES.SYSTEM,
            title: title || 'Notification',
            message: message || title || 'You have a new notification',
            entityType: entityType || null,
            entityId: entityId || null,
            priority: priority || defaults.priority || PRIORITIES.NORMAL,
            isRead: false,
            readAt: null,
            data: data || {},
            icon: icon || defaults.icon || '🔔',
            link: link || '/',
            eventKey: cleanEventKey,
            createdAt: new Date(),
          },
        },
        upsert: true,
        new: true,
      });

      const doc = rawRes?.value;
      if (doc) {
        notification = {
          id: String(doc._id?.$oid || doc._id),
          userId: String(doc.userId?.$oid || doc.userId),
          type: doc.type,
          title: doc.title,
          message: doc.message,
          entityType: doc.entityType,
          entityId: doc.entityId,
          priority: doc.priority,
          isRead: Boolean(doc.isRead),
          readAt: doc.readAt ? (doc.readAt.$date ? new Date(doc.readAt.$date) : new Date(doc.readAt)) : null,
          data: doc.data || {},
          icon: doc.icon,
          link: doc.link,
          eventKey: doc.eventKey,
          createdAt: doc.createdAt ? (doc.createdAt.$date ? new Date(doc.createdAt.$date) : new Date(doc.createdAt)) : new Date(),
        };
      }
    }

    if (!notification) {
      notification = await prisma.notification.create({
        data: {
          userId,
          type: type || NOTIFICATION_TYPES.SYSTEM,
          title: title || 'Notification',
          message: message || title || 'You have a new notification',
          entityType: entityType || null,
          entityId: entityId || null,
          priority: priority || defaults.priority || PRIORITIES.NORMAL,
          isRead: false,
          readAt: null,
          data: data || {},
          icon: icon || defaults.icon || '🔔',
          link: link || '/',
        },
      });
    }

    // Emit realtime event to the user's socket room
    const shouldDeliver = await shouldNotifyUser(userId);
    if (shouldDeliver) {
      emitToUser(userId, 'notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        priority: notification.priority,
        isRead: notification.isRead,
        icon: notification.icon,
        link: notification.link,
        createdAt: notification.createdAt,
      });
    }

    // Enqueue for durable push delivery (never blocks caller response) unless caller manages outbox
    if (enqueuePush) {
      enqueuePushOutbox(userId, notification).catch((pushErr) => {
        console.error('⚠️ Failed to enqueue push notification:', pushErr.message);
      });
    }

    return notification;
  } catch (error) {
    console.error('❌ NotificationService: Failed to create notification:', error);
    return null;
  }
};

/**
 * Create notifications for multiple users (bulk).
 */
export const createManyNotifications = async (userIds, payload) => {
  const results = [];
  for (const userId of userIds) {
    if (!userId) continue;
    const notification = await createNotification(userId, payload);
    if (notification) results.push(notification);
  }
  return results;
};

// ============================================================
// MARK AS READ
// ============================================================
export const markAsRead = async (notificationId, userId) => {
  try {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  } catch (error) {
    console.error('❌ NotificationService: Failed to mark as read:', error);
    return null;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  } catch (error) {
    console.error('❌ NotificationService: Failed to mark all as read:', error);
    return null;
  }
};

// ============================================================
// QUERIES
// ============================================================
export const getNotifications = async (userId, { page = 1, limit = 50 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount };
  } catch (error) {
    console.error('❌ NotificationService: Failed to fetch notifications:', error);
    return { notifications: [], total: 0, unreadCount: 0 };
  }
};

export const getUnreadCount = async (userId) => {
  try {
    return await prisma.notification.count({ where: { userId, isRead: false } });
  } catch (error) {
    console.error('❌ NotificationService: Failed to fetch unread count:', error);
    return 0;
  }
};

// ============================================================
// DELETE
// ============================================================
export const deleteNotification = async (notificationId, userId) => {
  try {
    return await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  } catch (error) {
    console.error('❌ NotificationService: Failed to delete notification:', error);
    return null;
  }
};

export const clearAllNotifications = async (userId) => {
  try {
    return await prisma.notification.deleteMany({ where: { userId } });
  } catch (error) {
    console.error('❌ NotificationService: Failed to clear notifications:', error);
    return null;
  }
};

let indexReadyPromise = null;
let isIndexReady = false;

/**
 * Ensures required indexes exist on the Notification collection reproducibly.
 * Uses MongoDB createIndexes command with sparse: true for eventKey.
 * Safe to execute on every server startup / deployment (idempotent no-op if already present).
 */
export const ensureNotificationIndexes = async (prismaClient = prisma) => {
  if (isIndexReady) return true;
  if (!indexReadyPromise) {
    indexReadyPromise = (async () => {
      try {
        await prismaClient.$runCommandRaw({
          createIndexes: 'Notification',
          indexes: [
            {
              key: { eventKey: 1 },
              name: 'Notification_eventKey_unique',
              unique: true,
              sparse: true,
            },
          ],
        });
        isIndexReady = true;
        return true;
      } catch (err) {
        indexReadyPromise = null; // allow retry on subsequent attempts
        console.error('❌ NotificationService: CRITICAL - Failed to initialize Notification unique eventKey index:', err.message);
        throw err;
      }
    })();
  }
  return indexReadyPromise;
};

export default {
  createNotification,
  createManyNotifications,
  markAsRead,
  markAllAsRead,
  getNotifications,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
  ensureNotificationIndexes,
  NOTIFICATION_TYPES,
  PRIORITIES,
};
