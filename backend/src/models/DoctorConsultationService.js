// backend/src/models/DoctorConsultationService.js
import mongoose from 'mongoose';

export const DOCTOR_CONSULTATION_TYPES = Object.freeze(['CLINIC', 'HOME_VISIT', 'ONLINE']);

const doctorConsultationServiceSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorClinic',
      default: null,
      index: true
    },
    consultationType: {
      type: String,
      required: true,
      enum: {
        values: DOCTOR_CONSULTATION_TYPES,
        message: 'Invalid doctor consultation type'
      },
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    followUpWindowDays: {
      type: Number,
      default: 0,
      min: [0, 'Follow-up window days cannot be negative'],
      max: [90, 'Follow-up window days cannot exceed 90']
    },
    followUpPrice: {
      type: Number,
      default: 0,
      min: [0, 'Follow-up price cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'doctor_consultation_services'
  }
);

// Compound index for querying doctor services by consultation type
doctorConsultationServiceSchema.index({ doctorId: 1, consultationType: 1 });

const DoctorConsultationService = mongoose.models.DoctorConsultationService || mongoose.model('DoctorConsultationService', doctorConsultationServiceSchema);

export default DoctorConsultationService;
