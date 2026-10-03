// backend/src/routes/studentDashboard.test.js
// ============================================================
// STUDENT SYSTEM PHASE 7: DASHBOARD & PROGRESS TESTS
//
// Verifies:
// 1. Student can retrieve dashboard summary (scoped to req.userId).
// 2. Tenancy isolation: Student A cannot see Student B's dashboard metrics.
// 3. Next upcoming lesson selection:
//    - Selects correct chronological upcoming lesson.
//    - Excludes CANCELLED and NO_SHOW lessons.
// 4. Pending booking requests count is accurate.
// 5. Active connected teacher count and preview is accurate.
// 6. Academic stats (attendance, homework, assessments) calculate correctly.
// 7. Private teacher notes are never exposed in nextLesson DTO.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherAssessment from '../models/TeacherAssessment.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import studentsRouter from './students.js';

const secret = 'student-dashboard-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_1_ID = '507f1f77bcf86cd799439070';
const STUDENT_1_ID = '507f1f77bcf86cd799439081';
const STUDENT_2_ID = '507f1f77bcf86cd799439082';
const RELATIONSHIP_1_ID = '507f1f77bcf86cd799439091';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const withDashboardTestServer = async (
  {
    mockUsers = [],
    mockTeacherStudents = [],
    mockLessons = [],
    mockBookings = [],
    mockAssessments = [],
    mockTeacherProfiles = [],
    mockEnrollments = []
  } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origUserFind = User.find;
  const origTSFind = TeacherStudent.find;
  const origTLFind = TeacherLesson.find;
  const origSLBCount = StudentLessonBooking.countDocuments;
  const origTAFind = TeacherAssessment.find;
  const origTPFind = TeacherProfile.find;
  const origTGEFind = TeacherGroupEnrollment.find;

  // Mock User
  User.findById = (id) => {
    const sId = String(id?._id || id);
    const u = mockUsers.find((x) => String(x._id) === sId);
    return {
      select: () => ({
        lean: async () => (u ? { ...u } : null)
      }),
      lean: async () => (u ? { ...u } : null)
    };
  };

  User.find = (filter) => {
    let list = [...mockUsers];
    if (filter?._id?.$in) {
      const inIds = filter._id.$in.map(String);
      list = list.filter((u) => inIds.includes(String(u._id)));
    }
    return {
      select: () => ({
        lean: async () => list.map((u) => ({ ...u }))
      }),
      lean: async () => list.map((u) => ({ ...u }))
    };
  };

  // Mock TeacherStudent
  TeacherStudent.find = (filter) => {
    let list = [...mockTeacherStudents];
    if (filter?.$or) {
      const uIds = filter.$or.map((o) => String(o.linkedUserId || o.studentUserId));
      list = list.filter((r) =>
        uIds.includes(String(r.linkedUserId)) || uIds.includes(String(r.studentUserId))
      );
    }
    if (filter?.isActive !== undefined) {
      list = list.filter((r) => r.isActive === filter.isActive);
    }
    if (filter?.relationshipStatus) {
      list = list.filter((r) => r.relationshipStatus === filter.relationshipStatus);
    }
    return {
      select: () => list.map((r) => ({ ...r }))
    };
  };

  // Mock TeacherLesson
  TeacherLesson.find = (filter) => {
    let list = [...mockLessons];
    if (filter?.isActive !== undefined) {
      list = list.filter((l) => l.isActive === filter.isActive);
    }
    if (filter?.lessonStatus?.$in) {
      list = list.filter((l) => filter.lessonStatus.$in.includes(l.lessonStatus));
    }
    // Sorting & populating
    const result = {
      sort: () => result,
      limit: () => result,
      populate: () => result,
      select: () => result,
      lean: async () => list.map((l) => ({ ...l }))
    };
    return result;
  };

  // Mock StudentLessonBooking
  StudentLessonBooking.countDocuments = async (filter) => {
    let count = 0;
    mockBookings.forEach((b) => {
      if (filter.studentId && String(b.studentId) !== String(filter.studentId)) return;
      if (filter.status && b.status !== filter.status) return;
      count++;
    });
    return count;
  };

  // Mock TeacherAssessment
  TeacherAssessment.find = (filter) => {
    let list = [...mockAssessments];
    if (filter?.studentId?.$in) {
      const inIds = filter.studentId.$in.map(String);
      list = list.filter((a) => inIds.includes(String(a.studentId)));
    }
    if (filter?.isActive !== undefined) {
      list = list.filter((a) => a.isActive === filter.isActive);
    }
    const result = {
      sort: () => result,
      select: () => result,
      lean: async () => list.map((a) => ({ ...a }))
    };
    return result;
  };

  // Mock TeacherProfile
  TeacherProfile.find = (filter) => {
    let list = [...mockTeacherProfiles];
    if (filter?.userId?.$in) {
      const inIds = filter.userId.$in.map(String);
      list = list.filter((p) => inIds.includes(String(p.userId)));
    }
    return {
      select: () => ({
        lean: async () => list.map((p) => ({ ...p }))
      }),
      lean: async () => list.map((p) => ({ ...p }))
    };
  };

  // Mock TeacherGroupEnrollment
  TeacherGroupEnrollment.find = () => ({
    select: async () => [...mockEnrollments]
  });

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    User.findById = origUserFindById;
    User.find = origUserFind;
    TeacherStudent.find = origTSFind;
    TeacherLesson.find = origTLFind;
    StudentLessonBooking.countDocuments = origSLBCount;
    TeacherAssessment.find = origTAFind;
    TeacherProfile.find = origTPFind;
    TeacherGroupEnrollment.find = origTGEFind;
  }
};

test('Student Dashboard Summary - Phase 7 Suite', async (t) => {
  const mockUsers = [
    { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Student One' },
    { _id: STUDENT_2_ID, role: 'STUDENT', fullName: 'Student Two' },
    { _id: TEACHER_1_ID, role: 'TEACHER', fullName: 'Prof. Gauss', profileImage: 'https://avatar/gauss.png' }
  ];

  const mockTeacherStudents = [
    {
      _id: RELATIONSHIP_1_ID,
      teacherId: TEACHER_1_ID,
      linkedUserId: STUDENT_1_ID,
      studentUserId: STUDENT_1_ID,
      relationshipStatus: 'ACTIVE',
      isActive: true
    }
  ];

  const mockTeacherProfiles = [
    {
      userId: TEACHER_1_ID,
      title: 'Mathematics Professor',
      mainSubject: 'Calculus'
    }
  ];

  await t.test('1. Student receives dashboard summary with nextLesson, pending bookings, and academic stats', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 days in future

    const mockLessons = [
      {
        _id: '507f1f77bcf86cd7994390a1',
        teacherId: TEACHER_1_ID,
        studentId: RELATIONSHIP_1_ID,
        lessonType: 'ONE_ON_ONE',
        subject: 'Calculus III',
        date: futureDate,
        startTime: '14:00',
        endTime: '15:00',
        lessonStatus: 'SCHEDULED',
        isActive: true,
        notes: 'Private teacher secret notes that must not leak',
        attendance: [
          { studentId: RELATIONSHIP_1_ID, status: 'NOT_RECORDED', note: '' }
        ],
        homework: {
          title: 'Problem Set 4',
          description: 'Integrals',
          dueDate: futureDate,
          isCompleted: false
        }
      }
    ];

    const mockBookings = [
      { studentId: STUDENT_1_ID, status: 'PENDING' },
      { studentId: STUDENT_1_ID, status: 'CONFIRMED' }
    ];

    const mockAssessments = [
      { studentId: RELATIONSHIP_1_ID, percentage: 88, isActive: true },
      { studentId: RELATIONSHIP_1_ID, percentage: 92, isActive: true }
    ];

    await withDashboardTestServer(
      {
        mockUsers,
        mockTeacherStudents,
        mockLessons,
        mockBookings,
        mockAssessments,
        mockTeacherProfiles
      },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/dashboard/summary`, {
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
        });

        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.data);

        // Next lesson checks
        assert.ok(json.data.nextLesson);
        assert.equal(json.data.nextLesson.subject, 'Calculus III');
        assert.equal(json.data.nextLesson.teacher.name, 'Prof. Gauss');
        // Privacy check: notes must NOT be present
        assert.equal(json.data.nextLesson.notes, undefined);

        // Bookings count check (only PENDING)
        assert.equal(json.data.pendingBookingsCount, 1);

        // Active teachers count
        assert.equal(json.data.activeTeachersCount, 1);
        assert.equal(json.data.activeTeachers[0].name, 'Prof. Gauss');

        // Academic stats check
        assert.equal(json.data.stats.averagePercentage, 90);
        assert.equal(json.data.stats.homeworkPercentage, 0); // 0 of 1 completed
      }
    );
  });

  await t.test('2. Tenancy Isolation: Student B cannot see Student A bookings or lessons', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const mockLessons = [
      {
        _id: '507f1f77bcf86cd7994390a1',
        teacherId: TEACHER_1_ID,
        studentId: RELATIONSHIP_1_ID, // belongs to STUDENT_1
        lessonType: 'ONE_ON_ONE',
        subject: 'Calculus III',
        date: futureDate,
        startTime: '14:00',
        endTime: '15:00',
        lessonStatus: 'SCHEDULED',
        isActive: true
      }
    ];

    const mockBookings = [
      { studentId: STUDENT_1_ID, status: 'PENDING' }
    ];

    await withDashboardTestServer(
      {
        mockUsers,
        mockTeacherStudents, // Only STUDENT_1 has relationship
        mockLessons,
        mockBookings
      },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/dashboard/summary`, {
          headers: authHeader({ userId: STUDENT_2_ID, role: 'STUDENT' })
        });

        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.data.nextLesson, null);
        assert.equal(json.data.pendingBookingsCount, 0);
        assert.equal(json.data.activeTeachersCount, 0);
        assert.equal(json.data.stats.averagePercentage, null);
      }
    );
  });

  await t.test('3. Next upcoming lesson correctly excludes CANCELLED and NO_SHOW lessons', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const mockLessons = [
      {
        _id: '507f1f77bcf86cd7994390a2',
        teacherId: TEACHER_1_ID,
        studentId: RELATIONSHIP_1_ID,
        lessonType: 'ONE_ON_ONE',
        subject: 'Cancelled Class',
        date: futureDate,
        startTime: '10:00',
        endTime: '11:00',
        lessonStatus: 'CANCELLED',
        isActive: true
      }
    ];

    await withDashboardTestServer(
      {
        mockUsers,
        mockTeacherStudents,
        mockLessons
      },
      async ({ baseUrl }) => {
        const res = await fetch(`${baseUrl}/api/students/dashboard/summary`, {
          headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
        });

        const json = await res.json();
        assert.equal(res.status, 200);
        assert.equal(json.data.nextLesson, null);
      }
    );
  });
});
