// backend/src/controllers/parentTeacherDiscoveryController.js
// ============================================================
// PARENT TEACHER DISCOVERY & REQUEST CONTROLLER (PHASE 10)
// Enables a parent/guardian (WORKER, EMPLOYER, DOCTOR) to browse,
// search, and request an existing teacher for a linked child.
//
// OWNERSHIP / AUTHZ:
// - Parent identity derived from `req.userId` + ACTIVE
//   ParentStudent relationship to the targeted child.
// - The parent is NOT a student; the relationship is created
//   between the TEACHER and the CHILD (TeacherStudent model).
// - Teacher acceptance is unchanged (see teacherStudentController.js).
// ============================================================
import mongoose from 'mongoose';
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import StudentProfile from '../models/StudentProfile.js';
import { toTeacherDiscoveryDto, resolveTeacherPremiumIds } from './studentTeacherDiscoveryController.js';
import { ALLOWED_PARENT_ROLES, requireActiveParentStudentRelationship } from '../services/parentStudentService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

export const discoverParentsTeachers = async (req, res) => {
  try {
    const { studentId } = req.params;
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

    // Guard: parent must own an ACTIVE parent-student relationship with the child
    const parentUserId = req.userId;
    const parentUserRole = req.userRole;
    if (!ALLOWED_PARENT_ROLES.has(parentUserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only WORKER, EMPLOYER or DOCTOR accounts can manage parent-student learning'
      });
    }
    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required to view teachers for this child'
      });
    }

    // Build teacher profile filters (same taxonomy as student discovery)
    const profileFilter = {
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

    // Build User filter ensuring role is TEACHER and user is active
    const userFilter = {
      _id: { $in: teacherUserIds, $ne: new mongoose.Types.ObjectId(studentId) },
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
      const cCountry = country.trim();
      const safeCountry = new RegExp(cCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [{ countryName: safeCountry }, { countryCode: safeCountry }]
      });
    }

    if (city && typeof city === 'string' && city.trim()) {
      const cCity = city.trim();
      userFilter.city = new RegExp(cCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const safeRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedProfileUserIds = matchingProfiles
        .filter((p) => {
          const inTitle = p.title && safeRegex.test(p.title);
          const inMain = p.mainSubject && safeRegex.test(p.mainSubject);
          const inSpec = p.specialization && safeRegex.test(p.specialization);
          const inAdd = Array.isArray(p.additionalSubjects) && p.additionalSubjects.some((s) => safeRegex.test(s));
          return inTitle || inMain || inSpec || inAdd;
        })
        .map((p) => p.userId);
      if (matchedProfileUserIds.length > 0) {
        userFilter.$or = userFilter.$or || [];
        userFilter.$or.push({ _id: { $in: matchedProfileUserIds } });
      }
    }

    const teacherUserDocs = await User.find(userFilter).lean();
    const profileByUserId = new Map(
      matchingProfiles.map((p) => [String(p.userId), p])
    );
    const teachers = [];
    const seen = new Set();

    // One batched Premium entitlement query for this result set (no N+1),
    // reusing the shared student-discovery resolver so Premium is derived from
    // exactly one code path and stays independent of verification.
    const premiumIds = await resolveTeacherPremiumIds(
      teacherUserDocs.map((tu) => String(tu._id))
    );

    for (const tu of teacherUserDocs) {
      if (seen.has(String(tu._id))) continue;
      seen.add(String(tu._id));

      const teacherProfile = profileByUserId.get(String(tu._id)) || null;

      const rel = await TeacherStudent.findOne({
        teacherId: tu._id,
        $or: [{ linkedUserId: studentId }, { studentUserId: studentId }],
        isActive: true
      }).lean();

      teachers.push(toTeacherDiscoveryDto(
        tu,
        teacherProfile,
        rel,
        premiumIds.has(String(tu._id))
      ));
    }

    const total = teachers.length;
    const paginated = teachers.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      teachers: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('Error discovering parent teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error discovering teachers',
      error: error.message
    });
  }
};

export const requestParentTeacher = async (req, res) => {
  try {
    const { studentId, teacherId } = req.params;
    const { message } = req.body || {};

    if (!isValidObjectId(String(teacherId || ''))) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // 1. Parent must have an ACTIVE parent-student relationship with the child
    const parentUserId = req.userId;
    const parentUserRole = req.userRole;
    if (!ALLOWED_PARENT_ROLES.has(parentUserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only WORKER, EMPLOYER or DOCTOR accounts can manage parent-student learning'
      });
    }
    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required to request this teacher for the child'
      });
    }

    // 2. Verify the child is an active STUDENT account (preserves linked-user flow)
    const childUser = await User.findById(studentId).select('_id fullName email phone role isSuspended');
    if (!childUser || childUser.role !== 'STUDENT' || childUser.isSuspended) {
      return res.status(404).json({
        success: false,
        message: 'Linked student account not found or unavailable'
      });
    }

    // 3. Verify target teacher
    const targetTeacher = await User.findById(teacherId).select('_id fullName email role isSuspended');
    if (!targetTeacher || targetTeacher.role !== 'TEACHER' || targetTeacher.isSuspended) {
      return res.status(404).json({ success: false, message: 'Teacher not found or not eligible for requests' });
    }

    // 4. Prevent self-request
    if (String(teacherId) === String(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a teacher for the same child'
      });
    }

    // 5. Check existing relationship between this teacher and the child
    let existingRel = await TeacherStudent.findOne({
      teacherId,
      $or: [{ linkedUserId: studentId }, { studentUserId: studentId }],
      isActive: true
    });

    if (existingRel) {
      if (existingRel.relationshipStatus === 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'This child already has an active relationship with this teacher'
        });
      }
      if (existingRel.relationshipStatus === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'A teacher request is already pending approval from this teacher'
        });
      }
      // ENDED or REJECTED: reset to PENDING
      existingRel.relationshipStatus = 'PENDING';
      existingRel.relationshipStartedAt = null;
      existingRel.relationshipEndedAt = null;
      if (typeof message === 'string' && message.trim()) {
        existingRel.notes = message.trim().slice(0, 500);
      }
      await existingRel.save();

      return res.status(200).json({
        success: true,
        message: 'Request sent successfully and is pending teacher approval',
        relationshipId: String(existingRel._id),
        relationshipStatus: 'PENDING'
      });
    }

    // 6. Create new TeacherStudent relationship (teacher <-> child) as PENDING,
    //    mirroring the student request payload (child identity, not the parent's).
    const childProfile = await StudentProfile.findOne({ userId: studentId }).lean();
    const resolvedFullName = childUser.fullName || 'Student';
    const nameParts = resolvedFullName.split(' ');
    const cleanMsg = typeof message === 'string' && message.trim() ? message.trim().slice(0, 500) : '';

    const newRelationship = new TeacherStudent({
      teacherId: targetTeacher._id,
      studentUserId: childUser._id,
      linkedUserId: childUser._id,
      relationshipStatus: 'PENDING',
      relationshipStartedAt: null,
      relationshipEndedAt: null,
      isActive: true,
      status: 'ACTIVE',
      firstName: childProfile?.firstName || nameParts[0] || 'Student',
      lastName: childProfile?.lastName || nameParts.slice(1).join(' ') || '',
      fullName: resolvedFullName,
      email: childUser.email || '',
      phone: childUser.phone || '',
      gender: childProfile?.gender || null,
      dateOfBirth: childProfile?.dateOfBirth || null,
      school: childProfile?.school || '',
      gradeLevel: childProfile?.gradeLevel || '',
      educationLevel: childProfile?.educationLevel || '',
      subjects: Array.isArray(childProfile?.subjects) ? childProfile.subjects : [],
      country: childProfile?.country || '',
      city: childProfile?.city || '',
      address: childProfile?.address || '',
      notes: cleanMsg ? `Parent request note: ${cleanMsg}` : ''
    });

    await newRelationship.save();

    return res.status(201).json({
      success: true,
      message: 'Request sent successfully and is pending teacher approval',
      relationshipId: String(newRelationship._id),
      relationshipStatus: 'PENDING'
    });
  } catch (error) {
    console.error('Error requesting parent teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending teacher request',
      error: error.message
    });
  }
};

export default {
  discoverParentsTeachers,
  requestParentTeacher
};
