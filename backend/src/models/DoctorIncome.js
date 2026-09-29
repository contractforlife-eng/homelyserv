// backend/src/models/DoctorIncome.js
// ============================================================
// DOCTOR INCOME (Doctor Accounts — internal clinic accounting)
// ============================================================
// An INTERNAL, Doctor-scoped ledger of money the doctor/clinic has
// ACTUALLY RECEIVED. Bookkeeping only.
//
// NOT a payment system: NOT wired to PayPal, Paymob, Stripe, Vodafone
// Cash, InstaPay, bank transfer or any other gateway. NOT linked to the
// HomelyServ `Payment` model, `AccountingEntry`, Worker earnings, hiring
// commissions or subscriptions. NOT derived from appointment status.
//
// WHY THIS IS SEPARATE FROM `DoctorAppointment.feeSnapshot`:
//   `feeSnapshot` is a PRICE SNAPSHOT copied onto the appointment at
//   creation (doctorAppointmentController.js). It records what the doctor
//   listed, not what was collected, so a CONFIRMED appointment proves
//   nothing about money received. Income here is created only by an
//   explicit doctor action, so "received" is a doctor-attested fact.
//
// STATUS SEMANTICS (recorded here; totals come in a later step):
//   RECEIVED  -> money actually received; counts as income
//   PENDING   -> expected, NOT received; does NOT count as income
//   REFUNDED  -> given back;      does NOT count as income
//
// OWNERSHIP / TENANCY:
//   `doctorId` is ALWAYS assigned from the authenticated `req.userId` by
//   the controller — never read from a body, query string or URL
//   parameter, and PATCH can never change it. Every read/update/delete
//   query is scoped by `{ doctorId: req.userId }`, so one doctor can
//   never observe or modify another doctor's income.
// ============================================================
import mongoose from 'mongoose';

export const DOCTOR_INCOME_SOURCES = Object.freeze([
  'CONSULTATION',
  'CLINIC',
  'OTHER'
]);

export const DOCTOR_INCOME_STATUSES = Object.freeze([
  'RECEIVED',
  'PENDING',
  'REFUNDED'
]);

const doctorIncomeSchema = new mongoose.Schema(
  {
    // Tenant key. Always the authenticated doctor (req.userId).
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Money actually received by the doctor/clinic.
    amount: {
      type: Number,
      required: true,
      min: [0, 'Income amount cannot be negative'],
      max: [1000000, 'Income amount must not exceed 1000000']
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    // The date the money was received. Deliberately NOT the appointment
    // date: income belongs to the day the cash actually arrived.
    incomeDate: {
      type: Date,
      required: true,
      index: true
    },
    // How the money arrived.
    source: {
      type: String,
      required: true,
      enum: {
        values: DOCTOR_INCOME_SOURCES,
        message: 'Invalid income source'
      },
      index: true
    },
    // Optional link to one of this doctor's appointments. An appointment
    // is a PRICE reference only — linking it never creates income itself.
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorAppointment',
      default: null,
      index: true
    },
    // Optional patient reference. For `source: 'CONSULTATION'` exactly
    // one of `patientId` / `clinicPatientId` is required (enforced below).
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    clinicPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicPatient',
      default: null,
      index: true
    },
    // RECEIVED = money actually received. PENDING / REFUNDED are not income.
    status: {
      type: String,
      enum: {
        values: DOCTOR_INCOME_STATUSES,
        message: 'Invalid income status'
      },
      default: 'RECEIVED',
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    collection: 'doctor_income'
  }
);

// Mongoose 9 (>=9.0) does NOT pass a callable `next` to pre('validate')
// hooks — the hook must throw, exactly as in DoctorAppointment.js.
// CONSULTATION income is money for a specific person, so it must name
// exactly ONE patient source. This is deliberately NOT applied to CLINIC
// or OTHER income, which may be unattributed (e.g. a supply refund).
doctorIncomeSchema.pre('validate', function enforceConsultationPatientSource() {
  if (this.source !== 'CONSULTATION') return;
  const hasUser = Boolean(this.patientId);
  const hasClinic = Boolean(this.clinicPatientId);
  if (hasUser && hasClinic) {
    throw new Error(
      'Consultation income must reference exactly one patient: provide either patientId or clinicPatientId, not both'
    );
  }
  if (!hasUser && !hasClinic) {
    throw new Error(
      'Consultation income requires a patient: provide either patientId or clinicPatientId'
    );
  }
});

// APPOINTMENT DUPLICATE PROTECTION.
// At most ONE income record may reference a given appointment, so the
// same appointment can never be counted twice. This is a PARTIAL unique
// index: records with `appointmentId: null` (unlinked CLINIC / OTHER
// income) are exempt and stay unlimited, which a plain unique index
// could not express. Follows the partial-index convention in
// PublicSupportMessage.js and the named-unique style in
// DoctorPatientLink.js.
doctorIncomeSchema.index(
  { appointmentId: 1 },
  {
    unique: true,
    partialFilterExpression: { appointmentId: { $type: 'objectId' } },
    name: 'doctor_income_appointment_unique'
  }
);

// Default listing/date-filter query: this doctor's income, newest first.
doctorIncomeSchema.index({ doctorId: 1, incomeDate: -1 });
// "Which income is not yet real money?" — future status-filtered totals.
doctorIncomeSchema.index({ doctorId: 1, status: 1, incomeDate: -1 });
// Appointment-ownership verification + duplicate checks.
doctorIncomeSchema.index({ doctorId: 1, appointmentId: 1 });

const DoctorIncome =
  mongoose.models.DoctorIncome ||
  mongoose.model('DoctorIncome', doctorIncomeSchema);

export default DoctorIncome;
