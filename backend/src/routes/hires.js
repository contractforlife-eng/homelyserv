const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  sendOffer, 
  getMyHires, 
  getAllHires,
  confirmPayment, 
  submitPayment,
  createTestHire,
  acceptOffer,
  declineOffer
} = require('../controllers/hireController');

// ============================================
// TEST ROUTE (for development)
// ============================================

// Create test hire data
router.post('/test', createTestHire);

// ============================================
// PROTECTED ROUTES - Authentication required
// ============================================

// Send job offer to worker
router.post('/', auth, sendOffer);

// Worker accepts offer
router.put('/:id/accept', auth, acceptOffer);

// Worker declines offer
router.put('/:id/decline', auth, declineOffer);

// Get my hires (for current user - employer or worker)
router.get('/my', auth, getMyHires);

// Submit payment proof for a hire
router.put('/:id/payment', auth, submitPayment);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all hires (admin only)
router.get('/all', auth, getAllHires);

// Confirm payment (admin only)
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;