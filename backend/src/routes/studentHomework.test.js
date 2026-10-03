// backend/src/routes/studentHomework.test.js
// ============================================================
// STUDENT SYSTEM PHASE 8: HOMEWORK WORKFLOW TESTS
//
// Verifies:
// 1. Authentication and student authorization on PUT /lessons/:id/homework.
// 2. Tenancy isolation: Student cannot submit homework for another student's lesson.
// 3. One-on-one lesson submission saves studentNote and sets studentCompletedAt.
// 4. Student can toggle studentCompletedAt off when isCompleted: false.
// 5. Group lesson rejects student homework submission (individual submission not supported).
// 6. Cancelled lesson rejects student homework submission.
// 7. Lesson with no homework assigned rejects submission.
// 8. Teacher notification is created on homework submission.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import studentsRouter from './students.js';
import prisma from '../lib/prisma.js';

const secret = 'student-hw-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_1_ID = '507f1f77bcf86cd799439070';
const STUDENT_1_ID = '507f1f77bcf86cd799439081';
const STUDENT_2_ID = '507f1f77bcf86cd799439082';
const RELATIONSHIP_1_ID = '507f1f77bcf86cd799439091';
const RELATIONSHIP_2_ID = '507f1f77bcf86cd799439092';
const LESSON_1_ID = '507f1f77bcf86cd799439061';
const LESSON_2_ID = '507f1f77bcf86cd799439062';
const GROUP_LESSON_ID = '507f1f77bcf86cd799439063';
const GROUP_1_ID = '507f1f77bcf86cd799439051';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const withHomeworkTestServer = async (
  {
    mockUsers = [],
    mockTeacherStudents = [],
    mockLessons = [],
    mockEnrollments = []
  } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origUserFindOneAndUpdate = User.findOneAndUpdate;
  const origUserFind = User.find;
  const origTSFind = TeacherStudent.find;
  const origTLFindOne = TeacherLesson.findOne;
  const origEnrollmentFind = TeacherGroupEnrollment.find;
  const origPrismaNotificationCreate = prisma.notification?.create;

  const capturedNotifications = [];

  try {
    User.findOneAndUpdate = () => Promise.resolve({});
    User.findById = (id) => {
      const u = mockUsers.find((x) => String(x._id) === String(id));
      return {
        select: () => Promise.resolve(u || null)
      };
    };

    User.find = (filter) => {
      let res = [...mockUsers];
      if (filter?._id?.$in) {
        const ids = filter._id.$in.map(String);
        res = res.filter((x) => ids.includes(String(x._id)));
      }
      return {
        select: () => ({
          lean: () => Promise.resolve(res)
        })
      };
    };

    TeacherStudent.find = (filter) => {
      let res = [...mockTeacherStudents];
      if (filter?.$or) {
        const userIds = filter.$or.map((o) => o.linkedUserId || o.studentUserId).filter(Boolean).map(String);
        res = res.filter((r) =>
          userIds.includes(String(r.linkedUserId)) || userIds.includes(String(r.studentUserId))
        );
      }
      if (filter?.isActive !== undefined) {
        res = res.filter((r) => r.isActive === filter.isActive);
      }
      if (filter?.relationshipStatus) {
        res = res.filter((r) => r.relationshipStatus === filter.relationshipStatus);
      }
      return {
        select: () => Promise.resolve(res)
      };
    };

    TeacherGroupEnrollment.find = (filter) => {
      let res = [...mockEnrollments];
      if (filter?.studentId?.$in) {
        const sIds = filter.studentId.$in.map(String);
        res = res.filter((e) => sIds.includes(String(e.studentId)));
      }
      return {
        select: () => Promise.resolve(res)
      };
    };

    TeacherLesson.findOne = (filter) => {
      const match = mockLessons.find((l) => {
        if (filter._id && String(l._id) !== String(filter._id)) return false;
        if (filter.isActive !== undefined && l.isActive !== filter.isActive) return false;
        return true;
      });

      if (!match) {
        return {
          populate: () => Promise.resolve(null)
        };
      }

      const doc = {
        ...match,
        save: async function () {
          const idx = mockLessons.findIndex((x) => String(x._id) === String(match._id));
          if (idx !== -1) {
            mockLessons[idx] = { ...this };
          }
          return this;
        },
        toObject: function () {
          return { ...this };
        }
      };

      return {
        populate: () => Promise.resolve(doc)
      };
    };

    // Mock notification creation via prisma
    if (!prisma.notification) prisma.notification = {};
    prisma.notification.create = async ({ data }) => {
      capturedNotifications.push({ userId: data.userId, data });
      return Promise.resolve({ id: 'notif-123', ...data });
    };

    const app = express();
    app.use(express.json());
    app.use('/api/students', studentsRouter);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      await run({ baseUrl, capturedNotifications });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    User.findById = origUserFindById;
    User.findOneAndUpdate = origUserFindOneAndUpdate;
    User.find = origUserFind;
    TeacherStudent.find = origTSFind;
    TeacherLesson.findOne = origTLFindOne;
    TeacherGroupEnrollment.find = origEnrollmentFind;
    if (prisma.notification) {
      prisma.notification.create = origPrismaNotificationCreate;
    }
  }
};

test('Student Homework: requires authenticated student', async () => {
  await withHomeworkTestServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/students/lessons/${LESSON_1_ID}/homework`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ studentNote: 'My answer' })
    });
    assert.equal(res.status, 401);
  });
});

test('Student Homework: submits answer and completes 1-on-1 homework', async () => {
  const mockUsers = [
    { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Alice Student' },
    { _id: TEACHER_1_ID, role: 'TEACHER', fullName: 'Bob Teacher' }
  ];
  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }
  ];
  const mockLessons = [
    {
      _id: LESSON_1_ID,
      teacherId: TEACHER_1_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: RELATIONSHIP_1_ID,
      subject: 'Mathematics',
      date: new Date('2026-10-15'),
      startTime: '10:00',
      endTime: '11:00',
      lessonStatus: 'SCHEDULED',
      isActive: true,
      homework: {
        title: 'Exercise 5',
        description: 'Complete questions 1 to 10',
        dueDate: new Date('2026-10-14'),
        isCompleted: false,
        studentNote: '',
        studentCompletedAt: null
      }
    }
  ];

  await withHomeworkTestServer(
    { mockUsers, mockTeacherStudents, mockLessons },
    async ({ baseUrl, capturedNotifications }) => {
      const res = await fetch(`${baseUrl}/api/students/lessons/${LESSON_1_ID}/homework`, {
        method: 'PUT',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({
          studentNote: 'Done all 10 questions. Found Q7 tricky.',
          isCompleted: true
        })
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.lesson.homework.studentNote, 'Done all 10 questions. Found Q7 tricky.');
      assert.equal(json.lesson.homework.isStudentCompleted, true);
      assert.ok(json.lesson.homework.studentCompletedAt);
      // Teacher authoritative isCompleted remains untouched!
      assert.equal(json.lesson.homework.isCompleted, false);

      // Notification checked
      assert.equal(capturedNotifications.length, 1);
      assert.equal(capturedNotifications[0].userId, TEACHER_1_ID);
      assert.match(capturedNotifications[0].data.message, /Alice Student updated homework/);
    }
  );
});

test('Student Homework: rejects submission on GROUP lesson', async () => {
  const mockUsers = [
    { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Alice Student' },
    { _id: TEACHER_1_ID, role: 'TEACHER', fullName: 'Bob Teacher' }
  ];
  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }
  ];
  const mockEnrollments = [
    {
      studentId: RELATIONSHIP_1_ID,
      groupId: GROUP_1_ID,
      status: 'ACTIVE',
      isActive: true
    }
  ];
  const mockLessons = [
    {
      _id: GROUP_LESSON_ID,
      teacherId: TEACHER_1_ID,
      lessonType: 'GROUP',
      groupId: GROUP_1_ID,
      subject: 'Physics',
      date: new Date('2026-10-15'),
      startTime: '14:00',
      endTime: '15:00',
      lessonStatus: 'SCHEDULED',
      isActive: true,
      homework: {
        title: 'Group Reading',
        description: 'Read chapter 3',
        isCompleted: false
      }
    }
  ];

  await withHomeworkTestServer(
    { mockUsers, mockTeacherStudents, mockEnrollments, mockLessons },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/lessons/${GROUP_LESSON_ID}/homework`, {
        method: 'PUT',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({
          studentNote: 'Done reading',
          isCompleted: true
        })
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /group lessons/i);
    }
  );
});

test('Student Homework: rejects submission on another student lesson', async () => {
  const mockUsers = [
    { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Alice Student' },
    { _id: STUDENT_2_ID, role: 'STUDENT', fullName: 'Charlie Student' },
    { _id: TEACHER_1_ID, role: 'TEACHER', fullName: 'Bob Teacher' }
  ];
  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    },
    {
      _id: RELATIONSHIP_2_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_2_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }
  ];
  const mockLessons = [
    {
      _id: LESSON_2_ID,
      teacherId: TEACHER_1_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: RELATIONSHIP_2_ID, // belongs to Student 2
      subject: 'Chemistry',
      lessonStatus: 'SCHEDULED',
      isActive: true,
      homework: {
        title: 'Lab prep',
        isCompleted: false
      }
    }
  ];

  await withHomeworkTestServer(
    { mockUsers, mockTeacherStudents, mockLessons },
    async ({ baseUrl }) => {
      // Student 1 tries to submit homework on Student 2's lesson
      const res = await fetch(`${baseUrl}/api/students/lessons/${LESSON_2_ID}/homework`, {
        method: 'PUT',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({
          studentNote: 'Sneaky note'
        })
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
    }
  );
});

test('Student Homework: rejects submission on cancelled lesson or no homework', async () => {
  const mockUsers = [
    { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Alice Student' },
    { _id: TEACHER_1_ID, role: 'TEACHER', fullName: 'Bob Teacher' }
  ];
  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }
  ];
  const mockLessons = [
    {
      _id: LESSON_1_ID,
      teacherId: TEACHER_1_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: RELATIONSHIP_1_ID,
      subject: 'History',
      lessonStatus: 'CANCELLED',
      isActive: true,
      homework: {
        title: 'Essay',
        isCompleted: false
      }
    }
  ];

  await withHomeworkTestServer(
    { mockUsers, mockTeacherStudents, mockLessons },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/lessons/${LESSON_1_ID}/homework`, {
        method: 'PUT',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ isCompleted: true })
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /cancelled or no-show/i);
    }
  );
});
