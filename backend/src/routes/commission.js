// backend/src/routes/commission.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { recordCommissionPayment } from '../controllers/commissionController.js';

const router = express.Router();

// Record commission payment after successful payment
// POST /api/commission/record
router.post('/record', authenticate, recordCommissionPayment);

export default router;