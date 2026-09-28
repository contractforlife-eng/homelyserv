// backend/src/models/PatientMedicalProfile.js
// Dedicated Mongoose model for User-authored My Medical Profile.
//
// Ownership: userId (Worker, Employer, Teacher, Student).
// Separate from User, WorkerProfile, EmployerProfile.
// Default privacy: consentToShareWithDoctors is FALSE.
import mongoose from 'mongoose';

export const SEX_VALUES = ['MALE', 'FEMALE', 'OTHER'];
export const BLOOD_GROUP_VALUES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SMOKING_STATUS_VALUES = ['NEVER', 'FORMER', 'CURRENT'];

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    }
  },
  { _id: false }
);

const patientMedicalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    sex: {
      type: String,
      enum: {
        values: [...SEX_VALUES, null, ''],
        message: 'Invalid sex value'
      },
      default: null
    },
    bloodGroup: {
      type: String,
      enum: {
        values: [...BLOOD_GROUP_VALUES, null, ''],
        message: 'Invalid blood group value'
      },
      default: null
    },
    heightCm: {
      type: Number,
      default: null,
      min: 30,
      max: 300
    },
    weightKg: {
      type: Number,
      default: null,
      min: 1,
      max: 500
    },
    chronicConditions: {
      type: [String],
      default: []
    },
    allergies: {
      type: [String],
      default: []
    },
    currentMedications: {
      type: [String],
      default: []
    },
    surgeries: {
      type: [String],
      default: []
    },
    familyHistory: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    smokingStatus: {
      type: String,
      enum: {
        values: [...SMOKING_STATUS_VALUES, null, ''],
        message: 'Invalid smoking status value'
      },
      default: null
    },
    disabilityStatus: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({ name: '', relationship: '', phone: '' })
    },
    // CRITICAL PRIVACY: default must be false.
    // Creating/updating profile never automatically shares with Doctors.
    consentToShareWithDoctors: {
      type: Boolean,
      default: false
    },
    lastReviewedAt: {
      type: Date,
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
    collection: 'patient_medical_profiles'
  }
);

patientMedicalProfileSchema.index({ userId: 1, isActive: 1 });

const PatientMedicalProfile =
  mongoose.models.PatientMedicalProfile ||
  mongoose.model('PatientMedicalProfile', patientMedicalProfileSchema);

export default PatientMedicalProfile;
