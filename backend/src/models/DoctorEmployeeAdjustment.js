// backend/src/models/DoctorEmployeeAdjustment.js
// ============================================================
// DOCTOR EMPLOYEE ADJUSTMENT (Doctor Accounts — salary adjustments)
// ============================================================
// An INTERNAL, Doctor-scoped record of a salary adjustment against ONE of the
// doctor's OWN employees. There are exactly two types:
//
//   ADVANCE  — money the doctor paid the employee BEFORE it was earned. It is a
//              recoverable debt, not a cost. It is recovered from future salary
//              and any unpaid remainder carries forward, so a 2,000 advance
//              against a 1,000/month salary settles over several months.
//
//   PENALTY  — a doctor-defined salary deduction (e.g. unauthorized absence).
//              The doctor enters the EXACT amount to deduct. It is NOT a debt,
//              has no outstanding balance and no settlement tracking. Nothing
//              here derives a penalty from salary, a daily rate, absence days
//              or a percentage: the amount is always the doctor's decision.
//
// SCOPE FOR THIS STEP: the record is STORED ONLY. There is no controller, no
// settlement endpoint and no salary calculation yet. `deductedAmount` and
// `status` are defined so the shape is complete, but nothing advances them.
//
// NOT A PAYMENT SYSTEM: NOT wired to PayPal, Paymob, Stripe, Vodafone Cash,
// InstaPay, bank transfer or any other gateway. NOT linked to the HomelyServ
// `Payment` model, `AccountingEntry`, Worker/Employer wages, `WorkerEarning`,
// hiring or subscriptions. Amounts are NEVER converted between currencies.
//
// NOT AN EXPENSE: creating an adjustment NEVER creates or modifies a
// `DoctorExpense`, and NEVER alters `DoctorEmployee`, `DoctorIncome`, the
// prorated `summary.salaryExpense` or `summary.netBalance`. Salary settlement
// (gross - advance recovered - penalty = net) is a LATER step.
//
// CURRENCY: each adjustment keeps its own currency verbatim. The controller
// will later require it to match that employee's salary currency, because a
// deduction is only meaningful in the currency it is deducted from. There is
// deliberately no cross-currency arithmetic here.
//
// REMAINING AMOUNT IS DERIVED, NEVER STORED: `amount` (the original advance)
// and `deductedAmount` (cumulative recovery) are the only persisted numbers.
// `remainingAmount` is a virtual so the two stored values can never drift out
// of sync with a third stored one.
//
// OWNERSHIP / TENANCY:
//   `doctorId` is ALWAYS assigned from the authenticated `req.userId` by the
//   controller — never read from a body, query string or URL parameter, and
//   PATCH can never change it. Every read/update/delete is scoped by
//   `{ doctorId: req.userId }`, so one doctor can never observe or modify
//   another doctor's employees' adjustments.
// ============================================================
import mongoose from 'mongoose';

export const DOCTOR_ADJUSTMENT_TYPES = Object.freeze(['ADVANCE', 'PENALTY']);

export const DOCTOR_ADJUSTMENT_STATUSES = Object.freeze([
  'PENDING',
  'PARTIALLY_SETTLED',
  'SETTLED'
]);

const doctorEmployeeAdjustmentSchema = new mongoose.Schema(
  {
    // Tenant key. Always the authenticated doctor (req.userId).
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // The doctor-owned DoctorEmployee this adjustment belongs to. The
    // controller must verify this employee belongs to req.userId; the id is
    // never trusted from the client on its own.
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorEmployee',
      required: true,
      index: true
    },
    // ADVANCE = recoverable money paid early. PENALTY = doctor-defined
    // deduction. Exactly one of these two.
    type: {
      type: String,
      required: true,
      enum: {
        values: DOCTOR_ADJUSTMENT_TYPES,
        message: 'Invalid adjustment type'
      },
      index: true
    },
    // ADVANCE: the ORIGINAL advance amount, and the contract that
    // `deductedAmount` is measured against. PENALTY: the exact amount the
    // doctor wants deducted. A plain bounded number so no monetary value is
    // ever derived by accumulating unbounded float arithmetic (same rule as
    // DoctorEmployee.salary and DoctorIncome.amount).
    amount: {
      type: Number,
      required: true,
      min: [0, 'Adjustment amount cannot be negative'],
      max: [1000000, 'Adjustment amount must not exceed 1000000']
    },
    // Must match the employee's salary currency. Never converted.
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    // The date the advance or penalty was recorded/occurred.
    adjustmentDate: {
      type: Date,
      required: true,
      index: true
    },
    // Why this adjustment exists. Required for PENALTY by controller
    // validation in a later step; optional here so the model stays a plain
    // store, matching the convention of the other Doctor models.
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    // ADVANCE ONLY: the cumulative amount already recovered from salary. This
    // step NEVER increments it — settlement arrives with a later step. It is
    // defined here so the record shape is complete and bounded.
    deductedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Deducted amount cannot be negative'],
      max: [1000000, 'Deducted amount must not exceed 1000000']
    },
    // Advance settlement state. PENALTY records do not participate in advance
    // settlement logic and keep the default value.
    status: {
      type: String,
      enum: {
        values: DOCTOR_ADJUSTMENT_STATUSES,
        message: 'Invalid adjustment status'
      },
      default: 'PENDING',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'doctor_employee_adjustments',
    // Expose derived `remainingAmount` on toJSON()/toObject() output without
    // ever persisting it.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Outstanding balance of an ADVANCE: `max(0, amount - deductedAmount)`.
 * Always 0 for a PENALTY, which has no balance to recover.
 * Derived, never stored.
 */
doctorEmployeeAdjustmentSchema.virtual('remainingAmount').get(function getRemainingAmount() {
  if (this.type !== 'ADVANCE') return 0;
  return Math.max(0, (this.amount || 0) - (this.deductedAmount || 0));
});

// Per-employee adjustment history (newest first) and outstanding-balance
// lookups for the employee list.
doctorEmployeeAdjustmentSchema.index({ doctorId: 1, employeeId: 1, adjustmentDate: -1 });
// "Which advances are still outstanding for this employee?" — the shape a
// later settlement step will query.
doctorEmployeeAdjustmentSchema.index({ doctorId: 1, employeeId: 1, type: 1, status: 1 });
// Tenant-scoped date-windowed totals for a doctor-wide period summary.
doctorEmployeeAdjustmentSchema.index({ doctorId: 1, adjustmentDate: -1 });

const DoctorEmployeeAdjustment =
  mongoose.models.DoctorEmployeeAdjustment ||
  mongoose.model('DoctorEmployeeAdjustment', doctorEmployeeAdjustmentSchema);

export default DoctorEmployeeAdjustment;
