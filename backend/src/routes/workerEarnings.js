// backend/src/routes/workerEarnings.js
// Worker Earnings Ledger — Phase 1 read + Phase 2 confirmation submit.
// Worker-only. Ownership always comes from the authenticated token
// (req.userId). There is no :userId ownership parameter, so Worker A
// can never read or act on Worker B's records. Support/Admin access is
// NOT added in Phase 1.
import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import {
  getWorkerEarnings,
  submitWorkerEarning,
} from '../controllers/workerEarningController.js';

const router = express.Router();

// GET /api/worker/earnings
router.get('/earnings', requireWorker, getWorkerEarnings);

// POST /api/worker/earnings/:earningId/submit
// Worker submits a PENDING period for employer confirmation.
// Ownership and state guards are enforced in the controller/service.
router.post('/earnings/:earningId/submit', requireWorker, submitWorkerEarning);

export default router;