// backend/src/models/ClinicPatientMedicalRecord.js
// ============================================================
// CLINIC PATIENT MEDICAL RECORD (doctor-maintained)
//
// This is the PERSISTENT medical background that the DOCTOR keeps
// for one of their own ClinicPatient records.
//
// IT IS NOT `PatientMedicalProfile`:
//   - PatientMedicalProfile is PATIENT-authored self-service data
//     (owned by a HomelyServ User) and is gated behind patient
//     consent + patient Premium.
//   - This record is DOCTOR-authored, scoped to a ClinicPatient that
//     may have no HomelyServ account at all, and needs no consent or
//     Premium because the patient never authored it.
//   - The two are never read interchangeably and never share a
//     collection.
//
// CLINICAL BOUNDARY (important):
// This record holds ONLY persistent background. It deliberately has
// NO diagnosis history, NO treatment plans, NO examination findings,
// NO visit symptoms, NO visit vitals, NO prescriptions and NO
// appointments. Those are per-encounter concerns and belong to the
// future clinical/encounter entities.
//
// OWNERSHIP:
// Every read/write MUST be scoped by `doctorId` AND
// `clinicPatientId`. A ClinicPatient's optional `linkedUserId` NEVER
// grants access to this record — only the owning doctor does.
// ============================================================
import mongoose from 'mongoose';

export const CLINIC_RECORD_SMOKING_STATUSES = ['NEVER', 'FORMER', 'CURRENT', 'UNKNOWN'];

// Reusable string-array field (mirrors PatientMedicalProfile conventions).
const stringList = (maxItemLength) => ({
  type: [String],
  default: [],
  validate: {
    validator(values) {
      return values.every((v) => typeof v === 'string' && v.length <= maxItemLength);
    },
    message: 'Invalid list entry'
  }
});

const clinicPatientMedicalRecordSchema = new mongoose.Schema(
  {
    clinicPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicPatient',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ---- Medical History (persistent) ----
    chronicConditions: stringList(200),
    allergies: stringList(200),
    currentMedications: stringList(200),
    previousSurgeries: stringList(200),
    familyHistory: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    smokingStatus: {
      type: String,
      enum: {
        values: [...CLINIC_RECORD_SMOKING_STATUSES, null, ''],
        message: 'Invalid smoking status'
      },
      default: 'UNKNOWN'
    },
    disabilityStatus: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    otherMedicalHistory: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ''
    },

    // ---- Clinical Summary (persistent) ----
    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ''
    },
    importantConditions: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'clinic_patient_medical_records'
  }
);

// ONE medical record per doctor + clinic patient. Enforced at the DB
// level so a race between two requests cannot create a duplicate.
clinicPatientMedicalRecordSchema.index(
  { doctorId: 1, clinicPatientId: 1 },
  { unique: true, name: 'clinic_record_doctor_patient_unique' }
);

clinicPatientMedicalRecordSchema.index({ clinicPatientId: 1 });

const ClinicPatientMedicalRecord =
  mongoose.models.ClinicPatientMedicalRecord ||
  mongoose.model('ClinicPatientMedicalRecord', clinicPatientMedicalRecordSchema);

export default ClinicPatientMedicalRecord;
