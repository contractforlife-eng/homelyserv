// backend/src/models/ClinicPatient.js
// ============================================================
// CLINIC PATIENT (independent, doctor-owned patient record)
//
// A Clinic Patient is an INDEPENDENT patient record owned by a
// Doctor/clinic. It does NOT require a HomelyServ User account:
//   - linkedUserId is OPTIONAL and may stay null forever.
//   - Nothing in this schema depends on the existence of a User
//     record. doctorId references the Doctor (a User), but the
//     patient themselves do not need to be a User.
//
// WHY THIS EXISTS
// The pre-existing HomelyServ patient flow derives patients from
// DoctorAppointments and assumes every patient is a User
// (DoctorPatientLink.patientId, DoctorConsultationRecord.patientId,
// Prescription.patientId all use `ref: 'User'`). Those schemas are
// deliberately NOT touched in this phase, so this model lives
// alongside them as a separate, additive entity.
//
// PHASE 1 SCOPE
// This phase only creates, lists, reads and updates the record.
// Appointments, consultations, prescriptions and printing are wired
// up in later phases; see the Phase 2 notes in the controller.
// ============================================================
import mongoose from 'mongoose';

export const CLINIC_PATIENT_SEX_VALUES = ['MALE', 'FEMALE', 'OTHER'];

// Deliberately permissive: accepts an empty string (field is optional)
// and otherwise requires a basic email shape.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clinicPatientSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Optional: the clinic this patient is registered at.
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorClinic',
      default: null,
      index: true
    },
    // Optional bridge to a real HomelyServ account. Null for a purely
    // walk-in clinic patient. Never required.
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fullName: {
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
      maxlength: 100,
      validate: {
        validator(value) {
          return value === '' || EMAIL_PATTERN.test(value);
        },
        message: 'Invalid email address'
      }
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    sex: {
      type: String,
      enum: {
        values: [...CLINIC_PATIENT_SEX_VALUES, null, ''],
        message: 'Invalid sex value'
      },
      default: null
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'clinic_patients'
  }
);

// Listing a doctor's active panel is the primary access pattern.
clinicPatientSchema.index(
  { doctorId: 1, isActive: 1 },
  { name: 'clinic_patient_doctor_active' }
);

// Look-up when a patient is later linked to a HomelyServ account.
// Sparse so the (very common) account-less patients are not indexed.
clinicPatientSchema.index(
  { linkedUserId: 1 },
  { sparse: true, name: 'clinic_patient_linked_user' }
);

// Prevent exact duplicate names per doctor.
clinicPatientSchema.index(
  { doctorId: 1, fullName: 1 },
  { name: 'clinic_patient_doctor_name' }
);

const ClinicPatient =
  mongoose.models.ClinicPatient ||
  mongoose.model('ClinicPatient', clinicPatientSchema);

export default ClinicPatient;
