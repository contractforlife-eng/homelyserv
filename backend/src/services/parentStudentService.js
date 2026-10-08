// backend/src/services/parentStudentService.js
// ============================================================
// PARENT-STUDENT SERVICE (PHASE 10)
//
// Centralized server-authoritative service for Parent/Guardian
// learning management.
//
// INTEGRITY & SECURITY RULES:
// 1. Parent accounts must have role WORKER, EMPLOYER or DOCTOR.
// 2. Child accounts must have role STUDENT.
// 3. Educational access is permitted IF AND ONLY IF an ACTIVE
//    ParentStudent relationship exists between parentUserId and studentUserId.
// 4. No self-linking (parentUserId !== studentUserId).
// 5. Does NOT expose medical, chat, friendship, or billing secrets.
// 6. Direct child data queries read single sources of truth
//    (TeacherLesson, TeacherAssessment, StudentLessonBooking, TeacherStudent).
// ============================================================
import mongoose from 'mongoose';
import ParentStudent from '../models/ParentStudent.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherAssessment from '../models/TeacherAssessment.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherProfile from '../models/TeacherProfile.js';
import { checkTeacherScheduleConflict, validateTimeRange } from './lessonBookingConflictService.js';

export const ALLOWED_PARENT_ROLES = new Set(['WORKER', 'EMPLOYER', 'DOCTOR']);

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Validates whether an ACTIVE ParentStudent relationship exists.
 * Returns the ParentStudent document or null.
 *
 * @param {string|mongoose.Types.ObjectId} parentUserId
 * @param {string|mongoose.Types.ObjectId} studentUserId
 * @returns {Promise<object|null>}
 */
export const requireActiveParentStudentRelationship = async (parentUserId, studentUserId) => {
  const pId = String(parentUserId || '');
  const sId = String(studentUserId || '');
  if (!isValidObjectId(pId) || !isValidObjectId(sId) || pId === sId) {
    return null;
  }

  const query = ParentStudent.findOne({
    parentUserId: pId,
    studentUserId: sId,
    relationshipStatus: 'ACTIVE'
  });

  const relationship = typeof query?.lean === 'function' ? await query.lean() : await query;
  return relationship || null;
};

/**
 * Helper to fetch a student's authorized scope (myStudentIds & myGroupIds).
 */
export const getStudentAuthorizedScope = async (studentUserId) => {
  const sId = String(studentUserId || '');
  const activeRelationships = await TeacherStudent.find({
    $or: [{ linkedUserId: sId }, { studentUserId: sId }],
    isActive: true,
    relationshipStatus: 'ACTIVE'
  }).select('_id teacherId');

  const myStudentIds = activeRelationships.map((r) => r._id);
  const myStudentIdStrings = activeRelationships.map((r) => String(r._id));
  const authorizedTeacherIds = [...new Set(activeRelationships.map((r) => String(r.teacherId)))];

  if (myStudentIds.length === 0) {
    return {
      myStudentIds: [],
      myStudentIdSet: new Set(),
      myGroupIds: [],
      authorizedTeacherIds,
      activeRelationships: []
    };
  }

  const enrollments = await TeacherGroupEnrollment.find({
    studentId: { $in: myStudentIds },
    status: 'ACTIVE',
    isActive: true
  }).select('groupId');

  const myGroupIds = enrollments.map((e) => e.groupId);

  return {
    myStudentIds,
    myStudentIdSet: new Set(myStudentIdStrings),
    myGroupIds,
    authorizedTeacherIds,
    activeRelationships
  };
};

/**
 * Returns safe DTO for a child from Parent's perspective.
 */
export const toChildSummaryDto = async (studentUserDoc, parentStudentDoc) => {
  if (!studentUserDoc) return null;
  const sId = String(studentUserDoc._id);

  // StudentProfile info
  const profile = await StudentProfile.findOne({ userId: sId }).lean();

  // Active Teachers count
  const scope = await getStudentAuthorizedScope(sId);
  const activeTeachersCount = scope.authorizedTeacherIds.length;

  // Next upcoming lesson
  const now = new Date();
  const nextLesson = scope.myStudentIds.length > 0
    ? await TeacherLesson.findOne({
        isActive: true,
        lessonStatus: { $in: ['SCHEDULED'] },
        date: { $gte: now },
        $or: [
          { lessonType: 'ONE_ON_ONE', studentId: { $in: scope.myStudentIds } },
          { lessonType: 'GROUP', groupId: { $in: scope.myGroupIds } }
        ]
      })
        .sort({ date: 1, startTime: 1 })
        .populate('teacherId', 'fullName profileImage')
        .lean()
    : null;

  return {
    studentId: sId,
    relationshipId: parentStudentDoc ? String(parentStudentDoc._id) : null,
    relationshipStatus: parentStudentDoc?.relationshipStatus || 'PENDING',
    relationshipType: parentStudentDoc?.relationshipType || 'PARENT',
    fullName: studentUserDoc.fullName || 'Student',
    profileImage: studentUserDoc.profileImage || null,
    email: studentUserDoc.email || null,
    school: profile?.schoolName || profile?.school || '',
    grade: profile?.grade || profile?.educationLevel || '',
    educationLevel: profile?.educationLevel || '',
    subjects: Array.isArray(profile?.enrolledSubjects) ? profile.enrolledSubjects : [],
    activeTeachersCount,
    nextLesson: nextLesson
      ? {
          id: String(nextLesson._id),
          subject: nextLesson.subject || '',
          date: nextLesson.date ? new Date(nextLesson.date).toISOString().split('T')[0] : null,
          startTime: nextLesson.startTime || '',
          endTime: nextLesson.endTime || '',
          lessonType: nextLesson.lessonType || 'ONE_ON_ONE',
          teacherName: nextLesson.teacherId?.fullName || 'Teacher'
        }
      : null
  };
};

export default {
  ALLOWED_PARENT_ROLES,
  requireActiveParentStudentRelationship,
  getStudentAuthorizedScope,
  toChildSummaryDto
};
