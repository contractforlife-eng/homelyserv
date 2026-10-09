// backend/src/models/CourseEarning.js
// ============================================================
// COURSE EARNING (HomelyServ LMS Phase 2 Financial Ledger)
// ============================================================
// Records teacher net revenue and HomelyServ platform commission
// for completed recorded course sales.
//
// BUSINESS RULES:
//   - Gross amount: 100% of the course sale price.
//   - Platform commission: 10% of gross amount.
//   - Teacher net share: 90% of gross amount.
//   - Payout status: PENDING_PAYOUT until an actual financial payout occurs.
//   - Idempotency: compound unique on `paymentId` ensures one ledger entry
//     per payment transaction.
//   - Live-lesson accounting (TeacherLesson / TeacherIncome) is completely isolated.
// ============================================================
import mongoose from 'mongoose';

export const COURSE_EARNING_PAYOUT_STATUSES = Object.freeze([
  'PENDING_PAYOUT',
  'PAID_OUT',
  'CANCELLED'
]);

const courseEarningSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformCommissionRate: {
      type: Number,
      default: 0.10, // 10%
      required: true
    },
    platformCommissionAmount: {
      type: Number,
      required: true,
      min: 0
    },
    teacherShareRate: {
      type: Number,
      default: 0.90, // 90%
      required: true
    },
    teacherShareAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    payoutStatus: {
      type: String,
      enum: {
        values: COURSE_EARNING_PAYOUT_STATUSES,
        message: 'Invalid course earning payout status'
      },
      default: 'PENDING_PAYOUT',
      index: true
    },
    payoutDate: {
      type: Date,
      default: null
    },
    payoutReference: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'course_earnings'
  }
);

courseEarningSchema.index({ teacherId: 1, createdAt: -1 });
courseEarningSchema.index({ teacherId: 1, payoutStatus: 1 });

const CourseEarning =
  mongoose.models.CourseEarning ||
  mongoose.model('CourseEarning', courseEarningSchema);

export default CourseEarning;
