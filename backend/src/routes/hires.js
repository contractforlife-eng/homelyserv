import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  sendOffer, getMyHires, confirmPayment,
  submitPayment, getAllHires
} from '../controllers/hireController.js';

const router = express.Router();

router.post('/', authMiddleware, sendOffer);
router.get('/all', authMiddleware, getAllHires);
router.get('/my', authMiddleware, getMyHires);
router.put('/:id/payment', authMiddleware, submitPayment);
router.put('/:id/confirm-payment', authMiddleware, confirmPayment);

export default router;