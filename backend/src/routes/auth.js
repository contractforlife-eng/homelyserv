const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');
const { socialLogin } = require('../controllers/socialAuthController');
const authMiddleware = require('../middleware/auth');
const prisma = require('../utils/prisma');

// ============================================
// PUBLIC ROUTES - No authentication required
// ============================================

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Google OAuth login
router.post('/google-login', googleLogin);

// Social login (Facebook, Twitter, Telegram, Signal)
router.post('/social-login', socialLogin);

// ============================================
// PROTECTED ROUTES - Authentication required
// ============================================

// Get current user profile
router.get('/me', authMiddleware, getMe);

// Switch user role (Worker <-> Employer)
router.put('/switch-role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!['WORKER', 'EMPLOYER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be WORKER or EMPLOYER' });
    }
    
    // Update user role
    await prisma.user.update({
      where: { id: req.userId },
      data: { role: role }
    });
    
    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        workerProfile: {
          select: {
            category: true,
            ratingAvg: true,
            profilePhotoUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend or unsuspend a user (admin only)
router.put('/users/:userId/suspend', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { suspended } = req.body;
    const { userId } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from suspending themselves
    if (userId === req.userId) {
      return res.status(400).json({ message: 'You cannot suspend your own account' });
    }

    // Update user suspension status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: suspended }
    });

    res.json({ 
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`, 
      user: {
        id: user.id,
        fullName: user.fullName,
        isSuspended: user.isSuspended
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;