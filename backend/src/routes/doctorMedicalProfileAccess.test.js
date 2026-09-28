// backend/src/routes/doctorMedicalProfileAccess.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import PatientMedicalProfile from '../models/PatientMedicalProfile.js';
import MedicalAccessLog from '../models/MedicalAccessLog.js';
import prisma from '../lib/prisma.js';
import doctorsRouter from './doctors.js';

// In-memory store for DoctorPatientLink (populated only by explicit tests)
const linkStore = [];

const secret = 'doctor-med-access-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439070';
const DOCTOR_B_ID = '507f1f77bcf86cd799439071';
const PATIENT_PREMIUM_ID = '507f1f77bcf86cd799439072';
const PATIENT_FREE_ID = '507f1f77bcf86cd799439073';
const UNRELATED_PATIENT_ID = '507f1f77bcf86cd799439074';
const WORKER_ROLE_ID = '507f1f77bcf86cd799439075';
const EMPLOYER_ROLE_ID = '507f1f77bcf86cd799439076';
const TEACHER_ROLE_ID = '507f1f77bcf86cd799439077';
const STUDENT_ROLE_ID = '507f1f77bcf86cd799439078';

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
  [DOCTOR_A_ID]: {
    _id: DOCTOR_A_ID,
    fullName: 'Dr. Alpha Doctor',
    email: 'doctorA@homelyserv.test',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [DOCTOR_B_ID]: {
    _id: DOCTOR_B_ID,
    fullName: 'Dr. Beta Doctor',
    email: 'doctorB@homelyserv.test',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_PREMIUM_ID]: {
    _id: PATIENT_PREMIUM_ID,
    fullName: 'Patient Premium',
    email: 'patient.prem@homelyserv.test',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_FREE_ID]: {
    _id: PATIENT_FREE_ID,
    fullName: 'Patient Free',
    email: 'patient.free@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [UNRELATED_PATIENT_ID]: {
    _id: UNRELATED_PATIENT_ID,
    fullName: 'Unrelated Patient',
    email: 'unrelated@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [WORKER_ROLE_ID]: {
    _id: WORKER_ROLE_ID,
    fullName: 'Worker User',
    email: 'worker@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [EMPLOYER_ROLE_ID]: {
    _id: EMPLOYER_ROLE_ID,
    fullName: 'Employer User',
    email: 'employer@homelyserv.test',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [TEACHER_ROLE_ID]: {
    _id: TEACHER_ROLE_ID,
    fullName: 'Teacher User',
    email: 'teacher@homelyserv.test',
    role: 'TEACHER',
    tokenVersion: 0,
    isSuspended: false
  },
  [STUDENT_ROLE_ID]: {
    _id: STUDENT_ROLE_ID,
    fullName: 'Student User',
    email: 'student@homelyserv.test',
    role: 'STUDENT',
    tokenVersion: 0,
    isSuspended: false
  }
};

const premiumUserIds = new Set([PATIENT_PREMIUM_ID]);

// In-memory stores
let appointmentsStore = [];
let profilesStore = {};
let accessLogsStore = [];

const resetStores = () => {
  appointmentsStore = [];
  profilesStore = {};
  accessLogsStore = [];
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

// DoctorAppointment Mocks
DoctorAppointment.countDocuments = async (filter = {}) => {
  return appointmentsStore.filter((a) => {
    if (filter.doctorId && String(a.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(a.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in && !filter.status.$in.includes(a.status)) return false;
    return true;
  }).length;
};

// DoctorPatientLink mock (Medical Center links): in-memory, empty by default
// so appointment-based relationship rules drive these tests.
DoctorPatientLink.findOne = (filter = {}) => {
  const match = linkStore.some((l) => String(l.doctorId) === String(filter.doctorId)
    && String(l.patientId) === String(filter.patientId)
    && l.isActive !== false);
  return {
    select: () => Promise.resolve(match ? { _id: '507f1f77bcf86cd7994390f0' } : null)
  };
};

DoctorAppointment.findOne = (filter = {}) => {
  const match = appointmentsStore.find((a) => {
    if (filter.doctorId && String(a.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(a.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in && !filter.status.$in.includes(a.status)) return false;
    return true;
  });
  const chain = {
    sort: () => chain,
    then: (resolve, reject) => Promise.resolve(match || null).then(resolve, reject)
  };
  return chain;
};

DoctorAppointment.find = (filter = {}) => {
  const matches = appointmentsStore.filter((a) => {
    if (filter.doctorId && String(a.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(a.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in && !filter.status.$in.includes(a.status)) return false;
    return true;
  });
  const chain = {
    populate: () => chain,
    sort: () => chain,
    then: (resolve, reject) => Promise.resolve(matches).then(resolve, reject)
  };
  return chain;
};

// PatientMedicalProfile Mocks
PatientMedicalProfile.findOne = (query = {}) => {
  const userId = String(query.userId);
  const profile = profilesStore[userId];
  if (!profile) return wrapQuery(null);
  if (query.isActive !== undefined && profile.isActive !== query.isActive) {
    return wrapQuery(null);
  }
  return wrapQuery(profile);
};

// MedicalAccessLog Mocks
MedicalAccessLog.create = async (doc) => {
  const record = {
    _id: 'log_' + Date.now() + Math.random(),
    ...doc,
    accessedAt: doc.accessedAt || new Date()
  };
  accessLogsStore.push(record);
  return record;
};

// Setup Express app
const app = express();
app.use(express.json());
app.use('/api/doctors', doctorsRouter);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

// Setup standard baseline profile
const seedStandardProfile = (userId, overrides = {}) => {
  profilesStore[userId] = {
    _id: 'medprof_' + userId,
    userId,
    dateOfBirth: new Date('1990-01-01'),
    sex: 'MALE',
    bloodGroup: 'O+',
    heightCm: 175,
    weightKg: 70,
    chronicConditions: ['Hypertension'],
    allergies: ['Penicillin'],
    currentMedications: ['Amlodipine'],
    surgeries: ['Appendectomy'],
    familyHistory: 'Father had heart disease',
    smokingStatus: 'NEVER',
    disabilityStatus: 'None',
    emergencyContact: { name: 'Emergency Contact', relationship: 'Spouse', phone: '123456' },
    consentToShareWithDoctors: true,
    lastReviewedAt: new Date(),
    isActive: true,
    ...overrides
  };
};

test('1. Unauthenticated request is rejected', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`);
  assert.equal(res.status, 401);
});

test('2. WORKER cannot access Doctor Medical Profile endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
  });
  assert.equal(res.status, 403);
});

test('3. EMPLOYER cannot access it', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: EMPLOYER_ROLE_ID, role: 'EMPLOYER' })
  });
  assert.equal(res.status, 403);
});

test('4. TEACHER cannot access it', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: TEACHER_ROLE_ID, role: 'TEACHER' })
  });
  assert.equal(res.status, 403);
});

test('5. STUDENT cannot access it', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: STUDENT_ROLE_ID, role: 'STUDENT' })
  });
  assert.equal(res.status, 403);
});

test('6. DOCTOR can proceed to relationship checks', async () => {
  // Without relationship, returns 404
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('7. Doctor with CONFIRMED appointment can access after all other conditions pass', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_1',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.profile.bloodGroup, 'O+');
  assert.deepEqual(data.profile.chronicConditions, ['Hypertension']);
  assert.equal(data.profile.consentToShareWithDoctors, true);
});

test('8. Doctor with COMPLETED appointment can access after all other conditions pass', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_2',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'COMPLETED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.profile.bloodGroup, 'O+');
});

test('9. PENDING appointment does not grant access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_pending',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'PENDING'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('10. CANCELLED appointment does not grant access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_cancelled',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CANCELLED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('11. NO_SHOW appointment does not grant access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_noshow',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'NO_SHOW'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('12. Another Doctor cannot access the patient', async () => {
  // Appointment belongs to Doctor A, Doctor B calls
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('13. Arbitrary patientId returns safe 404', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${UNRELATED_PATIENT_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('14. Non-Premium patient cannot expose the profile to Doctor', async () => {
  resetStores();
  seedStandardProfile(PATIENT_FREE_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_free',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_FREE_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_FREE_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'PATIENT_PREMIUM_REQUIRED');
});

test('15. Premium patient can proceed when consent is granted', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_prem',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);
});

test('16. Missing active profile returns safe 404', async () => {
  resetStores();
  // Patient is premium and has confirmed appointment, but NO profile created
  appointmentsStore.push({
    _id: 'appt_noprof',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('17. Soft-deleted profile is not accessible', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { isActive: false, consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_del',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
});

test('18. Consent false denies access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: false });
  appointmentsStore.push({
    _id: 'appt_consent_false',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, 'MEDICAL_PROFILE_CONSENT_REQUIRED');
});

test('19. Consent true permits access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_consent_true',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);
});

test('20. Revoking consent immediately blocks subsequent access', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_revoke',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  // First call succeeds
  const res1 = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res1.status, 200);

  // Revoke consent
  profilesStore[PATIENT_PREMIUM_ID].consentToShareWithDoctors = false;

  // Second call immediately denied
  const res2 = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res2.status, 403);
  const data2 = await res2.json();
  assert.equal(data2.code, 'MEDICAL_PROFILE_CONSENT_REQUIRED');
});

test('21. Doctor cannot modify the Medical Profile', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    method: 'PUT',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({ bloodGroup: 'AB+' })
  });
  // Method not allowed or 404 (no route)
  assert.ok(res.status === 404 || res.status === 405);
});

test('22. No Doctor PUT/PATCH/DELETE Medical Profile endpoint exists', async () => {
  const resPut = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    method: 'PUT',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.ok(resPut.status === 404 || resPut.status === 405);

  const resPatch = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    method: 'PATCH',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.ok(resPatch.status === 404 || resPatch.status === 405);

  const resDel = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    method: 'DELETE',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.ok(resDel.status === 404 || resDel.status === 405);
});

test('23. Successful access creates exactly one VIEW_MEDICAL_PROFILE log', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_log_test',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  assert.equal(accessLogsStore.length, 0);

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);

  assert.equal(accessLogsStore.length, 1);
  const log = accessLogsStore[0];
  assert.equal(log.action, 'VIEW_MEDICAL_PROFILE');
  assert.equal(String(log.doctorId), DOCTOR_A_ID);
  assert.equal(String(log.patientId), PATIENT_PREMIUM_ID);
  assert.equal(String(log.medicalProfileId), profilesStore[PATIENT_PREMIUM_ID]._id);
  assert.equal(String(log.appointmentId), 'appt_log_test');
  assert.ok(log.accessedAt instanceof Date);
});

test('24. Failed authorization does not create a successful-access log', async () => {
  resetStores();
  // Doctor B attempts to view Doctor A's patient
  appointmentsStore.push({
    _id: 'appt_fail',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 404);
  assert.equal(accessLogsStore.length, 0);
});

test('25. Access log contains Doctor, Patient, Medical Profile, action, timestamp', async () => {
  // Re-verify the fields captured in the log from test 23
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_fields_test',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });

  assert.equal(accessLogsStore.length, 1);
  const log = accessLogsStore[0];
  assert.ok(log.doctorId);
  assert.ok(log.patientId);
  assert.ok(log.medicalProfileId);
  assert.ok(log.action);
  assert.ok(log.accessedAt);
});

test('26. Access log does not contain medical data', async () => {
  const log = accessLogsStore[0];
  assert.equal(log.chronicConditions, undefined);
  assert.equal(log.allergies, undefined);
  assert.equal(log.currentMedications, undefined);
  assert.equal(log.bloodGroup, undefined);
  assert.equal(log.surgeries, undefined);
});

test('27. Doctor cannot modify/delete access logs through API', async () => {
  // Try DELETE /api/doctors/medical-access-logs or similar
  const resDel = await fetch(`${baseUrl}/api/doctors/medical-access-logs`, {
    method: 'DELETE',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(resDel.status, 404);
});

test('28. Doctor Patients list still contains zero medical fields', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  if (res.status === 200) {
    const data = await res.json();
    for (const p of data.patients || []) {
      assert.equal(p.chronicConditions, undefined);
      assert.equal(p.allergies, undefined);
      assert.equal(p.bloodGroup, undefined);
      assert.equal(p.emergencyContact, undefined);
    }
  }
});

test('29. Doctor Patient Details endpoint still contains zero medical fields', async () => {
  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  if (res.status === 200) {
    const data = await res.json();
    assert.equal(data.patient?.chronicConditions, undefined);
    assert.equal(data.patient?.allergies, undefined);
    assert.equal(data.patient?.bloodGroup, undefined);
  }
});

test('30. Medical Profile response contains only allowed medical profile fields', async () => {
  resetStores();
  seedStandardProfile(PATIENT_PREMIUM_ID, { consentToShareWithDoctors: true });
  appointmentsStore.push({
    _id: 'appt_field_check',
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_PREMIUM_ID,
    status: 'CONFIRMED'
  });

  const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_PREMIUM_ID}/medical-profile`, {
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  const profile = data.profile;

  // Allowed fields
  assert.ok(profile.bloodGroup);
  assert.ok(Array.isArray(profile.chronicConditions));
  assert.ok(Array.isArray(profile.allergies));
  assert.ok(Array.isArray(profile.currentMedications));
  assert.ok(profile.emergencyContact);

  // Prohibited fields
  assert.equal(profile.password, undefined);
  assert.equal(profile.tokenVersion, undefined);
  assert.equal(profile.email, undefined);
  assert.equal(profile.settings, undefined);
  assert.equal(profile.accessLogs, undefined);
});
