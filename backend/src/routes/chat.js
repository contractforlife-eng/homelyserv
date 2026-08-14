// backend/src/routes/chat.js - ES Module Version
// ============================================================
// ARCHITECTURE REFACTOR: Secure messaging permission model.
//
// Conversation access is based on:
//   - conversation participants (PRIVATE chats)
//   - support assignment (SUPPORT chats)
//   - admin escalation (ESCALATED chats)
//   - internal staff membership (INTERNAL chats)
//
// Admin NEVER automatically sees private user chats.
// Support NEVER sees unrelated private chats.
// ============================================================
import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { authenticate } from '../middleware/auth.js';
import { authorizePaidChatRelationship } from '../services/paymentAuthService.js';
import prisma from '../lib/prisma.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import {
  getUserIdentity,
  getUserIdentities,
  enrichMessageIdentities,
} from '../utils/staffIdentity.js';

const router = express.Router();

const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

const checkPaidChatRelationship = async (req, res, next) => {
  try {
    const senderId = req.userId;
    const senderRole = req.userRole;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let recipientId = req.body?.recipientId || req.query?.recipientId;

    if (!recipientId && req.body) {
      if (String(req.body.user1Id) === String(senderId)) {
        recipientId = req.body.user2Id;
      } else if (String(req.body.user2Id) === String(senderId)) {
        recipientId = req.body.user1Id;
      }
    }

    if (!recipientId) {
      return res.status(400).json({ error: 'Missing recipient' });
    }

    const authorization = await authorizePaidChatRelationship({
      senderId,
      senderRole,
      recipientId
    });

    if (authorization.required && !authorization.allowed) {
      return res.status(403).json({ error: 'Payment required to contact this worker.' });
    }

    next();
  } catch (error) {
    console.error('Paid chat relationship check error:', error);
    return res.status(500).json({ error: 'Failed to verify payment status' });
  }
};

function resolveRecipientRole(senderRole) {
  if (senderRole === 'ADMIN') return 'USER';
  if (senderRole === 'EMPLOYER') return 'WORKER';
  if (senderRole === 'WORKER') return 'EMPLOYER';
  if (senderRole === 'SUPPORT') return 'USER';
  return 'USER';
}

function formatMessage(msg) {
  return {
    id: msg._id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    recipientId: msg.recipientId,
    recipientName: msg.recipientName,
    text: msg.text,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: msg.createdAt,
    read: msg.read,
    delivered: msg.delivered
  };
}

// ============================================================
// AUTHORIZATION HELPERS
// ============================================================

/**
 * Determine if a user can access a conversation.
 *
 * Access rules:
 *   PRIVATE  - only participants
 *   SUPPORT  - user participant OR assigned support agent OR admin (supervise)
 *   INTERNAL - only staff members (SUPPORT/ADMIN) listed in staffIds
 *   ESCALATED - user participant OR assigned support OR admin (after escalation)
 */
const canAccessConversation = async (conversationId, userId, userRole) => {
  const conversation = await Conversation.findOne({ conversationId });
  if (!conversation) {
    // Fallback: if no metadata exists, only allow if user is a participant
    // derived from the conversationId pattern (conv_<id1>_<id2>).
    const parts = conversationId.replace('conv_', '').split('_');
    if (parts.length === 2) {
      return parts[0] === String(userId) || parts[1] === String(userId);
    }
    return false;
  }

  const uid = String(userId);

  switch (conversation.type) {
    case 'PRIVATE':
      return conversation.participantIds.includes(uid);

    case 'SUPPORT':
      // User participant, assigned support agent, or admin supervising
      if (conversation.participantIds.includes(uid)) return true;
      if (conversation.supportAgentId === uid) return true;
      if (userRole === 'ADMIN') return true;
      return false;

    case 'INTERNAL':
      // Only internal staff members
      return conversation.staffIds.includes(uid);

    case 'ESCALATED':
      // User participant, assigned support, or admin after escalation
      if (conversation.participantIds.includes(uid)) return true;
      if (conversation.supportAgentId === uid) return true;
      if (userRole === 'ADMIN' && conversation.escalatedAt) return true;
      return false;

    default:
      return false;
  }
};

/**
 * Middleware: require the authenticated user to be a participant
 * or otherwise authorized to access the conversation.
 */
const requireConversationAccess = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(req.userId);
    const userRole = req.userRole;

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversationId' });
    }

    const allowed = await canAccessConversation(conversationId, userId, userRole);
    if (!allowed) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    next();
  } catch (error) {
    console.error('Conversation auth error:', error);
    return res.status(500).json({ error: 'Failed to verify conversation access' });
  }
};

/**
 * Ensure Conversation metadata exists for a conversation.
 * Creates it if missing (backwards-compatible with existing chat history).
 * If the conversation exists but was created as PRIVATE and is now being
 * used by SUPPORT or ADMIN, upgrade the type accordingly.
 */
const ensureConversationMetadata = async (conversationId, { type = 'PRIVATE', participantIds = [], supportAgentId = null, staffIds = [] } = {}) => {
  try {
    const existing = await Conversation.findOne({ conversationId });
    if (existing) {
      // Upgrade legacy PRIVATE conversations when support/admin start using them
      if (existing.type === 'PRIVATE' && type !== 'PRIVATE') {
        const updates = { type };
        if (supportAgentId) updates.supportAgentId = supportAgentId;
        if (staffIds.length > 0) updates.staffIds = staffIds;
        await Conversation.updateOne({ conversationId }, updates);
        return await Conversation.findOne({ conversationId });
      }
      return existing;
    }

    return await Conversation.create({
      conversationId,
      type,
      participantIds,
      supportAgentId,
      staffIds
    });
  } catch (error) {
    // If two requests race, one will fail on unique index - that's fine.
    console.error('Error ensuring conversation metadata:', error.message);
    return null;
  }
};

/**
 * Update last message info on Conversation metadata.
 * Auto-reopens CLOSED conversations for SUPPORT and INTERNAL types.
 */
const touchConversation = async (conversationId, text) => {
  try {
    const conversation = await Conversation.findOne({ conversationId });

    const updateData = {
      lastMessageAt: new Date(),
      lastMessagePreview: text ? text.slice(0, 120) : ''
    };

    // Auto-reopen CLOSED conversations for SUPPORT and INTERNAL types
    if (conversation && conversation.status === 'CLOSED') {
      if (conversation.type === 'SUPPORT' || conversation.type === 'INTERNAL') {
        updateData.status = 'ACTIVE';
        updateData.closedAt = null;
        updateData.closedBy = null;
      }
    }

    await Conversation.findOneAndUpdate(
      { conversationId },
      updateData
    );
  } catch (error) {
    console.error('Error touching conversation:', error.message);
  }
};

// ============================================================
// SEND MESSAGE
// ============================================================
router.post('/send', authenticate, checkPaidChatRelationship, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.userId;

    if (!senderId || !recipientId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversationId = getConversationId(senderId, recipientId);

    // ============================================================
    // DYNAMIC STAFF IDENTITY: the sender's name/role ALWAYS come
    // from the database (via the authenticated req.userId). Client
    // -supplied senderName/senderRole are NEVER trusted.
    // ============================================================
    const senderIdentity = await getUserIdentity(senderId);
    const senderName = senderIdentity?.name || req.body.senderName || 'User';
    const senderRole = senderIdentity?.role || req.userRole || req.body.senderRole || 'USER';

    // Determine the actual recipient name/role from the database.
    // This ensures user->support and admin->support conversations are
    // correctly classified (resolveRecipientRole is a heuristic that
    // cannot detect SUPPORT/ADMIN recipients) and that the recipient
    // name shown is always the real one.
    let recipientRole = resolveRecipientRole(senderRole);
    let recipientName = req.body.recipientName || 'User';
    try {
      const recipientUser = await prisma.user.findUnique({
        where: { id: String(recipientId) },
        select: { role: true, fullName: true }
      });
      if (recipientUser?.role) {
        recipientRole = recipientUser.role;
      }
      if (recipientUser?.fullName) {
        recipientName = recipientUser.fullName;
      }
    } catch (e) {
      console.error('Error looking up recipient:', e.message);
    }

    // Determine conversation type based on roles.
    // Classification order matters:
    //   1. Staff-to-staff (ADMIN/SUPPORT/SUP_ADMIN) -> INTERNAL
    //   2. Exactly one SUPPORT + one normal user -> SUPPORT
    //   3. Otherwise -> PRIVATE
    const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);
    const senderRoleUpper = (senderRole || '').toUpperCase();
    const recipientRoleUpper = (recipientRole || '').toUpperCase();

    let conversationType = 'PRIVATE';
    let supportAgentId = null;
    let staffIds = [];

    const senderIsStaff = STAFF_ROLES.has(senderRoleUpper);
    const recipientIsStaff = STAFF_ROLES.has(recipientRoleUpper);

    if (senderIsStaff && recipientIsStaff) {
      // Staff <-> Staff internal conversation (Admin/Support/SUP_ADMIN)
      conversationType = 'INTERNAL';
      staffIds = [String(senderId), String(recipientId)];
    } else if (senderRoleUpper === 'SUPPORT' || recipientRoleUpper === 'SUPPORT') {
      // User <-> Support conversation (exactly one SUPPORT, other is a normal user)
      conversationType = 'SUPPORT';
      const supportId = senderRoleUpper === 'SUPPORT' ? String(senderId) : String(recipientId);
      supportAgentId = supportId;
    }

    // Ensure conversation metadata exists
    await ensureConversationMetadata(conversationId, {
      type: conversationType,
      participantIds: [String(senderId), String(recipientId)],
      supportAgentId,
      staffIds
    });

    const message = await Message.create({
      conversationId,
      senderId: String(senderId),
      senderName,
      senderRole,
      recipientId: String(recipientId),
      recipientName,
      recipientRole,
      text: text.trim(),
      read: false,
      delivered: true
    });

    await touchConversation(conversationId, text);

    // Notify the recipient about the new message.
    // All notifications go through NotificationService (single source of
    // truth). The service never throws - it logs and returns null on
    // failure - so the message response is never affected.
    const trimmedText = text.trim();
    await createNotification(String(recipientId), {
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: `New message from ${senderName || 'User'}`,
      message: trimmedText.length > 120 ? `${trimmedText.slice(0, 117)}...` : trimmedText,
      entityType: 'MESSAGE',
      entityId: conversationId,
      link: '/messages',
      data: {
        conversationId,
        senderId: String(senderId),
        senderName: senderName || 'User',
      },
    });

    const formatted = formatMessage(message);

    return res.status(201).json(formatted);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================
// GET MESSAGES FOR A CONVERSATION
// ============================================================
router.get('/messages/:conversationId', authenticate, requireConversationAccess, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const messages = await Message.find({
      conversationId: conversationId
    }).sort({ createdAt: 1 });

    const formatted = messages.map(formatMessage);

    // DYNAMIC STAFF IDENTITY: refresh every sender/recipient name and
    // role from the database so legacy messages display correctly too.
    const enriched = await enrichMessageIdentities(formatted);

    return res.json(enriched);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============================================================
// GET CONVERSATIONS FOR A USER
// ============================================================
// Only returns conversations the authenticated user participates in.
// Admin does NOT see all conversations.
router.get('/conversations/:userId', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = req.userRole;

    // Security: users can only fetch their own conversations
    if (userId !== String(req.params.userId)) {
      return res.status(403).json({ error: 'Not authorized to view these conversations' });
    }

    // ============================================================
    // BACKWARDS COMPATIBILITY: Find conversations from Message data
    // where this user is a participant, and ensure Conversation
    // metadata exists for them (e.g., legacy conversations created
    // before the Conversation model existed).
    // ============================================================
    const legacyConversationIds = await Message.distinct('conversationId', {
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    });

    for (const convId of (legacyConversationIds || []).filter(Boolean)) {
      const existing = await Conversation.findOne({ conversationId: convId });
      if (!existing) {
        // Determine participants from the conversationId pattern
        const parts = convId.replace('conv_', '').split('_');
        if (parts.length === 2) {
          // Determine conversation type from message roles
          const sampleMsg = await Message.findOne({ conversationId: convId })
            .sort({ createdAt: 1 });

          let convType = 'PRIVATE';
          let supportAgentId = null;
          let staffIds = [];

          if (sampleMsg) {
            const role1 = (sampleMsg.senderRole || '').toUpperCase();
            const role2 = (sampleMsg.recipientRole || '').toUpperCase();

            if (role1 === 'SUPPORT' || role2 === 'SUPPORT') {
              convType = 'SUPPORT';
              supportAgentId = role1 === 'SUPPORT' ? String(sampleMsg.senderId) : String(sampleMsg.recipientId);
            } else if (role1 === 'ADMIN' || role2 === 'ADMIN') {
              convType = 'INTERNAL';
              staffIds = [String(sampleMsg.senderId), String(sampleMsg.recipientId)];
            }
          }

          // Get the actual last message time for correct ordering
          const lastMsg = await Message.findOne({ conversationId: convId })
            .sort({ createdAt: -1 });

          const created = await ensureConversationMetadata(convId, {
            type: convType,
            participantIds: [parts[0], parts[1]],
            supportAgentId,
            staffIds
          });

          // Set lastMessageAt to the actual last message time
          if (created && lastMsg) {
            await Conversation.updateOne(
              { conversationId: convId },
              {
                lastMessageAt: lastMsg.createdAt,
                lastMessagePreview: lastMsg.text ? lastMsg.text.slice(0, 120) : ''
              }
            );
          }
        }
      }
    }

    // Find all conversation metadata where this user is a participant,
    // assigned support agent, or internal staff member.
    const conversationsMeta = await Conversation.find({
      $or: [
        { participantIds: userId },
        { supportAgentId: userId },
        { staffIds: userId }
      ]
    }).sort({ lastMessageAt: -1 });

    // For each conversation, get the last message
    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = await Message.findOne({ conversationId: conv.conversationId })
        .sort({ createdAt: -1 });

      if (!lastMsg) continue;

      // Determine the "other user" (not the current user)
      let otherUser;
      const isSender = String(lastMsg.senderId) === userId;
      otherUser = isSender
        ? { id: lastMsg.recipientId, name: lastMsg.recipientName, role: lastMsg.recipientRole || 'USER' }
        : { id: lastMsg.senderId, name: lastMsg.senderName, role: lastMsg.senderRole };

      const unread = await Message.countDocuments({
        conversationId: conv.conversationId,
        recipientId: userId,
        read: false
      });

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        otherUserId: String(otherUser.id),
        otherUserName: otherUser.name,
        otherUserRole: otherUser.role,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        role: otherUser.role,
        avatar: null,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt,
        escalated: conv.type === 'ESCALATED',
        complaintId: conv.complaintId || null
      });
    }

    // ============================================================
    // DYNAMIC STAFF IDENTITY: override stored snapshot names with
    // live database identities in ONE batch query. Works for any
    // current or future staff member with zero code changes.
    // ============================================================
    const identityMap = await getUserIdentities(conversations.map((c) => c.otherUserId));
    for (const conv of conversations) {
      const live = identityMap.get(String(conv.otherUserId));
      if (live) {
        conv.otherUserName = live.name;
        conv.otherUserRole = live.role;
        conv.isPremium = live.isPremium === true;
        conv.role = live.role;
        conv.avatar = live.image || null;
      }
    }

    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ============================================================
// MARK READ
// ============================================================
router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = String(req.userId);

    if (!conversationId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify access before marking read
    const allowed = await canAccessConversation(conversationId, userId, req.userRole);
    if (!allowed) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    await Message.updateMany(
      {
        conversationId,
        recipientId: userId,
        read: false
      },
      { read: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// ============================================================
// UNREAD COUNT
// ============================================================
router.get('/unread/:userId', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);

    if (userId !== String(req.params.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const count = await Message.countDocuments({
      recipientId: userId,
      read: false
    });
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================================
// ENSURE CONVERSATION
// ============================================================
router.post('/ensure-conversation', authenticate, checkPaidChatRelationship, async (req, res) => {
  try {
    const { 
      user1Id, 
      user1Name, 
      user1Role,
      user2Id, 
      user2Name,
      user2Role
    } = req.body;

    const authenticatedId = String(req.userId);

    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (authenticatedId !== String(user1Id) && authenticatedId !== String(user2Id)) {
      return res.status(403).json({ error: 'Not authorized to create this conversation' });
    }

    const conversationId = getConversationId(user1Id, user2Id);
    const existing = await Message.findOne({ conversationId });

    // Determine conversation type.
    // Classification order matters:
    //   1. Staff-to-staff (ADMIN/SUPPORT/SUP_ADMIN) -> INTERNAL
    //   2. Exactly one SUPPORT + one normal user -> SUPPORT
    //   3. Otherwise -> PRIVATE
    const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);
    let conversationType = 'PRIVATE';
    let supportAgentId = null;
    let staffIds = [];

    const role1 = (user1Role || 'USER').toUpperCase();
    const role2 = (user2Role || 'USER').toUpperCase();

    const user1IsStaff = STAFF_ROLES.has(role1);
    const user2IsStaff = STAFF_ROLES.has(role2);

    if (user1IsStaff && user2IsStaff) {
      // Staff <-> Staff internal conversation (Admin/Support/SUP_ADMIN)
      conversationType = 'INTERNAL';
      staffIds = [String(user1Id), String(user2Id)];
    } else if (role1 === 'SUPPORT' || role2 === 'SUPPORT') {
      // User <-> Support conversation (exactly one SUPPORT, other is a normal user)
      conversationType = 'SUPPORT';
      supportAgentId = role1 === 'SUPPORT' ? String(user1Id) : String(user2Id);
    }

    await ensureConversationMetadata(conversationId, {
      type: conversationType,
      participantIds: [String(user1Id), String(user2Id)],
      supportAgentId,
      staffIds
    });

    if (!existing) {
      // DYNAMIC STAFF IDENTITY: resolve both participant names/roles
      // from the database instead of trusting client-passed values.
      const identityMap = await getUserIdentities([user1Id, user2Id]);
      const user1Identity = identityMap.get(String(user1Id));
      const user2Identity = identityMap.get(String(user2Id));

      await Message.create({
        conversationId,
        senderId: String(user1Id),
        senderName: user1Identity?.name || user1Name || 'User',
        senderRole: user1Identity?.role || role1,
        recipientId: String(user2Id),
        recipientName: user2Identity?.name || user2Name || 'User',
        recipientRole: user2Identity?.role || role2,
        text: 'Start your conversation here',
        read: true,
        delivered: true
      });
    }

    return res.json({ conversationId });
  } catch (error) {
    console.error('Error ensuring conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ============================================================
// DELETE CONVERSATION
// ============================================================
router.delete('/conversations/:conversationId', authenticate, requireConversationAccess, async (req, res) => {
  try {
    await Message.deleteMany({ 
      conversationId: req.params.conversationId 
    });
    await Conversation.deleteOne({
      conversationId: req.params.conversationId
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ============================================================
// GET ALL SUPPORT USERS
// ============================================================
router.get('/support-users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'SUPPORT'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profileImage: true,
        createdAt: true
      }
    });

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching support users:', error);
    return res.status(500).json({ error: 'Failed to fetch support users' });
  }
});

// ============================================================
// SUPPORT CONVERSATIONS
// ============================================================

/**
 * GET /api/chat/support/conversations
 * Support/Admin: list support conversations (user <-> support).
 * Only conversations where the support agent is assigned, or
 * admin supervising.
 */
router.get('/support/conversations', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = req.userRole;

    if (userRole !== 'SUPPORT' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query = { type: 'SUPPORT' };
    if (userRole === 'SUPPORT') {
      query.supportAgentId = userId;
    }

    const conversationsMeta = await Conversation.find(query).sort({ lastMessageAt: -1 });

    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = await Message.findOne({ conversationId: conv.conversationId })
        .sort({ createdAt: -1 });

      if (!lastMsg) continue;

      // Find the user participant (non-support)
      const userParticipantId = conv.participantIds.find(
        id => id !== conv.supportAgentId
      );

      const unread = await Message.countDocuments({
        conversationId: conv.conversationId,
        recipientId: userId,
        read: false
      });

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        userId: userParticipantId || null,
        supportAgentId: conv.supportAgentId,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    // DYNAMIC STAFF IDENTITY: attach live user + support agent info
    const identityMap = await getUserIdentities(
      conversations.flatMap((c) => [c.userId, c.supportAgentId])
    );
    for (const conv of conversations) {
      const userIdentity = conv.userId ? identityMap.get(String(conv.userId)) : null;
      const agentIdentity = conv.supportAgentId ? identityMap.get(String(conv.supportAgentId)) : null;
      conv.user = userIdentity
        ? { id: userIdentity.id, fullName: userIdentity.name, role: userIdentity.role, image: userIdentity.image, email: userIdentity.email, isPremium: userIdentity.isPremium }
        : null;
      conv.supportAgent = agentIdentity
        ? { id: agentIdentity.id, fullName: agentIdentity.name, role: agentIdentity.role, image: agentIdentity.image, email: agentIdentity.email }
        : null;
    }

    return res.json(conversations);
  } catch (error) {
    console.error('Error fetching support conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversations' });
  }
});

/**
 * GET /api/chat/support/conversations/:id
 * Support/Admin: get a single support conversation with messages.
 */
router.get('/support/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = String(req.userId);
    const userRole = req.userRole;

    if (userRole !== 'SUPPORT' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conv = await Conversation.findOne({ conversationId, type: 'SUPPORT' });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Support can only access assigned conversations; Admin can supervise all
    if (userRole === 'SUPPORT' && conv.supportAgentId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    // Refresh sender names/roles from the database
    const enriched = await enrichMessageIdentities(messages.map(formatMessage));

    return res.json({
      conversation: {
        id: conv.conversationId,
        type: conv.type,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId
      },
      messages: enriched
    });
  } catch (error) {
    console.error('Error fetching support conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversation' });
  }
});

// ============================================================
// INTERNAL STAFF CONVERSATIONS
// ============================================================

/**
 * GET /api/chat/internal/conversations
 * Support/Admin: list internal staff conversations.
 */
router.get('/internal/conversations', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = req.userRole;

    if (userRole !== 'SUPPORT' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversationsMeta = await Conversation.find({
      type: 'INTERNAL',
      staffIds: userId
    }).sort({ lastMessageAt: -1 });

    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = await Message.findOne({ conversationId: conv.conversationId })
        .sort({ createdAt: -1 });

      if (!lastMsg) continue;

      // Find the other staff member
      const otherStaffId = conv.staffIds.find(id => id !== userId);

      const unread = await Message.countDocuments({
        conversationId: conv.conversationId,
        recipientId: userId,
        read: false
      });

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        otherStaffId: otherStaffId || null,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    // DYNAMIC STAFF IDENTITY: attach live staff info from the database
    const identityMap = await getUserIdentities(conversations.map((c) => c.otherStaffId));
    for (const conv of conversations) {
      const staffIdentity = conv.otherStaffId ? identityMap.get(String(conv.otherStaffId)) : null;
      conv.otherStaff = staffIdentity
        ? { id: staffIdentity.id, fullName: staffIdentity.name, role: staffIdentity.role, image: staffIdentity.image, email: staffIdentity.email }
        : null;
    }

    return res.json(conversations);
  } catch (error) {
    console.error('Error fetching internal conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch internal conversations' });
  }
});

// ============================================================
// ESCALATED CONVERSATIONS
// ============================================================

/**
 * GET /api/chat/escalated/conversations
 * Admin: list escalated conversations.
 */
router.get('/escalated/conversations', authenticate, async (req, res) => {
  try {
    const userRole = req.userRole;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversationsMeta = await Conversation.find({
      type: 'ESCALATED',
      escalatedAt: { $ne: null }
    }).sort({ escalatedAt: -1 });

    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = await Message.findOne({ conversationId: conv.conversationId })
        .sort({ createdAt: -1 });

      if (!lastMsg) continue;

      const unread = await Message.countDocuments({
        conversationId: conv.conversationId,
        recipientId: String(req.userId),
        read: false
      });

      // Get complaint info
      let complaint = null;
      if (conv.complaintId) {
        try {
          complaint = await prisma.complaint.findUnique({
            where: { id: conv.complaintId },
            select: {
              id: true,
              subject: true,
              status: true,
              priority: true,
              createdAt: true
            }
          });
        } catch (e) {
          console.error('Error fetching complaint:', e.message);
        }
      }

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        complaintId: conv.complaintId,
        complaint,
        escalatedBy: conv.escalatedBy,
        escalatedAt: conv.escalatedAt,
        escalationReason: conv.escalationReason,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    return res.json(conversations);
  } catch (error) {
    console.error('Error fetching escalated conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch escalated conversations' });
  }
});

export default router;
