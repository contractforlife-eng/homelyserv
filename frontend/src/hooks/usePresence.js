import { useEffect, useState } from 'react';
import api from '../utils/api';
import { getSocket, onSocketEvent } from '../utils/socket';

/**
 * Shared realtime presence hook (presence-only; fully additive to chat).
 *
 * Returns an object keyed by String(userId) -> boolean (true = online).
 * Users with no known state default to OFFLINE (false) — never online.
 *
 * - Initial state comes from the server-authorized presence endpoint, which
 *   only returns flags for counterpart users sharing an authorized
 *   conversation with the caller (privacy: no arbitrary user lookups).
 * - Live transitions arrive via the scoped `presence:update` socket event.
 * - Re-fetches on socket reconnect so state self-heals.
 * - Does not touch message:new, typing, read, or optimistic message logic.
 */
const usePresence = (userIds, authUserId) => {
  const normalizedKey = Array.from(
    new Set((userIds || []).map(String).filter(Boolean))
  ).sort().join(',');
  const [presence, setPresence] = useState({});

  // Initial (and reconnect-refreshed) presence for the requested IDs.
  useEffect(() => {
    if (!authUserId || !normalizedKey) {
      return undefined;
    }
    let cancelled = false;
    const ids = normalizedKey.split(',');

    const fetchInitialPresence = () => {
      api
        .get(`/api/chat/presence?userIds=${encodeURIComponent(ids.join(','))}`)
        .then((response) => {
          if (cancelled) return;
          const next = {};
          for (const id of ids) {
            next[id] = response.data?.presence?.[id] === true;
          }
          setPresence(next);
        })
        .catch(() => {
          if (cancelled) return;
          // Fail safe: unknown state must be OFFLINE, never online.
          const next = {};
          for (const id of ids) {
            next[id] = false;
          }
          setPresence(next);
        });
    };

    fetchInitialPresence();

    // Re-fetch when the socket (re)connects so presence self-heals.
    const socket = getSocket(authUserId);
    if (socket) {
      socket.on('connect', fetchInitialPresence);
    }

    return () => {
      cancelled = true;
      if (socket) {
        socket.off('connect', fetchInitialPresence);
      }
    };
  }, [authUserId, normalizedKey]);

  // Live presence transitions (server-scoped to authorized observers only).
  useEffect(() => {
    if (!authUserId) return undefined;
    const unsubscribe = onSocketEvent(authUserId, 'presence:update', (payload) => {
      if (!payload || payload.userId === undefined || payload.userId === null) return;
      const id = String(payload.userId);
      setPresence((prev) => ({ ...prev, [id]: payload.isOnline === true }));
    });
    return unsubscribe;
  }, [authUserId]);

  return presence;
};

export default usePresence;
