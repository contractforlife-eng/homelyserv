// frontend/src/utils/notificationService.js
// ============================================================
// NOTIFICATION SERVICE - Frontend API client
// ============================================================
import api from '../utils/api';

async function handleResponse(res) {
  if (res.status < 200 || res.status >= 300) {
    const err = res.data?.message || res.data?.error || 'Notification API error';
    throw new Error(err);
  }
  return res.data;
}

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
// ICONS PER TYPE
// ============================================================
const TYPE_ICONS = {
  [NOTIFICATION_TYPES.NEW_MESSAGE]: '💬',
  [NOTIFICATION_TYPES.NEW_COMPLAINT]: '📋',
  [NOTIFICATION_TYPES.COMPLAINT_ASSIGNED]: '👤',
  [NOTIFICATION_TYPES.COMPLAINT_REPLY]: '💬',
  [NOTIFICATION_TYPES.COMPLAINT_ESCALATED]: '🚨',
  [NOTIFICATION_TYPES.COMPLAINT_RESOLVED]: '✅',
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: '💰',
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: '❌',
  [NOTIFICATION_TYPES.PREMIUM_EXPIRES]: '👑',
  [NOTIFICATION_TYPES.NEW_HIRE]: '📋',
  [NOTIFICATION_TYPES.HIRE_ACCEPTED]: '✅',
  [NOTIFICATION_TYPES.HIRE_REJECTED]: '❌',
  [NOTIFICATION_TYPES.SYSTEM]: '⚙️',
};

export const getTypeIcon = (type) => TYPE_ICONS[type] || '🔔';

// ============================================================
// MAP NOTIFICATION TO UI FORMAT
// ============================================================
const mapNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message || n.body,
  entityType: n.entityType,
  entityId: n.entityId,
  priority: n.priority,
  isRead: n.isRead,
  readAt: n.readAt,
  icon: n.icon || getTypeIcon(n.type),
  link: n.link || '/',
  data: n.data,
  createdAt: n.createdAt,
  time: n.createdAt,
  read: n.isRead,
});

// ============================================================
// GET NOTIFICATIONS
// ============================================================
export async function getNotifications({ page = 1, limit = 50 } = {}) {
  try {
    const res = await api.get(`/api/notifications?page=${page}&limit=${limit}`);
    const data = await handleResponse(res);
    return {
      notifications: (data.notifications || []).map(mapNotification),
      total: data.total || 0,
      unreadCount: data.unreadCount || 0,
      page: data.page || page,
      limit: data.limit || limit,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], total: 0, unreadCount: 0, page, limit };
  }
}

// ============================================================
// GET UNREAD COUNT
// ============================================================
export async function getUnreadCount() {
  try {
    const res = await api.get('/api/notifications/unread-count');
    const data = await handleResponse(res);
    return data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

// ============================================================
// MARK AS READ
// ============================================================
export async function markAsRead(notificationId) {
  const res = await api.put(`/api/notifications/${notificationId}/read`);
  return await handleResponse(res);
}

export async function markAllAsRead() {
  const res = await api.put('/api/notifications/read-all');
  return await handleResponse(res);
}

// ============================================================
// DELETE
// ============================================================
export async function deleteNotification(notificationId) {
  const res = await api.delete(`/api/notifications/${notificationId}`);
  return await handleResponse(res);
}

export async function clearAllNotifications() {
  const res = await api.delete('/api/notifications');
  return await handleResponse(res);
}

// ============================================================
// SETTINGS
// ============================================================
export async function getNotificationSettings() {
  const res = await api.get('/api/notifications/settings');
  const data = await handleResponse(res);
  return data.settings || {
    newMessage: true,
    hireResponse: true,
    complaintUpdate: true,
    paymentConfirmation: true,
    systemUpdate: false,
    promotional: false,
  };
}

export async function updateNotificationSettings(settings) {
  const res = await api.put('/api/notifications/settings', { settings });
  return await handleResponse(res);
}

// ============================================================
// NAVIGATION HELPER - Map entity to route
// ============================================================
/**
 * Given a notification's entityType + entityId, return the route
 * to navigate to for the related entity.
 */
export const getEntityRoute = (notification) => {
  const { entityType, entityId, type, link } = notification;

  // If a link is provided, use it
  if (link && link !== '/') return link;

  switch (entityType) {
    case 'COMPLAINT':
      return `/worker-complaints`;
    case 'MESSAGE':
      return `/messages`;
    case 'PAYMENT':
      return `/employer-payments`;
    case 'HIRE':
      return `/my-hires`;
    case 'OFFER':
      return `/worker/offers`;
    default:
      // Fallback based on type
      if (type === NOTIFICATION_TYPES.NEW_MESSAGE) return '/messages';
      if (type?.startsWith('COMPLAINT')) return '/worker-complaints';
      if (type?.startsWith('PAYMENT')) return '/employer-payments';
      if (type?.startsWith('HIRE')) return '/my-hires';
      return '/notifications';
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  getEntityRoute,
  getTypeIcon,
  NOTIFICATION_TYPES,
  PRIORITIES,
};