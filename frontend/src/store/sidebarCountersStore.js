// frontend/src/store/sidebarCountersStore.js
// ============================================================
// SIDEBAR COUNTERS STORE (zustand)
// Shared, app-wide state for the unified sidebar badges.
// Every sidebar layout reads from this single store, so only
// ONE request to /api/sidebar/counters is needed regardless
// of how many sidebar items render badges.
// ============================================================
import { create } from 'zustand';
import { getSidebarCounters, EMPTY_SIDEBAR_COUNTERS } from '../services/sidebarService';
import { createRequestGate } from './sidebarCountersRequestGate';

// Bursts of triggers (mount + socket event + navigation) are
// collapsed into a single fetch within this window.
const FETCH_DEDUPE_MS = 5000;

// Guarantees only the newest in-flight request may publish its result.
// Prevents an older response (computed while a message was still unread)
// from overwriting a fresher one after markMessagesAsRead, which caused
// the phantom "1" unread badge.
const requestGate = createRequestGate();

const useSidebarCountersStore = create((set, get) => ({
  counters: { ...EMPTY_SIDEBAR_COUNTERS },
  lastFetchedAt: 0,

  /**
   * Fetch the latest counters.
   * @param {boolean} force - bypass the dedupe window (realtime
   *                          events, manual refreshes).
   */
  fetchCounters: async (force = false) => {
    if (!force && Date.now() - get().lastFetchedAt < FETCH_DEDUPE_MS) {
      return;
    }
    const requestId = requestGate.next();
    set({ lastFetchedAt: Date.now() });
    const counters = await getSidebarCounters();
    // Ignore stale responses that resolved out of order: only the newest
    // request is allowed to update the counters.
    if (!requestGate.isLatest(requestId)) {
      return;
    }
    set({ counters });
  },

  reset: () => set({ counters: { ...EMPTY_SIDEBAR_COUNTERS }, lastFetchedAt: 0 }),
}));

export default useSidebarCountersStore;
