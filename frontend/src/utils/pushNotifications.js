import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

const CHANNELS = [
  { id: 'messages', name: 'Messages', description: 'Chat messages', importance: 4 },
  { id: 'jobs_offers', name: 'Jobs & Offers', description: 'Job offers and updates', importance: 4 },
  { id: 'hire', name: 'Hire Updates', description: 'Hire status changes', importance: 4 },
  { id: 'payments', name: 'Payments', description: 'Payment confirmations', importance: 4 },
  { id: 'system', name: 'System', description: 'Account and system updates', importance: 3 },
];

let channelsCreated = false;
let initialized = false;
let listenersSetup = false;
let currentToken = null;
let pendingPushAction = null;

async function ensureChannels() {
  if (channelsCreated) return;
  for (const channel of CHANNELS) {
    try {
      await PushNotifications.createChannel(channel);
    } catch (err) {
      console.warn('[Push] Failed to create channel', channel.id, err);
    }
  }
  channelsCreated = true;
}

async function checkAndRequestPermission() {
  let status = await PushNotifications.checkPermissions();
  if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
    status = await PushNotifications.requestPermissions();
  }
  return status.receive === 'granted';
}

async function registerTokenWithBackend(token) {
  try {
    const response = await api.post('/api/notifications/devices', {
      token,
      platform: 'android',
      tokenType: 'fcm',
    });
    if (response.data?.success) {
      console.log('[Push] Token registered with backend');
    }
  } catch (err) {
    console.error('[Push] Backend registration failed:', err.message);
  }
}

export function setPendingPushAction(action) {
  pendingPushAction = action;
}

export function getPendingPushAction() {
  return pendingPushAction;
}

export function clearPendingPushAction() {
  pendingPushAction = null;
}

function handlePushAction(notification) {
  const data = notification.data || {};
  if (data.type === 'NEW_MESSAGE' && data.conversationId) {
    pendingPushAction = {
      conversationId: String(data.conversationId),
      senderId: data.senderId ? String(data.senderId) : null,
    };
    console.log('[Push] NEW_MESSAGE tap pending:', pendingPushAction.conversationId);
  } else if (data.type === 'NEW_OFFER' && data.offerId) {
    pendingPushAction = {
      type: 'NEW_OFFER',
      offerId: String(data.offerId),
    };
    console.log('[Push] NEW_OFFER tap pending:', pendingPushAction.offerId);
  } else if (data.type === 'NEW_APPLICATION' && data.applicationId) {
    pendingPushAction = {
      type: 'NEW_APPLICATION',
      applicationId: String(data.applicationId),
      jobPostId: data.jobPostId ? String(data.jobPostId) : null,
    };
    console.log('[Push] NEW_APPLICATION tap pending:', pendingPushAction.applicationId);
  } else if (data.type === 'APPLICATION_STATUS_UPDATE' && data.applicationId) {
    pendingPushAction = {
      type: 'APPLICATION_STATUS_UPDATE',
      applicationId: String(data.applicationId),
      jobPostId: data.jobPostId ? String(data.jobPostId) : null,
    };
    console.log('[Push] APPLICATION_STATUS_UPDATE tap pending:', pendingPushAction.applicationId);
  } else if (data.type === 'OFFER_ACCEPTED' && data.offerId) {
    pendingPushAction = {
      type: 'OFFER_ACCEPTED',
      offerId: String(data.offerId),
    };
    console.log('[Push] OFFER_ACCEPTED tap pending:', pendingPushAction.offerId);
  } else if (data.type === 'OFFER_REJECTED' && data.offerId) {
    pendingPushAction = {
      type: 'OFFER_REJECTED',
      offerId: String(data.offerId),
    };
    console.log('[Push] OFFER_REJECTED tap pending:', pendingPushAction.offerId);
  } else if (data.type === 'OFFER_STATUS_UPDATE' && data.offerId) {
    pendingPushAction = {
      type: 'OFFER_STATUS_UPDATE',
      offerId: String(data.offerId),
    };
    console.log('[Push] OFFER_STATUS_UPDATE tap pending:', pendingPushAction.offerId);
  } else if (data.type === 'HIRE_STATUS_UPDATE' && data.hireId) {
    pendingPushAction = {
      type: 'HIRE_STATUS_UPDATE',
      hireId: String(data.hireId),
    };
    console.log('[Push] HIRE_STATUS_UPDATE tap pending:', pendingPushAction.hireId);
  } else if (data.type === 'PAYMENT_SUCCESS' && data.hireId) {
    pendingPushAction = {
      type: 'PAYMENT_SUCCESS',
      hireId: String(data.hireId),
    };
    console.log('[Push] PAYMENT_SUCCESS tap pending:', pendingPushAction.hireId);
  } else {
    console.log('[Push] Action performed:', notification.actionId, notification);
  }
}

export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Skipped: not a native platform');
    return;
  }

  if (initialized) {
    console.log('[Push] Already initialized');
    return;
  }

  try {
    const hasPermission = await checkAndRequestPermission();
    if (!hasPermission) {
      console.warn('[Push] Notification permission not granted');
      return;
    }

    await PushNotifications.register();
    await ensureChannels();
    initialized = true;
    console.log('[Push] Registration initiated');
  } catch (err) {
    console.error('[Push] Initialization failed:', err);
  }
}

export function setupPushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  if (listenersSetup) return;

  PushNotifications.addListener('registration', async (token) => {
    currentToken = token.value;
    if (import.meta.env.DEV) {
      console.info('[Push] Registration token:', token.value);
    }
    console.log('[Push] Registration success');
    localStorage.setItem('homelyserv_push_token', token.value);
    await registerTokenWithBackend(token.value);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push] Registration error:', err.error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Received in foreground:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    handlePushAction(notification);
  });

  listenersSetup = true;
}

export async function revokeCurrentDeviceToken() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const token = currentToken || localStorage.getItem('homelyserv_push_token');
  if (!token) {
    return;
  }

  try {
    await api.post('/api/notifications/devices/revoke', { token });
    console.log('[Push] Device token revoked on logout');
  } catch (err) {
    console.error('[Push] Device revocation failed:', err.message);
  } finally {
    currentToken = null;
    localStorage.removeItem('homelyserv_push_token');
  }
}
