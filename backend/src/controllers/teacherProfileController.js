// backend/src/controllers/teacherProfileController.js
import TeacherProfile from '../models/TeacherProfile.js';
import User from '../models/User.js';
import VerificationDocument from '../models/VerificationDocument.js';
import { isCanonicalTeacherSubject, isCanonicalTeachingLevel, isCanonicalTeachingMethod } from '../constants/teacherTaxonomy.js';
import { resolveAccountDefaultCurrency, isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { getVerificationDetails } from '../services/profileVerificationService.js';

const RATE_PATTERN = /^(0|[1-9]\d{0,6})(\.\d{1,2})?$/;
const MAX_RATE = 1000000;

const parseHourlyRate = (raw) => {
  if (raw === null || raw === undefined || raw === '') return 0;
  const text = typeof raw === 'number'
    ? (Number.isFinite(raw) ? String(raw) : '')
    : String(raw).trim();

  const match = RATE_PATTERN.exec(text);
  if (!match) return null;

  const whole = match[1];
  const fraction = match[2] ? match[2].slice(1) : '';
  const minorUnits = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  if (minorUnits > MAX_RATE * 100) return null;
  return minorUnits / 100;
};

/**
 * GET /api/teachers/profile
 * Get current authenticated Teacher's profile, basic user info, and verification details.
 */
export const getTeacherProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Teacher user not found'
      });
    }

    const profile = await TeacherProfile.findOne({ userId });

    const profilePayload = profile
      ? (typeof profile.toObject === 'function' ? profile.toObject() : { ...profile })
      : null;

    if (profilePayload) {
      profilePayload.hourlyRate = Number(profilePayload.hourlyRate) || 0;
      profilePayload.lessonRate = (profilePayload.lessonRate !== undefined && profilePayload.lessonRate !== null)
        ? Number(profilePayload.lessonRate)
        : profilePayload.hourlyRate;
      profilePayload.pricingCurrency = profilePayload.pricingCurrency || '';
    }

    const docs = await VerificationDocument.find({ userId }).select('verificationType status');
    const docInfo = {
      identityHasDocument: docs.some((d) => d.verificationType === 'identity'),
      experienceHasDocument: docs.some((d) => d.verificationType === 'experience'),
      certificatesHasDocument: docs.some((d) => d.verificationType === 'certificates')
    };

    const verification = getVerificationDetails(user, docInfo);

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
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
      currency: resolveAccountDefaultCurrency(user),
      profile: profilePayload,
      verification
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching teacher profile',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/profile
 * Create or update current authenticated Teacher's profile.
 * Only authenticated teacher can update their own profile (req.userId).
 */
export const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const body = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Teacher user not found'
      });
    }

    const updates = {};

    // 1. title: optional string <= 100 chars
    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      if (typeof body.title !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Title must be a string'
        });
      }
      const trimmed = body.title.trim();
      if (trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title must not exceed 100 characters'
        });
      }
      updates.title = trimmed;
    }

    // 2. mainSubject: optional string, must be canonical if provided
    if (Object.prototype.hasOwnProperty.call(body, 'mainSubject')) {
      if (body.mainSubject !== null && body.mainSubject !== '') {
        if (typeof body.mainSubject !== 'string' || !isCanonicalTeacherSubject(body.mainSubject.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid teacher subject provided'
          });
        }
        updates.mainSubject = body.mainSubject.trim();
      } else {
        updates.mainSubject = '';
      }
    }

    // 3. additionalSubjects: array of strings from canonical taxonomy
    if (Object.prototype.hasOwnProperty.call(body, 'additionalSubjects')) {
      if (!Array.isArray(body.additionalSubjects)) {
        return res.status(400).json({
          success: false,
          message: 'Additional subjects must be an array'
        });
      }
      const validSubjects = body.additionalSubjects
        .filter(s => typeof s === 'string')
        .map(s => s.trim())
        .filter(Boolean);

      for (const subj of validSubjects) {
        if (!isCanonicalTeacherSubject(subj)) {
          return res.status(400).json({
            success: false,
            message: `Invalid subject: ${subj}`
          });
        }
      }
      updates.additionalSubjects = Array.from(new Set(validSubjects));
    }

    // 4. specialization: optional string <= 120 chars
    if (Object.prototype.hasOwnProperty.call(body, 'specialization')) {
      if (typeof body.specialization !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Specialization must be a string'
        });
      }
      const trimmed = body.specialization.trim();
      if (trimmed.length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Specialization must not exceed 120 characters'
        });
      }
      updates.specialization = trimmed;
    }

    // 5. teachingLevels: array of strings from canonical taxonomy
    if (Object.prototype.hasOwnProperty.call(body, 'teachingLevels')) {
      if (!Array.isArray(body.teachingLevels)) {
        return res.status(400).json({
          success: false,
          message: 'Teaching levels must be an array'
        });
      }
      const validLevels = body.teachingLevels
        .filter(l => typeof l === 'string')
        .map(l => l.trim())
        .filter(Boolean);

      for (const lvl of validLevels) {
        if (!isCanonicalTeachingLevel(lvl)) {
          return res.status(400).json({
            success: false,
            message: `Invalid teaching level: ${lvl}`
          });
        }
      }
      updates.teachingLevels = Array.from(new Set(validLevels));
    }

    // 6. teachingMethod: optional string ('online', 'in_person', 'both')
    if (Object.prototype.hasOwnProperty.call(body, 'teachingMethod')) {
      if (body.teachingMethod !== null && body.teachingMethod !== '') {
        if (typeof body.teachingMethod !== 'string' || !isCanonicalTeachingMethod(body.teachingMethod.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid teaching method provided'
          });
        }
        updates.teachingMethod = body.teachingMethod.trim();
      } else {
        updates.teachingMethod = 'both';
      }
    }

    // 7. bio: optional string <= 2000 chars
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

    // 8. experienceSummary: optional string <= 2000 chars
    if (Object.prototype.hasOwnProperty.call(body, 'experienceSummary')) {
      if (typeof body.experienceSummary !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Experience summary must be a string'
        });
      }
      const trimmed = body.experienceSummary.trim();
      if (trimmed.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Experience summary must not exceed 2000 characters'
        });
      }
      updates.experienceSummary = trimmed;
    }

    // 9. yearsOfExperience: optional non-negative number (0-70)
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

    // 10. languages: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'languages')) {
      if (!Array.isArray(body.languages)) {
        return res.status(400).json({
          success: false,
          message: 'Languages must be an array of strings'
        });
      }
      updates.languages = body.languages
        .filter(l => typeof l === 'string')
        .map(l => l.trim().substring(0, 50))
        .filter(Boolean);
    }

    // 11. qualifications: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'qualifications')) {
      if (!Array.isArray(body.qualifications)) {
        return res.status(400).json({
          success: false,
          message: 'Qualifications must be an array of strings'
        });
      }
      updates.qualifications = body.qualifications
        .filter(q => typeof q === 'string')
        .map(q => q.trim().substring(0, 100))
        .filter(Boolean);
    }

    // 12. education: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'education')) {
      if (!Array.isArray(body.education)) {
        return res.status(400).json({
          success: false,
          message: 'Education must be an array of strings'
        });
      }
      updates.education = body.education
        .filter(e => typeof e === 'string')
        .map(e => e.trim().substring(0, 150))
        .filter(Boolean);
    }

    // 13. certifications: array of strings
    if (Object.prototype.hasOwnProperty.call(body, 'certifications')) {
      if (!Array.isArray(body.certifications)) {
        return res.status(400).json({
          success: false,
          message: 'Certifications must be an array of strings'
        });
      }
      updates.certifications = body.certifications
        .filter(c => typeof c === 'string')
        .map(c => c.trim().substring(0, 150))
        .filter(Boolean);
    }

    // 14. lessonRate & hourlyRate: optional non-negative number
    if (Object.prototype.hasOwnProperty.call(body, 'lessonRate')) {
      const parsed = parseHourlyRate(body.lessonRate);
      if (parsed === null) {
        return res.status(400).json({
          success: false,
          message: 'Lesson rate must be a non-negative number up to 1,000,000 with at most 2 decimal places'
        });
      }
      updates.lessonRate = parsed;
      updates.hourlyRate = parsed;
    } else if (Object.prototype.hasOwnProperty.call(body, 'hourlyRate')) {
      const parsed = parseHourlyRate(body.hourlyRate);
      if (parsed === null) {
        return res.status(400).json({
          success: false,
          message: 'Hourly rate must be a non-negative number up to 1,000,000 with at most 2 decimal places'
        });
      }
      updates.hourlyRate = parsed;
      updates.lessonRate = parsed;
    }

    // 14b. pricingCurrency: optional uppercase string validated against supported currencies
    if (Object.prototype.hasOwnProperty.call(body, 'pricingCurrency')) {
      if (body.pricingCurrency !== null && body.pricingCurrency !== '') {
        const normalized = normalizeCurrencyCode(body.pricingCurrency);
        if (!normalized || !isSupportedCurrency(normalized)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid pricing currency'
          });
        }
        updates.pricingCurrency = normalized;
      }
    }

    // 15. availableForNewStudents: boolean
    if (Object.prototype.hasOwnProperty.call(body, 'availableForNewStudents')) {
      updates.availableForNewStudents = Boolean(body.availableForNewStudents);
    }

    // 16. profileImage: optional string URL
    if (Object.prototype.hasOwnProperty.call(body, 'profileImage')) {
      if (typeof body.profileImage === 'string') {
        updates.profileImage = body.profileImage.trim();
        user.profileImage = updates.profileImage;
        await user.save();
      }
    }

    // Upsert profile
    let profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      profile = new TeacherProfile({ userId, ...updates });
    } else {
      Object.assign(profile, updates);
    }

    // Check completeness
    const hasMainSubject = Boolean(profile.mainSubject && profile.mainSubject.trim());
    const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 10);
    const hasLevels = Array.isArray(profile.teachingLevels) && profile.teachingLevels.length > 0;
    profile.isProfileComplete = hasMainSubject && hasBio && hasLevels;

    await profile.save();

    return res.json({
      success: true,
      message: 'Teacher profile updated successfully',
      profile: profile.toObject ? profile.toObject() : profile
    });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating teacher profile',
      error: error.message
    });
  }
};

export default {
  getTeacherProfile,
  updateTeacherProfile
};
