// backend/src/models/DoctorClinic.js
import mongoose from 'mongoose';

const doctorClinicSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
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
      maxlength: 100
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    stateOrProvince: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    postalCode: {
      type: String,
      default: '',
      trim: true,
      maxlength: 20
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
      maxlength: 50
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'doctor_clinics'
  }
);

// Compound index for finding active clinics per doctor
doctorClinicSchema.index({ doctorId: 1, isActive: 1 });

const DoctorClinic = mongoose.models.DoctorClinic || mongoose.model('DoctorClinic', doctorClinicSchema);

export default DoctorClinic;
