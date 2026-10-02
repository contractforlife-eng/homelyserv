// backend/src/controllers/teacherProgressController.js
// ============================================================
// TEACHER PROGRESS CONTROLLER
// ============================================================
// Handles:
// - Assessments CRUD (strictly scoped by req.userId)
// - Student progress summary (Attendance, Homework, Assessments, Trend)
// - Teacher progress overview
//
// CONSTRAINTS & DATA INTEGRITY:
// - All operations strictly verify teacherId === req.userId
// - Students, groups, and lessons referenced must belong to req.userId
// - Attendance rate excludes 'NOT_RECORDED'
// - Group lesson homework is explicitly isolated from individual completion
// ============================================================
import mongoose from 'mongoose';
import TeacherAssessment, { TEACHER_ASSESSMENT_TYPES } from '../models/TeacherAssessment.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const toTeacherAssessmentDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    studentId: d.studentId?._id ? String(d.studentId._id) : String(d.studentId),
    studentName: d.studentId?.fullName || undefined,
    groupId: d.groupId?._id ? String(d.groupId._id) : (d.groupId ? String(d.groupId) : null),
    groupName: d.groupId?.name || undefined,
    lessonId: d.lessonId ? String(d.lessonId) : null,
    title: d.title || '',
    subject: d.subject || '',
    assessmentType: d.assessmentType || 'QUIZ',
    score: Number(d.score),
    maxScore: Number(d.maxScore),
    percentage: Number(d.percentage),
    grade: d.grade || '',
    date: d.date ? new Date(d.date).toISOString() : null,
    feedback: d.feedback || '',
    notes: d.notes || '',
    isActive: Boolean(d.isActive),
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null
  };
};

/**
 * GET /api/teachers/progress/assessments
 * List assessments belonging to authenticated teacher with optional filters.
 */
export const getTeacherAssessments = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { studentId, groupId, subject, assessmentType, from, to } = req.query;

    const query = {
      teacherId,
      isActive: true
    };

    if (studentId) {
      if (!isValidObjectId(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }
      query.studentId = studentId;
    }

    if (groupId) {
      if (!isValidObjectId(groupId)) {
        return res.status(400).json({ success: false, message: 'Invalid group ID' });
      }
      query.groupId = groupId;
    }

    if (subject && typeof subject === 'string' && subject.trim()) {
      query.subject = { $regex: cleanString(subject, 100), $options: 'i' };
    }

    if (assessmentType && TEACHER_ASSESSMENT_TYPES.includes(assessmentType)) {
      query.assessmentType = assessmentType;
    }

    if (from || to) {
      query.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) query.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) query.date.$lte = toDate;
      }
      if (Object.keys(query.date).length === 0) {
        delete query.date;
      }
    }

    const assessments = await TeacherAssessment.find(query)
      .populate('studentId', 'fullName firstName lastName')
      .populate('groupId', 'name color')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const dtos = assessments.map(toTeacherAssessmentDto);

    return res.json({
      success: true,
      assessments: dtos,
      count: dtos.length
    });
  } catch (error) {
    console.error('Error in getTeacherAssessments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
};

/**
 * GET /api/teachers/progress/assessments/:id
 * Retrieve a single assessment by ID (strictly owned by authenticated teacher).
 */
export const getTeacherAssessmentById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID' });
    }

    const assessment = await TeacherAssessment.findOne({
      _id: id,
      teacherId,
      isActive: true
    })
      .populate('studentId', 'fullName firstName lastName')
      .populate('groupId', 'name color')
      .lean();

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    return res.json({
      success: true,
      assessment: toTeacherAssessmentDto(assessment)
    });
  } catch (error) {
    console.error('Error in getTeacherAssessmentById:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch assessment' });
  }
};

/**
 * POST /api/teachers/progress/assessments
 * Create a new assessment record. Validates student, group, and lesson tenancy.
 */
export const createTeacherAssessment = async (req, res) => {
  try {
    const teacherId = req.userId;
    const {
      studentId,
      groupId,
      lessonId,
      title,
      subject,
      assessmentType,
      score,
      maxScore,
      grade,
      date,
      feedback,
      notes
    } = req.body;

    // 1. Validate required fields
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: 'A valid student is required' });
    }

    const cleanTitle = cleanString(title, 200);
    if (!cleanTitle) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const cleanSubj = cleanString(subject, 100);
    if (!cleanSubj) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    const numScore = Number(score);
    const numMaxScore = maxScore !== undefined ? Number(maxScore) : 100;

    if (isNaN(numScore) || numScore < 0) {
      return res.status(400).json({ success: false, message: 'Score must be a non-negative number' });
    }

    if (isNaN(numMaxScore) || numMaxScore <= 0) {
      return res.status(400).json({ success: false, message: 'Max score must be greater than zero' });
    }

    if (numScore > numMaxScore) {
      return res.status(400).json({ success: false, message: 'Score cannot exceed max score' });
    }

    const cleanType = assessmentType && TEACHER_ASSESSMENT_TYPES.includes(assessmentType)
      ? assessmentType
      : 'QUIZ';

    // 2. Validate Student tenancy
    const student = await TeacherStudent.findOne({
      _id: studentId,
      teacherId,
      isActive: true
    }).select('_id fullName');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found or unauthorized' });
    }

    // 3. Validate Group tenancy (if provided)
    let validatedGroupId = null;
    if (groupId) {
      if (!isValidObjectId(groupId)) {
        return res.status(400).json({ success: false, message: 'Invalid group ID' });
      }
      const group = await TeacherGroup.findOne({
        _id: groupId,
        teacherId,
        isActive: true
      }).select('_id');

      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
      }
      validatedGroupId = group._id;
    }

    // 4. Validate Lesson tenancy (if provided)
    let validatedLessonId = null;
    if (lessonId) {
      if (!isValidObjectId(lessonId)) {
        return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
      }
      const lesson = await TeacherLesson.findOne({
        _id: lessonId,
        teacherId
      }).select('_id');

      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found or unauthorized' });
      }
      validatedLessonId = lesson._id;
    }

    // 5. Parse evaluation date
    let evalDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        evalDate = parsedDate;
      }
    }

    // 6. Calculate percentage
    const rawPct = (numScore / numMaxScore) * 100;
    const computedPercentage = Math.round(rawPct * 100) / 100;

    // 7. Persist
    const assessment = await TeacherAssessment.create({
      teacherId,
      studentId: student._id,
      groupId: validatedGroupId,
      lessonId: validatedLessonId,
      title: cleanTitle,
      subject: cleanSubj,
      assessmentType: cleanType,
      score: numScore,
      maxScore: numMaxScore,
      percentage: computedPercentage,
      grade: cleanString(grade, 20),
      date: evalDate,
      feedback: cleanString(feedback, 2000),
      notes: cleanString(notes, 1000),
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment recorded successfully',
      assessment: toTeacherAssessmentDto(assessment)
    });
  } catch (error) {
    console.error('Error in createTeacherAssessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
};

/**
 * PUT /api/teachers/progress/assessments/:id
 * Update an existing assessment.
 */
export const updateTeacherAssessment = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID' });
    }

    const assessment = await TeacherAssessment.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const {
      studentId,
      groupId,
      lessonId,
      title,
      subject,
      assessmentType,
      score,
      maxScore,
      grade,
      date,
      feedback,
      notes
    } = req.body;

    // Validate Student tenancy if updated
    if (studentId !== undefined) {
      if (!isValidObjectId(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }
      const student = await TeacherStudent.findOne({
        _id: studentId,
        teacherId,
        isActive: true
      }).select('_id');
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found or unauthorized' });
      }
      assessment.studentId = student._id;
    }

    // Validate Group tenancy if updated
    if (groupId !== undefined) {
      if (groupId === null || groupId === '') {
        assessment.groupId = null;
      } else {
        if (!isValidObjectId(groupId)) {
          return res.status(400).json({ success: false, message: 'Invalid group ID' });
        }
        const group = await TeacherGroup.findOne({
          _id: groupId,
          teacherId,
          isActive: true
        }).select('_id');
        if (!group) {
          return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
        }
        assessment.groupId = group._id;
      }
    }

    // Validate Lesson tenancy if updated
    if (lessonId !== undefined) {
      if (lessonId === null || lessonId === '') {
        assessment.lessonId = null;
      } else {
        if (!isValidObjectId(lessonId)) {
          return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        const lesson = await TeacherLesson.findOne({
          _id: lessonId,
          teacherId
        }).select('_id');
        if (!lesson) {
          return res.status(404).json({ success: false, message: 'Lesson not found or unauthorized' });
        }
        assessment.lessonId = lesson._id;
      }
    }

    if (title !== undefined) {
      const cleanTitle = cleanString(title, 200);
      if (!cleanTitle) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      }
      assessment.title = cleanTitle;
    }

    if (subject !== undefined) {
      const cleanSubj = cleanString(subject, 100);
      if (!cleanSubj) {
        return res.status(400).json({ success: false, message: 'Subject cannot be empty' });
      }
      assessment.subject = cleanSubj;
    }

    if (assessmentType !== undefined) {
      if (!TEACHER_ASSESSMENT_TYPES.includes(assessmentType)) {
        return res.status(400).json({ success: false, message: 'Invalid assessment type' });
      }
      assessment.assessmentType = assessmentType;
    }

    const newScore = score !== undefined ? Number(score) : assessment.score;
    const newMaxScore = maxScore !== undefined ? Number(maxScore) : assessment.maxScore;

    if (score !== undefined || maxScore !== undefined) {
      if (isNaN(newScore) || newScore < 0) {
        return res.status(400).json({ success: false, message: 'Score must be a non-negative number' });
      }
      if (isNaN(newMaxScore) || newMaxScore <= 0) {
        return res.status(400).json({ success: false, message: 'Max score must be greater than zero' });
      }
      if (newScore > newMaxScore) {
        return res.status(400).json({ success: false, message: 'Score cannot exceed max score' });
      }
      assessment.score = newScore;
      assessment.maxScore = newMaxScore;
      const rawPct = (newScore / newMaxScore) * 100;
      assessment.percentage = Math.round(rawPct * 100) / 100;
    }

    if (grade !== undefined) assessment.grade = cleanString(grade, 20);
    if (feedback !== undefined) assessment.feedback = cleanString(feedback, 2000);
    if (notes !== undefined) assessment.notes = cleanString(notes, 1000);

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        assessment.date = parsedDate;
      }
    }

    await assessment.save();

    return res.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment: toTeacherAssessmentDto(assessment)
    });
  } catch (error) {
    console.error('Error in updateTeacherAssessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to update assessment' });
  }
};

/**
 * DELETE /api/teachers/progress/assessments/:id
 * Soft-delete assessment record (isActive = false).
 */
export const deleteTeacherAssessment = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID' });
    }

    const assessment = await TeacherAssessment.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    assessment.isActive = false;
    await assessment.save();

    return res.json({
      success: true,
      message: 'Assessment removed successfully'
    });
  } catch (error) {
    console.error('Error in deleteTeacherAssessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete assessment' });
  }
};

/**
 * GET /api/teachers/progress/students/:studentId
 * Aggregated student academic progress summary:
 * - Attendance (PRESENT, ABSENT, EXCUSED, rate excluding NOT_RECORDED)
 * - Homework (reliable 1-on-1 counts + clearly labeled group homework context)
 * - Assessments (totals, averages, min/max, trend timeline)
 */
export const getStudentProgressSummary = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { studentId } = req.params;

    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    // 1. Validate Student ownership
    const student = await TeacherStudent.findOne({
      _id: studentId,
      teacherId,
      isActive: true
    }).lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // 2. Fetch all lessons involving this student under authenticated teacher
    // A student is involved if:
    // a) 1-on-1 lesson with studentId === studentId
    // b) Or lesson attendance array contains an entry for studentId
    const lessons = await TeacherLesson.find({
      teacherId,
      $or: [
        { studentId: studentObjectId },
        { 'attendance.studentId': studentObjectId }
      ]
    })
      .sort({ date: -1, startTime: -1 })
      .lean();

    // 3. Compute Attendance stats
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let notRecordedCount = 0;

    lessons.forEach((lesson) => {
      // Find the specific attendance record for this student
      let record = null;
      if (Array.isArray(lesson.attendance) && lesson.attendance.length > 0) {
        record = lesson.attendance.find(
          (a) => String(a.studentId) === String(studentId)
        );
      }

      if (record) {
        if (record.status === 'PRESENT') presentCount++;
        else if (record.status === 'ABSENT') absentCount++;
        else if (record.status === 'EXCUSED') excusedCount++;
        else if (record.status === 'NOT_RECORDED') notRecordedCount++;
      } else if (lesson.lessonType === 'ONE_ON_ONE' && String(lesson.studentId) === String(studentId)) {
        notRecordedCount++;
      }
    });

    const totalEvaluatedAttendance = presentCount + absentCount + excusedCount;
    const attendancePercentage =
      totalEvaluatedAttendance > 0
        ? Math.round((presentCount / totalEvaluatedAttendance) * 100 * 10) / 10
        : 0;

    // 4. Compute Homework stats
    // CRITICAL: Group lessons only have a single lesson-level homework.isCompleted flag.
    // We isolate reliable 1-on-1 homework (individual) from group homework.
    let oneOnOneAssigned = 0;
    let oneOnOneCompleted = 0;
    let groupAssigned = 0;
    let groupCompleted = 0;

    lessons.forEach((lesson) => {
      const hw = lesson.homework;
      const hasHw = hw && (hw.title?.trim() || hw.description?.trim());

      if (hasHw) {
        if (lesson.lessonType === 'ONE_ON_ONE' && String(lesson.studentId) === String(studentId)) {
          oneOnOneAssigned++;
          if (hw.isCompleted) oneOnOneCompleted++;
        } else if (lesson.lessonType === 'GROUP') {
          groupAssigned++;
          if (hw.isCompleted) groupCompleted++;
        }
      }
    });

    const oneOnOnePending = Math.max(0, oneOnOneAssigned - oneOnOneCompleted);
    const individualHomeworkPercentage =
      oneOnOneAssigned > 0
        ? Math.round((oneOnOneCompleted / oneOnOneAssigned) * 100 * 10) / 10
        : 0;

    // 5. Compute Assessment stats & Timeline trend
    const assessments = await TeacherAssessment.find({
      teacherId,
      studentId: studentObjectId,
      isActive: true
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const totalAssessments = assessments.length;
    let avgPercentage = 0;
    let highestPercentage = 0;
    let lowestPercentage = 0;

    if (totalAssessments > 0) {
      const pcts = assessments.map((a) => Number(a.percentage) || 0);
      const sum = pcts.reduce((acc, val) => acc + val, 0);
      avgPercentage = Math.round((sum / totalAssessments) * 10) / 10;
      highestPercentage = Math.round(Math.max(...pcts) * 10) / 10;
      lowestPercentage = Math.round(Math.min(...pcts) * 10) / 10;
    }

    // Performance trend: Chronological entries for timeline/chart
    const performanceTrend = assessments.map((a) => ({
      id: String(a._id),
      date: a.date ? new Date(a.date).toISOString().split('T')[0] : null,
      title: a.title,
      subject: a.subject,
      assessmentType: a.assessmentType,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      grade: a.grade || ''
    }));

    // Recent 5 assessments (newest first)
    const recentAssessments = [...assessments]
      .reverse()
      .slice(0, 5)
      .map(toTeacherAssessmentDto);

    return res.json({
      success: true,
      student: {
        id: String(student._id),
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        school: student.school || '',
        gradeLevel: student.gradeLevel || '',
        educationLevel: student.educationLevel || '',
        status: student.status
      },
      attendance: {
        totalEvaluated: totalEvaluatedAttendance,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        notRecorded: notRecordedCount,
        attendancePercentage
      },
      homework: {
        // Reliable individual homework (1-on-1 lessons)
        individual: {
          assigned: oneOnOneAssigned,
          completed: oneOnOneCompleted,
          pending: oneOnOnePending,
          completionPercentage: individualHomeworkPercentage
        },
        // Group-level homework breakdown (clearly labeled limitation)
        groupLevel: {
          assigned: groupAssigned,
          completed: groupCompleted,
          note: 'Group lesson homework completion is tracked at the class level, not per student.'
        }
      },
      assessments: {
        total: totalAssessments,
        averagePercentage: avgPercentage,
        highestPercentage,
        lowestPercentage,
        recent: recentAssessments,
        trend: performanceTrend
      }
    });
  } catch (error) {
    console.error('Error in getStudentProgressSummary:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate student progress' });
  }
};

/**
 * GET /api/teachers/progress/overview
 * High-level teacher overview:
 * - Active student count
 * - Total active assessments
 * - Overall attendance breakdown
 */
export const getTeacherProgressOverview = async (req, res) => {
  try {
    const teacherId = req.userId;

    const [activeStudentsCount, activeAssessmentsCount, lessons] = await Promise.all([
      TeacherStudent.countDocuments({ teacherId, isActive: true, status: 'ACTIVE' }),
      TeacherAssessment.countDocuments({ teacherId, isActive: true }),
      TeacherLesson.find({ teacherId }).select('attendance lessonType').lean()
    ]);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalExcused = 0;

    lessons.forEach((lesson) => {
      if (Array.isArray(lesson.attendance)) {
        lesson.attendance.forEach((att) => {
          if (att.status === 'PRESENT') totalPresent++;
          else if (att.status === 'ABSENT') totalAbsent++;
          else if (att.status === 'EXCUSED') totalExcused++;
        });
      }
    });

    const totalEvaluated = totalPresent + totalAbsent + totalExcused;
    const overallAttendanceRate =
      totalEvaluated > 0
        ? Math.round((totalPresent / totalEvaluated) * 100 * 10) / 10
        : 0;

    return res.json({
      success: true,
      overview: {
        activeStudentsCount,
        totalAssessmentsCount: activeAssessmentsCount,
        attendance: {
          totalEvaluated,
          present: totalPresent,
          absent: totalAbsent,
          excused: totalExcused,
          overallAttendanceRate
        }
      }
    });
  } catch (error) {
    console.error('Error in getTeacherProgressOverview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch progress overview' });
  }
};
