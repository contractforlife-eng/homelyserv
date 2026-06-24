const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const prisma = require('../utils/prisma');

// PUBLIC routes - no auth required
router.post('/register', register);
router.post('/login', login);

// PROTECTED routes - auth required
router.get('/me', authMiddleware, getMe);

// Switch role - PROTECTED
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

module.exports = router;