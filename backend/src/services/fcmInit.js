import admin from 'firebase-admin';

let messaging = null;
let initialized = false;
let disabled = false;
let disableReason = null;

function parseServiceAccount(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed.type || !parsed.project_id || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getMessaging() {
  if (disabled) return null;
  return messaging;
}

export function isFcmDisabled() {
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
