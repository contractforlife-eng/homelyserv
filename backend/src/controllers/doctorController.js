// backend/src/controllers/doctorController.js
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import { isCanonicalDoctorSpecialty } from '../constants/doctorSpecialties.js';

/**
 * GET /api/doctors/profile
 * Get current authenticated Doctor's profile and basic user info.
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

    let profile = await DoctorProfile.findOne({ userId });

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        city: user.city || '',
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        role: user.role,
        isVerified: user.isVerified || false,
        profileImage: user.profileImage || ''
      },
      profile: profile || null
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
