// backend/src/routes/doctorPatientProfile.test.js
// ============================================================
// GET /api/doctors/patients/:patientId
//
// Focused coverage for the HomelyServ patient PROFILE payload on the
// Doctor Patient Details page:
//   - authorised profile fields are returned
//   - private / security fields are NEVER returned
//   - a patient missing optional profile fields still returns cleanly
//   - unauthorised doctors get 404 (unchanged relationship gate)
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-patient-profile-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439a00';
const DOCTOR_B_ID = '507f1f77bcf86cd799439a01';
const PATIENT_ID = '507f1f77bcf86cd799439a02';
const PATIENT_SPARSE_ID = '507f1f77bcf86cd799439a03';

const createToken = (p) => jwt.sign(p, secret, { expiresIn: '1h' });
const authHeader = (p) => ({
  authorization: `Bearer ${createToken(p)}`,
  'content-type': 'application/json'
});

/** Users store: includes private fields that must never leak. */
const usersStore = {
  // The authenticated doctor must exist for the auth middleware.
  [DOCTOR_A_ID]: {
    _id: DOCTOR_A_ID, fullName: 'Dr Alpha', email: 'a@doc.test', password: 'x',
    role: 'DOCTOR', tokenVersion: 0, isSuspended: false, isVerified: true
  },
  [DOCTOR_B_ID]: {
    _id: DOCTOR_B_ID, fullName: 'Dr Beta', email: 'b@doc.test', password: 'x',
    role: 'DOCTOR', tokenVersion: 0, isSuspended: false, isVerified: true
  },
  [PATIENT_ID]: {
    _id: PATIENT_ID,
    fullName: 'Noha Elmlege',
    email: 'noha.private@example.com',
    password: 'hashed-secret-value',
    phone: '+20 100 000 0000',
    countryCode: '+20',
    countryName: 'Egypt',
    location: 'Cairo, Nasr City',
    profileImage: 'https://cdn.example.com/noha.jpg',
    language: 'en',
    role: 'WORKER',
    status: 'ACTIVE',
    tokenVersion: 3,
    isSuspended: false,
    suspensionReason: null,
    registrationIp: '10.0.0.1',
    skills: ['a'],
    bio: 'private bio'
  },
  [PATIENT_SPARSE_ID]: {
    _id: PATIENT_SPARSE_ID,
    fullName: 'Sparse Patient',
    email: 'sparse@example.com',
    phone: '',
    countryName: '',
    location: '',
    profileImage: null,
    language: 'en'
  }
};

const withServer = async ({ hasRelationship = true } = {}, run) => {
  const origUserFindById = User.findById;
  const origApptFind = DoctorAppointment.find;
  const origApptCount = DoctorAppointment.countDocuments;
  const origLinkFindOne = DoctorPatientLink.findOne;

  // The relationship gate: doctor A has a relationship with both patients.
  const relatedPatient = (id) => String(id) === PATIENT_ID || String(id) === PATIENT_SPARSE_ID;
  const isRelated = (f) => hasRelationship && relatedPatient(f.patientId) && String(f.doctorId) === DOCTOR_A_ID;

  DoctorPatientLink.findOne = (filter = {}) => {
    const active = isRelated(filter);
    const chain = {
      select: () => chain,
      then: (r, j) => Promise.resolve(active ? { _id: 'link1' } : null).then(r, j)
    };
    return chain;
  };

  // The relationship gate (hasValidDoctorPatientRelationship) counts
  // appointments for THIS doctor + patient.
  DoctorAppointment.countDocuments = async (filter = {}) => (isRelated(filter) ? 1 : 0);

  User.findById = (id) => {
    const doc = usersStore[String(id)];
    if (!doc) {
      return { select: () => Promise.resolve(null), then: (r, j) => Promise.resolve(null).then(r, j) };
    }
    // Honour .select() the way Mongoose does for `select: false` fields.
    // `_id` is always included by Mongoose, so keep it here too.
    const q = (fields) => {
      if (fields) {
        const picked = { _id: doc._id };
        for (const k of fields.split(/\s+/).filter(Boolean)) {
          if (doc[k] !== undefined) picked[k] = doc[k];
        }
        return { then: (r, j) => Promise.resolve(picked).then(r, j) };
      }
      return { then: (r, j) => Promise.resolve(doc).then(r, j) };
    };
    return { select: q, then: (r, j) => Promise.resolve(doc).then(r, j) };
  };

  // Relationship gate: an established appointment for doctor A only.
  DoctorAppointment.find = (filter = {}) => {
    const rows = hasRelationship && String(filter.patientId) === PATIENT_ID
      ? [{
          _id: '507f1f77bcf86cd799439a10',
          doctorId: DOCTOR_A_ID,
          patientId: PATIENT_ID,
          startsAt: new Date(Date.now() + 86400000),
          status: 'CONFIRMED'
        }]
      : [];
    const chain = { populate: () => chain, sort: () => chain, then: (r, j) => Promise.resolve(rows).then(r, j) };
    return chain;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run({ baseUrl });
  } finally {
    server.close();
    User.findById = origUserFindById;
    DoctorAppointment.find = origApptFind;
    DoctorAppointment.countDocuments = origApptCount;
    DoctorPatientLink.findOne = origLinkFindOne;
  }
};

const getDetail = (baseUrl, id, doctorId) =>
  fetch(`${baseUrl}/api/doctors/patients/${id}`, {
    headers: authHeader({ userId: doctorId, role: 'DOCTOR' })
  });

// ============================================
// Profile payload
// ============================================

test('1. Authorised basic profile fields are returned for an established patient', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, PATIENT_ID, DOCTOR_A_ID);
    assert.equal(res.status, 200);
    const { patient } = await res.json();

    assert.equal(patient.patientName, 'Noha Elmlege');
    assert.equal(patient.profileImage, 'https://cdn.example.com/noha.jpg');
    assert.equal(patient.phone, '+20 100 000 0000', 'phone is returned (was selected but dropped)');
    assert.equal(patient.countryName, 'Egypt');
    assert.equal(patient.location, 'Cairo, Nasr City', 'location is returned');
    assert.equal(patient.patientId, PATIENT_ID);
    assert.equal(patient.language, 'en');
  });
});

test('2. Private / security fields are NEVER exposed', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, PATIENT_ID, DOCTOR_A_ID);
    const raw = JSON.stringify(await res.json());
    for (const secret of [
      'hashed-secret-value', 'noha.private@example.com', '10.0.0.1',
      'private bio', 'tokenVersion', 'suspensionReason', 'password', 'skills'
    ]) {
      assert.ok(!raw.includes(secret), `must not expose: ${secret}`);
    }
    assert.ok(!raw.includes('"role"'), 'role not exposed on the detail payload');
  });
});

test('3. A patient with no optional profile fields returns cleanly (no crash)', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, PATIENT_SPARSE_ID, DOCTOR_A_ID);
    assert.equal(res.status, 200);
    const { patient } = await res.json();
    // Missing values must be present as empty strings, never undefined.
    assert.equal(patient.phone, '');
    assert.equal(patient.location, '');
    assert.equal(patient.countryName, '');
    assert.equal(patient.profileImage, null);
    assert.equal(patient.patientName, 'Sparse Patient');
  });
});

test('4. Unrelated doctor still receives 404 (relationship gate unchanged)', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, PATIENT_ID, DOCTOR_B_ID);
    assert.equal(res.status, 404);
  });
});

test('5. No relationship at all still returns 404', async () => {
  await withServer({ hasRelationship: false }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, PATIENT_ID, DOCTOR_A_ID);
    assert.equal(res.status, 404);
  });
});

test('6. Unknown patient id returns 404', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await getDetail(baseUrl, '507f1f77bcf86cd799439aff', DOCTOR_A_ID);
    assert.equal(res.status, 404);
  });
});

test('7. Unauthenticated request is rejected (401)', async () => {
  await withServer({ hasRelationship: true }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_ID}`);
    assert.equal(res.status, 401);
  });
});

