// frontend/src/services/sidebarService.js
// ============================================================
// SIDEBAR SERVICE - Frontend API client for the unified
// sidebar activity counters (GET /api/sidebar/counters).
// Single request returns every counter for the current user.
// ============================================================
import api from '../utils/api';

export const EMPTY_SIDEBAR_COUNTERS = {
  messages: 0,
  notifications: 0,
  offers: 0,
  hires: 0,
  payments: 0,
  complaints: 0,
  users: 0,
};

const toCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Window event name used to ask every mounted sidebar to refetch the
 * counters immediately. Declared here (next to the counters themselves)
 * so non-React callers such as chatService can trigger a refresh without
 * importing a hook.
 */
export const SIDEBAR_COUNTERS_REFRESH_EVENT = 'sidebar-counters:refresh';

/**
 * Ask the mounted sidebars to refresh the unread/counter badges right
 * away. Used after a state-changing action that the backend counter can
 * already resolve (e.g. marking a conversation as read), so the badge
 * drops to zero without waiting for the polling interval.
 */
export function requestSidebarCountersRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SIDEBAR_COUNTERS_REFRESH_EVENT));
}

/**
 * Fetch all sidebar counters for the authenticated user.
 * Never throws - returns zeroed counters on failure so the
 * sidebar simply hides its badges.
 */
export async function getSidebarCounters() {
  try {
    const res = await api.get('/api/sidebar/counters');
    const data = res?.data || {};
    return {
      messages: toCount(data.messages),
      notifications: toCount(data.notifications),
      offers: toCount(data.offers),
      hires: toCount(data.hires),
      payments: toCount(data.payments),
      complaints: toCount(data.complaints),
      users: toCount(data.users),
    };
  } catch (error) {
    console.error('Error fetching sidebar counters:', error);
    return { ...EMPTY_SIDEBAR_COUNTERS };
  }
}

export default {
  getSidebarCounters,
  EMPTY_SIDEBAR_COUNTERS,
  SIDEBAR_COUNTERS_REFRESH_EVENT,
  requestSidebarCountersRefresh,
};
