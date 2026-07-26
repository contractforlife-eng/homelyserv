const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

async function authHeaders() {
  const token = localStorage.getItem('homelyserv_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Notification API error');
  }
  return res.json();
}

export async function getNotifications() {
  const res = await fetch(`${apiBase}/api/notifications`, { headers: await authHeaders() });
  const data = await handleResponse(res);
  return (data.notifications || []).map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.body || n.message,
    time: n.createdAt,
    read: n.isRead,
    link: '/worker/offers'
  }));
}

export async function getUnreadCount() {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.read).length;
}

export async function addNotification(notification) {
  const res = await fetch(`${apiBase}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify(notification)
  });
  const data = await handleResponse(res);
  return data.notification;
}

export async function markAsRead(notificationId) {
  const res = await fetch(`${apiBase}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() }
  });
  return handleResponse(res);
}

export async function markAllAsRead() {
  const res = await fetch(`${apiBase}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: await authHeaders()
  });
  return handleResponse(res);
}

export async function deleteNotification(notificationId) {
  const res = await fetch(`${apiBase}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: await authHeaders()
  });
  return handleResponse(res);
}

export async function clearAllNotifications() {
  const res = await fetch(`${apiBase}/api/notifications`, {
    method: 'DELETE',
    headers: await authHeaders()
  });
  return handleResponse(res);
}

export async function getNotificationSettings() {
  const res = await fetch(`${apiBase}/api/notifications/settings`, { headers: await authHeaders() });
  const data = await handleResponse(res);
  return data.settings || {
    newMessage: true,
    hireResponse: true,
    complaintUpdate: true,
    paymentConfirmation: true,
    systemUpdate: false,
    promotional: false
  };
}

export async function updateNotificationSettings(settings) {
  const res = await fetch(`${apiBase}/api/notifications/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ settings })
  });
  return handleResponse(res);
}

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

export async function createNewMessageNotification(userId, fromUser, message) {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title: 'New Message',
    message: `New message from ${fromUser}`,
    data: { fromUser, message },
    icon: '💬',
    link: '/employer-messages'
  });
}

export async function createHireResponseNotification(userId, workerName, status) {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.HIRE_RESPONSE,
    title: status === 'accepted' ? 'Hire Accepted' : 'Hire Rejected',
    message: `${workerName} has ${status} your hire request`,
    data: { workerName, status },
    icon: status === 'accepted' ? '✅' : '❌',
    link: '/my-hires'
  });
}

export async function createComplaintUpdateNotification(userId, complaintId, status) {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.COMPLAINT_UPDATE,
    title: 'Complaint Update',
    message: `Your complaint #${complaintId} has been ${status}`,
    data: { complaintId, status },
    icon: '📋',
    link: '/employer-complaints'
  });
}

export async function createPaymentConfirmationNotification(userId, amount, workerName) {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.PAYMENT_CONFIRMATION,
    title: 'Payment Successful',
    message: `Payment of EGP ${amount} for ${workerName} was successful`,
    data: { amount, workerName },
    icon: '💰',
    link: '/employer-payments'
  });
}

export async function createWorkerAppliedNotification(userId, workerName, jobTitle) {
  return addNotification(userId, {
    type: NOTIFICATION_TYPES.WORKER_APPLIED,
    title: 'New Application',
    message: `${workerName} applied for ${jobTitle}`,
    data: { workerName, jobTitle },
    icon: '👤',
    link: '/employer-search'
  });
}

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
