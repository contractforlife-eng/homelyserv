import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import {
  isValidIanaTimeZone,
  isValidCalendarDate,
  isAppointmentInPast,
  _resetPublicRegisterRateLimit,
} from '../controllers/applicationController.js';

process.env.JWT_SECRET = 'job-sharing-test-jwt-secret-2026';

const { default: jobsRouter } = await import('./jobs.js');
const { default: applicationsRouter } = await import('./applications.js');

const withServer = async (run) => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ tokenVersion: 0, isSuspended: false })
  });

  const app = express();
  app.use(express.json());
  app.use('/api/jobs', jobsRouter);
  app.use('/api/jobs', applicationsRouter);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await run(base);
  } finally {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }
};

// ============================================================
// Unit Tests: Time Zone, Calendar Date & Appointment Validation
// ============================================================
test('isValidIanaTimeZone validates standard IANA zones and rejects invalid ones', () => {
  assert.equal(isValidIanaTimeZone('Africa/Cairo'), true);
  assert.equal(isValidIanaTimeZone('UTC'), true);
  assert.equal(isValidIanaTimeZone('Europe/London'), true);
  assert.equal(isValidIanaTimeZone('America/New_York'), true);
  assert.equal(isValidIanaTimeZone('Asia/Dubai'), true);

  assert.equal(isValidIanaTimeZone(''), false);
  assert.equal(isValidIanaTimeZone(null), false);
  assert.equal(isValidIanaTimeZone(undefined), false);
  assert.equal(isValidIanaTimeZone('Mars/Phobos'), false);
  assert.equal(isValidIanaTimeZone('Invalid/TZ_Name'), false);
  assert.equal(isValidIanaTimeZone(123), false);
});

test('isValidCalendarDate validates Gregorian calendar dates and rejects invalid ones', () => {
  assert.equal(isValidCalendarDate('2026-05-15'), true);
  assert.equal(isValidCalendarDate('2024-02-29'), true); // Leap year 2024
  assert.equal(isValidCalendarDate('2025-02-29'), false); // Non-leap year 2025
  assert.equal(isValidCalendarDate('2026-04-31'), false); // April has 30 days
  assert.equal(isValidCalendarDate('2026-13-01'), false); // Month 13 invalid
  assert.equal(isValidCalendarDate('not-a-date'), false);
  assert.equal(isValidCalendarDate(''), false);
  assert.equal(isValidCalendarDate(null), false);
});

test('isAppointmentInPast identifies past vs future appointments accurately across time zones', () => {
  // Clear past date: 2020-01-01
  assert.equal(isAppointmentInPast('2020-01-01', '10:00', 'UTC'), true);
  assert.equal(isAppointmentInPast('2020-01-01', '10:00', 'Africa/Cairo'), true);

  // Clear future date: 2035-12-31
  assert.equal(isAppointmentInPast('2035-12-31', '10:00', 'UTC'), false);
  assert.equal(isAppointmentInPast('2035-12-31', '10:00', 'America/New_York'), false);
  assert.equal(isAppointmentInPast('2035-12-31', '10:00', 'Africa/Cairo'), false);
});

// ============================================================
// Integration / API Route Tests
// ============================================================
test('GET /api/jobs/public/:id returns 404 for invalid ObjectId', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/jobs/public/invalid-id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'Job not found');
  });
});

test('POST /api/jobs/:id/apply-public rejects missing fields for unauthenticated visitor', async () => {
  const originalFindUnique = prisma.jobPost.findUnique;
  prisma.jobPost.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013',
    status: 'open',
    expiresAt: new Date(Date.now() + 86400000)
  });

  try {
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'John Doe' })
      });
      assert.equal(res.status, 400);
    });
  } finally {
    prisma.jobPost.findUnique = originalFindUnique;
  }
});

test('POST /api/jobs/:id/apply-public rejects short phone number (< 7 chars)', async () => {
  const originalFindUnique = prisma.jobPost.findUnique;
  prisma.jobPost.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013',
    status: 'open',
    expiresAt: new Date(Date.now() + 86400000)
  });

  try {
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '123',
          password: 'Password123!',
          countryCode: 'EG'
        })
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /must be 7-20 characters/i);
    });
  } finally {
    prisma.jobPost.findUnique = originalFindUnique;
  }
});

test('PATCH /api/jobs/applications/:id/status requires authentication', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' })
    });
    assert.equal(res.status, 401);
  });
});

test('PATCH /api/jobs/applications/:id/status rejects non-employer roles', async () => {
  await withServer(async (base) => {
    const workerToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439012', role: 'WORKER', tokenVersion: 0 },
      process.env.JWT_SECRET
    );
    const res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`
      },
      body: JSON.stringify({ status: 'accepted' })
    });
    assert.equal(res.status, 403);
  });
});

test('PATCH /api/jobs/applications/:id/status validates interview details for accepted status', async () => {
  const originalFindUnique = prisma.jobApplication.findUnique;
  prisma.jobApplication.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013',
    workerId: '507f1f77bcf86cd799439012',
    status: 'applied'
  });

  try {
    await withServer(async (base) => {
      const employerToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439013', role: 'EMPLOYER', tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      // Missing interview date
      let res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employerToken}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });
      assert.equal(res.status, 400);
      let body = await res.json();
      assert.match(body.message, /Interview date is required/i);

      // Invalid calendar date
      res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employerToken}`
        },
        body: JSON.stringify({
          status: 'accepted',
          interviewDate: '2026-02-31',
          interviewTime: '10:00',
          interviewTimeZone: 'Africa/Cairo',
          interviewAddress: '123 Main St'
        })
      });
      assert.equal(res.status, 400);
      body = await res.json();
      assert.match(body.message, /valid calendar date/i);

      // Invalid time zone
      res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employerToken}`
        },
        body: JSON.stringify({
          status: 'accepted',
          interviewDate: '2026-05-20',
          interviewTime: '10:00',
          interviewTimeZone: 'Invalid/NonExistent_Zone',
          interviewAddress: '123 Main St'
        })
      });
      assert.equal(res.status, 400);
      body = await res.json();
      assert.match(body.message, /valid IANA time zone/i);

      // Past appointment
      res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employerToken}`
        },
        body: JSON.stringify({
          status: 'accepted',
          interviewDate: '2020-01-01',
          interviewTime: '10:00',
          interviewTimeZone: 'Africa/Cairo',
          interviewAddress: '123 Main St'
        })
      });
      assert.equal(res.status, 400);
      body = await res.json();
      assert.match(body.message, /cannot be scheduled in the past/i);
    });
  } finally {
    prisma.jobApplication.findUnique = originalFindUnique;
  }
});

test('PATCH /api/jobs/applications/:id/status rejects unauthorized employer', async () => {
  const originalFindUnique = prisma.jobApplication.findUnique;
  prisma.jobApplication.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013', // Owned by 9013
    workerId: '507f1f77bcf86cd799439012',
    status: 'applied'
  });

  try {
    await withServer(async (base) => {
      // Different employer 9099
      const unauthorizedEmployerToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439099', role: 'EMPLOYER', tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      const res = await fetch(`${base}/api/jobs/applications/507f1f77bcf86cd799439011/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unauthorizedEmployerToken}`
        },
        body: JSON.stringify({
          status: 'accepted',
          interviewDate: '2026-06-01',
          interviewTime: '11:00',
          interviewTimeZone: 'Africa/Cairo',
          interviewAddress: '123 Main St'
        })
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.match(body.message, /Access denied/i);
    });
  } finally {
    prisma.jobApplication.findUnique = originalFindUnique;
  }
});

test('POST /api/jobs/:id/apply-public handles existing accounts by returning 409 ACCOUNT_EXISTS', async () => {
  const originalJobFindUnique = prisma.jobPost.findUnique;
  const originalUserFindOne = User.findOne;

  prisma.jobPost.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013',
    status: 'open',
    expiresAt: new Date(Date.now() + 86400000)
  });

  User.findOne = (query) => {
    if (query?.email === 'existing@example.com') {
      return Promise.resolve({ _id: '507f1f77bcf86cd799439099', email: 'existing@example.com' });
    }
    return Promise.resolve(null);
  };

  try {
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Existing User',
          email: 'existing@example.com',
          phone: '+201012345678',
          password: 'Password123!',
          countryCode: 'EG'
        })
      });
      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.error, 'ACCOUNT_EXISTS');
      assert.match(body.message, /already exists/i);
    });
  } finally {
    prisma.jobPost.findUnique = originalJobFindUnique;
    User.findOne = originalUserFindOne;
  }
});

test('POST /api/jobs/:id/apply rejects duplicate applications gracefully (P2002 conflict handling)', async () => {
  const originalFindUniqueJob = prisma.jobPost.findUnique;
  const originalFindUniqueWorker = prisma.workerProfile.findUnique;
  const originalAppCreate = prisma.jobApplication.create;

  prisma.jobPost.findUnique = async () => ({
    id: '507f1f77bcf86cd799439011',
    employerId: '507f1f77bcf86cd799439013',
    status: 'open',
    expiresAt: new Date(Date.now() + 86400000)
  });

  prisma.workerProfile.findUnique = async () => ({
    id: '507f1f77bcf86cd799439077',
    userId: '507f1f77bcf86cd799439012'
  });

  // Mock Prisma unique constraint violation error P2002
  const p2002Error = new Error('Unique constraint failed on the fields: (`jobPostId`,`workerId`)');
  p2002Error.code = 'P2002';
  prisma.jobApplication.create = async () => {
    throw p2002Error;
  };

  try {
    await withServer(async (base) => {
      const workerToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439012', role: 'WORKER', tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      const res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`
        },
        body: JSON.stringify({ coverMessage: 'Hello, I want to apply.' })
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /already applied/i);
    });
  } finally {
    prisma.jobPost.findUnique = originalFindUniqueJob;
    prisma.workerProfile.findUnique = originalFindUniqueWorker;
    prisma.jobApplication.create = originalAppCreate;
  }
});

test('GET /api/jobs/applications/mine enforces worker role and returns worker applications', async () => {
  const originalFindMany = prisma.jobApplication.findMany;
  const originalFindManyJobs = prisma.jobPost.findMany;
  const originalFindManyUsers = prisma.user.findMany;
  const originalFindManyEmployers = prisma.employerProfile.findMany;
  const originalRunCommandRaw = prisma.$runCommandRaw;

  prisma.jobApplication.findMany = async () => [
    {
      id: '507f1f77bcf86cd799439088',
      jobPostId: '507f1f77bcf86cd799439011',
      employerId: '507f1f77bcf86cd799439013',
      workerId: '507f1f77bcf86cd799439012',
      status: 'shortlisted',
      coverMessage: 'I am experienced',
      cvUrl: 'https://example.com/cv.pdf',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  prisma.jobPost.findMany = async () => [
    { id: '507f1f77bcf86cd799439011', jobTitle: 'Senior Housekeeper', status: 'open' }
  ];
  prisma.user.findMany = async () => [
    { id: '507f1f77bcf86cd799439013', fullName: 'Alice Employer', city: 'Cairo' }
  ];
  prisma.employerProfile.findMany = async () => [
    { userId: '507f1f77bcf86cd799439013', ratingAvg: 4.8, ratingCount: 12 }
  ];
  prisma.$runCommandRaw = async () => ({
    cursor: { firstBatch: [] }
  });

  try {
    await withServer(async (base) => {
      const workerToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439012', role: 'WORKER', tokenVersion: 0 },
        process.env.JWT_SECRET
      );

      const res = await fetch(`${base}/api/jobs/applications/mine`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.applications.length, 1);
      assert.equal(body.applications[0].jobPost.jobTitle, 'Senior Housekeeper');
      assert.equal(body.applications[0].employer.fullName, 'Alice Employer');
      assert.equal(body.applications[0].status, 'shortlisted');
    });
  } finally {
    prisma.jobApplication.findMany = originalFindMany;
    prisma.jobPost.findMany = originalFindManyJobs;
    prisma.user.findMany = originalFindManyUsers;
    prisma.employerProfile.findMany = originalFindManyEmployers;
    prisma.$runCommandRaw = originalRunCommandRaw;
  }
});

test('POST /api/jobs/:id/apply-public inherits job profession for newly registered worker', async () => {
  _resetPublicRegisterRateLimit?.();
  const originalJobFindUnique = prisma.jobPost.findUnique;
  const originalUserFindOne = User.findOne;
  const originalUserSave = User.prototype.save;
  const originalWorkerProfileFindUnique = prisma.workerProfile.findUnique;
  const originalWorkerProfileCreate = prisma.workerProfile.create;
  const originalJobAppCreate = prisma.jobApplication.create;

  let savedUserData = null;
  let createdWorkerProfileData = null;

  User.findOne = async () => null; // visitor is new
  User.prototype.save = async function () {
    savedUserData = this.toObject();
    return this;
  };

  prisma.workerProfile.findUnique = async () => null;
  prisma.workerProfile.create = async ({ data }) => {
    createdWorkerProfileData = data;
    return { id: '507f1f77bcf86cd799439077', ...data };
  };

  prisma.jobApplication.create = async ({ data }) => ({
    id: '507f1f77bcf86cd799439088',
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  try {
    await withServer(async (base) => {
      // 1. Canonical predefined title: "Nanny" -> maps to canonical "nanny"
      prisma.jobPost.findUnique = async () => ({
        id: '507f1f77bcf86cd799439011',
        employerId: '507f1f77bcf86cd799439013',
        status: 'open',
        jobTitle: 'Nanny',
        expiresAt: new Date(Date.now() + 86400000)
      });

      let res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'New Nanny Applicant',
          email: 'newnanny@example.com',
          phone: '+201012345678',
          password: 'Password123!',
          countryCode: 'EG'
        })
      });
      assert.equal(res.status, 201);
      assert.equal(savedUserData.desiredJob, 'nanny');
      assert.equal(createdWorkerProfileData.category, 'nanny');

      // 2. Custom job title: "Senior Pool Cleaner & Technician" -> preserves custom string
      savedUserData = null;
      createdWorkerProfileData = null;
      prisma.jobPost.findUnique = async () => ({
        id: '507f1f77bcf86cd799439011',
        employerId: '507f1f77bcf86cd799439013',
        status: 'open',
        jobTitle: 'Senior Pool Cleaner & Technician',
        expiresAt: new Date(Date.now() + 86400000)
      });

      res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'New Custom Specialist',
          email: 'custom@example.com',
          phone: '+201012345679',
          password: 'Password123!',
          countryCode: 'EG'
        })
      });
      assert.equal(res.status, 201);
      assert.equal(savedUserData.desiredJob, 'Senior Pool Cleaner & Technician');
      assert.equal(createdWorkerProfileData.category, 'Senior Pool Cleaner & Technician');

      // 3. Legacy / empty jobTitle -> safe fallback to 'other'
      savedUserData = null;
      createdWorkerProfileData = null;
      prisma.jobPost.findUnique = async () => ({
        id: '507f1f77bcf86cd799439011',
        employerId: '507f1f77bcf86cd799439013',
        status: 'open',
        jobTitle: '',
        expiresAt: new Date(Date.now() + 86400000)
      });

      res = await fetch(`${base}/api/jobs/507f1f77bcf86cd799439011/apply-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Fallback Applicant',
          email: 'fallback@example.com',
          phone: '+201012345680',
          password: 'Password123!',
          countryCode: 'EG'
        })
      });
      assert.equal(res.status, 201);
      assert.equal(savedUserData.desiredJob, 'other');
      assert.equal(createdWorkerProfileData.category, 'other');
    });
  } finally {
    prisma.jobPost.findUnique = originalJobFindUnique;
    User.findOne = originalUserFindOne;
    User.prototype.save = originalUserSave;
    prisma.workerProfile.findUnique = originalWorkerProfileFindUnique;
    prisma.workerProfile.create = originalWorkerProfileCreate;
    prisma.jobApplication.create = originalJobAppCreate;
  }
});
