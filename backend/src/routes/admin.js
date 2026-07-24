// backend/src/routes/admin.js
import express from 'express';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

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
// Get All Complaints (Admin Only)
// ============================================================
router.get('/complaints', async (req, res) => {
  try {
    // Note: No Complaint model exists in the current schema.
    // Returning empty array with explanation for future implementation.
    res.json({
      success: true,
      complaints: [],
      message: 'Complaints model not yet implemented'
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

export default router;