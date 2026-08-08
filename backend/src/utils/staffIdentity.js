// backend/src/utils/staffIdentity.js
// ============================================================
// GLOBAL DYNAMIC STAFF IDENTITY SYSTEM (Backend)
// ============================================================
// Single source of truth for resolving the REAL identity of any
// user (staff or otherwise) from the database.
//
// Rules enforced here:
//   1. Identity ALWAYS comes from the database via the userId
//      attached by the authentication middleware (req.userId).
//   2. Never trust client-passed names/roles (localStorage, body).
//   3. Never hardcode staff names. Missing users fall back to a
//      neutral generic label only as a last resort.
//   4. Works automatically for any future support/admin employee
//      with zero code changes.
// ============================================================
import prisma from '../lib/prisma.js';

// Roles considered "staff" (support / admin family).
export const STAFF_ROLES = ['SUPPORT', 'ADMIN', 'SUP_ADMIN'];

// MongoDB ObjectId guard. Legacy records may contain non-ObjectId
// ids (e.g. "user_1784367005840") which crash Prisma with P2023.
export const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Serialize a Prisma user record into the canonical public identity
 * shape used across every API response:
 *   { id, name, fullName, role, image, email }
 */
export const toIdentityObject = (user) => {
  if (!user) return null;
  return {
    id: String(user.id),
    name: user.fullName || 'User',
    fullName: user.fullName || 'User',
    role: user.role || 'USER',
    image: user.profileImage || user.image || null,
    email: user.email || null,
  };
};

/**
 * Resolve a single user's identity from the database.
 * Returns null when the id is missing/invalid or the user no
 * longer exists. Never throws.
 */
export const getUserIdentity = async (userId) => {
  if (!userId || !isValidObjectId(String(userId))) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, fullName: true, role: true, profileImage: true, email: true },
    });
    return toIdentityObject(user);
  } catch (error) {
    console.error('❌ staffIdentity: failed to resolve user identity:', error.message);
    return null;
  }
};

/**
 * Batch-resolve identities for many user ids in ONE query.
 * Returns a Map keyed by String(userId) -> identity object.
 * Invalid/legacy ids are silently skipped. Never throws.
 */
export const getUserIdentities = async (userIds = []) => {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean).map(String))].filter(isValidObjectId);
  const map = new Map();
  if (uniqueIds.length === 0) return map;

  try {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, fullName: true, role: true, profileImage: true, email: true },
    });
    for (const user of users) {
      map.set(String(user.id), toIdentityObject(user));
    }
  } catch (error) {
    console.error('❌ staffIdentity: failed to batch-resolve identities:', error.message);
  }
  return map;
};

/**
 * Resolve the identity of the AUTHENTICATED user performing the
 * current request. This is the ONLY way staff-authored records
 * (complaint replies, notes, timeline events, chat messages)
 * should obtain the creator/sender name and role.
 *
 * @param {object} req - Express request (after auth middleware)
 * @param {string} fallbackName - last-resort label if user vanished
 * @returns {{id: string, name: string, role: string, image: string|null}}
 */
export const resolveRequestIdentity = async (req, fallbackName = 'User') => {
  const identity = await getUserIdentity(req.userId);
  return {
    id: String(req.userId),
    name: identity?.name || fallbackName,
    role: identity?.role || req.userRole || 'USER',
    image: identity?.image || null,
  };
};

/**
 * Check whether a role belongs to staff (support/admin family).
 */
export const isStaffRole = (role) =>
  STAFF_ROLES.includes((role || '').toUpperCase());

/**
 * Enrich chat message objects with LIVE sender/recipient identities
 * from the database. Stored senderName/senderRole are kept only as
 * a fallback for legacy/orphaned records, so old messages display
 * the correct current name automatically.
 *
 * Works on plain objects shaped like:
 *   { senderId, senderName, senderRole, recipientId, recipientName, ... }
 *
 * @param {Array<object>} messages
 * @returns {Promise<Array<object>>} new array (input untouched)
 */
export const enrichMessageIdentities = async (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) return messages;

  const ids = new Set();
  for (const msg of messages) {
    if (msg.senderId) ids.add(String(msg.senderId));
    if (msg.recipientId) ids.add(String(msg.recipientId));
  }
  const identityMap = await getUserIdentities([...ids]);

  return messages.map((msg) => {
    const sender = msg.senderId ? identityMap.get(String(msg.senderId)) : null;
    const recipient = msg.recipientId ? identityMap.get(String(msg.recipientId)) : null;
    return {
      ...msg,
      senderName: sender?.name || msg.senderName || 'User',
      senderRole: sender?.role || msg.senderRole || 'USER',
      recipientName: recipient?.name || msg.recipientName || 'User',
      sender: sender
        ? { id: sender.id, name: sender.name, role: sender.role, image: sender.image }
        : msg.senderId
          ? { id: String(msg.senderId), name: msg.senderName || 'User', role: msg.senderRole || 'USER' }
          : undefined,
    };
  });
};

/**
 * Enrich complaint-style author records (replies, notes, timeline
 * events) with LIVE author identities from the database.
 *
 * Works on plain objects shaped like:
 *   { authorId, authorName, authorRole, ... }
 *
 * Adds a normalized `author: { id, name, role, image }` object and
 * refreshes authorName/authorRole from the live record.
 *
 * @param {Array<object>} items
 * @returns {Promise<Array<object>>} new array (input untouched)
 */
export const enrichAuthorIdentities = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return items;

  const ids = items.map((item) => item?.authorId).filter(Boolean);
  const identityMap = await getUserIdentities(ids);

  return items.map((item) => {
    const author = item?.authorId ? identityMap.get(String(item.authorId)) : null;
    return {
      ...item,
      authorName: author?.name || item.authorName || 'User',
      authorRole: author?.role || item.authorRole || 'USER',
      author: author
        ? { id: author.id, name: author.name, role: author.role, image: author.image }
        : item?.authorId
          ? { id: String(item.authorId), name: item.authorName || 'User', role: item.authorRole || 'USER' }
          : null,
    };
  });
};

export default {
  STAFF_ROLES,
  isValidObjectId,
  toIdentityObject,
  getUserIdentity,
  getUserIdentities,
  resolveRequestIdentity,
  isStaffRole,
  enrichMessageIdentities,
  enrichAuthorIdentities,
};
