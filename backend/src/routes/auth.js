const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { socialLogin } = require('../controllers/socialAuthController');
const { googleLogin } = require('../controllers/googleAuthController');
const authMiddleware = require('../middleware/auth');
const prisma = require('../utils/prisma');

// PUBLIC routes - no auth required
router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/google-login', googleLogin);

// PROTECTED routes - auth required
router.get('/me', authMiddleware, getMe);

// GET ALL USERS (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
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
            ratingAvg: true
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

// Suspend/Unsuspend user (admin only)
router.put('/users/:userId/suspend', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { suspended } = req.body;
    const { userId } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId === req.userId) {
      return res.status(400).json({ message: 'You cannot suspend your own account' });
    }

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

// Switch role
router.put('/switch-role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['WORKER', 'EMPLOYER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be WORKER or EMPLOYER' });
    }
    
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

module.exports = router;