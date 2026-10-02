// backend/src/controllers/studentLessonController.js
// ============================================================
// STUDENT LESSON CONTROLLER (READ-ONLY)
// Single Source of Truth: TeacherLesson collection
//
// STRICT AUTHORIZATION RULES:
// 1. Identity is derived strictly from `req.userId` (Student User).
// 2. Fetch all authorized TeacherStudent IDs matching:
//      {
//        $or: [{ linkedUserId: req.userId }, { studentUserId: req.userId }],
//        isActive: true,
//        relationshipStatus: 'ACTIVE'
//      }
// 3. Fetch all active TeacherGroupEnrollments for those student IDs:
//      {
//        studentId: { $in: myStudentIds },
//        status: 'ACTIVE',
//        isActive: true
//      }
// 4. Lessons must match:
//      isActive: true,
//      $or: [
//        { lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } },
//        { lessonType: 'GROUP', groupId: { $in: myGroupIds } }
//      ]
// 5. If `teacherId` query is provided, verify it belongs to the student's
//    authorized relationships before filtering.
// 6. Security/Privacy:
//    - NEVER expose TeacherLesson.notes (private teacher notes).
//    - Expose ONLY the current student's attendance record (strip other students).
//    - Expose ONLY public teacher info (id, name, avatar).
// ============================================================
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import User from '../models/User.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Builds safe DTO for a student-facing lesson.
 */
export const toStudentLessonDto = (lessonDoc, myStudentIdSet, teacherUserMap = new Map(), groupMap = new Map()) => {
  if (!lessonDoc) return null;
  const d = typeof lessonDoc.toObject === 'function' ? lessonDoc.toObject() : lessonDoc;

  const tId = String(d.teacherId);
  const teacherUser = teacherUserMap.get(tId);

  // Group info if GROUP
  let groupInfo = null;
  if (d.lessonType === 'GROUP' && d.groupId) {
    const gId = String(d.groupId._id || d.groupId);
    const gDoc = groupMap.get(gId) || (typeof d.groupId === 'object' ? d.groupId : null);
    if (gDoc) {
      groupInfo = {
        id: gId,
        name: gDoc.name || '',
        subject: gDoc.subject || '',
        color: gDoc.color || '#DC2626'
      };
    }
  }

  // Find ONLY this student's attendance entry
  let studentAttendance = null;
  if (Array.isArray(d.attendance)) {
    const match = d.attendance.find((a) => {
      const aStudentId = String(a.studentId?._id || a.studentId);
      return myStudentIdSet.has(aStudentId);
    });
    if (match) {
      studentAttendance = {
        status: match.status || 'NOT_RECORDED',
        note: match.note || ''
      };
    }
  }

  // Homework projection
  const homework = d.homework
    ? {
        title: d.homework.title || '',
        description: d.homework.description || '',
        dueDate: d.homework.dueDate ? new Date(d.homework.dueDate).toISOString() : null,
        isCompleted: Boolean(d.homework.isCompleted)
      }
    : null;

  return {
    id: String(d._id),
    lessonType: d.lessonType,
    subject: d.subject || '',
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : null,
    startTime: d.startTime || '',
    endTime: d.endTime || '',
    lessonStatus: d.lessonStatus || 'SCHEDULED',
    teacher: {
      id: tId,
      name: teacherUser?.fullName || 'Teacher',
      avatar: teacherUser?.profileImage || null
    },
    group: groupInfo,
    homework,
    attendance: studentAttendance
  };
};

/**
 * Helper to fetch authenticated student's active relationship IDs and active group IDs.
 */
const getStudentAuthorizedScope = async (userId) => {
  const activeRelationships = await TeacherStudent.find({
    $or: [{ linkedUserId: userId }, { studentUserId: userId }],
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
      authorizedTeacherIds: []
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
    authorizedTeacherIds
  };
};

/**
 * GET /api/students/lessons
 * Read-only list of lessons authorized for the authenticated student.
 */
export const getStudentLessons = async (req, res) => {
  try {
    const studentUserId = req.userId;

    const { myStudentIds, myStudentIdSet, myGroupIds, authorizedTeacherIds } =
      await getStudentAuthorizedScope(studentUserId);

    if (myStudentIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        lessons: []
      });
    }

    const { startDate, endDate, status, lessonType, teacherId } = req.query || {};

    // Base authorization filter: ONE_ON_ONE for student, or GROUP for enrolled groups
    const orConditions = [];
    if (myStudentIds.length > 0) {
      orConditions.push({ lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } });
    }
    if (myGroupIds.length > 0) {
      orConditions.push({ lessonType: 'GROUP', groupId: { $in: myGroupIds } });
    }

    if (orConditions.length === 0) {
      return res.json({
        success: true,
        count: 0,
        lessons: []
      });
    }

    const filter = {
      isActive: true,
      $or: orConditions
    };

    // Teacher filter (must be within authorizedTeacherIds)
    if (teacherId && typeof teacherId === 'string') {
      if (!authorizedTeacherIds.includes(teacherId)) {
        // Teacher not authorized for this student; return empty list safely
        return res.json({
          success: true,
          count: 0,
          lessons: []
        });
      }
      filter.teacherId = teacherId;
    }

    // Status filter
    if (status && ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status.toUpperCase())) {
      filter.lessonStatus = status.toUpperCase();
    }

    // Lesson type filter
    if (lessonType && ['ONE_ON_ONE', 'GROUP'].includes(lessonType.toUpperCase())) {
      filter.lessonType = lessonType.toUpperCase();
    }

    // Date filters (inclusive date matching)
    if (startDate || endDate) {
      filter.date = {};
      if (startDate && !Number.isNaN(new Date(startDate).getTime())) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate && !Number.isNaN(new Date(endDate).getTime())) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
      if (Object.keys(filter.date).length === 0) {
        delete filter.date;
      }
    }

    const lessons = await TeacherLesson.find(filter)
      .sort({ date: -1, startTime: -1 })
      .populate('groupId', 'name subject color');

    if (!lessons || lessons.length === 0) {
      return res.json({
        success: true,
        count: 0,
        lessons: []
      });
    }

    // Batch fetch teacher user data
    const teacherIds = [...new Set(lessons.map((l) => String(l.teacherId)))];
    const teacherUsers = await User.find({ _id: { $in: teacherIds } })
      .select('_id fullName profileImage');
    const teacherUserMap = new Map(teacherUsers.map((u) => [String(u._id), u]));

    // Batch map groups if populated
    const groupMap = new Map();
    lessons.forEach((l) => {
      if (l.groupId && typeof l.groupId === 'object') {
        groupMap.set(String(l.groupId._id), l.groupId);
      }
    });

    const dtoList = lessons.map((l) =>
      toStudentLessonDto(l, myStudentIdSet, teacherUserMap, groupMap)
    );

    return res.json({
      success: true,
      count: dtoList.length,
      lessons: dtoList
    });
  } catch (error) {
    console.error('Error fetching student lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching student lessons',
      error: error.message
    });
  }
};

/**
 * GET /api/students/lessons/:id
 * Read-only details of a single lesson owned by the student's authorized relationship.
 * Returns 404 if not found or unauthorized.
 */
export const getStudentLessonById = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const { myStudentIds, myStudentIdSet, myGroupIds } =
      await getStudentAuthorizedScope(studentUserId);

    if (myStudentIds.length === 0) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const orConditions = [];
    if (myStudentIds.length > 0) {
      orConditions.push({ lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } });
    }
    if (myGroupIds.length > 0) {
      orConditions.push({ lessonType: 'GROUP', groupId: { $in: myGroupIds } });
    }

    if (orConditions.length === 0) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = await TeacherLesson.findOne({
      _id: id,
      isActive: true,
      $or: orConditions
    }).populate('groupId', 'name subject color');

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const teacherUser = await User.findById(lesson.teacherId).select('_id fullName profileImage');
    const teacherUserMap = new Map();
    if (teacherUser) teacherUserMap.set(String(teacherUser._id), teacherUser);

    const groupMap = new Map();
    if (lesson.groupId && typeof lesson.groupId === 'object') {
      groupMap.set(String(lesson.groupId._id), lesson.groupId);
    }

    return res.json({
      success: true,
      lesson: toStudentLessonDto(lesson, myStudentIdSet, teacherUserMap, groupMap)
    });
  } catch (error) {
    console.error('Error fetching student lesson details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching lesson details',
      error: error.message
    });
  }
};

export default {
  getStudentLessons,
  getStudentLessonById,
  toStudentLessonDto
};
