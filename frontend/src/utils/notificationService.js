// src/utils/notificationService.js
// Complete Notification Service

const NOTIFICATIONS_KEY = 'homelyserv_notifications';
const NOTIFICATION_SETTINGS_KEY = 'homelyserv_notification_settings';

/**
 * Get all notifications for a user
 */
export const getNotifications = (userId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    return allNotifications.filter(n => n.userId === userId);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = (userId) => {
  try {
    const notifications = getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Add a new notification
 */
export const addNotification = (userId, notification) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    
    const newNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      userId: userId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    allNotifications.push(newNotification);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
    
    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: newNotification 
      }));
    }
    
    return newNotification;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = (notificationId, userId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const updated = allNotifications.map(n => 
      n.id === notificationId && n.userId === userId 
        ? { ...n, read: true } 
        : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = (userId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const updated = allNotifications.map(n => 
      n.userId === userId ? { ...n, read: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = (notificationId, userId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const filtered = allNotifications.filter(n => 
      !(n.id === notificationId && n.userId === userId)
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = (userId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const filtered = allNotifications.filter(n => n.userId !== userId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = (userId) => {
  try {
    const settings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');
    return settings[userId] || {
      newMessage: true,
      hireResponse: true,
      complaintUpdate: true,
      paymentConfirmation: true,
      systemUpdate: false,
      promotional: false
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      newMessage: true,
      hireResponse: true,
      complaintUpdate: true,
      paymentConfirmation: true,
      systemUpdate: false,
      promotional: false
    };
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = (userId, settings) => {
  try {
    const allSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');
    allSettings[userId] = { ...getNotificationSettings(userId), ...settings };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(allSettings));
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
};

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  HIRE_RESPONSE: 'hire_response',
  COMPLAINT_UPDATE: 'complaint_update',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  OFFER_RESPONSE: 'offer_response',
  WORKER_APPLIED: 'worker_applied',
  SYSTEM_UPDATE: 'system_update',
  PROMOTIONAL: 'promotional'
};

// ============================================================
// HELPER FUNCTIONS TO CREATE SPECIFIC NOTIFICATIONS
// ============================================================

export const createNewMessageNotification = (userId, fromUser, message) => {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title: 'New Message',
    message: `New message from ${fromUser}`,
    data: { fromUser, message },
    icon: '💬',
    link: '/employer-messages'
  });
};

export const createHireResponseNotification = (userId, workerName, status) => {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.HIRE_RESPONSE,
    title: status === 'accepted' ? 'Hire Accepted' : 'Hire Rejected',
    message: `${workerName} has ${status} your hire request`,
    data: { workerName, status },
    icon: status === 'accepted' ? '✅' : '❌',
    link: '/my-hires'
  });
};

export const createComplaintUpdateNotification = (userId, complaintId, status) => {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.COMPLAINT_UPDATE,
    title: 'Complaint Update',
    message: `Your complaint #${complaintId} has been ${status}`,
    data: { complaintId, status },
    icon: '📋',
    link: '/employer-complaints'
  });
};

export const createPaymentConfirmationNotification = (userId, amount, workerName) => {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.PAYMENT_CONFIRMATION,
    title: 'Payment Successful',
    message: `Payment of EGP ${amount} for ${workerName} was successful`,
    data: { amount, workerName },
    icon: '💰',
    link: '/employer-payments'
  });
};

export const createWorkerAppliedNotification = (userId, workerName, jobTitle) => {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.WORKER_APPLIED,
    title: 'New Application',
    message: `${workerName} applied for ${jobTitle}`,
    data: { workerName, jobTitle },
    icon: '👤',
    link: '/employer-search'
  });
};

export default {
  getNotifications,
  getUnreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  NOTIFICATION_TYPES,
  createNewMessageNotification,
  createHireResponseNotification,
  createComplaintUpdateNotification,
  createPaymentConfirmationNotification,
  createWorkerAppliedNotification
};