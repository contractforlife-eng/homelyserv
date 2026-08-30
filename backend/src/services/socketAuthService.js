import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtSecret.js';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

export const privateUserRoom = (userId) => `user_${String(userId)}`;

export const verifySocketToken = async (token) => {
  if (!token || typeof token !== 'string') throw new Error('SOCKET_AUTH_REQUIRED');
  const decoded = jwt.verify(token, getJwtSecret());
  const userId = decoded.userId || decoded.id || decoded.email;
  if (!userId) throw new Error('SOCKET_AUTH_INVALID');

  let user = null;
  if (isValidObjectId(String(userId))) {
    user = await User.findById(String(userId)).select('role tokenVersion isSuspended');
    if (!user) throw new Error('SOCKET_AUTH_USER_NOT_FOUND');
    if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      throw new Error('SOCKET_AUTH_TOKEN_VERSION');
    }
    if (user.isSuspended === true) throw new Error('SOCKET_AUTH_ACCOUNT_SUSPENDED');
  }

  return {
    userId: String(user?._id || userId),
    role: user?.role || decoded.role || decoded.userRole,
    authContext: decoded.authContext || null
  };
};

export const createSocketAuthMiddleware = (verifyToken = verifySocketToken) => async (socket, next) => {
  const token = socket.handshake?.auth?.token;
  if (!token) {
    if (socket.handshake?.auth?.publicSupport === true) return next();
    return next(new Error('Authentication required'));
  }
  try {
    socket.user = await verifyToken(token);
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
};

export const joinAuthenticatedUserRoom = (socket) => {
  if (!socket.user?.userId) return false;
  socket.join(privateUserRoom(socket.user.userId));
  return true;
};

/**
 * Generic `join_room` policy.
 *
 * Generic room joining is available only to authenticated sockets with a
 * server-derived `socket.user.userId`. Unauthenticated public-support guest
 * sockets are NOT allowed to use generic `join_room`; their only room access
 * goes through the dedicated, verified `public-support:join-guest` flow.
 *
 * For authenticated sockets, only the socket's own derived private room is
 * joinable here. Conversation and support rooms use dedicated handlers that
 * perform their own authorization checks.
 *
 * Returns true when the requested room was joined, false otherwise.
 */
export const joinGenericRoom = (socket, roomId) => {
  if (!socket.user?.userId) return false;

  if (typeof roomId !== 'string' || roomId.startsWith('user_')) {
    if (roomId === privateUserRoom(socket.user.userId)) {
      socket.join(roomId);
      return true;
    }
    return false;
  }

  return false;
};
