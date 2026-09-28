// backend/src/models/DoctorAppointment.js
import mongoose from 'mongoose';
import { DOCTOR_CONSULTATION_TYPES } from './DoctorConsultationService.js';

export const APPOINTMENT_STATUSES = Object.freeze([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
]);

const doctorAppointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // HomelyServ patient (a User). Present for legacy appointments.
    // OPTIONAL at the schema level so ClinicPatient appointments can omit
    // it; the `exactlyOnePatientSource` validator below guarantees that
    // exactly one of patientId / clinicPatientId is always set, so an
    // appointment can never be left with no patient.
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Doctor-owned clinic patient (Phase 2B). Additive and optional.
    // A ClinicPatient may be a walk-in with no HomelyServ account.
    // `linkedUserId` on the ClinicPatient is NEVER used for ownership.
    clinicPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicPatient',
      default: null,
      index: true
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorSchedule',
      default: null,
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
    startsAt: {
      type: Date,
      required: true,
      index: true
    },
    endsAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: 'Invalid appointment status'
      },
      default: 'PENDING',
      index: true
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    feeSnapshot: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative']
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'doctor_appointments'
  }
);

// Mongoose 9 (>=9.0) does NOT pass a callable `next` to pre('validate')
// hooks — the hook must throw (or return a rejected promise) instead. Using
// `next(new Error(...))` here silently broke EVERY appointment create.
// An appointment must reference EXACTLY ONE patient source:
//   patientId (HomelyServ User)  XOR  clinicPatientId (ClinicPatient).
// This is enforced at the schema level so no code path — controller or
// direct model use — can persist an appointment with no patient, or with
// both. Existing HomelyServ appointments (patientId set, clinicPatientId
// null) remain fully valid.
doctorAppointmentSchema.pre('validate', function enforceExactlyOnePatientSource() {
  const hasUser = Boolean(this.patientId);
  const hasClinic = Boolean(this.clinicPatientId);
  if (hasUser && hasClinic) {
    throw new Error(
      'An appointment must reference exactly one patient: provide either patientId or clinicPatientId, not both'
    );
  }
  if (!hasUser && !hasClinic) {
    throw new Error(
      'An appointment requires a patient: provide either patientId or clinicPatientId'
    );
  }
});

// Compound index for querying doctor appointments by status and time
doctorAppointmentSchema.index({ doctorId: 1, status: 1, startsAt: 1 });
// Compound index for finding doctor appointment overlaps
doctorAppointmentSchema.index({ doctorId: 1, startsAt: 1, endsAt: 1 });
// Compound index for querying patient appointments
doctorAppointmentSchema.index({ patientId: 1, startsAt: 1 });
// ClinicPatient appointment lookups (Patient File + ownership scoping)
doctorAppointmentSchema.index({ clinicPatientId: 1, startsAt: 1 });

const DoctorAppointment = mongoose.models.DoctorAppointment || mongoose.model('DoctorAppointment', doctorAppointmentSchema);

export default DoctorAppointment;
