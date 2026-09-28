// backend/src/models/MedicalAccessLog.js
// Dedicated Mongoose model for immutable audit logging of Medical Profile access.
//
// Records ACCESS events (who accessed which patient's medical profile and when).
// Never stores medical content/snapshots.
// Append-only: no update or delete routes exist.
import mongoose from 'mongoose';

export const MEDICAL_ACCESS_ACTIONS = Object.freeze(['VIEW_MEDICAL_PROFILE']);

const medicalAccessLogSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medicalProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientMedicalProfile',
      required: true,
      index: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorAppointment',
      default: null
    },
    action: {
      type: String,
      enum: MEDICAL_ACCESS_ACTIONS,
      default: 'VIEW_MEDICAL_PROFILE',
      required: true
    },
    accessedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false,
    collection: 'medical_access_logs'
  }
);

// Compound indexes for performant audit queries
medicalAccessLogSchema.index({ doctorId: 1, accessedAt: -1 });
medicalAccessLogSchema.index({ patientId: 1, accessedAt: -1 });
medicalAccessLogSchema.index({ medicalProfileId: 1, accessedAt: -1 });

const MedicalAccessLog =
  mongoose.models.MedicalAccessLog ||
  mongoose.model('MedicalAccessLog', medicalAccessLogSchema);

export default MedicalAccessLog;
