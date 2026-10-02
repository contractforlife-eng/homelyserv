// backend/src/routes/teacherFoundation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import teachersRouter from './teachers.js';
import {
  SUBSCRIPTION_PRICE_BOOKS,
  resolveSubscriptionPriceBook,
  SUBSCRIPTION_PRICE_BOOK_VERSION
} from '../config/subscriptionPriceBooks.js';

const secret = 'teacher-foundation-test-secret-2026';
process.env.JWT_SECRET = secret;

const TEACHER_ID = '507f1f77bcf86cd799439070';
const OTHER_TEACHER_ID = '507f1f77bcf86cd799439071';
const WORKER_ID = '507f1f77bcf86cd799439072';
const EMPLOYER_ID = '507f1f77bcf86cd799439073';
const DOCTOR_ID = '507f1f77bcf86cd799439074';

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

const createMockTeacherUser = (overrides = {}) => ({
  _id: TEACHER_ID,
  fullName: 'Prof. Al-Mansoor',
  email: 'teacher@homelyserv.test',
  role: 'TEACHER',
  tokenVersion: 0,
  isSuspended: false,
  city: 'Cairo',
  countryCode: 'EG',
  countryName: 'Egypt',
  profileImage: '',
  isVerified: true,
  ...overrides
});

const withTeacherServer = async ({ mockUser = createMockTeacherUser(), initialProfile = null } = {}, run) => {
  const originalFindById = User.findById;
  const originalProfileFindOne = TeacherProfile.findOne;
  let currentProfile = initialProfile ? { ...initialProfile } : null;

  User.findById = (id) => {
    if (String(id) === String(WORKER_ID)) {
      return wrapQuery({ ...mockUser, _id: WORKER_ID, role: 'WORKER' });
    }
    if (String(id) === String(DOCTOR_ID)) {
      return wrapQuery({ ...mockUser, _id: DOCTOR_ID, role: 'DOCTOR' });
    }
    if (String(id) === String(EMPLOYER_ID)) {
      return wrapQuery({ ...mockUser, _id: EMPLOYER_ID, role: 'EMPLOYER' });
    }
    if (String(id) === String(mockUser._id)) {
      return wrapQuery(mockUser);
    }
    return wrapQuery(null);
  };

  TeacherProfile.findOne = (filter) => {
    if (currentProfile && String(filter.userId) === String(currentProfile.userId)) {
      return Promise.resolve({
        ...currentProfile,
        toObject() { return { ...currentProfile }; },
        save() { return Promise.resolve(this); }
      });
    }
    return Promise.resolve(null);
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
      getProfile: () => currentProfile,
      setProfile: (p) => { currentProfile = p; }
    });
  } finally {
    User.findById = originalFindById;
    TeacherProfile.findOne = originalProfileFindOne;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('Teacher Foundation Tests', async (t) => {
  await t.test('1. Teacher Premium Pricing is exactly 75/250/1800 EGP', () => {
    const egypt = SUBSCRIPTION_PRICE_BOOKS.EGYPT;
    assert.equal(egypt.plans.weekly.prices.TEACHER, 75);
    assert.equal(egypt.plans.monthly.prices.TEACHER, 250);
    assert.equal(egypt.plans.annual.prices.TEACHER, 1800);

    const legacy = SUBSCRIPTION_PRICE_BOOKS.LEGACY_EGP;
    assert.equal(legacy.plans.weekly.prices.TEACHER, 75);
    assert.equal(legacy.plans.monthly.prices.TEACHER, 250);
    assert.equal(legacy.plans.annual.prices.TEACHER, 1800);
  });

  await t.test('2. resolveSubscriptionPriceBook resolves TEACHER role correctly', () => {
    const quote = resolveSubscriptionPriceBook({
      user: { role: 'TEACHER', countryCode: 'EG' },
      plan: 'monthly'
    });
    assert.equal(quote.role, 'TEACHER');
    assert.equal(quote.amount, 250);
    assert.equal(quote.currency, 'EGP');
    assert.equal(quote.priceBookVersion, SUBSCRIPTION_PRICE_BOOK_VERSION);
  });

  await t.test('3. GET /api/teachers/profile returns teacher profile and verification', async () => {
    await withTeacherServer({
      initialProfile: {
        userId: TEACHER_ID,
        title: 'Mathematics Tutor',
        mainSubject: 'mathematics',
        additionalSubjects: ['physics'],
        teachingLevels: ['secondary', 'high_school'],
        hourlyRate: 150
      }
    }, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/teachers/profile`, {
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.role, 'TEACHER');
      assert.equal(data.profile.mainSubject, 'mathematics');
      assert.equal(data.profile.hourlyRate, 150);
      assert.ok(data.verification, 'verification details must be present');
    });
  });

  await t.test('4. requireTeacher rejects non-TEACHER roles with 403', async () => {
    await withTeacherServer({}, async (baseUrl) => {
      const workerRes = await fetch(`${baseUrl}/api/teachers/profile`, {
        headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
      });
      assert.equal(workerRes.status, 403);

      const doctorRes = await fetch(`${baseUrl}/api/teachers/profile`, {
        headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR' })
      });
      assert.equal(doctorRes.status, 403);

      const employerRes = await fetch(`${baseUrl}/api/teachers/profile`, {
        headers: authHeader({ userId: EMPLOYER_ID, role: 'EMPLOYER' })
      });
      assert.equal(employerRes.status, 403);
    });
  });

  await t.test('5. Unauthenticated request to /api/teachers/profile returns 401', async () => {
    await withTeacherServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/teachers/profile`);
      assert.equal(res.status, 401);
    });
  });

  await t.test('6. PUT /api/teachers/profile rejects invalid main subject', async () => {
    await withTeacherServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/teachers/profile`, {
        method: 'PUT',
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER' }),
        body: JSON.stringify({
          mainSubject: 'astrology_wizardry'
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid teacher subject/i);
    });
  });

  await t.test('7. PUT /api/teachers/profile rejects negative hourly rate', async () => {
    await withTeacherServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/teachers/profile`, {
        method: 'PUT',
        headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER' }),
        body: JSON.stringify({
          hourlyRate: -50
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /non-negative/i);
    });
  });
});
