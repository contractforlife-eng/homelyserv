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

// Test route
router.post('/test', createTestHire);

// Offer routes
router.post('/', auth, sendOffer);
router.put('/:id/accept', auth, acceptOffer);
router.put('/:id/decline', auth, declineOffer);

// Hire routes
router.get('/all', auth, getAllHires);
router.get('/my', auth, getMyHires);

// Payment routes
router.put('/:id/payment', auth, submitPayment);
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;