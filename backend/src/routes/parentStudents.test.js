// backend/src/routes/parentStudents.test.js
// ============================================================
// PARENT-STUDENT LEARNING MANAGEMENT TESTS (PHASE 10)
//
// Minimum test requirements:
// 1. Parent (Worker/Employer) can create link request.
// 2. Duplicate link request is prevented.
// 3. Parent cannot link itself as child.
// 4. Unauthorized role (Student/Teacher) cannot create parent-child request.
// 5. Student can accept own incoming request -> status becomes ACTIVE.
// 6. Student can reject own incoming request -> status becomes REJECTED.
// 7. Parent cannot accept on behalf of Student.
// 8. Rejected relationship does not grant child-data access (403).
// 9. Pending relationship does not grant child-data access (403).
// 10. ACTIVE relationship grants authorized child-data access (200).
// 11. Ended relationship loses access (403).
// 12. Parent cannot access another parent's child (isolation).
// 13. Parent cannot access arbitrary Student IDs without link.
// 14. Student cannot access another Student through parent endpoints.
// 15. Worker cannot access Employer's linked child (tenancy isolation).
// 16. Parent can book a lesson on behalf of child with child's active teacher.
// 17. Lesson booking rejects if child has no active relationship with that teacher.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ParentStudent from '../models/ParentStudent.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherAssessment from '../models/TeacherAssessment.js';
import StudentLessonBooking from '../models/StudentLessonBooking.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import StudentProfile from '../models/StudentProfile.js';
import parentStudentRouter from './parentStudents.js';

// Prevent activity throttling mongo timeout
User.findOneAndUpdate = () => Promise.resolve({});

const JWT_SECRET = 'parent-student-test-secret-2026-very-secure';
process.env.JWT_SECRET = JWT_SECRET;

const WORKER_PARENT_ID = '665f1a2b3c4d5e6f7a8b8001';
const EMPLOYER_PARENT_ID = '665f1a2b3c4d5e6f7a8b8002';
const STUDENT_1_ID = '665f1a2b3c4d5e6f7a8b8003';
const STUDENT_2_ID = '665f1a2b3c4d5e6f7a8b8004';
const TEACHER_1_ID = '665f1a2b3c4d5e6f7a8b8005';
const TS_REL_1_ID = '665f1a2b3c4d5e6f7a8b8006';

const authHeader = (userId, role) => ({
  authorization: `Bearer ${jwt.sign({ userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' })}`,
  'content-type': 'application/json'
});

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

const app = express();
app.use(express.json());
app.use('/api/parent-students', parentStudentRouter);

const server = http.createServer(app);

const request = async (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        host: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
};

test('Parent-Student Learning Management Test Suite (Phase 10)', async (t) => {
  await new Promise((res) => server.listen(0, '127.0.0.1', res));

  let users = [
    { _id: WORKER_PARENT_ID, fullName: 'Parent Worker', email: 'worker@parent.com', role: 'WORKER' },
    { _id: EMPLOYER_PARENT_ID, fullName: 'Parent Employer', email: 'employer@parent.com', role: 'EMPLOYER' },
    { _id: STUDENT_1_ID, fullName: 'Student Alice', email: 'alice@student.com', role: 'STUDENT' },
    { _id: STUDENT_2_ID, fullName: 'Student Bob', email: 'bob@student.com', role: 'STUDENT' },
    { _id: TEACHER_1_ID, fullName: 'Teacher Smith', email: 'smith@teacher.com', role: 'TEACHER' }
  ];

  let parentStudentLinks = [];
  let teacherStudentLinks = [
    {
      _id: TS_REL_1_ID,
      teacherId: TEACHER_1_ID,
      studentUserId: STUDENT_1_ID,
      linkedUserId: STUDENT_1_ID,
      isActive: true,
      relationshipStatus: 'ACTIVE'
    }
  ];
  let teacherLessons = [
    {
      _id: '665f1a2b3c4d5e6f7a8b8020',
      teacherId: TEACHER_1_ID,
      studentId: TS_REL_1_ID,
      lessonType: 'ONE_ON_ONE',
      subject: 'Mathematics',
      date: new Date('2026-11-01T10:00:00Z'),
      startTime: '10:00',
      endTime: '11:00',
      lessonStatus: 'SCHEDULED',
      isActive: true,
      homework: {
        title: 'Calculus Exercises',
        description: 'Complete questions 1 to 5',
        dueDate: new Date('2026-11-02T10:00:00Z'),
        isCompleted: false
      }
    }
  ];
  let studentBookings = [];
  let teacherAssessments = [
    {
      _id: '665f1a2b3c4d5e6f7a8b8030',
      teacherId: TEACHER_1_ID,
      studentId: TS_REL_1_ID,
      title: 'Midterm Exam',
      subject: 'Mathematics',
      type: 'EXAM',
      score: 92,
      maxScore: 100,
      grade: 'A',
      date: new Date('2026-10-15T09:00:00Z'),
      feedback: 'Excellent problem solving',
      isActive: true
    }
  ];

  // Universal Mongoose Mocks
  User.findById = (id) => {
    const user = users.find((u) => String(u._id) === String(id));
    return makeMockQuery(user || null);
  };
  User.findOne = (query) => {
    const user = users.find((u) => {
      if (query.email && u.email !== query.email) return false;
      if (query._id && String(u._id) !== String(query._id)) return false;
      return true;
    });
    return makeMockQuery(user || null);
  };
  User.find = (query) => {
    let list = [...users];
    if (query._id?.$in) {
      const ids = query._id.$in.map(String);
      list = list.filter((u) => ids.includes(String(u._id)));
    }
    return makeMockQuery(list);
  };

  StudentProfile.findOne = () => makeMockQuery(null);
  TeacherGroupEnrollment.find = () => makeMockQuery([]);

  ParentStudent.find = (query) => {
    const list = parentStudentLinks.filter((l) => {
      if (query.parentUserId && String(l.parentUserId) !== String(query.parentUserId)) return false;
      if (query.studentUserId && String(l.studentUserId) !== String(query.studentUserId)) return false;
      if (query.relationshipStatus && l.relationshipStatus !== query.relationshipStatus) return false;
      return true;
    });
    return makeMockQuery(list);
  };

  ParentStudent.findOne = (query) => {
    const found = parentStudentLinks.find((l) => {
      if (query.parentUserId && String(l.parentUserId) !== String(query.parentUserId)) return false;
      if (query.studentUserId && String(l.studentUserId) !== String(query.studentUserId)) return false;
      if (query.relationshipStatus && l.relationshipStatus !== query.relationshipStatus) return false;
      return true;
    });
    return makeMockQuery(found || null);
  };

  ParentStudent.findById = (id) => {
    const found = parentStudentLinks.find((l) => String(l._id) === String(id));
    return makeMockQuery(found || null);
  };

  ParentStudent.create = async (doc) => {
    const newDoc = {
      _id: `665f1a2b3c4d5e6f7a8b${String(parentStudentLinks.length + 1).padStart(4, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc
    };
    parentStudentLinks.push(newDoc);
    return newDoc;
  };

  TeacherStudent.find = (query) => {
    const list = teacherStudentLinks.filter((ts) => {
      if (query.$or) {
        const matchLinked = query.$or.some((c) => String(c.linkedUserId) === String(ts.linkedUserId));
        const matchStudent = query.$or.some((c) => String(c.studentUserId) === String(ts.studentUserId));
        return matchLinked || matchStudent;
      }
      return true;
    });
    return makeMockQuery(list);
  };

  TeacherStudent.findOne = (query) => {
    const found = teacherStudentLinks.find((ts) => {
      if (query.teacherId && String(ts.teacherId) !== String(query.teacherId)) return false;
      if (query.$or) {
        const matchLinked = query.$or.some((c) => String(c.linkedUserId) === String(ts.linkedUserId));
        const matchStudent = query.$or.some((c) => String(c.studentUserId) === String(ts.studentUserId));
        if (!matchLinked && !matchStudent) return false;
      }
      return true;
    });
    return makeMockQuery(found || null);
  };

  TeacherLesson.find = () => makeMockQuery(teacherLessons);
  TeacherLesson.findOne = () => makeMockQuery(teacherLessons[0] || null);
  TeacherLesson.countDocuments = async () => teacherLessons.length;

  TeacherAssessment.find = () => makeMockQuery(teacherAssessments);
  TeacherAssessment.countDocuments = async () => teacherAssessments.length;

  StudentLessonBooking.find = () => makeMockQuery(studentBookings);
  StudentLessonBooking.findOne = (query) => {
    const found = studentBookings.find((b) => b.teacherId === query.teacherId && b.date === query.date);
    return makeMockQuery(found || null);
  };
  StudentLessonBooking.create = async (doc) => {
    const created = {
      _id: `665f1a2b3c4d5e6f7a8b${String(studentBookings.length + 50).padStart(4, '0')}`,
      createdAt: new Date(),
      ...doc
    };
    studentBookings.push(created);
    return created;
  };
  StudentLessonBooking.countDocuments = async () => studentBookings.length;

  t.after(() => {
    server.close();
  });

  let createdRequestId = null;

  await t.test('1. Parent (WORKER) can send link request to Student by email', async () => {
    const res = await request(
      'POST',
      '/api/parent-students/request',
      authHeader(WORKER_PARENT_ID, 'WORKER'),
      { studentEmail: 'alice@student.com', relationshipType: 'PARENT' }
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.relationship.relationshipStatus, 'PENDING');
    createdRequestId = res.body.relationship._id;
  });

  await t.test('2. Duplicate link request is prevented (400)', async () => {
    const res = await request(
      'POST',
      '/api/parent-students/request',
      authHeader(WORKER_PARENT_ID, 'WORKER'),
      { studentUserId: STUDENT_1_ID }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await t.test('3. Parent cannot link itself as child (400)', async () => {
    const res = await request(
      'POST',
      '/api/parent-students/request',
      authHeader(WORKER_PARENT_ID, 'WORKER'),
      { studentUserId: WORKER_PARENT_ID }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await t.test('4. Unauthorized role (STUDENT) cannot create parent request (403)', async () => {
    const res = await request(
      'POST',
      '/api/parent-students/request',
      authHeader(STUDENT_1_ID, 'STUDENT'),
      { studentUserId: STUDENT_2_ID }
    );
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('5. Student can see incoming request from Parent', async () => {
    const res = await request(
      'GET',
      '/api/parent-students/requests',
      authHeader(STUDENT_1_ID, 'STUDENT')
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.requests.length, 1);
    assert.equal(res.body.requests[0].id, createdRequestId);
  });

  await t.test('6. Parent cannot accept on behalf of Student (403)', async () => {
    const res = await request(
      'POST',
      `/api/parent-students/${createdRequestId}/accept`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 403);
  });

  await t.test('7. Another Student cannot accept request intended for Alice (403)', async () => {
    const res = await request(
      'POST',
      `/api/parent-students/${createdRequestId}/accept`,
      authHeader(STUDENT_2_ID, 'STUDENT')
    );
    assert.equal(res.status, 403);
  });

  await t.test('8. Pending relationship does not grant child data access (403)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/overview`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 403);
  });

  await t.test('9. Student accepts own incoming request -> status becomes ACTIVE', async () => {
    const res = await request(
      'POST',
      `/api/parent-students/${createdRequestId}/accept`,
      authHeader(STUDENT_1_ID, 'STUDENT')
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.relationship.relationshipStatus, 'ACTIVE');
  });

  await t.test('10. ACTIVE relationship grants authorized child data overview (200)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/overview`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.overview.studentId, STUDENT_1_ID);
    assert.equal(res.body.overview.fullName, 'Student Alice');
    assert.equal(res.body.overview.activeTeachersCount, 1);
  });

  await t.test('11. Parent can view child lessons and homework (200)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/lessons`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.lessons.length, 1);
    assert.equal(res.body.lessons[0].subject, 'Mathematics');
    assert.equal(res.body.lessons[0].homework.title, 'Calculus Exercises');
  });

  await t.test('12. Parent can view child progress and assessments (200)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/progress`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.assessments.length, 1);
    assert.equal(res.body.assessments[0].title, 'Midterm Exam');
    assert.equal(res.body.assessments[0].grade, 'A');
  });

  await t.test('13. Tenancy Isolation: Employer parent cannot access Worker parent child (403)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/overview`,
      authHeader(EMPLOYER_PARENT_ID, 'EMPLOYER')
    );
    assert.equal(res.status, 403);
  });

  await t.test('14. Parent cannot access arbitrary unlinked student (403)', async () => {
    const res = await request(
      'GET',
      `/api/parent-students/${STUDENT_2_ID}/overview`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(res.status, 403);
  });

  await t.test('15. Parent can book lesson for child with child active teacher (201)', async () => {
    const res = await request(
      'POST',
      `/api/parent-students/${STUDENT_1_ID}/bookings`,
      authHeader(WORKER_PARENT_ID, 'WORKER'),
      {
        teacherId: TEACHER_1_ID,
        subject: 'Geometry Prep',
        date: '2026-11-10',
        startTime: '14:00',
        endTime: '15:00',
        note: 'Needs help with circle theorems'
      }
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.booking.subject, 'Geometry Prep');
    assert.equal(res.body.booking.status, 'PENDING');
  });

  await t.test('16. Parent booking rejected if child has no active relationship with teacher (403)', async () => {
    const res = await request(
      'POST',
      `/api/parent-students/${STUDENT_2_ID}/bookings`,
      authHeader(WORKER_PARENT_ID, 'WORKER'),
      {
        teacherId: TEACHER_1_ID,
        subject: 'Physics',
        date: '2026-11-10',
        startTime: '16:00',
        endTime: '17:00'
      }
    );
    assert.equal(res.status, 403);
  });

  await t.test('17. Ended relationship loses all child data access (403)', async () => {
    const endRes = await request(
      'POST',
      `/api/parent-students/${createdRequestId}/end`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(endRes.status, 200);

    const accessRes = await request(
      'GET',
      `/api/parent-students/${STUDENT_1_ID}/overview`,
      authHeader(WORKER_PARENT_ID, 'WORKER')
    );
    assert.equal(accessRes.status, 403);
  });
});
