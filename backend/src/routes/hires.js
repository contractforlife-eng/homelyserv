// backend/src/routes/hires.js
import express from 'express';
import {
  sendOffer,
  respondToOffer,
  getMyHires,
  updateHireStatus,
  getAllHires,
  getMyOffers,
  updateOfferStatus
} from '../controllers/hireController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// Create a Hire / Send Offer
// ============================================================
router.post('/', authenticate, sendOffer);

// ============================================================
// Get Hires for a User (backward compatible)
// ============================================================
router.get('/my-hires', authenticate, getMyHires);
router.get('/user/:userId', authenticate, getMyHires);

// ============================================================
// Update Hire Status
// ============================================================
// PHASE 2 SECURITY FIX: previously unauthenticated — anyone could set
// any hire to any status. Now requires auth; the controller restricts
// which statuses may be set and verifies ownership (EMPLOYER owner or
// ADMIN).
router.put('/:hireId/status', authenticate, updateHireStatus);

// ============================================================
// Respond to Offer (accept/reject)
// ============================================================
router.put('/offer/:offerId/respond', authenticate, respondToOffer);

// ============================================================
// Get All Hires (admin only)
// ============================================================
router.get('/all', getAllHires);

router.get('/offers', authenticate, getMyOffers);

router.put('/offer/:offerId/status', authenticate, updateOfferStatus);

export default router;