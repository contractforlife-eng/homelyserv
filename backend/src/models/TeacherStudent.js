// backend/src/models/TeacherStudent.js
// ============================================================
// TEACHER STUDENT (Teacher-owned student record)
//
// A TeacherStudent is an INDEPENDENT student record owned by a
// Teacher. It supports both:
//   - External Student: linkedUserId = null (account-less student)
//   - Homely Student: linkedUserId = ObjectId ref to real User
//
// OWNERSHIP / TENANCY:
// Every student record belongs strictly to `teacherId: req.userId`.
// Teachers can never read or mutate each other's students.
// ============================================================
import mongoose from 'mongoose';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const teacherStudentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Optional bridge to a real HomelyServ account.
    // When populated, the student is a "Homely Student".
    // When null, the student is an "External Student".
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Canonical studentUserId referencing User (kept in sync with linkedUserId)
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // First-class relationship state between Teacher and Student User:
    // PENDING: Teacher added/invited or requested connection
    // ACTIVE: Confirmed / active relationship
    // ENDED: Relationship concluded by teacher or student
    // REJECTED: Declined by student
    relationshipStatus: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'ENDED', 'REJECTED'],
      default: 'ACTIVE',
      index: true
    },
    relationshipStartedAt: {
      type: Date,
      default: Date.now
    },
    relationshipEndedAt: {
      type: Date,
      default: null
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER', null, ''],
        message: 'Invalid gender'
      },
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    city: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      maxlength: 100,
      validate: {
        validator(value) {
          return value === '' || EMAIL_PATTERN.test(value);
        },
        message: 'Invalid email address'
      }
    },
    school: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150
    },
    gradeLevel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    educationLevel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    subjects: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'teacher_students'
  }
);

// Listing a teacher's active students is the primary query pattern
teacherStudentSchema.index(
  { teacherId: 1, isActive: 1, createdAt: -1 },
  { name: 'teacher_student_active_list' }
);

// Look-up for linked HomelyServ user
teacherStudentSchema.index(
  { linkedUserId: 1 },
  { sparse: true, name: 'teacher_student_linked_user' }
);

// Compound index for teacher + student user uniqueness and lookups
teacherStudentSchema.index(
  { teacherId: 1, studentUserId: 1 },
  { sparse: true, name: 'teacher_student_user_relationship' }
);

// Pre-save hook: keep linkedUserId and studentUserId synchronized
teacherStudentSchema.pre('save', function (next) {
  if (this.linkedUserId && !this.studentUserId) {
    this.studentUserId = this.linkedUserId;
  } else if (this.studentUserId && !this.linkedUserId) {
    this.linkedUserId = this.studentUserId;
  }
  next();
});

// Text/filter search index on name and school
teacherStudentSchema.index(
  { teacherId: 1, fullName: 1 },
  { name: 'teacher_student_name_search' }
);

const TeacherStudent =
  mongoose.models.TeacherStudent ||
  mongoose.model('TeacherStudent', teacherStudentSchema);

export default TeacherStudent;
