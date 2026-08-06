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
};

const toCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

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
    };
  } catch (error) {
    console.error('Error fetching sidebar counters:', error);
    return { ...EMPTY_SIDEBAR_COUNTERS };
  }
}

export default { getSidebarCounters, EMPTY_SIDEBAR_COUNTERS };
