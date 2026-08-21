export const TRACKING_CONSENT_KEY = 'homelyserv_tracking_consent';
export const TRACKING_CONSENT_CHANGED_EVENT = 'homelyserv:tracking-consent-changed';

const VALID_CONSENTS = new Set(['accepted', 'rejected']);
const listeners = new Set();

export function getTrackingConsent() {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const value = window.localStorage.getItem(TRACKING_CONSENT_KEY);
    return VALID_CONSENTS.has(value) ? value : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function setTrackingConsent(value) {
  if (!VALID_CONSENTS.has(value) || typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(TRACKING_CONSENT_KEY, value);
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener(value));
  if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
    window.dispatchEvent(new window.CustomEvent(TRACKING_CONSENT_CHANGED_EVENT, { detail: value }));
  }
  return true;
}

export function subscribeTrackingConsent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasTrackingConsent() {
  return getTrackingConsent() === 'accepted';
}
