// backend/src/lib/socket.js
// ============================================================
// SHARED SOCKET.IO INSTANCE
// Provides a way for services (e.g. NotificationService) to emit
// realtime events to connected clients without importing io
// directly from index.js (avoids circular deps).
// ============================================================

let io = null;

/**
 * Set the Socket.IO server instance (called from index.js).
 */
export const setIo = (socketIo) => {
  io = socketIo;
};

/**
 * Get the Socket.IO server instance.
 */
export const getIo = () => io;

/**
 * Emit an event to a specific user's room.
 * The frontend joins a room with their userId.
 */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  try {
    io.to(`user_${userId}`).emit(event, payload);
  } catch (error) {
    console.error(`❌ Socket emit error to user ${userId}:`, error.message);
  }
};

/**
 * Emit an event to every connected client.
 */
export const emitToAll = (event, payload) => {
  if (!io) return;
  try {
    io.emit(event, payload);
  } catch (error) {
    console.error(`❌ Socket emit error (all):`, error.message);
  }
};

export default { setIo, getIo, emitToUser, emitToAll };