// backend/src/services/doctorProfileStaffView.js
// ============================================================
// DOCTOR PROFILE — STAFF VIEW ASSEMBLY
// ============================================================
// Admin (Co-Admin), Sup-Admin (SUPPORT) and Sup-Help (SUPPORT_HELPER) all
// open a Doctor through their own user-detail endpoint. Each of those
// endpoints historically returned Worker/Employer shapes only, which made a
// Doctor render with no professional profile at all.
//
// This service assembles the REAL Doctor profile so every staff surface
// shows a Doctor as a Doctor. It never falls back to a WorkerProfile and it
// never mutates anything: callers receive plain read-only data.
// ============================================================
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';

/** Fields a staff surface is allowed to see on a Doctor profile. */
const PUBLIC_DOCTOR_PROFILE_FIELDS =
  'professionalTitle specialty additionalSpecialties subspecialty experienceSummary bio yearsOfExperience languages qualifications education certifications licenseNumber licenseAuthority consultationFee examinationFee profileImage isProfileComplete isPublished searchVisibility createdAt updatedAt';

const serializeProfile = (profile) => {
  if (!profile) return null;
  const raw = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  return {
    userId: String(raw.userId),
    professionalTitle: raw.professionalTitle || '',
    specialty: raw.specialty || '',
    additionalSpecialties: Array.isArray(raw.additionalSpecialties) ? raw.additionalSpecialties : [],
    subspecialty: raw.subspecialty || '',
    experienceSummary: raw.experienceSummary || '',
    bio: raw.bio || '',
    yearsOfExperience: Number(raw.yearsOfExperience) || 0,
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    qualifications: Array.isArray(raw.qualifications) ? raw.qualifications : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    licenseNumber: raw.licenseNumber || '',
    licenseAuthority: raw.licenseAuthority || '',
    // Absent on documents created before the fields existed, so they read as 0.
    // consultationFee and examinationFee are independent values.
    consultationFee: Number(raw.consultationFee) || 0,
    examinationFee: Number(raw.examinationFee) || 0,
    profileImage: raw.profileImage || '',
    isProfileComplete: Boolean(raw.isProfileComplete),
    isPublished: Boolean(raw.isPublished),
    searchVisibility: Boolean(raw.searchVisibility)
  };
};

const serializeClinic = (clinic) => {
  const raw = typeof clinic.toObject === 'function' ? clinic.toObject() : clinic;
  return {
    id: String(raw._id),
    clinicName: raw.clinicName || '',
    phone: raw.phone || '',
    email: raw.email || '',
    addressLine: raw.addressLine || '',
    city: raw.city || '',
    stateOrProvince: raw.stateOrProvince || '',
    countryCode: raw.countryCode || '',
    postalCode: raw.postalCode || '',
    timezone: raw.timezone || 'UTC',
    instructions: raw.instructions || '',
    isActive: raw.isActive !== false,
    isPrimary: Boolean(raw.isPrimary)
  };
};

/**
 * Loads the Doctor profile and active clinics for a user id.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Object} [options]
 * @param {boolean} [options.includeInactiveClinics=false]
 * @returns {Promise<{DoctorProfile: Object|null, doctorClinics: Object[]}>}
 */
export const getDoctorStaffView = async (userId, { includeInactiveClinics = false } = {}) => {
  const empty = { DoctorProfile: null, doctorClinics: [] };
  if (!userId) return empty;

  try {
    const [profile, clinics] = await Promise.all([
      DoctorProfile.findOne({ userId }).select(PUBLIC_DOCTOR_PROFILE_FIELDS).lean(),
      DoctorClinic.find(
        includeInactiveClinics
          ? { doctorId: userId }
          : { doctorId: userId, isActive: true }
      )
        .sort({ isPrimary: -1, createdAt: 1 })
        .lean()
    ]);

    return {
      DoctorProfile: serializeProfile(profile),
      doctorClinics: (clinics || []).map(serializeClinic)
    };
  } catch (error) {
    console.error('Error assembling doctor staff view:', error);
    return empty;
  }
};

/**
 * Attaches the doctor view onto a staff user payload when the target is a
 * Doctor. Non-Doctor targets are returned untouched, and a DOCTOR target
 * always receives a `DoctorProfile` key (possibly null) so the client can
 * distinguish "no profile yet" from "not a doctor".
 *
 * @param {Object} payload - The user object being serialized for staff.
 * @param {string} payload.role
 * @param {string|import('mongoose').Types.ObjectId} payload.id
 */
export const attachDoctorView = async (payload) => {
  if (!payload || payload.role !== 'DOCTOR') return payload;

  const { DoctorProfile, doctorClinics } = await getDoctorStaffView(payload.id);
  return { ...payload, DoctorProfile, doctorClinics };
};

export default {
  getDoctorStaffView,
  attachDoctorView,
  PUBLIC_DOCTOR_PROFILE_FIELDS
};
