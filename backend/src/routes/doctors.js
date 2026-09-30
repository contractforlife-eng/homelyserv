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
import {
  getDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule
} from '../controllers/doctorScheduleController.js';
import {
  getDoctorAppointments,
  getDoctorAppointmentById,
  createDoctorAppointment,
  updateDoctorAppointmentStatus
} from '../controllers/doctorAppointmentController.js';
import {
  getDoctorPatients,
  getDoctorPatientDetails,
  getDoctorPatientAppointments,
  getDoctorPatientMedicalProfile
} from '../controllers/doctorPatientController.js';
import {
  createClinicPatient,
  getClinicPatients,
  getClinicPatientById,
  updateClinicPatient,
  getClinicPatientAppointments
} from '../controllers/doctorClinicPatientController.js';
import {
  getClinicPatientMedicalRecord,
  upsertClinicPatientMedicalRecord
} from '../controllers/clinicPatientMedicalRecordController.js';
import {
  getDoctorPatientConsultations,
  getDoctorPatientConsultationById,
  createDoctorConsultation,
  updateDoctorConsultation,
  deleteDoctorConsultationDraft,
  signDoctorConsultation,
  createDoctorConsultationAmendment
} from '../controllers/doctorConsultationController.js';
import {
  getDoctorConsultationPrescriptions,
  getDoctorConsultationPrescriptionById,
  createDoctorPrescription,
  updateDoctorPrescription,
  deleteDoctorPrescriptionDraft,
  issueDoctorPrescription,
  cancelDoctorPrescription
} from '../controllers/doctorPrescriptionController.js';
import {
  getDoctorServices,
  getDoctorServiceById,
  createDoctorService,
  updateDoctorService,
  setDoctorServiceActive,
  deleteDoctorService
} from '../controllers/doctorServiceController.js';
import {
  getDoctorDashboardSummary
} from '../controllers/doctorDashboardController.js';
import {
  getDoctorAnalytics
} from '../controllers/doctorAnalyticsController.js';
import {
  getDoctorMedicalCenter,
  updateDoctorMedicalCenterFees,
  addMedicalCenterPatient,
  removeMedicalCenterPatient,
  getMedicalCenterPatientSummary
} from '../controllers/doctorMedicalCenterController.js';
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

// Schedule management endpoints
router.get('/schedule', requireDoctor, getDoctorSchedules);
router.post('/schedule', requireDoctor, createDoctorSchedule);
router.put('/schedule/:id', requireDoctor, updateDoctorSchedule);
router.delete('/schedule/:id', requireDoctor, deleteDoctorSchedule);

// Appointments management endpoints
router.get('/appointments', requireDoctor, getDoctorAppointments);
router.get('/appointments/:id', requireDoctor, getDoctorAppointmentById);
router.post('/appointments', requireDoctor, createDoctorAppointment);
router.put('/appointments/:id/status', requireDoctor, updateDoctorAppointmentStatus);

// Services & Pricing management endpoints (Doctor Center)
router.get('/services', requireDoctor, getDoctorServices);
router.post('/services', requireDoctor, createDoctorService);
router.get('/services/:id', requireDoctor, getDoctorServiceById);
router.put('/services/:id', requireDoctor, updateDoctorService);
router.put('/services/:id/active', requireDoctor, setDoctorServiceActive);
router.delete('/services/:id', requireDoctor, deleteDoctorService);

// HomelyServ Medical Center endpoints (Doctor workspace)
router.get('/medical-center', requireDoctor, getDoctorMedicalCenter);
router.put('/medical-center/fees', requireDoctor, updateDoctorMedicalCenterFees);
router.post('/medical-center/patients', requireDoctor, addMedicalCenterPatient);
router.delete('/medical-center/patients/:patientId', requireDoctor, removeMedicalCenterPatient);
router.get('/medical-center/patients/:patientId/summary', requireDoctor, getMedicalCenterPatientSummary);

// Doctor dashboard summary (real backend data)
router.get('/dashboard/summary', requireDoctor, getDoctorDashboardSummary);

// Doctor Premium Analytics / Profile Performance (real backend data)
router.get('/analytics/performance', requireDoctor, getDoctorAnalytics);

// Patients management endpoints
router.get('/patients', requireDoctor, getDoctorPatients);
router.get('/patients/:patientId', requireDoctor, getDoctorPatientDetails);
router.get('/patients/:patientId/appointments', requireDoctor, getDoctorPatientAppointments);
router.get('/patients/:patientId/medical-profile', requireDoctor, getDoctorPatientMedicalProfile);

// ============================================================
// CLINIC PATIENTS (independent, doctor-owned records)
// Added in Phase 1. These do NOT require a HomelyServ account and
// are completely separate from the HomelyServ /patients endpoints
// above, which keep their existing appointment-derived behaviour.
// No delete endpoint in this phase.
// ============================================================
router.get('/clinic-patients', requireDoctor, getClinicPatients);
router.post('/clinic-patients', requireDoctor, createClinicPatient);

// ClinicPatient consultations (additive). The patient is identified by the
// `clinicPatientId` QUERY param and scoped to the logged-in doctor.
// Same lifecycle (DRAFT -> SIGNED -> AMENDED) as HomelyServ.
//
// These literal routes MUST stay declared ABOVE `/clinic-patients/:patientId`.
// Express matches in declaration order, so the parameterised route would
// otherwise swallow the literal `consultations` segment (`:patientId =
// "consultations"`), dispatching every request here to
// `getClinicPatientById` and answering 404 "Clinic patient not found".
router.get('/clinic-patients/consultations', requireDoctor, getDoctorPatientConsultations);
router.get('/clinic-patients/consultations/:id', requireDoctor, getDoctorPatientConsultationById);
router.post('/clinic-patients/consultations', requireDoctor, createDoctorConsultation);
router.put('/clinic-patients/consultations/:id', requireDoctor, updateDoctorConsultation);
router.delete('/clinic-patients/consultations/:id', requireDoctor, deleteDoctorConsultationDraft);
router.post('/clinic-patients/consultations/:id/sign', requireDoctor, signDoctorConsultation);
router.post('/clinic-patients/consultations/:id/amend', requireDoctor, createDoctorConsultationAmendment);

router.get('/clinic-patients/:patientId', requireDoctor, getClinicPatientById);
router.put('/clinic-patients/:patientId', requireDoctor, updateClinicPatient);

// Doctor-maintained persistent medical background for a ClinicPatient.
// Distinct from the patient-authored PatientMedicalProfile flow.
router.get(
  '/clinic-patients/:patientId/medical-record',
  requireDoctor,
  getClinicPatientMedicalRecord
);
router.put(
  '/clinic-patients/:patientId/medical-record',
  requireDoctor,
  upsertClinicPatientMedicalRecord
);

// Phase 2B — appointments for this doctor's own ClinicPatient.
// Scoped by doctorId; a ClinicPatient owned by another doctor yields 404.
router.get(
  '/clinic-patients/:patientId/appointments',
  requireDoctor,
  getClinicPatientAppointments
);

// Doctor Clinical Consultations endpoints (Phase 8)
// HomelyServ routes (existing, unchanged):
router.get('/patients/:patientId/consultations', requireDoctor, getDoctorPatientConsultations);
router.get('/patients/:patientId/consultations/:id', requireDoctor, getDoctorPatientConsultationById);
router.post('/patients/:patientId/consultations', requireDoctor, createDoctorConsultation);
router.put('/patients/:patientId/consultations/:id', requireDoctor, updateDoctorConsultation);
router.delete('/patients/:patientId/consultations/:id', requireDoctor, deleteDoctorConsultationDraft);
router.post('/patients/:patientId/consultations/:id/sign', requireDoctor, signDoctorConsultation);
router.post('/patients/:patientId/consultations/:id/amend', requireDoctor, createDoctorConsultationAmendment);

// NOTE: the ClinicPatient consultation routes live ABOVE
// `/clinic-patients/:patientId` so the literal `consultations` segment is
// matched before the parameterised route can swallow it.

// Doctor Prescriptions endpoints (Phase 9)
router.get('/patients/:patientId/consultations/:consultationId/prescriptions', requireDoctor, getDoctorConsultationPrescriptions);
router.get('/patients/:patientId/consultations/:consultationId/prescriptions/:id', requireDoctor, getDoctorConsultationPrescriptionById);
router.post('/patients/:patientId/consultations/:consultationId/prescriptions', requireDoctor, createDoctorPrescription);
router.put('/patients/:patientId/consultations/:consultationId/prescriptions/:id', requireDoctor, updateDoctorPrescription);
router.delete('/patients/:patientId/consultations/:consultationId/prescriptions/:id', requireDoctor, deleteDoctorPrescriptionDraft);
router.post('/patients/:patientId/consultations/:consultationId/prescriptions/:id/issue', requireDoctor, issueDoctorPrescription);
router.post('/patients/:patientId/consultations/:consultationId/prescriptions/:id/cancel', requireDoctor, cancelDoctorPrescription);

// Verification self-service endpoints
router.get('/verification', requireDoctor, getDoctorVerification);
router.post('/verification/request', requireDoctor, requestDoctorVerification);
router.post('/verification/:type/document', requireDoctor, uploadSingleDocument, uploadDoctorVerificationDocument);
router.get('/verification/:type/document', requireDoctor, getDoctorOwnVerificationDocument);

export default router;
