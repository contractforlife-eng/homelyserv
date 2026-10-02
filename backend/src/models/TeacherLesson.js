// backend/src/models/TeacherLesson.js
// ============================================================
// TEACHER LESSON MODEL
//
// Represents an actual lesson scheduled, conducted, or cancelled
// by a Teacher.
//
// LESSON TYPES:
// - ONE_ON_ONE: Must have studentId (ref: TeacherStudent). groupId = null.
// - GROUP: Must have groupId (ref: TeacherGroup). studentId = null.
//   Enrolled students are dynamically derived from TeacherGroupEnrollment.
//
// ATTENDANCE:
// Stored as an array of attendance records:
//   [{ studentId, status: 'PRESENT'|'ABSENT'|'EXCUSED'|'NOT_RECORDED', note }]
// For ONE_ON_ONE, exactly one entry matching studentId.
// For GROUP, entries referencing existing TeacherStudent IDs actively enrolled in the group.
//
// HOMEWORK:
// Lightweight assignment/homework metadata:
//   { title, description, dueDate, isCompleted }
//
// TENANCY:
// Every lesson belongs strictly to `teacherId: req.userId`.
// ============================================================
import mongoose from 'mongoose';

const attendanceItemSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      required: true
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'EXCUSED', 'NOT_RECORDED'],
      default: 'NOT_RECORDED'
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    }
  },
  { _id: false }
);

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    dueDate: {
      type: Date,
      default: null
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const teacherLessonSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    lessonType: {
      type: String,
      enum: ['ONE_ON_ONE', 'GROUP'],
      required: true,
      index: true
    },
    // Nullable if GROUP
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      default: null,
      index: true
    },
    // Nullable if ONE_ON_ONE
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherGroup',
      default: null,
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
      type: String, // HH:mm format, e.g. "15:30"
      required: true,
      trim: true,
      maxlength: 10
    },
    lessonStatus: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'SCHEDULED',
      index: true
    },
    attendance: {
      type: [attendanceItemSchema],
      default: []
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    homework: {
      type: homeworkSchema,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'teacher_lessons'
  }
);

// Primary list query index: active lessons for a teacher sorted by date and time
teacherLessonSchema.index(
  { teacherId: 1, isActive: 1, date: -1, startTime: -1 },
  { name: 'teacher_lesson_list' }
);

// Querying lessons for a specific group
teacherLessonSchema.index(
  { groupId: 1, isActive: 1, date: -1 },
  { sparse: true, name: 'teacher_group_lessons' }
);

// Querying lessons for a specific 1-on-1 student
teacherLessonSchema.index(
  { studentId: 1, isActive: 1, date: -1 },
  { sparse: true, name: 'teacher_student_lessons' }
);

const TeacherLesson =
  mongoose.models.TeacherLesson ||
  mongoose.model('TeacherLesson', teacherLessonSchema);

export default TeacherLesson;
