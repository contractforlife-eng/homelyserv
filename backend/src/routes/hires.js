// backend/src/routes/hires.js
import express from 'express';
import {
  sendOffer,
  respondToOffer,
  getMyHires,
  updateHireStatus,
  getAllHires
} from '../controllers/hireController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// Create a Hire / Send Offer
// ============================================================
router.post('/', authenticate, sendOffer);

// ============================================================
// Get Hires for a User
// ============================================================
router.get('/user/:userId', authenticate, getMyHires);

// ============================================================
// Update Hire Status
// ============================================================
router.put('/:hireId/status', updateHireStatus);

// ============================================================
// Respond to Offer (accept/reject)
// ============================================================
router.put('/offer/:offerId/respond', authenticate, respondToOffer);

// ============================================================
// Get All Hires (admin only)
// ============================================================
router.get('/all', getAllHires);

export default router;