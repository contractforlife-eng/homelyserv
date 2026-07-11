// backend/src/routes/employers.js
import express from 'express';
import User from '../models/User.js';

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
    // In production, calculate real stats from database
    res.json({
      success: true,
      stats: {
        totalHires: 12,
        activeHires: 5,
        pendingApplications: 3,
        completedHires: 4,
        totalSpent: 45000,
        savedWorkers: 8,
        messages: 6,
        complaints: 1,
        satisfactionRate: 94
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
    // In production, fetch from Payment model
    res.json({
      success: true,
      payments: [
        {
          id: 'PAY-001',
          amount: 3500,
          status: 'completed',
          date: new Date().toISOString(),
          workerName: 'Ahmed Hassan',
          jobTitle: 'Nurse'
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

// ============================================================
// Get Saved Workers
// ============================================================
router.get('/saved/:userId', async (req, res) => {
  try {
    // In production, fetch from SavedWorker model
    res.json({
      success: true,
      savedWorkers: []
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
    // In production, save to SavedWorker model
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
    // In production, remove from SavedWorker model
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