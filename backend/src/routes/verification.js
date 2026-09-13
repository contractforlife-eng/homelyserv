// backend/src/routes/verification.js
// ============================================================
// PROFILE VERIFICATION REST API
// ============================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import { documentUpload } from '../utils/verificationDocumentUpload.js';
import {
  getVerificationDetails,
  getPublicVerification,
  requestVerification,
  uploadUserVerificationDocument,
  uploadIdentityDocument
} from '../services/profileVerificationService.js';

const router = express.Router();

/**
 * GET /api/verification/me
 * Retrieves current authenticated user's detailed verification status.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const verification = getVerificationDetails(user);
    return res.json({ success: true, verification });
  } catch (error) {
    console.error('GET /api/verification/me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load verification status' });
  }
});

/**
 * POST /api/verification/upload-document
 * Uploads a verification document (Government ID, Work Experience, Certifications/Licenses).
 * Authenticated user only.
 */
router.post(
  '/upload-document',
  authenticate,
  (req, res, next) => {
    documentUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed. Allowed types: JPG, PNG, WebP, PDF (max 10MB).'
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file was uploaded'
        });
      }

      const { notes, type, verificationType } = req.body || {};
      const targetType = type || verificationType || 'identity';

      const result = await uploadUserVerificationDocument({
        userId: req.userId,
        verificationType: targetType,
        fileBuffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalFilename: req.file.originalname,
        size: req.file.size,
        notes
      });

      return res.json(result);
    } catch (error) {
      console.error('POST /api/verification/upload-document error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload verification document'
      });
    }
  }
);

/**
 * POST /api/verification/request
 * Submits a verification request for identity, experience, certificates, or phone.
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    const { type, notes } = req.body || {};
    if (!type) {
      return res.status(400).json({ success: false, message: 'Verification type is required' });
    }

    const verification = await requestVerification(req.userId, { type, notes });
    return res.json({
      success: true,
      message: 'Verification request submitted successfully',
      verification
    });
  } catch (error) {
    console.error('POST /api/verification/request error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/verification/user/:userId
 * Retrieves safe public verification indicators for another user.
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'phoneVerified phoneVerificationStatus emailVerified identityVerificationStatus experienceVerificationStatus certificatesVerificationStatus'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const verification = getPublicVerification(user);
    return res.json({ success: true, verification });
  } catch (error) {
    console.error('GET /api/verification/user/:userId error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load verification' });
  }
});

export default router;
