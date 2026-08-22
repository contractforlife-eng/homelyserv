// backend/src/routes/hires.js
import express from 'express';
import {
  sendOffer,
  respondToOffer,
  getMyHires,
  updateHireStatus,
  hideHireFromEmployer,
  getAllHires,
  getMyOffers,
  updateOfferStatus
} from '../controllers/hireController.js';

import {
  authenticate,
  authorize,
  requireAdmin,
  requireEmployer,
  requireWorker
} from '../middleware/auth.js';
import {
  submitRating,
  getRatingStatus,
  RatingError
} from '../services/ratingService.js';

const router = express.Router();

// ============================================================
// Create a Hire / Send Offer
// ============================================================
router.post('/', requireEmployer, sendOffer);

// ============================================================
// RATING — secure two-way Employer↔Worker ratings (Phase 1).
// Both directions are derived server-side; the client only sends a
// numeric `rating`. Only EMPLOYER/WORKER may rate; ADMIN/SUPPORT and
// unauthenticated callers are rejected by the middleware.
// ============================================================
const submitRatingHandler = async (req, res) => {
  try {
    const result = await submitRating({
      hireId: req.params.hireId,
      rating: req.body?.rating,
      userId: req.userId,
      role: req.userRole,
    });
    return res.status(201).json({
      success: true,
      review: result.review,
      direction: result.direction,
    });
  } catch (error) {
    if (error instanceof RatingError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error('Submit rating error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRatingStatusHandler = async (req, res) => {
  try {
    const status = await getRatingStatus({
      hireId: req.params.hireId,
      userId: req.userId,
      role: req.userRole,
    });
    return res.json(status);
  } catch (error) {
    if (error instanceof RatingError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error('Get rating status error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.post('/:hireId/ratings', authenticate, authorize(['EMPLOYER', 'WORKER']), submitRatingHandler);
router.get('/:hireId/rating-status', authenticate, authorize(['EMPLOYER', 'WORKER']), getRatingStatusHandler);

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
router.patch('/:hireId/hide', authenticate, hideHireFromEmployer);

// ============================================================
// Respond to Offer (accept/reject)
// ============================================================
router.put('/offer/:offerId/respond', requireWorker, respondToOffer);

// ============================================================
// Get All Hires (admin only)
// ============================================================
router.get('/all', requireAdmin, getAllHires);

router.get('/offers', authenticate, getMyOffers);

router.put('/offer/:offerId/status', requireWorker, updateOfferStatus);

export default router;
