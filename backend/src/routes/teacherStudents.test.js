// backend/src/routes/teacherStudents.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import teachersRouter from './teachers.js';

const secret = 'teacher-students-test-secret-2026';
process.env.JWT_SECRET = secret;

const TEACHER_A_ID = '507f1f77bcf86cd799439070';
const TEACHER_B_ID = '507f1f77bcf86cd799439071';
const WORKER_ID = '507f1f77bcf86cd799439072';
const STUDENT_USER_ID = '507f1f77bcf86cd799439073';

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

const withTeacherStudentsServer = async ({ mockStudents = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalStudentFind = TeacherStudent.find;
  const originalStudentFindOne = TeacherStudent.findOne;
  const originalStudentCreate = TeacherStudent.create;

  let store = [...mockStudents];

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
    if (sId === STUDENT_USER_ID) {
      return wrapQuery({
        _id: STUDENT_USER_ID,
        fullName: 'Homely Student User',
        role: 'STUDENT',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    return wrapQuery(null);
  };

  TeacherStudent.find = (filter) => {
    let result = store.filter((s) => {
      if (filter.teacherId && String(s.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
      if (filter.status && s.status !== filter.status) return false;
      return true;
    });

    const chain = {
      sort() { return chain; },
      populate() { return chain; },
      then(resolve, reject) {
        return Promise.resolve(result.map(doc => ({
          ...doc,
          toObject: () => ({ ...doc })
        }))).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherStudent.findOne = (filter) => {
    const found = store.find((s) => {
      if (filter._id && String(s._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(s.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
      return true;
    });

    const chain = {
      populate() { return chain; },
      then(resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        const docObj = {
          ...found,
          toObject: function () { return { ...this }; },
          save: function () {
            const idx = store.findIndex(x => String(x._id) === String(found._id));
            if (idx >= 0) store[idx] = { ...this };
            return Promise.resolve(this);
          }
        };
        return Promise.resolve(docObj).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherStudent.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => ({
      ...item,
      _id: item._id || `507f1f77bcf86cd79943908${store.length + idx}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: function () { return { ...this }; },
      save: function () { return Promise.resolve(this); }
    }));
    store.push(...created);
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/teachers', teachersRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const port = server.address().port;
    await run(`http://127.0.0.1:${port}`, {
      getStore: () => store,
      setStore: (s) => { store = s; }
    });
  } finally {
    User.findById = originalUserFindById;
    TeacherStudent.find = originalStudentFind;
    TeacherStudent.findOne = originalStudentFindOne;
    TeacherStudent.create = originalStudentCreate;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('Teacher Students Suite', async (t) => {
  await t.test('1. Auth Guards: 401 unauthenticated, 403 non-teacher', async () => {
    await withTeacherStudentsServer({}, async (baseUrl) => {
      // No token
      const noAuth = await fetch(`${baseUrl}/api/teachers/students`);
      assert.equal(noAuth.status, 401);

      // Worker token (forbidden for teacher route)
      const workerRes = await fetch(`${baseUrl}/api/teachers/students`, {
        headers: authHeader({ userId: WORKER_ID, role: 'WORKER', tokenVersion: 0 })
      });
      assert.equal(workerRes.status, 403);
    });
  });

  await t.test('2. Tenancy Isolation: Teacher A cannot see or mutate Teacher B student', async () => {
    const studentB = {
      _id: '507f1f77bcf86cd799439099',
      teacherId: TEACHER_B_ID,
      fullName: 'Student of Teacher B',
      isActive: true,
      status: 'ACTIVE',
      linkedUserId: null
    };

    await withTeacherStudentsServer({ mockStudents: [studentB] }, async (baseUrl) => {
      const headersA = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      // Teacher A lists students -> should be empty
      const listRes = await fetch(`${baseUrl}/api/teachers/students`, { headers: headersA });
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.equal(listJson.count, 0);

      // Teacher A attempts to fetch Teacher B's student by ID -> 404
      const getRes = await fetch(`${baseUrl}/api/teachers/students/${studentB._id}`, { headers: headersA });
      assert.equal(getRes.status, 404);

      // Teacher A attempts to update Teacher B's student -> 404
      const putRes = await fetch(`${baseUrl}/api/teachers/students/${studentB._id}`, {
        method: 'PUT',
        headers: headersA,
        body: JSON.stringify({ fullName: 'Hacked Name' })
      });
      assert.equal(putRes.status, 404);

      // Teacher A attempts to delete Teacher B's student -> 404
      const delRes = await fetch(`${baseUrl}/api/teachers/students/${studentB._id}`, {
        method: 'DELETE',
        headers: headersA
      });
      assert.equal(delRes.status, 404);
    });
  });

  await t.test('3. External Student Creation: linkedUserId = null and isHomelyStudent = false', async () => {
    await withTeacherStudentsServer({}, async (baseUrl) => {
      const headers = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      const createRes = await fetch(`${baseUrl}/api/teachers/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: 'Kareem',
          lastName: 'Mostafa',
          phone: '+201000000001',
          school: 'Al-Farabi School',
          gradeLevel: 'Grade 11',
          subjects: ['Physics', 'Chemistry']
        })
      });

      assert.equal(createRes.status, 201);
      const json = await createRes.json();
      assert.equal(json.success, true);
      assert.equal(json.student.fullName, 'Kareem Mostafa');
      assert.equal(json.student.linkedUserId, null);
      assert.equal(json.student.isHomelyStudent, false);
      assert.deepEqual(json.student.subjects, ['Physics', 'Chemistry']);
    });
  });

  await t.test('4. Homely Student Creation: linkedUserId set and isHomelyStudent = true', async () => {
    await withTeacherStudentsServer({}, async (baseUrl) => {
      const headers = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      const createRes = await fetch(`${baseUrl}/api/teachers/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName: 'Salma Tarek',
          linkedUserId: STUDENT_USER_ID,
          school: 'Modern Academy',
          gradeLevel: 'Grade 12'
        })
      });

      assert.equal(createRes.status, 201);
      const json = await createRes.json();
      assert.equal(json.success, true);
      assert.equal(json.student.isHomelyStudent, true);
      assert.equal(json.student.linkedUserId, STUDENT_USER_ID);
    });
  });

  await t.test('5. Update and Soft-Delete operations', async () => {
    const studentA = {
      _id: '507f1f77bcf86cd799439088',
      teacherId: TEACHER_A_ID,
      fullName: 'Original Student',
      phone: '012345',
      isActive: true,
      status: 'ACTIVE',
      linkedUserId: null
    };

    await withTeacherStudentsServer({ mockStudents: [studentA] }, async (baseUrl) => {
      const headers = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      // Update
      const putRes = await fetch(`${baseUrl}/api/teachers/students/${studentA._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: 'Updated Student Name',
          gradeLevel: 'Grade 9'
        })
      });
      assert.equal(putRes.status, 200);
      const putJson = await putRes.json();
      assert.equal(putJson.student.fullName, 'Updated Student Name');
      assert.equal(putJson.student.gradeLevel, 'Grade 9');

      // Soft delete
      const delRes = await fetch(`${baseUrl}/api/teachers/students/${studentA._id}`, {
        method: 'DELETE',
        headers
      });
      assert.equal(delRes.status, 200);

      // Once soft-deleted, get returns 404
      const getRes = await fetch(`${baseUrl}/api/teachers/students/${studentA._id}`, { headers });
      assert.equal(getRes.status, 404);
    });
  });
});
