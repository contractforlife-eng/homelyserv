// backend/src/controllers/studentDashboardController.js
// ============================================================
// STUDENT DASHBOARD CONTROLLER
// Provides lightweight live operational summary for authenticated students:
// - Next upcoming lesson (ONE_ON_ONE or GROUP)
// - Pending booking requests count
// - Active connected teachers count and preview
// - Academic stats snapshot (attendance rate, homework completion, average grade)
//
// STRICT TENANCY RULES:
// 1. Scoped strictly through `req.userId` (requireStudent).
// 2. Uses authorized relationship IDs matching linkedUserId or studentUserId.
// 3. Excludes CANCELLED and NO_SHOW lessons.
// 4. Never exposes private teacher notes, payment data, or other students' attendance.
// ============================================================
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherAssessment from '../models/TeacherAssessment.js';
import TeacherProfile from '../models/TeacherProfile.js';
import User from '../models/User.js';

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
      authorizedTeacherIds: [],
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
 * GET /api/students/dashboard/summary
 * Returns lightweight operational summary for the student dashboard.
 */
export const getStudentDashboardSummary = async (req, res) => {
  try {
    const studentUserId = req.userId;

    const {
      myStudentIds,
      myStudentIdSet,
      myGroupIds,
      authorizedTeacherIds
    } = await getStudentAuthorizedScope(studentUserId);

    // 1. Count pending bookings for this student user
    const pendingBookingsCount = await StudentLessonBooking.countDocuments({
      studentId: studentUserId,
      status: 'PENDING'
    });

    // 2. Active connected teachers count & preview
    const activeTeachersCount = authorizedTeacherIds.length;
    let activeTeachers = [];

    if (activeTeachersCount > 0) {
      const previewTeacherIds = authorizedTeacherIds.slice(0, 4);
      const [teacherUsers, teacherProfiles] = await Promise.all([
        User.find({ _id: { $in: previewTeacherIds } })
          .select('_id fullName profileImage')
          .lean(),
        TeacherProfile.find({ userId: { $in: previewTeacherIds } })
          .select('userId title mainSubject')
          .lean()
      ]);

      const profileMap = new Map(teacherProfiles.map((p) => [String(p.userId), p]));
      activeTeachers = teacherUsers.map((u) => {
        const p = profileMap.get(String(u._id));
        return {
          id: String(u._id),
          name: u.fullName || 'Teacher',
          avatar: u.profileImage || null,
          title: p?.title || '',
          mainSubject: p?.mainSubject || ''
        };
      });
    }

    // 3. Find Next Upcoming Lesson
    // Conditions: Active, not CANCELLED or NO_SHOW, date >= start of today (UTC/local boundary friendly)
    let nextLesson = null;
    if (myStudentIds.length > 0 || myGroupIds.length > 0) {
      const orConditions = [];
      if (myStudentIds.length > 0) {
        orConditions.push({ lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } });
      }
      if (myGroupIds.length > 0) {
        orConditions.push({ lessonType: 'GROUP', groupId: { $in: myGroupIds } });
      }

      const now = new Date();
      // Look from beginning of today (UTC) to capture today's upcoming lessons
      const startOfToday = new Date(now);
      startOfToday.setUTCHours(0, 0, 0, 0);

      const candidateLessons = await TeacherLesson.find({
        isActive: true,
        $or: orConditions,
        lessonStatus: { $in: ['SCHEDULED'] },
        date: { $gte: startOfToday }
      })
        .sort({ date: 1, startTime: 1 })
        .limit(10)
        .populate('groupId', 'name subject color')
        .lean();

      // Find the first candidate whose date/time is in the future
      const todayDateStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      for (const cand of candidateLessons) {
        const candDateStr = cand.date ? new Date(cand.date).toISOString().split('T')[0] : '';
        if (candDateStr > todayDateStr) {
          nextLesson = cand;
          break;
        } else if (candDateStr === todayDateStr) {
          // If today, compare endTime or startTime against current time
          const endOrStartTime = cand.endTime || cand.startTime || '23:59';
          if (endOrStartTime >= currentTimeStr) {
            nextLesson = cand;
            break;
          }
        }
      }

      // If all candidate lessons today already ended, pick the first upcoming day's lesson if exists
      if (!nextLesson && candidateLessons.length > 0) {
        for (const cand of candidateLessons) {
          const candDateStr = cand.date ? new Date(cand.date).toISOString().split('T')[0] : '';
          if (candDateStr > todayDateStr) {
            nextLesson = cand;
            break;
          }
        }
      }
    }

    // Format nextLesson if found
    let nextLessonDto = null;
    if (nextLesson) {
      const teacherUser = await User.findById(nextLesson.teacherId)
        .select('_id fullName profileImage')
        .lean();

      let studentAttendance = null;
      if (Array.isArray(nextLesson.attendance)) {
        const match = nextLesson.attendance.find((a) =>
          myStudentIdSet.has(String(a.studentId?._id || a.studentId))
        );
        if (match) {
          studentAttendance = {
            status: match.status || 'NOT_RECORDED',
            note: match.note || ''
          };
        }
      }

      nextLessonDto = {
        id: String(nextLesson._id),
        lessonType: nextLesson.lessonType,
        subject: nextLesson.subject || '',
        date: nextLesson.date ? new Date(nextLesson.date).toISOString().split('T')[0] : null,
        startTime: nextLesson.startTime || '',
        endTime: nextLesson.endTime || '',
        lessonStatus: nextLesson.lessonStatus,
        teacher: {
          id: String(nextLesson.teacherId),
          name: teacherUser?.fullName || 'Teacher',
          avatar: teacherUser?.profileImage || null
        },
        group: nextLesson.groupId && typeof nextLesson.groupId === 'object'
          ? {
              id: String(nextLesson.groupId._id),
              name: nextLesson.groupId.name || '',
              subject: nextLesson.groupId.subject || '',
              color: nextLesson.groupId.color || '#DC2626'
            }
          : null,
        attendance: studentAttendance,
        homework: nextLesson.homework
          ? {
              title: nextLesson.homework.title || '',
              description: nextLesson.homework.description || '',
              dueDate: nextLesson.homework.dueDate ? new Date(nextLesson.homework.dueDate).toISOString().split('T')[0] : null,
              isCompleted: Boolean(nextLesson.homework.isCompleted)
            }
          : null
      };
    }

    // 4. Academic Snapshot Stats (Attendance, Homework, Average Grade)
    let averagePercentage = null;
    let attendancePercentage = null;
    let homeworkPercentage = null;

    if (myStudentIds.length > 0) {
      const [assessments, lessons] = await Promise.all([
        TeacherAssessment.find({
          studentId: { $in: myStudentIds },
          isActive: true
        }).select('percentage').lean(),
        TeacherLesson.find({
          isActive: true,
          $or: [
            { lessonType: 'ONE_ON_ONE', studentId: { $in: myStudentIds } },
            ...(myGroupIds.length > 0 ? [{ lessonType: 'GROUP', groupId: { $in: myGroupIds } }] : [])
          ]
        }).select('lessonType studentId attendance homework').lean()
      ]);

      // Assessment average
      if (assessments.length > 0) {
        const sum = assessments.reduce((acc, a) => acc + (Number(a.percentage) || 0), 0);
        averagePercentage = Math.round((sum / assessments.length) * 10) / 10;
      }

      // Attendance rate
      let presentCount = 0;
      let evaluatedCount = 0;
      lessons.forEach((l) => {
        let record = null;
        if (Array.isArray(l.attendance) && l.attendance.length > 0) {
          record = l.attendance.find((a) =>
            myStudentIdSet.has(String(a.studentId?._id || a.studentId))
          );
        }
        if (record) {
          if (['PRESENT', 'ABSENT', 'EXCUSED'].includes(record.status)) {
            evaluatedCount++;
            if (record.status === 'PRESENT') presentCount++;
          }
        }
      });
      if (evaluatedCount > 0) {
        attendancePercentage = Math.round((presentCount / evaluatedCount) * 100 * 10) / 10;
      }

      // Homework rate
      let totalHwAssigned = 0;
      let totalHwCompleted = 0;
      lessons.forEach((l) => {
        const hw = l.homework;
        if (hw && (hw.title?.trim() || hw.description?.trim())) {
          totalHwAssigned++;
          if (hw.isCompleted) totalHwCompleted++;
        }
      });
      if (totalHwAssigned > 0) {
        homeworkPercentage = Math.round((totalHwCompleted / totalHwAssigned) * 100 * 10) / 10;
      }
    }

    return res.json({
      success: true,
      data: {
        nextLesson: nextLessonDto,
        pendingBookingsCount,
        activeTeachersCount,
        activeTeachers,
        stats: {
          attendancePercentage,
          homeworkPercentage,
          averagePercentage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student dashboard summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching student dashboard summary',
      error: error.message
    });
  }
};

export default {
  getStudentDashboardSummary
};
