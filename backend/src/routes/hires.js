const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendOffer, getMyHires, confirmPayment, submitPayment } = require('../controllers/hireController');

router.post('/', auth, sendOffer);
router.get('/my', auth, getMyHires);
router.put('/:id/payment', auth, submitPayment);
router.put('/:id/confirm-payment', auth, confirmPayment);

module.exports = router;