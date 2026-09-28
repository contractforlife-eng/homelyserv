// backend/src/routes/medical.js
// Dedicated router for User-authored Medical Profile (Phase 6).
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyMedicalProfile,
  updateMyMedicalProfile,
  deleteMyMedicalProfile,
  getPatientConsultations,
  getPatientConsultationById,
  getPatientPrescriptions,
  getPatientPrescriptionById
} from '../controllers/medicalProfileController.js';

const router = express.Router();

// All endpoints require authentication
router.use(authenticate);

// My Medical Profile endpoints
router.get('/profile', getMyMedicalProfile);
router.put('/profile', updateMyMedicalProfile);
router.delete('/profile', deleteMyMedicalProfile);

// Patient Consultation Records endpoints (Phase 8: READ-ONLY for patient's own SIGNED records)
router.get('/consultations', getPatientConsultations);
router.get('/consultations/:id', getPatientConsultationById);

// Patient Prescription Records endpoints (Phase 9: READ-ONLY for patient's own ISSUED records)
router.get('/prescriptions', getPatientPrescriptions);
router.get('/prescriptions/:id', getPatientPrescriptionById);

export default router;
