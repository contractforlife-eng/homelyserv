// backend/src/models/StudentLessonBooking.js
// ============================================================
// STUDENT LESSON BOOKING MODEL
//
// Represents a student's request to book a lesson with a teacher.
//
// LIFECYCLE / STATE MACHINE:
// - PENDING:   Created by student. Awaiting teacher review.
// - CONFIRMED: Accepted by teacher.
// - REJECTED:  Declined by teacher.
// - CANCELLED: Cancelled by student (only when in valid state).
//
// BOUNDARY:
// StudentLessonBooking != TeacherLesson.
// A booking request never automatically creates a TeacherLesson,
// attendance record, progress entry, or schedule item.
//
// TENANCY / OWNERSHIP:
// - studentId: references User (role: STUDENT)
// - teacherId: references User (role: TEACHER)
// - teacherStudentId: references TeacherStudent relationship record
// ============================================================
import mongoose from 'mongoose';

const studentLessonBookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    teacherStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String, // HH:mm format, e.g. "14:00"
      required: true,
      trim: true,
      maxlength: 10
    },
    endTime: {
      type: String, // HH:mm format, e.g. "15:00"
      required: true,
      trim: true,
      maxlength: 10
    },
    lessonType: {
      type: String,
      enum: ['ONE_ON_ONE'],
      default: 'ONE_ON_ONE'
    },
    studentNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    teacherResponseNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherLesson',
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'student_lesson_bookings'
  }
);

// Indexes for common queries
studentLessonBookingSchema.index(
  { studentId: 1, isActive: 1, date: -1 },
  { name: 'student_booking_list' }
);

studentLessonBookingSchema.index(
  { teacherId: 1, isActive: 1, status: 1, date: 1 },
  { name: 'teacher_booking_list' }
);

// Conflict lookup index
studentLessonBookingSchema.index(
  { teacherId: 1, date: 1, status: 1, isActive: 1 },
  { name: 'teacher_booking_conflict' }
);

const StudentLessonBooking =
  mongoose.models.StudentLessonBooking ||
  mongoose.model('StudentLessonBooking', studentLessonBookingSchema);

export default StudentLessonBooking;
