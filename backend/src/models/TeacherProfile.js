// backend/src/models/TeacherProfile.js
import mongoose from 'mongoose';
import { CANONICAL_TEACHER_SUBJECTS, CANONICAL_TEACHING_LEVELS, CANONICAL_TEACHING_METHODS } from '../constants/teacherTaxonomy.js';

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    mainSubject: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function(val) {
          if (!val) return true;
          return CANONICAL_TEACHER_SUBJECTS.includes(val);
        },
        message: 'Invalid teacher subject'
      }
    },
    additionalSubjects: {
      type: [String],
      default: [],
      validate: {
        validator: function(vals) {
          if (!Array.isArray(vals)) return false;
          return vals.every((val) => CANONICAL_TEACHER_SUBJECTS.includes(val));
        },
        message: 'Invalid teacher additional subject'
      }
    },
    specialization: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    teachingLevels: {
      type: [String],
      default: [],
      validate: {
        validator: function(vals) {
          if (!Array.isArray(vals)) return false;
          return vals.every((val) => CANONICAL_TEACHING_LEVELS.includes(val));
        },
        message: 'Invalid teaching level'
      }
    },
    teachingMethod: {
      type: String,
      default: 'both',
      trim: true,
      validate: {
        validator: function(val) {
          if (!val) return true;
          return CANONICAL_TEACHING_METHODS.includes(val);
        },
        message: 'Invalid teaching method'
      }
    },
    experienceSummary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative'],
      max: [70, 'Years of experience must not exceed 70']
    },
    languages: {
      type: [String],
      default: []
    },
    qualifications: {
      type: [String],
      default: []
    },
    education: {
      type: [String],
      default: []
    },
    certifications: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: [0, 'Hourly rate cannot be negative'],
      max: [1000000, 'Hourly rate must not exceed 1000000']
    },
    lessonRate: {
      type: Number,
      default: 0,
      min: [0, 'Lesson rate cannot be negative'],
      max: [1000000, 'Lesson rate must not exceed 1000000']
    },
    pricingCurrency: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
      maxlength: 3
    },
    profileImage: {
      type: String,
      default: ''
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    availableForNewStudents: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: 'teacher_profiles',
    timestamps: true
  }
);

const TeacherProfile = mongoose.models.TeacherProfile || mongoose.model('TeacherProfile', teacherProfileSchema);

export default TeacherProfile;
