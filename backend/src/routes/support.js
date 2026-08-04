// Support routes - Limited access for support staff
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireSupport as supportAuth } from '../middleware/supportAuth.js';
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';

const router = express.Router();

// All routes require authentication and support/admin role
router.use(authenticate);
router.use(supportAuth);

// GET /api/support/users
// Return users list for support lookup (read-only)
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = {};
    if (search) {
      filter.OR = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }

    // Get users from Prisma (for WORKER, EMPLOYER, SUPPORT roles)
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        isVerified: true,
        isSuspended: true
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.user.count({ where: filter });

    return res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      users: users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.image || null,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        isSuspended: user.isSuspended
      }))
    });
  } catch (error) {
    console.error('Error fetching users for support:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/support/stats
// Return basic support statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get total conversations (unique conversation IDs)
    const totalConversations = await Message.distinct('conversationId').then(ids => ids.length);
    
    // Get unread messages count
    const unreadMessages = await Message.countDocuments({
      read: false
    });

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const roleStats = {};
    usersByRole.forEach(item => {
      roleStats[item.role] = item._count.role;
    });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalConversations,
        unreadMessages,
        usersByRole: roleStats
      }
    });
  } catch (error) {
    console.error('Error fetching support stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/support/conversations
// Get all conversations for support staff
router.get('/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all messages grouped by conversation
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Group by conversationId
    const conversationsMap = new Map();
    
    for (const msg of messages) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          lastMessage: msg,
          participants: new Set()
        });
      }
      
      const conv = conversationsMap.get(msg.conversationId);
      conv.participants.add(msg.senderId);
      conv.participants.add(msg.recipientId);
    }

    // Convert to array and get participant details
    const conversations = await Promise.all(
      Array.from(conversationsMap.values()).map(async (conv) => {
        const participantIds = Array.from(conv.participants);
        const participants = await prisma.user.findMany({
          where: {
            id: {
              in: participantIds
            }
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            image: true
          }
        });

        const unreadCount = await Message.countDocuments({
          conversationId: conv.conversationId,
          read: false
        });

        return {
          conversationId: conv.conversationId,
          lastMessage: {
            text: conv.lastMessage.text,
            senderId: conv.lastMessage.senderId,
            senderName: conv.lastMessage.senderName,
            senderRole: conv.lastMessage.senderRole,
            createdAt: conv.lastMessage.createdAt
          },
          participants,
          unreadCount
        };
      })
    );

    return res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;