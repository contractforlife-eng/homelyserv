// backend/src/routes/admin.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

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
        totalPayments: 0,
        totalComplaints: 0,
        totalHires: 0
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
    // In production, fetch from Payment model
    res.json({
      success: true,
      payments: []
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
      message: 'Failed to get complaints',
      error: error.message
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

export default router;