// backend/src/models/TeacherExpense.js
// ============================================================
// TEACHER EXPENSE (Teacher Accounts — internal bookkeeping ledger)
// ============================================================
// An INTERNAL, Teacher-scoped record of money the teacher has SPENT:
// rent, teaching materials, books, equipment, utilities, or other operating costs.
// Bookkeeping only.
//
// NOT a payment gateway: NOT wired to PayPal, Paymob, Stripe, or any gateway.
// NOT linked to the HomelyServ `Payment` model.
//
// CURRENCY: Each expense keeps its own currency verbatim. Amounts are NEVER
// converted or summed across different currencies.
//
// OWNERSHIP / TENANCY:
//   `teacherId` is ALWAYS assigned from the authenticated `req.userId`
//   by the controller.
// ============================================================
import mongoose from 'mongoose';

export const TEACHER_EXPENSE_CATEGORIES = Object.freeze([
  'RENT',
  'MATERIALS',
  'BOOKS',
  'EQUIPMENT',
  'UTILITIES',
  'OTHER'
]);

const teacherExpenseSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: TEACHER_EXPENSE_CATEGORIES,
        message: 'Invalid expense category'
      },
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
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
    collection: 'teacher_expenses'
  }
);

teacherExpenseSchema.index(
  { teacherId: 1, expenseDate: -1 },
  { name: 'teacher_expense_date_idx' }
);

const TeacherExpense = mongoose.models.TeacherExpense || mongoose.model('TeacherExpense', teacherExpenseSchema);

export default TeacherExpense;
