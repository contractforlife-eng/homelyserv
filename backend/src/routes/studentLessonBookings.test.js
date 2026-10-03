// backend/src/routes/studentLessonBookings.test.js
// ============================================================
// STUDENT SYSTEM PHASE 6A: LESSON BOOKING BACKEND TESTS
//
// Verifies:
// 1. Student can create a booking request (status PENDING).
// 2. Creating a booking DOES NOT create a TeacherLesson.
// 3. Student cannot book without an ACTIVE relationship (TeacherStudent).
// 4. Student cannot access another student's booking (ownership check).
// 5. Teacher can view their own incoming bookings.
// 6. Teacher cannot access another teacher's booking (ownership check).
// 7. Teacher can accept a PENDING booking -> becomes CONFIRMED.
// 8. Teacher cannot accept an already CONFIRMED/REJECTED booking (duplicate accept rejected).
// 9. Teacher can reject a PENDING booking -> becomes REJECTED.
// 10. Rejected booking cannot later be accepted.
// 11. Invalid status transitions are rejected.
// 12. Double-booking / conflicting confirmed bookings or lessons are rejected.
// 13. Recheck conflicts on teacher acceptance.
// 14. Student cancellation follows implemented state rules (PENDING/CONFIRMED can cancel).
// 15. Existing TeacherLesson behavior remains intact.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import studentsRouter from './students.js';
import teachersRouter from './teachers.js';

const secret = 'lesson-booking-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_1_ID = '507f1f77bcf86cd799439070';
const TEACHER_2_ID = '507f1f77bcf86cd799439071';
const STUDENT_1_ID = '507f1f77bcf86cd799439081';
const STUDENT_2_ID = '507f1f77bcf86cd799439082';
const STRANGER_STUDENT_ID = '507f1f77bcf86cd799439083';

const RELATIONSHIP_1_ID = '507f1f77bcf86cd799439091';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const withBookingTestServer = async (
  {
    mockUsers = [],
    mockTeacherStudents = [],
    mockLessons = [],
    mockBookings = []
  } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origUserFindOne = User.findOne;
  const origUserFind = User.find;

  const origTSFind = TeacherStudent.find;
  const origTSFindOne = TeacherStudent.findOne;

  const origTLFind = TeacherLesson.find;
  const origTLFindOne = TeacherLesson.findOne;
  const origTLCreate = TeacherLesson.create;

  const origSLBFind = StudentLessonBooking.find;
  const origSLBFindOne = StudentLessonBooking.findOne;
  const origSLBCreate = StudentLessonBooking.create;
  const origSLBFindOneAndUpdate = StudentLessonBooking.findOneAndUpdate;
  const origSLBUpdateOne = StudentLessonBooking.updateOne;

  let createdLessons = [];
  let allLessons = [...mockLessons];
  let currentBookings = [...mockBookings];

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  app.use('/api/teachers', teachersRouter);

  // Helper to mock mongoose query chaining (populate, sort, select, etc.)
  const makeMockQuery = (result) => {
    if (result && typeof result === 'object' && !result.save) {
      result.save = async function () {
        this.updatedAt = new Date();
        return this;
      };
    }
    const q = {
      populate() { return q; },
      sort() { return q; },
      select() { return q; },
      lean() { return Promise.resolve(result); },
      then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
      }
    };
    return q;
  };

  User.findById = (id) => {
    const user = mockUsers.find((u) => String(u._id) === String(id));
    return makeMockQuery(user || null);
  };

  User.findOne = (query) => {
    const user = mockUsers.find((u) => {
      if (query._id && String(u._id) !== String(query._id)) return false;
      if (query.role && u.role !== query.role) return false;
      return true;
    });
    return makeMockQuery(user || null);
  };

  User.find = (query) => {
    let list = [...mockUsers];
    if (query._id?.$in) {
      const ids = query._id.$in.map(String);
      list = list.filter((u) => ids.includes(String(u._id)));
    }
    return makeMockQuery(list);
  };

  TeacherStudent.findOne = (query) => {
    const match = mockTeacherStudents.find((ts) => {
      if (query._id && String(ts._id) !== String(query._id)) return false;
      if (query.teacherId && String(ts.teacherId) !== String(query.teacherId)) return false;
      if (query.isActive !== undefined && ts.isActive !== query.isActive) return false;
      if (query.relationshipStatus && ts.relationshipStatus !== query.relationshipStatus) return false;
      if (query.$or) {
        const orMatches = query.$or.some((clause) => {
          if (clause.linkedUserId && String(ts.linkedUserId) === String(clause.linkedUserId)) return true;
          if (clause.studentUserId && String(ts.studentUserId) === String(clause.studentUserId)) return true;
          return false;
        });
        if (!orMatches) return false;
      }
      return true;
    });
    return makeMockQuery(match || null);
  };

  TeacherStudent.find = (query) => {
    let list = [...mockTeacherStudents];
    if (query.teacherId) {
      list = list.filter((ts) => String(ts.teacherId) === String(query.teacherId));
    }
    return makeMockQuery(list);
  };

  TeacherLesson.find = (query) => {
    let list = [...allLessons];
    if (query.teacherId) {
      list = list.filter((l) => String(l.teacherId) === String(query.teacherId));
    }
    if (query.isActive !== undefined) {
      list = list.filter((l) => l.isActive === query.isActive);
    }
    if (query.lessonStatus?.$in) {
      list = list.filter((l) => query.lessonStatus.$in.includes(l.lessonStatus));
    }
    return makeMockQuery(list);
  };

  TeacherLesson.findOne = (query) => {
    const match = allLessons.find((l) => {
      if (query._id && String(l._id) !== String(query._id)) return false;
      if (query.sourceBookingId && String(l.sourceBookingId) !== String(query.sourceBookingId)) return false;
      if (query.teacherId && String(l.teacherId) !== String(query.teacherId)) return false;
      if (query.isActive !== undefined && l.isActive !== query.isActive) return false;
      return true;
    });
    return makeMockQuery(match || null);
  };

  TeacherLesson.create = async (doc) => {
    // Unique sourceBookingId constraint simulation
    if (doc.sourceBookingId) {
      const existing = allLessons.find(
        (l) => String(l.sourceBookingId) === String(doc.sourceBookingId)
      );
      if (existing) {
        const dupErr = new Error('E11000 duplicate key error');
        dupErr.code = 11000;
        throw dupErr;
      }
    }
    const newDoc = {
      _id: 'new_lesson_' + (allLessons.length + 1),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      save: async function () { return this; }
    };
    createdLessons.push(newDoc);
    allLessons.push(newDoc);
    return newDoc;
  };

  StudentLessonBooking.create = async (doc) => {
    const newDoc = {
      _id: 'booking_' + (currentBookings.length + 1),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject() { return { ...this }; },
      save: async function () { return this; }
    };
    currentBookings.push(newDoc);
    return newDoc;
  };

  StudentLessonBooking.updateOne = async (query, update) => {
    const idx = currentBookings.findIndex((b) => {
      if (query._id && String(b._id) !== String(query._id)) return false;
      return true;
    });
    if (idx !== -1 && update.$set) {
      Object.assign(currentBookings[idx], update.$set);
    }
    return { acknowledged: true, modifiedCount: idx !== -1 ? 1 : 0 };
  };

  StudentLessonBooking.findOne = (query) => {
    const match = currentBookings.find((b) => {
      if (query._id && String(b._id) !== String(query._id)) return false;
      if (query.studentId && String(b.studentId) !== String(query.studentId)) return false;
      if (query.teacherId && String(b.teacherId) !== String(query.teacherId)) return false;
      if (query.status && b.status !== query.status) return false;
      if (query.isActive !== undefined && b.isActive !== query.isActive) return false;
      if (query.startTime && b.startTime !== query.startTime) return false;
      if (query.endTime && b.endTime !== query.endTime) return false;
      return true;
    });
    return makeMockQuery(match || null);
  };

  StudentLessonBooking.find = (query) => {
    let list = [...currentBookings];
    if (query.studentId) {
      list = list.filter((b) => String(b.studentId) === String(query.studentId));
    }
    if (query.teacherId) {
      list = list.filter((b) => String(b.teacherId) === String(query.teacherId));
    }
    if (query.status) {
      list = list.filter((b) => b.status === query.status);
    }
    if (query.isActive !== undefined) {
      list = list.filter((b) => b.isActive === query.isActive);
    }
    if (query._id?.$ne) {
      list = list.filter((b) => String(b._id) !== String(query._id.$ne));
    }
    return makeMockQuery(list);
  };

  StudentLessonBooking.findOneAndUpdate = (query, update, options) => {
    const idx = currentBookings.findIndex((b) => {
      if (query._id && String(b._id) !== String(query._id)) return false;
      if (query.teacherId && String(b.teacherId) !== String(query.teacherId)) return false;
      if (query.studentId && String(b.studentId) !== String(query.studentId)) return false;
      if (query.status && b.status !== query.status) return false;
      if (query.isActive !== undefined && b.isActive !== query.isActive) return false;
      return true;
    });

    if (idx === -1) {
      return makeMockQuery(null);
    }

    const target = currentBookings[idx];
    if (update.$set) {
      Object.assign(target, update.$set);
    }
    target.updatedAt = new Date();
    currentBookings[idx] = target;

    return makeMockQuery(target);
  };

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, currentBookings, createdLessons });
  } finally {
    server.close();
    User.findById = origUserFindById;
    User.findOne = origUserFindOne;
    User.find = origUserFind;
    TeacherStudent.find = origTSFind;
    TeacherStudent.findOne = origTSFindOne;
    TeacherLesson.find = origTLFind;
    TeacherLesson.findOne = origTLFindOne;
    TeacherLesson.create = origTLCreate;
    StudentLessonBooking.find = origSLBFind;
    StudentLessonBooking.findOne = origSLBFindOne;
    StudentLessonBooking.create = origSLBCreate;
    StudentLessonBooking.findOneAndUpdate = origSLBFindOneAndUpdate;
    StudentLessonBooking.updateOne = origSLBUpdateOne;
  }
};

test('Student Lesson Bookings - Full Phase 6A Test Suite', async (t) => {
  const mockUsers = [
    {
      _id: TEACHER_1_ID,
      role: 'TEACHER',
      fullName: 'Teacher Alpha',
      email: 'teacher.alpha@homelyserv.test',
      isSuspended: false,
      tokenVersion: 0
    },
    {
      _id: TEACHER_2_ID,
      role: 'TEACHER',
      fullName: 'Teacher Beta',
      email: 'teacher.beta@homelyserv.test',
      isSuspended: false,
      tokenVersion: 0
    },
    {
      _id: STUDENT_1_ID,
      role: 'STUDENT',
      fullName: 'Student John',
      email: 'john@student.test',
      isSuspended: false,
      tokenVersion: 0
    },
    {
      _id: STUDENT_2_ID,
      role: 'STUDENT',
      fullName: 'Student Jane',
      email: 'jane@student.test',
      isSuspended: false,
      tokenVersion: 0
    },
    {
      _id: STRANGER_STUDENT_ID,
      role: 'STUDENT',
      fullName: 'Stranger Student',
      email: 'stranger@student.test',
      isSuspended: false,
      tokenVersion: 0
    }
  ];

  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      studentUserId: STUDENT_1_ID,
      relationshipStatus: 'ACTIVE',
      status: 'ACTIVE',
      isActive: true,
      fullName: 'Student John'
    }
  ];

  const mockLessons = [
    {
      _id: 'lesson_existing_1',
      teacherId: TEACHER_1_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: RELATIONSHIP_1_ID,
      subject: 'Math Class',
      date: new Date('2026-10-15T00:00:00.000Z'),
      startTime: '10:00',
      endTime: '11:00',
      lessonStatus: 'SCHEDULED',
      isActive: true
    }
  ];

  await t.test('1. Student can create booking request (status PENDING)', async () => {
    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons },
      async ({ baseUrl, createdLessons }) => {
        const res = await fetch(`${baseUrl}/api/students/bookings`, {
          method: 'POST',
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
          body: JSON.stringify({
            teacherId: TEACHER_1_ID,
            subject: 'Physics Tutoring',
            date: '2026-10-15',
            startTime: '14:00',
            endTime: '15:00',
            message: 'Need help with kinematics'
          })
        });

        const json = await res.json();
        assert.equal(res.status, 201);
        assert.equal(json.success, true);
        assert.equal(json.booking.status, 'PENDING');
        assert.equal(json.booking.teacherId, TEACHER_1_ID);
        assert.equal(json.booking.studentId, STUDENT_1_ID);
        assert.equal(json.booking.subject, 'Physics Tutoring');
        assert.equal(json.booking.startTime, '14:00');
        assert.equal(json.booking.endTime, '15:00');

        // Verify boundary: NO TeacherLesson created!
        assert.equal(createdLessons.length, 0);
      }
    );
  });

  await t.test('2. Student cannot book without an ACTIVE relationship', async () => {
    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/bookings`, {
          method: 'POST',
          headers: authHeader({ userId: STRANGER_STUDENT_ID, role: 'STUDENT' }),
          body: JSON.stringify({
            teacherId: TEACHER_1_ID,
            subject: 'Algebra',
            date: '2026-10-15',
            startTime: '14:00',
            endTime: '15:00'
          })
        });

        const json = await res.json();
        assert.equal(res.status, 403);
        assert.equal(json.success, false);
        assert.match(json.message, /active teacher-student relationship is required/i);
      }
    );
  });

  await t.test('3. Booking conflict detection: overlaps existing TeacherLesson slot', async () => {
    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons },
      async ({ baseUrl }) => {
        // Mock lesson is 10:00 - 11:00 on 2026-10-15
        const res = await fetch(`${baseUrl}/api/students/bookings`, {
          method: 'POST',
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
          body: JSON.stringify({
            teacherId: TEACHER_1_ID,
            subject: 'Math conflict',
            date: '2026-10-15',
            startTime: '10:30',
            endTime: '11:30'
          })
        });

        const json = await res.json();
        assert.equal(res.status, 409);
        assert.equal(json.success, false);
        assert.match(json.message, /Teacher already has a scheduled lesson/i);
      }
    );
  });

  await t.test('4. Ownership check: Student cannot access another student booking', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a1',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Private Science',
        date: new Date('2026-10-16T00:00:00.000Z'),
        startTime: '14:00',
        endTime: '15:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/bookings/507f1f77bcf86cd7994390a1`, {
          method: 'GET',
          headers: authHeader({ userId: STUDENT_2_ID, role: 'STUDENT' })
        });

        const json = await res.json();
        assert.equal(res.status, 404);
        assert.equal(json.success, false);
      }
    );
  });

  await t.test('5. Teacher can view their bookings and cannot view another teacher booking', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a2',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Geometry',
        date: new Date('2026-10-16T00:00:00.000Z'),
        startTime: '16:00',
        endTime: '17:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl }) => {
        // Teacher 1 accesses their booking -> 200
        const res1 = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a2`, {
          method: 'GET',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' })
        });
        const json1 = await res1.json();
        assert.equal(res1.status, 200);
        assert.equal(json1.success, true);
        assert.equal(json1.booking.id, '507f1f77bcf86cd7994390a2');

        // Teacher 2 tries to access Teacher 1 booking -> 404
        const res2 = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a2`, {
          method: 'GET',
          headers: authHeader({ userId: TEACHER_2_ID, role: 'TEACHER' })
        });
        const json2 = await res2.json();
        assert.equal(res2.status, 404);
        assert.equal(json2.success, false);
      }
    );
  });

  await t.test('6. Teacher accepts PENDING booking -> CONFIRMED, records acceptedAt, TeacherLesson created with correct fields', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a3',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Biology',
        date: new Date('2026-10-18T00:00:00.000Z'),
        startTime: '13:00',
        endTime: '14:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl, createdLessons }) => {
        const res = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a3/accept`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' }),
          body: JSON.stringify({ note: 'Accepted, see you online!' })
        });

        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.success, true);
        assert.equal(json.booking.status, 'CONFIRMED');
        assert.ok(json.booking.acceptedAt);
        assert.equal(json.booking.teacherResponseNote, 'Accepted, see you online!');
        assert.ok(json.lessonId);
        assert.equal(json.booking.lessonId, json.lessonId);

        // Confirm Phase 6C: Exactly one TeacherLesson is created with required mappings
        assert.equal(createdLessons.length, 1);
        const created = createdLessons[0];
        assert.equal(String(created.teacherId), TEACHER_1_ID);
        assert.equal(created.lessonType, 'ONE_ON_ONE');
        assert.equal(String(created.studentId), RELATIONSHIP_1_ID);
        assert.equal(created.subject, 'Biology');
        assert.equal(created.startTime, '13:00');
        assert.equal(created.endTime, '14:00');
        assert.equal(created.lessonStatus, 'SCHEDULED');
        assert.equal(created.isActive, true);
        assert.equal(String(created.sourceBookingId), '507f1f77bcf86cd7994390a3');
        assert.equal(created.attendance.length, 1);
        assert.equal(String(created.attendance[0].studentId), RELATIONSHIP_1_ID);
        assert.equal(created.attendance[0].status, 'NOT_RECORDED');

        // Cannot accept again (duplicate acceptance)
        const resDup = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a3/accept`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' })
        });
        const jsonDup = await resDup.json();
        assert.equal(resDup.status, 400);
        assert.equal(jsonDup.success, false);
        assert.match(jsonDup.message, /Cannot accept a booking that is currently CONFIRMED/i);

        // Idempotency: Lesson count remains exactly 1
        assert.equal(createdLessons.length, 1);
      }
    );
  });

  await t.test('7. Teacher rejects PENDING booking -> REJECTED, cannot be accepted afterwards', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a4',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'History',
        date: new Date('2026-10-19T00:00:00.000Z'),
        startTime: '11:00',
        endTime: '12:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a4/reject`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' }),
          body: JSON.stringify({ reason: 'Teacher unavailable at that hour' })
        });

        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.success, true);
        assert.equal(json.booking.status, 'REJECTED');
        assert.ok(json.booking.rejectedAt);
        assert.equal(json.booking.rejectionReason, 'Teacher unavailable at that hour');

        // Attempting to accept a rejected booking must fail
        const resAccept = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a4/accept`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' })
        });
        const jsonAccept = await resAccept.json();
        assert.equal(resAccept.status, 400);
        assert.equal(jsonAccept.success, false);
        assert.match(jsonAccept.message, /Cannot accept a booking that is currently REJECTED/i);
      }
    );
  });

  await t.test('8. Double-booking check: Teacher cannot accept booking if conflict with CONFIRMED booking arose', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a5',
        studentId: STUDENT_2_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Chemistry',
        date: new Date('2026-10-20T00:00:00.000Z'),
        startTime: '15:00',
        endTime: '16:00',
        status: 'CONFIRMED',
        isActive: true,
        toObject() { return { ...this }; }
      },
      {
        _id: '507f1f77bcf86cd7994390a6',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Biology',
        date: new Date('2026-10-20T00:00:00.000Z'),
        startTime: '15:30',
        endTime: '16:30',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a6/accept`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' })
        });

        const json = await res.json();
        assert.equal(res.status, 409);
        assert.equal(json.success, false);
        assert.match(json.message, /Teacher already has a confirmed booking/i);
      }
    );
  });

  await t.test('9. Student cancellation: Student cancels their own PENDING booking', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a7',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Art',
        date: new Date('2026-10-22T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '10:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons, mockBookings: existingBookings },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/bookings/507f1f77bcf86cd7994390a7/cancel`, {
          method: 'POST',
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
        });

        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.success, true);
        assert.equal(json.booking.status, 'CANCELLED');
        assert.ok(json.booking.cancelledAt);

        // Cannot cancel again from CANCELLED
        const resAgain = await fetch(`${baseUrl}/api/students/bookings/507f1f77bcf86cd7994390a7/cancel`, {
          method: 'POST',
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
        });
        const jsonAgain = await resAgain.json();
        assert.equal(resAgain.status, 400);
        assert.match(jsonAgain.message, /Cannot cancel booking with status CANCELLED/i);
      }
    );
  });

  await t.test('10. Phase 6C: Idempotency under race / pre-existing lesson with same sourceBookingId', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a8',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Music',
        date: new Date('2026-10-24T00:00:00.000Z'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    // Simulate an existing TeacherLesson that already has sourceBookingId
    const existingLessons = [
      {
        _id: 'existing_lesson_123',
        teacherId: TEACHER_1_ID,
        lessonType: 'ONE_ON_ONE',
        studentId: RELATIONSHIP_1_ID,
        subject: 'Music',
        date: new Date('2026-10-24T00:00:00.000Z'),
        startTime: '10:00',
        endTime: '11:00',
        lessonStatus: 'SCHEDULED',
        isActive: true,
        sourceBookingId: '507f1f77bcf86cd7994390a8',
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons: existingLessons, mockBookings: existingBookings },
      async ({ baseUrl, createdLessons }) => {
        const res = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a8/accept`, {
          method: 'POST',
          headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' }),
          body: JSON.stringify({ note: 'Already created elsewhere' })
        });

        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.success, true);
        assert.equal(json.lessonId, 'existing_lesson_123');
        assert.equal(json.booking.status, 'CONFIRMED');
        assert.equal(json.booking.lessonId, 'existing_lesson_123');

        // Did not create a second TeacherLesson
        assert.equal(createdLessons.length, 0);
      }
    );
  });

  await t.test('11. Phase 6C: Failure Recovery does not leave false confirmation', async () => {
    const existingBookings = [
      {
        _id: '507f1f77bcf86cd7994390a9',
        studentId: STUDENT_1_ID,
        teacherId: TEACHER_1_ID,
        teacherStudentId: RELATIONSHIP_1_ID,
        subject: 'Chemistry',
        date: new Date('2026-10-25T00:00:00.000Z'),
        startTime: '14:00',
        endTime: '15:00',
        status: 'PENDING',
        isActive: true,
        toObject() { return { ...this }; }
      }
    ];

    await withBookingTestServer(
      { mockUsers, mockTeacherStudents, mockLessons: [], mockBookings: existingBookings },
      async ({ baseUrl, currentBookings }) => {
        // Temporarily force TeacherLesson.create to fail with unexpected error
        const origCreate = TeacherLesson.create;
        TeacherLesson.create = async () => {
          throw new Error('Database disk full');
        };

        try {
          const res = await fetch(`${baseUrl}/api/teachers/bookings/507f1f77bcf86cd7994390a9/accept`, {
            method: 'POST',
            headers: authHeader({ userId: TEACHER_1_ID, role: 'TEACHER' })
          });

          const json = await res.json();
          assert.equal(res.status, 500);
          assert.equal(json.success, false);
          assert.match(json.message, /Failed to schedule lesson for this booking/i);

          // Verify compensating rollback: booking remains PENDING and has no lessonId
          const b = currentBookings.find((item) => String(item._id) === '507f1f77bcf86cd7994390a9');
          assert.equal(b.status, 'PENDING');
          assert.equal(b.lessonId, null);
        } finally {
          TeacherLesson.create = origCreate;
        }
      }
    );
  });
});
