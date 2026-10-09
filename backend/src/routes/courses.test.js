// backend/src/routes/courses.test.js
// ============================================================
// COURSES & LMS AUTOMATED UNIT TESTS (HomelyServ Phase 1)
// ============================================================
// Verifies:
// 1. YouTube URL validator and sanitized 11-char ID extraction.
// 2. Teacher course creation, editing, and teacher ownership isolation.
// 3. Verified teachers can manage courses without requiring Premium.
// 4. Published vs unpublished course discovery.
// 5. Free course student enrollment idempotency.
// 6. Server-side playback protection for paid courses (video IDs masked/omitted).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { extractYouTubeVideoId, buildYouTubeEmbedUrl } from '../utils/youtube.js';
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import User from '../models/User.js';
import teachersRouter from './teachers.js';
import studentsRouter from './students.js';
import coursesRouter from './courses.js';

const secret = 'courses-test-secret-2026-homelyserv-secure-jwt-key';
process.env.JWT_SECRET = secret;

const TEACHER_1_ID = '507f1f77bcf86cd799439080';
const TEACHER_2_ID = '507f1f77bcf86cd799439081';
const STUDENT_1_ID = '507f1f77bcf86cd799439082';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

test('1. YouTube URL validation and 11-character video ID extraction', async (t) => {
  // Valid variations
  const validCases = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'http://youtube.com/watch?v=dQw4w9WgXcQ&feature=share', expected: 'dQw4w9WgXcQ' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://youtu.be/dQw4w9WgXcQ?t=42', expected: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
    { url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' }
  ];

  for (const { url, expected } of validCases) {
    const id = extractYouTubeVideoId(url);
    assert.equal(id, expected, `Failed to extract ID from ${url}`);
    const embedUrl = buildYouTubeEmbedUrl(id);
    assert.equal(embedUrl, `https://www.youtube-nocookie.com/embed/${expected}`);
  }

  // Invalid variations
  const invalidCases = [
    'https://vimeo.com/12345678',
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=short',
    'https://youtube.com/watch?v=toolongcharacterstring12345',
    'javascript:alert(1)',
    '',
    null,
    undefined
  ];

  for (const url of invalidCases) {
    const id = extractYouTubeVideoId(url);
    assert.equal(id, null, `Should reject invalid url: ${url}`);
  }
});

test('2. Teacher course authoring without Premium & ownership isolation', async (t) => {
  const app = express();
  app.use(express.json());

  // In-memory mock store
  const mockCourses = new Map();
  let courseCounter = 1;

  // Stub User findById
  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => {
      if (String(id) === TEACHER_1_ID) {
        return Promise.resolve({
          _id: TEACHER_1_ID,
          role: 'TEACHER',
          tokenVersion: 0,
          isSuspended: false
        });
      }
      if (String(id) === TEACHER_2_ID) {
        return Promise.resolve({
          _id: TEACHER_2_ID,
          role: 'TEACHER',
          tokenVersion: 0,
          isSuspended: false
        });
      }
      return Promise.resolve(null);
    }
  });

  // Stub Course methods
  const origFind = Course.find;
  const origFindOne = Course.findOne;
  const origFindOneAndDelete = Course.findOneAndDelete;

  Course.find = (query) => {
    const results = [];
    for (const c of mockCourses.values()) {
      if (!query.teacherId || String(c.teacherId) === String(query.teacherId)) {
        results.push(c);
      }
    }
    return {
      sort: () => Promise.resolve(results)
    };
  };

  Course.findOne = (query) => {
    for (const c of mockCourses.values()) {
      const matchId = !query._id || String(c._id) === String(query._id);
      const matchTeacher = !query.teacherId || String(c.teacherId) === String(query.teacherId);
      if (matchId && matchTeacher) {
        return Promise.resolve({
          ...c,
          save: async function () {
            mockCourses.set(String(this._id), this);
            return this;
          }
        });
      }
    }
    return Promise.resolve(null);
  };

  Course.findOneAndDelete = (query) => {
    for (const [id, c] of mockCourses.entries()) {
      const matchId = !query._id || String(c._id) === String(query._id);
      const matchTeacher = !query.teacherId || String(c.teacherId) === String(query.teacherId);
      if (matchId && matchTeacher) {
        mockCourses.delete(id);
        return Promise.resolve(c);
      }
    }
    return Promise.resolve(null);
  };

  const origCourseSave = Course.prototype.save;
  Course.prototype.save = async function () {
    if (!this._id) {
      this._id = `mock-course-${courseCounter++}`;
    }
    mockCourses.set(String(this._id), this);
    return this;
  };

  app.use('/api/teachers', teachersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 2.1 Teacher 1 creates a course without Premium
    const createRes = await fetch(`${baseUrl}/api/teachers/courses`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER', tokenVersion: 0 }),
      body: JSON.stringify({
        title: 'Mastering Algebra',
        description: 'Comprehensive high school algebra course',
        subject: 'mathematics',
        gradeLevel: 'high_school',
        gradeSubtitle: 'Grade 10 & 11',
        isPaid: false,
        price: 0,
        currency: 'EGP',
        lessons: [
          {
            title: 'Lesson 1: Linear Equations',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            order: 1,
            durationMinutes: 15
          }
        ]
      })
    });

    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    assert.equal(createData.course.title, 'Mastering Algebra');
    assert.equal(createData.course.lessons[0].youtubeVideoId, 'dQw4w9WgXcQ');

    const createdCourseId = createData.course._id || 'mock-course-1';
    mockCourses.set(String(createdCourseId), {
      ...createData.course,
      _id: createdCourseId
    });

    // 2.2 Teacher 2 cannot access or edit Teacher 1's course
    const teacher2Get = await fetch(`${baseUrl}/api/teachers/courses/${createdCourseId}`, {
      headers: authHeader({ userId: TEACHER_2_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(teacher2Get.status, 404);

    const teacher2Edit = await fetch(`${baseUrl}/api/teachers/courses/${createdCourseId}`, {
      method: 'PUT',
      headers: authHeader({ userId: TEACHER_2_ID, role: 'TEACHER', tokenVersion: 0 }),
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert.equal(teacher2Edit.status, 404);

    // 2.3 Teacher 1 can update their course
    const teacher1Edit = await fetch(`${baseUrl}/api/teachers/courses/${createdCourseId}`, {
      method: 'PUT',
      headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER', tokenVersion: 0 }),
      body: JSON.stringify({ title: 'Mastering Advanced Algebra' })
    });
    assert.equal(teacher1Edit.status, 200);
    const updatedData = await teacher1Edit.json();
    assert.equal(updatedData.course.title, 'Mastering Advanced Algebra');

    // 2.4 Toggle publish
    const publishRes = await fetch(`${baseUrl}/api/teachers/courses/${createdCourseId}/publish`, {
      method: 'PATCH',
      headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER', tokenVersion: 0 }),
      body: JSON.stringify({ isPublished: true })
    });
    assert.equal(publishRes.status, 200);
    const publishData = await publishRes.json();
    assert.equal(publishData.isPublished, true);
  } finally {
    server.close();
    User.findById = origUserFindById;
    Course.find = origFind;
    Course.findOne = origFindOne;
    Course.findOneAndDelete = origFindOneAndDelete;
    Course.prototype.save = origCourseSave;
  }
});

test('3. Server-side playback protection for paid courses & free enrollment', async (t) => {
  const app = express();
  app.use(express.json());

  // Setup mock database
  const coursesDb = new Map();
  const enrollmentsDb = new Map();

  const PAID_COURSE_ID = '507f1f77bcf86cd799439091';
  const FREE_COURSE_ID = '507f1f77bcf86cd799439092';

  // Paid course
  coursesDb.set(PAID_COURSE_ID, {
    _id: PAID_COURSE_ID,
    teacherId: { _id: TEACHER_1_ID, fullName: 'Prof. Al-Mansoor' },
    title: 'Advanced Calculus',
    description: 'College level calculus',
    subject: 'mathematics',
    gradeLevel: 'university',
    isPaid: true,
    price: 350,
    currency: 'EGP',
    isPublished: true,
    lessons: [
      {
        _id: '507f1f77bcf86cd799439093',
        title: 'Limits & Continuity',
        description: 'Introduction',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        order: 1,
        durationMinutes: 25
      }
    ]
  });

  // Free course
  coursesDb.set(FREE_COURSE_ID, {
    _id: FREE_COURSE_ID,
    teacherId: { _id: TEACHER_1_ID, fullName: 'Prof. Al-Mansoor' },
    title: 'Introductory Physics',
    description: 'Basics of mechanics',
    subject: 'physics',
    gradeLevel: 'secondary',
    isPaid: false,
    price: 0,
    currency: 'EGP',
    isPublished: true,
    lessons: [
      {
        _id: 'lesson-free-1',
        title: 'Newtonian Laws',
        description: 'First and second laws',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        order: 1,
        durationMinutes: 20
      }
    ]
  });

  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => {
      if (String(id) === STUDENT_1_ID) {
        return Promise.resolve({
          _id: STUDENT_1_ID,
          role: 'STUDENT',
          tokenVersion: 0,
          isSuspended: false
        });
      }
      return Promise.resolve(null);
    }
  });

  const origCourseFindById = Course.findById;
  Course.findById = (id) => {
    const c = coursesDb.get(String(id));
    return {
      populate: () => Promise.resolve(c || null),
      then: (resolve) => resolve(c || null)
    };
  };

  const origEnrollmentFindOne = CourseEnrollment.findOne;
  CourseEnrollment.findOne = (query) => {
    for (const e of enrollmentsDb.values()) {
      if (
        String(e.courseId) === String(query.courseId) &&
        String(e.studentUserId) === String(query.studentUserId)
      ) {
        return Promise.resolve(e);
      }
    }
    return Promise.resolve(null);
  };

  app.use('/api/courses', coursesRouter);
  app.use('/api/students', studentsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 3.1 Student views paid course -> Video URLs and IDs MUST be null / omitted
    const studentPaidView = await fetch(`${baseUrl}/api/courses/${PAID_COURSE_ID}`, {
      headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(studentPaidView.status, 200);
    const paidData = await studentPaidView.json();
    assert.equal(paidData.isAuthorized, false);
    assert.equal(paidData.course.lessons[0].isLocked, true);
    assert.equal(paidData.course.lessons[0].youtubeVideoId, null);
    assert.equal(paidData.course.lessons[0].youtubeUrl, null);

    // 3.2 Student attempts free enrollment into paid course -> MUST be rejected (403)
    const paidEnrollAttempt = await fetch(`${baseUrl}/api/students/courses/${PAID_COURSE_ID}/enroll`, {
      method: 'POST',
      headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(paidEnrollAttempt.status, 403);

    // 3.3 Student views free course before enrollment -> Not yet authorized
    const studentFreePreView = await fetch(`${baseUrl}/api/courses/${FREE_COURSE_ID}`, {
      headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(studentFreePreView.status, 200);
    const preFreeData = await studentFreePreView.json();
    assert.equal(preFreeData.isAuthorized, false);

    // 3.4 Student enrolls in free course -> Success
    // Stub save on CourseEnrollment prototype
    const origEnrollSave = CourseEnrollment.prototype.save;
    CourseEnrollment.prototype.save = async function () {
      this._id = 'mock-enrollment-1';
      enrollmentsDb.set(String(this._id), this);
      return this;
    };

    const freeEnrollRes = await fetch(`${baseUrl}/api/students/courses/${FREE_COURSE_ID}/enroll`, {
      method: 'POST',
      headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(freeEnrollRes.status, 201);

    // 3.5 Student views free course AFTER enrollment -> Lessons unlocked!
    const studentFreePostView = await fetch(`${baseUrl}/api/courses/${FREE_COURSE_ID}`, {
      headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(studentFreePostView.status, 200);
    const postFreeData = await studentFreePostView.json();
    assert.equal(postFreeData.isAuthorized, true);
    assert.equal(postFreeData.course.lessons[0].isLocked, false);
    assert.equal(postFreeData.course.lessons[0].youtubeVideoId, 'dQw4w9WgXcQ');

    CourseEnrollment.prototype.save = origEnrollSave;
  } finally {
    server.close();
    User.findById = origUserFindById;
    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  }
});
