// backend/src/routes/doctors.js
import express from 'express';
import { requireDoctor } from '../middleware/auth.js';
import { getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import { getClinics, createClinic, updateClinic, deleteClinic } from '../controllers/clinicController.js';

const router = express.Router();

/**
 * Dedicated Doctor Routes
 * All endpoints require DOCTOR role authentication via requireDoctor middleware.
 */

// Profile self-service endpoints
router.get('/profile', requireDoctor, getDoctorProfile);
router.put('/profile', requireDoctor, updateDoctorProfile);

// Clinics management endpoints
router.get('/clinics', requireDoctor, getClinics);
router.post('/clinics', requireDoctor, createClinic);
router.put('/clinics/:id', requireDoctor, updateClinic);
router.delete('/clinics/:id', requireDoctor, deleteClinic);

export default router;
