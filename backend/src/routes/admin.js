// backend/src/routes/admin.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getCommandCenter } from '../controllers/adminCommandCenterController.js';

const router = express.Router();

const serializeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.id = obj._id;
  return obj;
};

// PHASE 0 SECURITY FIX (audit §2.2): this entire router previously had
// NO authentication or authorization check at all - any anonymous
// request could list/search all users, view PII, suspend/activate/
// delete accounts, etc. Every route below now requires a valid JWT
// belonging to a user with role === 'ADMIN'.
router.use(requireAdmin);

// ============================================================
// Admin Command Center (Admin Only)
// Aggregated dashboard endpoint returning all platform KPIs,
// needs-attention complaints, recent activity, recent users,
// recent payments, and recent hires in a single response.
// ============================================================
router.get('/command-center', getCommandCenter);

// ============================================================
// Get All Users (Admin Only) - FIXED: Shows ALL users
// ============================================================
router.get('/users', async (req, res) => {
  try {
    // Get ALL users - NO filters, NO conditions
    const users = await User.find({})
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 }); // Newest first

    console.log(`✅ Admin route: Found ${users.length} users`);
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// ============================================================
// Get User by ID (Admin Only) - FIXED: Better error handling
// ============================================================
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// ============================================================
// Suspend User (Admin Only) - FIXED: Better handling
// ============================================================
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'SUSPENDED',
        suspensionReason: reason || 'No reason provided',
        suspendedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`🚫 User suspended: ${user.email}`);
    
    res.json({
      success: true,
      user,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
});

// ============================================================
// Activate User (Admin Only) - FIXED: Better handling
// ============================================================
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'ACTIVE',
        suspensionReason: null,
        suspendedAt: null
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User activated: ${user.email}`);
    
    res.json({
      success: true,
      user,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
});

// ============================================================
// Reset User Password (Admin Only)
// ============================================================
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetAt = new Date();
    user.mustChangePassword = true;
    await user.save();

    console.log(`🔑 Password reset for user: ${user.email}`);

    const userData = serializeUser(user);
    delete userData.password;

    res.json({
      success: true,
      message: 'Password reset successfully',
      user: userData
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// ============================================================
// Delete User (Admin Only) - FIXED: Added safety check
// ============================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Safety: Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    
    console.log(`🗑️ User deleted: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// ============================================================
// Get Dashboard Stats (Admin Only) - FIXED: Better stats
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEmployers = await User.countDocuments({ role: 'EMPLOYER' });
    const totalWorkers = await User.countDocuments({ role: 'WORKER' });
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const suspendedUsers = await User.countDocuments({ status: 'SUSPENDED' });
    const pendingUsers = await User.countDocuments({ status: 'PENDING' });
    
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get Prisma stats
    const totalHires = await prisma.hire.count();
    const totalOffers = await prisma.offer.count();
    const totalPayments = await prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEmployers,
        totalWorkers,
        activeUsers,
        suspendedUsers,
        pendingUsers,
        newUsersLast7Days: newUsers,
        totalPayments: totalPayments._sum.amount || 0,
        totalComplaints: 0,
        totalHires
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
});

// ============================================================
// Get All Payments (Admin Only)
// ============================================================
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
});

// ============================================================
// Get All Hires (Admin Only)
// ============================================================
router.get('/hires', async (req, res) => {
  try {
    const hires = await prisma.hire.findMany({
      include: {
        worker: {
          include: { user: { select: { fullName: true, phone: true, city: true } } }
        },
        employer: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      hires
    });
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hires',
      error: error.message
    });
  }
});

// ============================================================
// ADD THIS: Search Users (Admin Only)
// ============================================================
router.get('/users/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(20);
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// ============================================================
// ADD THIS: Get Users by Role (Admin Only)
// ============================================================
router.get('/users/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role: role.toUpperCase() })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// ============================================================
// Get Admin Profile
// ============================================================
router.get('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin profile'
    });
  }
});

// ============================================================
// Update Admin Profile
// ============================================================
router.put('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fullName, phone, language, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, phone, language, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile'
    });
  }
});

// ============================================================
// Get System Settings
// ============================================================
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'platform' });
    
    if (!settings) {
      settings = await SystemSettings.create({
        key: 'platform',
        data: {
          siteName: 'HomelyServ',
          siteDescription: 'Home Services Platform',
          contactEmail: 'admin@homelyserv.com',
          contactPhone: '',
          address: '',
          darkMode: false,
          primaryColor: '#f59e0b',
          secondaryColor: '#d97706',
          language: 'en',
          systemNotifications: true,
          emailNotifications: true,
          pushNotifications: true,
          complaintNotifications: true,
          paymentNotifications: true,
          twoFactorAuth: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          requireEmailVerification: false,
          requirePhoneVerification: false,
          currency: 'EGP',
          commissionRate: 10,
          minWithdrawal: 100,
          maxWithdrawal: 10000,
          paymentMethods: ['cash', 'bank_transfer'],
          allowRegistration: true,
          requireApproval: false,
          maxUsersPerIp: 5,
          autoSuspendAfter: 30,
          debugMode: false,
          maintenanceMode: false,
          cacheEnabled: true,
          backupSchedule: 'daily'
        }
      });
    }

    res.json({
      success: true,
      settings: settings.data
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system settings'
    });
  }
});

// ============================================================
// Update System Settings
// ============================================================
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = req.body.settings || req.body;
    
    const settings = await SystemSettings.findOneAndUpdate(
      { key: 'platform' },
      { data: data },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'System settings saved successfully',
      settings: settings.data
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

// ============================================================
// ADMIN MESSAGING - SECURE CONVERSATION ACCESS
// ============================================================
// Admin does NOT have automatic access to private user chats.
// Admin can only access:
//   1. Escalated conversations (after support escalates)
//   2. Support conversations (supervision)
//   3. Internal staff messages (Support <-> Admin)
// ============================================================

const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

const formatMessage = (msg) => {
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
};

// POST /api/admin/start-conversation
// Start an official HomelyServ administrative conversation with a user.
// Conversation type is SUPPORT (for WORKER/EMPLOYER/USER) or INTERNAL (for SUPPORT).
// Never PRIVATE. Private user chats remain completely isolated.
router.post('/start-conversation', async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = String(req.userId);

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Look up the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, fullName: true, email: true, role: true, image: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine conversation type:
    //   WORKER/EMPLOYER/USER -> SUPPORT (admin acts as support agent)
    //   SUPPORT/ADMIN        -> INTERNAL (staff-to-staff)
    const targetRole = targetUser.role;
    let conversationType = 'SUPPORT';
    let supportAgentId = adminId;
    let staffIds = [];

    if (targetRole === 'SUPPORT' || targetRole === 'ADMIN') {
      conversationType = 'INTERNAL';
      staffIds = [adminId, String(targetUser.id)];
      supportAgentId = null;
    }

    // Build conversation ID (deterministic, same as chat system)
    const conversationId = getConversationId(adminId, targetUser.id);

    // Check if an administrative conversation already exists
    const existingConv = await Conversation.findOne({ conversationId });
    if (existingConv) {
      return res.json({
        success: true,
        conversationId,
        conversation: {
          id: existingConv.conversationId,
          type: existingConv.type,
          participantIds: existingConv.participantIds,
          supportAgentId: existingConv.supportAgentId,
          staffIds: existingConv.staffIds
        },
        existing: true
      });
    }

    // Create conversation metadata
    await Conversation.create({
      conversationId,
      type: conversationType,
      participantIds: [adminId, String(targetUser.id)],
      supportAgentId,
      staffIds,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Official HomelyServ administrative conversation'
    });

    // Create the initial system message
    await Message.create({
      conversationId,
      senderId: adminId,
      senderName: 'HomelyServ Admin',
      senderRole: 'ADMIN',
      recipientId: String(targetUser.id),
      recipientName: targetUser.fullName || 'User',
      recipientRole: targetRole,
      text: 'This is an official HomelyServ administrative conversation. How can we help you?',
      read: false,
      delivered: true
    });

    return res.status(201).json({
      success: true,
      conversationId,
      conversation: {
        id: conversationId,
        type: conversationType,
        participantIds: [adminId, String(targetUser.id)],
        supportAgentId,
        staffIds
      },
      existing: false
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// GET /api/admin/escalated-conversations
// List conversations escalated to Admin by Support.
router.get('/escalated-conversations', async (req, res) => {
  try {
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

      // Get user participant info
      const userParticipantId = conv.participantIds.find(
        id => id !== conv.supportAgentId
      );

      let userInfo = null;
      if (userParticipantId) {
        try {
          userInfo = await prisma.user.findUnique({
            where: { id: userParticipantId },
            select: { id: true, fullName: true, email: true, role: true, image: true }
          });
        } catch (e) {
          console.error('Error fetching user:', e.message);
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
        user: userInfo,
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
    console.error('Error fetching escalated conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch escalated conversations' });
  }
});

// GET /api/admin/support-conversations
// List all support conversations (user <-> support) for supervision.
router.get('/support-conversations', async (req, res) => {
  try {
    const conversationsMeta = await Conversation.find({
      type: 'SUPPORT'
    }).sort({ lastMessageAt: -1 });

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

      // Find the user participant (non-support)
      const userParticipantId = conv.participantIds.find(
        id => id !== conv.supportAgentId
      );

      let userInfo = null;
      if (userParticipantId) {
        try {
          userInfo = await prisma.user.findUnique({
            where: { id: userParticipantId },
            select: { id: true, fullName: true, email: true, role: true, image: true }
          });
        } catch (e) {
          console.error('Error fetching user:', e.message);
        }
      }

      let supportInfo = null;
      if (conv.supportAgentId) {
        try {
          supportInfo = await prisma.user.findUnique({
            where: { id: conv.supportAgentId },
            select: { id: true, fullName: true, email: true, role: true, image: true }
          });
        } catch (e) {
          console.error('Error fetching support agent:', e.message);
        }
      }

      conversations.push({
        id: conv.conversationId,
        type: conv.type,
        userId: userParticipantId || null,
        user: userInfo,
        supportAgentId: conv.supportAgentId,
        supportAgent: supportInfo,
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
    console.error('Error fetching support conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch support conversations' });
  }
});

// GET /api/admin/internal-messages
// List internal staff conversations (Support <-> Admin).
router.get('/internal-messages', async (req, res) => {
  try {
    const userId = String(req.userId);

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

      let otherStaffInfo = null;
      if (otherStaffId) {
        try {
          otherStaffInfo = await prisma.user.findUnique({
            where: { id: otherStaffId },
            select: { id: true, fullName: true, email: true, role: true, image: true }
          });
        } catch (e) {
          console.error('Error fetching staff member:', e.message);
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
        otherStaffId: otherStaffId || null,
        otherStaff: otherStaffInfo,
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
    console.error('Error fetching internal messages:', error);
    return res.status(500).json({ error: 'Failed to fetch internal messages' });
  }
});

// GET /api/admin/conversations/:conversationId/messages
// Get messages for an admin-accessible conversation.
// Access is verified: only ESCALATED, SUPPORT, or INTERNAL conversations
// where the admin is a staff member.
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = String(req.userId);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Admin access rules:
    // - ESCALATED: admin can access after escalation
    // - SUPPORT: admin can supervise
    // - INTERNAL: admin must be a staff member
    let allowed = false;
    if (conv.type === 'ESCALATED' && conv.escalatedAt) {
      allowed = true;
    } else if (conv.type === 'SUPPORT') {
      allowed = true;
    } else if (conv.type === 'INTERNAL' && conv.staffIds.includes(userId)) {
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      conversation: {
        id: conv.conversationId,
        type: conv.type,
        complaintId: conv.complaintId,
        escalatedBy: conv.escalatedBy,
        escalatedAt: conv.escalatedAt,
        escalationReason: conv.escalationReason,
        participantIds: conv.participantIds,
        supportAgentId: conv.supportAgentId
      },
      messages: messages.map(formatMessage)
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
});

// ============================================================
// One-Time Migration: Normalize Offer.workerId and Hire.workerId
// from legacy User._id to WorkerProfile.id
// Remove this endpoint after running successfully.
// ============================================================
router.post('/migrate/offer-worker-ids', async (req, res) => {
  try {
    const [offers, hires, workerProfiles] = await Promise.all([
      prisma.offer.findMany(),
      prisma.hire.findMany(),
      prisma.workerProfile.findMany()
    ]);

    const profileById = new Map(workerProfiles.map(p => [p.id, p]));
    const profileByUserId = new Map(workerProfiles.map(p => [p.userId, p]));

    let scannedOffers = 0;
    let updatedOffers = 0;
    let skippedOffers = 0;

    let scannedHires = 0;
    let updatedHires = 0;
    let skippedHires = 0;

    for (const offer of offers) {
      scannedOffers++;
      if (profileById.has(offer.workerId)) {
        skippedOffers++;
        continue;
      }
      const profile = profileByUserId.get(offer.workerId);
      if (profile) {
        await prisma.offer.update({
          where: { id: offer.id },
          data: { workerId: profile.id }
        });
        updatedOffers++;
      } else {
        skippedOffers++;
      }
    }

    for (const hire of hires) {
      scannedHires++;
      if (profileById.has(hire.workerId)) {
        skippedHires++;
        continue;
      }
      const profile = profileByUserId.get(hire.workerId);
      if (profile) {
        await prisma.hire.update({
          where: { id: hire.id },
          data: { workerId: profile.id }
        });
        updatedHires++;
      } else {
        skippedHires++;
      }
    }

    console.log(
      `Migration complete: offers scanned=${scannedOffers} updated=${updatedOffers} skipped=${skippedOffers}; ` +
      `hires scanned=${scannedHires} updated=${updatedHires} skipped=${skippedHires}`
    );

    res.json({
      success: true,
      message: 'Migration completed',
      offers: { scanned: scannedOffers, updated: updatedOffers, skipped: skippedOffers },
      hires: { scanned: scannedHires, updated: updatedHires, skipped: skippedHires }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

export default router;