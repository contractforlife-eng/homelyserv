// backend/src/models/DoctorPatientLink.js
// ============================================================
// DOCTOR PATIENT LINK
// Explicit, doctor-created HomelyServ member/patient relationship
// for the HomelyServ Medical Center.
//
// Scope and safety:
//  - The doctor can add a patient ONLY when a real HomelyServ
//    DoctorAppointment exists between them (any status). This link
//    NEVER grants global access to arbitrary users; it only records
//    an explicit doctor-side association for patients the doctor
//    already has appointment business with.
//  - Every medical-data authorization path (medical profile access,
//    consultations, prescriptions) continues to route through
//    hasValidDoctorPatientRelationship() in doctorPatientAccessService,
//    which consults this model IN ADDITION to the appointment rule.
//    Medical data therefore requires the same relationship +
//    consent + Premium + MedicalAccessLog machinery as before.
// ============================================================
import mongoose from 'mongoose';

const doctorPatientLinkSchema = new mongoose.Schema(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'doctor_patient_links'
  }
);

// One active link per doctor/patient pair.
doctorPatientLinkSchema.index(
  { doctorId: 1, patientId: 1 },
  { unique: true, name: 'doctor_patient_link_unique' }
);

const DoctorPatientLink =
  mongoose.models.DoctorPatientLink ||
  mongoose.model('DoctorPatientLink', doctorPatientLinkSchema);

export default DoctorPatientLink;
