// backend/src/routes/complaints.js
// ============================================================
// COMPLAINT ROUTES
// User routes: /api/complaints
// Support routes: /api/support/complaints
// Admin routes: /api/admin/complaints
// ============================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireSupport } from '../middleware/supportAuth.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload, uploadFromBuffer } from '../utils/cloudinary.js';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  userReply,
  supportListComplaints,
  supportGetComplaint,
  requireAssignedSupportComplaint,
  supportAssignComplaint,
  supportReply,
  supportAddNote,
  supportChangeStatus,
  supportEscalate,
  supportClose,
  adminListComplaints,
  adminGetComplaint,
  adminReply,
  adminReassign,
  adminResolve,
  adminClose,
  adminReturnToSupport,
  adminEscalatedComplaints,
  supportStats,
  supportDashboard,
  adminComplaintStats,
} from '../controllers/complaintController.js';
import { reportUser, reportMessage, reportProfile } from '../controllers/reportController.js';

const router = express.Router();

const requireAdminForSupportAnalytics = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin authorization required' });
  }
  return next();
};

const requireAdminForSupportAssignment = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin authorization required' });
  }
  return next();
};

// ============================================================
// USER COMPLAINT ROUTES (WORKER / EMPLOYER)
// ============================================================

// POST /api/complaints/upload - Upload a complaint attachment image
router.post(
  '/complaints/upload',
  authenticate,
  upload.single('attachment'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No attachment uploaded',
        });
      }

      const uploaded = await uploadFromBuffer(req.file.buffer, {
        folder: 'homelyserv/complaints',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      });

      return res.json({
        success: true,
        message: 'Attachment uploaded successfully',
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      });
    } catch (error) {
      console.error('❌ Error uploading complaint attachment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload attachment',
        error: error.message,
      });
    }
  }
);

// POST /api/complaints - Create a new complaint
router.post('/complaints', authenticate, createComplaint);

// Structured messaging reports. These are additive to the generic complaint flow.
router.post('/complaints/report-user', authenticate, reportUser);
router.post('/complaints/report-message', authenticate, reportMessage);
router.post('/complaints/report-profile', authenticate, reportProfile);

// GET /api/complaints/my - Get my complaints
router.get('/complaints/my', authenticate, getMyComplaints);

// GET /api/complaints/:id - Get a single complaint (owner only)
router.get('/complaints/:id', authenticate, getComplaintById);

// POST /api/complaints/:id/reply - User replies to their complaint
router.post('/complaints/:id/reply', authenticate, userReply);

// ============================================================
// SUPPORT COMPLAINT ROUTES
// ============================================================

// GET /api/support/complaints - List complaints (support/admin)
router.get('/support/complaints', authenticate, requireSupport, supportListComplaints);

// GET /api/support/complaints/:id - Get complaint details
router.get('/support/complaints/:id', authenticate, requireSupport, requireAssignedSupportComplaint, supportGetComplaint);

// POST /api/support/complaints/:id/assign - Assign to self
router.post('/support/complaints/:id/assign', authenticate, requireSupport, requireAdminForSupportAssignment, supportAssignComplaint);

// POST /api/support/complaints/:id/reply - Support reply
router.post('/support/complaints/:id/reply', authenticate, requireSupport, requireAssignedSupportComplaint, supportReply);

// POST /api/support/complaints/:id/notes - Add internal note
router.post('/support/complaints/:id/notes', authenticate, requireSupport, requireAssignedSupportComplaint, supportAddNote);

// PUT /api/support/complaints/:id/status - Change status
router.put('/support/complaints/:id/status', authenticate, requireSupport, requireAssignedSupportComplaint, supportChangeStatus);

// POST /api/support/complaints/:id/escalate - Escalate to admin
router.post('/support/complaints/:id/escalate', authenticate, requireSupport, requireAssignedSupportComplaint, supportEscalate);

// POST /api/support/complaints/:id/close - Close complaint
router.post('/support/complaints/:id/close', authenticate, requireSupport, requireAssignedSupportComplaint, supportClose);

// GET /api/support/stats - Support dashboard statistics
router.get('/support/stats', authenticate, requireSupport, requireAdminForSupportAnalytics, supportStats);

// GET /api/support/dashboard - Support workspace dashboard data
router.get('/support/dashboard', authenticate, requireSupport, requireAdminForSupportAnalytics, supportDashboard);

// ============================================================
// ADMIN COMPLAINT ROUTES
// ============================================================

// GET /api/admin/complaints - List all complaints (admin)
router.get('/admin/complaints', authenticate, requireAdmin, adminListComplaints);

// GET /api/admin/complaints/stats - Admin complaint statistics
router.get('/admin/complaints/stats', authenticate, requireAdmin, adminComplaintStats);

// GET /api/admin/complaints/escalated - Escalated complaints (backward-compatible)
router.get('/admin/complaints/escalated', authenticate, requireAdmin, adminEscalatedComplaints);

// GET /api/admin/complaints/:id - Get complaint details
router.get('/admin/complaints/:id', authenticate, requireAdmin, adminGetComplaint);

// POST /api/admin/complaints/:id/reply - Admin reply
router.post('/admin/complaints/:id/reply', authenticate, requireAdmin, adminReply);

// POST /api/admin/complaints/:id/reassign - Reassign to support
router.post('/admin/complaints/:id/reassign', authenticate, requireAdmin, adminReassign);

// PUT /api/admin/complaints/:id/resolve - Resolve complaint
router.put('/admin/complaints/:id/resolve', authenticate, requireAdmin, adminResolve);

// PUT /api/admin/complaints/:id/close - Close complaint
router.put('/admin/complaints/:id/close', authenticate, requireAdmin, adminClose);

// POST /api/admin/complaints/:id/return - Return to support
router.post('/admin/complaints/:id/return', authenticate, requireAdmin, adminReturnToSupport);

export default router;
