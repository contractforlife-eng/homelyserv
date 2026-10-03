// backend/src/services/lessonBookingConflictService.js
// ============================================================
// LESSON BOOKING CONFLICT SERVICE
//
// Authoritative backend checker to prevent double booking or overlapping slots.
//
// Validates requested slot against:
// 1. Existing TeacherLessons (lessonStatus in ['SCHEDULED', 'COMPLETED'], isActive = true)
// 2. Existing StudentLessonBookings (status = 'CONFIRMED', isActive = true)
//
// Can exclude a specific bookingId or lessonId (useful when evaluating self-update/acceptance).
// ============================================================
import TeacherLesson from '../models/TeacherLesson.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates HH:mm time format and ensures endTime > startTime.
 */
export const validateTimeRange = (startTime, endTime) => {
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
 * Converts HH:mm string to minutes from start of day.
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || !TIME_REGEX.test(timeStr)) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Checks whether two time intervals [startA, endA) and [startB, endB) overlap.
 */
export const isTimeOverlap = (startA, endA, startB, endB) => {
  return Math.max(startA, startB) < Math.min(endA, endB);
};

/**
 * Normalizes date to midnight UTC boundaries for day comparison.
 */
export const getDayRange = (date) => {
  const d = new Date(date);
  const startOfDay = new Date(d);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(d);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

/**
 * Authoritative check for teacher schedule conflicts.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.teacherId
 * @param {Date|string} params.date
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @param {string|ObjectId} [params.excludeBookingId] - Booking ID to ignore (self)
 * @returns {Promise<{ hasConflict: boolean, reason?: string, conflictType?: 'LESSON'|'BOOKING' }>}
 */
export const checkTeacherScheduleConflict = async ({
  teacherId,
  date,
  startTime,
  endTime,
  excludeBookingId = null
}) => {
  const timeVal = validateTimeRange(startTime, endTime);
  if (!timeVal.ok) {
    return { hasConflict: true, reason: timeVal.message };
  }

  const reqStart = timeVal.startMinutes;
  const reqEnd = timeVal.endMinutes;
  const { startOfDay, endOfDay } = getDayRange(date);

  // 1. Check existing confirmed/active TeacherLessons
  const lessonFilter = {
    teacherId,
    isActive: true,
    lessonStatus: { $in: ['SCHEDULED', 'COMPLETED'] },
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (excludeBookingId) {
    lessonFilter.sourceBookingId = { $ne: excludeBookingId };
  }

  const existingLessons = await TeacherLesson.find(lessonFilter).select('startTime endTime subject sourceBookingId');

  for (const lesson of existingLessons) {
    // If this lesson is already linked to the same booking, it is not a foreign conflict
    if (excludeBookingId && String(lesson.sourceBookingId || '') === String(excludeBookingId)) {
      continue;
    }

    const lStart = timeToMinutes(lesson.startTime);
    const lEnd = timeToMinutes(lesson.endTime);
    if (isTimeOverlap(reqStart, reqEnd, lStart, lEnd)) {
      return {
        hasConflict: true,
        conflictType: 'LESSON',
        reason: `Teacher already has a scheduled lesson from ${lesson.startTime} to ${lesson.endTime}`
      };
    }
  }

  // 2. Check existing confirmed StudentLessonBookings
  const bookingFilter = {
    teacherId,
    isActive: true,
    status: 'CONFIRMED',
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const confirmedBookings = await StudentLessonBooking.find(bookingFilter).select('startTime endTime subject');

  for (const booking of confirmedBookings) {
    const bStart = timeToMinutes(booking.startTime);
    const bEnd = timeToMinutes(booking.endTime);
    if (isTimeOverlap(reqStart, reqEnd, bStart, bEnd)) {
      return {
        hasConflict: true,
        conflictType: 'BOOKING',
        reason: `Teacher already has a confirmed booking from ${booking.startTime} to ${booking.endTime}`
      };
    }
  }

  return { hasConflict: false };
};

export default {
  TIME_REGEX,
  validateTimeRange,
  timeToMinutes,
  isTimeOverlap,
  getDayRange,
  checkTeacherScheduleConflict
};
