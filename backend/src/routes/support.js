// Support routes - Extended for user management, complaint workflow, and activity logging
import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.js';
import { requireSupport as supportAuth } from '../middleware/supportAuth.js';
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';
import MongooseUser from '../models/User.js';
import { enrichMessageIdentities } from '../utils/staffIdentity.js';
import { createAndSendPasswordReset } from '../services/passwordResetTokenService.js';
import { getActivePremiumUserIds, getSubscriptionStaffDetail, getSubscriptionSummaries } from '../services/premiumService.js';
import { getUserPaymentHistory } from '../services/userPaymentHistoryService.js';

const supportResetAttempts = new Map();
const SUPPORT_RESET_WINDOW_MS = 60 * 60 * 1000;
const SUPPORT_RESET_MAX_ATTEMPTS = 5;

const router = express.Router();

// All routes require authentication and support/admin role
router.use(authenticate);
router.use(supportAuth);

// Support handles assigned conversations only. User administration, global
// directories, financial history, and security actions remain Admin-only.
const requireAdminForSensitiveSupport = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  return next();
};

// ============================================================
// HELPER: Log support activity
// ============================================================
const logActivity = async (supportId, action, description, targetUserId = null, complaintId = null) => {
  try {
    await prisma.supportActivity.create({
      data: {
        supportId,
        action,
        description,
        targetUserId: targetUserId || undefined,
        complaintId: complaintId || undefined,
      },
    });
  } catch (error) {
    console.error('❌ Failed to log support activity:', error);
  }
};

// ============================================================
// USER MANAGEMENT FOR SUPPORT
// ============================================================

// GET /api/support/users
// Return users list for support lookup (read-only)
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50, eligibleForSupportChat } = req.query;
    const isSupport = req.userRole === 'SUPPORT';
    const isSupportChatLookup = isSupport && eligibleForSupportChat === 'true';

    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(limit, 10);
    const take = isSupport
      ? Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 50)
      : requestedLimit;
    const skip = (pageNumber - 1) * take;

    const where = {};

    if (isSupport) {
      where.role = { in: ['WORKER', 'EMPLOYER'] };
    } else if (role && (!isSupport || ['WORKER', 'EMPLOYER', 'SUPPORT', 'ADMIN'].includes(role))) {
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
      select: isSupport ? {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
      } : {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isVerified: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
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
    if (isSupport) {
      return res.json({
        success: true,
        count: users.length,
        total,
        page: pageNumber,
        limit: take,
        users,
      });
    }

    const summaries = await getSubscriptionSummaries(users.map((user) => user.id));

    return res.json({
      success: true,
      count: users.length,
      total,
      page: pageNumber,
      limit: take,
      users: users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        isSuspended: user.isSuspended,
        suspendedAt: user.suspendedAt,
        suspendedBy: user.suspendedBy,
        suspensionReason: user.suspensionReason,
        phone: user.phone,
        city: user.city,
        subscription: summaries.get(String(user.id)),
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching users for support:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Support-safe, read-only payment history. The DTO intentionally excludes
// provider identifiers, reconciliation reasons, metadata, and mutation data.
router.get('/users/:id/payment-history', requireAdminForSensitiveSupport, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const history = await getUserPaymentHistory({
      userId: id,
      page: req.query.page,
      limit: req.query.limit,
      audience: 'support',
    });
    return res.json({ success: true, ...history });
  } catch (error) {
    console.error('Error fetching support-safe payment history:', error);
    return res.status(500).json({ success: false, message: 'Failed to get payment history' });
  }
});

// GET /api/support/users/:id
// Get a single user's profile (read-only)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isSupport = req.userRole === 'SUPPORT';

    const user = await prisma.user.findUnique({
      where: { id },
      select: isSupport ? {
        id: true, fullName: true, email: true, role: true, profileImage: true,
        createdAt: true, updatedAt: true, isVerified: true, isSuspended: true,
        suspendedAt: true, phone: true, city: true, countryCode: true, countryName: true,
        language: true, location: true, bio: true, skills: true, experience: true,
        hourlyRate: true, hourlyRateCurrency: true, companyName: true, website: true,
        profileComplete: true, desiredJob: true,
        WorkerProfile: { select: {
          category: true, experienceYears: true, availability: true, workType: true,
          skills: true, ratingAvg: true, ratingCount: true, bioAr: true, bioEn: true, isVisible: true,
        } },
        EmployerProfile: { select: {
          companyName: true, companyWebsite: true, companySize: true, industry: true,
          description: true, isVerified: true, ratingAvg: true, ratingCount: true,
        } },
      } : {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        phone: true,
        city: true,
        language: true,
        WorkerProfile: { select: {
          category: true, experienceYears: true, expectedSalary: true, availability: true,
          workType: true, skills: true, ratingAvg: true, ratingCount: true, docStatus: true,
        } },
        EmployerProfile: { select: {
          companyName: true, companyWebsite: true, companySize: true, industry: true, isVerified: true,
        } },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (isSupport && !['WORKER', 'EMPLOYER'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Profile access is limited to platform users' });
    }

    // Fetch lastLogin from the Mongoose User model (kept in sync by auth routes)
    let lastLogin = null;
    try {
      const mongooseUser = await MongooseUser.findById(id).select('lastLogin');
      if (mongooseUser) {
        lastLogin = mongooseUser.lastLogin || null;
      }
    } catch (e) {
      console.error('❌ Error fetching lastLogin for user:', e.message);
    }

    if (isSupport) {
      return res.json({ success: true, user });
    }

    const subscription = await getSubscriptionStaffDetail(id);
    return res.json({
      success: true,
      user: {
        ...user,
        lastLogin,
        subscription,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user for support:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/support/users/:id/stats
// Get user statistics (read-only) for the support profile page.
// Supports viewing counts only; no payment details are exposed.
router.get('/users/:id/stats', requireAdminForSensitiveSupport, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Complaints count (user is the owner)
    const complaintsCount = await prisma.complaint.count({
      where: { userId: id },
    });

    // Hires count (as worker or employer)
    const hiresCount = await prisma.hire.count({
      where: {
        OR: [{ workerId: id }, { employerId: id }],
      },
    });

    // Offers count (as worker or employer)
    const offersCount = await prisma.offer.count({
      where: {
        OR: [{ workerId: id }, { employerId: id }],
      },
    });

    // Payments count (read only - no details exposed)
    const paymentsCount = await prisma.payment.count({
      where: {
        OR: [{ userId: id }, { workerId: id }, { employerId: id }],
      },
    });

    // Messages count (via Mongoose Message model used by the chat system)
    let messagesCount = 0;
    try {
      messagesCount = await Message.countDocuments({
        $or: [{ senderId: id }, { receiverId: id }],
      });
    } catch (e) {
      console.error('❌ Error counting messages:', e.message);
    }

    return res.json({
      success: true,
      stats: {
        complaintsCount,
        messagesCount,
        hiresCount,
        offersCount,
        paymentsCount,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user stats for support:', error);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// PUT /api/support/users/:id/suspend
// Temporarily suspend or reactivate a user account
router.put('/users/:id/suspend', requireAdminForSensitiveSupport, async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;
    const supportId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, isSuspended: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent support from suspending themselves or admins
    if (id === supportId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account',
      });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend an admin account',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: suspend === true || suspend === 'true',
        suspendedAt: suspend ? new Date() : null,
        suspendedBy: suspend ? supportId : null,
        suspensionReason: suspend ? reason || 'No reason provided' : null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });

    // Log the activity
    await logActivity(
      supportId,
      suspend ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
      `${suspend ? 'Suspended' : 'Reactivated'} account for user ${user.email}`,
      id
    );

    return res.json({
      success: true,
      message: suspend
        ? 'User account suspended successfully'
        : 'User account reactivated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error suspending/reactivating user:', error);
    return res.status(500).json({ error: 'Failed to update user suspension status' });
  }
});

// POST /api/support/users/:id/reset-password
// Send a secure password reset link to the user
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const supportId = req.userId;
    const supportRole = req.userRole;

    if (supportRole === 'SUPPORT') {
      const key = `${supportId}:${id}`;
      const now = Date.now();
      const recent = (supportResetAttempts.get(key) || []).filter((timestamp) => now - timestamp < SUPPORT_RESET_WINDOW_MS);
      if (recent.length >= SUPPORT_RESET_MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Please try again later' });
      }
      supportResetAttempts.set(key, [...recent, now]);
    }

    // Prevent self-password reset through staff endpoint
    if (id === supportId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset your own password through this endpoint. Use account settings.',
      });
    }

    // Use Mongoose User model (same as authentication)
    const targetUser = await MongooseUser.findById(id).select('email fullName role');
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Authorization: Support cannot reset ADMIN or SUPPORT passwords
    const targetRole = targetUser.role;
    if (targetRole === 'ADMIN' || targetRole === 'SUPPORT') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset passwords for this user role',
      });
    }

    // Create secure reset token and send email
    const result = await createAndSendPasswordReset({
      user: targetUser,
      actorRole: supportRole,
      reason: reason || 'Password reset requested by support',
    });

    if (!result.success) {
      console.error('❌ Failed to send password reset email:', result.error);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to send password reset email',
      });
    }

    // Log the activity (no password or token data)
    await logActivity(
      supportId,
      'PASSWORD_RESET_LINK_SENT',
      `Password reset link sent to ${targetUser.email} (Role: ${targetRole}). Reason: ${reason || 'No reason provided'}`,
      id
    );

    return res.json({
      success: true,
      message: 'Password reset link sent successfully',
    });
  } catch (error) {
    console.error('❌ Error sending password reset link:', error);
    return res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

// POST /api/support/users/:id/suspension-request
// Submit a review request; this route never changes the target account.
router.post('/users/:id/suspension-request', async (req, res) => {
  try {
    if (req.userRole !== 'SUPPORT') {
      return res.status(403).json({ success: false, message: 'Support authorization required' });
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason || reason.length > 500) {
      return res.status(400).json({ success: false, message: 'A concise reason is required' });
    }
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, role: true, isSuspended: true },
    });
    if (!target || !['WORKER', 'EMPLOYER'].includes(target.role)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (target.isSuspended) {
      return res.status(409).json({ success: false, message: 'User is already suspended' });
    }
    const requester = await prisma.user.findUnique({ where: { id: req.userId }, select: { fullName: true } });
    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber: `HS-SR-${Date.now().toString(36).toUpperCase()}`,
        userId: String(req.userId),
        reportedUserId: target.id,
        assignedTo: String(req.userId),
        subject: `[Suspension Request] ${target.fullName}`,
        description: reason,
        category: 'Abuse',
        priority: 'High',
        status: 'ESCALATED',
        escalatedBy: String(req.userId),
        escalatedAt: new Date(),
        escalationReason: reason,
        attachments: [],
      },
    });
    await prisma.complaintTimeline.create({
      data: {
        complaintId: complaint.id,
        action: 'SUSPENSION_REQUESTED',
        description: 'Suspension request submitted for Admin review',
        authorId: String(req.userId),
        authorName: requester?.fullName || 'Support Agent',
        authorRole: 'SUPPORT',
      },
    });
    return res.status(201).json({ success: true, message: 'Suspension request submitted for Admin review' });
  } catch (error) {
    console.error('Support suspension request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to submit suspension request' });
  }
});

// ============================================================
// SUPPORT CONVERSATIONS
// ============================================================

// GET /api/support/conversations
// List support conversations (user <-> support).
// Support sees only their assigned conversations.
// Admin can supervise all support conversations.
router.get('/conversations', async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = req.userRole;

    const Conversation = (await import('../models/Conversation.js')).default;

    const query = { type: 'SUPPORT' };
    if (userRole === 'SUPPORT') {
      query.supportAgentId = userId;
      query.archivedForSupportIds = { $ne: userId };
    }

    const conversationsMeta = await Conversation.find(query).sort({ lastMessageAt: -1 });

    const conversationIds = conversationsMeta.map((conversation) => conversation.conversationId);
    const userParticipantIds = [...new Set(conversationsMeta
      .map((conversation) => conversation.participantIds.find((id) => id !== conversation.supportAgentId))
      .filter((id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)))];
    const [lastMessageRows, unreadRows, users] = await Promise.all([
      conversationIds.length > 0
        ? Message.aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$conversationId', message: { $first: '$$ROOT' } } }
          ])
        : [],
      conversationIds.length > 0
        ? Message.aggregate([
            { $match: { conversationId: { $in: conversationIds }, recipientId: userId, read: false } },
            { $group: { _id: '$conversationId', count: { $sum: 1 } } }
          ])
        : [],
      userParticipantIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userParticipantIds } },
            select: { id: true, fullName: true, email: true, role: true, profileImage: true }
          })
        : []
    ]);
    const lastMessageMap = new Map(lastMessageRows.map((row) => [row._id, row.message]));
    const unreadMap = new Map(unreadRows.map((row) => [row._id, row.count]));
    const userMap = new Map(users.map((user) => [String(user.id), user]));

    const conversations = [];
    for (const conv of conversationsMeta) {
      const lastMsg = lastMessageMap.get(conv.conversationId);
      if (!lastMsg) continue;

      const userParticipantId = conv.participantIds.find((id) => id !== conv.supportAgentId);
      const userInfo = userParticipantId ? userMap.get(String(userParticipantId)) || null : null;
      const unread = unreadMap.get(conv.conversationId) || 0;

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        userId: userParticipantId || null,
        user: userInfo,
        supportAgentId: conv.supportAgentId,
        lastMessage: lastMsg.text,
        lastMessageTime: lastMsg.createdAt,
        time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        updatedAt: conv.lastMessageAt || lastMsg.createdAt
      });
    }

    const activePremiumIds = await getActivePremiumUserIds(conversations.map((conv) => conv.userId));
    conversations.forEach((conv) => {
      if (conv.user) conv.user.isPremium = activePremiumIds.has(String(conv.userId));
    });

    return res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('❌ Error fetching support conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversations' });
  }
});

// GET /api/support/conversations/:id
// Get a single support conversation with messages.
// Support can only access assigned conversations; Admin can supervise all.
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = String(req.userId);
    const userRole = req.userRole;

    const Conversation = (await import('../models/Conversation.js')).default;

    const conv = await Conversation.findOne({ conversationId, type: 'SUPPORT' });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Support can only access assigned conversations; Admin can supervise all
    if (userRole === 'SUPPORT' && conv.supportAgentId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    // DYNAMIC STAFF IDENTITY: refresh sender/recipient names and roles
    // from the database so staff names are always current and correct.
    const enrichedMessages = await enrichMessageIdentities(
      messages.map((msg) => ({
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
      }))
    );

    return res.json({
      success: true,
      conversation: {
        id: conv.conversationId,
        type: conv.type,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId
      },
      messages: enrichedMessages
    });
  } catch (error) {
    console.error('❌ Error fetching support conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversation' });
  }
});

// POST /api/support/conversations/:id/escalate
// Escalate a support conversation to Admin.
// Saves: complaintId, conversationId, escalatedBy, escalatedAt, reason.
// After escalation, Admin gains access to the related conversation.
router.post('/conversations/:id/escalate', async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { reason, complaintId } = req.body;
    const supportId = req.userId;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required',
      });
    }

    const Conversation = (await import('../models/Conversation.js')).default;

    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Only the assigned support agent (or admin) can escalate
    if (conversation.supportAgentId !== supportId && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to escalate this conversation',
      });
    }

    if (complaintId && req.userRole !== 'ADMIN') {
      const relatedComplaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, userId: true, assignedSupport: true, conversationId: true },
      });
      const isRelated = relatedComplaint
        && relatedComplaint.assignedSupport === String(supportId)
        && (relatedComplaint.conversationId === conversationId
          || conversation.complaintId === complaintId
          || conversation.participantIds.includes(String(relatedComplaint.userId)));
      if (!isRelated) {
        return res.status(403).json({ success: false, message: 'Complaint is not related to this conversation' });
      }
    }

    // If a complaintId is provided, verify it exists and update its status
    if (complaintId) {
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, status: true, userId: true },
      });

      if (complaint) {
        await prisma.complaint.update({
          where: { id: complaintId },
          data: {
            status: 'ESCALATED_TO_ADMIN',
            escalatedBy: supportId,
            escalatedAt: new Date(),
            escalationReason: reason,
          },
        });

        await logActivity(
          supportId,
          'COMPLAINT_ESCALATED',
          `Escalated complaint "${complaintId}" to admin. Reason: ${reason}`,
          complaint.userId,
          complaintId
        );
      }
    }

    // Mark the conversation as ESCALATED with full escalation metadata
    const updatedConversation = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        type: 'ESCALATED',
        complaintId: complaintId || null,
        escalatedBy: supportId,
        escalatedAt: new Date(),
        escalationReason: reason,
      },
      { new: true }
    );

    // Log the activity
    await logActivity(
      supportId,
      'CONVERSATION_ESCALATED',
      `Escalated conversation "${conversationId}" to admin. Reason: ${reason}`,
      null,
      complaintId || null
    );

    return res.json({
      success: true,
      message: 'Conversation escalated to admin successfully',
      conversation: {
        conversationId: updatedConversation.conversationId,
        type: updatedConversation.type,
        complaintId: updatedConversation.complaintId,
        escalatedBy: updatedConversation.escalatedBy,
        escalatedAt: updatedConversation.escalatedAt,
        escalationReason: updatedConversation.escalationReason,
      },
    });
  } catch (error) {
    console.error('❌ Error escalating conversation:', error);
    return res.status(500).json({ error: 'Failed to escalate conversation' });
  }
});

// ============================================================
// SUPPORT ACTIVITY LOG
// ============================================================

// GET /api/support/activity
// Get support activity log
router.get('/activity', requireAdminForSensitiveSupport, async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (action) {
      where.action = action;
    }

    const activities = await prisma.supportActivity.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.supportActivity.count({ where });

    return res.json({
      success: true,
      count: activities.length,
      total,
      page: parseInt(page),
      limit: take,
      activities,
    });
  } catch (error) {
    console.error('❌ Error fetching activity log:', error);
    return res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

export default router;
