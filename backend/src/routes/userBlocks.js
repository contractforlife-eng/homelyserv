import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { blockUser, getBlockStatus, unblockUser } from '../controllers/userBlockController.js';

const router = express.Router();

router.post('/block-user', authenticate, blockUser);
router.delete('/block-user', authenticate, unblockUser);
router.get('/block-user/status', authenticate, getBlockStatus);

export default router;
