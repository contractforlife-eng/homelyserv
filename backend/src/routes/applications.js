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
  applyPublicToJob,
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  sendOfferFromApplication,
} from '../controllers/applicationController.js';
import { requireWorker, requireEmployer, optionalAuthenticate } from '../middleware/auth.js';
import { documentUpload } from '../utils/verificationDocumentUpload.js';

const router = express.Router();

// Safe multer wrapper for optional CV upload that handles file format/size errors gracefully
const uploadCvOptional = (req, res, next) => {
  documentUpload.single('cv')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid CV file format or size (max 10MB, PDF/JPG/PNG/WebP).',
      });
    }
    next();
  });
};

// ============================================================
// PUBLIC & VISITOR routes
// ============================================================

// POST /api/jobs/:id/apply-public — Apply from public page
// Unauthenticated visitors register & apply with optional CV;
// Authenticated workers can apply directly with optional CV.
router.post('/:id/apply-public', optionalAuthenticate, uploadCvOptional, applyPublicToJob);

// ============================================================
// WORKER routes
// ============================================================

// GET /api/jobs/applications/mine — Worker's own applications
// (defined before /:id routes so "applications" is not captured as a job id)
router.get('/applications/mine', requireWorker, getMyApplications);

// PATCH /api/jobs/applications/:id/withdraw — Worker owner only
router.patch('/applications/:id/withdraw', requireWorker, withdrawApplication);

// POST /api/jobs/:id/apply — Worker applies to a job (with optional CV)
router.post('/:id/apply', requireWorker, uploadCvOptional, applyToJob);

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
