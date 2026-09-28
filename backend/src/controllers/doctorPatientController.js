// backend/src/controllers/doctorPatientController.js
import mongoose from 'mongoose';
import DoctorAppointment from '../models/DoctorAppointment.js';
import User from '../models/User.js';
import PatientMedicalProfile from '../models/PatientMedicalProfile.js';
import MedicalAccessLog from '../models/MedicalAccessLog.js';
import { isUserPremium } from '../services/premiumService.js';
import {
  hasValidDoctorPatientRelationship,
  VALID_PATIENT_RELATIONSHIP_STATUSES
} from '../services/doctorPatientAccessService.js';

// Helper to check for valid 24-character hexadecimal MongoDB ObjectId
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * GET /api/doctors/patients
 * List all unique patients who have an established appointment relationship
 * (CONFIRMED or COMPLETED) with the authenticated doctor.
 * Deduplicated, non-medical summaries only.
 */
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.userId;

    // Find all qualifying appointments for this doctor
    const qualifyingAppointments = await DoctorAppointment.find({
      doctorId,
      status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
    })
      .populate('patientId', 'fullName profileImage email language')
      .populate('clinicId', 'clinicName city addressLine')
      .sort({ startsAt: -1 });

    // Aggregate by unique patientId
    const patientMap = new Map();

    for (const apt of qualifyingAppointments) {
      if (!apt.patientId) continue;
      const pId = String(apt.patientId._id || apt.patientId);

      if (!patientMap.has(pId)) {
        patientMap.set(pId, {
          patientId: pId,
          patientName: apt.patientId.fullName || 'Patient',
          profileImage: apt.patientId.profileImage || null,
          totalAppointments: 1,
          lastAppointmentDate: apt.startsAt,
          firstAppointmentDate: apt.startsAt,
          latestStatus: apt.status,
          latestConsultationType: apt.consultationType,
          latestClinic: apt.clinicId
            ? {
                clinicName: apt.clinicId.clinicName,
                city: apt.clinicId.city
              }
            : null
        });
      } else {
        const existing = patientMap.get(pId);
        existing.totalAppointments += 1;
        // Since appointments are sorted desc by startsAt, the last one visited is the earliest
        existing.firstAppointmentDate = apt.startsAt;
      }
    }

    const patients = Array.from(patientMap.values());

    return res.json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching patients',
      error: error.message
    });
  }
};

/**
 * GET /api/doctors/patients/:patientId
 * Get non-medical patient details for a patient with an established relationship.
 * Returns 404 if no relationship exists or user is not found.
 */
export const getDoctorPatientDetails = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify legitimate relationship
    const isAuthorized = await hasValidDoctorPatientRelationship(doctorId, patientId);
    if (!isAuthorized) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Only fields a doctor is already authorised to see for an established
    // patient relationship. `phone` was previously SELECTED but never
    // returned in the DTO, so it silently never displayed. `location` is
    // added because `city` does not exist on the User schema.
    // Deliberately NOT exposed: password, tokenVersion, role/status,
    // suspensionReason, registration* metadata (all `select: false`),
    // skills/bio, and email — the detail contract does not include it.
    const patientUser = await User.findById(patientId)
      .select('fullName profileImage phone language city countryName location');
    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Query all appointments between this doctor and patient for aggregate metrics
    const patientAppointments = await DoctorAppointment.find({
      doctorId,
      patientId
    }).sort({ startsAt: -1 });

    const totalCount = patientAppointments.length;
    const latestAppointment = patientAppointments[0] || null;
    const firstAppointment = patientAppointments[patientAppointments.length - 1] || null;

    return res.json({
      success: true,
      patient: {
        patientId: String(patientUser._id),
        patientName: patientUser.fullName,
        profileImage: patientUser.profileImage || null,
        phone: patientUser.phone || '',
        language: patientUser.language || 'en',
        city: patientUser.city || '',
        countryName: patientUser.countryName || '',
        location: patientUser.location || '',
        appointmentCount: totalCount,
        firstAppointmentDate: firstAppointment ? firstAppointment.startsAt : null,
        latestAppointmentDate: latestAppointment ? latestAppointment.startsAt : null,
        latestAppointmentStatus: latestAppointment ? latestAppointment.status : null
      }
    });
  } catch (error) {
    console.error('Error fetching doctor patient details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching patient details',
      error: error.message
    });
  }
};

/**
 * GET /api/doctors/patients/:patientId/appointments
 * Get all appointments between the authenticated Doctor and the specific Patient.
 * Scoped strictly to: doctorId = req.userId AND patientId = :patientId.
 */
export const getDoctorPatientAppointments = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify legitimate relationship
    const isAuthorized = await hasValidDoctorPatientRelationship(doctorId, patientId);
    if (!isAuthorized) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointments = await DoctorAppointment.find({
      doctorId,
      patientId
    })
      .populate('clinicId', 'clinicName city addressLine')
      .populate('serviceId', 'serviceName price durationMinutes')
      .sort({ startsAt: -1 });

    // Sanitize output - strictly non-medical fields
    const sanitizedAppointments = appointments.map((apt) => ({
      appointmentId: apt._id,
      startsAt: apt.startsAt,
      endsAt: apt.endsAt,
      status: apt.status,
      consultationType: apt.consultationType,
      clinic: apt.clinicId
        ? {
            clinicName: apt.clinicId.clinicName,
            city: apt.clinicId.city,
            addressLine: apt.clinicId.addressLine
          }
        : null,
      service: apt.serviceId
        ? {
            serviceName: apt.serviceId.serviceName,
            price: apt.serviceId.price,
            durationMinutes: apt.serviceId.durationMinutes
          }
        : null,
      reason: apt.reason || '',
      feeSnapshot: apt.feeSnapshot || 0,
      currency: apt.currency || 'EGP',
      createdAt: apt.createdAt
    }));

    return res.json({
      success: true,
      count: sanitizedAppointments.length,
      appointments: sanitizedAppointments
    });
  } catch (error) {
    console.error('Error fetching doctor patient appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching patient appointments',
      error: error.message
    });
  }
};

/**
 * GET /api/doctors/patients/:patientId/medical-profile
 * Securely retrieves a patient's self-authored medical profile for an authenticated Doctor.
 *
 * Authorization Chain:
 * 1. Authenticate (handled by authenticateToken middleware).
 * 2. Require Doctor role (handled by requireDoctor middleware).
 * 3. Validate Doctor/Patient relationship (CONFIRMED or COMPLETED appointment).
 * 4. Verify patient's Premium eligibility.
 * 5. Check for active PatientMedicalProfile.
 * 6. Verify explicit patient consent (consentToShareWithDoctors === true).
 * 7. Create immutable audit record in MedicalAccessLog.
 * 8. Return sanitized medical profile.
 */
export const getDoctorPatientMedicalProfile = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Step 3: Validate Doctor/Patient relationship
    const isAuthorized = await hasValidDoctorPatientRelationship(doctorId, patientId);
    if (!isAuthorized) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Step 4: Verify Patient Premium Eligibility
    const patientIsPremium = await isUserPremium(patientId);
    if (!patientIsPremium) {
      return res.status(403).json({
        success: false,
        code: 'PATIENT_PREMIUM_REQUIRED',
        message: 'Patient does not have an active Premium membership for medical profile sharing.'
      });
    }

    // Step 5: Check Active Medical Profile
    const profile = await PatientMedicalProfile.findOne({
      userId: patientId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No active medical profile found for this patient.'
      });
    }

    // Step 6: Check Consent
    if (!profile.consentToShareWithDoctors) {
      return res.status(403).json({
        success: false,
        code: 'MEDICAL_PROFILE_CONSENT_REQUIRED',
        message: 'The patient has not granted permission to share their medical profile with doctors.'
      });
    }

    // Step 7: Record Access (Append-only MedicalAccessLog)
    // Find the latest qualifying appointment to associate with this access event
    const qualifyingAppt = await DoctorAppointment.findOne({
      doctorId,
      patientId,
      status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
    }).sort({ startsAt: -1 });

    try {
      await MedicalAccessLog.create({
        doctorId,
        patientId,
        medicalProfileId: profile._id,
        appointmentId: qualifyingAppt?._id || null,
        action: 'VIEW_MEDICAL_PROFILE',
        accessedAt: new Date()
      });
    } catch (logErr) {
      console.error('Warning: Failed to write MedicalAccessLog:', logErr.message);
      // We log but do not fail the request if the audit write encountered a transient issue
    }

    // Step 8: Return sanitized medical profile
    const sanitizedProfile = {
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : null,
      sex: profile.sex || null,
      bloodGroup: profile.bloodGroup || null,
      heightCm: profile.heightCm ?? null,
      weightKg: profile.weightKg ?? null,
      chronicConditions: Array.isArray(profile.chronicConditions) ? profile.chronicConditions : [],
      allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
      currentMedications: Array.isArray(profile.currentMedications) ? profile.currentMedications : [],
      surgeries: Array.isArray(profile.surgeries) ? profile.surgeries : [],
      familyHistory: profile.familyHistory || '',
      smokingStatus: profile.smokingStatus || null,
      disabilityStatus: profile.disabilityStatus || '',
      emergencyContact: {
        name: profile.emergencyContact?.name || '',
        relationship: profile.emergencyContact?.relationship || '',
        phone: profile.emergencyContact?.phone || ''
      },
      consentToShareWithDoctors: Boolean(profile.consentToShareWithDoctors),
      lastReviewedAt: profile.lastReviewedAt ? profile.lastReviewedAt.toISOString() : null
    };

    return res.status(200).json({
      success: true,
      profile: sanitizedProfile
    });
  } catch (error) {
    console.error('Error fetching patient medical profile for doctor:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving patient medical profile',
      error: error.message
    });
  }
};

