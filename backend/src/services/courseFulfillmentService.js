// backend/src/services/courseFulfillmentService.js
// ============================================================
// COURSE PAYMENT FULFILLMENT SERVICE (HomelyServ LMS Phase 2)
// ============================================================
// Idempotently activates CourseEnrollment and records CourseEarning
// upon verified, captured course payment.
// ============================================================
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import CourseEarning from '../models/CourseEarning.js';
import { roundMoney, formatMoneyDecimal, multiplyMoneyByDecimal } from '../utils/money.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { BANK_TRANSFER_PROVIDER, BANK_TRANSFER_CURRENCY } from '../config/bankTransfers.js';
import { PAYMENT_PURPOSES } from '../config/subscription.js';

export const PLATFORM_COURSE_COMMISSION_RATE = 0.10; // 10%
export const TEACHER_COURSE_SHARE_RATE = 0.90;      // 90%

/**
 * Raised when a COURSE_PURCHASE payment cannot be tied to a consistent,
 * immutable purchase snapshot. Carries an HTTP-ish `status` so callers
 * (Admin confirmation) can surface a precise, actionable error instead of
 * silently fulfilling an inconsistent payment.
 */
export class CoursePurchaseSnapshotError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'CoursePurchaseSnapshotError';
    this.code = code;
    this.status = status;
  }
}

// FX evidence fields that must accompany every bank-transfer settlement so the
// recorded USD amount can be independently recomputed and audited.
const REQUIRED_FX_EVIDENCE_FIELDS = Object.freeze([
  'exchangeRate',
  'exchangeRateSource',
  'exchangeRateVersion',
  'exchangeRateTimestamp',
  'exchangeRateFetchedAt',
  'exchangeRateProvider',
  'rateDirection',
]);

const readMetadataObject = (payment) => (
  payment?.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
    ? payment.metadata
    : {}
);

const isBankTransferCoursePurchase = (payment) => (
  payment?.purpose === PAYMENT_PURPOSES.COURSE_PURCHASE
  && payment?.paymentMethod === BANK_TRANSFER_PROVIDER
);

/**
 * Money persisted in Payment metadata arrives either as a validated decimal
 * string (FX canonical amounts) or as a number (Course.price). Both are accepted
 * only when finite, positive, and a plain decimal.
 */
const isPositiveMoneyValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) return false;
  return /[1-9]/.test(text);
};

const safeFormatMoney = (value, currency) => {
  try {
    return formatMoneyDecimal(value, currency);
  } catch {
    return null;
  }
};

/**
 * Resolve the canonical (course-currency) sale amount the CourseEarning ledger
 * must record.
 *
 * Bank-transfer course purchases settle in USD, so `Payment.amount` is the FX
 * settlement figure and must NEVER drive teacher/platform accounting. The
 * authoritative sale value is the immutable canonical snapshot written at
 * payment-creation time. It is accepted only when internally consistent with the
 * persisted payment (stored FX evidence must recompute the recorded USD amount)
 * and with the course/student/teacher snapshot; otherwise this fails closed so no
 * earnings are credited from an unverifiable amount.
 *
 * All other providers persist the course price directly on `Payment.amount` in
 * the course currency, so their established accounting semantics are preserved.
 */
const resolveCanonicalCourseSale = ({ payment, course, studentUserId }) => {
  if (!isBankTransferCoursePurchase(payment)) {
    return {
      grossAmount: Number(payment.amount),
      currency: String(payment.currency || course.currency || 'EGP').trim().toUpperCase(),
    };
  }

  const metadata = readMetadataObject(payment);

  if (String(payment.currency || '').trim().toUpperCase() !== BANK_TRANSFER_CURRENCY) {
    throw new CoursePurchaseSnapshotError(
      'INVALID_SETTLEMENT_CURRENCY',
      409,
      'Bank-transfer course payment is not settled in USD',
    );
  }

  const canonicalAmount = metadata.canonicalAmount;
  const canonicalCurrency = normalizeCurrencyCode(metadata.canonicalCurrency);

  if (!isPositiveMoneyValue(canonicalAmount)) {
    throw new CoursePurchaseSnapshotError(
      'MISSING_CANONICAL_AMOUNT',
      409,
      'Bank-transfer course payment is missing its canonical course amount',
    );
  }
  if (!canonicalCurrency || !isSupportedCurrency(canonicalCurrency)) {
    throw new CoursePurchaseSnapshotError(
      'UNSUPPORTED_CANONICAL_CURRENCY',
      409,
      'Bank-transfer course payment is missing a supported canonical course currency',
    );
  }

  // Canonical snapshot must agree with the recorded original purchase value.
  if (normalizeCurrencyCode(metadata.originalCurrency) !== canonicalCurrency) {
    throw new CoursePurchaseSnapshotError(
      'CANONICAL_CURRENCY_MISMATCH',
      409,
      'Bank-transfer canonical course currency disagrees with the recorded purchase currency',
    );
  }
  if (!isPositiveMoneyValue(metadata.originalAmount)
    || safeFormatMoney(metadata.originalAmount, canonicalCurrency) !== safeFormatMoney(canonicalAmount, canonicalCurrency)) {
    throw new CoursePurchaseSnapshotError(
      'CANONICAL_AMOUNT_MISMATCH',
      409,
      'Bank-transfer canonical course amount disagrees with the recorded purchase amount',
    );
  }

  // Immutable snapshot identity must still point at this exact purchase. The
  // metadata student must also be the persisted payment owner — fulfillment
  // must never enroll a different user than the one who owns the money.
  if (String(metadata.targetStudentUserId || '') !== String(payment.userId)
    || String(metadata.targetStudentUserId || '') !== String(studentUserId)) {
    throw new CoursePurchaseSnapshotError(
      'STUDENT_REFERENCE_MISMATCH',
      409,
      'Bank-transfer course payment student reference does not match the payment owner',
    );
  }
  if (String(metadata.courseId || '') !== String(course._id)) {
    throw new CoursePurchaseSnapshotError(
      'COURSE_REFERENCE_MISMATCH',
      409,
      'Bank-transfer course payment does not reference this course',
    );
  }
  if (String(metadata.teacherId || '') !== String(course.teacherId)) {
    throw new CoursePurchaseSnapshotError(
      'TEACHER_REFERENCE_MISMATCH',
      409,
      'Bank-transfer course payment does not reference this course teacher',
    );
  }

  const missingFxFields = REQUIRED_FX_EVIDENCE_FIELDS.filter((field) => {
    const value = metadata[field];
    return typeof value !== 'string' || !value.trim();
  });
  if (missingFxFields.length > 0) {
    throw new CoursePurchaseSnapshotError(
      'MISSING_FX_EVIDENCE',
      409,
      `Bank-transfer course payment is missing FX evidence: ${missingFxFields.join(', ')}`,
    );
  }

  // The recorded USD settlement must be reproducible from canonical × rate.
  const recomputedSettlement = safeFormatMoney(
    multiplyMoneyByDecimal(String(canonicalAmount), metadata.exchangeRate, BANK_TRANSFER_CURRENCY),
    BANK_TRANSFER_CURRENCY,
  );
  if (!recomputedSettlement || recomputedSettlement !== safeFormatMoney(payment.amount, BANK_TRANSFER_CURRENCY)) {
    throw new CoursePurchaseSnapshotError(
      'SETTLEMENT_AMOUNT_MISMATCH',
      409,
      'Bank-transfer USD settlement does not match the canonical course amount and exchange rate',
    );
  }

  return {
    grossAmount: roundMoney(canonicalAmount, canonicalCurrency),
    currency: canonicalCurrency,
  };
};

/**
 * Confirmation-time guard for Bank Transfer COURSE_PURCHASE payments.
 *
 * Runs BEFORE the payment is claimed as verified, so a rejected payment never
 * mutates state. Verifies the persisted purpose/currency/references resolve to a
 * course that is still valid for this exact purchase, and that the student has
 * not already obtained access (which would otherwise let a later confirmation
 * mint duplicate teacher earnings).
 *
 * No-ops for every non-bank-transfer purpose, preserving existing provider
 * behavior, authentication, admin authorization, and atomic claims.
 */
export const validateCoursePurchaseSnapshot = async (payment) => {
  if (!isBankTransferCoursePurchase(payment)) return { checked: false };

  const metadata = readMetadataObject(payment);
  const courseId = String(metadata.courseId || '');
  const studentUserId = String(metadata.targetStudentUserId || payment.userId || '');

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new CoursePurchaseSnapshotError(
      'MISSING_COURSE_REFERENCE',
      400,
      'Bank-transfer course payment is missing a valid course reference',
    );
  }
  if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
    throw new CoursePurchaseSnapshotError(
      'MISSING_STUDENT_REFERENCE',
      400,
      'Bank-transfer course payment is missing a valid student reference',
    );
  }
  // The metadata student must also be the persisted payment owner — a payment
  // must never enroll a different user than the one who owns the money.
  if (String(metadata.targetStudentUserId || '') !== String(payment.userId)) {
    throw new CoursePurchaseSnapshotError(
      'STUDENT_REFERENCE_MISMATCH',
      409,
      'Bank-transfer course payment student reference does not match the payment owner',
    );
  }
  if (!isPositiveMoneyValue(metadata.canonicalAmount)) {
    throw new CoursePurchaseSnapshotError(
      'MISSING_CANONICAL_AMOUNT',
      400,
      'Bank-transfer course payment is missing its canonical course amount',
    );
  }

  const canonicalCurrency = normalizeCurrencyCode(metadata.canonicalCurrency);
  if (!canonicalCurrency || !isSupportedCurrency(canonicalCurrency)) {
    throw new CoursePurchaseSnapshotError(
      'UNSUPPORTED_CANONICAL_CURRENCY',
      400,
      'Bank-transfer course payment is missing a supported canonical course currency',
    );
  }

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) {
    throw new CoursePurchaseSnapshotError(
      'COURSE_UNAVAILABLE',
      409,
      'This course is no longer published, so the bank transfer cannot be confirmed',
    );
  }
  if (!course.isPaid) {
    throw new CoursePurchaseSnapshotError(
      'COURSE_NO_LONGER_PAID',
      409,
      'This course is no longer a paid course, so the bank transfer cannot be confirmed',
    );
  }
  if (String(course.teacherId) !== String(metadata.teacherId || '')) {
    throw new CoursePurchaseSnapshotError(
      'TEACHER_REFERENCE_MISMATCH',
      409,
      'This course teacher changed after the bank transfer was created',
    );
  }

  // The immutable purchase snapshot must still match the live listing.
  if (normalizeCurrencyCode(course.currency) !== canonicalCurrency
    || safeFormatMoney(course.price, canonicalCurrency) !== safeFormatMoney(metadata.canonicalAmount, canonicalCurrency)) {
    throw new CoursePurchaseSnapshotError(
      'PRICE_CHANGED',
      409,
      'This course price or currency changed after the bank transfer was created',
    );
  }

  // Access already obtained by any other route must not mint duplicate earnings.
  const activeEnrollment = await CourseEnrollment.findOne({
    courseId,
    studentUserId,
    status: 'ACTIVE',
  });
  if (activeEnrollment) {
    throw new CoursePurchaseSnapshotError(
      'ALREADY_ENROLLED',
      409,
      'This student already has access to the course, so the bank transfer cannot be confirmed',
    );
  }

  return { checked: true, courseId, studentUserId };
};

/**
 * Idempotently fulfills a verified payment for a recorded course.
 *
 * @param {Object} payment - Prisma Payment record
 * @returns {Promise<{ success: boolean, enrollment: Object, earning: Object, reused: boolean }>}
 */
export const fulfillCoursePayment = async (payment) => {
  if (!payment) {
    throw new Error('Payment record is required for course fulfillment');
  }

  const metadata = payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
    ? payment.metadata
    : {};

  const courseId = metadata.courseId;
  const targetStudentUserId = metadata.targetStudentUserId || payment.userId;

  if (!courseId) {
    throw new Error('Course payment metadata is missing courseId');
  }
  if (!targetStudentUserId) {
    throw new Error('Course payment metadata is missing student identity');
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error(`Invalid courseId: ${courseId}`);
  }
  if (!mongoose.Types.ObjectId.isValid(targetStudentUserId)) {
    throw new Error(`Invalid studentUserId: ${targetStudentUserId}`);
  }

  // 1. Verify Course exists and is published
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error(`Course not found for fulfillment: ${courseId}`);
  }
  if (!course.isPublished) {
    throw new Error(`Course is not published: ${courseId}`);
  }

  const teacherId = String(course.teacherId);
  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    throw new Error(`Invalid teacherId on course: ${teacherId}`);
  }
  const studentUserId = String(targetStudentUserId);
  const paymentId = String(payment.id);

  // Authoritative ledger basis. Bank-transfer course purchases settle in USD, so
  // the canonical course amount/currency from the immutable payment snapshot is
  // used instead of Payment.amount; every other provider keeps its established
  // Payment.amount/currency semantics.
  const { grossAmount, currency } = resolveCanonicalCourseSale({ payment, course, studentUserId });

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error(`Invalid gross amount on payment: ${payment.amount}`);
  }

  // 2. Financial calculation: 10% platform commission, 90% teacher net share
  // Reconcile rounding so platformCommissionAmount + teacherShareAmount === grossAmount exactly
  const rawPlatformFee = grossAmount * PLATFORM_COURSE_COMMISSION_RATE;
  const platformCommissionAmount = roundMoney(rawPlatformFee, currency);
  const teacherShareAmount = roundMoney(grossAmount - platformCommissionAmount, currency);

  // 3. Idempotent CourseEnrollment creation / activation
  let enrollment = await CourseEnrollment.findOne({
    courseId: course._id,
    studentUserId: new mongoose.Types.ObjectId(studentUserId)
  });

  let enrollmentReused = false;
  if (!enrollment) {
    try {
      enrollment = await CourseEnrollment.create({
        courseId: course._id,
        studentUserId: new mongoose.Types.ObjectId(studentUserId),
        status: 'ACTIVE',
        enrolledAt: new Date()
      });
    } catch (err) {
      if (err.code === 11000) {
        // Concurrent insert won race
        enrollment = await CourseEnrollment.findOne({
          courseId: course._id,
          studentUserId: new mongoose.Types.ObjectId(studentUserId)
        });
        enrollmentReused = true;
      } else {
        throw err;
      }
    }
  } else {
    enrollmentReused = true;
    if (enrollment.status !== 'ACTIVE') {
      enrollment.status = 'ACTIVE';
      await enrollment.save();
    }
  }

  // 4. Idempotent CourseEarning ledger record
  let earning = await CourseEarning.findOne({ paymentId });
  let earningReused = false;

  if (!earning) {
    try {
      earning = await CourseEarning.create({
        paymentId,
        courseId: course._id,
        teacherId: new mongoose.Types.ObjectId(teacherId),
        studentUserId: new mongoose.Types.ObjectId(studentUserId),
        grossAmount,
        platformCommissionRate: PLATFORM_COURSE_COMMISSION_RATE,
        platformCommissionAmount,
        teacherShareRate: TEACHER_COURSE_SHARE_RATE,
        teacherShareAmount,
        currency,
        payoutStatus: 'PENDING_PAYOUT'
      });
    } catch (err) {
      if (err.code === 11000) {
        earning = await CourseEarning.findOne({ paymentId });
        earningReused = true;
      } else {
        throw err;
      }
    }
  } else {
    earningReused = true;
  }

  return {
    success: true,
    enrollment,
    earning,
    reused: enrollmentReused && earningReused
  };
};

export default {
  PLATFORM_COURSE_COMMISSION_RATE,
  TEACHER_COURSE_SHARE_RATE,
  CoursePurchaseSnapshotError,
  fulfillCoursePayment,
  validateCoursePurchaseSnapshot
};
