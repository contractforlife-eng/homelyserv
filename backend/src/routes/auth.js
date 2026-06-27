import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/switch-role', authMiddleware, async (req, res) => {
  const prisma = await import('../utils/prisma.js').then(m => m.default);
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

export default router;