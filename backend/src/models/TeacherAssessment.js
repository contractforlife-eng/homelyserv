// backend/src/models/TeacherAssessment.js
// ============================================================
// TEACHER ASSESSMENT MODEL
//
// Represents an academic evaluation, quiz, exam, assignment, or project
// score recorded by a Teacher for an individual student.
//
// TENANCY:
// Every assessment belongs strictly to `teacherId: req.userId`.
// Teachers can never read, modify, or delete each other's assessments.
//
// CONSTRAINTS:
// - score >= 0
// - maxScore > 0
// - score <= maxScore
// - percentage = (score / maxScore) * 100
// ============================================================
import mongoose from 'mongoose';

export const TEACHER_ASSESSMENT_TYPES = Object.freeze([
  'EXAM',
  'QUIZ',
  'ASSIGNMENT',
  'PROJECT',
  'ORAL',
  'OTHER'
]);

const teacherAssessmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      required: true,
      index: true
    },
    // Optional reference to a group/class the student is enrolled in
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherGroup',
      default: null,
      index: true
    },
    // Optional reference to a scheduled lesson
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherLesson',
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    assessmentType: {
      type: String,
      enum: {
        values: TEACHER_ASSESSMENT_TYPES,
        message: 'Invalid assessment type'
      },
      default: 'QUIZ',
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative']
    },
    maxScore: {
      type: Number,
      required: true,
      min: [0.01, 'Max score must be greater than zero'],
      default: 100
    },
    percentage: {
      type: Number,
      required: true,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100']
    },
    grade: {
      type: String,
      default: '',
      trim: true,
      maxlength: 20
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
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
    collection: 'teacher_assessments'
  }
);

// Primary index: query active assessments for a student under a teacher sorted by date
teacherAssessmentSchema.index(
  { teacherId: 1, studentId: 1, isActive: 1, date: -1 },
  { name: 'teacher_student_assessment_list' }
);

// Overview / filter index by teacher, subject, type, and date
teacherAssessmentSchema.index(
  { teacherId: 1, isActive: 1, subject: 1, assessmentType: 1, date: -1 },
  { name: 'teacher_assessment_overview' }
);

// Pre-validate hook to enforce score <= maxScore and calculate percentage
teacherAssessmentSchema.pre('validate', function () {
  if (typeof this.score === 'number' && typeof this.maxScore === 'number') {
    if (this.maxScore <= 0) {
      this.invalidate('maxScore', 'Max score must be greater than 0');
    } else if (this.score > this.maxScore) {
      this.invalidate('score', 'Score cannot be greater than max score');
    } else if (this.score < 0) {
      this.invalidate('score', 'Score cannot be negative');
    } else {
      // Compute percentage with 2 decimals precision
      const rawPct = (this.score / this.maxScore) * 100;
      this.percentage = Math.round(rawPct * 100) / 100;
    }
  }
});

const TeacherAssessment =
  mongoose.models.TeacherAssessment ||
  mongoose.model('TeacherAssessment', teacherAssessmentSchema);

export default TeacherAssessment;
