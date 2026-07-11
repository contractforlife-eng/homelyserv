// backend/src/routes/workers.js
import express from 'express';
import User from '../models/User.js';

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
    res.json({ success: true, user });
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
router.put('/profile/:userId', async (req, res) => {
  try {
    const { fullName, phone, location, bio, skills, experience, hourlyRate, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { fullName, phone, location, bio, skills, experience, hourlyRate, profileImage },
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
// Get Worker Stats
// ============================================================
router.get('/stats/:userId', async (req, res) => {
  try {
    // In production, calculate real stats from database
    res.json({
      success: true,
      stats: {
        tasksCompleted: 42,
        totalTasks: 50,
        completionRate: 84,
        tasksReceived: 65,
        tasksRefused: 8,
        refusalRate: 12,
        totalEarnings: 28500,
        avgRating: 4.8,
        activeOffers: 3,
        totalOffers: 12
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
    // In production, fetch from Payment model
    res.json({
      success: true,
      payments: [
        {
          id: 'PAY-001',
          amount: 3500,
          status: 'completed',
          date: new Date().toISOString(),
          employer: 'Elite Family Services'
        }
      ]
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