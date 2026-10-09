// backend/src/controllers/studentTeacherDiscoveryController.js
// ============================================================
// STUDENT TEACHER DISCOVERY & REQUEST CONTROLLER
// Enables students to browse/search eligible teachers and send
// relationship requests (PENDING status).
//
// OWNERSHIP / AUTHZ:
// - Student identity derived strictly from `req.userId` (requireStudent).
// - Target teacherId validated from req.params.
// - Returns safe public teacher information only.
// - Privacy: Never exposes teacher phone, email, internal verification
//   documents, private notes, payment credentials or other students.
// ============================================================
import mongoose from 'mongoose';
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import StudentProfile from '../models/StudentProfile.js';
import { CANONICAL_TEACHER_SUBJECTS, CANONICAL_TEACHING_LEVELS } from '../constants/teacherTaxonomy.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Transforms a teacher user and profile into a safe public discovery DTO,
 * enriched with the student's personal relationship status.
 *
 * `isPremium` is a SERVER-COMPUTED Boolean resolved in batch by the caller
 * (see `resolveTeacherPremiumIds` below) and defaults to false. It is derived
 * ONLY from the teacher's active Premium entitlement (Subscription /
 * ManualPremiumGrant) and is completely independent of `isVerified`, which is
 * derived ONLY from identity verification fields. Neither implies the other.
 */
export const toTeacherDiscoveryDto = (teacherUser, teacherProfile, currentRelationship, isPremium = false) => {
  const u = teacherUser ? (typeof teacherUser.toObject === 'function' ? teacherUser.toObject() : teacherUser) : {};
  const p = teacherProfile ? (typeof teacherProfile.toObject === 'function' ? teacherProfile.toObject() : teacherProfile) : {};
  const rel = currentRelationship ? (typeof currentRelationship.toObject === 'function' ? currentRelationship.toObject() : currentRelationship) : null;

  const isVerified = u.identityVerificationStatus === 'VERIFIED' || Boolean(u.identityVerifiedAt);

  let relationshipStatus = 'NONE';
  let relationshipId = null;

  if (rel) {
    relationshipStatus = rel.relationshipStatus || (rel.status === 'ACTIVE' ? 'ACTIVE' : 'ENDED');
    relationshipId = String(rel._id);
  }

  return {
    id: String(u._id),
    teacherId: String(u._id),
    fullName: u.fullName || 'Teacher',
    avatar: u.profileImage || p.profileImage || null,
    title: p.title || '',
    mainSubject: p.mainSubject || '',
    additionalSubjects: Array.isArray(p.additionalSubjects) ? p.additionalSubjects : [],
    teachingLevels: Array.isArray(p.teachingLevels) ? p.teachingLevels : [],
    specialization: p.specialization || '',
    teachingMethod: p.teachingMethod || 'both',
    yearsOfExperience: typeof p.yearsOfExperience === 'number' ? p.yearsOfExperience : 0,
    bio: p.bio || '',
    languages: Array.isArray(p.languages) ? p.languages : [],
    lessonRate: typeof p.lessonRate === 'number' ? p.lessonRate : 0,
    hourlyRate: typeof p.hourlyRate === 'number' ? p.hourlyRate : 0,
    pricingCurrency: p.pricingCurrency || 'USD',
    country: u.countryName || '',
    countryCode: u.countryCode || '',
    city: u.city || '',
    isVerified,
    isPremium: isPremium === true,
    availableForNewStudents: p.availableForNewStudents !== false,
    relationshipStatus,
    relationshipId
  };
};

/**
 * Batch-resolves active Premium entitlements for a list of teacher user ids
 * in ONE query (no N+1) and returns a lookup predicate.
 *
 * Both the student discovery route and the parent discovery route call this so
 * Premium is resolved by exactly one shared code path. The returned Set only
 * ever reflects Subscription / ManualPremiumGrant state — never verification.
 */
export const resolveTeacherPremiumIds = async (userIds) => {
  try {
    return await getActivePremiumUserIds(userIds);
  } catch (error) {
    console.error('Error resolving teacher premium entitlements:', error);
    // Fail closed on the visual indicator only: never surface a false Premium
    // claim, and never break the discovery listing itself.
    return new Set();
  }
};

/**
 * GET /api/students/teachers/discover
 * Public discovery of eligible teachers for students with filtering and pagination.
 */
export const discoverTeachers = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const {
      search,
      subject,
      teachingLevel,
      country,
      city,
      isVerified,
      page = 1,
      limit = 12
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build teacher profile filters
    const profileFilter = {
      // Teachers must have published profile or completed profile and be open to new students
      availableForNewStudents: true
    };

    if (subject && typeof subject === 'string' && subject.trim() && subject !== 'ALL') {
      const s = subject.trim().toLowerCase();
      profileFilter.$or = [
        { mainSubject: s },
        { additionalSubjects: s }
      ];
    }

    if (teachingLevel && typeof teachingLevel === 'string' && teachingLevel.trim() && teachingLevel !== 'ALL') {
      profileFilter.teachingLevels = teachingLevel.trim().toLowerCase();
    }

    // Find all profiles matching taxonomy criteria
    const matchingProfiles = await TeacherProfile.find(profileFilter).lean();
    if (!matchingProfiles || matchingProfiles.length === 0) {
      return res.json({
        success: true,
        teachers: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      });
    }

    const teacherUserIds = matchingProfiles.map((p) => p.userId);

    // Build User filter ensuring role is TEACHER and user is active (not suspended, not current student)
    const userFilter = {
      _id: { $in: teacherUserIds, $ne: new mongoose.Types.ObjectId(studentUserId) },
      role: 'TEACHER',
      isSuspended: false
    };

    if (isVerified === 'true') {
      userFilter.$or = [
        { identityVerificationStatus: 'VERIFIED' },
        { identityVerifiedAt: { $ne: null } }
      ];
    }

    if (country && typeof country === 'string' && country.trim()) {
      const c = country.trim();
      const safeCountry = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      userFilter.$or = userFilter.$or || [];
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [{ countryName: safeCountry }, { countryCode: safeCountry }]
      });
    }

    if (city && typeof city === 'string' && city.trim()) {
      const c = city.trim();
      const safeCity = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      userFilter.city = safeCity;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const safeRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      // Search in User.fullName OR find corresponding profile titles/subjects
      const matchedProfileUserIds = matchingProfiles
        .filter((p) => {
          const inTitle = p.title && safeRegex.test(p.title);
          const inMain = p.mainSubject && safeRegex.test(p.mainSubject);
          const inSpec = p.specialization && safeRegex.test(p.specialization);
          const inAdd = Array.isArray(p.additionalSubjects) && p.additionalSubjects.some((s) => safeRegex.test(s));
          return inTitle || inMain || inSpec || inAdd;
        })
        .map((p) => p.userId);

      userFilter.$or = [
        { fullName: safeRegex },
        { _id: { $in: matchedProfileUserIds } }
      ];
    }

    // Execute paginated User query
    const [totalUsers, teacherUsers] = await Promise.all([
      User.countDocuments(userFilter),
      User.find(userFilter)
        .select('_id fullName profileImage role isSuspended identityVerificationStatus identityVerifiedAt countryName countryCode city')
        .sort({ identityVerifiedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    if (!teacherUsers || teacherUsers.length === 0) {
      return res.json({
        success: true,
        teachers: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limitNum)
        }
      });
    }

    // Map profiles by userId
    const profileMap = new Map(matchingProfiles.map((p) => [String(p.userId), p]));
    const currentTeacherIds = teacherUsers.map((u) => u._id);

    // Fetch existing relationships for the current student with these teachers
    const existingRelationships = await TeacherStudent.find({
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      teacherId: { $in: currentTeacherIds },
      isActive: true
    }).lean();

    const relMap = new Map(existingRelationships.map((r) => [String(r.teacherId), r]));

    // One batched Premium entitlement query for this page (no N+1).
    const premiumIds = await resolveTeacherPremiumIds(currentTeacherIds);

    const teachers = teacherUsers.map((u) => {
      const uId = String(u._id);
      return toTeacherDiscoveryDto(
        u,
        profileMap.get(uId),
        relMap.get(uId),
        premiumIds.has(uId)
      );
    });

    return res.json({
      success: true,
      teachers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum)
      }
    });
  } catch (error) {
    console.error('Error discovering teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error discovering teachers',
      error: error.message
    });
  }
};

/**
 * POST /api/students/teachers/:teacherId/request
 * Sends a study request from the authenticated student to a teacher.
 * Creates or reuses a TeacherStudent relationship record with status 'PENDING'.
 */
export const requestTeacherConnection = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { teacherId } = req.params;
    const { message } = req.body || {};

    if (!isValidObjectId(String(teacherId || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Prevent self-request
    if (String(studentUserId) === String(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a connection request to yourself'
      });
    }

    // Verify student user
    const studentUser = await User.findById(studentUserId).select('_id fullName email phone role isSuspended');
    if (!studentUser || studentUser.role !== 'STUDENT' || studentUser.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Only active students can request a teacher connection'
      });
    }

    // Verify target teacher exists, has role TEACHER, and is active
    const targetTeacher = await User.findById(teacherId).select('_id fullName email role isSuspended');
    if (!targetTeacher || targetTeacher.role !== 'TEACHER' || targetTeacher.isSuspended) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found or not eligible for requests'
      });
    }

    // Check existing relationship between this student and teacher
    let existingRel = await TeacherStudent.findOne({
      teacherId: targetTeacher._id,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    });

    if (existingRel) {
      if (existingRel.relationshipStatus === 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'You already have an active relationship with this teacher'
        });
      }
      if (existingRel.relationshipStatus === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'A connection request is already pending approval from this teacher'
        });
      }

      // If ENDED or REJECTED, we safely reset to PENDING
      existingRel.relationshipStatus = 'PENDING';
      existingRel.relationshipStartedAt = null;
      existingRel.relationshipEndedAt = null;
      existingRel.isActive = true;
      if (typeof message === 'string' && message.trim()) {
        const cleanMsg = message.trim().slice(0, 500);
        existingRel.notes = cleanMsg ? `Student request note: ${cleanMsg}` : existingRel.notes;
      }
      await existingRel.save();

      return res.status(200).json({
        success: true,
        message: 'Request sent successfully and is pending teacher approval',
        relationshipId: String(existingRel._id),
        relationshipStatus: 'PENDING'
      });
    }

    // Fetch StudentProfile if available to prefill academic context for the teacher
    const studentProfile = await StudentProfile.findOne({ userId: studentUserId }).lean();

    const resolvedFullName = studentUser.fullName || 'Student';
    const nameParts = resolvedFullName.split(' ');
    const firstName = studentProfile?.firstName || nameParts[0] || 'Student';
    const lastName = studentProfile?.lastName || nameParts.slice(1).join(' ') || '';

    const cleanMsg = typeof message === 'string' && message.trim() ? message.trim().slice(0, 500) : '';

    const newRelationship = new TeacherStudent({
      teacherId: targetTeacher._id,
      linkedUserId: studentUser._id,
      studentUserId: studentUser._id,
      relationshipStatus: 'PENDING',
      relationshipStartedAt: null,
      relationshipEndedAt: null,
      isActive: true,
      status: 'ACTIVE',
      firstName,
      lastName,
      fullName: resolvedFullName,
      email: studentUser.email || '',
      phone: studentUser.phone || '',
      gender: studentProfile?.gender || null,
      dateOfBirth: studentProfile?.dateOfBirth || null,
      school: studentProfile?.school || '',
      gradeLevel: studentProfile?.gradeLevel || '',
      educationLevel: studentProfile?.educationLevel || '',
      subjects: Array.isArray(studentProfile?.subjects) ? studentProfile.subjects : [],
      country: studentProfile?.country || '',
      city: studentProfile?.city || '',
      address: studentProfile?.address || '',
      notes: cleanMsg ? `Student request note: ${cleanMsg}` : ''
    });

    await newRelationship.save();

    return res.status(201).json({
      success: true,
      message: 'Request sent successfully and is pending teacher approval',
      relationshipId: String(newRelationship._id),
      relationshipStatus: 'PENDING'
    });
  } catch (error) {
    console.error('Error requesting teacher connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending teacher connection request',
      error: error.message
    });
  }
};

/**
 * POST /api/students/teachers/:teacherId/cancel-request
 * Cancels a pending request sent by the authenticated student.
 */
export const cancelTeacherRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { teacherId } = req.params;

    if (!isValidObjectId(String(teacherId || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const relationship = await TeacherStudent.findOne({
      teacherId,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'No connection request found for this teacher'
      });
    }

    if (relationship.relationshipStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    relationship.relationshipStatus = 'ENDED';
    relationship.relationshipEndedAt = new Date();
    await relationship.save();

    return res.json({
      success: true,
      message: 'Request cancelled successfully',
      relationshipStatus: 'ENDED'
    });
  } catch (error) {
    console.error('Error cancelling teacher request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling request',
      error: error.message
    });
  }
};

export default {
  discoverTeachers,
  requestTeacherConnection,
  cancelTeacherRequest,
  toTeacherDiscoveryDto
};
