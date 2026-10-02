// backend/src/models/TeacherGroupEnrollment.js
// ============================================================
// TEACHER GROUP ENROLLMENT MODEL
//
// Relational junction between a TeacherGroup and a TeacherStudent.
// A student is NEVER duplicated when enrolled into a group.
// The studentId must point to an existing TeacherStudent record.
//
// TENANCY & INTEGRITY:
// - teacherId is stored for rapid single-tenant queries and isolation.
// - A student cannot be actively enrolled twice in the same group.
// - Inactive/removed enrollments can be reactivated without losing history.
// - Deleting an enrollment does NOT delete the TeacherStudent.
// ============================================================
import mongoose from 'mongoose';

const teacherGroupEnrollmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherGroup',
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      required: true,
      index: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DROPPED'],
      default: 'ACTIVE',
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'teacher_group_enrollments'
  }
);

// Primary compound index: enforces single active enrollment per student in a group
teacherGroupEnrollmentSchema.index(
  { groupId: 1, studentId: 1 },
  { name: 'teacher_group_student_enrollment' }
);

// Listing active students in a group
teacherGroupEnrollmentSchema.index(
  { groupId: 1, isActive: 1, status: 1 },
  { name: 'teacher_group_active_students' }
);

// Querying groups a student belongs to
teacherGroupEnrollmentSchema.index(
  { studentId: 1, isActive: 1, status: 1 },
  { name: 'teacher_student_active_groups' }
);

const TeacherGroupEnrollment =
  mongoose.models.TeacherGroupEnrollment ||
  mongoose.model('TeacherGroupEnrollment', teacherGroupEnrollmentSchema);

export default TeacherGroupEnrollment;
