import express from 'express';
import { 
  getAllWorkers,
  getWorkerById,
  searchWorkers,
  updateWorkerProfile,
  getTopRatedWorkers,
  getWorkerStats
} from '../controllers/workerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllWorkers);
router.get('/search', searchWorkers);
router.get('/top-rated', getTopRatedWorkers);
router.get('/:id', getWorkerById);

// Protected routes
router.put('/profile', authenticate, updateWorkerProfile);
router.get('/stats', authenticate, getWorkerStats);

export default router;