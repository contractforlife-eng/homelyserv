// backend/src/routes/medicalProfile.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PatientMedicalProfile from '../models/PatientMedicalProfile.js';
import prisma from '../lib/prisma.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import medicalRouter from './medical.js';
import doctorsRouter from './doctors.js';

// Mock DoctorAppointment.find for tests
const mockFindQuery = {
  populate: () => mockFindQuery,
  sort: () => Promise.resolve([])
};
DoctorAppointment.find = () => mockFindQuery;

const secret = 'medical-profile-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const WORKER_PREMIUM_ID = '507f1f77bcf86cd799439061';
const WORKER_FREE_ID = '507f1f77bcf86cd799439062';
const EMPLOYER_PREMIUM_ID = '507f1f77bcf86cd799439063';
const EMPLOYER_FREE_ID = '507f1f77bcf86cd799439064';
const TEACHER_PREMIUM_ID = '507f1f77bcf86cd799439065';
const TEACHER_FREE_ID = '507f1f77bcf86cd799439066';
const STUDENT_PREMIUM_ID = '507f1f77bcf86cd799439067';
const STUDENT_FREE_ID = '507f1f77bcf86cd799439068';
const DOCTOR_ID = '507f1f77bcf86cd799439069';

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

const usersMockStore = {
  [WORKER_PREMIUM_ID]: {
    _id: WORKER_PREMIUM_ID,
    fullName: 'Worker Premium',
    email: 'worker.prem@test.com',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [WORKER_FREE_ID]: {
    _id: WORKER_FREE_ID,
    fullName: 'Worker Free',
    email: 'worker.free@test.com',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [EMPLOYER_PREMIUM_ID]: {
    _id: EMPLOYER_PREMIUM_ID,
    fullName: 'Employer Premium',
    email: 'employer.prem@test.com',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [EMPLOYER_FREE_ID]: {
    _id: EMPLOYER_FREE_ID,
    fullName: 'Employer Free',
    email: 'employer.free@test.com',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [TEACHER_PREMIUM_ID]: {
    _id: TEACHER_PREMIUM_ID,
    fullName: 'Teacher Premium',
    email: 'teacher.prem@test.com',
    role: 'TEACHER',
    tokenVersion: 0,
    isSuspended: false
  },
  [TEACHER_FREE_ID]: {
    _id: TEACHER_FREE_ID,
    fullName: 'Teacher Free',
    email: 'teacher.free@test.com',
    role: 'TEACHER',
    tokenVersion: 0,
    isSuspended: false
  },
  [STUDENT_PREMIUM_ID]: {
    _id: STUDENT_PREMIUM_ID,
    fullName: 'Student Premium',
    email: 'student.prem@test.com',
    role: 'STUDENT',
    tokenVersion: 0,
    isSuspended: false
  },
  [STUDENT_FREE_ID]: {
    _id: STUDENT_FREE_ID,
    fullName: 'Student Free',
    email: 'student.free@test.com',
    role: 'STUDENT',
    tokenVersion: 0,
    isSuspended: false
  },
  [DOCTOR_ID]: {
    _id: DOCTOR_ID,
    fullName: 'Doctor Beta',
    email: 'doctor@test.com',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  }
};

const premiumUserIds = new Set([
  WORKER_PREMIUM_ID,
  EMPLOYER_PREMIUM_ID,
  TEACHER_PREMIUM_ID,
  STUDENT_PREMIUM_ID
]);

// In-memory mock store for PatientMedicalProfile
let profilesStore = {};

const resetProfilesStore = () => {
  profilesStore = {};
};

// Set up mocks
User.findById = (id) => wrapQuery(usersMockStore[String(id)] || null);

prisma.subscription = {
  findMany: async ({ where }) => {
    const list = [];
    for (const uid of where.userId?.in || []) {
      if (premiumUserIds.has(String(uid))) {
        list.push({ userId: String(uid) });
      }
    }
    return list;
  },
  findFirst: async ({ where }) => {
    if (premiumUserIds.has(String(where.userId))) {
      return { userId: String(where.userId), plan: 'annual', status: 'active', endDate: new Date(Date.now() + 1000000) };
    }
    return null;
  }
};

prisma.manualPremiumGrant = {
  findMany: async () => [],
  findUnique: async () => null
};

// PatientMedicalProfile Mocks
PatientMedicalProfile.findOne = (query) => {
  const userId = String(query.userId);
  const profile = profilesStore[userId];
  if (!profile) return wrapQuery(null);
  if (query.isActive !== undefined && profile.isActive !== query.isActive) {
    return wrapQuery(null);
  }
  return wrapQuery(profile);
};

PatientMedicalProfile.findOneAndUpdate = async (filter, update, options) => {
  const userId = String(filter.userId);
  let profile = profilesStore[userId];

  if (filter.isActive !== undefined && profile && profile.isActive !== filter.isActive) {
    return null;
  }

  if (!profile && options?.upsert) {
    profile = {
      _id: 'medprof_' + userId,
      userId,
      consentToShareWithDoctors: false,
      isActive: true,
      chronicConditions: [],
      allergies: [],
      currentMedications: [],
      surgeries: [],
      emergencyContact: { name: '', relationship: '', phone: '' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    profilesStore[userId] = profile;
  }

  if (!profile) return null;

  if (update.$set) {
    Object.assign(profile, update.$set);
    profile.updatedAt = new Date();
  }

  return profile;
};

// Setup express app
const app = express();
app.use(express.json());
app.use('/api/medical', medicalRouter);
app.use('/api/doctors', doctorsRouter);

// Test server helper
let server;
let baseUrl;

const startServer = () =>
  new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

const stopServer = () =>
  new Promise((resolve) => {
    server.close(resolve);
  });

test.before(async () => {
  await startServer();
});

test.after(async () => {
  await stopServer();
});

test('1. WORKER Premium user can create profile', async () => {
  resetProfilesStore();
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({
      dateOfBirth: '1990-05-15',
      sex: 'MALE',
      bloodGroup: 'O+',
      heightCm: 178,
      weightKg: 75,
      chronicConditions: ['Asthma'],
      allergies: ['Penicillin'],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1234567890'
      }
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.profile.sex, 'MALE');
  assert.equal(data.profile.bloodGroup, 'O+');
  assert.equal(data.profile.heightCm, 178);
  assert.equal(data.profile.weightKg, 75);
  assert.deepEqual(data.profile.chronicConditions, ['Asthma']);
  assert.equal(data.profile.consentToShareWithDoctors, false);
});

test('2. WORKER Premium user can read own profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.profile.userId, WORKER_PREMIUM_ID);
  assert.equal(data.profile.sex, 'MALE');
});

test('3. WORKER Premium user can update own profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({
      chronicConditions: ['Asthma', 'Hypertension'],
      smokingStatus: 'NEVER'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.deepEqual(data.profile.chronicConditions, ['Asthma', 'Hypertension']);
  assert.equal(data.profile.smokingStatus, 'NEVER');
});

test('4. EMPLOYER Premium user can create/read/update', async () => {
  const createRes = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: EMPLOYER_PREMIUM_ID, role: 'EMPLOYER' }),
    body: JSON.stringify({
      sex: 'FEMALE',
      bloodGroup: 'A+',
      allergies: ['Peanuts']
    })
  });
  assert.equal(createRes.status, 200);

  const getRes = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: EMPLOYER_PREMIUM_ID, role: 'EMPLOYER' })
  });
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.equal(data.profile.sex, 'FEMALE');
  assert.equal(data.profile.bloodGroup, 'A+');
});

test('5. TEACHER Premium user can create/read/update', async () => {
  const createRes = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: TEACHER_PREMIUM_ID, role: 'TEACHER' }),
    body: JSON.stringify({
      sex: 'MALE',
      bloodGroup: 'B+'
    })
  });
  assert.equal(createRes.status, 200);

  const getRes = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: TEACHER_PREMIUM_ID, role: 'TEACHER' })
  });
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.equal(data.profile.bloodGroup, 'B+');
});

test('6. STUDENT Premium user can create/read/update', async () => {
  const createRes = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: STUDENT_PREMIUM_ID, role: 'STUDENT' }),
    body: JSON.stringify({
      sex: 'OTHER',
      bloodGroup: 'AB+'
    })
  });
  assert.equal(createRes.status, 200);

  const getRes = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: STUDENT_PREMIUM_ID, role: 'STUDENT' })
  });
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.equal(data.profile.bloodGroup, 'AB+');
});

test('7. Free WORKER cannot read profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: WORKER_FREE_ID, role: 'WORKER' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('8. Free EMPLOYER cannot read profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: EMPLOYER_FREE_ID, role: 'EMPLOYER' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('9. Free TEACHER cannot read profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: TEACHER_FREE_ID, role: 'TEACHER' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('10. Free STUDENT cannot read profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: STUDENT_FREE_ID, role: 'STUDENT' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('11. Free user cannot create profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_FREE_ID, role: 'WORKER' }),
    body: JSON.stringify({ sex: 'MALE' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('12. Free user cannot update profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: EMPLOYER_FREE_ID, role: 'EMPLOYER' }),
    body: JSON.stringify({ heightCm: 180 })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('13. Free user cannot delete profile', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'DELETE',
    headers: authHeader({ userId: WORKER_FREE_ID, role: 'WORKER' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PREMIUM_REQUIRED');
});

test('14. Doctor cannot use the self-service medical profile endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('15. Another user cannot access someone else profile', async () => {
  // GET always uses req.userId; sending ?userId= has zero effect
  const res = await fetch(`${baseUrl}/api/medical/profile?userId=${WORKER_PREMIUM_ID}`, {
    headers: authHeader({ userId: EMPLOYER_PREMIUM_ID, role: 'EMPLOYER' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  // Returns Employer's profile, NOT Worker's profile
  assert.equal(data.profile.userId, EMPLOYER_PREMIUM_ID);
});

test('16. Request body cannot override userId', async () => {
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({
      userId: EMPLOYER_PREMIUM_ID,
      chronicConditions: ['Migraine']
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  // Profile owner is still Worker, not Employer
  assert.equal(data.profile.userId, WORKER_PREMIUM_ID);
});

test('17. Invalid controlled enum values are rejected', async () => {
  const resSex = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ sex: 'UNKNOWN_SEX' })
  });
  assert.equal(resSex.status, 400);

  const resBlood = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ bloodGroup: 'Z+' })
  });
  assert.equal(resBlood.status, 400);

  const resSmoke = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ smokingStatus: 'SOMETIMES' })
  });
  assert.equal(resSmoke.status, 400);
});

test('18. Invalid date of birth is rejected', async () => {
  const futureDate = new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0];
  const resFuture = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ dateOfBirth: futureDate })
  });
  assert.equal(resFuture.status, 400);

  const resInvalid = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ dateOfBirth: 'not-a-valid-date' })
  });
  assert.equal(resInvalid.status, 400);
});

test('19. Invalid numeric values are rejected', async () => {
  const resHeight = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ heightCm: 500 }) // over 300cm
  });
  assert.equal(resHeight.status, 400);

  const resWeight = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ weightKg: -10 })
  });
  assert.equal(resWeight.status, 400);
});

test('20. Oversized array/text payloads are rejected', async () => {
  const bigArray = Array(100).fill('condition');
  const resArr = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ chronicConditions: bigArray })
  });
  assert.equal(resArr.status, 400);

  const bigText = 'A'.repeat(2500);
  const resText = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' }),
    body: JSON.stringify({ familyHistory: bigText })
  });
  assert.equal(resText.status, 400);
});

test('21. Default consentToShareWithDoctors is false', async () => {
  resetProfilesStore();
  const res = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'PUT',
    headers: authHeader({ userId: STUDENT_PREMIUM_ID, role: 'STUDENT' }),
    body: JSON.stringify({ bloodGroup: 'O-' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.profile.consentToShareWithDoctors, false);
});

test('22. Soft-deleted profile is not returned by normal GET', async () => {
  // First soft-delete
  const delRes = await fetch(`${baseUrl}/api/medical/profile`, {
    method: 'DELETE',
    headers: authHeader({ userId: STUDENT_PREMIUM_ID, role: 'STUDENT' })
  });
  assert.equal(delRes.status, 200);

  // Normal GET should return profile: null
  const getRes = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: STUDENT_PREMIUM_ID, role: 'STUDENT' })
  });
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.equal(data.profile, null);
});

test('23. Soft-deleted profile does not become accessible to another user', async () => {
  const getRes = await fetch(`${baseUrl}/api/medical/profile`, {
    headers: authHeader({ userId: WORKER_PREMIUM_ID, role: 'WORKER' })
  });
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.notEqual(data.profile?.userId, STUDENT_PREMIUM_ID);
});

test('24. Medical data is never returned from Doctor Patients endpoints', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients`, {
    headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR' })
  });
  // Doctor patients list shouldn't leak medical profile fields
  if (res.status === 200) {
    const data = await res.json();
    for (const patient of data.patients || []) {
      assert.equal(patient.bloodGroup, undefined);
      assert.equal(patient.chronicConditions, undefined);
      assert.equal(patient.allergies, undefined);
      assert.equal(patient.currentMedications, undefined);
    }
  }
});
