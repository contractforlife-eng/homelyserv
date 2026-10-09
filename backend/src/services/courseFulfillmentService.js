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
import { roundMoney } from '../utils/money.js';

export const PLATFORM_COURSE_COMMISSION_RATE = 0.10; // 10%
export const TEACHER_COURSE_SHARE_RATE = 0.90;      // 90%

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
  const currency = String(payment.currency || course.currency || 'EGP').trim().toUpperCase();
  const grossAmount = Number(payment.amount);

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
  fulfillCoursePayment
};
