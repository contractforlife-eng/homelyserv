// backend/src/models/DoctorEmployee.js
// ============================================================
// DOCTOR EMPLOYEE (Doctor Accounts — internal clinic staffing)
// ============================================================
// An INTERNAL, Doctor-scoped record of one of the doctor's own employees.
//
// This is NOT a HomelyServ account:
//   - The employee is NOT a platform `User` and has no login/identity here.
//   - It is NOT linked to Worker/Employer profiles, hiring, wages payouts,
//     `WorkerEarning`, `Hire`, or any subscription or payment flow.
//   - NOT wired to PayPal, Paymob, Stripe or any other gateway.
//
// It exists purely so the doctor can record who works in their clinic, on
// what terms, so a later step can total salary cost. This step only STORES
// the salary accurately: nothing is paid, accrued, or turned into
// an Expense/Income record here.
//
// SALARY SEMANTICS: `salary` is a FIXED MONTHLY salary — the amount earned for
// EACH eligible calendar month. It is never prorated by elapsed or calendar
// days: a month started on the 15th still earns the full month, and `startDate`
// acts only as a month eligibility boundary (months entirely before the start
// month earn nothing). Advances and penalties are separate records that affect
// NET pay, never this figure.
//
// OWNERSHIP / TENANCY:
//   `doctorId` is ALWAYS assigned from the authenticated `req.userId` by
//   the controller. It is never read from a request body, query string or
//   URL parameter, and PATCH can never change it. Every read/update/delete
//   query is scoped by `{ doctorId: req.userId }`, so one doctor can never
//   observe or modify another doctor's employees.
// ============================================================
import mongoose from 'mongoose';

const doctorEmployeeSchema = new mongoose.Schema(
  {
    // Canonical tenant key (TEACHER / DOCTOR owner user id).
    ownerUserId: {
      type: String,
      default: null,
      index: true
    },
    // Which portal owns the record (TEACHER / DOCTOR). Display only.
    ownerRole: {
      type: String,
      default: 'DOCTOR',
      trim: true,
      uppercase: true
    },
    // LEGACY tenant key: preserved so the existing doctor_employees
    // records keep working untouched; written for doctor-owned employees.
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Stable reference to the Hire this employee came from (idempotency).
    hireId: {
      type: String,
      default: null,
      index: true
    },
    // Canonical Worker account id (WorkerProfile.userId) behind the Hire.
    workerUserId: {
      type: String,
      default: null,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    // The employee's recurring salary amount. Stored only. A plain
    // non-negative number bounded above, so no monetary value is ever
    // derived by accumulating floating-point arithmetic (same rule as
    // DoctorProfile.consultationFee).
    salary: {
      type: Number,
      required: true,
      min: [0, 'Salary cannot be negative'],
      max: [1000000, 'Salary must not exceed 1000000']
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    // A real employment status, NOT a soft-delete flag: an inactive
    // employee is simply no longer currently on staff.
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    // Employment end marker for the activate/deactivate/terminate lifecycle.
    // `isActive` alone cannot distinguish a temporary pause from a permanent
    // end of employment, so a single optional timestamp is stored alongside it
    // rather than introducing a second status enum. Absence of the field on
    // legacy records behaves exactly like `null` (still employable).
    //
    //   ACTIVE     -> isActive: true,  terminatedAt: null
    //   INACTIVE   -> isActive: false, terminatedAt: null
    //   TERMINATED -> isActive: false, terminatedAt: <timestamp>
    //
    // History is never deleted: this only stops future salary periods from
    // accruing, since doctorAccountsController reads `isActive: true`.
    terminatedAt: {
      type: Date,
      default: null
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
    collection: 'doctor_employees'
  }
);

// Active-staff counts and the ?isActive= list filter.
doctorEmployeeSchema.index({ doctorId: 1, isActive: 1 });
// Default deterministic listing order (startDate DESC) and any future
// date-windowed salary figures.
doctorEmployeeSchema.index({ doctorId: 1, startDate: -1 });

const DoctorEmployee =
  mongoose.models.DoctorEmployee ||
  mongoose.model('DoctorEmployee', doctorEmployeeSchema);

export default DoctorEmployee;
