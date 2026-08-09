// backend/src/routes/workerEarnings.js
// Worker Earnings Ledger — Phase 1.
// Worker-only. Ownership always comes from the authenticated token
// (req.userId). There is no :userId ownership parameter, so Worker A
// can never read Worker B's records. Support/Admin access is NOT added
// in Phase 1.
import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import { getWorkerEarnings } from '../controllers/workerEarningController.js';

const router = express.Router();

// GET /api/worker/earnings
router.get('/earnings', requireWorker, getWorkerEarnings);

export default router;