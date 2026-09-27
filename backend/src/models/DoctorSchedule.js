// backend/src/models/DoctorSchedule.js
import mongoose from 'mongoose';
import { DOCTOR_CONSULTATION_TYPES } from './DoctorConsultationService.js';

const doctorScheduleSchema = new mongoose.Schema(
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorConsultationService',
      default: null,
      index: true
    },
    consultationType: {
      type: String,
      required: true,
      enum: {
        values: DOCTOR_CONSULTATION_TYPES,
        message: 'Invalid doctor consultation type'
      }
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: [0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'],
      max: [6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'],
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format']
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format']
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Slot duration must be at least 5 minutes'],
      max: [240, 'Slot duration cannot exceed 240 minutes']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'doctor_schedules'
  }
);

// Compound index for querying doctor schedule by day of week
doctorScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 });

const DoctorSchedule = mongoose.models.DoctorSchedule || mongoose.model('DoctorSchedule', doctorScheduleSchema);

export default DoctorSchedule;
