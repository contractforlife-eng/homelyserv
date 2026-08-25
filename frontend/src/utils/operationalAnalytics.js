import { Capacitor } from '@capacitor/core';
import { API_BASE } from '../config/api';

const INSTALL_ID_KEY = 'homelyserv_operational_analytics_id';
const EVENT_MARKER_PREFIX = 'homelyserv_operational_analytics_sent:';

const getInstallId = () => {
  try {
    let value = localStorage.getItem(INSTALL_ID_KEY);
    if (!value) {
      value = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(INSTALL_ID_KEY, value);
    }
    return value;
  } catch {
    return null;
  }
};

const utcDayKey = () => new Date().toISOString().slice(0, 10);

export const getOperationalAnalyticsDedupeKey = () => {
  const installId = getInstallId();
  return installId ? `${installId}:${utcDayKey()}` : null;
};

const analyticsApiBase = API_BASE.replace(/\/$/, '').replace(/\/api$/, '');

export const getAnalyticsSource = () => (Capacitor.isNativePlatform() ? 'android' : 'web');

export const trackOperationalAnalytics = (eventType, source = getAnalyticsSource()) => {
  if (!['LOGIN_PAGE_VIEW', 'APK_DOWNLOAD'].includes(eventType)) return;
  if (!['web', 'android'].includes(source)) return;

  const dedupeKey = getOperationalAnalyticsDedupeKey();
  if (!dedupeKey) return;

  const dayKey = utcDayKey();
  const marker = `${EVENT_MARKER_PREFIX}${eventType}:${source}:${dayKey}`;

  try {
    if (sessionStorage.getItem(marker) === '1') return;
    sessionStorage.setItem(marker, '1');
  } catch {
    // The server-side unique key remains the duplicate protection fallback.
  }

  fetch(`${analyticsApiBase}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, source, dedupeKey }),
    keepalive: true,
  }).catch(() => {});
};
