// backend/src/controllers/medicalProfileController.js
// Dedicated controller for My Medical Profile (Phase 6).
//
// Role allowlist: WORKER, EMPLOYER, TEACHER, STUDENT.
// Doctors are NOT allowed here.
// Premium required: uses existing isUserPremium service.
// Ownership: strictly req.userId.
// Soft-delete: isActive = false.
import PatientMedicalProfile, {
  SEX_VALUES,
  BLOOD_GROUP_VALUES,
  SMOKING_STATUS_VALUES
} from '../models/PatientMedicalProfile.js';
import { isUserPremium } from '../services/premiumService.js';

export const ALLOWED_ROLES = ['WORKER', 'EMPLOYER', 'TEACHER', 'STUDENT'];

const MAX_ARRAY_ITEMS = 50;
const MAX_ITEM_LENGTH = 200;
const MAX_TEXT_LENGTH = 2000;

// Format response cleanly and omit internal fields
const serializeMedicalProfile = (profile) => {
  if (!profile) return null;
  return {
    id: profile._id,
    userId: profile.userId,
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
    lastReviewedAt: profile.lastReviewedAt ? profile.lastReviewedAt.toISOString() : null,
    createdAt: profile.createdAt ? profile.createdAt.toISOString() : null,
    updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : null
  };
};

// Validate and clean array fields
const validateStringArray = (arr, fieldName) => {
  if (arr === undefined || arr === null) return [];
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array of strings`);
  }
  if (arr.length > MAX_ARRAY_ITEMS) {
    throw new Error(`${fieldName} exceeds maximum allowed items (${MAX_ARRAY_ITEMS})`);
  }
  const cleaned = [];
  for (const item of arr) {
    if (typeof item !== 'string') {
      throw new Error(`Each item in ${fieldName} must be a string`);
    }
    const trimmed = item.trim();
    if (trimmed.length > MAX_ITEM_LENGTH) {
      throw new Error(`Item in ${fieldName} exceeds max length of ${MAX_ITEM_LENGTH} characters`);
    }
    if (trimmed.length > 0 && !cleaned.includes(trimmed)) {
      cleaned.push(trimmed);
    }
  }
  return cleaned;
};

/**
 * GET /api/medical/profile
 * Returns authenticated user's active medical profile.
 */
export const getMyMedicalProfile = async (req, res) => {
  try {
    const role = (req.userRole || req.user?.role || '').toUpperCase();
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Medical profile is not available for this role.'
      });
    }

    const premium = await isUserPremium(req.userId);
    if (!premium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'My Medical Profile is a Premium-only feature.'
      });
    }

    const profile = await PatientMedicalProfile.findOne({
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: null
      });
    }

    return res.status(200).json({
      success: true,
      profile: serializeMedicalProfile(profile)
    });
  } catch (err) {
    console.error('Error fetching medical profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical profile.'
    });
  }
};

/**
 * PUT /api/medical/profile
 * Upserts authenticated user's medical profile.
 */
export const updateMyMedicalProfile = async (req, res) => {
  try {
    const role = (req.userRole || req.user?.role || '').toUpperCase();
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Medical profile is not available for this role.'
      });
    }

    const premium = await isUserPremium(req.userId);
    if (!premium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'My Medical Profile is a Premium-only feature.'
      });
    }

    const body = req.body || {};

    // Explicit field allowlist
    const updateData = {
      isActive: true,
      lastReviewedAt: new Date()
    };

    // 1. dateOfBirth
    if (body.dateOfBirth !== undefined) {
      if (body.dateOfBirth === null || body.dateOfBirth === '') {
        updateData.dateOfBirth = null;
      } else {
        const dob = new Date(body.dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid dateOfBirth format.'
          });
        }
        const now = new Date();
        if (dob > now) {
          return res.status(400).json({
            success: false,
            message: 'dateOfBirth cannot be in the future.'
          });
        }
        const earliest = new Date('1900-01-01');
        if (dob < earliest) {
          return res.status(400).json({
            success: false,
            message: 'dateOfBirth is unrealistically early.'
          });
        }
        updateData.dateOfBirth = dob;
      }
    }

    // 2. sex
    if (body.sex !== undefined) {
      if (body.sex === null || body.sex === '') {
        updateData.sex = null;
      } else {
        const normalizedSex = String(body.sex).toUpperCase().trim();
        if (!SEX_VALUES.includes(normalizedSex)) {
          return res.status(400).json({
            success: false,
            message: `Invalid sex value. Allowed: ${SEX_VALUES.join(', ')}`
          });
        }
        updateData.sex = normalizedSex;
      }
    }

    // 3. bloodGroup
    if (body.bloodGroup !== undefined) {
      if (body.bloodGroup === null || body.bloodGroup === '') {
        updateData.bloodGroup = null;
      } else {
        const normalizedBg = String(body.bloodGroup).toUpperCase().trim();
        if (!BLOOD_GROUP_VALUES.includes(normalizedBg)) {
          return res.status(400).json({
            success: false,
            message: `Invalid bloodGroup value. Allowed: ${BLOOD_GROUP_VALUES.join(', ')}`
          });
        }
        updateData.bloodGroup = normalizedBg;
      }
    }

    // 4. heightCm
    if (body.heightCm !== undefined) {
      if (body.heightCm === null || body.heightCm === '') {
        updateData.heightCm = null;
      } else {
        const h = Number(body.heightCm);
        if (!Number.isFinite(h) || h < 30 || h > 300) {
          return res.status(400).json({
            success: false,
            message: 'heightCm must be a number between 30 and 300.'
          });
        }
        updateData.heightCm = Math.round(h * 10) / 10;
      }
    }

    // 5. weightKg
    if (body.weightKg !== undefined) {
      if (body.weightKg === null || body.weightKg === '') {
        updateData.weightKg = null;
      } else {
        const w = Number(body.weightKg);
        if (!Number.isFinite(w) || w < 1 || w > 500) {
          return res.status(400).json({
            success: false,
            message: 'weightKg must be a number between 1 and 500.'
          });
        }
        updateData.weightKg = Math.round(w * 10) / 10;
      }
    }

    // 6. Arrays (chronicConditions, allergies, currentMedications, surgeries)
    try {
      if (body.chronicConditions !== undefined) {
        updateData.chronicConditions = validateStringArray(body.chronicConditions, 'chronicConditions');
      }
      if (body.allergies !== undefined) {
        updateData.allergies = validateStringArray(body.allergies, 'allergies');
      }
      if (body.currentMedications !== undefined) {
        updateData.currentMedications = validateStringArray(body.currentMedications, 'currentMedications');
      }
      if (body.surgeries !== undefined) {
        updateData.surgeries = validateStringArray(body.surgeries, 'surgeries');
      }
    } catch (validationErr) {
      return res.status(400).json({
        success: false,
        message: validationErr.message
      });
    }

    // 7. familyHistory
    if (body.familyHistory !== undefined) {
      if (typeof body.familyHistory !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'familyHistory must be a string.'
        });
      }
      if (body.familyHistory.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `familyHistory exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`
        });
      }
      updateData.familyHistory = body.familyHistory.trim();
    }

    // 8. smokingStatus
    if (body.smokingStatus !== undefined) {
      if (body.smokingStatus === null || body.smokingStatus === '') {
        updateData.smokingStatus = null;
      } else {
        const norm = String(body.smokingStatus).toUpperCase().trim();
        if (!SMOKING_STATUS_VALUES.includes(norm)) {
          return res.status(400).json({
            success: false,
            message: `Invalid smokingStatus. Allowed: ${SMOKING_STATUS_VALUES.join(', ')}`
          });
        }
        updateData.smokingStatus = norm;
      }
    }

    // 9. disabilityStatus
    if (body.disabilityStatus !== undefined) {
      if (typeof body.disabilityStatus !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'disabilityStatus must be a string.'
        });
      }
      if (body.disabilityStatus.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'disabilityStatus exceeds maximum length of 200 characters.'
        });
      }
      updateData.disabilityStatus = body.disabilityStatus.trim();
    }

    // 10. emergencyContact
    if (body.emergencyContact !== undefined) {
      if (typeof body.emergencyContact !== 'object' || body.emergencyContact === null || Array.isArray(body.emergencyContact)) {
        return res.status(400).json({
          success: false,
          message: 'emergencyContact must be an object.'
        });
      }
      const { name, relationship, phone } = body.emergencyContact;
      updateData.emergencyContact = {
        name: typeof name === 'string' ? name.trim().slice(0, 100) : '',
        relationship: typeof relationship === 'string' ? relationship.trim().slice(0, 50) : '',
        phone: typeof phone === 'string' ? phone.trim().slice(0, 30) : ''
      };
    }

    // 11. consentToShareWithDoctors (boolean)
    if (body.consentToShareWithDoctors !== undefined) {
      updateData.consentToShareWithDoctors = Boolean(body.consentToShareWithDoctors);
    }

    const updatedProfile = await PatientMedicalProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Medical profile saved successfully.',
      profile: serializeMedicalProfile(updatedProfile)
    });
  } catch (err) {
    console.error('Error saving medical profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save medical profile.'
    });
  }
};

/**
 * DELETE /api/medical/profile
 * Soft-deletes authenticated user's medical profile (isActive = false).
 */
export const deleteMyMedicalProfile = async (req, res) => {
  try {
    const role = (req.userRole || req.user?.role || '').toUpperCase();
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Medical profile is not available for this role.'
      });
    }

    const premium = await isUserPremium(req.userId);
    if (!premium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'My Medical Profile is a Premium-only feature.'
      });
    }

    const profile = await PatientMedicalProfile.findOneAndUpdate(
      { userId: req.userId, isActive: true },
      { $set: { isActive: false, lastReviewedAt: new Date() } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No active medical profile found to delete.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medical profile deleted successfully.'
    });
  } catch (err) {
    console.error('Error deleting medical profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete medical profile.'
    });
  }
};

/**
 * GET /api/medical/consultations
 * Read-only list of SIGNED consultations belonging to the authenticated patient.
 * Patients cannot see DRAFT records.
 */
export const getPatientConsultations = async (req, res) => {
  try {
    const patientId = req.userId;
    const DoctorConsultationRecord = (await import('../models/DoctorConsultationRecord.js')).default;

    const consultations = await DoctorConsultationRecord.find({
      patientId,
      status: { $in: ['SIGNED', 'AMENDED'] }
    })
      .populate('doctorId', 'fullName profileImage')
      .populate('clinicId', 'clinicName city addressLine')
      .populate('appointmentId', 'appointmentDate startTime endTime consultationType')
      .sort({ signedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: consultations.length,
      consultations
    });
  } catch (error) {
    console.error('Error fetching patient consultations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation records'
    });
  }
};

/**
 * GET /api/medical/consultations/:id
 * Read-only view of a single SIGNED consultation record belonging to the authenticated patient.
 */
export const getPatientConsultationById = async (req, res) => {
  try {
    const patientId = req.userId;
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    const DoctorConsultationRecord = (await import('../models/DoctorConsultationRecord.js')).default;

    const consultation = await DoctorConsultationRecord.findOne({
      _id: id,
      patientId,
      status: { $in: ['SIGNED', 'AMENDED'] }
    })
      .populate('doctorId', 'fullName profileImage')
      .populate('clinicId', 'clinicName city addressLine')
      .populate('appointmentId', 'appointmentDate startTime endTime consultationType')
      .populate('amendedRecordId', 'status signedAt createdAt');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }

    return res.json({
      success: true,
      consultation
    });
  } catch (error) {
    console.error('Error fetching patient consultation by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation record'
    });
  }
};

/**
 * GET /api/medical/prescriptions
 * Read-only list of ISSUED prescriptions belonging to the authenticated patient.
 * Patients cannot see DRAFT or CANCELLED records (or only ISSUED if required).
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.userId;
    const Prescription = (await import('../models/Prescription.js')).default;

    const prescriptions = await Prescription.find({
      patientId,
      status: 'ISSUED'
    })
      .populate('doctorId', 'fullName profileImage')
      .populate('consultationRecordId', 'appointmentId consultationType signedAt')
      .sort({ issuedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions'
    });
  }
};

/**
 * GET /api/medical/prescriptions/:id
 * Read-only view of a single ISSUED prescription belonging to the authenticated patient.
 */
export const getPatientPrescriptionById = async (req, res) => {
  try {
    const patientId = req.userId;
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const Prescription = (await import('../models/Prescription.js')).default;

    const prescription = await Prescription.findOne({
      _id: id,
      patientId,
      status: 'ISSUED'
    })
      .populate('doctorId', 'fullName profileImage')
      .populate('consultationRecordId', 'appointmentId consultationType signedAt');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    return res.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Error fetching patient prescription by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription'
    });
  }
};

