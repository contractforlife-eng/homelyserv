// PRESENCE-ONLY: in-memory registry of authenticated socket connections.
// Map<userId, Set<socketId>> — nothing here touches messages, typing, or
// read logic. No database writes, no schema changes, no lastSeen.
import Conversation from '../models/Conversation.js';

const onlineSockets = new Map();

// True only when the user has at least one active authenticated socket.
export const isUserOnline = (userId) => {
  const sockets = onlineSockets.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
};

// Returns true only when this socket is the user's FIRST active socket
// (OFFLINE -> ONLINE transition). Additional tabs/devices keep them ONLINE.
export const addPresenceSocket = (userId, socketId) => {
  const key = String(userId);
  const wasOnline = isUserOnline(key);
  let sockets = onlineSockets.get(key);
  if (!sockets) {
    sockets = new Set();
    onlineSockets.set(key, sockets);
  }
  sockets.add(String(socketId));
  return !wasOnline;
};

// Returns true only when the user's LAST active socket disappears
// (ONLINE -> OFFLINE transition). Removing one of several sockets keeps the
// user ONLINE. Empty sets are cleaned up.
export const removePresenceSocket = (userId, socketId) => {
  const key = String(userId);
  const sockets = onlineSockets.get(key);
  if (!sockets) return false;
  sockets.delete(String(socketId));
  if (sockets.size === 0) {
    onlineSockets.delete(key);
    return true;
  }
  return false;
};

// Online flags for an explicit list of user IDs (caller must authorize them).
export const getOnlineUserIds = (userIds) =>
  (userIds || []).map(String).filter((id) => isUserOnline(id));

// Users allowed to observe `userId`'s presence: counterparts of existing
// authorized conversations (participantIds / staffIds / supportAgentId).
// Read-only membership lookup — does not modify any authorization logic.
// The user themself is included so their own other tabs/devices stay in sync.
export const getAuthorizedObserverIds = async (userId) => {
  const id = String(userId);
  const conversations = await Conversation.find({
    $or: [
      { participantIds: id },
      { staffIds: id },
      { supportAgentId: id },
    ],
  })
    .select('participantIds staffIds supportAgentId')
    .lean();

  const observers = new Set([id]);
  for (const conversation of conversations) {
    for (const participantId of [
      ...(conversation.participantIds || []),
      ...(conversation.staffIds || []),
    ]) {
      if (participantId && String(participantId) !== id) {
        observers.add(String(participantId));
      }
    }
    if (conversation.supportAgentId && String(conversation.supportAgentId) !== id) {
      observers.add(String(conversation.supportAgentId));
    }
  }
  return [...observers];
};
