// backend/src/models/StudentProfile.js
// ============================================================
// STUDENT PROFILE MODEL
//
// Represents the personal and academic profile of an authenticated
// Student user in HomelyServ.
//
// OWNERSHIP / TENANCY:
// Exactly 1:1 with User (role: STUDENT).
// `userId` / `studentId` references the User document.
// Teachers manage their own class rosters in TeacherStudent,
// which bridges to this Student user via TeacherStudent.linkedUserId.
// ============================================================
import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
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
    school: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160
    },
    gradeLevel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    educationLevel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    subjects: {
      type: [String],
      default: []
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
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'student_profiles'
  }
);

const StudentProfile =
  mongoose.models.StudentProfile ||
  mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;
