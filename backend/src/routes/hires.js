const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  sendOffer, 
  getMyHires, 
  confirmPayment, 
  submitPayment, 
  getAllHires,
  createTestHire
} = require('../controllers/hireController');

// Public test route (no auth required for testing)
router.post('/test', createTestHire);

// Protected routes
router.post('/', auth, sendOffer);
router.get('/all', auth, getAllHires);
router.get('/my', auth, getMyHires);
router.put('/:id/payment', auth, submitPayment);
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;