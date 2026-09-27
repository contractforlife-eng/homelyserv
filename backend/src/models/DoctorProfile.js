// backend/src/models/DoctorProfile.js
import mongoose from 'mongoose';
import { CANONICAL_DOCTOR_SPECIALTIES } from '../constants/doctorSpecialties.js';

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    professionalTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    specialty: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function(val) {
          if (!val) return true;
          return CANONICAL_DOCTOR_SPECIALTIES.includes(val);
        },
        message: 'Invalid doctor specialty'
      }
    },
    subspecialty: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
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
      min: [0, 'Years of experience cannot be negative']
    },
    languages: {
      type: [String],
      default: []
    },
    qualifications: {
      type: [String],
      default: []
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    licenseAuthority: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150
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
    searchVisibility: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'doctor_profiles',
    timestamps: true
  }
);

const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
