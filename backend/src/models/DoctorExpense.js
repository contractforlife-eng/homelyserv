// backend/src/models/DoctorExpense.js
// ============================================================
// DOCTOR EXPENSE (Doctor Accounts — internal clinic bookkeeping)
// ============================================================
// An INTERNAL, Doctor-scoped record of money the doctor/clinic has SPENT:
// rent, utilities, medical supplies, maintenance, or any other operating
// cost. Bookkeeping only.
//
// NOT a payment system: NOT wired to PayPal, Paymob, Stripe, Vodafone
// Cash, InstaPay, bank transfer or any other gateway. NOT linked to the
// HomelyServ `Payment` model, `AccountingEntry`, Worker earnings, hiring
// commissions or subscriptions.
//
// SCOPE FOR THIS STEP: the amount is stored accurately and nothing more.
// It is NOT summed into totals, NOT netted against income, NOT turned into
// payroll, and NOT created automatically from an employee salary or from
// anything else. A later Summary step decides how expenses aggregate.
//
// CURRENCY: each expense keeps its own currency verbatim. Amounts are NEVER
// converted, and different currencies are never added together here, so a
// later step can group totals by currency.
//
// OWNERSHIP / TENANCY:
//   `doctorId` is ALWAYS assigned from the authenticated `req.userId` by
//   the controller — never read from a body, query string or URL
//   parameter, and PATCH can never change it. Every read/update/delete
//   query is scoped by `{ doctorId: req.userId }`, so one doctor can
//   never observe or modify another doctor's expenses.
// ============================================================
import mongoose from 'mongoose';

export const DOCTOR_EXPENSE_CATEGORIES = Object.freeze([
  'RENT',
  'UTILITIES',
  'MEDICAL_SUPPLIES',
  'MAINTENANCE',
  'OTHER'
]);

const doctorExpenseSchema = new mongoose.Schema(
  {
    // Tenant key. Always the authenticated doctor (req.userId).
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: DOCTOR_EXPENSE_CATEGORIES,
        message: 'Invalid expense category'
      },
      index: true
    },
    // What the money was spent on, in the doctor's own words.
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    // A plain non-negative number bounded above, so no monetary value is
    // ever derived by accumulating floating-point arithmetic (same rule as
    // DoctorProfile.consultationFee and DoctorIncome.amount).
    amount: {
      type: Number,
      required: true,
      min: [0, 'Expense amount cannot be negative'],
      max: [1000000, 'Expense amount must not exceed 1000000']
    },
    currency: {
      type: String,
      default: 'EGP',
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    // The date the expense actually occurred — not the date it was typed in.
    expenseDate: {
      type: Date,
      required: true,
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
    collection: 'doctor_expenses'
  }
);

// Primary doctor-scoped date query: the default listing order and every
// future ?from/?to range filter.
doctorExpenseSchema.index({ doctorId: 1, expenseDate: -1 });
// Category breakdowns in the future Summary step.
doctorExpenseSchema.index({ doctorId: 1, category: 1 });

const DoctorExpense =
  mongoose.models.DoctorExpense ||
  mongoose.model('DoctorExpense', doctorExpenseSchema);

export default DoctorExpense;
