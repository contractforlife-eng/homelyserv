// backend/src/models/DoctorConsultationRecord.js
import mongoose from 'mongoose';
import { DOCTOR_CONSULTATION_TYPES } from './DoctorConsultationService.js';

export const CONSULTATION_RECORD_STATUSES = Object.freeze(['DRAFT', 'SIGNED', 'AMENDED']);

const diagnosisItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    icdCode: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    }
  },
  { _id: false }
);

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ''
    },
    heartRate: {
      type: Number,
      min: 20,
      max: 300,
      default: null
    },
    respiratoryRate: {
      type: Number,
      min: 4,
      max: 100,
      default: null
    },
    temperature: {
      type: Number,
      min: 25,
      max: 45,
      default: null
    },
    oxygenSaturation: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    weightKg: {
      type: Number,
      min: 1,
      max: 500,
      default: null
    },
    heightCm: {
      type: Number,
      min: 30,
      max: 300,
      default: null
    }
  },
  { _id: false }
);

const doctorConsultationRecordSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // HomelyServ patient (a User). Optional at the schema level so a
    // ClinicPatient consultation can omit it; the `exactlyOnePatientSource`
    // validator below guarantees exactly one of the two is always set.
    // Existing HomelyServ consultations (patientId set) remain valid.
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Doctor-owned clinic patient (additive, Phase 2B+). A ClinicPatient may
    // be a walk-in with no HomelyServ account. `linkedUserId` is NEVER used
    // for ownership or for this association.
    clinicPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicPatient',
      default: null,
      index: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorAppointment',
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
        message: 'Invalid consultation type'
      },
      index: true
    },
    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    history: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ''
    },
    examination: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ''
    },
    diagnosis: {
      type: [diagnosisItemSchema],
      default: []
    },
    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ''
    },
    vitals: {
      type: vitalsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: CONSULTATION_RECORD_STATUSES,
        message: 'Invalid consultation record status'
      },
      default: 'DRAFT',
      index: true
    },
    signedAt: {
      type: Date,
      default: null
    },
    createdByRole: {
      type: String,
      default: 'DOCTOR'
    },
    amendedRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorConsultationRecord',
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'doctor_consultation_records'
  }
);

// A consultation must reference EXACTLY ONE patient source:
//   patientId (HomelyServ User)  XOR  clinicPatientId (ClinicPatient).
// Enforced at the schema level so no code path can persist a
// patientless or ambiguous consultation. Existing HomelyServ
// consultations (patientId set, clinicPatientId null) stay valid.
// NOTE: Mongoose 9 does NOT pass a callable `next` to pre('validate')
// hooks — the hook must throw instead.
doctorConsultationRecordSchema.pre('validate', function enforceExactlyOnePatientSource() {
  const hasUser = Boolean(this.patientId);
  const hasClinic = Boolean(this.clinicPatientId);
  if (hasUser && hasClinic) {
    throw new Error(
      'A consultation must reference exactly one patient: provide either patientId or clinicPatientId, not both'
    );
  }
  if (!hasUser && !hasClinic) {
    throw new Error(
      'A consultation requires a patient: provide either patientId or clinicPatientId'
    );
  }
});

// Compound indexes for querying and uniqueness safeguards
doctorConsultationRecordSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });
doctorConsultationRecordSchema.index({ doctorId: 1, clinicPatientId: 1, createdAt: -1 });
doctorConsultationRecordSchema.index({ appointmentId: 1, status: 1 });
doctorConsultationRecordSchema.index({ amendedRecordId: 1 });

const DoctorConsultationRecord =
  mongoose.models.DoctorConsultationRecord ||
  mongoose.model('DoctorConsultationRecord', doctorConsultationRecordSchema);

export default DoctorConsultationRecord;
