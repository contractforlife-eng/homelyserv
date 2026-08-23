// backend/src/services/notificationService.js
// ============================================================
// NOTIFICATION SERVICE - Single source of truth for creating
// notifications. No controller or page should insert notifications
// directly; all notifications must go through this service.
// ============================================================
import prisma from '../lib/prisma.js';
import { emitToUser } from '../lib/socket.js';
import User from '../models/User.js';

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
}) => {
  try {
    if (!userId) {
      console.warn('⚠️ NotificationService: No userId provided');
      return null;
    }

    const defaults = TYPE_DEFAULTS[type] || { icon: '🔔', priority: PRIORITIES.NORMAL };

    const notification = await prisma.notification.create({
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

export default {
  createNotification,
  createManyNotifications,
  markAsRead,
  markAllAsRead,
  getNotifications,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
  NOTIFICATION_TYPES,
  PRIORITIES,
};
