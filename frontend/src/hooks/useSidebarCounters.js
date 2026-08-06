// frontend/src/hooks/useSidebarCounters.js
// ============================================================
// useSidebarCounters HOOK
// Shared hook used by every sidebar layout (Worker / Employer /
// Admin / Support). Returns the unified sidebar counters and
// keeps them fresh automatically:
//
//   - fetches once on mount (deduped across components)
//   - refetches on route changes (picks up decreases after the
//     user visits a page, e.g. messages marked as read)
//   - refetches in realtime on `notification:new` socket events
//     (every message/offer/hire/payment/complaint action creates
//     a notification through NotificationService)
//   - refetches on the `sidebar-counters:refresh` window event
//     (any page can dispatch it after a relevant action)
//   - 30s polling fallback
// ============================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useSidebarCountersStore from '../store/sidebarCountersStore';
import { onSocketEvent } from '../utils/socket';

const POLL_INTERVAL_MS = 30000;
export const SIDEBAR_COUNTERS_REFRESH_EVENT = 'sidebar-counters:refresh';

const useSidebarCounters = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = user?.id;

  const counters = useSidebarCountersStore((state) => state.counters);
  const fetchCounters = useSidebarCountersStore((state) => state.fetchCounters);

  const location = useLocation();

  // Initial load (and when the authenticated user changes)
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCounters();
    }
  }, [isAuthenticated, userId, fetchCounters]);

  // Refresh after navigation (covers mark-as-read style decreases)
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCounters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Realtime: a new notification implies at least one counter changed
  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;
    const handleNewNotification = () => fetchCounters(true);
    const unsubscribe = onSocketEvent(userId, 'notification:new', handleNewNotification);
    return unsubscribe;
  }, [isAuthenticated, userId, fetchCounters]);

  // Manual refresh: pages can dispatch `sidebar-counters:refresh`
  useEffect(() => {
    const handleRefresh = () => fetchCounters(true);
    window.addEventListener(SIDEBAR_COUNTERS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(SIDEBAR_COUNTERS_REFRESH_EVENT, handleRefresh);
  }, [fetchCounters]);

  // Polling fallback
  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;
    const interval = setInterval(() => fetchCounters(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, userId, fetchCounters]);

  return counters;
};

export default useSidebarCounters;
