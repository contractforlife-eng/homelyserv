// Support routes - Extended for user management, complaint workflow, and activity logging
import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.js';
import { requireSupport as supportAuth } from '../middleware/supportAuth.js';
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';
import MongooseUser from '../models/User.js';
import { enrichMessageIdentities } from '../utils/staffIdentity.js';

const router = express.Router();

// All routes require authentication and support/admin role
router.use(authenticate);
router.use(supportAuth);

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
    const { search, role, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (role) {
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

    return res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
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
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching users for support:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/support/users/:id
// Get a single user's profile (read-only)
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
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        phone: true,
        city: true,
        language: true,
        WorkerProfile: {
          select: {
            category: true,
            experienceYears: true,
            expectedSalary: true,
            availability: true,
            workType: true,
            skills: true,
            ratingAvg: true,
            ratingCount: true,
            docStatus: true,
          },
        },
        EmployerProfile: {
          select: {
            companyName: true,
            companyWebsite: true,
            companySize: true,
            industry: true,
            isVerified: true,
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

    return res.json({
      success: true,
      user: {
        ...user,
        lastLogin,
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
router.get('/users/:id/stats', async (req, res) => {
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
router.put('/users/:id/suspend', async (req, res) => {
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
// Reset a user's password with a temporary password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const supportId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate a temporary password
    const tempPassword = 'Temp@' + Math.random().toString(36).slice(2, 10) + Math.floor(1000, 9999);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    // Log the activity
    await logActivity(
      supportId,
      'PASSWORD_RESET',
      `Reset password for user ${user.email}. Reason: ${reason || 'No reason provided'}`,
      id
    );

    return res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword,
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
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

      let userInfo = null;
      if (userParticipantId) {
        try {
          userInfo = await prisma.user.findUnique({
            where: { id: userParticipantId },
            select: { id: true, fullName: true, email: true, role: true, profileImage: true }
          });
        } catch (e) {
          console.error('Error fetching user:', e.message);
        }
      }

      const unread = await Message.countDocuments({
        conversationId: conv.conversationId,
        recipientId: userId,
        read: false
      });

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
router.get('/activity', async (req, res) => {
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
