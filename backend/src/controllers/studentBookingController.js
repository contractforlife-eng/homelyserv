// backend/src/controllers/studentBookingController.js
// ============================================================
// STUDENT LESSON BOOKING CONTROLLER
//
// Allows authenticated students to create, list, view, and cancel booking requests.
//
// BUSINESS RULES:
// 1. Authenticated user must have role STUDENT (req.userId).
// 2. Student must have an ACTIVE relationship (TeacherStudent) with the teacher.
// 3. New booking requests are created with status: 'PENDING'.
// 4. Time and date must be valid and in HH:mm format (endTime > startTime).
// 5. Booking must not conflict with teacher's scheduled lessons or confirmed bookings.
// 6. Duplicate pending booking requests for the exact same teacher, date, and slot are rejected.
// 7. Ownership is strictly enforced: students can only access/cancel their own bookings.
// 8. Cancellation allowed only from PENDING or CONFIRMED states.
// ============================================================
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherStudent from '../models/TeacherStudent.js';
import User from '../models/User.js';
import { checkTeacherScheduleConflict, validateTimeRange } from '../services/lessonBookingConflictService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Transforms a StudentLessonBooking document to a clean student DTO.
 */
export const toStudentBookingDto = (bookingDoc, teacherUserDoc = null) => {
  if (!bookingDoc) return null;
  const d = typeof bookingDoc.toObject === 'function' ? bookingDoc.toObject() : bookingDoc;

  const tObj = d.teacherId && typeof d.teacherId === 'object' ? d.teacherId : teacherUserDoc;

  return {
    id: String(d._id),
    studentId: String(d.studentId?._id || d.studentId),
    teacherId: String(d.teacherId?._id || d.teacherId),
    teacherStudentId: String(d.teacherStudentId?._id || d.teacherStudentId),
    teacher: tObj
      ? {
          id: String(tObj._id),
          fullName: tObj.fullName || '',
          email: tObj.email || '',
          avatar: tObj.profileImage || null
        }
      : null,
    subject: d.subject || '',
    date: d.date ? new Date(d.date).toISOString().split('T')[0] : null,
    startTime: d.startTime || '',
    endTime: d.endTime || '',
    lessonType: d.lessonType || 'ONE_ON_ONE',
    studentNote: d.studentNote || '',
    teacherResponseNote: d.teacherResponseNote || '',
    rejectionReason: d.rejectionReason || '',
    status: d.status || 'PENDING',
    lessonId: d.lessonId ? String(d.lessonId._id || d.lessonId) : null,
    acceptedAt: d.acceptedAt || null,
    rejectedAt: d.rejectedAt || null,
    cancelledAt: d.cancelledAt || null,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

/**
 * POST /api/students/bookings
 * Student creates a new booking request.
 */
export const createStudentBooking = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const body = req.body || {};

    const teacherId = body.teacherId;
    if (!teacherId || !isValidObjectId(String(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid teacherId is required'
      });
    }

    if (String(studentUserId) === String(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a lesson with yourself'
      });
    }

    // Verify teacher exists and has role TEACHER
    const teacherUser = await User.findById(teacherId).select('_id role isSuspended');
    if (!teacherUser || teacherUser.role !== 'TEACHER' || teacherUser.isSuspended) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found or unavailable'
      });
    }

    // Rule: Booking is only available when Student <-> Teacher relationship is ACTIVE
    const relationship = await TeacherStudent.findOne({
      teacherId,
      $or: [{ linkedUserId: studentUserId }, { studentUserId }],
      isActive: true,
      relationshipStatus: 'ACTIVE'
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'An active teacher-student relationship is required to book a lesson'
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

    // Check for exact duplicate pending booking requests by same student
    const existingPending = await StudentLessonBooking.findOne({
      studentId: studentUserId,
      teacherId,
      date: parsedDate,
      startTime,
      endTime,
      status: 'PENDING',
      isActive: true
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A pending booking request already exists for this slot'
      });
    }

    // Recheck schedule conflict against teacher's existing confirmed lessons/bookings
    const conflict = await checkTeacherScheduleConflict({
      teacherId,
      date: parsedDate,
      startTime,
      endTime
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflict.reason || 'The requested time slot conflicts with the teacher schedule'
      });
    }

    const studentNote = cleanString(body.studentNote || body.message, 1000);

    const booking = await StudentLessonBooking.create({
      studentId: studentUserId,
      teacherId,
      teacherStudentId: relationship._id,
      subject,
      date: parsedDate,
      startTime,
      endTime,
      lessonType: 'ONE_ON_ONE',
      studentNote,
      status: 'PENDING',
      isActive: true
    });

    // Notify teacher of the incoming lesson request (non-blocking)
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('../services/notificationService.js');
      const studentUser = await User.findById(studentUserId).select('fullName');
      const studentName = studentUser?.fullName || relationship.fullName || 'A student';
      const dateStr = parsedDate.toISOString().split('T')[0];

      await createNotification(String(teacherId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New Lesson Request',
        message: `${studentName} requested a lesson for ${subject} on ${dateStr} (${startTime} - ${endTime}).`,
        entityType: 'LESSON_BOOKING',
        entityId: String(booking._id),
        link: '/teacher-lessons'
      });
    } catch (notifErr) {
      // Non-blocking notification error
      console.warn('Failed to send booking creation notification to teacher:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      booking: toStudentBookingDto(booking)
    });
  } catch (error) {
    console.error('Error creating student booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating booking request',
      error: error.message
    });
  }
};

/**
 * GET /api/students/bookings
 * List authenticated student's bookings with optional status filter.
 */
export const getStudentBookings = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { status } = req.query || {};

    const filter = {
      studentId: studentUserId,
      isActive: true
    };

    if (status && ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const bookings = await StudentLessonBooking.find(filter)
      .sort({ date: -1, startTime: -1 })
      .populate('teacherId', 'fullName email profileImage');

    const dtoList = bookings.map((b) => toStudentBookingDto(b));

    return res.json({
      success: true,
      count: dtoList.length,
      bookings: dtoList
    });
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching bookings',
      error: error.message
    });
  }
};

/**
 * GET /api/students/bookings/:id
 * Retrieve details of a booking owned by the authenticated student.
 */
export const getStudentBookingById = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ownership check: must belong to studentUserId
    const booking = await StudentLessonBooking.findOne({
      _id: id,
      studentId: studentUserId,
      isActive: true
    }).populate('teacherId', 'fullName email profileImage');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking: toStudentBookingDto(booking)
    });
  } catch (error) {
    console.error('Error fetching student booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching booking',
      error: error.message
    });
  }
};

/**
 * POST /api/students/bookings/:id/cancel
 * Student cancels their booking request.
 */
export const cancelStudentBooking = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = await StudentLessonBooking.findOne({
      _id: id,
      studentId: studentUserId,
      isActive: true
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only allow cancellation for PENDING or CONFIRMED
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status ${booking.status}`
      });
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: toStudentBookingDto(booking)
    });
  } catch (error) {
    console.error('Error cancelling student booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling booking',
      error: error.message
    });
  }
};

export default {
  createStudentBooking,
  getStudentBookings,
  getStudentBookingById,
  cancelStudentBooking,
  toStudentBookingDto
};
