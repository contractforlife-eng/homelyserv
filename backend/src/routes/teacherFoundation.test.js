// backend/src/routes/teacherFoundation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authRouter from './auth.js';
import { requireProfessionalProvider } from '../middleware/auth.js';

const secret = 'teacher-foundation-test-secret-2026';
process.env.JWT_SECRET = secret;

const TEACHER_ID = '507f1f77bcf86cd799439054';
const WORKER_ID = '507f1f77bcf86cd799439052';
const DOCTOR_ID = '507f1f77bcf86cd799439050';
const STUDENT_ID = '507f1f77bcf86cd799439055';
const EMPLOYER_ID = '507f1f77bcf86cd799439053';

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

const createMockUser = (overrides = {}) => ({
  _id: TEACHER_ID,
  fullName: 'Prof. Test Teacher',
  email: 'teacher@homelyserv.test',
  role: 'TEACHER',
  tokenVersion: 0,
  isSuspended: false,
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  ...overrides
});

const withTeacherServer = async ({ mockUser = createMockUser() } = {}, run) => {
  const originalUserFindById = User.findById;

  User.findById = (id) => {
    const idStr = String(id);
    if (idStr === TEACHER_ID) {
      return wrapQuery(mockUser);
    }
    if (idStr === WORKER_ID) {
      return wrapQuery(createMockUser({ _id: WORKER_ID, email: 'worker@homelyserv.test', role: 'WORKER' }));
    }
    if (idStr === DOCTOR_ID) {
      return wrapQuery(createMockUser({ _id: DOCTOR_ID, email: 'doctor@homelyserv.test', role: 'DOCTOR' }));
    }
    if (idStr === STUDENT_ID) {
      return wrapQuery(createMockUser({ _id: STUDENT_ID, email: 'student@homelyserv.test', role: 'STUDENT' }));
    }
    if (idStr === EMPLOYER_ID) {
      return wrapQuery(createMockUser({ _id: EMPLOYER_ID, email: 'employer@homelyserv.test', role: 'EMPLOYER' }));
    }
    return wrapQuery(null);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  // Test route guarded by requireProfessionalProvider
  app.get('/api/test-provider-guard', requireProfessionalProvider, (req, res) => {
    return res.status(200).json({
      success: true,
      userRole: req.userRole,
      userId: req.userId
    });
  });

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    User.findById = originalUserFindById;
  }
};

test('1. TEACHER public registration is rejected with 400 and creates no user', async () => {
  const originalUserSave = User.prototype.save;
  const originalUserFindOne = User.findOne;
  const savedRoles = [];

  User.findOne = async () => null; // Email not taken
  User.prototype.save = async function () {
    savedRoles.push(this.role);
    return this;
  };

  try {
    await withTeacherServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Prof. Mary Teacher',
          email: 'prof.mary@homelyserv.test',
          password: 'Password123!',
          role: 'TEACHER',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /valid account role/i);
      assert.deepEqual(savedRoles, [], 'blocked TEACHER registration must not create a user');
    });
  } finally {
    User.prototype.save = originalUserSave;
    User.findOne = originalUserFindOne;
  }
});

test('2. TEACHER login returns TEACHER role in user payload and JWT token', async () => {
  const originalUserFindOne = User.findOne;
  const originalUserSave = User.prototype.save;
  const bcrypt = (await import('bcryptjs')).default;
  const hashedPassword = await bcrypt.hash('TeacherPass123!', 10);

  const teacherDoc = createMockUser({
    _id: TEACHER_ID,
    email: 'registered.teacher@homelyserv.test',
    password: hashedPassword,
    role: 'TEACHER',
    save: async function () { return this; },
    toObject() { return { ...this }; }
  });

  User.findOne = async () => teacherDoc;
  User.prototype.save = async function () { return this; };

  try {
    await withTeacherServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'registered.teacher@homelyserv.test',
          password: 'TeacherPass123!'
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'TEACHER');

      const decoded = jwt.verify(data.token, secret);
      assert.strictEqual(decoded.role, 'TEACHER');
    });
  } finally {
    User.findOne = originalUserFindOne;
    User.prototype.save = originalUserSave;
  }
});

test('3. Authentication middleware attaches req.userRole === TEACHER and requireProfessionalProvider allows TEACHER', async () => {
  await withTeacherServer({}, async (baseUrl) => {
    // TEACHER succeeds (200) and exposes req.userRole === 'TEACHER'
    const resTeacher = await fetch(`${baseUrl}/api/test-provider-guard`, {
      method: 'GET',
      headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.strictEqual(resTeacher.status, 200);
    const dataTeacher = await resTeacher.json();
    assert.strictEqual(dataTeacher.userRole, 'TEACHER');

    // WORKER succeeds (200)
    const resWorker = await fetch(`${baseUrl}/api/test-provider-guard`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER', tokenVersion: 0 })
    });
    assert.strictEqual(resWorker.status, 200);

    // DOCTOR succeeds (200)
    const resDoctor = await fetch(`${baseUrl}/api/test-provider-guard`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 })
    });
    assert.strictEqual(resDoctor.status, 200);

    // STUDENT receives 403
    const resStudent = await fetch(`${baseUrl}/api/test-provider-guard`, {
      method: 'GET',
      headers: authHeader({ userId: STUDENT_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.strictEqual(resStudent.status, 403);

    // EMPLOYER receives 403
    const resEmployer = await fetch(`${baseUrl}/api/test-provider-guard`, {
      method: 'GET',
      headers: authHeader({ userId: EMPLOYER_ID, role: 'EMPLOYER', tokenVersion: 0 })
    });
    assert.strictEqual(resEmployer.status, 403);
  });
});

test('4. WORKER and EMPLOYER registration behavior remains intact while STUDENT and DOCTOR are rejected', async () => {
  const originalUserSave = User.prototype.save;
  const originalUserFindOne = User.findOne;
  const savedRoles = [];

  User.findOne = async () => null;
  User.prototype.save = async function () {
    savedRoles.push(this.role);
    return this;
  };

  try {
    await withTeacherServer({}, async (baseUrl) => {
      // 1. WORKER
      const resWorker = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Worker User',
          email: 'worker.check@homelyserv.test',
          password: 'Password123!',
          role: 'WORKER',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates',
          desiredJob: 'cleaner',
          hourlyRate: 50
        })
      });
      assert.strictEqual(resWorker.status, 201);
      const dataWorker = await resWorker.json();
      assert.strictEqual(dataWorker.user.role, 'WORKER');

      // 2. EMPLOYER
      const resEmployer = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Employer User',
          email: 'employer.check@homelyserv.test',
          password: 'Password123!',
          role: 'EMPLOYER',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });
      assert.strictEqual(resEmployer.status, 201);
      const dataEmployer = await resEmployer.json();
      assert.strictEqual(dataEmployer.user.role, 'EMPLOYER');

      // 3. STUDENT
      const resStudent = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Student User',
          email: 'student.check@homelyserv.test',
          password: 'Password123!',
          role: 'STUDENT',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });
      assert.strictEqual(resStudent.status, 400);
      const dataStudent = await resStudent.json();
      assert.strictEqual(dataStudent.success, false);
      assert.match(dataStudent.message, /valid account role/i);

      // 4. DOCTOR
      const resDoctor = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Doctor User',
          email: 'doctor.check@homelyserv.test',
          password: 'Password123!',
          role: 'DOCTOR',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });
      assert.strictEqual(resDoctor.status, 400);
      const dataDoctor = await resDoctor.json();
      assert.strictEqual(dataDoctor.success, false);
      assert.match(dataDoctor.message, /valid account role/i);

      assert.deepEqual(savedRoles, ['WORKER', 'EMPLOYER']);
    });
  } finally {
    User.prototype.save = originalUserSave;
    User.findOne = originalUserFindOne;
  }
});

test('5. Unsupported registration role is rejected with 400', async () => {
  await withTeacherServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Invalid Role User',
        email: 'invalid@homelyserv.test',
        password: 'Password123!',
        role: 'ASTRONAUT',
        phone: '+971501234567',
        countryCode: 'AE',
        countryName: 'United Arab Emirates'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.message, /valid account role/i);
  });
});
