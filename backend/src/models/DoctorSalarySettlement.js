// backend/src/models/DoctorSalarySettlement.js
// ============================================================
// DOCTOR SALARY SETTLEMENT (Doctor Accounts — settled salary periods)
// ============================================================
// An INTERNAL, Doctor-scoped IMMUTABLE SNAPSHOT of one salary period that the
// doctor EXPLICITLY confirmed as paid.
//
// WHY A SNAPSHOT: `DoctorEmployeeAdjustment.deductedAmount` is a running
// balance. It answers "how much of this advance is left?" but it can never
// answer "which period was already paid?". Those are different questions, and
// only a per-period record can answer the second one. Without it, re-opening an
// already-settled period, requesting an overlapping one, or adding a backdated
// penalty would silently change (or double-pay) history.
//
// THIS IS A FROZEN RECORD OF WHAT WAS PAID, not a live calculation. The
// amounts stored here are captured at settlement time and are never recomputed
// from the employee or the adjustments. That is what makes a historical payslip
// stay correct even if an adjustment is later edited.
//
// `advanceDetails` / `penaltyDetails` store the EXACT adjustment ids together
// with the EXACT amounts applied, so every deduction can be traced to its
// source record and a later edit to that source can never retroactively change
// what this settlement says was paid.
//
// SCOPE FOR THIS STEP: this is the STORED SHAPE ONLY. There is no settlement
// endpoint, no controller, no transaction and no salary calculation here. The
// existing calculation-only salary-period endpoint is untouched and must stay
// calculation-only: viewing a period NEVER settles it.
//
// IMMUTABILITY: a settled record is a financial fact. Corrections are made by
// appending a REVERSED record that points back via `reversalOf` — never by
// editing or deleting the original, so the history is always intact.
//
// NOT A PAYMENT SYSTEM: NOT wired to PayPal, Paymob, Stripe, Vodafone Cash,
// InstaPay, bank transfer or any other gateway. NOT linked to the HomelyServ
// `Payment` model, `AccountingEntry`, Worker/Employer wages or subscriptions.
// This is bookkeeping only — settling a period records that money was handed
// over by the doctor; it does not move money.
//
// NOT AN EXPENSE: a settlement NEVER creates or modifies a `DoctorExpense` and
// NEVER alters `summary.salaryExpense`, `totalExpenses` or `netBalance`.
//
// GROSS SALARY IS FIXED PER MONTH: `grossSalary` snapshots the employee's
// configured monthly salary multiplied by the number of eligible calendar
// months in the settled period. It is never a calendar-day fraction, so a
// period settled before the end of the month still records the full month. The
// snapshot is frozen exactly as paid: changing the salary rule or the employee's
// salary afterwards never recomputes an existing settlement.
//
// CURRENCY: the settlement keeps one explicit currency, which must match the
// employee's salary currency. Amounts are NEVER converted between currencies.
//
// OWNERSHIP / TENANCY:
//   `doctorId` is ALWAYS assigned from the authenticated `req.userId` by the
//   controller — never from a body, query string or URL parameter. Every
//   read/update is scoped by `{ doctorId: req.userId }`, so one doctor can never
//   observe or modify another doctor's settlements. The exact-period unique
//   index is likewise tenant-prefixed, so two doctors may settle the same dates
//   for their own employees without colliding.
// ============================================================
import mongoose from 'mongoose';

export const DOCTOR_SALARY_SETTLEMENT_STATUSES = Object.freeze([
  'SETTLED',
  'REVERSED'
]);

const doctorSalarySettlementSchema = new mongoose.Schema(
  {
    // Tenant key. Always the authenticated doctor (req.userId).
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // The doctor-owned DoctorEmployee this period belongs to. The controller
    // must verify this employee belongs to req.userId; the id is never trusted
    // from the client on its own.
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorEmployee',
      required: true,
      index: true
    },
    // The settled salary period, inclusive on both ends, as UTC instants.
    periodFrom: {
      type: Date,
      required: true
    },
    periodTo: {
      type: Date,
      required: true
    },
    // Must match the employee's salary currency. Never converted.
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },

    // ---- FROZEN SNAPSHOT: the figures exactly as paid ----
    grossSalary: {
      type: Number,
      required: true,
      min: [0, 'Gross salary cannot be negative'],
      max: [1000000, 'Gross salary must not exceed 1000000']
    },
    advanceDeduction: {
      type: Number,
      required: true,
      min: [0, 'Advance deduction cannot be negative'],
      max: [1000000, 'Advance deduction must not exceed 1000000']
    },
    penaltyDeduction: {
      type: Number,
      required: true,
      min: [0, 'Penalty deduction cannot be negative'],
      max: [1000000, 'Penalty deduction must not exceed 1000000']
    },
    // Never negative: deductions are capped at the available gross salary, so a
    // settlement can never pay out less than zero.
    netSalary: {
      type: Number,
      required: true,
      min: [0, 'Net salary cannot be negative'],
      max: [1000000, 'Net salary must not exceed 1000000']
    },


    // Per-advance detail. `adjustmentId` + `appliedAmount` pin down exactly
    // which advance contributed how much, so history stays correct even if that
    // adjustment is edited later. `remainingAfter` is the advance balance this
    // settlement left behind, i.e. what still carries forward.
    // `_id: false` matches the project's existing subdocument convention and
    // avoids pointless nested ids — these lines are identified by adjustmentId.
    advanceDetails: [
      {
        _id: false,
        adjustmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DoctorEmployeeAdjustment',
          required: true
        },
        appliedAmount: {
          type: Number,
          required: true,
          min: [0, 'Applied amount cannot be negative']
        },
        remainingAfter: {
          type: Number,
          required: true,
          min: [0, 'Remaining amount cannot be negative']
        }
      }
    ],
    // Per-penalty detail. A penalty is a period event with no balance, so
    // `shortfall` records any part of it that could NOT be applied because the
    // gross salary was insufficient. It is stored so the shortfall stays
    // visible in history and is never silently discarded.
    penaltyDetails: [
      {
        _id: false,
        adjustmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DoctorEmployeeAdjustment',
          required: true
        },
        appliedAmount: {
          type: Number,
          required: true,
          min: [0, 'Applied amount cannot be negative']
        },
        shortfall: {
          type: Number,
          required: true,
          min: [0, 'Shortfall cannot be negative']
        }
      }
    ],

    // SETTLED = the doctor confirmed this period as paid. REVERSED = this row
    // is a correction that cancels an earlier settlement. There is deliberately
    // no PENDING: a period becomes settled only by an explicit doctor action.
    status: {
      type: String,
      enum: {
        values: DOCTOR_SALARY_SETTLEMENT_STATUSES,
        message: 'Invalid settlement status'
      },
      default: 'SETTLED',
      index: true
    },
    // When the doctor confirmed the period as paid.
    settledAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Set only on a REVERSED row, pointing at the settlement it cancels.
    // Append-only corrections: the original row is never edited or deleted.
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorSalarySettlement',
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
    collection: 'doctor_salary_settlements'
  }
);

// Settled-period history for one employee, newest period first.
doctorSalarySettlementSchema.index({ doctorId: 1, employeeId: 1, periodFrom: -1, periodTo: -1 });
// Most recently settled periods for one employee.
doctorSalarySettlementSchema.index({ doctorId: 1, employeeId: 1, settledAt: -1 });
// Doctor-wide settled vs reversed audit view.
doctorSalarySettlementSchema.index({ doctorId: 1, status: 1 });
// EXACT duplicate protection among SETTLED rows only: at most one SETTLED
// settlement per employee per exact period.
//
// This is a PARTIAL unique index, so REVERSED rows are excluded from the
// constraint. That is what allows a period to be settled again after a doctor
// reverses it, while two concurrent SETTLED settlements for the same exact
// period are still rejected by the database itself.
//
// REVERSAL MODEL: a reversal flips the ORIGINAL document in place
// (SETTLED -> REVERSED); it never creates a second document, so there is never
// more than one REVERSED row per period either. `reversalOf` therefore stays
// null for this direct reversal.
//
// NOTE this catches EXACT repeats only. Overlapping periods (e.g. Sep 1-30 vs
// Sep 15-Oct 15) are NOT detected here — that is deliberate and must be checked
// in the controller before settling, since a unique index cannot express it.
doctorSalarySettlementSchema.index(
  { doctorId: 1, employeeId: 1, periodFrom: 1, periodTo: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'SETTLED' },
    name: 'doctor_salary_settlement_settled_period_unique'
  }
);

const DoctorSalarySettlement =
  mongoose.models.DoctorSalarySettlement ||
  mongoose.model('DoctorSalarySettlement', doctorSalarySettlementSchema);

export default DoctorSalarySettlement;
