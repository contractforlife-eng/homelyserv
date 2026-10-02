// backend/src/controllers/studentProgressController.js
// ============================================================
// STUDENT PROGRESS CONTROLLER (READ-ONLY)
// Source of truth: TeacherAssessment & TeacherLesson collections.
//
// STRICT AUTHORIZATION RULES:
// 1. Identity is derived strictly from `req.userId` (Student User).
// 2. Fetch all authorized TeacherStudent IDs matching:
//      {
//        $or: [{ linkedUserId: req.userId }, { studentUserId: req.userId }],
//        isActive: true,
//        relationshipStatus: 'ACTIVE'
//      }
// 3. Fetch active TeacherGroupEnrollments:
//      {
//        studentId: { $in: myStudentIds },
//        status: 'ACTIVE',
//        isActive: true
//      }
// 4. Assessments are strictly restricted to:
//      studentId: { $in: myStudentIds }, isActive: true
// 5. Lessons are strictly restricted to:
//      {
//        isActive: true,
//        $or: [
//          { lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } },
//          { lessonType: 'GROUP', groupId: { $in: myGroupIds } }
//        ]
//      }
// 6. Security/Privacy:
//    - DO NOT expose TeacherAssessment.notes (private teacher notes). Expose feedback only.
//    - Expose ONLY the student's individual attendance record.
//    - Group homework completion is clearly separated as lesson-level homework.
// ============================================================
import TeacherAssessment, { TEACHER_ASSESSMENT_TYPES } from '../models/TeacherAssessment.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import User from '../models/User.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Builds safe DTO for a student-facing assessment.
 */
export const toStudentAssessmentDto = (doc, teacherUserMap = new Map()) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const tId = String(d.teacherId?._id || d.teacherId);
  const teacherUser = teacherUserMap.get(tId);

  return {
    id: String(d._id),
    teacher: {
      id: tId,
      name: teacherUser?.fullName || 'Teacher',
      avatar: teacherUser?.profileImage || null
    },
    title: d.title || '',
    subject: d.subject || '',
    assessmentType: d.assessmentType || 'QUIZ',
    score: Number(d.score),
    maxScore: Number(d.maxScore),
    percentage: Number(d.percentage),
    grade: d.grade || '',
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : null,
    feedback: d.feedback || ''
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
 * GET /api/students/progress/overview
 * Returns aggregated overview: assessment averages, attendance rate, homework rate,
 * performance trend data, and recent activity.
 */
export const getStudentProgressOverview = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { myStudentIds, myStudentIdSet, myGroupIds } =
      await getStudentAuthorizedScope(studentUserId);

    if (myStudentIds.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalAssessments: 0,
          averagePercentage: null,
          highestPercentage: null,
          lowestPercentage: null,
          attendancePercentage: null,
          attendanceStats: { present: 0, absent: 0, excused: 0, notRecorded: 0 },
          homeworkPercentage: null,
          homeworkStats: {
            assigned: 0,
            completed: 0,
            groupAssigned: 0,
            groupCompleted: 0
          }
        },
        trend: [],
        recentAssessments: [],
        recentLessons: []
      });
    }

    // 1. Fetch Assessments
    const assessments = await TeacherAssessment.find({
      studentId: { $in: myStudentIds },
      isActive: true
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const totalAssessments = assessments.length;
    let averagePercentage = null;
    let highestPercentage = null;
    let lowestPercentage = null;

    if (totalAssessments > 0) {
      const pcts = assessments.map((a) => Number(a.percentage) || 0);
      const sum = pcts.reduce((acc, val) => acc + val, 0);
      averagePercentage = Math.round((sum / totalAssessments) * 10) / 10;
      highestPercentage = Math.max(...pcts);
      lowestPercentage = Math.min(...pcts);
    }

    // Build Chronological Performance Trend (group by YYYY-MM-DD)
    const trendMap = new Map();
    assessments.forEach((a) => {
      const dateKey = a.date ? new Date(a.date).toISOString().split('T')[0] : 'Unknown';
      const existing = trendMap.get(dateKey) || [];
      existing.push(Number(a.percentage) || 0);
      trendMap.set(dateKey, existing);
    });

    const trend = Array.from(trendMap.entries()).map(([date, values]) => {
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      return {
        date,
        percentage: Math.round(avg * 10) / 10,
        count: values.length
      };
    });

    // 2. Fetch Lessons for Attendance & Homework
    const orConditions = [
      { lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } }
    ];
    if (myGroupIds.length > 0) {
      orConditions.push({ lessonType: 'GROUP', groupId: { $in: myGroupIds } });
    }

    const lessons = await TeacherLesson.find({
      isActive: true,
      $or: orConditions
    })
      .sort({ date: -1, startTime: -1 })
      .lean();

    // Attendance stats
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let notRecordedCount = 0;

    lessons.forEach((lesson) => {
      let record = null;
      if (Array.isArray(lesson.attendance) && lesson.attendance.length > 0) {
        record = lesson.attendance.find((a) =>
          myStudentIdSet.has(String(a.studentId?._id || a.studentId))
        );
      }

      if (record) {
        if (record.status === 'PRESENT') presentCount++;
        else if (record.status === 'ABSENT') absentCount++;
        else if (record.status === 'EXCUSED') excusedCount++;
        else if (record.status === 'NOT_RECORDED') notRecordedCount++;
      } else if (lesson.lessonType === 'ONE_ON_ONE' && myStudentIdSet.has(String(lesson.studentId))) {
        notRecordedCount++;
      }
    });

    const totalEvaluatedAttendance = presentCount + absentCount + excusedCount;
    const attendancePercentage =
      totalEvaluatedAttendance > 0
        ? Math.round((presentCount / totalEvaluatedAttendance) * 100 * 10) / 10
        : null;

    // Homework stats (isolated 1-on-1 vs lesson-level group homework)
    let oneOnOneAssigned = 0;
    let oneOnOneCompleted = 0;
    let groupAssigned = 0;
    let groupCompleted = 0;

    lessons.forEach((lesson) => {
      const hw = lesson.homework;
      const hasHw = hw && (hw.title?.trim() || hw.description?.trim());

      if (hasHw) {
        if (lesson.lessonType === 'ONE_ON_ONE') {
          oneOnOneAssigned++;
          if (hw.isCompleted) oneOnOneCompleted++;
        } else if (lesson.lessonType === 'GROUP') {
          groupAssigned++;
          if (hw.isCompleted) groupCompleted++;
        }
      }
    });

    const totalHwAssigned = oneOnOneAssigned + groupAssigned;
    const totalHwCompleted = oneOnOneCompleted + groupCompleted;
    const homeworkPercentage =
      totalHwAssigned > 0
        ? Math.round((totalHwCompleted / totalHwAssigned) * 100 * 10) / 10
        : null;

    // Batch fetch teacher users for recent items
    const teacherIds = [
      ...new Set([
        ...assessments.map((a) => String(a.teacherId)),
        ...lessons.map((l) => String(l.teacherId))
      ])
    ];

    const teacherUsers = await User.find({ _id: { $in: teacherIds } })
      .select('_id fullName profileImage')
      .lean();
    const teacherUserMap = new Map(teacherUsers.map((u) => [String(u._id), u]));

    // Recent assessments (5 newest)
    const recentAssessments = assessments
      .slice()
      .reverse()
      .slice(0, 5)
      .map((a) => toStudentAssessmentDto(a, teacherUserMap));

    // Recent lessons (5 newest) with sanitized attendance & homework
    const recentLessons = lessons.slice(0, 5).map((l) => {
      const tId = String(l.teacherId);
      const teacherUser = teacherUserMap.get(tId);

      let studentAttendance = null;
      if (Array.isArray(l.attendance)) {
        const match = l.attendance.find((a) =>
          myStudentIdSet.has(String(a.studentId?._id || a.studentId))
        );
        if (match) {
          studentAttendance = {
            status: match.status || 'NOT_RECORDED',
            note: match.note || ''
          };
        }
      }

      return {
        id: String(l._id),
        lessonType: l.lessonType,
        subject: l.subject,
        date: l.date ? new Date(l.date).toISOString().split('T')[0] : null,
        startTime: l.startTime,
        endTime: l.endTime,
        lessonStatus: l.lessonStatus,
        teacher: {
          id: tId,
          name: teacherUser?.fullName || 'Teacher',
          avatar: teacherUser?.profileImage || null
        },
        attendance: studentAttendance,
        homework: l.homework
          ? {
              title: l.homework.title || '',
              description: l.homework.description || '',
              dueDate: l.homework.dueDate ? new Date(l.homework.dueDate).toISOString() : null,
              isCompleted: Boolean(l.homework.isCompleted)
            }
          : null
      };
    });

    return res.json({
      success: true,
      summary: {
        totalAssessments,
        averagePercentage,
        highestPercentage,
        lowestPercentage,
        attendancePercentage,
        attendanceStats: {
          present: presentCount,
          absent: absentCount,
          excused: excusedCount,
          notRecorded: notRecordedCount
        },
        homeworkPercentage,
        homeworkStats: {
          assigned: oneOnOneAssigned,
          completed: oneOnOneCompleted,
          groupAssigned,
          groupCompleted
        }
      },
      trend,
      recentAssessments,
      recentLessons
    });
  } catch (error) {
    console.error('Error fetching student progress overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching progress overview',
      error: error.message
    });
  }
};

/**
 * GET /api/students/progress/assessments
 * List assessments authorized for authenticated student with optional filters.
 */
export const getStudentAssessments = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { myStudentIds, authorizedTeacherIds } =
      await getStudentAuthorizedScope(studentUserId);

    if (myStudentIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        assessments: []
      });
    }

    const { teacherId, subject, assessmentType, startDate, endDate } = req.query || {};

    const query = {
      studentId: { $in: myStudentIds },
      isActive: true
    };

    // Teacher filter (must be within authorizedTeacherIds)
    if (teacherId && typeof teacherId === 'string') {
      if (!authorizedTeacherIds.includes(teacherId)) {
        return res.json({ success: true, count: 0, assessments: [] });
      }
      query.teacherId = teacherId;
    }

    // Subject filter
    if (subject && typeof subject === 'string' && subject.trim()) {
      query.subject = { $regex: cleanString(subject, 100), $options: 'i' };
    }

    // Assessment type filter
    if (assessmentType && TEACHER_ASSESSMENT_TYPES.includes(assessmentType.toUpperCase())) {
      query.assessmentType = assessmentType.toUpperCase();
    }

    // Date filters
    if (startDate || endDate) {
      query.date = {};
      if (startDate && !Number.isNaN(new Date(startDate).getTime())) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate && !Number.isNaN(new Date(endDate).getTime())) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
      if (Object.keys(query.date).length === 0) {
        delete query.date;
      }
    }

    const assessments = await TeacherAssessment.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (!assessments || assessments.length === 0) {
      return res.json({
        success: true,
        count: 0,
        assessments: []
      });
    }

    // Batch fetch teacher users
    const teacherIds = [...new Set(assessments.map((a) => String(a.teacherId)))];
    const teacherUsers = await User.find({ _id: { $in: teacherIds } })
      .select('_id fullName profileImage')
      .lean();
    const teacherUserMap = new Map(teacherUsers.map((u) => [String(u._id), u]));

    const dtoList = assessments.map((a) => toStudentAssessmentDto(a, teacherUserMap));

    return res.json({
      success: true,
      count: dtoList.length,
      assessments: dtoList
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching assessments',
      error: error.message
    });
  }
};

/**
 * GET /api/students/progress/assessments/:id
 * Retrieve single assessment if owned by student's authorized relationship.
 * Returns 404 if unauthorized or not found.
 */
export const getStudentAssessmentById = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const { myStudentIds } = await getStudentAuthorizedScope(studentUserId);
    if (myStudentIds.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const assessment = await TeacherAssessment.findOne({
      _id: id,
      studentId: { $in: myStudentIds },
      isActive: true
    }).lean();

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const teacherUser = await User.findById(assessment.teacherId)
      .select('_id fullName profileImage')
      .lean();
    const teacherUserMap = new Map();
    if (teacherUser) teacherUserMap.set(String(teacherUser._id), teacherUser);

    return res.json({
      success: true,
      assessment: toStudentAssessmentDto(assessment, teacherUserMap)
    });
  } catch (error) {
    console.error('Error fetching student assessment by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching assessment details',
      error: error.message
    });
  }
};

export default {
  getStudentProgressOverview,
  getStudentAssessments,
  getStudentAssessmentById,
  toStudentAssessmentDto
};
