// backend/src/routes/admin.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// ============================================================
// Get All Users (Admin Only)
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// ============================================================
// Get User by ID (Admin Only)
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
      message: 'Failed to get user'
    });
  }
});

// ============================================================
// Suspend User (Admin Only)
// ============================================================
router.post('/users/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'SUSPENDED',
        suspensionReason: reason 
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

// ============================================================
// Activate User (Admin Only)
// ============================================================
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'ACTIVE' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    });
  }
});

// ============================================================
// Delete User (Admin Only)
// ============================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// ============================================================
// Get Dashboard Stats (Admin Only)
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEmployers = await User.countDocuments({ role: 'EMPLOYER' });
    const totalWorkers = await User.countDocuments({ role: 'WORKER' });
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });
    const suspendedUsers = await User.countDocuments({ status: 'SUSPENDED' });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEmployers,
        totalWorkers,
        activeUsers,
        suspendedUsers,
        totalPayments: 0,
        totalComplaints: 0,
        totalHires: 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
});

// ============================================================
// Get All Payments (Admin Only)
// ============================================================
router.get('/payments', async (req, res) => {
  try {
    // In production, fetch from Payment model
    res.json({
      success: true,
      payments: []
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
// Get All Complaints (Admin Only)
// ============================================================
router.get('/complaints', async (req, res) => {
  try {
    // In production, fetch from Complaint model
    res.json({
      success: true,
      complaints: []
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complaints'
    });
  }
});

// ============================================================
// Get All Hires (Admin Only)
// ============================================================
router.get('/hires', async (req, res) => {
  try {
    // In production, fetch from Hire model
    res.json({
      success: true,
      hires: []
    });
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hires'
    });
  }
});

export default router;