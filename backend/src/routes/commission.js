// backend/src/routes/commission.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Legacy commission recording is permanently disabled. Authentication remains
// required so this route preserves its previous access boundary while rejecting
// every new write attempt before any financial controller is invoked.
// POST /api/commission/record
router.post('/record', authenticate, (_req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Legacy commission payment flow is no longer supported.'
  });
});

export default router;
