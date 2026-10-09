// backend/src/routes/coursePaymentFulfillment.test.js
// ============================================================
// COURSE PAYMENT & FULFILLMENT UNIT TESTS (HomelyServ Phase 2)
// ============================================================
// Verifies:
// 1. Server-authoritative pricing (client amount ignored; Course.price used).
// 2. Unpublished, non-existent, or free courses are rejected for payment.
// 3. Authenticated buyer ownership and teacher self-purchase prevention.
// 4. Duplicate purchases by already actively enrolled students are rejected.
// 5. Course payment fulfillment idempotency (CourseEnrollment + CourseEarning).
// 6. Platform commission (10%) and teacher share (90%) calculation.
// 7. Payout status remains PENDING_PAYOUT until explicit payout.
// 8. Unverified/failed/pending payments never unlock paid course content.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import CourseEarning from '../models/CourseEarning.js';
import { fulfillCoursePayment, PLATFORM_COURSE_COMMISSION_RATE, TEACHER_COURSE_SHARE_RATE, validateCoursePurchaseSnapshot, CoursePurchaseSnapshotError } from '../services/courseFulfillmentService.js';
import { clearBankTransferFxCache } from '../services/bankTransferFxService.js';
import { PAYMENT_PURPOSES } from '../config/subscription.js';
import paymentRouter, { completePaymentTransaction } from './payment.js';
import adminRouter from './admin.js';
import coursesRouter from './courses.js';
import studentsRouter from './students.js';
import prisma from '../lib/prisma.js';
import User from '../models/User.js';

const secret = 'course-payment-test-secret-2026-homelyserv';
process.env.JWT_SECRET = secret;

const TEACHER_ID = '507f1f77bcf86cd799439090';
const STUDENT_ID = '507f1f77bcf86cd799439091';
const OTHER_USER_ID = '507f1f77bcf86cd799439092';
const ADMIN_ID = '507f1f77bcf86cd799439093';
// Course ids used by the Bank Transfer canonical-accounting tests (8-10).
const BT_COURSE_ID = '507f1f77bcf86cd7994390b7';
const OTHER_COURSE_ID = '507f1f77bcf86cd7994390c1';

const createToken = (payload) => jwt.sign({ ...payload, tokenVersion: 0 }, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

// Mock User.findById for auth middleware token verification in offline unit tests
const originalUserFindById = User.findById;
User.findById = (id) => ({
  select: () => Promise.resolve({
    _id: id,
    tokenVersion: 0,
    isSuspended: false,
    role: String(id) === TEACHER_ID ? 'TEACHER' : String(id) === ADMIN_ID ? 'ADMIN' : 'STUDENT'
  })
});

test('1. Server-authoritative pricing & course validation on payment-intent', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRouter);

  // Setup test course in memory
  const testCourse = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439095'),
    teacherId: new mongoose.Types.ObjectId(TEACHER_ID),
    title: 'Advanced Mathematics',
    isPaid: true,
    price: 450,
    currency: 'EGP',
    isPublished: true,
  };

  const originalFindById = Course.findById;
  const originalFindOneEnrollment = CourseEnrollment.findOne;
  const originalPaymentCreate = prisma.payment.create;
  const originalPaymentUpdate = prisma.payment.update;
  const originalPrismaFindUnique = prisma.payment.findUnique;

  let createdPaymentData = null;

  try {
    Course.findById = async (id) => {
      if (String(id) === String(testCourse._id)) return testCourse;
      return null;
    };

    CourseEnrollment.findOne = async () => null;

    const mockPaymentId = '507f1f77bcf86cd799439096';

    prisma.payment.create = async ({ data }) => {
      createdPaymentData = data;
      return {
        id: mockPaymentId,
        ...data,
      };
    };

    prisma.payment.update = async ({ where, data }) => ({
      id: where.id,
      ...createdPaymentData,
      ...data,
    });

    prisma.payment.findUnique = async () => null;

    // Test A: Client attempts to tamper with amount (passes 10 EGP instead of 450 EGP)
    const server = app.listen(0);
    const port = server.address().port;

    const resTamper = await fetch(`http://127.0.0.1:${port}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT', email: 'student@example.com' }),
      body: JSON.stringify({
        purpose: 'COURSE_PURCHASE',
        courseId: String(testCourse._id),
        amount: 10, // Tampered amount
        paymentMethod: 'paypal'
      })
    });

    // In offline test, PayPal sandbox call fails (500), but payment record creation was invoked
    // with server-authoritative course price 450 EGP before reaching PayPal API.
    assert.ok(createdPaymentData, 'Payment record should be created');
    assert.equal(createdPaymentData.amount, 450, 'Authoritative course price (450) must be charged, ignoring client (10)');
    assert.equal(createdPaymentData.currency, 'EGP');
    assert.equal(createdPaymentData.purpose, PAYMENT_PURPOSES.COURSE_PURCHASE);
    assert.equal(createdPaymentData.metadata.courseId, String(testCourse._id));
    assert.equal(createdPaymentData.metadata.teacherId, TEACHER_ID);
    assert.equal(createdPaymentData.metadata.targetStudentUserId, STUDENT_ID);

    // Test B: Non-existent or unpublished course is rejected
    const resUnpublished = await fetch(`http://127.0.0.1:${port}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' }),
      body: JSON.stringify({
        purpose: 'COURSE_PURCHASE',
        courseId: '507f1f77bcf86cd799439099', // Unknown
        paymentMethod: 'paypal'
      })
    });
    assert.equal(resUnpublished.status, 404);

    // Test C: Teacher cannot purchase their own course
    const resTeacherSelfBuy = await fetch(`http://127.0.0.1:${port}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: authHeader({ id: TEACHER_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        purpose: 'COURSE_PURCHASE',
        courseId: String(testCourse._id),
        paymentMethod: 'paypal'
      })
    });
    assert.equal(resTeacherSelfBuy.status, 403);

    // Test D: Already actively enrolled student cannot duplicate purchase
    CourseEnrollment.findOne = async () => ({ status: 'ACTIVE' });

    const resAlreadyEnrolled = await fetch(`http://127.0.0.1:${port}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' }),
      body: JSON.stringify({
        purpose: 'COURSE_PURCHASE',
        courseId: String(testCourse._id),
        paymentMethod: 'paypal'
      })
    });
    assert.equal(resAlreadyEnrolled.status, 409);

    server.close();
  } finally {
    Course.findById = originalFindById;
    CourseEnrollment.findOne = originalFindOneEnrollment;
    prisma.payment.create = originalPaymentCreate;
    prisma.payment.update = originalPaymentUpdate;
    prisma.payment.findUnique = originalPrismaFindUnique;
  }
});

test('2. Course payment fulfillment: 10% platform commission, 90% teacher share, and PENDING_PAYOUT status', async (t) => {
  const courseId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439088');
  const courseDoc = {
    _id: courseId,
    teacherId: new mongoose.Types.ObjectId(TEACHER_ID),
    title: 'Physics 101',
    isPublished: true,
    isPaid: true,
    price: 300,
    currency: 'EGP'
  };

  const mockPayment = {
    id: 'pay-unique-order-777',
    amount: 300,
    currency: 'EGP',
    userId: STUDENT_ID,
    metadata: {
      courseId: String(courseId),
      targetStudentUserId: STUDENT_ID,
      teacherId: TEACHER_ID,
    }
  };

  const originalFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;
  const originalEnrollmentCreate = CourseEnrollment.create;
  const originalEarningFindOne = CourseEarning.findOne;
  const originalEarningCreate = CourseEarning.create;

  let createdEnrollment = null;
  let createdEarning = null;

  try {
    Course.findById = async (id) => (String(id) === String(courseId) ? courseDoc : null);

    CourseEnrollment.findOne = async () => createdEnrollment;
    CourseEnrollment.create = async (doc) => {
      createdEnrollment = { _id: new mongoose.Types.ObjectId(), ...doc };
      return createdEnrollment;
    };

    CourseEarning.findOne = async () => createdEarning;
    CourseEarning.create = async (doc) => {
      createdEarning = { _id: new mongoose.Types.ObjectId(), ...doc };
      return createdEarning;
    };

    // First fulfillment run
    const result1 = await fulfillCoursePayment(mockPayment);
    assert.equal(result1.success, true);
    assert.equal(result1.reused, false);
    assert.ok(createdEnrollment);
    assert.equal(createdEnrollment.status, 'ACTIVE');

    // Verify financial breakdown: 10% HomelyServ commission, 90% Teacher share
    assert.ok(createdEarning);
    assert.equal(createdEarning.paymentId, 'pay-unique-order-777');
    assert.equal(createdEarning.grossAmount, 300);
    assert.equal(createdEarning.platformCommissionRate, 0.10);
    assert.equal(createdEarning.platformCommissionAmount, 30); // 300 * 0.10
    assert.equal(createdEarning.teacherShareRate, 0.90);
    assert.equal(createdEarning.teacherShareAmount, 270);     // 300 * 0.90
    assert.equal(createdEarning.currency, 'EGP');
    assert.equal(createdEarning.payoutStatus, 'PENDING_PAYOUT', 'Must be PENDING_PAYOUT until actual payout');

    // Second fulfillment run (idempotency check)
    const result2 = await fulfillCoursePayment(mockPayment);
    assert.equal(result2.success, true);
    assert.equal(result2.reused, true, 'Duplicate fulfillment call must be idempotent and reuse existing records');

  } finally {
    Course.findById = originalFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
    CourseEnrollment.create = originalEnrollmentCreate;
    CourseEarning.findOne = originalEarningFindOne;
    CourseEarning.create = originalEarningCreate;
  }
});

test('3. Unverified/pending payments never unlock paid course lessons', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/courses', coursesRouter);

  const courseId = '507f1f77bcf86cd799439097';
  const paidCourseWithLesson = {
    _id: new mongoose.Types.ObjectId(courseId),
    teacherId: { _id: new mongoose.Types.ObjectId(TEACHER_ID), fullName: 'Prof Test' },
    title: 'Secret Chemistry Course',
    isPublished: true,
    isPaid: true,
    price: 500,
    currency: 'EGP',
    lessons: [
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439098'),
        title: 'Lesson 1',
        description: 'First video',
        youtubeVideoId: 'dQw4w9WgXcQ',
        youtubeUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        order: 1
      }
    ]
  };

  const originalFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;

  try {
    Course.findById = (id) => ({
      populate: () => Promise.resolve(String(id) === courseId ? paidCourseWithLesson : null),
      then: (resolve) => resolve(String(id) === courseId ? paidCourseWithLesson : null)
    });

    // Scenario A: No active enrollment (e.g. payment was pending or failed)
    CourseEnrollment.findOne = async () => null;

    const server = app.listen(0);
    const port = server.address().port;

    const resLocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });

    assert.equal(resLocked.status, 200);
    const lockedData = await resLocked.json();
    assert.equal(lockedData.isAuthorized, false, 'Student must not be authorized without active enrollment');
    assert.equal(lockedData.course.lessons[0].isLocked, true);
    assert.equal(lockedData.course.lessons[0].youtubeVideoId, null, 'Video ID must be masked');
    assert.equal(lockedData.course.lessons[0].youtubeUrl, null, 'Video URL must be masked');

    // Scenario B: Active enrollment present (after verified payment)
    CourseEnrollment.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      courseId: paidCourseWithLesson._id,
      studentUserId: new mongoose.Types.ObjectId(STUDENT_ID),
      status: 'ACTIVE'
    });

    const resUnlocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });

    assert.equal(resUnlocked.status, 200);
    const unlockedData = await resUnlocked.json();
    assert.equal(unlockedData.isAuthorized, true, 'Must unlock playback when active enrollment exists');
    assert.equal(unlockedData.course.lessons[0].isLocked, false);
    assert.equal(unlockedData.course.lessons[0].youtubeVideoId, 'dQw4w9WgXcQ', 'Video ID must be revealed for enrolled student');

    server.close();
  } finally {
    Course.findById = originalFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
  }
});

test('4. Fulfillment failure and retry: failed status leaves course locked, retry creates records exactly once', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/courses', coursesRouter);

  const courseId = '507f1f77bcf86cd7994390a1';
  const paymentId = '507f1f77bcf86cd7994390a2';
  const lessonId = '507f1f77bcf86cd7994390a3';

  const paidCourse = {
    _id: new mongoose.Types.ObjectId(courseId),
    teacherId: new mongoose.Types.ObjectId(TEACHER_ID),
    title: 'Algebra II',
    isPublished: true,
    isPaid: true,
    price: 350,
    currency: 'EGP',
    lessons: [
      {
        _id: new mongoose.Types.ObjectId(lessonId),
        title: 'Equations',
        youtubeVideoId: 'ABCxyz12345',
        youtubeUrl: 'https://youtube.com/watch?v=ABCxyz12345',
        order: 1
      }
    ]
  };

  const paymentRecord = {
    id: paymentId,
    transactionId: 'TXN-RETRY-TEST-001',
    purpose: PAYMENT_PURPOSES.COURSE_PURCHASE,
    paymentMethod: 'paypal',
    amount: 350,
    currency: 'EGP',
    status: 'pending',
    fulfillmentStatus: 'pending',
    fulfillmentAttempts: 0,
    fulfillmentError: null,
    fulfillmentStartedAt: null,
    metadata: {
      courseId,
      targetStudentUserId: STUDENT_ID,
      courseTitle: 'Algebra II'
    },
    userId: STUDENT_ID
  };

  let simulatedPaymentState = { ...paymentRecord };
  let simulatedEnrollment = null;
  let simulatedEarning = null;
  let enrollmentCreateCount = 0;
  let earningCreateCount = 0;

  const originalCourseFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;
  const originalEnrollmentCreate = CourseEnrollment.create;
  const originalEarningFindOne = CourseEarning.findOne;
  const originalEarningCreate = CourseEarning.create;
  const originalPrismaUpdateMany = prisma.payment.updateMany;
  const originalPrismaFindUnique = prisma.payment.findUnique;
  const originalPrismaUpdate = prisma.payment.update;

  try {
    Course.findById = (id) => ({
      populate: () => Promise.resolve(String(id) === courseId ? paidCourse : null),
      then: (resolve) => resolve(String(id) === courseId ? paidCourse : null)
    });

    CourseEnrollment.findOne = async () => simulatedEnrollment;
    CourseEarning.findOne = async () => simulatedEarning;

    prisma.payment.updateMany = async ({ where, data }) => {
      let count = 0;
      if (where.id === paymentId) {
        if (where.NOT && where.NOT.status === 'completed' && simulatedPaymentState.status !== 'completed') {
          simulatedPaymentState.status = data.status || simulatedPaymentState.status;
          count = 1;
        }
        if (where.fulfillmentStatus && where.fulfillmentStatus.in) {
          if (where.fulfillmentStatus.in.includes(simulatedPaymentState.fulfillmentStatus)) {
            simulatedPaymentState.fulfillmentStatus = data.fulfillmentStatus || simulatedPaymentState.fulfillmentStatus;
            simulatedPaymentState.fulfillmentAttempts = (simulatedPaymentState.fulfillmentAttempts || 0) + 1;
            simulatedPaymentState.fulfillmentStartedAt = data.fulfillmentStartedAt || new Date();
            count = 1;
          }
        }
      }
      return { count };
    };

    prisma.payment.findUnique = async ({ where }) => {
      if (where.id === paymentId) {
        return { ...simulatedPaymentState };
      }
      return null;
    };

    prisma.payment.update = async ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPaymentState = { ...simulatedPaymentState, ...data };
        return { ...simulatedPaymentState };
      }
      return null;
    };

    // Step 1: Simulate DB failure during first fulfillment attempt
    CourseEnrollment.create = async () => {
      throw new Error('Simulated transient MongoDB connection error');
    };
    CourseEarning.create = async (doc) => {
      earningCreateCount++;
      simulatedEarning = { _id: new mongoose.Types.ObjectId(), ...doc };
      return simulatedEarning;
    };

    const firstAttemptResult = await completePaymentTransaction(simulatedPaymentState, 'CAP-FAIL-01');
    assert.equal(firstAttemptResult.fulfilled, false);
    assert.match(firstAttemptResult.error, /Simulated transient MongoDB connection error/);
    assert.equal(simulatedPaymentState.fulfillmentStatus, 'failed');
    assert.equal(simulatedPaymentState.status, 'completed', 'Payment status must be completed even when fulfillment fails');
    assert.equal(simulatedEnrollment, null, 'No enrollment created on failure');
    assert.equal(simulatedEarning, null, 'No earning created on failure');

    // Verify course remains locked for student while fulfillmentStatus is failed
    const server = app.listen(0);
    const port = server.address().port;

    const resLocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    assert.equal(resLocked.status, 200);
    const lockedBody = await resLocked.json();
    assert.equal(lockedBody.isAuthorized, false);
    assert.equal(lockedBody.course.lessons[0].isLocked, true);
    assert.equal(lockedBody.course.lessons[0].youtubeVideoId, null);

    // Step 2: Retry fulfillment (transient DB failure resolved)
    CourseEnrollment.create = async (doc) => {
      enrollmentCreateCount++;
      simulatedEnrollment = { _id: new mongoose.Types.ObjectId(), ...doc, status: 'ACTIVE' };
      return simulatedEnrollment;
    };

    const retryResult = await completePaymentTransaction(simulatedPaymentState, 'CAP-RETRY-02');
    assert.equal(retryResult.fulfilled, true);
    assert.equal(retryResult.error, null);
    assert.equal(simulatedPaymentState.fulfillmentStatus, 'fulfilled');
    assert.ok(simulatedEnrollment);
    assert.equal(simulatedEnrollment.status, 'ACTIVE');
    assert.ok(simulatedEarning);
    assert.equal(simulatedEarning.grossAmount, 350);
    assert.equal(enrollmentCreateCount, 1, 'CourseEnrollment must be created exactly once');
    assert.equal(earningCreateCount, 1, 'CourseEarning must be created exactly once');

    // Verify course is now unlocked
    const resUnlocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    assert.equal(resUnlocked.status, 200);
    const unlockedBody = await resUnlocked.json();
    assert.equal(unlockedBody.isAuthorized, true);
    assert.equal(unlockedBody.course.lessons[0].isLocked, false);
    assert.equal(unlockedBody.course.lessons[0].youtubeVideoId, 'ABCxyz12345');

    server.close();
  } finally {
    Course.findById = originalCourseFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
    CourseEnrollment.create = originalEnrollmentCreate;
    CourseEarning.findOne = originalEarningFindOne;
    CourseEarning.create = originalEarningCreate;
    prisma.payment.updateMany = originalPrismaUpdateMany;
    prisma.payment.findUnique = originalPrismaFindUnique;
    prisma.payment.update = originalPrismaUpdate;
  }
});

test('5. Concurrent duplicate fulfillment: two concurrent completion attempts create records exactly once', async (t) => {
  const courseId = '507f1f77bcf86cd7994390b1';
  const paymentId = '507f1f77bcf86cd7994390b2';

  const paidCourse = {
    _id: new mongoose.Types.ObjectId(courseId),
    teacherId: new mongoose.Types.ObjectId(TEACHER_ID),
    title: 'Biology 101',
    isPublished: true,
    isPaid: true,
    price: 400,
    currency: 'EGP',
  };

  const paymentRecord = {
    id: paymentId,
    transactionId: 'TXN-CONCURRENT-001',
    purpose: PAYMENT_PURPOSES.COURSE_PURCHASE,
    paymentMethod: 'paypal',
    amount: 400,
    currency: 'EGP',
    status: 'pending',
    fulfillmentStatus: 'pending',
    fulfillmentAttempts: 0,
    fulfillmentError: null,
    fulfillmentStartedAt: null,
    metadata: {
      courseId,
      targetStudentUserId: STUDENT_ID,
      courseTitle: 'Biology 101'
    },
    userId: STUDENT_ID
  };

  let simulatedPaymentState = { ...paymentRecord };
  let simulatedEnrollment = null;
  let simulatedEarning = null;
  let enrollmentCreateCount = 0;
  let earningCreateCount = 0;

  const originalCourseFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;
  const originalEnrollmentCreate = CourseEnrollment.create;
  const originalEarningFindOne = CourseEarning.findOne;
  const originalEarningCreate = CourseEarning.create;
  const originalPrismaUpdateMany = prisma.payment.updateMany;
  const originalPrismaFindUnique = prisma.payment.findUnique;
  const originalPrismaUpdate = prisma.payment.update;

  try {
    Course.findById = async (id) => (String(id) === courseId ? paidCourse : null);

    CourseEnrollment.findOne = async () => simulatedEnrollment;
    CourseEnrollment.create = async (doc) => {
      enrollmentCreateCount++;
      simulatedEnrollment = { _id: new mongoose.Types.ObjectId(), ...doc, status: 'ACTIVE' };
      return simulatedEnrollment;
    };

    CourseEarning.findOne = async () => simulatedEarning;
    CourseEarning.create = async (doc) => {
      earningCreateCount++;
      simulatedEarning = { _id: new mongoose.Types.ObjectId(), ...doc };
      return simulatedEarning;
    };

    // Atomic claim simulator: only the first call transitions fulfillmentStatus
    let atomicClaimCount = 0;
    prisma.payment.updateMany = async ({ where, data }) => {
      if (where.NOT && where.NOT.status === 'completed') {
        simulatedPaymentState.status = 'completed';
        return { count: 1 };
      }
      if (where.fulfillmentStatus && where.fulfillmentStatus.in) {
        if (atomicClaimCount === 0 && where.fulfillmentStatus.in.includes(simulatedPaymentState.fulfillmentStatus)) {
          atomicClaimCount++;
          simulatedPaymentState.fulfillmentStatus = 'processing';
          simulatedPaymentState.fulfillmentAttempts = (simulatedPaymentState.fulfillmentAttempts || 0) + 1;
          simulatedPaymentState.fulfillmentStartedAt = new Date();
          return { count: 1 };
        }
        return { count: 0 };
      }
      return { count: 0 };
    };

    prisma.payment.findUnique = async ({ where }) => {
      if (where.id === paymentId) {
        return { ...simulatedPaymentState };
      }
      return null;
    };

    prisma.payment.update = async ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPaymentState = { ...simulatedPaymentState, ...data };
        return { ...simulatedPaymentState };
      }
      return null;
    };

    // Execute two concurrent completePaymentTransaction calls
    const [result1, result2] = await Promise.all([
      completePaymentTransaction(simulatedPaymentState, 'CAP-RACE-A'),
      completePaymentTransaction(simulatedPaymentState, 'CAP-RACE-B')
    ]);

    // One must fulfill, the other must handle idempotently without error
    const fulfilledCount = [result1, result2].filter((r) => r.fulfilled).length;
    assert.ok(fulfilledCount >= 1, 'At least one concurrent transaction must fulfill');
    assert.equal(result1.error, null);
    assert.equal(result2.error, null);

    // Assert strictly that enrollment and earning records were created exactly once
    assert.equal(enrollmentCreateCount, 1, 'CourseEnrollment must not be duplicated');
    assert.equal(earningCreateCount, 1, 'CourseEarning must not be duplicated');
    assert.equal(simulatedPaymentState.fulfillmentStatus, 'fulfilled');
  } finally {
    Course.findById = originalCourseFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
    CourseEnrollment.create = originalEnrollmentCreate;
    CourseEarning.findOne = originalEarningFindOne;
    CourseEarning.create = originalEarningCreate;
    prisma.payment.updateMany = originalPrismaUpdateMany;
    prisma.payment.findUnique = originalPrismaFindUnique;
    prisma.payment.update = originalPrismaUpdate;
  }
});

test('6. Manual payment admin confirmation: role gating, activation of enrollment & CourseEarning, and playback unlock', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  app.use('/api/courses', coursesRouter);

  const courseId = '507f1f77bcf86cd7994390c1';
  const paymentId = '507f1f77bcf86cd7994390c2';
  const lessonId = '507f1f77bcf86cd7994390c3';

  const paidCourse = {
    _id: new mongoose.Types.ObjectId(courseId),
    teacherId: new mongoose.Types.ObjectId(TEACHER_ID),
    title: 'Physics Mechanics',
    isPublished: true,
    isPaid: true,
    price: 500,
    currency: 'EGP',
    lessons: [
      {
        _id: new mongoose.Types.ObjectId(lessonId),
        title: 'Newton Laws',
        youtubeVideoId: 'NEWTON12345',
        youtubeUrl: 'https://youtube.com/watch?v=NEWTON12345',
        order: 1
      }
    ]
  };

  const manualPaymentRecord = {
    id: paymentId,
    transactionId: 'TXN-MANUAL-001',
    amount: 500,
    currency: 'EGP',
    purpose: PAYMENT_PURPOSES.COURSE_PURCHASE,
    paymentMethod: 'vodafone_cash',
    manualReviewState: 'pending_verification',
    status: 'pending',
    fulfillmentStatus: 'pending',
    fulfillmentAttempts: 0,
    fulfillmentError: null,
    fulfillmentStartedAt: null,
    externalTransactionReference: 'VODAFONE-REF-888',
    proofStorageKey: 'proofs/vodafone_receipt_888.jpg',
    reviewedBy: null,
    reviewedAt: null,
    metadata: {
      courseId,
      targetStudentUserId: STUDENT_ID,
      courseTitle: 'Physics Mechanics'
    },
    userId: STUDENT_ID,
    hireId: null
  };

  let simulatedPayment = { ...manualPaymentRecord };
  let simulatedEnrollment = null;
  let simulatedEarning = null;
  let enrollmentCreateCount = 0;
  let earningCreateCount = 0;

  const originalCourseFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;
  const originalEnrollmentCreate = CourseEnrollment.create;
  const originalEarningFindOne = CourseEarning.findOne;
  const originalEarningCreate = CourseEarning.create;
  const originalPrismaUpdateMany = prisma.payment.updateMany;
  const originalPrismaFindUnique = prisma.payment.findUnique;
  const originalPrismaUpdate = prisma.payment.update;

  try {
    Course.findById = (id) => ({
      populate: () => Promise.resolve(String(id) === courseId ? paidCourse : null),
      then: (resolve) => resolve(String(id) === courseId ? paidCourse : null)
    });

    CourseEnrollment.findOne = async () => simulatedEnrollment;
    CourseEnrollment.create = async (doc) => {
      enrollmentCreateCount++;
      simulatedEnrollment = { _id: new mongoose.Types.ObjectId(), ...doc, status: 'ACTIVE' };
      return simulatedEnrollment;
    };

    CourseEarning.findOne = async () => simulatedEarning;
    CourseEarning.create = async (doc) => {
      earningCreateCount++;
      simulatedEarning = { _id: new mongoose.Types.ObjectId(), ...doc };
      return simulatedEarning;
    };

    prisma.payment.findUnique = async ({ where }) => {
      if (where.id === paymentId) {
        return { ...simulatedPayment };
      }
      return null;
    };

    prisma.payment.updateMany = async ({ where, data }) => {
      let count = 0;
      if (where.id === paymentId) {
        if (where.manualReviewState === 'pending_verification' && simulatedPayment.manualReviewState === 'pending_verification') {
          simulatedPayment.manualReviewState = data.manualReviewState || simulatedPayment.manualReviewState;
          simulatedPayment.reviewedBy = data.reviewedBy || simulatedPayment.reviewedBy;
          simulatedPayment.reviewedAt = data.reviewedAt || new Date();
          count = 1;
        }
        if (where.NOT && where.NOT.status === 'completed') {
          simulatedPayment.status = 'completed';
          count = 1;
        }
        if (where.fulfillmentStatus && where.fulfillmentStatus.in) {
          if (where.fulfillmentStatus.in.includes(simulatedPayment.fulfillmentStatus)) {
            simulatedPayment.fulfillmentStatus = 'processing';
            simulatedPayment.fulfillmentAttempts = (simulatedPayment.fulfillmentAttempts || 0) + 1;
            simulatedPayment.fulfillmentStartedAt = new Date();
            count = 1;
          }
        }
      }
      return { count };
    };

    prisma.payment.update = async ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPayment = { ...simulatedPayment, ...data };
        return { ...simulatedPayment };
      }
      return null;
    };

    const server = app.listen(0);
    const port = server.address().port;

    // Subtest A: Non-admin caller (e.g. STUDENT) attempts to confirm manual payment -> 403 Forbidden
    const resForbidden = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    assert.equal(resForbidden.status, 403, 'Non-admin role must be rejected with 403');
    assert.equal(simulatedPayment.manualReviewState, 'pending_verification', 'State must not change');
    assert.equal(simulatedEnrollment, null, 'Enrollment must not be created');

    // Course remains locked for student
    const resStillLocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    const lockedData = await resStillLocked.json();
    assert.equal(lockedData.isAuthorized, false);
    assert.equal(lockedData.course.lessons[0].isLocked, true);
    assert.equal(lockedData.course.lessons[0].youtubeVideoId, null);

    // Subtest B: Admin caller confirms valid manual payment -> 200 OK
    const resAdminConfirm = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: ADMIN_ID, role: 'ADMIN' })
    });
    assert.equal(resAdminConfirm.status, 200, 'Admin confirmation must succeed');
    const adminBody = await resAdminConfirm.json();
    assert.equal(adminBody.success, true);
    assert.equal(simulatedPayment.manualReviewState, 'verified');
    assert.equal(simulatedPayment.status, 'completed');
    assert.equal(simulatedPayment.fulfillmentStatus, 'fulfilled');

    // Verify enrollment and earning created exactly once
    assert.ok(simulatedEnrollment);
    assert.equal(simulatedEnrollment.status, 'ACTIVE');
    assert.equal(enrollmentCreateCount, 1);
    assert.ok(simulatedEarning);
    assert.equal(simulatedEarning.grossAmount, 500);
    assert.equal(simulatedEarning.platformCommissionAmount, 50); // 500 * 0.10
    assert.equal(simulatedEarning.teacherShareAmount, 450);       // 500 * 0.90
    assert.equal(earningCreateCount, 1);

    // Subtest C: Student can now access the course with unlocked video
    const resUnlocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    assert.equal(resUnlocked.status, 200);
    const unlockedData = await resUnlocked.json();
    assert.equal(unlockedData.isAuthorized, true);
    assert.equal(unlockedData.course.lessons[0].isLocked, false);
    assert.equal(unlockedData.course.lessons[0].youtubeVideoId, 'NEWTON12345');

    server.close();
  } finally {
    Course.findById = originalCourseFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
    CourseEnrollment.create = originalEnrollmentCreate;
    CourseEarning.findOne = originalEarningFindOne;
    CourseEarning.create = originalEarningCreate;
    prisma.payment.updateMany = originalPrismaUpdateMany;
    prisma.payment.findUnique = originalPrismaFindUnique;
    prisma.payment.update = originalPrismaUpdate;
  }
});

test('7. Bank Transfer: creation, USD FX settlement, and Admin verification for COURSE_PURCHASE', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/courses', coursesRouter);

  const server = app.listen(0);
  const port = server.address().port;

  const courseId = '507f1f77bcf86cd7994390b7';
  const paymentId = '507f1f77bcf86cd7994390b8';

  const mockCourse = {
    _id: courseId,
    title: 'Advanced Algebra',
    teacherId: TEACHER_ID,
    isPublished: true,
    isPaid: true,
    price: 600,
    currency: 'EGP',
    lessons: [
      {
        _id: '507f1f77bcf86cd7994390b9',
        title: 'Lesson 1',
        youtubeVideoId: 'ALGEBRA001',
        isFreePreview: false,
        durationMinutes: 40,
        sortOrder: 1
      }
    ]
  };

  let simulatedPayment = null;
  let simulatedEnrollment = null;
  let simulatedEarning = null;

  // Deterministic offline FX: inject the receiving-account env the same way
  // paymentStatus.test.js does, and stub ONLY the external Frankfurter call so
  // this unit test never touches the network (600 EGP x 0.02 = 12.00 USD).
  // The test's own fetch() calls to the local Express server must pass through.
  const BANK_TRANSFER_ENV = {
    BANK_TRANSFER_USD_ACCOUNT_NAME: 'Test account',
    BANK_TRANSFER_USD_BANK_NAME: 'Test bank',
    BANK_TRANSFER_USD_ACCOUNT_NUMBER: 'test-account',
    BANK_TRANSFER_USD_ROUTING_NUMBER: 'test-routing',
  };
  const TEST_FX_RATE = '0.02';
  const EXPECTED_USD_SETTLEMENT = 12;
  const previousEnv = Object.fromEntries(Object.keys(BANK_TRANSFER_ENV).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    if (String(url).includes('frankfurter')) {
      return {
        ok: true,
        json: async () => ({ base: 'EGP', quote: 'USD', rate: TEST_FX_RATE, date: new Date().toISOString().slice(0, 10) })
      };
    }
    return originalFetch(url, options);
  };
  clearBankTransferFxCache();
  for (const [key, value] of Object.entries(BANK_TRANSFER_ENV)) process.env[key] = value;

  const originalCourseFindById = Course.findById;
  const originalEnrollmentFindOne = CourseEnrollment.findOne;
  const originalEnrollmentCreate = CourseEnrollment.create;
  const originalEarningFindOne = CourseEarning.findOne;
  const originalEarningCreate = CourseEarning.create;
  const originalPaymentFindMany = prisma.payment.findMany;
  const originalPaymentFindFirst = prisma.payment.findFirst;
  const originalPaymentCreate = prisma.payment.create;
  const originalPaymentFindUnique = prisma.payment.findUnique;
  const originalPaymentUpdate = prisma.payment.update;
  const originalPaymentUpdateMany = prisma.payment.updateMany;

  try {
    Course.findById = (id) => ({
      populate: () => Promise.resolve(String(id) === String(courseId) ? mockCourse : null),
      then: (resolve) => resolve(String(id) === String(courseId) ? mockCourse : null)
    });

    CourseEnrollment.findOne = (query) => {
      if (String(query.courseId) === String(courseId) && String(query.studentUserId) === STUDENT_ID && simulatedEnrollment) {
        return Promise.resolve(simulatedEnrollment);
      }
      return Promise.resolve(null);
    };

    // courseFulfillmentService passes a single document object to create().
    CourseEnrollment.create = (doc) => {
      simulatedEnrollment = {
        _id: '507f1f77bcf86cd7994390ba',
        ...doc,
        status: 'ACTIVE'
      };
      return Promise.resolve(simulatedEnrollment);
    };

    CourseEarning.findOne = (query) => {
      if (simulatedEarning && String(simulatedEarning.paymentId) === String(query.paymentId)) {
        return Promise.resolve(simulatedEarning);
      }
      return Promise.resolve(null);
    };

    CourseEarning.create = (doc) => {
      simulatedEarning = {
        _id: '507f1f77bcf86cd7994390bb',
        ...doc,
        payoutStatus: 'PENDING_PAYOUT'
      };
      return Promise.resolve(simulatedEarning);
    };

    prisma.payment.findMany = () => Promise.resolve([]);
    prisma.payment.findFirst = () => Promise.resolve(null);

    prisma.payment.create = ({ data }) => {
      simulatedPayment = {
        id: paymentId,
        orderId: data.orderId,
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        purpose: data.purpose,
        status: data.status,
        fulfillmentStatus: data.fulfillmentStatus,
        manualReviewState: data.manualReviewState,
        manualPaymentReference: data.manualPaymentReference,
        userId: data.userId,
        metadata: data.metadata,
        externalTransactionReference: null
      };
      return Promise.resolve(simulatedPayment);
    };

    prisma.payment.findUnique = ({ where }) => {
      if (where.id === paymentId) {
        return Promise.resolve(simulatedPayment);
      }
      return Promise.resolve(null);
    };

    prisma.payment.update = ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPayment = {
          ...simulatedPayment,
          ...data
        };
        return Promise.resolve(simulatedPayment);
      }
      return Promise.resolve(null);
    };

    prisma.payment.updateMany = ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPayment = {
          ...simulatedPayment,
          ...data
        };
        return Promise.resolve({ count: 1 });
      }
      return Promise.resolve({ count: 0 });
    };

    // Subtest A: Create Bank Transfer payment for COURSE_PURCHASE
    const resCreate = await fetch(`http://127.0.0.1:${port}/api/payments/bank-transfer/create`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' }),
      body: JSON.stringify({
        purpose: 'COURSE_PURCHASE',
        courseId,
        attemptKey: 'attempt-bank-transfer-course-123456789'
      })
    });
    assert.equal(resCreate.status, 201);
    const createData = await resCreate.json();
    assert.equal(createData.success, true);
    assert.equal(createData.payment.paymentMethod, 'bank_transfer');
    assert.equal(createData.payment.currency, 'USD');
    assert.equal(createData.payment.purpose, 'COURSE_PURCHASE');
    assert.equal(createData.payment.manualReviewState, 'awaiting_transfer');
    assert.ok(createData.transferInstructions);
    assert.equal(createData.transferInstructions.currency, 'USD');

    // The student transfers the FX settlement in USD, while the canonical course
    // price (600 EGP) is preserved separately for accounting.
    assert.equal(createData.payment.amount, EXPECTED_USD_SETTLEMENT);
    assert.equal(createData.payment.canonicalAmount, '600.00');
    assert.equal(createData.payment.canonicalCurrency, 'EGP');

    // Immutable purchase snapshot + FX evidence must be persisted on the Payment.
    assert.equal(simulatedPayment.metadata.courseId, courseId);
    assert.equal(simulatedPayment.metadata.teacherId, TEACHER_ID);
    assert.equal(simulatedPayment.metadata.targetStudentUserId, STUDENT_ID);
    assert.equal(simulatedPayment.metadata.courseTitle, 'Advanced Algebra');
    assert.equal(simulatedPayment.metadata.canonicalAmount, '600.00');
    assert.equal(simulatedPayment.metadata.canonicalCurrency, 'EGP');
    assert.equal(simulatedPayment.metadata.exchangeRate, TEST_FX_RATE);
    assert.equal(simulatedPayment.metadata.rateDirection, 'SOURCE_TO_USD');
    assert.equal(simulatedPayment.metadata.exchangeRateSource, 'Frankfurter');
    assert.ok(simulatedPayment.metadata.exchangeRateVersion);
    assert.ok(simulatedPayment.metadata.exchangeRateTimestamp);
    assert.ok(simulatedPayment.metadata.exchangeRateFetchedAt);
    assert.equal(simulatedPayment.metadata.exchangeRateProvider, 'Frankfurter');

    // Subtest B: Submit reference
    const resSubmitRef = await fetch(`http://127.0.0.1:${port}/api/payments/bank-transfer/${paymentId}/submit-reference`, {
      method: 'POST',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' }),
      body: JSON.stringify({
        externalTransactionReference: 'REF-BANK-TEST-999'
      })
    });
    assert.equal(resSubmitRef.status, 200);
    assert.equal(simulatedPayment.manualReviewState, 'pending_verification');
    assert.equal(simulatedPayment.externalTransactionReference, 'REF-BANK-TEST-999');

    // Subtest C: Course lessons remain locked prior to Admin confirmation
    const resStillLocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    const lockedData = await resStillLocked.json();
    assert.equal(lockedData.isAuthorized, false);
    assert.equal(lockedData.course.lessons[0].isLocked, true);

    // Subtest D: Admin confirms the USD bank transfer for COURSE_PURCHASE
    const resAdminConfirm = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: ADMIN_ID, role: 'ADMIN' })
    });
    assert.equal(resAdminConfirm.status, 200);
    const confirmBody = await resAdminConfirm.json();
    assert.equal(confirmBody.success, true);
    assert.equal(simulatedPayment.manualReviewState, 'verified');
    assert.equal(simulatedPayment.status, 'completed');
    assert.equal(simulatedPayment.fulfillmentStatus, 'fulfilled');

    // Verify course enrollment and teacher earning were created
    assert.ok(simulatedEnrollment);
    assert.equal(simulatedEnrollment.status, 'ACTIVE');

    // CANONICAL ACCOUNTING: the ledger must use the original 600 EGP course price,
    // never the 12.00 USD bank-transfer settlement amount.
    assert.ok(simulatedEarning);
    assert.equal(simulatedEarning.grossAmount, 600);
    assert.equal(simulatedEarning.currency, 'EGP');
    assert.equal(simulatedEarning.platformCommissionRate, PLATFORM_COURSE_COMMISSION_RATE);
    assert.equal(simulatedEarning.platformCommissionAmount, 60);
    assert.equal(simulatedEarning.teacherShareRate, TEACHER_COURSE_SHARE_RATE);
    assert.equal(simulatedEarning.teacherShareAmount, 540);
    assert.equal(
      simulatedEarning.platformCommissionAmount + simulatedEarning.teacherShareAmount,
      simulatedEarning.grossAmount,
      'Platform commission + teacher share must reconcile exactly to gross'
    );
    assert.equal(simulatedEarning.payoutStatus, 'PENDING_PAYOUT');
    assert.equal(simulatedEarning.paymentId, paymentId);

    // Exactly-once: a duplicate confirmation must not create a second ledger row.
    const resDuplicateConfirm = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: ADMIN_ID, role: 'ADMIN' })
    });
    assert.equal(resDuplicateConfirm.status, 200);
    assert.equal(simulatedEarning.grossAmount, 600);
    assert.equal(simulatedEarning.payoutStatus, 'PENDING_PAYOUT');

    // Subtest E: Course lessons are now unlocked for student
    const resUnlocked = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'GET',
      headers: authHeader({ id: STUDENT_ID, role: 'STUDENT' })
    });
    const unlockedData = await resUnlocked.json();
    assert.equal(unlockedData.isAuthorized, true);
    assert.equal(unlockedData.course.lessons[0].isLocked, false);
    assert.equal(unlockedData.course.lessons[0].youtubeVideoId, 'ALGEBRA001');

    server.close();
  } finally {
    Course.findById = originalCourseFindById;
    CourseEnrollment.findOne = originalEnrollmentFindOne;
    CourseEnrollment.create = originalEnrollmentCreate;
    CourseEarning.findOne = originalEarningFindOne;
    CourseEarning.create = originalEarningCreate;
    prisma.payment.findMany = originalPaymentFindMany;
    prisma.payment.findFirst = originalPaymentFindFirst;
    prisma.payment.create = originalPaymentCreate;
    prisma.payment.findUnique = originalPaymentFindUnique;
    prisma.payment.update = originalPaymentUpdate;
    prisma.payment.updateMany = originalPaymentUpdateMany;
    globalThis.fetch = originalFetch;
    clearBankTransferFxCache();
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

// ============================================================
// BANK TRANSFER COURSE_PURCHASE — CANONICAL ACCOUNTING & SNAPSHOT GUARDS
// ============================================================

// Builds a persisted-shape bank-transfer COURSE_PURCHASE payment whose USD
// settlement (12.00) is reproducible from the canonical 600.00 EGP x 0.02 rate.
const buildBankTransferCoursePayment = (overrides = {}) => {
  const courseId = String(overrides.courseId || BT_COURSE_ID);
  const metadata = {
    createdFrom: "bank-transfer",
    source: "backend",
    courseId,
    courseTitle: "Advanced Algebra",
    teacherId: TEACHER_ID,
    targetStudentUserId: STUDENT_ID,
    originalAmount: "600.00",
    originalCurrency: "EGP",
    canonicalAmount: "600.00",
    canonicalCurrency: "EGP",
    exchangeRate: "0.02",
    exchangeRateSource: "Frankfurter",
    exchangeRateVersion: "v2",
    exchangeRateTimestamp: new Date().toISOString(),
    exchangeRateFetchedAt: new Date().toISOString(),
    exchangeRateProvider: "Frankfurter",
    rateDirection: "SOURCE_TO_USD",
    ...(overrides.metadata || {}),
  };

  return {
    id: overrides.id || "bt-pay-canonical-1",
    orderId: overrides.orderId || "BT-order-canonical-1",
    amount: overrides.amount === undefined ? 12 : overrides.amount,
    currency: overrides.currency || "USD",
    paymentMethod: "bank_transfer",
    purpose: "COURSE_PURCHASE",
    status: overrides.status || "completed",
    fulfillmentStatus: overrides.fulfillmentStatus || "pending",
    manualReviewState: overrides.manualReviewState || "pending_verification",
    externalTransactionReference: overrides.externalTransactionReference || "REF-BT-CANONICAL-1",
    userId: overrides.userId || STUDENT_ID,
    metadata,
  };
};

// Installs the Course/CourseEnrollment/CourseEarning mocks used by the
// service-level tests below and returns their restore handles.
const installCourseFulfillmentMocks = ({ course, enrollment = null, earning = null }) => {
  const handles = {
    courseFindById: Course.findById,
    enrollmentFindOne: CourseEnrollment.findOne,
    enrollmentCreate: CourseEnrollment.create,
    earningFindOne: CourseEarning.findOne,
    earningCreate: CourseEarning.create,
  };

  const state = { enrollment, earning };

  Course.findById = async () => course;
  CourseEnrollment.findOne = async () => state.enrollment;
  CourseEnrollment.create = async (doc) => {
    state.enrollment = { _id: "507f1f77bcf86cd7994390cc", ...doc, status: "ACTIVE" };
    return state.enrollment;
  };
  CourseEarning.findOne = async (query) => (
    state.earning && String(state.earning.paymentId) === String(query.paymentId) ? state.earning : null
  );
  CourseEarning.create = async (doc) => {
    state.earning = { _id: "507f1f77bcf86cd7994390cd", ...doc, payoutStatus: "PENDING_PAYOUT" };
    return state.earning;
  };

  return { handles, state };
};

const restoreCourseFulfillmentMocks = (handles) => {
  Course.findById = handles.courseFindById;
  CourseEnrollment.findOne = handles.enrollmentFindOne;
  CourseEnrollment.create = handles.enrollmentCreate;
  CourseEarning.findOne = handles.earningFindOne;
  CourseEarning.create = handles.earningCreate;
};

const btCourseDoc = () => ({
  _id: BT_COURSE_ID,
  teacherId: TEACHER_ID,
  title: "Advanced Algebra",
  isPublished: true,
  isPaid: true,
  price: 600,
  currency: "EGP",
});

test("8. Bank Transfer course fulfillment credits the canonical course currency, never the USD settlement", async (t) => {
  const course = btCourseDoc();
  const { handles, state } = installCourseFulfillmentMocks({ course });

  try {
    const result = await fulfillCoursePayment(buildBankTransferCoursePayment());
    assert.equal(result.success, true);

    // 600 EGP canonical, NOT the 12.00 USD settlement amount.
    assert.equal(state.earning.grossAmount, 600);
    assert.equal(state.earning.currency, "EGP");
    assert.equal(state.earning.platformCommissionAmount, 60);
    assert.equal(state.earning.teacherShareAmount, 540);
    assert.equal(
      state.earning.platformCommissionAmount + state.earning.teacherShareAmount,
      state.earning.grossAmount,
    );
    assert.equal(state.enrollment.status, "ACTIVE");

    // PayPal / other providers keep Payment.amount semantics unchanged.
    const paypalResult = await fulfillCoursePayment({
      id: "bt-pay-paypal-1",
      amount: 600,
      currency: "EGP",
      paymentMethod: "paypal",
      purpose: "COURSE_PURCHASE",
      userId: STUDENT_ID,
      metadata: { courseId: String(BT_COURSE_ID), targetStudentUserId: STUDENT_ID, teacherId: TEACHER_ID },
    });
    assert.equal(paypalResult.success, true);
    assert.equal(state.earning.grossAmount, 600);
    assert.equal(state.earning.currency, "EGP");
  } finally {
    restoreCourseFulfillmentMocks(handles);
  }
});

test("9. Bank Transfer course fulfillment fails closed on missing or inconsistent canonical metadata", async (t) => {
  const cases = [
    ["missing canonicalAmount", { metadata: { canonicalAmount: undefined } }],
    ["missing canonicalCurrency", { metadata: { canonicalCurrency: undefined } }],
    ["unsupported canonicalCurrency", { metadata: { canonicalCurrency: "XYZ" } }],
    ["canonical/original currency mismatch", { metadata: { originalCurrency: "USD" } }],
    ["canonical/original amount mismatch", { metadata: { originalAmount: "500.00" } }],
    ["missing FX evidence", { metadata: { exchangeRate: undefined } }],
    ["settlement not reproducible from rate", { amount: 99 }],
    ["non-USD settlement currency", { currency: "EGP" }],
    ["student reference mismatch", { metadata: { targetStudentUserId: OTHER_USER_ID } }],
    ["teacher reference mismatch", { metadata: { teacherId: OTHER_USER_ID } }],
    ["course reference mismatch", { metadata: { courseId: String(OTHER_COURSE_ID) } }],
  ];

  for (const [label, overrides] of cases) {
    await t.test(`rejects ${label}`, async () => {
      const course = btCourseDoc();
      const { handles, state } = installCourseFulfillmentMocks({ course });
      try {
        await assert.rejects(
          () => fulfillCoursePayment(buildBankTransferCoursePayment(overrides)),
          (error) => error instanceof CoursePurchaseSnapshotError,
        );
        // Fail closed: no enrollment and no earnings were created.
        assert.equal(state.enrollment, null);
        assert.equal(state.earning, null);
      } finally {
        restoreCourseFulfillmentMocks(handles);
      }
    });
  }
});

test("10. Bank Transfer confirmation-time guards reject price/state changes and already-enrolled students", async (t) => {
  const pendingPayment = () => buildBankTransferCoursePayment({ manualReviewState: "pending_verification" });

  await t.test("accepts a consistent, not-yet-enrolled purchase", async () => {
    const { handles } = installCourseFulfillmentMocks({ course: btCourseDoc() });
    try {
      const result = await validateCoursePurchaseSnapshot(pendingPayment());
      assert.equal(result.checked, true);
      assert.equal(result.courseId, String(BT_COURSE_ID));
    } finally {
      restoreCourseFulfillmentMocks(handles);
    }
  });

  await t.test("rejects when the course price changed after payment creation", async () => {
    const course = { ...btCourseDoc(), price: 750 };
    const { handles } = installCourseFulfillmentMocks({ course });
    try {
      await assert.rejects(
        () => validateCoursePurchaseSnapshot(pendingPayment()),
        (error) => error instanceof CoursePurchaseSnapshotError && error.code === "PRICE_CHANGED",
      );
    } finally {
      restoreCourseFulfillmentMocks(handles);
    }
  });

  await t.test("rejects when the course is no longer paid", async () => {
    const course = { ...btCourseDoc(), isPaid: false };
    const { handles } = installCourseFulfillmentMocks({ course });
    try {
      await assert.rejects(
        () => validateCoursePurchaseSnapshot(pendingPayment()),
        (error) => error instanceof CoursePurchaseSnapshotError && error.code === "COURSE_NO_LONGER_PAID",
      );
    } finally {
      restoreCourseFulfillmentMocks(handles);
    }
  });

  await t.test("rejects when the course is unpublished or missing", async () => {
    for (const course of [{ ...btCourseDoc(), isPublished: false }, null]) {
      const { handles } = installCourseFulfillmentMocks({ course });
      try {
        await assert.rejects(
          () => validateCoursePurchaseSnapshot(pendingPayment()),
          (error) => error instanceof CoursePurchaseSnapshotError && error.code === "COURSE_UNAVAILABLE",
        );
      } finally {
        restoreCourseFulfillmentMocks(handles);
      }
    }
  });

  await t.test("rejects a student who already has active access (no duplicate earnings)", async () => {
    const enrollment = {
      _id: "507f1f77bcf86cd7994390ce",
      courseId: BT_COURSE_ID,
      studentUserId: STUDENT_ID,
      status: "ACTIVE",
    };
    const { handles } = installCourseFulfillmentMocks({ course: btCourseDoc(), enrollment });
    try {
      await assert.rejects(
        () => validateCoursePurchaseSnapshot(pendingPayment()),
        (error) => error instanceof CoursePurchaseSnapshotError && error.code === "ALREADY_ENROLLED",
      );
    } finally {
      restoreCourseFulfillmentMocks(handles);
    }
  });

  await t.test("skips validation entirely for non-bank-transfer payments", async () => {
    const { handles } = installCourseFulfillmentMocks({ course: null });
    try {
      const result = await validateCoursePurchaseSnapshot({
        id: "bt-pay-paypal-2",
        paymentMethod: "paypal",
        purpose: "COURSE_PURCHASE",
        currency: "EGP",
        amount: 600,
        userId: STUDENT_ID,
        metadata: {},
      });
      assert.equal(result.checked, false);
    } finally {
      restoreCourseFulfillmentMocks(handles);
    }
  });
});
test('11. Bank Transfer retry after verified/failed fulfillment completes with canonical metadata', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/payments', paymentRouter);
  app.use('/api/admin', adminRouter);

  const server = app.listen(0);
  const port = server.address().port;

  const courseId = '507f1f77bcf86cd7994390b7';
  const paymentId = '507f1f77bcf86cd7994390d1';

  const mockCourse = {
    _id: courseId,
    title: 'Advanced Algebra',
    teacherId: TEACHER_ID,
    isPublished: true,
    isPaid: true,
    price: 600,
    currency: 'EGP',
    lessons: [],
  };

  // Simulated persisted payment: verified, but fulfillment failed before
  // anything was granted. Metadata mirrors /bank-transfer/create exactly.
  let simulatedPayment = {
    id: paymentId,
    orderId: 'BT-retry-order-1',
    transactionId: paymentId,
    amount: 12,
    currency: 'USD',
    paymentMethod: 'bank_transfer',
    purpose: 'COURSE_PURCHASE',
    status: 'completed',
    fulfillmentStatus: 'failed',
    fulfillmentAttempts: 1,
    manualReviewState: 'verified',
    reviewedBy: ADMIN_ID,
    manualPaymentReference: 'BT-RETRY-REF-1',
    externalTransactionReference: 'REF-BANK-RETRY-1',
    userId: STUDENT_ID,
    metadata: {
      createdFrom: 'bank-transfer',
      originalAmount: '600.00',
      originalCurrency: 'EGP',
      canonicalAmount: '600.00',
      canonicalCurrency: 'EGP',
      exchangeRate: '0.02',
      exchangeRateSource: 'Frankfurter',
      exchangeRateVersion: 'v2',
      exchangeRateTimestamp: new Date().toISOString(),
      exchangeRateFetchedAt: new Date().toISOString(),
      exchangeRateProvider: 'Frankfurter',
      rateDirection: 'SOURCE_TO_USD',
      courseId,
      courseTitle: 'Advanced Algebra',
      teacherId: TEACHER_ID,
      targetStudentUserId: STUDENT_ID,
    },
    updatedAt: new Date().toISOString(),
  };

  let simulatedEnrollment = null;
  let simulatedEarning = null;
  let enrollmentCreations = 0;
  let earningCreations = 0;

  const originals = {
    CourseFindById: Course.findById,
    EnrollmentFindOne: CourseEnrollment.findOne,
    EnrollmentCreate: CourseEnrollment.create,
    EarningFindOne: CourseEarning.findOne,
    EarningCreate: CourseEarning.create,
    paymentFindUnique: prisma.payment.findUnique,
    paymentUpdate: prisma.payment.update,
    paymentUpdateMany: prisma.payment.updateMany,
  };

  try {
    Course.findById = () => Promise.resolve(mockCourse);
    CourseEnrollment.findOne = () => Promise.resolve(simulatedEnrollment);
    CourseEnrollment.create = (doc) => {
      enrollmentCreations += 1;
      simulatedEnrollment = { _id: '507f1f77bcf86cd7994390d2', ...doc, status: 'ACTIVE' };
      return Promise.resolve(simulatedEnrollment);
    };
    CourseEarning.findOne = (query) => (
      simulatedEarning && String(simulatedEarning.paymentId) === String(query.paymentId)
        ? Promise.resolve(simulatedEarning)
        : Promise.resolve(null)
    );
    CourseEarning.create = (doc) => {
      earningCreations += 1;
      simulatedEarning = { _id: '507f1f77bcf86cd7994390d3', ...doc, payoutStatus: 'PENDING_PAYOUT' };
      return Promise.resolve(simulatedEarning);
    };

    // findUnique honors Prisma-style `select` so the retry read model matches
    // production: canonical metadata must reach fulfillment through the select.
    prisma.payment.findUnique = ({ where, select }) => {
      if (where.id === paymentId) {
        if (!select) return Promise.resolve(simulatedPayment);
        const projected = {};
        for (const key of Object.keys(select)) {
          if (select[key] === true) projected[key] = simulatedPayment[key];
        }
        return Promise.resolve(projected);
      }
      return Promise.resolve(null);
    };
    prisma.payment.update = ({ where, data }) => {
      if (where.id === paymentId) {
        simulatedPayment = { ...simulatedPayment, ...data };
        return Promise.resolve(simulatedPayment);
      }
      return Promise.resolve(null);
    };
    // Atomic fulfillment claim: grant once while failed, then refuse replay.
    prisma.payment.updateMany = ({ where, data }) => {
      if (where.id === paymentId) {
        const statusOk = where.NOT?.status !== undefined
          ? simulatedPayment.status !== where.NOT.status
          : true;
        const fulfillmentOk = where.fulfillmentStatus?.in !== undefined
          ? where.fulfillmentStatus.in.includes(simulatedPayment.fulfillmentStatus)
          : true;
        if (statusOk && fulfillmentOk) {
          simulatedPayment = { ...simulatedPayment, ...data };
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      }
      return Promise.resolve({ count: 0 });
    };

    // Retry: verified/failed bank-transfer payment must complete in 600 EGP.
    const resRetry = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: ADMIN_ID, role: 'ADMIN' })
    });
    assert.equal(resRetry.status, 200);
    const retryBody = await resRetry.json();
    assert.equal(retryBody.success, true);
    assert.equal(retryBody.message, 'Retrying failed fulfillment for verified manual payment');

    assert.ok(simulatedEnrollment);
    assert.equal(simulatedEnrollment.status, 'ACTIVE');
    assert.ok(simulatedEarning);
    assert.equal(simulatedEarning.grossAmount, 600);
    assert.equal(simulatedEarning.currency, 'EGP');
    assert.equal(simulatedEarning.platformCommissionRate, PLATFORM_COURSE_COMMISSION_RATE);
    assert.equal(simulatedEarning.platformCommissionAmount, 60);
    assert.equal(simulatedEarning.teacherShareRate, TEACHER_COURSE_SHARE_RATE);
    assert.equal(simulatedEarning.teacherShareAmount, 540);
    assert.equal(simulatedEarning.payoutStatus, 'PENDING_PAYOUT');
    assert.equal(simulatedPayment.status, 'completed');
    assert.equal(simulatedPayment.fulfillmentStatus, 'fulfilled');

    // A second retry stays idempotent: no duplicate enrollment or earnings.
    const resSecondRetry = await fetch(`http://127.0.0.1:${port}/api/admin/manual-payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: authHeader({ id: ADMIN_ID, role: 'ADMIN' })
    });
    assert.equal(resSecondRetry.status, 200);
    assert.equal(enrollmentCreations, 1);
    assert.equal(earningCreations, 1);
    assert.equal(simulatedEarning.grossAmount, 600);
    assert.equal(simulatedPayment.fulfillmentStatus, 'fulfilled');

    server.close();
  } finally {
    Course.findById = originals.CourseFindById;
    CourseEnrollment.findOne = originals.EnrollmentFindOne;
    CourseEnrollment.create = originals.EnrollmentCreate;
    CourseEarning.findOne = originals.EarningFindOne;
    CourseEarning.create = originals.EarningCreate;
    prisma.payment.findUnique = originals.paymentFindUnique;
    prisma.payment.update = originals.paymentUpdate;
    prisma.payment.updateMany = originals.paymentUpdateMany;
  }
});
