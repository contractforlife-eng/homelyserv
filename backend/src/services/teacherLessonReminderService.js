// backend/src/services/teacherLessonReminderService.js
// ============================================================
// TEACHER LESSON REMINDER SERVICE
//
// Automatically dispatches lesson reminders at two milestones:
// - 24 hours prior to scheduled lesson
// - 1 hour prior to scheduled lesson
//
// RECIPIENT RULES:
// 1. Teacher: Always receives the reminder for their own lesson.
// 2. Student: For ONE_ON_ONE lessons with linked Homely student, student receives reminder.
//             For GROUP lessons, all actively enrolled Homely students receive reminder.
// 3. Parents: Any parent with ACTIVE ParentStudent relationship with eligible student(s)
//             receives the reminder on behalf of their child.
// 4. External students (no linked user account) are safely skipped.
// 5. Ineligible lessons (CANCELLED, COMPLETED, NO_SHOW, or inactive) are strictly skipped.
// 6. Duplicate prevention: Atomically sets remindersSent.h24 / remindersSent.h1 flag.
// ============================================================
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import ParentStudent from '../models/ParentStudent.js';
import notificationService, { NOTIFICATION_TYPES, PRIORITIES } from './notificationService.js';

/**
 * Calculates exact UTC start time Date for a lesson.
 * `lesson.date` is UTC midnight of the lesson day.
 * `lesson.startTime` is HH:mm string.
 */
export const getLessonStartDateTime = (lessonDate, startTimeStr) => {
  if (!lessonDate || !startTimeStr || typeof startTimeStr !== 'string') return null;
  const d = new Date(lessonDate);
  if (Number.isNaN(d.getTime())) return null;

  const parts = startTimeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const start = new Date(d);
  start.setUTCHours(hours, minutes, 0, 0);
  return start;
};

/**
 * Collects all eligible student user IDs and their linked active parent user IDs.
 */
export const resolveLessonRecipients = async (lesson) => {
  const studentUserIds = new Set();
  const parentUserIds = new Set();

  if (lesson.lessonType === 'ONE_ON_ONE') {
    const student = lesson.studentId;
    const studentUserId = student?.linkedUserId || student?.studentUserId;
    if (studentUserId) {
      studentUserIds.add(String(studentUserId._id || studentUserId));
    }
  } else if (lesson.lessonType === 'GROUP' && lesson.groupId) {
    const targetGroupId = lesson.groupId._id || lesson.groupId;
    const enrollments = await TeacherGroupEnrollment.find({
      groupId: targetGroupId,
      teacherId: lesson.teacherId,
      isActive: true,
      status: 'ACTIVE'
    }).populate('studentId', 'linkedUserId studentUserId');

    for (const e of enrollments) {
      const s = e.studentId;
      const sUserId = s?.linkedUserId || s?.studentUserId;
      if (sUserId) {
        studentUserIds.add(String(sUserId._id || sUserId));
      }
    }
  }

  // Look up active parents for all collected students
  if (studentUserIds.size > 0) {
    const parentLinks = await ParentStudent.find({
      studentUserId: { $in: Array.from(studentUserIds) },
      relationshipStatus: 'ACTIVE'
    }).select('parentUserId');

    for (const link of parentLinks) {
      if (link.parentUserId) {
        parentUserIds.add(String(link.parentUserId._id || link.parentUserId));
      }
    }
  }

  return {
    teacherUserId: String(lesson.teacherId._id || lesson.teacherId),
    studentUserIds: Array.from(studentUserIds),
    parentUserIds: Array.from(parentUserIds)
  };
};

/**
 * Dispatches reminders for a single lesson and window (h24 or h1).
 * Uses atomic findOneAndUpdate to prevent duplicate reminder dispatch.
 */
export const processLessonReminderWindow = async (lesson, windowKey, windowLabel) => {
  const updateQuery = {
    _id: lesson._id,
    isActive: true,
    lessonStatus: 'SCHEDULED',
    [`remindersSent.${windowKey}`]: { $ne: true }
  };

  const updateOp = {
    $set: {
      [`remindersSent.${windowKey}`]: true,
      'remindersSent.lastScheduledStartTime': lesson.startTime,
      'remindersSent.lastScheduledDate': lesson.date
    }
  };

  // Atomically claim the reminder so parallel runs / cluster workers don't duplicate
  const lockedLesson = await TeacherLesson.findOneAndUpdate(updateQuery, updateOp, { new: true })
    .populate('studentId', 'fullName linkedUserId studentUserId')
    .populate('groupId', 'name subject');

  if (!lockedLesson) {
    return false; // Already sent or status changed
  }

  const recipients = await resolveLessonRecipients(lockedLesson);
  const subjectName = lockedLesson.subject || 'Lesson';
  const timeStr = lockedLesson.startTime || '';
  const dateStr = lockedLesson.date ? new Date(lockedLesson.date).toISOString().split('T')[0] : '';

  const teacherTitle = `Upcoming Lesson Reminder (${windowLabel})`;
  const teacherMessage = `You have a scheduled ${lockedLesson.lessonType === 'GROUP' ? 'group' : '1-on-1'} lesson for ${subjectName} in ${windowLabel} (${dateStr} at ${timeStr}).`;

  const studentTitle = `Upcoming Lesson Reminder (${windowLabel})`;
  const studentMessage = `Your ${subjectName} lesson is starting in ${windowLabel} (${dateStr} at ${timeStr}).`;

  const parentTitle = `Child Lesson Reminder (${windowLabel})`;
  const parentMessage = `Your child has a scheduled ${subjectName} lesson starting in ${windowLabel} (${dateStr} at ${timeStr}).`;

  const notificationPromises = [];

  // 1. Notify Teacher
  notificationPromises.push(
    notificationService.createNotification(recipients.teacherUserId, {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: teacherTitle,
      message: teacherMessage,
      priority: PRIORITIES.HIGH,
      icon: '📅',
      link: '/teacher/lessons',
      entityType: 'TEACHER_LESSON',
      entityId: String(lockedLesson._id),
      data: { lessonId: String(lockedLesson._id), window: windowKey }
    })
  );

  // 2. Notify Eligible Students
  for (const sUserId of recipients.studentUserIds) {
    notificationPromises.push(
      notificationService.createNotification(sUserId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: studentTitle,
        message: studentMessage,
        priority: PRIORITIES.HIGH,
        icon: '📚',
        link: '/student/lessons',
        entityType: 'TEACHER_LESSON',
        entityId: String(lockedLesson._id),
        data: { lessonId: String(lockedLesson._id), window: windowKey }
      })
    );
  }

  // 3. Notify Eligible Parents
  for (const pUserId of recipients.parentUserIds) {
    notificationPromises.push(
      notificationService.createNotification(pUserId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: parentTitle,
        message: parentMessage,
        priority: PRIORITIES.NORMAL,
        icon: '👨‍👧‍👦',
        link: '/parent/students',
        entityType: 'TEACHER_LESSON',
        entityId: String(lockedLesson._id),
        data: { lessonId: String(lockedLesson._id), window: windowKey }
      })
    );
  }

  await Promise.allSettled(notificationPromises);
  return true;
};

/**
 * Scans upcoming scheduled lessons and sends 24h and 1h reminders.
 *
 * Windows:
 * - 24-hour reminder: Sent when lesson start is between [23.5h, 24.5h] from `now`.
 *   Also catches up lessons between [20h, 24h] if worker was restarted.
 * - 1-hour reminder: Sent when lesson start is between [50m, 70m] from `now`.
 *   Also catches up lessons between [30m, 60m].
 */
export const checkAndDispatchTeacherLessonReminders = async (now = new Date()) => {
  const nowMs = now.getTime();

  // Search window bounds: from now up to 26 hours in the future
  const searchStart = new Date(nowMs);
  searchStart.setUTCHours(0, 0, 0, 0); // start of today

  const searchEnd = new Date(nowMs + 28 * 60 * 60 * 1000);
  searchEnd.setUTCHours(23, 59, 59, 999); // end of tomorrow

  const scheduledLessons = await TeacherLesson.find({
    isActive: true,
    lessonStatus: 'SCHEDULED',
    date: { $gte: searchStart, $lte: searchEnd },
    $or: [
      { 'remindersSent.h24': { $ne: true } },
      { 'remindersSent.h1': { $ne: true } }
    ]
  }).lean();

  let sent24h = 0;
  let sent1h = 0;

  for (const lesson of scheduledLessons) {
    const startDateTime = getLessonStartDateTime(lesson.date, lesson.startTime);
    if (!startDateTime) continue;

    const diffMs = startDateTime.getTime() - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);

    // 24h Milestone check: between 20h and 24.5h remaining
    if (diffHours >= 20 && diffHours <= 24.5 && !lesson.remindersSent?.h24) {
      const dispatched = await processLessonReminderWindow(lesson, 'h24', '24 hours');
      if (dispatched) sent24h++;
    }

    // 1h Milestone check: between 30 mins (0.5h) and 1.25h (75 mins) remaining
    if (diffHours >= 0.5 && diffHours <= 1.25 && !lesson.remindersSent?.h1) {
      const dispatched = await processLessonReminderWindow(lesson, 'h1', '1 hour');
      if (dispatched) sent1h++;
    }
  }

  return { checked: scheduledLessons.length, sent24h, sent1h };
};

/**
 * Starts the lesson reminder worker. Runs check every 5 minutes.
 */
export const startTeacherLessonReminderWorker = (intervalMs = 5 * 60 * 1000) => {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await checkAndDispatchTeacherLessonReminders();
    } catch (err) {
      console.error('Teacher lesson reminder worker error:', err.message);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
};

export default {
  getLessonStartDateTime,
  resolveLessonRecipients,
  processLessonReminderWindow,
  checkAndDispatchTeacherLessonReminders,
  startTeacherLessonReminderWorker
};
