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

export async function checkPushPermissionStatus() {
  if (!Capacitor.isNativePlatform()) return 'granted';
  try {
    const status = await PushNotifications.checkPermissions();
    return status.receive;
  } catch (err) {
    console.warn('[Push] Failed to check permissions:', err);
    return 'denied';
  }
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
  pendingPushAction = {
    ...data,
    type: data.type || 'SYSTEM',
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    link: data.link || null,
    conversationId: data.conversationId || (data.entityType === 'MESSAGE' ? data.entityId : null),
    offerId: data.offerId || (data.entityType === 'OFFER' ? data.entityId : null),
    applicationId: data.applicationId || (data.entityType === 'JOB_APPLICATION' ? data.entityId : null),
    hireId: data.hireId || (data.entityType === 'HIRE' ? data.entityId : null),
  };
  console.log('[Push] Push action parsed and pending:', pendingPushAction);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('push-action', { detail: pendingPushAction }));
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
