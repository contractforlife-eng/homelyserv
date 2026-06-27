import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  upsertProfile, getMyProfile, searchWorkers, getWorkerById
} from '../controllers/workerController.js';

const router = express.Router();

router.get('/search', searchWorkers);
router.get('/me', authMiddleware, getMyProfile);
router.post('/profile', authMiddleware, upsertProfile);
router.get('/:id', getWorkerById);

export default router;