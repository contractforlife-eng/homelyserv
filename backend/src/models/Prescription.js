// backend/src/models/Prescription.js
import mongoose from 'mongoose';

export const PRESCRIPTION_STATUSES = Object.freeze(['DRAFT', 'ISSUED', 'CANCELLED']);

const prescriptionItemSchema = new mongoose.Schema(
  {
    drugName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    strength: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    form: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '' // e.g. Tablet, Syrup, Capsule, Ointment, Inhaler, Drops
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150 // e.g. 1 tablet, 5 ml
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150 // e.g. Twice daily after meals
    },
    duration: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100 // e.g. 7 days, 1 month
    },
    quantity: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '' // e.g. 14 tablets, 1 bottle
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '' // Special precautions
    }
  },
  { _id: false }
);

const documentSnapshotSchema = new mongoose.Schema(
  {
    doctor: {
      fullName: { type: String, default: '' },
      professionalRole: { type: String, default: 'DOCTOR' },
      professionalTitle: { type: String, default: '' },
      specialty: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    patient: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      city: { type: String, default: '' },
      countryName: { type: String, default: '' }
    },
    clinic: {
      clinicName: { type: String, default: '' },
      addressLine: { type: String, default: '' },
      city: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    consultation: {
      consultationType: { type: String, default: '' },
      appointmentDate: { type: String, default: '' },
      diagnosisSummary: { type: String, default: '' }
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    consultationRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorConsultationRecord',
      required: true,
      index: true
    },
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
    issuedAt: {
      type: Date,
      default: null,
      index: true
    },
    validUntil: {
      type: Date,
      default: null
    },
    items: {
      type: [prescriptionItemSchema],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    followUpDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: PRESCRIPTION_STATUSES,
        message: 'Invalid prescription status'
      },
      default: 'DRAFT',
      index: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    documentSnapshot: {
      type: documentSnapshotSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    collection: 'prescriptions'
  }
);

prescriptionSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });
prescriptionSchema.index({ consultationRecordId: 1, status: 1 });

const Prescription =
  mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
