// backend/src/controllers/studentProfileController.js
// ============================================================
// STUDENT PROFILE CONTROLLER
// ============================================================
// Handles:
// - GET /api/students/profile
// - PUT /api/students/profile
//
// TENANCY & SECURITY:
// Ownership comes strictly from req.userId (verified JWT with STUDENT role).
// Never accepts studentId from params, query, or body.
// Reuses canonical User fields (email, phone, fullName, profileImage)
// without fabricating duplicate authoritative storage.
// ============================================================
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';

const cleanString = (val, max = 255) =>
  typeof val === 'string' ? val.trim().slice(0, max) : '';

/**
 * GET /api/students/profile
 * Get authenticated Student's user details and student profile.
 */
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found'
      });
    }

    let profile = await StudentProfile.findOne({ userId });

    // Lazy initialization if first access
    if (!profile) {
      const parts = (user.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      profile = await StudentProfile.create({
        userId,
        firstName,
        lastName,
        country: user.countryName || user.countryCode || '',
        city: user.location || ''
      });
    }

    return res.json({
      success: true,
      user: {
        id: String(user._id),
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        phoneVerified: Boolean(user.phoneVerified),
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        location: user.location || '',
        profileImage: user.profileImage || null,
        role: user.role
      },
      profile: {
        id: String(profile._id),
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        school: profile.school || '',
        gradeLevel: profile.gradeLevel || '',
        educationLevel: profile.educationLevel || '',
        subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
        country: profile.country || '',
        city: profile.city || '',
        address: profile.address || '',
        notes: profile.notes || '',
        isProfileComplete: Boolean(profile.isProfileComplete)
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: error.message
    });
  }
};

/**
 * PUT /api/students/profile
 * Update authenticated Student's profile and user basics.
 */
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found'
      });
    }

    const {
      fullName,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      school,
      gradeLevel,
      educationLevel,
      subjects,
      country,
      city,
      address,
      notes,
      profileImage
    } = req.body;

    // Update canonical User fields if provided
    let calculatedFullName = fullName !== undefined ? cleanString(fullName, 160) : '';
    if (!calculatedFullName && (firstName !== undefined || lastName !== undefined)) {
      const prospectiveFirst = firstName !== undefined ? cleanString(firstName, 80) : '';
      const prospectiveLast = lastName !== undefined ? cleanString(lastName, 80) : '';
      calculatedFullName = `${prospectiveFirst} ${prospectiveLast}`.trim();
    }

    if (calculatedFullName) {
      user.fullName = calculatedFullName;
    }

    if (profileImage !== undefined && typeof profileImage === 'string') {
      user.profileImage = profileImage.trim();
    }

    if (city !== undefined) {
      user.location = cleanString(city, 100);
    }

    if (country !== undefined) {
      const cleanCountry = cleanString(country, 100);
      if (cleanCountry) {
        user.countryName = cleanCountry;
      }
    }

    await user.save();

    // Upsert StudentProfile
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId });
    }

    if (firstName !== undefined) profile.firstName = cleanString(firstName, 80);
    if (lastName !== undefined) profile.lastName = cleanString(lastName, 80);

    if (gender !== undefined) {
      if (!gender) {
        profile.gender = null;
      } else {
        const normalizedGender = String(gender).trim().toUpperCase();
        profile.gender = ['MALE', 'FEMALE', 'OTHER'].includes(normalizedGender) ? normalizedGender : null;
      }
    }

    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        profile.dateOfBirth = null;
      } else {
        const d = new Date(dateOfBirth);
        profile.dateOfBirth = !isNaN(d.getTime()) ? d : null;
      }
    }

    if (school !== undefined) profile.school = cleanString(school, 160);
    if (gradeLevel !== undefined) profile.gradeLevel = cleanString(gradeLevel, 80);
    if (educationLevel !== undefined) profile.educationLevel = cleanString(educationLevel, 80);

    if (subjects !== undefined) {
      if (Array.isArray(subjects)) {
        profile.subjects = subjects.map((s) => cleanString(s, 60)).filter(Boolean);
      } else if (typeof subjects === 'string') {
        profile.subjects = subjects
          .split(',')
          .map((s) => cleanString(s, 60))
          .filter(Boolean);
      }
    }

    if (country !== undefined) profile.country = cleanString(country, 100);
    if (city !== undefined) profile.city = cleanString(city, 100);
    if (address !== undefined) profile.address = cleanString(address, 255);
    if (notes !== undefined) profile.notes = cleanString(notes, 2000);

    // Evaluate completeness
    const hasSchool = Boolean(profile.school && profile.school.trim());
    const hasGrade = Boolean(profile.gradeLevel && profile.gradeLevel.trim());
    const hasSubjects = Array.isArray(profile.subjects) && profile.subjects.length > 0;
    profile.isProfileComplete = Boolean(hasSchool || hasGrade || hasSubjects);

    await profile.save();

    return res.json({
      success: true,
      message: 'Student profile updated successfully',
      user: {
        id: String(user._id),
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '',
        countryName: user.countryName || '',
        location: user.location || '',
        profileImage: user.profileImage || null,
        role: user.role
      },
      profile: {
        id: String(profile._id),
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        school: profile.school || '',
        gradeLevel: profile.gradeLevel || '',
        educationLevel: profile.educationLevel || '',
        subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
        country: profile.country || '',
        city: profile.city || '',
        address: profile.address || '',
        notes: profile.notes || '',
        isProfileComplete: Boolean(profile.isProfileComplete)
      }
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
      error: error.message
    });
  }
};

export default {
  getStudentProfile,
  updateStudentProfile
};
