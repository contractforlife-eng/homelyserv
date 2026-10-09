// backend/src/models/TeacherIncome.js
// ============================================================
// TEACHER INCOME (Teacher Accounts — internal bookkeeping ledger)
// ============================================================
// An INTERNAL, Teacher-scoped ledger of lesson fees and course income
// recorded by the teacher. Bookkeeping only.
//
// NOT a payment gateway: NOT wired to PayPal, Paymob, Stripe, or any gateway.
// NOT linked to the HomelyServ `Payment` model.
// NOT automatically created from TeacherLesson.
//
// STATUS SEMANTICS:
//   RECEIVED -> money actually collected; counts as income
//   PENDING  -> fee owed / outstanding; does NOT count as received income,
//               reported as Outstanding Student Fees
//
// OWNERSHIP / TENANCY:
//   `teacherId` is ALWAYS assigned from the authenticated `req.userId`
//   by the controller.
// ============================================================
import mongoose from 'mongoose';

export const TEACHER_INCOME_SOURCES = Object.freeze([
  'LESSON_ONE_ON_ONE',
  'LESSON_GROUP',
  'COURSE_FEE',
  'OTHER'
]);

export const TEACHER_INCOME_STATUSES = Object.freeze([
  'RECEIVED',
  'PENDING'
]);

const teacherIncomeSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
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
    incomeDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: TEACHER_INCOME_STATUSES,
        message: 'Invalid income status'
      },
      default: 'RECEIVED',
      index: true
    },
    source: {
      type: String,
      required: true,
      enum: {
        values: TEACHER_INCOME_SOURCES,
        message: 'Invalid income source'
      },
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherStudent',
      default: null,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherGroup',
      default: null,
      index: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherLesson',
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
    collection: 'teacher_income'
  }
);

teacherIncomeSchema.index(
  { teacherId: 1, incomeDate: -1 },
  { name: 'teacher_income_date_idx' }
);

// Lesson duplicate protection:
// At most ONE income record may reference a given lessonId.
// Partial unique index allows manual records with `lessonId: null` to remain unlimited.
teacherIncomeSchema.index(
  { lessonId: 1 },
  {
    unique: true,
    partialFilterExpression: { lessonId: { $type: 'objectId' } },
    name: 'teacher_income_lesson_unique'
  }
);

const TeacherIncome = mongoose.models.TeacherIncome || mongoose.model('TeacherIncome', teacherIncomeSchema);

export default TeacherIncome;
