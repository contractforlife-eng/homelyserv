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

// Bursts of triggers (mount + socket event + navigation) are
// collapsed into a single fetch within this window.
const FETCH_DEDUPE_MS = 5000;

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
    set({ lastFetchedAt: Date.now() });
    const counters = await getSidebarCounters();
    set({ counters });
  },

  reset: () => set({ counters: { ...EMPTY_SIDEBAR_COUNTERS }, lastFetchedAt: 0 }),
}));

export default useSidebarCountersStore;
