// backend/src/models/Course.js
// ============================================================
// RECORDED COURSES MODEL (HomelyServ LMS Phase 1)
// ============================================================
// Independent teacher-authored recorded video courses.
// Completely separate from live lessons (TeacherLesson) and
// financial records (TeacherIncome).
// ============================================================
import mongoose from 'mongoose';
import {
  CANONICAL_TEACHER_SUBJECTS,
  CANONICAL_TEACHING_LEVELS
} from '../constants/teacherTaxonomy.js';

const lessonSubSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    youtubeUrl: {
      type: String,
      required: true,
      trim: true
    },
    youtubeVideoId: {
      type: String,
      required: true,
      trim: true,
      match: [/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID format']
    },
    order: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 1440
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

const materialSubSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    publicId: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
      max: 10 * 1024 * 1024 // 10MB
    },
    originalFilename: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true,
    timestamps: false
  }
);

const courseSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    },
    subject: {
      type: String,
      required: true,
      enum: {
        values: CANONICAL_TEACHER_SUBJECTS,
        message: 'Invalid teacher subject'
      },
      index: true
    },
    gradeLevel: {
      type: String,
      required: true,
      enum: {
        values: CANONICAL_TEACHING_LEVELS,
        message: 'Invalid teaching level'
      },
      index: true
    },
    gradeSubtitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000000
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    lessons: {
      type: [lessonSubSchema],
      default: []
    },
    materials: {
      type: [materialSubSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'courses'
  }
);

// Composite indexes for discovery and tenancy queries
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ teacherId: 1, createdAt: -1 });
courseSchema.index({ subject: 1, gradeLevel: 1, isPublished: 1 });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
