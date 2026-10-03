// backend/src/controllers/teacherLessonController.js
// ============================================================
// TEACHER LESSONS CONTROLLER
//
// Strictly tenancy-isolated CRUD for Teacher-owned lessons and attendance.
//
// TENANCY & SECURITY RULES:
// 1. Scoped strictly through `teacherId: req.userId`.
// 2. Access to another teacher's lesson returns 404.
// 3. For ONE_ON_ONE: studentId MUST exist, belong to teacher, and be active.
// 4. For GROUP: groupId MUST exist, belong to teacher, and be active.
// 5. Attendance: For ONE_ON_ONE, applies only to lesson student.
//    For GROUP, every student with attendance MUST be actively enrolled in the group.
// 6. Time validation: endTime must be after startTime.
// 7. No payment, schedule engine, or duplicate student/group creation.
// ============================================================
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates HH:mm time format and ensures endTime > startTime.
 */
const validateTimes = (startTime, endTime) => {
  if (!startTime || !TIME_REGEX.test(startTime)) {
    return { ok: false, message: 'Start time must be in HH:mm format (e.g. 14:00)' };
  }
  if (!endTime || !TIME_REGEX.test(endTime)) {
    return { ok: false, message: 'End time must be in HH:mm format (e.g. 15:30)' };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return { ok: false, message: 'End time must be after start time' };
  }

  return { ok: true, startMinutes, endMinutes };
};

/**
 * Transforms a TeacherLesson document to clean DTO.
 */
export const toTeacherLessonDto = (doc, groupStudentCount = 0) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const studentObj = d.studentId && typeof d.studentId === 'object' ? d.studentId : null;
  const groupObj = d.groupId && typeof d.groupId === 'object' ? d.groupId : null;

  const isHomelyStudent = Boolean(studentObj?.linkedUserId);

  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    lessonType: d.lessonType,
    subject: d.subject || '',
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : null,
    startTime: d.startTime || '',
    endTime: d.endTime || '',
    lessonStatus: d.lessonStatus || 'SCHEDULED',
    studentId: studentObj ? String(studentObj._id) : (d.studentId ? String(d.studentId) : null),
    student: studentObj
      ? {
          id: String(studentObj._id),
          fullName: studentObj.fullName || '',
          email: studentObj.email || '',
          phone: studentObj.phone || '',
          gradeLevel: studentObj.gradeLevel || '',
          school: studentObj.school || '',
          isHomelyStudent,
          linkedUserId: studentObj.linkedUserId ? String(studentObj.linkedUserId) : null
        }
      : null,
    groupId: groupObj ? String(groupObj._id) : (d.groupId ? String(d.groupId) : null),
    group: groupObj
      ? {
          id: String(groupObj._id),
          name: groupObj.name || '',
          subject: groupObj.subject || '',
          gradeLevel: groupObj.gradeLevel || '',
          academicYear: groupObj.academicYear || '',
          color: groupObj.color || '#DC2626',
          studentCount: groupStudentCount
        }
      : null,
    groupStudentCount: typeof groupStudentCount === 'number' ? groupStudentCount : 0,
    attendance: Array.isArray(d.attendance)
      ? d.attendance.map((a) => {
          const aStudentObj = a.studentId && typeof a.studentId === 'object' ? a.studentId : null;
          return {
            studentId: aStudentObj ? String(aStudentObj._id) : String(a.studentId),
            studentName: aStudentObj ? aStudentObj.fullName : '',
            isHomelyStudent: Boolean(aStudentObj?.linkedUserId),
            status: a.status || 'NOT_RECORDED',
            note: a.note || ''
          };
        })
      : [],
    notes: d.notes || '',
    homework: d.homework
      ? {
          title: d.homework.title || '',
          description: d.homework.description || '',
          dueDate: d.homework.dueDate ? new Date(d.homework.dueDate).toISOString().split('T')[0] : null,
          isCompleted: Boolean(d.homework.isCompleted),
          studentNote: d.homework.studentNote || '',
          studentCompletedAt: d.homework.studentCompletedAt ? new Date(d.homework.studentCompletedAt).toISOString() : null
        }
      : null,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

/**
 * GET /api/teachers/lessons
 * List authenticated teacher's lessons with filtering.
 */
export const getTeacherLessons = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { date, startDate, endDate, status, lessonType, groupId, studentId, search } = req.query || {};

    const filter = { teacherId, isActive: true };

    if (status && ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status.toUpperCase())) {
      filter.lessonStatus = status.toUpperCase();
    }

    if (lessonType && ['ONE_ON_ONE', 'GROUP'].includes(lessonType.toUpperCase())) {
      filter.lessonType = lessonType.toUpperCase();
    }

    if (groupId && isValidObjectId(String(groupId))) {
      filter.groupId = groupId;
    }

    if (studentId && isValidObjectId(String(studentId))) {
      filter.studentId = studentId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          start.setUTCHours(0, 0, 0, 0);
          filter.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }
      // If neither date was valid, delete empty filter.date
      if (Object.keys(filter.date).length === 0) {
        delete filter.date;
      }
    } else if (date) {
      const parsedDate = new Date(date);
      if (!Number.isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const safeRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.subject = safeRegex;
    }

    const lessons = await TeacherLesson.find(filter)
      .sort({ date: -1, startTime: -1 })
      .populate('studentId', 'fullName email phone gradeLevel school linkedUserId')
      .populate('groupId', 'name subject gradeLevel academicYear color')
      .populate('attendance.studentId', 'fullName linkedUserId');

    // Aggregate active enrollment counts for referenced groups
    const groupIds = [
      ...new Set(
        lessons
          .filter((l) => l.groupId)
          .map((l) => String(l.groupId._id || l.groupId))
      )
    ];

    let countsMap = {};
    if (groupIds.length > 0) {
      const counts = await TeacherGroupEnrollment.aggregate([
        {
          $match: {
            groupId: { $in: groupIds.map((id) => (isValidObjectId(id) ? new (TeacherLesson.base.Types.ObjectId)(id) : id)) },
            teacherId,
            isActive: true,
            status: 'ACTIVE'
          }
        },
        {
          $group: {
            _id: '$groupId',
            count: { $sum: 1 }
          }
        }
      ]);

      countsMap = counts.reduce((acc, curr) => {
        acc[String(curr._id)] = curr.count;
        return acc;
      }, {});
    }

    const dtoList = lessons.map((l) => {
      const gId = l.groupId ? String(l.groupId._id || l.groupId) : null;
      return toTeacherLessonDto(l, gId ? countsMap[gId] || 0 : 0);
    });

    return res.json({
      success: true,
      count: dtoList.length,
      lessons: dtoList
    });
  } catch (error) {
    console.error('Error fetching teacher lessons:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching lessons',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/lessons/:id
 * Get single lesson with details and student/group metadata.
 */
export const getTeacherLessonById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = await TeacherLesson.findOne({ _id: id, teacherId, isActive: true })
      .populate('studentId', 'fullName email phone gradeLevel school linkedUserId')
      .populate('groupId', 'name subject gradeLevel academicYear color description')
      .populate('attendance.studentId', 'fullName linkedUserId');

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    let groupStudents = [];
    let groupStudentCount = 0;

    if (lesson.lessonType === 'GROUP' && lesson.groupId) {
      const gId = lesson.groupId._id || lesson.groupId;
      const enrollments = await TeacherGroupEnrollment.find({
        groupId: gId,
        teacherId,
        isActive: true,
        status: 'ACTIVE'
      }).populate('studentId', 'fullName email phone gradeLevel linkedUserId');

      groupStudents = enrollments
        .filter((e) => e.studentId && e.studentId.isActive !== false)
        .map((e) => ({
          studentId: String(e.studentId._id),
          fullName: e.studentId.fullName,
          isHomelyStudent: Boolean(e.studentId.linkedUserId)
        }));
      groupStudentCount = groupStudents.length;
    }

    return res.json({
      success: true,
      lesson: toTeacherLessonDto(lesson, groupStudentCount),
      groupStudents
    });
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching lesson details',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/lessons
 * Create a new ONE_ON_ONE or GROUP lesson.
 */
export const createTeacherLesson = async (req, res) => {
  try {
    const teacherId = req.userId;
    const body = req.body || {};

    const lessonType = String(body.lessonType || '').toUpperCase();
    if (!['ONE_ON_ONE', 'GROUP'].includes(lessonType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lessonType. Must be ONE_ON_ONE or GROUP'
      });
    }

    const subject = cleanString(body.subject, 100);
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    if (!body.date) {
      return res.status(400).json({ success: false, message: 'Lesson date is required' });
    }

    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid lesson date' });
    }

    const timeValidation = validateTimes(body.startTime, body.endTime);
    if (!timeValidation.ok) {
      return res.status(400).json({ success: false, message: timeValidation.message });
    }

    let studentId = null;
    let groupId = null;
    let attendance = [];

    if (lessonType === 'ONE_ON_ONE') {
      if (!body.studentId || !isValidObjectId(String(body.studentId))) {
        return res.status(400).json({
          success: false,
          message: 'studentId is required for ONE_ON_ONE lesson'
        });
      }

      // Verify student belongs to this teacher and is active
      const student = await TeacherStudent.findOne({
        _id: body.studentId,
        teacherId,
        isActive: true
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found in your students list'
        });
      }

      studentId = student._id;

      // Default attendance for ONE_ON_ONE
      attendance = [
        {
          studentId: student._id,
          status: 'NOT_RECORDED',
          note: ''
        }
      ];
    } else {
      // GROUP lesson
      if (!body.groupId || !isValidObjectId(String(body.groupId))) {
        return res.status(400).json({
          success: false,
          message: 'groupId is required for GROUP lesson'
        });
      }

      // Verify group belongs to this teacher and is active
      const group = await TeacherGroup.findOne({
        _id: body.groupId,
        teacherId,
        isActive: true
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found in your groups list'
        });
      }

      groupId = group._id;

      // Initialize attendance for currently enrolled active students
      const enrollments = await TeacherGroupEnrollment.find({
        groupId: group._id,
        teacherId,
        isActive: true,
        status: 'ACTIVE'
      });

      attendance = enrollments.map((e) => ({
        studentId: e.studentId,
        status: 'NOT_RECORDED',
        note: ''
      }));
    }

    let homework = null;
    if (body.homework && typeof body.homework === 'object') {
      homework = {
        title: cleanString(body.homework.title, 200),
        description: cleanString(body.homework.description, 1000),
        dueDate: body.homework.dueDate ? new Date(body.homework.dueDate) : null,
        isCompleted: Boolean(body.homework.isCompleted)
      };
    }

    const lessonStatus = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(
      String(body.lessonStatus).toUpperCase()
    )
      ? String(body.lessonStatus).toUpperCase()
      : 'SCHEDULED';

    const lesson = await TeacherLesson.create({
      teacherId,
      lessonType,
      studentId,
      groupId,
      subject,
      date: parsedDate,
      startTime: body.startTime.trim(),
      endTime: body.endTime.trim(),
      lessonStatus,
      attendance,
      notes: cleanString(body.notes, 2000),
      homework,
      isActive: true
    });

    const populated = await TeacherLesson.findById(lesson._id)
      .populate('studentId', 'fullName email phone gradeLevel school linkedUserId')
      .populate('groupId', 'name subject gradeLevel academicYear color');

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson: toTeacherLessonDto(populated, attendance.length)
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating lesson',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/lessons/:id
 * Update teacher's own lesson details.
 */
export const updateTeacherLesson = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = await TeacherLesson.findOne({ _id: id, teacherId, isActive: true });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (body.subject !== undefined) {
      const s = cleanString(body.subject, 100);
      if (!s) return res.status(400).json({ success: false, message: 'Subject cannot be empty' });
      lesson.subject = s;
    }

    if (body.date !== undefined) {
      const parsedDate = new Date(body.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid lesson date' });
      }
      lesson.date = parsedDate;
    }

    const newStart = body.startTime !== undefined ? body.startTime : lesson.startTime;
    const newEnd = body.endTime !== undefined ? body.endTime : lesson.endTime;
    if (body.startTime !== undefined || body.endTime !== undefined) {
      const timeValidation = validateTimes(newStart, newEnd);
      if (!timeValidation.ok) {
        return res.status(400).json({ success: false, message: timeValidation.message });
      }
      lesson.startTime = newStart.trim();
      lesson.endTime = newEnd.trim();
    }

    if (body.lessonStatus !== undefined) {
      const st = String(body.lessonStatus).toUpperCase();
      if (['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(st)) {
        lesson.lessonStatus = st;
      }
    }

    if (body.notes !== undefined) {
      lesson.notes = cleanString(body.notes, 2000);
    }

    if (body.homework !== undefined) {
      if (body.homework === null) {
        lesson.homework = null;
      } else if (typeof body.homework === 'object') {
        lesson.homework = {
          title: cleanString(body.homework.title, 200),
          description: cleanString(body.homework.description, 1000),
          dueDate: body.homework.dueDate ? new Date(body.homework.dueDate) : null,
          isCompleted: Boolean(body.homework.isCompleted)
        };
      }
    }

    await lesson.save();

    const populated = await TeacherLesson.findById(lesson._id)
      .populate('studentId', 'fullName email phone gradeLevel school linkedUserId')
      .populate('groupId', 'name subject gradeLevel academicYear color');

    return res.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson: toTeacherLessonDto(populated, lesson.attendance?.length || 0)
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating lesson',
      error: error.message
    });
  }
};

/**
 * PUT /api/teachers/lessons/:id/attendance
 * Update attendance for a specific lesson.
 * Validates student ownership:
 *   - For ONE_ON_ONE, student must match lesson.studentId.
 *   - For GROUP, students must be actively enrolled in lesson.groupId.
 */
export const updateLessonAttendance = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const { attendance } = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = await TeacherLesson.findOne({ _id: id, teacherId, isActive: true });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (!Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance must be an array of student records'
      });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'EXCUSED', 'NOT_RECORDED'];

    if (lesson.lessonType === 'ONE_ON_ONE') {
      const entry = attendance[0];
      if (!entry || !entry.studentId) {
        return res.status(400).json({ success: false, message: 'Student attendance entry required' });
      }

      if (String(entry.studentId) !== String(lesson.studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Attendance student does not match the lesson student'
        });
      }

      const st = validStatuses.includes(String(entry.status).toUpperCase())
        ? String(entry.status).toUpperCase()
        : 'NOT_RECORDED';

      lesson.attendance = [
        {
          studentId: lesson.studentId,
          status: st,
          note: cleanString(entry.note, 500)
        }
      ];
    } else {
      // GROUP lesson
      // Fetch actively enrolled student IDs for this group
      const targetGroupId = lesson.groupId?._id || lesson.groupId;
      const enrollments = await TeacherGroupEnrollment.find({
        groupId: targetGroupId,
        teacherId,
        isActive: true,
        status: 'ACTIVE'
      });

      const enrolledStudentIds = new Set(
        enrollments.map((e) => {
          if (!e.studentId) return null;
          return String(e.studentId._id || e.studentId);
        }).filter(Boolean)
      );

      const sanitizedAttendance = [];
      for (const entry of attendance) {
        if (!entry || !entry.studentId) continue;
        const sId = String(entry.studentId);

        // Validate that this student is enrolled in the group
        if (!enrolledStudentIds.has(sId)) {
          return res.status(400).json({
            success: false,
            message: `Student with ID ${sId} is not enrolled in this group`
          });
        }

        const st = validStatuses.includes(String(entry.status).toUpperCase())
          ? String(entry.status).toUpperCase()
          : 'NOT_RECORDED';

        sanitizedAttendance.push({
          studentId: entry.studentId,
          status: st,
          note: cleanString(entry.note, 500)
        });
      }

      lesson.attendance = sanitizedAttendance;
    }

    await lesson.save();

    const populated = await TeacherLesson.findById(lesson._id)
      .populate('studentId', 'fullName email phone gradeLevel school linkedUserId')
      .populate('groupId', 'name subject gradeLevel academicYear color')
      .populate('attendance.studentId', 'fullName linkedUserId');

    return res.json({
      success: true,
      message: 'Attendance updated successfully',
      lesson: toTeacherLessonDto(populated, lesson.attendance.length)
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating attendance',
      error: error.message
    });
  }
};

/**
 * DELETE /api/teachers/lessons/:id
 * Soft-delete / cancel lesson.
 */
export const deleteTeacherLesson = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = await TeacherLesson.findOne({ _id: id, teacherId, isActive: true });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    lesson.isActive = false;
    lesson.lessonStatus = 'CANCELLED';
    await lesson.save();

    return res.json({
      success: true,
      message: 'Lesson cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling lesson',
      error: error.message
    });
  }
};
