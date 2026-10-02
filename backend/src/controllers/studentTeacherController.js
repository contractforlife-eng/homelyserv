// backend/src/controllers/studentTeacherController.js
// ============================================================
// STUDENT TEACHERS CONTROLLER
// Manages the relationship between a registered Student and their Teachers.
//
// OWNERSHIP / AUTHZ:
// Every query derives identity strictly from `req.userId` (enforced by requireStudent).
// A student can only view or act upon relationships where:
//   `linkedUserId === req.userId` OR `studentUserId === req.userId`
//
// TEACHER SAFETY:
// Exposes only public/safe teacher profile and relationship info.
// Never exposes password hashes, payment secrets, private teacher accounts,
// internal notes, or other students.
// ============================================================
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherProfile from '../models/TeacherProfile.js';
import User from '../models/User.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Builds a safe Teacher relationship DTO for the student.
 */
export const toStudentTeacherRelationshipDto = (relDoc, teacherProfileDoc, teacherUserDoc) => {
  if (!relDoc) return null;
  const rel = typeof relDoc.toObject === 'function' ? relDoc.toObject() : relDoc;
  const tp = teacherProfileDoc ? (typeof teacherProfileDoc.toObject === 'function' ? teacherProfileDoc.toObject() : teacherProfileDoc) : null;
  const tu = teacherUserDoc ? (typeof teacherUserDoc.toObject === 'function' ? teacherUserDoc.toObject() : teacherUserDoc) : null;

  const teacherName = tu?.fullName || 'Teacher';
  const teacherAvatar = tu?.profileImage || tp?.profileImage || null;

  return {
    id: String(rel._id),
    relationshipId: String(rel._id),
    teacherId: String(rel.teacherId),
    teacher: {
      id: String(rel.teacherId),
      name: teacherName,
      avatar: teacherAvatar,
      title: tp?.title || '',
      mainSubject: tp?.mainSubject || '',
      additionalSubjects: Array.isArray(tp?.additionalSubjects) ? tp.additionalSubjects : [],
      specialization: tp?.specialization || '',
      teachingLevels: Array.isArray(tp?.teachingLevels) ? tp.teachingLevels : [],
      teachingMethod: tp?.teachingMethod || 'both',
      yearsOfExperience: tp?.yearsOfExperience || 0,
      bio: tp?.bio || '',
      languages: Array.isArray(tp?.languages) ? tp.languages : [],
      lessonRate: typeof tp?.lessonRate === 'number' ? tp.lessonRate : 0,
      pricingCurrency: tp?.pricingCurrency || '',
      isVerified: tu?.identityVerificationStatus === 'VERIFIED' || tu?.identityVerifiedAt !== null
    },
    // Relationship status & dates
    relationshipStatus: rel.relationshipStatus || (rel.status === 'ACTIVE' ? 'ACTIVE' : 'ENDED'),
    status: rel.status || 'ACTIVE',
    startedAt: rel.relationshipStartedAt || rel.createdAt || null,
    endedAt: rel.relationshipEndedAt || null,
    // Academic scope recorded for this student
    subjects: Array.isArray(rel.subjects) ? rel.subjects : [],
    gradeLevel: rel.gradeLevel || '',
    educationLevel: rel.educationLevel || ''
  };
};

/**
 * GET /api/students/teachers
 * Retrieves all teachers connected to the authenticated student.
 */
export const getStudentTeachers = async (req, res) => {
  try {
    const studentUserId = req.userId;

    // Find all relationships pointing to this student user
    const relationships = await TeacherStudent.find({
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    }).sort({ createdAt: -1 });

    if (!relationships || relationships.length === 0) {
      return res.json({
        success: true,
        count: 0,
        teachers: []
      });
    }

    // Collect teacherIds
    const teacherIds = [...new Set(relationships.map((r) => String(r.teacherId)))];

    // Fetch public teacher users and teacher profiles in batch
    const [teacherUsers, teacherProfiles] = await Promise.all([
      User.find({ _id: { $in: teacherIds } })
        .select('_id fullName profileImage identityVerificationStatus identityVerifiedAt isSuspended'),
      TeacherProfile.find({ userId: { $in: teacherIds } })
        .select('userId title mainSubject additionalSubjects specialization teachingLevels teachingMethod yearsOfExperience bio languages lessonRate pricingCurrency profileImage isPublished')
    ]);

    const userMap = new Map(teacherUsers.map((u) => [String(u._id), u]));
    const profileMap = new Map(teacherProfiles.map((p) => [String(p.userId), p]));

    const teachers = relationships.map((rel) => {
      const tId = String(rel.teacherId);
      return toStudentTeacherRelationshipDto(rel, profileMap.get(tId), userMap.get(tId));
    });

    return res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error('Error fetching student teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching connected teachers',
      error: error.message
    });
  }
};

/**
 * GET /api/students/teachers/:id
 * Retrieves a single teacher relationship details if owned by authenticated student.
 */
export const getStudentTeacherById = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    const relationship = await TeacherStudent.findOne({
      _id: id,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    const teacherId = String(relationship.teacherId);

    const [teacherUser, teacherProfile] = await Promise.all([
      User.findById(teacherId)
        .select('_id fullName profileImage identityVerificationStatus identityVerifiedAt isSuspended'),
      TeacherProfile.findOne({ userId: teacherId })
        .select('userId title mainSubject additionalSubjects specialization teachingLevels teachingMethod yearsOfExperience bio languages lessonRate pricingCurrency profileImage isPublished')
    ]);

    return res.json({
      success: true,
      teacher: toStudentTeacherRelationshipDto(relationship, teacherProfile, teacherUser)
    });
  } catch (error) {
    console.error('Error fetching student teacher details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching teacher relationship',
      error: error.message
    });
  }
};

/**
 * POST /api/students/teachers/:id/accept
 * Accepts a pending teacher invitation/relationship.
 */
export const acceptStudentTeacher = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    const relationship = await TeacherStudent.findOne({
      _id: id,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    relationship.relationshipStatus = 'ACTIVE';
    relationship.status = 'ACTIVE';
    if (!relationship.relationshipStartedAt) {
      relationship.relationshipStartedAt = new Date();
    }
    await relationship.save();

    return res.json({
      success: true,
      message: 'Teacher connection accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting teacher relationship:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error accepting teacher relationship',
      error: error.message
    });
  }
};

/**
 * POST /api/students/teachers/:id/end
 * Ends an active or pending teacher relationship from the student side.
 */
export const endStudentTeacher = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    const relationship = await TeacherStudent.findOne({
      _id: id,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Teacher relationship not found'
      });
    }

    relationship.relationshipStatus = 'ENDED';
    relationship.relationshipEndedAt = new Date();
    await relationship.save();

    return res.json({
      success: true,
      message: 'Teacher connection ended successfully'
    });
  } catch (error) {
    console.error('Error ending teacher relationship:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error ending teacher relationship',
      error: error.message
    });
  }
};

export default {
  getStudentTeachers,
  getStudentTeacherById,
  acceptStudentTeacher,
  endStudentTeacher,
  toStudentTeacherRelationshipDto
};
