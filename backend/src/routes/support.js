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
    const take = parseInt(limit);
    
    // Build Prisma where clause
    const where = {};
    
    // Add role filter if provided
    if (role) {
      where.role = role;
    }
    
    // Add search filter if provided - using Prisma's contains with case-insensitive mode
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Get users from Prisma
    const users = await prisma.user.findMany({
      where,
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
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.user.count({ where });

    return res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      limit: take,
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
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/support/stats
// Return basic support statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get total conversations (unique conversation IDs) - using Mongoose
    const totalConversations = await Message.distinct('conversationId').then(ids => ids.length);
    
    // Get unread messages count - using Mongoose
    const unreadMessages = await Message.countDocuments({
      read: false
    });

    // Get users by role - using Prisma groupBy
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
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
