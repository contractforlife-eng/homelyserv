// backend/src/controllers/teacherBookingController.js
// ============================================================
// TEACHER LESSON BOOKING CONTROLLER
//
// Allows authenticated teachers to list, view, accept, and reject booking requests.
//
// BUSINESS RULES:
// 1. Authenticated user must have role TEACHER (req.userId).
// 2. Teacher can only access bookings where teacherId == req.userId.
// 3. Accept booking:
//    - Booking must currently have status 'PENDING'.
//    - Re-validates conflicts against confirmed lessons & confirmed bookings.
//    - Atomic update/transition: findOneAndUpdate({ _id, teacherId, status: 'PENDING' })
//      to prevent concurrent/race condition acceptance.
//    - Changes status to 'CONFIRMED' and records acceptedAt.
//    - DOES NOT create a TeacherLesson (Phase 6A boundary preserved).
// 4. Reject booking:
//    - Booking must currently have status 'PENDING'.
//    - Atomic update: findOneAndUpdate({ _id, teacherId, status: 'PENDING' })
//    - Changes status to 'REJECTED' and records rejectedAt and optional rejectionReason.
// ============================================================
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import { checkTeacherScheduleConflict } from '../services/lessonBookingConflictService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Transforms a StudentLessonBooking document to a clean teacher DTO.
 */
export const toTeacherBookingDto = (bookingDoc, studentUserDoc = null, teacherStudentDoc = null) => {
  if (!bookingDoc) return null;
  const d = typeof bookingDoc.toObject === 'function' ? bookingDoc.toObject() : bookingDoc;

  const sObj = d.studentId && typeof d.studentId === 'object' ? d.studentId : studentUserDoc;
  const tsObj = d.teacherStudentId && typeof d.teacherStudentId === 'object' ? d.teacherStudentId : teacherStudentDoc;

  return {
    id: String(d._id),
    studentId: String(d.studentId?._id || d.studentId),
    teacherId: String(d.teacherId?._id || d.teacherId),
    teacherStudentId: String(d.teacherStudentId?._id || d.teacherStudentId),
    student: sObj
      ? {
          id: String(sObj._id),
          fullName: sObj.fullName || '',
          email: sObj.email || '',
          phone: sObj.phone || '',
          avatar: sObj.profileImage || null
        }
      : null,
    studentRoster: tsObj
      ? {
          id: String(tsObj._id),
          fullName: tsObj.fullName || '',
          gradeLevel: tsObj.gradeLevel || '',
          school: tsObj.school || ''
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
 * GET /api/teachers/bookings
 * List authenticated teacher's incoming booking requests with optional status filtering.
 */
export const getTeacherBookings = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { status } = req.query || {};

    const filter = {
      teacherId,
      isActive: true
    };

    if (status && ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const bookings = await StudentLessonBooking.find(filter)
      .sort({ date: 1, startTime: 1 })
      .populate('studentId', 'fullName email phone profileImage')
      .populate('teacherStudentId', 'fullName gradeLevel school');

    const dtoList = bookings.map((b) => toTeacherBookingDto(b));

    return res.json({
      success: true,
      count: dtoList.length,
      bookings: dtoList
    });
  } catch (error) {
    console.error('Error fetching teacher bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching bookings',
      error: error.message
    });
  }
};

/**
 * GET /api/teachers/bookings/:id
 * Retrieve details of a booking belonging to the authenticated teacher.
 */
export const getTeacherBookingById = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = await StudentLessonBooking.findOne({
      _id: id,
      teacherId,
      isActive: true
    })
      .populate('studentId', 'fullName email phone profileImage')
      .populate('teacherStudentId', 'fullName gradeLevel school');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking: toTeacherBookingDto(booking)
    });
  } catch (error) {
    console.error('Error fetching teacher booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching booking',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/bookings/:id/accept
 * Teacher accepts a PENDING booking request.
 */
export const acceptTeacherBooking = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const { note } = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // 1. Fetch booking to check ownership & initial status
    const booking = await StudentLessonBooking.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a booking that is currently ${booking.status}`
      });
    }

    // 2. Validate ACTIVE TeacherStudent relationship
    const relationship = await TeacherStudent.findOne({
      _id: booking.teacherStudentId,
      teacherId,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'An active teacher-student relationship is required to accept this booking'
      });
    }

    // 3. Authoritative conflict re-validation before acceptance
    const conflict = await checkTeacherScheduleConflict({
      teacherId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      excludeBookingId: booking._id
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflict.reason || 'This slot conflicts with an existing lesson or confirmed booking'
      });
    }

    // 4. Atomic transition claiming the PENDING booking to prevent concurrent double-acceptance
    const updatedBooking = await StudentLessonBooking.findOneAndUpdate(
      {
        _id: id,
        teacherId,
        status: 'PENDING',
        isActive: true
      },
      {
        $set: {
          status: 'CONFIRMED',
          acceptedAt: new Date(),
          teacherResponseNote: cleanString(note, 1000)
        }
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: 'Booking has already been updated or processed'
      });
    }

    // 5. Idempotent TeacherLesson creation / linking
    let lessonDoc = null;
    try {
      // Check if a TeacherLesson already exists for this booking (idempotency guard)
      lessonDoc = await TeacherLesson.findOne({
        sourceBookingId: updatedBooking._id,
        teacherId,
        isActive: true
      });

      if (!lessonDoc) {
        // Create the single ONE_ON_ONE TeacherLesson
        lessonDoc = await TeacherLesson.create({
          teacherId,
          lessonType: 'ONE_ON_ONE',
          studentId: updatedBooking.teacherStudentId, // TeacherStudent ObjectId
          groupId: null,
          subject: updatedBooking.subject,
          date: updatedBooking.date,
          startTime: updatedBooking.startTime,
          endTime: updatedBooking.endTime,
          lessonStatus: 'SCHEDULED',
          attendance: [
            {
              studentId: updatedBooking.teacherStudentId,
              status: 'NOT_RECORDED',
              note: ''
            }
          ],
          notes: '',
          homework: null,
          isActive: true,
          sourceBookingId: updatedBooking._id
        });
      }

      // Link lessonId on the booking if not already linked
      if (!updatedBooking.lessonId || String(updatedBooking.lessonId) !== String(lessonDoc._id)) {
        updatedBooking.lessonId = lessonDoc._id;
        await updatedBooking.save();
      }
    } catch (lessonError) {
      console.error('Error creating linked TeacherLesson for booking:', lessonError);

      // Handle duplicate key error safely if race hit unique index
      if (lessonError.code === 11000) {
        lessonDoc = await TeacherLesson.findOne({
          sourceBookingId: updatedBooking._id
        });
        if (lessonDoc) {
          updatedBooking.lessonId = lessonDoc._id;
          await updatedBooking.save();
        }
      }

      // If still no lesson, compensate by reverting booking to PENDING so state is not falsely CONFIRMED
      if (!lessonDoc) {
        await StudentLessonBooking.updateOne(
          { _id: updatedBooking._id },
          { $set: { status: 'PENDING', acceptedAt: null, lessonId: null } }
        );
        return res.status(500).json({
          success: false,
          message: 'Failed to schedule lesson for this booking. The booking remains pending for retry.'
        });
      }
    }

    // Re-populate booking for safe DTO response
    const finalBooking = await StudentLessonBooking.findById(updatedBooking._id)
      .populate('studentId', 'fullName email phone profileImage')
      .populate('teacherStudentId', 'fullName gradeLevel school');

    // Notify student that booking was confirmed and lesson scheduled (non-blocking)
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('../services/notificationService.js');
      const teacherUser = await User.findById(teacherId).select('fullName');
      const teacherName = teacherUser?.fullName || 'Your teacher';
      const dateStr = updatedBooking.date ? new Date(updatedBooking.date).toISOString().split('T')[0] : '';

      await createNotification(String(updatedBooking.studentId._id || updatedBooking.studentId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Lesson Booking Confirmed',
        message: `${teacherName} accepted your lesson request for ${updatedBooking.subject} on ${dateStr} (${updatedBooking.startTime} - ${updatedBooking.endTime}). The lesson has been scheduled.`,
        entityType: 'TEACHER_LESSON',
        entityId: String(lessonDoc._id),
        link: '/student-lessons'
      });
    } catch (notifErr) {
      console.warn('Failed to send booking acceptance notification to student:', notifErr.message);
    }

    return res.json({
      success: true,
      message: 'Booking accepted and lesson scheduled successfully',
      booking: toTeacherBookingDto(finalBooking),
      lessonId: String(lessonDoc._id)
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error accepting booking',
      error: error.message
    });
  }
};

/**
 * POST /api/teachers/bookings/:id/reject
 * Teacher rejects a PENDING booking request.
 */
export const rejectTeacherBooking = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;
    const { reason, note } = req.body || {};

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = await StudentLessonBooking.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a booking that is currently ${booking.status}`
      });
    }

    // Atomic transition from PENDING -> REJECTED
    const updatedBooking = await StudentLessonBooking.findOneAndUpdate(
      {
        _id: id,
        teacherId,
        status: 'PENDING',
        isActive: true
      },
      {
        $set: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: cleanString(reason, 500),
          teacherResponseNote: cleanString(note, 1000)
        }
      },
      { new: true }
    )
      .populate('studentId', 'fullName email phone profileImage')
      .populate('teacherStudentId', 'fullName gradeLevel school');

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message: 'Booking has already been updated or processed'
      });
    }

    // Notify student that booking was rejected (non-blocking)
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('../services/notificationService.js');
      const teacherUser = await User.findById(teacherId).select('fullName');
      const teacherName = teacherUser?.fullName || 'Your teacher';
      const dateStr = updatedBooking.date ? new Date(updatedBooking.date).toISOString().split('T')[0] : '';
      const reasonText = updatedBooking.rejectionReason ? ` Reason: ${updatedBooking.rejectionReason}` : '';

      await createNotification(String(updatedBooking.studentId._id || updatedBooking.studentId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Lesson Booking Declined',
        message: `${teacherName} was unable to accept your lesson request for ${updatedBooking.subject} on ${dateStr}.${reasonText}`,
        entityType: 'LESSON_BOOKING',
        entityId: String(updatedBooking._id),
        link: '/student-bookings'
      });
    } catch (notifErr) {
      console.warn('Failed to send booking rejection notification to student:', notifErr.message);
    }

    return res.json({
      success: true,
      message: 'Booking request rejected',
      booking: toTeacherBookingDto(updatedBooking)
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting booking',
      error: error.message
    });
  }
};

export default {
  getTeacherBookings,
  getTeacherBookingById,
  acceptTeacherBooking,
  rejectTeacherBooking,
  toTeacherBookingDto
};
