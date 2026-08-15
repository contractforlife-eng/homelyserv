// frontend/src/utils/socket.js
// ============================================================
// SOCKET.IO CLIENT UTILITY
// Provides a singleton socket connection for realtime events.
// Used by NotificationBell to receive realtime notifications.
//
// Design:
//   - Singleton socket (one connection per user session)
//   - Tracks registered handlers to prevent duplicate listeners
//     (important for React StrictMode double-effect)
//   - Auto-reconnects via socket.io-client
//   - Joins user_{userId} room to receive personal notifications
// ============================================================
import { io } from 'socket.io-client';

let socket = null;
let currentUserId = null;
// Track registered (event, handler) pairs to prevent duplicates
const registeredHandlers = new Set();

/**
 * Get (or create) the singleton socket connection for a user.
 * Joins the user's personal notification room on connect.
 */
export const getSocket = (userId) => {
  if (!userId) return null;

  // Reuse existing socket for the same user
  if (socket && currentUserId === userId) {
    return socket;
  }

  // Switch user: disconnect old socket and clear handlers
  if (socket) {
    socket.disconnect();
    socket = null;
    registeredHandlers.clear();
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  socket = io(API_URL, {
    auth: { token: localStorage.getItem('homelyserv_token') },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  currentUserId = userId;

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    // Join the user's personal notification room
    socket.emit('join_user_room', userId);
  });

  socket.on('reconnect', () => {
    console.log('🔌 Socket reconnected:', socket.id);
    // Re-join the room after reconnection
    socket.emit('join_user_room', userId);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.warn('⚠️ Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Disconnect the socket (e.g. on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
    registeredHandlers.clear();
  }
};

/**
 * Subscribe to a socket event.
 * Guards against duplicate listeners for the same (event, handler).
 * Returns an unsubscribe function.
 */
export const onSocketEvent = (userId, event, handler) => {
  const s = getSocket(userId);
  if (!s) return () => {};

  // Create a stable key to detect duplicates
  const key = `${event}::${handler.toString()}`;
  if (!registeredHandlers.has(key)) {
    s.on(event, handler);
    registeredHandlers.add(key);
  }

  return () => {
    if (registeredHandlers.has(key)) {
      s.off(event, handler);
      registeredHandlers.delete(key);
    }
  };
};

export default { getSocket, disconnectSocket, onSocketEvent };
