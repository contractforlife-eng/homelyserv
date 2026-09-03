// Sup-Help routes - safe user directory and staff messaging
import express from 'express';
import { requireSupHelp } from '../middleware/supHelpAuth.js';
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { ensureConversationMetadata, canAccessConversation, touchConversation, getConversationId } from '../routes/chat.js';
import { getUserIdentity, getUserIdentities, enrichMessageIdentities } from '../utils/staffIdentity.js';
import { emitToUser } from '../lib/socket.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { sendPushToUser } from '../services/fcmService.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';
import {
  supHelpListComplaints,
  supHelpGetComplaint,
  supHelpAssignComplaint,
  supHelpReply,
  supHelpAddNote,
  supHelpChangeStatus,
  supHelpEscalate,
  supHelpClose,
  supHelpComplaintStats,
} from '../controllers/complaintController.js';

const router = express.Router();

// All routes require authentication and Support Helper / Admin role
router.use(requireSupHelp);

// ============================================================
// USER DIRECTORY
// ============================================================

// GET /api/sup-help/users
// Return WORKER/EMPLOYER users only (safe directory for Sup-Help)
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;

    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(limit, 10);
    const take = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 50);
    const skip = (pageNumber - 1) * take;

    const where = {
      role: { in: ['WORKER', 'EMPLOYER'] },
    };

    if (role && ['WORKER', 'EMPLOYER'].includes(role)) {
      where.role = role;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isVerified: true,
        isSuspended: true,
        phone: true,
        city: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.user.count({ where });

    return res.json({
      success: true,
      count: users.length,
      total,
      page: pageNumber,
      limit: take,
      users,
    });
  } catch (error) {
    console.error('Error fetching users for Sup-Help:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================================
// USER PROFILE
// ============================================================

// GET /api/sup-help/users/:id
// Read-only safe profile for WORKER/EMPLOYER only
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        isSuspended: true,
        phone: true,
        city: true,
        countryCode: true,
        countryName: true,
        language: true,
        location: true,
        bio: true,
        skills: true,
        experience: true,
        hourlyRate: true,
        hourlyRateCurrency: true,
        companyName: true,
        website: true,
        profileComplete: true,
        desiredJob: true,
        WorkerProfile: {
          select: {
            category: true,
            experienceYears: true,
            availability: true,
            workType: true,
            skills: true,
            ratingAvg: true,
            ratingCount: true,
            bioAr: true,
            bioEn: true,
            isVisible: true,
          },
        },
        EmployerProfile: {
          select: {
            companyName: true,
            companyWebsite: true,
            companySize: true,
            industry: true,
            description: true,
            isVerified: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!['WORKER', 'EMPLOYER'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Profile access is limited to platform users',
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user profile for Sup-Help:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================
// INTERNAL STAFF MESSAGING (Phase 2C)
// ============================================================

// Valid internal staff targets for SUPPORT_HELPER conversations.
// SUPPORT_HELPER must NOT self-target, and must not target WORKER/EMPLOYER/SUPPORT_HELPER.
const INTERNAL_TARGET_ROLES = new Set(['SUPPORT', 'ADMIN']);

// POST /api/sup-help/messages/ensure
// Tab-aware conversation initiation/retrieval for Sup-Help workspace:
// - Support Conversations tab (SUPPORT): targets must be staff (SUPPORT or ADMIN). Creates/ensures type: 'INTERNAL'.
// - Internal Conversations tab (INTERNAL): targets must be users (WORKER or EMPLOYER). Creates/ensures type: 'SUPPORT'.
// Server-side authorization strictly validates target roles for each tab/type.
router.post('/messages/ensure', async (req, res) => {
  try {
    const callerId = String(req.userId);
    const callerRole = String(req.userRole || '').toUpperCase();
    const { targetUserId, tab } = req.body || {};

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (String(callerId) === String(targetUserId)) {
      return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
    }

    const [callerUser, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: callerId }, select: { id: true, role: true } }),
      prisma.user.findUnique({ where: { id: String(targetUserId) }, select: { id: true, role: true } }),
    ]);

    if (!callerUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetRole = String(targetUser.role || '').toUpperCase();
    const normalizedTab = tab ? String(tab).toUpperCase() : 'SUPPORT';

    // Strict tab-aware target validation
    if (normalizedTab === 'SUPPORT') {
      // Support Conversations tab: staff communication only (SUPPORT, ADMIN)
      if (!INTERNAL_TARGET_ROLES.has(targetRole) && targetRole !== 'SUPPORT_HELPER') {
        return res.status(403).json({ error: 'Invalid target role for Support Conversations tab' });
      }
      if (callerRole === 'SUPPORT_HELPER' && targetRole === 'SUPPORT_HELPER') {
        return res.status(403).json({ error: 'Invalid target role for Support Conversations tab' });
      }
    } else if (normalizedTab === 'INTERNAL') {
      // Internal Conversations tab: platform users only (WORKER or EMPLOYER)
      if (!['WORKER', 'EMPLOYER'].includes(targetRole)) {
        return res.status(403).json({ error: 'Invalid target role for Internal Conversations tab' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid tab specified' });
    }

    const conversationId = getConversationId(callerId, String(targetUserId));
    let conversation;

    if (INTERNAL_TARGET_ROLES.has(targetRole) || targetRole === 'SUPPORT_HELPER') {
      // Staff <-> Staff internal conversation
      const staffIds = [callerId, String(targetUserId)];
      conversation = await ensureConversationMetadata(conversationId, {
        type: 'INTERNAL',
        participantIds: staffIds,
        staffIds,
      });
    } else {
      // Staff <-> User support conversation (WORKER or EMPLOYER)
      const participantIds = [callerId, String(targetUserId)];
      conversation = await ensureConversationMetadata(conversationId, {
        type: 'SUPPORT',
        participantIds,
        supportAgentId: callerId,
      });
    }

    if (!conversation) {
      return res.status(500).json({ error: 'Failed to ensure conversation' });
    }

    return res.json({ success: true, conversationId: conversation.conversationId });
  } catch (error) {
    console.error('Error ensuring sup-help conversation:', error);
    return res.status(500).json({ error: 'Failed to ensure conversation' });
  }
});

// GET /api/sup-help/messages
// List authorized conversations for the authenticated user:
// - INTERNAL conversations with staff (SUPPORT, ADMIN)
// - SUPPORT conversations with users (WORKER, EMPLOYER)
// Admin can supervise all or their own.
router.get('/messages', async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = String(req.userRole || '').toUpperCase();

    const roleCondition = userRole === 'ADMIN'
      ? {
          $or: [
            { type: 'INTERNAL', $or: [{ staffIds: userId }, { participantIds: userId }] },
            { type: 'SUPPORT' }
          ]
        }
      : {
          $or: [
            { type: 'INTERNAL', $or: [{ staffIds: userId }, { participantIds: userId }] },
            { type: 'SUPPORT', $or: [{ supportAgentId: userId }, { participantIds: userId }, { staffIds: userId }] }
          ]
        };

    const statusCondition = {
      $or: [
        { status: 'ACTIVE' },
        { status: { $exists: false } }
      ]
    };

    const conversationsMeta = await Conversation.find({
      $and: [roleCondition, statusCondition]
    }).sort({ lastMessageAt: -1 });

    if (!conversationsMeta.length) {
      return res.json({ success: true, count: 0, conversations: [] });
    }

    const conversationIds = conversationsMeta.map(c => c.conversationId);

    const [lastMessages, unreadAgg] = await Promise.all([
      Message.find({ conversationId: { $in: conversationIds } }).sort({ createdAt: -1 }),
      Message.aggregate([
        { $match: { conversationId: { $in: conversationIds }, recipientId: userId, read: false } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } }
      ])
    ]);

    const lastMessageMap = new Map();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }
    const unreadMap = new Map(unreadAgg.map(item => [item._id, item.count]));

    const otherUserIds = [];
    for (const conv of conversationsMeta) {
      let otherId = null;
      if (conv.type === 'INTERNAL') {
        const otherStaff = conv.staffIds?.find(id => String(id) !== String(userId));
        otherId = otherStaff ? String(otherStaff) : null;
      } else if (conv.type === 'SUPPORT') {
        const otherParticipant = conv.participantIds?.find(id => String(id) !== String(userId));
        if (otherParticipant) {
          otherId = String(otherParticipant);
        } else if (conv.supportAgentId && String(conv.supportAgentId) !== String(userId)) {
          otherId = String(conv.supportAgentId);
        }
      }
      if (otherId && /^[0-9a-fA-F]{24}$/.test(otherId)) {
        otherUserIds.push(otherId);
      }
    }

    const validOtherUserIds = [...new Set(otherUserIds)];
    const [users, activePremiumIds] = await Promise.all([
      validOtherUserIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: validOtherUserIds } },
            select: { id: true, fullName: true, email: true, role: true, profileImage: true }
          })
        : [],
      getActivePremiumUserIds(validOtherUserIds)
    ]);
    const userMap = new Map(users.map(u => [u.id, u]));

    const conversations = [];
    for (const conv of conversationsMeta) {
      let otherUserId = null;
      if (conv.type === 'INTERNAL') {
        const otherStaff = conv.staffIds?.find(id => String(id) !== String(userId));
        otherUserId = otherStaff ? String(otherStaff) : null;
      } else if (conv.type === 'SUPPORT') {
        const otherParticipant = conv.participantIds?.find(id => String(id) !== String(userId));
        if (otherParticipant) {
          otherUserId = String(otherParticipant);
        } else if (conv.supportAgentId && String(conv.supportAgentId) !== String(userId)) {
          otherUserId = String(conv.supportAgentId);
        }
      }

      const otherUser = otherUserId ? userMap.get(otherUserId) || null : null;
      const lastMsg = lastMessageMap.get(conv.conversationId);

      let tab = null;
      const counterpartRole = (otherUser?.role || '').toUpperCase();
      if (counterpartRole === 'SUPPORT' || counterpartRole === 'ADMIN') {
        tab = 'SUPPORT';
      } else if (counterpartRole === 'WORKER' || counterpartRole === 'EMPLOYER') {
        tab = 'INTERNAL';
      } else if (conv.type === 'INTERNAL') {
        tab = 'SUPPORT';
      } else if (conv.type === 'SUPPORT') {
        tab = 'INTERNAL';
      }

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        tab,
        status: conv.status,
        otherUserId: otherUserId || null,
        otherStaffId: conv.type === 'INTERNAL' ? otherUserId : null,
        otherStaff: conv.type === 'INTERNAL' ? otherUser : null,
        otherUserName: otherUser?.fullName || 'User',
        otherUserEmail: otherUser?.email || '',
        otherUserRole: otherUser?.role || 'USER',
        otherUserImage: otherUser?.profileImage || null,
        isPremium: activePremiumIds.has(String(otherUserId)),
        lastMessage: lastMsg ? lastMsg.text : '',
        lastMessageTime: lastMsg ? lastMsg.createdAt : null,
        time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: unreadMap.get(conv.conversationId) || 0,
        updatedAt: conv.lastMessageAt || (lastMsg ? lastMsg.createdAt : null),
      });
    }

    return res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    console.error('Error fetching sup-help messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/sup-help/messages/:conversationId
// Get a single authorized conversation with its messages.
// Strictly forbids PRIVATE conversations.
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);
    const userRole = String(req.userRole || '').toUpperCase();

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Strictly forbid PRIVATE conversations
    if (conv.type === 'PRIVATE') {
      return res.status(403).json({ error: 'Not authorized to access private conversations' });
    }

    let isAuthorized = false;
    if (conv.type === 'INTERNAL') {
      isAuthorized = conv.staffIds?.includes(userId) || userRole === 'ADMIN';
    } else if (conv.type === 'SUPPORT') {
      isAuthorized = conv.participantIds?.includes(userId) || conv.supportAgentId === userId || userRole === 'ADMIN';
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    const enriched = await enrichMessageIdentities(messages.map(formatMessage));

    return res.json({
      success: true,
      conversation: {
        id: conv.conversationId,
        type: conv.type,
        status: conv.status,
        participantIds: conv.participantIds,
        staffIds: conv.staffIds,
        closedAt: conv.closedAt,
        closedBy: conv.closedBy,
      },
      messages: enriched,
    });
  } catch (error) {
    console.error('Error fetching sup-help conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// POST /api/sup-help/messages
// Send a message within an existing authorized conversation (INTERNAL or SUPPORT).
// Strictly forbids PRIVATE conversations.
router.post('/messages', async (req, res) => {
  try {
    const senderId = String(req.userId);
    const senderRole = String(req.userRole || '').toUpperCase();
    const { recipientId, text, conversationId } = req.body;

    if (!recipientId || !text || !text.trim() || !conversationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Strictly forbid sending to PRIVATE conversations
    if (conv.type === 'PRIVATE') {
      return res.status(403).json({ error: 'Not authorized to send to private conversations' });
    }

    let isAuthorized = false;
    if (conv.type === 'INTERNAL') {
      isAuthorized = conv.staffIds?.includes(senderId) && conv.staffIds?.includes(String(recipientId));
    } else if (conv.type === 'SUPPORT') {
      isAuthorized = (conv.participantIds?.includes(senderId) || conv.supportAgentId === senderId) &&
                     conv.participantIds?.includes(String(recipientId));
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to send to this conversation' });
    }

    const [senderIdentity, recipientUser] = await Promise.all([
      getUserIdentity(senderId),
      prisma.user.findUnique({
        where: { id: String(recipientId) },
        select: { role: true, fullName: true }
      }).catch((error) => {
        console.error('Error looking up recipient:', error.message);
        return null;
      })
    ]);

    const senderName = senderIdentity?.name || req.body.senderName || 'User';
    const senderRoleResolved = senderIdentity?.role || senderRole || 'USER';
    let recipientRole = recipientUser?.role || 'USER';
    let recipientName = recipientUser?.fullName || req.body.recipientName || 'User';

    const message = await Message.create({
      conversationId,
      senderId,
      senderName,
      senderRole: senderRoleResolved,
      recipientId: String(recipientId),
      recipientName,
      recipientRole,
      text: text.trim(),
      read: false,
      delivered: true,
    });

    const trimmedText = text.trim();
    await Promise.all([
      touchConversation(conversationId, text),
      createNotification(String(recipientId), {
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        title: `New message from ${senderName || 'User'}`,
        message: trimmedText.length > 120 ? `${trimmedText.slice(0, 117)}...` : trimmedText,
        entityType: 'MESSAGE',
        entityId: conversationId,
        link: '/messages',
        data: {
          conversationId,
          senderId,
          senderName: senderName || 'User',
        },
      })
    ]);

    const formatted = formatMessage(message);
    if (senderIdentity) {
      formatted.sender = {
        id: senderIdentity.id,
        name: senderIdentity.name,
        role: senderIdentity.role,
        image: senderIdentity.image,
        profileImage: senderIdentity.image,
        isPremium: senderIdentity.isPremium,
      };
      formatted.senderImage = senderIdentity.image;
    }
    emitToUser(recipientId, 'message:new', formatted);

    res.status(201).json(formatted);

    if (String(senderId) !== String(recipientId)) {
      sendPushToUser(String(recipientId), {
        title: 'New message',
        body: 'You have a new message on HomelyServ',
        data: {
          type: 'NEW_MESSAGE',
          entityType: 'MESSAGE',
          conversationId,
          senderId,
        },
        channelId: 'messages',
      }).catch(() => {});
    }

    return;
  } catch (error) {
    console.error('Error sending sup-help message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/sup-help/messages/:conversationId/read
// Mark messages as read for the authenticated user in an authorized conversation.
router.post('/messages/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv || conv.type === 'PRIVATE') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isAuthorized = conv.type === 'INTERNAL'
      ? conv.staffIds?.includes(userId)
      : (conv.type === 'SUPPORT' && (conv.participantIds?.includes(userId) || conv.supportAgentId === userId));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.updateMany(
      { conversationId, recipientId: userId, read: false },
      { $set: { read: true } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// POST /api/sup-help/messages/:conversationId/close
// Soft-close an authorized conversation for the authenticated staff member.
router.post('/messages/:conversationId/close', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv || conv.type === 'PRIVATE') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const isAuthorized = conv.type === 'INTERNAL'
      ? (conv.staffIds?.includes(userId) || req.userRole === 'ADMIN')
      : (conv.type === 'SUPPORT' && (conv.participantIds?.includes(userId) || conv.supportAgentId === userId || req.userRole === 'ADMIN'));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (conv.status === 'CLOSED') {
      return res.json({
        success: true,
        message: 'Conversation is already closed',
        conversation: {
          id: conv.conversationId,
          type: conv.type,
          status: conv.status,
          closedAt: conv.closedAt,
          closedBy: conv.closedBy,
        },
      });
    }

    const updated = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId,
      },
      { new: true }
    );

    return res.json({
      success: true,
      conversation: {
        id: updated.conversationId,
        type: updated.type,
        status: updated.status,
        closedAt: updated.closedAt,
        closedBy: updated.closedBy,
      },
    });
  } catch (error) {
    console.error('Error closing sup-help conversation:', error);
    return res.status(500).json({ error: 'Failed to close conversation' });
  }
});

// ============================================================
// HELPERS
// ============================================================

const formatMessage = (msg) => {
  const base = {
    id: msg._id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    recipientId: msg.recipientId,
    recipientName: msg.recipientName,
    recipientRole: msg.recipientRole,
    text: msg.text,
    read: msg.read,
    delivered: msg.delivered,
    timestamp: msg.createdAt,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  return base;
};

// ============================================================
// COMPLAINT WORKFLOW
// ============================================================
router.get('/complaints', supHelpListComplaints);
router.get('/complaints/stats', supHelpComplaintStats);
router.get('/complaints/:id', supHelpGetComplaint);
router.post('/complaints/:id/assign', supHelpAssignComplaint);
router.post('/complaints/:id/reply', supHelpReply);
router.post('/complaints/:id/notes', supHelpAddNote);
router.put('/complaints/:id/status', supHelpChangeStatus);
router.post('/complaints/:id/escalate', supHelpEscalate);
router.post('/complaints/:id/close', supHelpClose);

export default router;
