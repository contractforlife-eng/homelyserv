const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const { 
  sendOffer, getMyHires, confirmPayment, 
  submitPayment, getAllHires 
} = require('../controllers/hireController');

router.post('/', auth, sendOffer);
router.get('/all', auth, getAllHires);
router.get('/my', auth, getMyHires);
router.put('/:id/payment', auth, upload.single('receipt'), submitPayment);
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;