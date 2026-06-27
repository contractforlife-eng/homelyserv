const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/switch-role', authMiddleware, async (req, res) => {
  const prisma = require('../utils/prisma');
  try {
    const { role } = req.body;
    if (!['WORKER', 'EMPLOYER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await prisma.user.update({
      where: { id: req.userId },
      data: { role }
    });
    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;