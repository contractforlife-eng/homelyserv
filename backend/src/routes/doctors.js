// backend/src/routes/doctors.js
import express from 'express';
import { requireDoctor } from '../middleware/auth.js';
import { getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import { getClinics, createClinic, updateClinic, deleteClinic } from '../controllers/clinicController.js';
import {
  getDoctorVerification,
  uploadDoctorVerificationDocument,
  requestDoctorVerification,
  getDoctorOwnVerificationDocument
} from '../controllers/doctorVerificationController.js';
import { documentUpload } from '../utils/verificationDocumentUpload.js';

const router = express.Router();

/**
 * Dedicated Doctor Routes
 * All endpoints require DOCTOR role authentication via requireDoctor middleware.
 */

// Multer rejects unsupported types/sizes. Convert those into a clean 400
// instead of letting them bubble into the generic 500 error handler.
const uploadSingleDocument = (req, res, next) => {
  documentUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed. Allowed types: JPG, PNG, WebP, PDF (max 10MB).'
      });
    }
    next();
  });
};

// Profile self-service endpoints
router.get('/profile', requireDoctor, getDoctorProfile);
router.put('/profile', requireDoctor, updateDoctorProfile);

// Clinics management endpoints
router.get('/clinics', requireDoctor, getClinics);
router.post('/clinics', requireDoctor, createClinic);
router.put('/clinics/:id', requireDoctor, updateClinic);
router.delete('/clinics/:id', requireDoctor, deleteClinic);

// Verification self-service endpoints
router.get('/verification', requireDoctor, getDoctorVerification);
router.post('/verification/request', requireDoctor, requestDoctorVerification);
router.post('/verification/:type/document', requireDoctor, uploadSingleDocument, uploadDoctorVerificationDocument);
router.get('/verification/:type/document', requireDoctor, getDoctorOwnVerificationDocument);

export default router;
