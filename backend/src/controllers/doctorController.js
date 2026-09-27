// backend/src/controllers/doctorController.js
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import User from '../models/User.js';
import { isCanonicalDoctorSpecialty } from '../constants/doctorSpecialties.js';
import { resolveAccountDefaultCurrency } from '../utils/currencyMetadata.js';

// ============================================================
// DOCTOR FEE PARSING (shared by consultationFee and examinationFee)
// ------------------------------------------------------------
// A Doctor fee is accepted as a plain decimal string/number with at most two
// decimal places. It is parsed through its integer minor units and divided by
// 100 exactly once, so no value is ever produced by accumulating floating-point
// arithmetic (no `value * 100` rounding, no summation, no division chain).
//
// The pattern itself rejects every unsafe form: a leading minus (negatives),
// exponents, thousands separators, whitespace-only values and more than two
// decimal places (including binary noise such as 0.1 + 0.2).
// ============================================================
const CONSULTATION_FEE_PATTERN = /^(0|[1-9]\d{0,6})(\.\d{1,2})?$/;
const MAX_CONSULTATION_FEE = 1000000;

/**
 * @returns {number|null} the fee, or null when the input is not a valid amount.
 */
const parseConsultationFee = (raw) => {
  if (raw === null || raw === undefined || raw === '') return 0;

  const text = typeof raw === 'number'
    ? (Number.isFinite(raw) ? String(raw) : '')
    : String(raw).trim();

  const match = CONSULTATION_FEE_PATTERN.exec(text);
  if (!match) return null;

  const whole = match[1];
  const fraction = match[2] ? match[2].slice(1) : '';
  const minorUnits = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  if (minorUnits > MAX_CONSULTATION_FEE * 100) return null;

  return minorUnits / 100;
};

/**
 * GET /api/doctors/profile
 * Get current authenticated Doctor's profile, basic user info, and clinics.
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Doctor user not found'
      });
    }

    const [profile, clinics] = await Promise.all([
      DoctorProfile.findOne({ userId }),
      DoctorClinic.find({ doctorId: userId, isActive: true })
        .sort({ isPrimary: -1, createdAt: 1 })
        .lean()
    ]);

    // Both Doctor fees are always present in the response. Documents written
    // before `examinationFee` existed have no such field, so it is normalized to
    // 0 here instead of leaking `undefined` to the client.
    const profilePayload = profile
      ? (typeof profile.toObject === 'function' ? profile.toObject() : { ...profile })
      : null;
    if (profilePayload) {
      profilePayload.consultationFee = Number(profilePayload.consultationFee) || 0;
      profilePayload.examinationFee = Number(profilePayload.examinationFee) || 0;
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        // Email is READ-ONLY here. It is the canonical account email owned by
        // the User model and is never writable through the Doctor profile.
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        phone: user.phone || '',
        phoneVerified: Boolean(user.phoneVerified),
        phoneVerificationStatus: user.phoneVerificationStatus || null,
        city: user.city || '',
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        role: user.role,
        isVerified: user.isVerified || false,
        profileImage: user.profileImage || ''
      },
      // Derived from the existing account currency convention. Nothing is
      // stored: this only tells the client which currency to render the
      // Doctor fees in.
      currency: resolveAccountDefaultCurrency(user),
      profile: profilePayload,
      clinics: (clinics || []).map((clinic) => ({
        id: String(clinic._id),
        clinicName: clinic.clinicName || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        addressLine: clinic.addressLine || '',
        city: clinic.city || '',
        stateOrProvince: clinic.stateOrProvince || '',
        countryCode: clinic.countryCode || '',
        postalCode: clinic.postalCode || '',
        timezone: clinic.timezone || 'UTC',
        instructions: clinic.instructions || '',
        isPrimary: Boolean(clinic.isPrimary)
      }))
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching doctor profile',
      error: error.message
    });
  }
};

/**
 * PUT /api/doctors/profile
 * Create or update current authenticated Doctor's profile.
 * Only authenticated doctor can update their own profile (req.userId).
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const body = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Doctor user not found'
      });
    }

    const updates = {};

    // NOTE: `email`, `phone` and `fullName` are intentionally NOT handled here.
    // All three are canonical User account fields. Full name is edited through
    // the existing account update flow (PUT /api/auth/profile, the same flow
    // Worker and Employer settings use), so no second name field or second
    // write path is introduced. Email and phone each have their own
    // verification workflows (emailVerified / emailVerificationToken* and
    // phoneVerified / phoneVerificationStatus); accepting them here would
    // either allow an unverified mutation or silently bypass verification, so
    // the Doctor profile only ever displays them.

    // 1. professionalTitle: optional string <= 100 chars
    if (Object.prototype.hasOwnProperty.call(body, 'professionalTitle')) {
      if (typeof body.professionalTitle !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Professional title must be a string'
        });
      }
      const trimmed = body.professionalTitle.trim();
      if (trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Professional title must not exceed 100 characters'
        });
      }
      updates.professionalTitle = trimmed;
    }

    // 2. specialty: optional, must be canonical if provided
    if (Object.prototype.hasOwnProperty.call(body, 'specialty')) {
      if (body.specialty !== null && body.specialty !== '') {
        if (typeof body.specialty !== 'string' || !isCanonicalDoctorSpecialty(body.specialty.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid medical specialty provided'
          });
        }
        updates.specialty = body.specialty.trim();
      } else {
        updates.specialty = '';
      }
    }

    // 3. subspecialty: optional string <= 100 chars
    if (Object.prototype.hasOwnProperty.call(body, 'subspecialty')) {
      if (typeof body.subspecialty !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Subspecialty must be a string'
        });
      }
      const trimmed = body.subspecialty.trim();
      if (trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Subspecialty must not exceed 100 characters'
        });
      }
      updates.subspecialty = trimmed;
    }

    // 4. bio: optional string with reasonable length limit (<= 2000 chars)
    if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
      if (typeof body.bio !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Bio must be a string'
        });
      }
      const trimmed = body.bio.trim();
      if (trimmed.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Bio must not exceed 2000 characters'
        });
      }
      updates.bio = trimmed;
    }

    // 5. yearsOfExperience: optional non-negative number
    if (Object.prototype.hasOwnProperty.call(body, 'yearsOfExperience')) {
      const exp = Number(body.yearsOfExperience);
      if (!Number.isFinite(exp) || exp < 0 || exp > 70) {
        return res.status(400).json({
          success: false,
          message: 'Years of experience must be a non-negative number (0-70)'
        });
      }
      updates.yearsOfExperience = Math.floor(exp);
    }

    // 6. languages: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'languages')) {
      if (!Array.isArray(body.languages)) {
        return res.status(400).json({
          success: false,
          message: 'Languages must be an array of strings'
        });
      }
      const validLangs = body.languages
        .filter(l => typeof l === 'string')
        .map(l => l.trim().substring(0, 50))
        .filter(Boolean);
      updates.languages = [...new Set(validLangs)];
    }

    // 7. qualifications: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'qualifications')) {
      if (!Array.isArray(body.qualifications)) {
        return res.status(400).json({
          success: false,
          message: 'Qualifications must be an array of strings'
        });
      }
      const validQuals = body.qualifications
        .filter(q => typeof q === 'string')
        .map(q => q.trim().substring(0, 150))
        .filter(Boolean);
      updates.qualifications = validQuals;
    }

    // 7b. education: academic history entries (degrees, universities, years)
    if (Object.prototype.hasOwnProperty.call(body, 'education')) {
      if (!Array.isArray(body.education)) {
        return res.status(400).json({
          success: false,
          message: 'Education must be an array of strings'
        });
      }
      updates.education = body.education
        .filter(e => typeof e === 'string')
        .map(e => e.trim().substring(0, 200))
        .filter(Boolean);
    }

    // 7c. certifications: issued certificates, fellowships and licences
    if (Object.prototype.hasOwnProperty.call(body, 'certifications')) {
      if (!Array.isArray(body.certifications)) {
        return res.status(400).json({
          success: false,
          message: 'Certifications must be an array of strings'
        });
      }
      updates.certifications = body.certifications
        .filter(c => typeof c === 'string')
        .map(c => c.trim().substring(0, 200))
        .filter(Boolean);
    }

    // 7d. additionalSpecialties: must use the canonical doctor taxonomy
    if (Object.prototype.hasOwnProperty.call(body, 'additionalSpecialties')) {
      if (!Array.isArray(body.additionalSpecialties)) {
        return res.status(400).json({
          success: false,
          message: 'Additional specialties must be an array of strings'
        });
      }
      const normalizedExtras = [...new Set(
        body.additionalSpecialties
          .filter(s => typeof s === 'string')
          .map(s => s.trim())
          .filter(Boolean)
      )];
      const invalidSpecialty = normalizedExtras.find(s => !isCanonicalDoctorSpecialty(s));
      if (invalidSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Invalid medical specialty provided'
        });
      }
      updates.additionalSpecialties = normalizedExtras;
    }

    // 7e. experienceSummary: free-text professional experience overview
    if (Object.prototype.hasOwnProperty.call(body, 'experienceSummary')) {
      if (typeof body.experienceSummary !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Experience summary must be a string'
        });
      }
      updates.experienceSummary = body.experienceSummary.trim().substring(0, 2000);
    }

    // 8. licenseNumber: optional string <= 100 chars
    if (Object.prototype.hasOwnProperty.call(body, 'licenseNumber')) {
      if (typeof body.licenseNumber !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'License number must be a string'
        });
      }
      updates.licenseNumber = body.licenseNumber.trim().substring(0, 100);
    }

    // 9. licenseAuthority: optional string <= 150 chars
    if (Object.prototype.hasOwnProperty.call(body, 'licenseAuthority')) {
      if (typeof body.licenseAuthority !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'License authority must be a string'
        });
      }
      updates.licenseAuthority = body.licenseAuthority.trim().substring(0, 150);
    }

    // 9b. consultationFee: non-negative monetary amount, max 2 decimal places
    if (Object.prototype.hasOwnProperty.call(body, 'consultationFee')) {
      const parsedFee = parseConsultationFee(body.consultationFee);
      if (parsedFee === null) {
        return res.status(400).json({
          success: false,
          message: 'Consultation fee must be a non-negative amount with at most two decimal places (max 1000000)'
        });
      }
      updates.consultationFee = parsedFee;
    }

    // 9c. examinationFee: a second, completely independent Doctor fee. It uses
    // the exact same strict parser and limits as consultationFee, and each field
    // is only written when it is present in the body — so updating one never
    // overwrites or resets the other.
    if (Object.prototype.hasOwnProperty.call(body, 'examinationFee')) {
      const parsedFee = parseConsultationFee(body.examinationFee);
      if (parsedFee === null) {
        return res.status(400).json({
          success: false,
          message: 'Examination fee must be a non-negative amount with at most two decimal places (max 1000000)'
        });
      }
      updates.examinationFee = parsedFee;
    }

    // 10. profileImage: optional string
    if (Object.prototype.hasOwnProperty.call(body, 'profileImage')) {
      if (typeof body.profileImage !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Profile image must be a string URL'
        });
      }
      updates.profileImage = body.profileImage.trim();
    }

    // 11. isPublished: boolean
    if (Object.prototype.hasOwnProperty.call(body, 'isPublished')) {
      updates.isPublished = Boolean(body.isPublished);
    }

    // 12. searchVisibility: boolean (default safe false)
    if (Object.prototype.hasOwnProperty.call(body, 'searchVisibility')) {
      updates.searchVisibility = Boolean(body.searchVisibility);
    }

    // Calculate isProfileComplete based on essential fields
    let existingProfile = null;
    try {
      const found = await DoctorProfile.findOne({ userId });
      existingProfile = found && typeof found.toObject === 'function' ? found.toObject() : found;
    } catch {
      existingProfile = null;
    }

    const currentOrNew = {
      ...(existingProfile || {}),
      ...updates
    };

    const hasTitle = Boolean(currentOrNew.professionalTitle?.trim());
    const hasSpecialty = Boolean(currentOrNew.specialty?.trim());
    const hasBio = Boolean(currentOrNew.bio?.trim());
    const hasExp = typeof currentOrNew.yearsOfExperience === 'number' && currentOrNew.yearsOfExperience >= 0;
    const hasLicense = Boolean(currentOrNew.licenseNumber?.trim());

    updates.isProfileComplete = hasTitle && hasSpecialty && hasBio && hasExp && hasLicense;

    // Persist to DoctorProfile
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Keep User model in sync for common profile fields (profileImage, doctorSpecialty)
    const userUpdates = {};
    if (updates.specialty) {
      userUpdates.doctorSpecialty = updates.specialty;
    }
    if (updates.profileImage) {
      userUpdates.profileImage = updates.profileImage;
    }
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdates });
    }

    return res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating doctor profile',
      error: error.message
    });
  }
};
