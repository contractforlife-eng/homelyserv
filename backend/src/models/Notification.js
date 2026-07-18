import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({ userId: userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;