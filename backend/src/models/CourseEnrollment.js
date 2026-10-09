// backend/src/models/CourseEnrollment.js
// ============================================================
// COURSE ENROLLMENT MODEL (HomelyServ LMS Phase 1)
// ============================================================
// Tracks a student's enrollment in a course.
// Compound unique index prevents duplicate enrollments per student/course.
// ============================================================
import mongoose from 'mongoose';

const courseEnrollmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'course_enrollments'
  }
);

// Compound unique index ensuring only one enrollment record per course & student
courseEnrollmentSchema.index(
  { courseId: 1, studentUserId: 1 },
  { unique: true, name: 'course_student_unique' }
);

const CourseEnrollment =
  mongoose.models.CourseEnrollment ||
  mongoose.model('CourseEnrollment', courseEnrollmentSchema);

export default CourseEnrollment;
