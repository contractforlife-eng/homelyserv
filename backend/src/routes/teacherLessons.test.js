// backend/src/routes/teacherLessons.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import teachersRouter from './teachers.js';

const secret = 'teacher-lessons-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_A_ID = '507f1f77bcf86cd799439070';
const TEACHER_B_ID = '507f1f77bcf86cd799439071';
const WORKER_ID = '507f1f77bcf86cd799439072';

const STUDENT_1_ID = '507f1f77bcf86cd799439081';
const STUDENT_2_ID = '507f1f77bcf86cd799439082';
const STUDENT_B_ID = '507f1f77bcf86cd799439083'; // Belongs to Teacher B

const GROUP_1_ID = '507f1f77bcf86cd799439091';
const GROUP_B_ID = '507f1f77bcf86cd799439092'; // Belongs to Teacher B

const LESSON_1_ID = '507f1f77bcf86cd7994390a1';
const LESSON_2_ID = '507f1f77bcf86cd7994390a2';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select(fields) {
    if (!doc) return Promise.resolve(null);
    if (fields === '-password') {
      const { password, ...rest } = doc;
      return Promise.resolve(rest);
    }
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const withTeacherLessonsServer = async (
  {
    mockStudents = [],
    mockGroups = [],
    mockEnrollments = [],
    mockLessons = []
  } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origStudentFindOne = TeacherStudent.findOne;
  const origGroupFindOne = TeacherGroup.findOne;
  const origEnrollFind = TeacherGroupEnrollment.find;
  const origEnrollAggregate = TeacherGroupEnrollment.aggregate;
  const origLessonFind = TeacherLesson.find;
  const origLessonFindOne = TeacherLesson.findOne;
  const origLessonFindById = TeacherLesson.findById;
  const origLessonCreate = TeacherLesson.create;

  let studentStore = [...mockStudents];
  let groupStore = [...mockGroups];
  let enrollStore = [...mockEnrollments];
  let lessonStore = [...mockLessons];

  User.findById = (id) => {
    const sId = String(id);
    if (sId === TEACHER_A_ID) {
      return wrapQuery({
        _id: TEACHER_A_ID,
        fullName: 'Teacher Alpha',
        role: 'TEACHER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    if (sId === TEACHER_B_ID) {
      return wrapQuery({
        _id: TEACHER_B_ID,
        fullName: 'Teacher Beta',
        role: 'TEACHER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    if (sId === WORKER_ID) {
      return wrapQuery({
        _id: WORKER_ID,
        fullName: 'Worker John',
        role: 'WORKER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    return wrapQuery(null);
  };

  TeacherStudent.findOne = (filter) => {
    const found = studentStore.find((s) => {
      if (filter._id && String(s._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(s.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
      return true;
    });
    return wrapQuery(found || null);
  };

  TeacherGroup.findOne = (filter) => {
    const found = groupStore.find((g) => {
      if (filter._id && String(g._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(g.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && g.isActive !== filter.isActive) return false;
      return true;
    });
    return wrapQuery(found || null);
  };

  TeacherGroupEnrollment.find = (filter) => {
    const list = enrollStore.filter((e) => {
      if (filter.groupId && String(e.groupId) !== String(filter.groupId)) return false;
      if (filter.teacherId && String(e.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    });

    const populated = list.map((e) => {
      const student = studentStore.find((s) => String(s._id) === String(e.studentId));
      return {
        ...e,
        studentId: student || e.studentId
      };
    });

    return {
      populate() {
        return Promise.resolve(populated);
      },
      then(resolve, reject) {
        return Promise.resolve(populated).then(resolve, reject);
      }
    };
  };

  TeacherGroupEnrollment.aggregate = (pipeline) => {
    const matchStage = pipeline.find((p) => p.$match)?.$match || {};
    const filtered = enrollStore.filter((e) => {
      if (matchStage.teacherId && String(e.teacherId) !== String(matchStage.teacherId)) return false;
      if (matchStage.isActive !== undefined && e.isActive !== matchStage.isActive) return false;
      if (matchStage.status && e.status !== matchStage.status) return false;
      return true;
    });

    const map = {};
    for (const item of filtered) {
      const gId = String(item.groupId);
      map[gId] = (map[gId] || 0) + 1;
    }
    const result = Object.entries(map).map(([_id, count]) => ({ _id, count }));
    return Promise.resolve(result);
  };

  const populateLessonDoc = (doc) => {
    if (!doc) return null;
    const student = doc.studentId ? studentStore.find((s) => String(s._id) === String(doc.studentId._id || doc.studentId)) : null;
    const group = doc.groupId ? groupStore.find((g) => String(g._id) === String(doc.groupId._id || doc.groupId)) : null;

    const populatedAtt = (doc.attendance || []).map((a) => {
      const s = studentStore.find((st) => String(st._id) === String(a.studentId._id || a.studentId));
      return {
        ...a,
        studentId: s ? { _id: s._id, fullName: s.fullName, linkedUserId: s.linkedUserId } : a.studentId
      };
    });

    const populated = {
      ...doc,
      studentId: student || null,
      groupId: group || null,
      attendance: populatedAtt,
      save: async function () {
        const idx = lessonStore.findIndex((l) => String(l._id) === String(this._id));
        if (idx !== -1) {
          lessonStore[idx] = { ...this };
        }
        return this;
      }
    };
    return populated;
  };

  TeacherLesson.find = (filter) => {
    const filtered = lessonStore.filter((l) => {
      if (filter.teacherId && String(l.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && l.isActive !== filter.isActive) return false;
      if (filter.lessonStatus && l.lessonStatus !== filter.lessonStatus) return false;
      if (filter.lessonType && l.lessonType !== filter.lessonType) return false;
      if (filter.groupId && String(l.groupId) !== String(filter.groupId)) return false;
      if (filter.studentId && String(l.studentId) !== String(filter.studentId)) return false;
      if (filter.date) {
        const lDate = new Date(l.date).getTime();
        if (filter.date.$gte && lDate < new Date(filter.date.$gte).getTime()) return false;
        if (filter.date.$lte && lDate > new Date(filter.date.$lte).getTime()) return false;
      }
      return true;
    });

    const populated = filtered.map(populateLessonDoc);

    const query = {
      sort() {
        return query;
      },
      populate() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(populated).then(resolve, reject);
      }
    };
    return query;
  };

  TeacherLesson.findOne = (filter) => {
    const found = lessonStore.find((l) => {
      if (filter._id && String(l._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(l.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && l.isActive !== filter.isActive) return false;
      return true;
    });

    const populated = populateLessonDoc(found);
    const query = {
      populate() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(populated).then(resolve, reject);
      }
    };
    return query;
  };

  TeacherLesson.findById = (id) => {
    const found = lessonStore.find((l) => String(l._id) === String(id));
    const populated = populateLessonDoc(found);
    const query = {
      populate() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(populated).then(resolve, reject);
      }
    };
    return query;
  };

  TeacherLesson.create = async (data) => {
    const newDoc = {
      _id: '507f1f77bcf86cd7994390a' + (lessonStore.length + 3),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    lessonStore.push(newDoc);
    return populateLessonDoc(newDoc);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/teachers', teachersRouter);

  const server = app.listen(0);
  const port = server.address().port;

  try {
    await run({
      baseUrl: `http://127.0.0.1:${port}`,
      getLessons: () => lessonStore
    });
  } finally {
    server.close();
    User.findById = origUserFindById;
    TeacherStudent.findOne = origStudentFindOne;
    TeacherGroup.findOne = origGroupFindOne;
    TeacherGroupEnrollment.find = origEnrollFind;
    TeacherGroupEnrollment.aggregate = origEnrollAggregate;
    TeacherLesson.find = origLessonFind;
    TeacherLesson.findOne = origLessonFindOne;
    TeacherLesson.findById = origLessonFindById;
    TeacherLesson.create = origLessonCreate;
  }
};

test('Teacher Lessons - Authentication and Role Authorization', async () => {
  await withTeacherLessonsServer({}, async ({ baseUrl }) => {
    // 401 Unauthenticated
    const resNoAuth = await fetch(`${baseUrl}/api/teachers/lessons`);
    assert.equal(resNoAuth.status, 401);

    // 403 Forbidden for non-teacher role (WORKER)
    const resWorker = await fetch(`${baseUrl}/api/teachers/lessons`, {
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
    });
    assert.equal(resWorker.status, 403);
  });
});

test('Teacher Lessons - Create ONE_ON_ONE Lesson: validates student ownership and times', async () => {
  const mockStudents = [
    {
      _id: STUDENT_1_ID,
      teacherId: TEACHER_A_ID,
      fullName: 'Student One',
      isActive: true,
      linkedUserId: null
    },
    {
      _id: STUDENT_B_ID,
      teacherId: TEACHER_B_ID,
      fullName: 'Student Other Teacher',
      isActive: true,
      linkedUserId: null
    }
  ];

  await withTeacherLessonsServer({ mockStudents }, async ({ baseUrl, getLessons }) => {
    // Attempt with invalid end time (end <= start)
    const resInvalidTime = await fetch(`${baseUrl}/api/teachers/lessons`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        lessonType: 'ONE_ON_ONE',
        studentId: STUDENT_1_ID,
        subject: 'Calculus',
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '09:00'
      })
    });
    assert.equal(resInvalidTime.status, 400);
    const bodyTime = await resInvalidTime.json();
    assert.equal(bodyTime.success, false);

    // Attempt with student belonging to Teacher B (should return 404)
    const resOtherStudent = await fetch(`${baseUrl}/api/teachers/lessons`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        lessonType: 'ONE_ON_ONE',
        studentId: STUDENT_B_ID,
        subject: 'Calculus',
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '11:00'
      })
    });
    assert.equal(resOtherStudent.status, 404);

    // Valid creation
    const resValid = await fetch(`${baseUrl}/api/teachers/lessons`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        lessonType: 'ONE_ON_ONE',
        studentId: STUDENT_1_ID,
        subject: 'Calculus',
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '11:00',
        homework: {
          title: 'Derivatives worksheet',
          dueDate: '2026-10-20'
        }
      })
    });
    assert.equal(resValid.status, 201);
    const validData = await resValid.json();
    assert.equal(validData.success, true);
    assert.equal(validData.lesson.subject, 'Calculus');
    assert.equal(validData.lesson.lessonType, 'ONE_ON_ONE');
    assert.equal(validData.lesson.student.fullName, 'Student One');
    assert.equal(validData.lesson.attendance.length, 1);
  });
});

test('Teacher Lessons - Create GROUP Lesson and Attendance Tracking', async () => {
  const mockStudents = [
    { _id: STUDENT_1_ID, teacherId: TEACHER_A_ID, fullName: 'Student One', isActive: true },
    { _id: STUDENT_2_ID, teacherId: TEACHER_A_ID, fullName: 'Student Two', isActive: true }
  ];

  const mockGroups = [
    { _id: GROUP_1_ID, teacherId: TEACHER_A_ID, name: 'Physics Grade 11', subject: 'Physics', isActive: true },
    { _id: GROUP_B_ID, teacherId: TEACHER_B_ID, name: 'Group Teacher B', subject: 'Math', isActive: true }
  ];

  const mockEnrollments = [
    { groupId: GROUP_1_ID, studentId: STUDENT_1_ID, teacherId: TEACHER_A_ID, isActive: true, status: 'ACTIVE' },
    { groupId: GROUP_1_ID, studentId: STUDENT_2_ID, teacherId: TEACHER_A_ID, isActive: true, status: 'ACTIVE' }
  ];

  await withTeacherLessonsServer({ mockStudents, mockGroups, mockEnrollments }, async ({ baseUrl, getLessons }) => {
    // Attempt with Group belonging to Teacher B (404)
    const resOtherGroup = await fetch(`${baseUrl}/api/teachers/lessons`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        lessonType: 'GROUP',
        groupId: GROUP_B_ID,
        subject: 'Physics',
        date: '2026-10-16',
        startTime: '14:00',
        endTime: '15:30'
      })
    });
    assert.equal(resOtherGroup.status, 404);

    // Create GROUP lesson
    const resCreate = await fetch(`${baseUrl}/api/teachers/lessons`, {
      method: 'POST',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        lessonType: 'GROUP',
        groupId: GROUP_1_ID,
        subject: 'Physics',
        date: '2026-10-16',
        startTime: '14:00',
        endTime: '15:30'
      })
    });
    assert.equal(resCreate.status, 201);
    const createData = await resCreate.json();
    const createdLessonId = createData.lesson.id;

    // Save Attendance: Attempting to submit attendance for student not enrolled in this group (400)
    const resBadAtt = await fetch(`${baseUrl}/api/teachers/lessons/${createdLessonId}/attendance`, {
      method: 'PUT',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        attendance: [
          { studentId: '507f1f77bcf86cd799439099', status: 'PRESENT' } // Not enrolled
        ]
      })
    });
    assert.equal(resBadAtt.status, 400);

    // Valid attendance update
    const resValidAtt = await fetch(`${baseUrl}/api/teachers/lessons/${createdLessonId}/attendance`, {
      method: 'PUT',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' }),
      body: JSON.stringify({
        attendance: [
          { studentId: STUDENT_1_ID, status: 'PRESENT', note: 'Participated well' },
          { studentId: STUDENT_2_ID, status: 'ABSENT', note: 'Sick leave' }
        ]
      })
    });
    assert.equal(resValidAtt.status, 200);
    const attData = await resValidAtt.json();
    assert.equal(attData.success, true);
    assert.equal(attData.lesson.attendance.length, 2);
    assert.equal(attData.lesson.attendance[0].status, 'PRESENT');
    assert.equal(attData.lesson.attendance[1].status, 'ABSENT');
  });
});

test('Teacher Lessons - Tenancy Isolation: Teacher B cannot view, update or delete Teacher A lesson', async () => {
  const mockStudents = [
    { _id: STUDENT_1_ID, teacherId: TEACHER_A_ID, fullName: 'Student One', isActive: true }
  ];

  const mockLessons = [
    {
      _id: LESSON_1_ID,
      teacherId: TEACHER_A_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: STUDENT_1_ID,
      subject: 'English Literature',
      date: new Date('2026-10-18'),
      startTime: '11:00',
      endTime: '12:00',
      lessonStatus: 'SCHEDULED',
      attendance: [{ studentId: STUDENT_1_ID, status: 'NOT_RECORDED' }],
      isActive: true
    }
  ];

  await withTeacherLessonsServer({ mockStudents, mockLessons }, async ({ baseUrl }) => {
    // Teacher B attempts to view Teacher A's lesson (404)
    const resGet = await fetch(`${baseUrl}/api/teachers/lessons/${LESSON_1_ID}`, {
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER' })
    });
    assert.equal(resGet.status, 404);

    // Teacher B attempts to update Teacher A's lesson (404)
    const resUpdate = await fetch(`${baseUrl}/api/teachers/lessons/${LESSON_1_ID}`, {
      method: 'PUT',
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER' }),
      body: JSON.stringify({ subject: 'Hacked Subject' })
    });
    assert.equal(resUpdate.status, 404);

    // Teacher B attempts to delete Teacher A's lesson (404)
    const resDelete = await fetch(`${baseUrl}/api/teachers/lessons/${LESSON_1_ID}`, {
      method: 'DELETE',
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER' })
    });
    assert.equal(resDelete.status, 404);

    // Teacher A can soft-delete their own lesson
    const resOwnerDelete = await fetch(`${baseUrl}/api/teachers/lessons/${LESSON_1_ID}`, {
      method: 'DELETE',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' })
    });
    assert.equal(resOwnerDelete.status, 200);
  });
});

test('Teacher Lessons & Schedule - Date Range Filtering (startDate & endDate)', async () => {
  const mockStudents = [
    { _id: STUDENT_1_ID, teacherId: TEACHER_A_ID, fullName: 'Student One', isActive: true }
  ];

  const mockLessons = [
    {
      _id: '507f1f77bcf86cd7994390c1',
      teacherId: TEACHER_A_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: STUDENT_1_ID,
      subject: 'Math Day 1',
      date: new Date('2026-10-01T10:00:00.000Z'),
      startTime: '10:00',
      endTime: '11:00',
      lessonStatus: 'SCHEDULED',
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd7994390c2',
      teacherId: TEACHER_A_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: STUDENT_1_ID,
      subject: 'Math Day 5',
      date: new Date('2026-10-05T14:00:00.000Z'),
      startTime: '14:00',
      endTime: '15:00',
      lessonStatus: 'SCHEDULED',
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd7994390c3',
      teacherId: TEACHER_A_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: STUDENT_1_ID,
      subject: 'Math Day 10',
      date: new Date('2026-10-10T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '10:00',
      lessonStatus: 'SCHEDULED',
      isActive: true
    }
  ];

  await withTeacherLessonsServer({ mockStudents, mockLessons }, async ({ baseUrl }) => {
    // 1. Query startDate only (>= Oct 5): should return Day 5 and Day 10
    const resStartOnly = await fetch(`${baseUrl}/api/teachers/lessons?startDate=2026-10-05`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' })
    });
    assert.equal(resStartOnly.status, 200);
    const dataStartOnly = await resStartOnly.json();
    assert.equal(dataStartOnly.count, 2);

    // 2. Query endDate only (<= Oct 5): should return Day 1 and Day 5
    const resEndOnly = await fetch(`${baseUrl}/api/teachers/lessons?endDate=2026-10-05`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' })
    });
    assert.equal(resEndOnly.status, 200);
    const dataEndOnly = await resEndOnly.json();
    assert.equal(dataEndOnly.count, 2);

    // 3. Query inclusive date range [Oct 02 .. Oct 07]: should return Day 5 only
    const resRange = await fetch(`${baseUrl}/api/teachers/lessons?startDate=2026-10-02&endDate=2026-10-07`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' })
    });
    assert.equal(resRange.status, 200);
    const dataRange = await resRange.json();
    assert.equal(dataRange.count, 1);
    assert.equal(dataRange.lessons[0].subject, 'Math Day 5');

    // 4. Query exact boundaries [Oct 01 .. Oct 05]: should return Day 1 and Day 5
    const resBoundaries = await fetch(`${baseUrl}/api/teachers/lessons?startDate=2026-10-01&endDate=2026-10-05`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER' })
    });
    assert.equal(resBoundaries.status, 200);
    const dataBoundaries = await resBoundaries.json();
    assert.equal(dataBoundaries.count, 2);
  });
});

