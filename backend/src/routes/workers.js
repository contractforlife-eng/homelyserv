// backend/src/routes/workers.js
import express from 'express';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// Get Worker Profile
// ============================================================
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;
    res.json({ success: true, user: userObj });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// ============================================================
// Update Worker Profile
// ============================================================
router.put('/profile/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    console.log('[WorkerProfile] req.params.userId:', targetUserId);
    console.log('[WorkerProfile] req.userId:', authenticatedUserId);
    console.log('[WorkerProfile] req.body:', req.body);

    if (targetUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const { fullName, phone, location, bio, skills, experience, hourlyRate, profileImage, desiredJob } = req.body;
    
    const user = await User.findByIdAndUpdate(
      authenticatedUserId,
      { fullName, phone, location, bio, skills, experience, hourlyRate, profileImage, desiredJob },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;

    res.json({ success: true, user: userObj });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================================
// Get Worker Stats
// ============================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const profile = await prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const [
      totalOffers,
      acceptedOffers,
      totalHires,
      totalPayments,
      avgRating
    ] = await Promise.all([
      prisma.offer.count({ where: { workerId: profile.id } }),
      prisma.offer.count({ where: { workerId: profile.id, status: 'accepted' } }),
      prisma.hire.count({ where: { workerId: profile.id } }),
      prisma.payment.aggregate({
        where: { workerId: profile.id, status: 'completed' },
        _sum: { amount: true }
      }),
      prisma.review.aggregate({
        where: { workerId: profile.id },
        _avg: { rating: true }
      })
    ]);

    const totalEarnings = totalPayments._sum.amount || 0;
    const avgRatingValue = avgRating._avg.rating || 0;

    res.json({
      success: true,
      stats: {
        tasksCompleted: totalHires,
        totalTasks: totalHires,
        completionRate: totalHires > 0 ? Math.round((totalHires / totalOffers) * 100) : 0,
        tasksReceived: totalOffers,
        tasksRefused: totalOffers - acceptedOffers,
        refusalRate: totalOffers > 0 ? Math.round(((totalOffers - acceptedOffers) / totalOffers) * 100) : 0,
        totalEarnings,
        avgRating: Math.round(avgRatingValue * 10) / 10,
        activeOffers: totalOffers - acceptedOffers,
        totalOffers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

// ============================================================
// Get Worker Payments
// ============================================================
router.get('/payments/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const profile = await prisma.workerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.json({
        success: true,
        payments: []
      });
    }

    const payments = await prisma.payment.findMany({
      where: { workerId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

export default router;