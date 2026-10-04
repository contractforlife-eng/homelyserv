// frontend/src/store/sidebarCountersRequestGate.js
// ============================================================
// SIDEBAR COUNTERS REQUEST GATE
// Tiny dependency-free guard used by sidebarCountersStore.
//
// ROOT CAUSE it fixes:
// The sidebar counters are refreshed from several places at once:
//   - the 30s polling fallback
//   - the immediate refresh dispatched after markMessagesAsRead
//   - Socket.IO `message:new` / `notification:new` events
//   - route changes
// When two GET /api/sidebar/counters requests overlap, the server
// can answer the OLDER request after the NEWER one. The older
// response was computed while a message was still unread, so it
// still contains `messages: 1`. Applying it blindly overwrites the
// fresh `messages: 0` and the badge shows a phantom "1" until the
// next poll.
//
// This gate gives every fetch a monotonically increasing id and lets
// ONLY the newest in-flight request publish its result, so a stale
// response can never clobber a fresher snapshot. It makes no timing
// assumptions (no timeouts, no counter resets) - it is pure ordering.
// ============================================================

/**
 * Create a request gate.
 * @returns {{ next: () => number, isLatest: (id: number) => boolean }}
 */
export function createRequestGate() {
  let latestId = 0;
  return {
    /** Claim the id for a new request. */
    next() {
      latestId += 1;
      return latestId;
    },
    /** True only while `id` is still the newest claimed request. */
    isLatest(id) {
      return id === latestId;
    },
  };
}

export default createRequestGate;
