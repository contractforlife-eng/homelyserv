// backend/src/routes/applications.js
// ============================================================
// JOB APPLICATION — Phase 2 Job Marketplace routes.
// Mounted under /api/jobs (see backend/src/index.js).
//
// IMPORTANT ROUTE ORDER:
// /applications/... routes are defined BEFORE generic /:id routes
// so Express does not interpret "applications" as a job id.
// ============================================================
import express from 'express';
import {
  applyToJob,
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  sendOfferFromApplication,
} from '../controllers/applicationController.js';
import { requireWorker, requireEmployer } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// WORKER routes
// ============================================================

// GET /api/jobs/applications/mine — Worker's own applications
// (defined before /:id routes so "applications" is not captured as a job id)
router.get('/applications/mine', requireWorker, getMyApplications);

// PATCH /api/jobs/applications/:id/withdraw — Worker owner only
router.patch('/applications/:id/withdraw', requireWorker, withdrawApplication);

// POST /api/jobs/:id/apply — Worker applies to a job
router.post('/:id/apply', requireWorker, applyToJob);

// ============================================================
// EMPLOYER routes
// ============================================================

// GET /api/jobs/:id/applications — Employer owner only
router.get('/:id/applications', requireEmployer, getJobApplications);

// PATCH /api/jobs/applications/:id/status — Employer owner only
router.patch('/applications/:id/status', requireEmployer, updateApplicationStatus);

// POST /api/jobs/applications/:id/send-offer — Employer owner only
router.post('/applications/:id/send-offer', requireEmployer, sendOfferFromApplication);

export default router;