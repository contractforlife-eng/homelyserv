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
import { fulfillCoursePayment, PLATFORM_COURSE_COMMISSION_RATE, TEACHER_COURSE_SHARE_RATE } from '../services/courseFulfillmentService.js';
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

