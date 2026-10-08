// backend/src/controllers/parentStudentController.js
// ============================================================
// PARENT-STUDENT CONTROLLER (PHASE 10)
//
// Endpoints:
// - GET  /api/parent-students              - List linked children & status for logged-in parent
// - POST /api/parent-students/request      - Parent sends link request to student by email or ID
// - GET  /api/parent-students/requests     - Student views incoming parent link requests
// - POST /api/parent-students/:id/accept   - Student accepts parent link request
// - POST /api/parent-students/:id/reject   - Student rejects parent link request
// - POST /api/parent-students/:id/cancel   - Parent cancels own pending request
// - POST /api/parent-students/:id/end      - Parent or Student ends an active relationship
//
// Controlled Educational Child Views (Requires ACTIVE relationship):
// - GET  /api/parent-students/:studentId/overview   - Child educational dashboard overview
// - GET  /api/parent-students/:studentId/teachers   - Child connected teachers
// - GET  /api/parent-students/:studentId/lessons    - Child lessons & timetable
// - GET  /api/parent-students/:studentId/progress   - Child assessments & academic progress
// - GET  /api/parent-students/:studentId/homework   - Child homework tasks
// - GET  /api/parent-students/:studentId/bookings   - Child lesson bookings
// - POST /api/parent-students/:studentId/bookings   - Parent initiates lesson booking for child
// ============================================================
import mongoose from 'mongoose';
import ParentStudent from '../models/ParentStudent.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherAssessment from '../models/TeacherAssessment.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherProfile from '../models/TeacherProfile.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { checkTeacherScheduleConflict, validateTimeRange } from '../services/lessonBookingConflictService.js';
import {
  ALLOWED_PARENT_ROLES,
  requireActiveParentStudentRelationship,
  getStudentAuthorizedScope,
  toChildSummaryDto
} from '../services/parentStudentService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

// ============================================================
// 1. RELATIONSHIP LIFECYCLE HANDLERS
// ============================================================

/**
 * GET /api/parent-students
 * Parent lists all linked children and pending requests.
 */
export const getParentChildren = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const userRole = req.userRole;

    if (!ALLOWED_PARENT_ROLES.has(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only WORKER, EMPLOYER or DOCTOR accounts can manage parent-student learning'
      });
    }

    const records = await ParentStudent.find({ parentUserId })
      .sort({ updatedAt: -1 })
      .lean();

    const studentIds = records.map((r) => r.studentUserId);
    const studentUsers = await User.find({ _id: { $in: studentIds } })
      .select('_id fullName email profileImage role')
      .lean();

    const userMap = new Map(studentUsers.map((u) => [String(u._id), u]));

    const children = [];
    for (const r of records) {
      const studentUser = userMap.get(String(r.studentUserId));
      if (studentUser) {
        const summary = await toChildSummaryDto(studentUser, r);
        children.push(summary);
      }
    }

    return res.json({
      success: true,
      count: children.length,
      children
    });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch linked children',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/request
 * Parent sends link request to student by studentUserId or studentEmail.
 */
export const requestChildLink = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const userRole = req.userRole;
    const { studentUserId, studentEmail, relationshipType = 'PARENT', notes = '' } = req.body || {};

    if (!ALLOWED_PARENT_ROLES.has(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only WORKER or EMPLOYER accounts can send parent link requests'
      });
    }

    // Identify target student
    let targetStudent = null;
    if (studentUserId && isValidObjectId(String(studentUserId))) {
      targetStudent = await User.findById(studentUserId).select('_id fullName email role');
    } else if (studentEmail && typeof studentEmail === 'string' && studentEmail.trim()) {
      targetStudent = await User.findOne({ email: studentEmail.trim().toLowerCase() }).select('_id fullName email role');
    }

    // Prevent linking self immediately if studentUserId matches
    if (studentUserId && String(parentUserId) === String(studentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot link your own account as a child'
      });
    }

    if (!targetStudent || targetStudent.role !== 'STUDENT') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found with the provided identifier'
      });
    }

    const targetStudentId = String(targetStudent._id);

    // Prevent linking self by email
    if (String(parentUserId) === targetStudentId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot link your own account as a child'
      });
    }

    // Check existing link
    let existing = await ParentStudent.findOne({
      parentUserId,
      studentUserId: targetStudentId
    });

    if (existing) {
      if (existing.relationshipStatus === 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'Student is already linked to your account'
        });
      }
      if (existing.relationshipStatus === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'A link request is already pending for this student'
        });
      }

      // Re-open if REJECTED or ENDED
      existing.relationshipStatus = 'PENDING';
      existing.relationshipType = ['PARENT', 'GUARDIAN', 'FAMILY'].includes(relationshipType) ? relationshipType : 'PARENT';
      existing.requestedAt = new Date();
      existing.respondedAt = null;
      existing.endedAt = null;
      existing.notes = cleanString(notes, 500);
      await existing.save();

      // Notify student
      try {
        const parentUser = await User.findById(parentUserId).select('fullName');
        createNotification(targetStudentId, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Parent Link Request',
          message: `${parentUser?.fullName || 'A parent/guardian'} wants to link your student account for learning management.`,
          link: '/student-dashboard'
        }).catch(() => {});
      } catch (_) {}

      return res.status(200).json({
        success: true,
        message: 'Parent link request sent',
        relationship: existing
      });
    }

    // Create new relationship
    const newRel = await ParentStudent.create({
      parentUserId,
      studentUserId: targetStudentId,
      relationshipStatus: 'PENDING',
      relationshipType: ['PARENT', 'GUARDIAN', 'FAMILY'].includes(relationshipType) ? relationshipType : 'PARENT',
      notes: cleanString(notes, 500)
    });

    // Notify student
    try {
      const parentUser = await User.findById(parentUserId).select('fullName');
      createNotification(targetStudentId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Parent Link Request',
        message: `${parentUser?.fullName || 'A parent/guardian'} wants to link your student account for learning management.`,
        link: '/student-dashboard'
      }).catch(() => {});
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Parent link request sent successfully',
      relationship: newRel
    });
  } catch (error) {
    console.error('Error creating parent link request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create parent link request',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/requests
 * Student views incoming link requests from parents.
 */
export const getStudentIncomingRequests = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const userRole = req.userRole;

    if (userRole !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Only STUDENT accounts can view incoming parent requests'
      });
    }

    const requests = await ParentStudent.find({
      studentUserId,
      relationshipStatus: 'PENDING'
    }).sort({ requestedAt: -1 }).lean();

    const parentIds = requests.map((r) => r.parentUserId);
    const parentUsers = await User.find({ _id: { $in: parentIds } })
      .select('_id fullName email role profileImage')
      .lean();

    const parentMap = new Map(parentUsers.map((u) => [String(u._id), u]));

    const formatted = requests.map((r) => {
      const parent = parentMap.get(String(r.parentUserId));
      return {
        id: String(r._id),
        parentUserId: String(r.parentUserId),
        parent: parent
          ? {
              id: String(parent._id),
              fullName: parent.fullName || 'Parent',
              role: parent.role,
              avatar: parent.profileImage || null
            }
          : null,
        relationshipType: r.relationshipType,
        notes: r.notes || '',
        requestedAt: r.requestedAt
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      requests: formatted
    });
  } catch (error) {
    console.error('Error fetching incoming parent requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incoming parent requests',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/:id/accept
 * Student accepts a pending parent link request.
 */
export const acceptParentRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const userRole = req.userRole;
    const { id } = req.params;

    if (userRole !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient STUDENT can accept a parent link request'
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid relationship ID' });
    }

    const rel = await ParentStudent.findById(id);
    if (!rel) {
      return res.status(404).json({ success: false, message: 'Relationship request not found' });
    }

    if (String(rel.studentUserId) !== String(studentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    if (rel.relationshipStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status ${rel.relationshipStatus}`
      });
    }

    rel.relationshipStatus = 'ACTIVE';
    rel.respondedAt = new Date();
    await rel.save();

    // Notify parent
    try {
      const studentUser = await User.findById(studentUserId).select('fullName');
      createNotification(String(rel.parentUserId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Child Link Accepted',
        message: `${studentUser?.fullName || 'Student'} accepted your parent learning management link.`,
        link: '/parent-students'
      }).catch(() => {});
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Parent link request accepted',
      relationship: rel
    });
  } catch (error) {
    console.error('Error accepting parent request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept parent request',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/:id/reject
 * Student rejects a pending parent link request.
 */
export const rejectParentRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const userRole = req.userRole;
    const { id } = req.params;

    if (userRole !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient STUDENT can reject a parent link request'
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid relationship ID' });
    }

    const rel = await ParentStudent.findById(id);
    if (!rel) {
      return res.status(404).json({ success: false, message: 'Relationship request not found' });
    }

    if (String(rel.studentUserId) !== String(studentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    if (rel.relationshipStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status ${rel.relationshipStatus}`
      });
    }

    rel.relationshipStatus = 'REJECTED';
    rel.respondedAt = new Date();
    await rel.save();

    return res.json({
      success: true,
      message: 'Parent link request rejected',
      relationship: rel
    });
  } catch (error) {
    console.error('Error rejecting parent request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject parent request',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/:id/cancel
 * Parent cancels own pending link request.
 */
export const cancelParentRequest = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid relationship ID' });
    }

    const rel = await ParentStudent.findById(id);
    if (!rel) {
      return res.status(404).json({ success: false, message: 'Relationship request not found' });
    }

    if (String(rel.parentUserId) !== String(parentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (rel.relationshipStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    rel.relationshipStatus = 'ENDED';
    rel.endedAt = new Date();
    await rel.save();

    return res.json({
      success: true,
      message: 'Parent link request cancelled',
      relationship: rel
    });
  } catch (error) {
    console.error('Error cancelling parent request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel parent request',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/:id/end
 * Either party ends an ACTIVE relationship.
 */
export const endParentStudentRelationship = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid relationship ID' });
    }

    const rel = await ParentStudent.findById(id);
    if (!rel) {
      return res.status(404).json({ success: false, message: 'Relationship not found' });
    }

    const isParty = String(rel.parentUserId) === String(userId) || String(rel.studentUserId) === String(userId);
    if (!isParty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this relationship'
      });
    }

    rel.relationshipStatus = 'ENDED';
    rel.endedAt = new Date();
    await rel.save();

    return res.json({
      success: true,
      message: 'Relationship ended successfully',
      relationship: rel
    });
  } catch (error) {
    console.error('Error ending parent-student relationship:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end relationship',
      error: error.message
    });
  }
};

// ============================================================
// 2. CONTROLLED CHILD EDUCATIONAL DATA VIEWS
// ============================================================

/**
 * GET /api/parent-students/:studentId/overview
 * Returns educational overview for an active child.
 */
export const getChildOverview = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required to view child overview'
      });
    }

    const userQuery = User.findById(studentId).select('_id fullName email profileImage role');
    const studentUser = typeof userQuery?.lean === 'function' ? await userQuery.lean() : await userQuery;
    if (!studentUser) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    const summary = await toChildSummaryDto(studentUser, relationship);
    const scope = await getStudentAuthorizedScope(studentId);

    // Recent lesson count, upcoming lessons count, pending bookings count
    const [upcomingLessonsCount, pendingBookingsCount, recentAssessmentsCount] = await Promise.all([
      scope.myStudentIds.length > 0
        ? TeacherLesson.countDocuments({
            isActive: true,
            lessonStatus: 'SCHEDULED',
            date: { $gte: new Date() },
            $or: [
              { lessonType: 'ONE_ON_ONE', studentId: { $in: scope.myStudentIds } },
              { lessonType: 'GROUP', groupId: { $in: scope.myGroupIds } }
            ]
          })
        : 0,
      scope.myStudentIds.length > 0
        ? StudentLessonBooking.countDocuments({
            studentId: { $in: scope.myStudentIds },
            status: 'PENDING'
          })
        : 0,
      scope.myStudentIds.length > 0
        ? TeacherAssessment.countDocuments({
            studentId: { $in: scope.myStudentIds },
            isActive: true
          })
        : 0
    ]);

    return res.json({
      success: true,
      overview: {
        ...summary,
        upcomingLessonsCount,
        pendingBookingsCount,
        recentAssessmentsCount
      }
    });
  } catch (error) {
    console.error('Error fetching child overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child overview',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/:studentId/teachers
 * Returns connected teachers for an active child.
 */
export const getChildTeachers = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required'
      });
    }

    const activeRels = await TeacherStudent.find({
      $or: [{ linkedUserId: studentId }, { studentUserId: studentId }],
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }).sort({ updatedAt: -1 }).lean();

    const teacherIds = activeRels.map((r) => r.teacherId);
    const [teacherUsers, teacherProfiles] = await Promise.all([
      User.find({ _id: { $in: teacherIds } }).select('_id fullName email profileImage role identityVerificationStatus identityVerifiedAt').lean(),
      TeacherProfile.find({ userId: { $in: teacherIds } }).lean()
    ]);

    const userMap = new Map(teacherUsers.map((u) => [String(u._id), u]));
    const profileMap = new Map(teacherProfiles.map((p) => [String(p.userId), p]));

    const teachers = activeRels.map((rel) => {
      const tu = userMap.get(String(rel.teacherId));
      const tp = profileMap.get(String(rel.teacherId));
      return {
        relationshipId: String(rel._id),
        teacherId: String(rel.teacherId),
        fullName: tu?.fullName || 'Teacher',
        avatar: tu?.profileImage || tp?.profileImage || null,
        title: tp?.title || '',
        mainSubject: tp?.mainSubject || '',
        additionalSubjects: tp?.additionalSubjects || [],
        teachingMethod: tp?.teachingMethod || 'both',
        lessonRate: tp?.lessonRate || 0,
        pricingCurrency: tp?.pricingCurrency || 'USD',
        isVerified: tu?.identityVerificationStatus === 'VERIFIED' || tu?.identityVerifiedAt !== null,
        startedAt: rel.relationshipStartedAt || rel.createdAt
      };
    });

    return res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error('Error fetching child teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child teachers',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/:studentId/lessons
 * Returns scheduled and past lessons for an active child.
 */
export const getChildLessons = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required'
      });
    }

    const scope = await getStudentAuthorizedScope(studentId);
    if (scope.myStudentIds.length === 0) {
      return res.json({ success: true, count: 0, lessons: [] });
    }

    const lessons = await TeacherLesson.find({
      isActive: true,
      $or: [
        { lessonType: 'ONE_ON_ONE', studentId: { $in: scope.myStudentIds } },
        { lessonType: 'GROUP', groupId: { $in: scope.myGroupIds } }
      ]
    })
      .sort({ date: -1, startTime: -1 })
      .populate('teacherId', 'fullName profileImage')
      .lean();

    const formatted = lessons.map((l) => ({
      id: String(l._id),
      subject: l.subject,
      title: l.title || l.subject,
      date: l.date ? new Date(l.date).toISOString().split('T')[0] : null,
      startTime: l.startTime,
      endTime: l.endTime,
      lessonType: l.lessonType,
      lessonStatus: l.lessonStatus,
      teacher: {
        id: String(l.teacherId?._id || l.teacherId),
        name: l.teacherId?.fullName || 'Teacher',
        avatar: l.teacherId?.profileImage || null
      },
      homework: l.homework && l.homework.title
        ? {
            title: l.homework.title,
            description: l.homework.description || '',
            dueDate: l.homework.dueDate ? new Date(l.homework.dueDate).toISOString().split('T')[0] : null,
            isCompleted: Boolean(l.homework.isCompleted),
            studentCompletedAt: l.homework.studentCompletedAt || null
          }
        : null
    }));

    return res.json({
      success: true,
      count: formatted.length,
      lessons: formatted
    });
  } catch (error) {
    console.error('Error fetching child lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child lessons',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/:studentId/progress
 * Returns academic assessments and progress metrics for an active child.
 */
export const getChildProgress = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required'
      });
    }

    const scope = await getStudentAuthorizedScope(studentId);
    if (scope.myStudentIds.length === 0) {
      return res.json({
        success: true,
        summary: {
          attendanceRate: 0,
          homeworkCompletionRate: 0,
          averageGrade: null,
          totalAssessments: 0
        },
        assessments: []
      });
    }

    // Assessments
    const rawAssessments = await TeacherAssessment.find({
      studentId: { $in: scope.myStudentIds },
      isActive: true
    })
      .sort({ date: -1 })
      .populate('teacherId', 'fullName profileImage')
      .lean();

    const assessments = rawAssessments.map((a) => ({
      id: String(a._id),
      title: a.title,
      subject: a.subject,
      type: a.type,
      score: a.score,
      maxScore: a.maxScore,
      grade: a.grade || null,
      date: a.date ? new Date(a.date).toISOString().split('T')[0] : null,
      feedback: a.feedback || '',
      teacherName: a.teacherId?.fullName || 'Teacher'
    }));

    // Stats calculations
    let totalScorePercent = 0;
    let scoredCount = 0;
    assessments.forEach((a) => {
      if (typeof a.score === 'number' && typeof a.maxScore === 'number' && a.maxScore > 0) {
        totalScorePercent += (a.score / a.maxScore) * 100;
        scoredCount += 1;
      }
    });
    const averageGrade = scoredCount > 0 ? Math.round(totalScorePercent / scoredCount) : null;

    // Homework stats
    const lessonsWithHomework = await TeacherLesson.find({
      isActive: true,
      $or: [
        { lessonType: 'ONE_ON_ONE', studentId: { $in: scope.myStudentIds } },
        { lessonType: 'GROUP', groupId: { $in: scope.myGroupIds } }
      ],
      'homework.title': { $exists: true, $ne: '' }
    }).select('homework').lean();

    const totalHomework = lessonsWithHomework.length;
    const completedHomework = lessonsWithHomework.filter(
      (l) => l.homework?.isCompleted || Boolean(l.homework?.studentCompletedAt)
    ).length;
    const homeworkCompletionRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;

    return res.json({
      success: true,
      summary: {
        averageGrade,
        homeworkCompletionRate,
        totalAssessments: assessments.length,
        totalHomework
      },
      assessments
    });
  } catch (error) {
    console.error('Error fetching child progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child progress',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/:studentId/homework
 * Returns all assigned homework for an active child.
 */
export const getChildHomework = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required'
      });
    }

    const scope = await getStudentAuthorizedScope(studentId);
    if (scope.myStudentIds.length === 0) {
      return res.json({ success: true, count: 0, homeworkList: [] });
    }

    const lessons = await TeacherLesson.find({
      isActive: true,
      $or: [
        { lessonType: 'ONE_ON_ONE', studentId: { $in: scope.myStudentIds } },
        { lessonType: 'GROUP', groupId: { $in: scope.myGroupIds } }
      ],
      'homework.title': { $exists: true, $ne: '' }
    })
      .sort({ 'homework.dueDate': -1, date: -1 })
      .populate('teacherId', 'fullName profileImage')
      .lean();

    const homeworkList = lessons.map((l) => ({
      lessonId: String(l._id),
      subject: l.subject,
      lessonDate: l.date ? new Date(l.date).toISOString().split('T')[0] : null,
      teacherName: l.teacherId?.fullName || 'Teacher',
      title: l.homework?.title || '',
      description: l.homework?.description || '',
      dueDate: l.homework?.dueDate ? new Date(l.homework.dueDate).toISOString().split('T')[0] : null,
      isCompleted: Boolean(l.homework?.isCompleted),
      studentCompletedAt: l.homework?.studentCompletedAt || null,
      studentNote: l.homework?.studentNote || ''
    }));

    return res.json({
      success: true,
      count: homeworkList.length,
      homeworkList
    });
  } catch (error) {
    console.error('Error fetching child homework:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child homework',
      error: error.message
    });
  }
};

/**
 * GET /api/parent-students/:studentId/bookings
 * Returns booking requests for an active child.
 */
export const getChildBookings = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const { studentId } = req.params;

    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required'
      });
    }

    const scope = await getStudentAuthorizedScope(studentId);
    if (scope.myStudentIds.length === 0) {
      return res.json({ success: true, count: 0, bookings: [] });
    }

    const bookings = await StudentLessonBooking.find({
      studentId: { $in: scope.myStudentIds }
    })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'fullName profileImage email')
      .lean();

    const formatted = bookings.map((b) => ({
      id: String(b._id),
      teacherId: String(b.teacherId?._id || b.teacherId),
      teacherName: b.teacherId?.fullName || 'Teacher',
      teacherAvatar: b.teacherId?.profileImage || null,
      subject: b.subject,
      date: b.date ? new Date(b.date).toISOString().split('T')[0] : null,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      studentNote: b.studentNote || '',
      teacherResponseNote: b.teacherResponseNote || '',
      rejectionReason: b.rejectionReason || '',
      createdAt: b.createdAt
    }));

    return res.json({
      success: true,
      count: formatted.length,
      bookings: formatted
    });
  } catch (error) {
    console.error('Error fetching child bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch child bookings',
      error: error.message
    });
  }
};

/**
 * POST /api/parent-students/:studentId/bookings
 * Parent initiates a booking request for an active child.
 */
export const createChildBooking = async (req, res) => {
  try {
    const parentUserId = req.userId;
    const userRole = req.userRole;
    const { studentId } = req.params;
    const body = req.body || {};

    if (!ALLOWED_PARENT_ROLES.has(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only WORKER or EMPLOYER accounts can book lessons for linked children'
      });
    }

    // 1. Authorize parent-child relationship
    const relationship = await requireActiveParentStudentRelationship(parentUserId, studentId);
    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'Active parent-student relationship required to book a lesson for this child'
      });
    }

    const teacherId = body.teacherId;
    if (!teacherId || !isValidObjectId(String(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid teacherId is required'
      });
    }

    // 2. Validate teacher
    const teacherUser = await User.findById(teacherId).select('_id role isSuspended');
    if (!teacherUser || teacherUser.role !== 'TEACHER' || teacherUser.isSuspended) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found or unavailable'
      });
    }

    // 3. Validate child has ACTIVE TeacherStudent relationship with this teacher
    const teacherStudentRel = await TeacherStudent.findOne({
      teacherId,
      $or: [{ linkedUserId: studentId }, { studentUserId: studentId }],
      isActive: true,
      relationshipStatus: 'ACTIVE'
    });

    if (!teacherStudentRel) {
      return res.status(403).json({
        success: false,
        message: 'Child must have an active teacher relationship with this teacher to book'
      });
    }

    const subject = cleanString(body.subject, 100);
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    if (!body.date) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required'
      });
    }

    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date'
      });
    }

    const startTime = cleanString(body.startTime, 10);
    const endTime = cleanString(body.endTime, 10);

    const timeValidation = validateTimeRange(startTime, endTime);
    if (!timeValidation.ok) {
      return res.status(400).json({
        success: false,
        message: timeValidation.message
      });
    }

    // 4. Check teacher schedule conflicts
    const conflictResult = await checkTeacherScheduleConflict({
      teacherId,
      date: parsedDate,
      startTime,
      endTime
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested time slot conflicts with the teacher\'s schedule or another confirmed booking',
        conflictReason: conflictResult.reason
      });
    }

    // 5. Check duplicate pending booking
    const duplicate = await StudentLessonBooking.findOne({
      studentId: teacherStudentRel._id,
      teacherId,
      date: parsedDate,
      startTime,
      endTime,
      status: 'PENDING'
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'A pending booking request for this exact slot already exists'
      });
    }

    const studentNote = cleanString(body.studentNote || body.note, 500);

    // 6. Create booking record explicitly associated with the child
    const newBooking = await StudentLessonBooking.create({
      studentId: teacherStudentRel._id,
      teacherId,
      teacherStudentId: teacherStudentRel._id,
      subject,
      date: parsedDate,
      startTime,
      endTime,
      lessonType: 'ONE_ON_ONE',
      studentNote: studentNote ? `[Booked by Parent]: ${studentNote}` : '[Booked by Parent]',
      status: 'PENDING'
    });

    // Notify teacher
    try {
      const parentUser = await User.findById(parentUserId).select('fullName');
      createNotification(String(teacherId), {
        type: NOTIFICATION_TYPES.BOOKING,
        title: 'New Lesson Booking Request',
        message: `${parentUser?.fullName || 'Parent'} requested a lesson booking for student.`,
        link: '/teacher/lessons'
      }).catch(() => {});
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Lesson booking request submitted successfully on behalf of child',
      booking: {
        id: String(newBooking._id),
        studentId: String(teacherStudentRel._id),
        teacherId: String(teacherId),
        subject: newBooking.subject,
        date: newBooking.date.toISOString().split('T')[0],
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        status: newBooking.status,
        createdAt: newBooking.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating child booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create lesson booking for child',
      error: error.message
    });
  }
};

export default {
  getParentChildren,
  requestChildLink,
  getStudentIncomingRequests,
  acceptParentRequest,
  rejectParentRequest,
  cancelParentRequest,
  endParentStudentRelationship,
  getChildOverview,
  getChildTeachers,
  getChildLessons,
  getChildProgress,
  getChildHomework,
  getChildBookings,
  createChildBooking
};
