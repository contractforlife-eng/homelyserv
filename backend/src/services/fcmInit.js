import admin from 'firebase-admin';

let messaging = null;
let initialized = false;
let disabled = false;
let disableReason = null;

export function parseServiceAccount(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Try direct JSON parsing
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.type && parsed.project_id && parsed.private_key) return parsed;
  } catch {
    // Fall through to Base64 attempt
  }

  // 2. Try Base64 decoding if input does not start with JSON object syntax
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
    if (decoded.startsWith('{') && decoded.endsWith('}')) {
      const parsed = JSON.parse(decoded);
      if (parsed.type && parsed.project_id && parsed.private_key) return parsed;
    }
  } catch {
    // Invalid Base64 or decoded content is not valid JSON
  }

  return null;
}

export function getMessaging() {
  if (disabled) return null;
  return messaging;
}

export function isFcmDisabled() {
  if (process.env.FCM_DISABLE === 'true' || process.env.FCM_DISABLE === '1') {
    return true;
  }
  return disabled;
}

export function getFcmDisableReason() {
  return disableReason;
}

export async function initializeFcm() {
  if (initialized) return;

  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  const credentials = parseServiceAccount(raw);

  if (!credentials) {
    disabled = true;
    disableReason = 'FCM_SERVICE_ACCOUNT_JSON is missing or invalid';
    console.warn('⚠️  FCM disabled: FCM_SERVICE_ACCOUNT_JSON is missing or invalid. Push notifications will not be sent.');
    initialized = true;
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    }
    messaging = admin.messaging();
    initialized = true;
    console.log('✅ Firebase Admin initialized for FCM');
  } catch (error) {
    disabled = true;
    disableReason = error.message;
    console.error('❌ Firebase Admin initialization failed:', error.message);
    initialized = true;
  }
}
