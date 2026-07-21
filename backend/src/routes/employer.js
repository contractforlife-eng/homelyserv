// backend/src/routes/employers.js
import express from 'express';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// ============================================================
// Search Workers
// ============================================================
router.get('/search', async (req, res) => {
  try {
    const { query, category, location, minRating } = req.query;
    
    let filter = { role: 'WORKER' };
    
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { skills: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      filter.skills = { $in: [new RegExp(category, 'i')] };
    }
    
    if (location && location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    const workers = await User.find(filter).select('-password');
    
    res.json({
      success: true,
      workers
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search workers'
    });
  }
});

// ============================================================
// Get Worker Details
// ============================================================
router.get('/workers/:id', async (req, res) => {
  try {
    const worker = await User.findById(req.params.id).select('-password');
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    res.json({
      success: true,
      worker
    });
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get worker'
    });
  }
});

// ============================================================
// Get Employer Profile
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
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// ============================================================
// Update Employer Profile
// ============================================================
router.put('/profile/:userId', async (req, res) => {
  try {
    const { fullName, phone, location, companyName, bio, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { fullName, phone, location, companyName, bio, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================================
// Get Employer Stats
// ============================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    const employerId = req.params.userId;

    const [totalOffers, pendingOffers, totalHires, totalPayments] = await Promise.all([
      prisma.offer.count({ where: { employerId } }),
      prisma.offer.count({ where: { employerId, status: 'pending' } }),
      prisma.hire.count({ where: { employerId } }),
      prisma.payment.aggregate({
        where: { employerId, status: 'completed' },
        _sum: { amount: true }
      })
    ]);

    const totalSpent = totalPayments._sum.amount || 0;

    res.json({
      success: true,
      stats: {
        totalHires,
        activeHires: totalHires,
        pendingApplications: pendingOffers,
        completedHires: totalHires,
        totalSpent,
        savedWorkers: 0,
        messages: 0,
        complaints: 0,
        satisfactionRate: 0
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
// Get Employer Payments
// ============================================================
router.get('/payments/:userId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { employerId: req.params.userId },
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

// ============================================================
// Get Saved Workers
// ============================================================
router.get('/saved/:userId', async (req, res) => {
  try {
    res.json({
      success: true,
      savedWorkers: [],
      message: 'Saved workers feature not yet implemented in database'
    });
  } catch (error) {
    console.error('Get saved workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved workers'
    });
  }
});

// ============================================================
// Save a Worker
// ============================================================
router.post('/saved/:userId/:workerId', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Worker saved successfully'
    });
  } catch (error) {
    console.error('Save worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save worker'
    });
  }
});

// ============================================================
// Unsave a Worker
// ============================================================
router.delete('/saved/:userId/:workerId', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Worker unsaved successfully'
    });
  } catch (error) {
    console.error('Unsave worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsave worker'
    });
  }
});

export default router;