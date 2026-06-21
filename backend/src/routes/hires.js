const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  sendOffer, 
  getMyHires, 
  confirmPayment, 
  submitPayment 
} = require('../controllers/hireController');

// Send a job offer
router.post('/', auth, sendOffer);

// Get all hires for current user
router.get('/my', auth, getMyHires);

// Submit payment for a hire
router.put('/:id/payment', auth, submitPayment);

// Confirm payment (admin only)
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;