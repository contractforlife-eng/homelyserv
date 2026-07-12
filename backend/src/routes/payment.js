import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getWorkerPayments } from '../controllers/paymentController.js';

// تعريف الـ router مرة واحدة فقط
const router = express.Router(); 

// استخدام الـ router بعد تعريفه مباشرة
router.get('/my-payments', authenticate, getWorkerPayments);

// تصدير الـ router
export default router;