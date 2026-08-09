// backend/src/routes/employerEarnings.js
// Employer side of the Worker Earnings ledger (Phase 2).
// Employer-only. Ownership always comes from the authenticated token
// (req.userId); an employer may only act on hires / earnings they own.
import express from 'express';
import { requireEmployer } from '../middleware/auth.js';
import {
  getHireEarnings,
  approveWorkerEarning,
  disputeWorkerEarning,
} from '../controllers/employerEarningController.js';

const router = express.Router();

// GET /api/employer/earnings/hires/:hireId/earnings
router.get('/earnings/hires/:hireId/earnings', requireEmployer, getHireEarnings);

// POST /api/employer/earnings/hires/:hireId/earnings/:earningId/approve
router.post(
  '/earnings/hires/:hireId/earnings/:earningId/approve',
  requireEmployer,
  approveWorkerEarning
);

// POST /api/employer/earnings/hires/:hireId/earnings/:earningId/dispute
router.post(
  '/earnings/hires/:hireId/earnings/:earningId/dispute',
  requireEmployer,
  disputeWorkerEarning
);

export default router;