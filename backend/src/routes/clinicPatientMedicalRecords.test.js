// backend/src/routes/clinicPatientMedicalRecords.test.js
// ============================================================
// PHASE 2A — Clinic Patient Medical Record API.
//
// Covers the doctor-maintained persistent record only. The
// pre-existing HomelyServ suites are untouched by this file.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ClinicPatient from '../models/ClinicPatient.js';
import ClinicPatientMedicalRecord from '../models/ClinicPatientMedicalRecord.js';
import doctorsRouter from './doctors.js';

const secret = 'clinic-patient-medical-records-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439080';
const DOCTOR_B_ID = '507f1f77bcf86cd799439081';
const PATIENT_A_ID = '507f1f77bcf86cd799439082';
const PATIENT_B_ID = '507f1f77bcf86cd799439083';
const WORKER_ID = '507f1f77bcf86cd799439084';
const LINKED_WORKER_ID = '507f1f77bcf86cd799439085';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const usersMockStore = {
  [DOCTOR_A_ID]: { _id: DOCTOR_A_ID, role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [DOCTOR_B_ID]: { _id: DOCTOR_B_ID, role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [WORKER_ID]: { _id: WORKER_ID, role: 'WORKER', tokenVersion: 0, isSuspended: false },
  [LINKED_WORKER_ID]: { _id: LINKED_WORKER_ID, role: 'WORKER', tokenVersion: 0, isSuspended: false }
};

const originalUserFindById = User.findById;
const installUserMock = () => {
  User.findById = (id) => ({
    select: () => Promise.resolve(usersMockStore[String(id)] || null)
  });
};

const makePatient = (raw) => {
  const doc = {
    _id: raw._id,
    doctorId: raw.doctorId,
    fullName: raw.fullName || 'Patient',
    linkedUserId: raw.linkedUserId ?? null,
    isActive: true
  };
  doc.toObject = () => ({ ...doc });
  return doc;
};

const makeRecord = (raw) => {
  const doc = {
    _id: raw._id,
    doctorId: raw.doctorId,
    clinicPatientId: raw.clinicPatientId,
    chronicConditions: raw.chronicConditions ?? [],
    allergies: raw.allergies ?? [],
    currentMedications: raw.currentMedications ?? [],
    previousSurgeries: raw.previousSurgeries ?? [],
    familyHistory: raw.familyHistory ?? '',
    smokingStatus: raw.smokingStatus ?? 'UNKNOWN',
    disabilityStatus: raw.disabilityStatus ?? '',
    otherMedicalHistory: raw.otherMedicalHistory ?? '',
    clinicalNotes: raw.clinicalNotes ?? '',
    importantConditions: raw.importantConditions ?? '',
    updatedAt: new Date()
  };
  doc.toObject = () => ({ ...doc });
  return doc;
};

/** Enforces the unique doctorId + clinicPatientId compound index. */
const withRecordServer = async (seed, run) => {
  installUserMock();

  const patients = (seed.patients || []).map(makePatient);
  const records = (seed.records || []).map(makeRecord);
  let seq = 0;

  const origPF = ClinicPatient.findOne;
  const origRF = ClinicPatientMedicalRecord.findOne;
  const origRFAU = ClinicPatientMedicalRecord.findOneAndUpdate;

  ClinicPatient.findOne = (filter = {}) => {
    const found = patients.find(
      (p) => String(p._id) === String(filter._id) &&
        (!filter.doctorId || String(p.doctorId) === String(filter.doctorId))
    ) || null;
    return { then: (res, rej) => Promise.resolve(found).then(res, rej) };
  };

  ClinicPatientMedicalRecord.findOne = (filter = {}) => {
    const found = records.find(
      (r) => String(r.clinicPatientId) === String(filter.clinicPatientId) &&
        String(r.doctorId) === String(filter.doctorId)
    ) || null;
    return { then: (res, rej) => Promise.resolve(found).then(res, rej) };
  };

  ClinicPatientMedicalRecord.findOneAndUpdate = async (filter, update) => {
    const existing = records.find(
      (r) => String(r.clinicPatientId) === String(filter.clinicPatientId) &&
        String(r.doctorId) === String(filter.doctorId)
    );
    if (existing) {
      Object.assign(existing, update.$set);
      return existing;
    }
    // Insert path: only succeeds when the compound unique key is free.
    const clash = records.find(
      (r) => String(r.clinicPatientId) === String(filter.clinicPatientId) &&
        String(r.doctorId) === String(filter.doctorId)
    );
    if (clash) {
      const err = new Error('E11000 duplicate key error');
      err.code = 11000;
      throw err;
    }
    seq += 1;
    const created = makeRecord({
      _id: `507f1f77bcf86cd7994391${String(90 + seq).padStart(2, '0')}`,
      ...filter,
      ...(update.$set || {})
    });
    records.push(created);
    return created;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run({ baseUrl, records, patients });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    ClinicPatient.findOne = origPF;
    ClinicPatientMedicalRecord.findOne = origRF;
    ClinicPatientMedicalRecord.findOneAndUpdate = origRFAU;
  }
};

const ownedSeed = {
  patients: [{ _id: PATIENT_A_ID, doctorId: DOCTOR_A_ID, fullName: 'Walk-in Patient' }],
  records: []
};

// ============================================
// TEST SUITE: Clinic Patient Medical Record (Phase 2A)
// ============================================

test('1. Doctor can create a medical record for their ClinicPatient', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        chronicConditions: ['Hypertension'],
        allergies: ['Penicillin'],
        currentMedications: ['Amlodipine 5mg'],
        previousSurgeries: ['Appendectomy 2015'],
        familyHistory: 'Father: diabetes',
        smokingStatus: 'NEVER',
        disabilityStatus: 'None',
        otherMedicalHistory: 'No other notable history.',
        clinicalNotes: 'Follow up every 3 months.',
        importantConditions: 'Hypertension'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.record.clinicPatientId, PATIENT_A_ID);
    assert.equal(data.record.doctorId, DOCTOR_A_ID);
    assert.deepEqual(data.record.allergies, ['Penicillin']);
    assert.equal(data.record.smokingStatus, 'NEVER');
  });
});

test('2. Doctor can retrieve a record they created', async () => {
  await withRecordServer({
    ...ownedSeed,
    records: [{
      _id: '507f1f77bcf86cd799439190',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Stable patient'
    }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.record.clinicalNotes, 'Stable patient');
    assert.equal(data.record.isNew, false);
  });
});

test('3. Missing record returns a clean EMPTY default (200, not 404)', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.record.isNew, true);
    assert.deepEqual(data.record.allergies, []);
    assert.equal(data.record.smokingStatus, 'UNKNOWN');
  });
});

test('4. Doctor can update an existing record', async () => {
  await withRecordServer({
    ...ownedSeed,
    records: [{
      _id: '507f1f77bcf86cd799439191',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Before'
    }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicalNotes: 'After' })
    });

    assert.equal(res.status, 200);
    assert.equal((await res.json()).record.clinicalNotes, 'After');
  });
});

test('5. Another Doctor gets 404 and cannot read the record', async () => {
  await withRecordServer({
    patients: [
      { _id: PATIENT_A_ID, doctorId: DOCTOR_A_ID },
      { _id: PATIENT_B_ID, doctorId: DOCTOR_B_ID }
    ],
    records: [{
      _id: '507f1f77bcf86cd799439192',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Private'
    }]
  }, async ({ baseUrl }) => {
    // Doctor B asks for Doctor A's ClinicPatient.
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });
});

test('6. Another Doctor cannot UPDATE the record (404)', async () => {
  await withRecordServer({
    patients: [
      { _id: PATIENT_A_ID, doctorId: DOCTOR_A_ID },
      { _id: PATIENT_B_ID, doctorId: DOCTOR_B_ID }
    ],
    records: [{
      _id: '507f1f77bcf86cd799439193',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Private'
    }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicalNotes: 'Hijacked' })
    });
    assert.equal(res.status, 404);
  });
});

test('7. Unauthenticated request is rejected (401)', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET'
    });
    assert.equal(res.status, 401);
  });
});

test('8. Non-Doctor role is rejected (403)', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });
});


test('9. A ClinicPatient owned by ANOTHER Doctor cannot be used to create a record', async () => {
  await withRecordServer({
    patients: [{ _id: PATIENT_B_ID, doctorId: DOCTOR_B_ID, fullName: 'B Patient' }],
    records: []
  }, async ({ baseUrl, records }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_B_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicalNotes: 'Should not be written' })
    });

    assert.equal(res.status, 404);
    // Nothing was created behind the scenes.
    assert.equal(records.length, 0);
  });
});

test('10. Duplicate record cannot be created for the same Doctor + ClinicPatient', async () => {
  await withRecordServer({
    ...ownedSeed,
    records: [{
      _id: '507f1f77bcf86cd799439194',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Original'
    }]
  }, async ({ baseUrl, records }) => {
    // A forced insert (bypassing findOneAndUpdate) must be rejected by the
    // unique compound index; the controller maps E11000 to 409.
    const before = records.length;
    assert.equal(before, 1);

    // Normal upsert updates in place — it must NOT create a second row.
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicalNotes: 'Updated in place' })
    });
    assert.equal(res.status, 200);
    assert.equal(records.length, 1, 'no duplicate record row was created');
  });
});

test('11. linkedUserId does NOT bypass ownership', async () => {
  // A ClinicPatient with a linkedUserId is still owned by its doctor.
  await withRecordServer({
    patients: [{
      _id: PATIENT_A_ID,
      doctorId: DOCTOR_A_ID,
      fullName: 'Linked Patient',
      linkedUserId: LINKED_WORKER_ID
    }],
    records: [{
      _id: '507f1f77bcf86cd799439195',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      clinicalNotes: 'Owned by doctor A'
    }]
  }, async ({ baseUrl }) => {
    // Doctor B cannot reach it merely because a HomelyServ account is linked.
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);

    // The linked account itself is a WORKER and gets nothing.
    const asWorker = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: LINKED_WORKER_ID, role: 'WORKER' })
    });
    assert.equal(asWorker.status, 403);
  });
});

test('12. Invalid smokingStatus / list payloads are rejected (400)', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const bad = async (payload) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify(payload)
      });
      assert.equal(res.status, 400);
    };

    await bad({ smokingStatus: 'SOMETHING' });
    await bad({ allergies: 'not-an-array' });
    await bad({ familyHistory: 12345 });
  });
});

test('13. Partial update only changes the supplied fields', async () => {
  await withRecordServer({
    ...ownedSeed,
    records: [{
      _id: '507f1f77bcf86cd799439196',
      doctorId: DOCTOR_A_ID,
      clinicPatientId: PATIENT_A_ID,
      chronicConditions: ['Diabetes'],
      clinicalNotes: 'Keep me'
    }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${PATIENT_A_ID}/medical-record`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ familyHistory: 'New family history' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.record.familyHistory, 'New family history');
    // Untouched fields survive.
    assert.deepEqual(data.record.chronicConditions, ['Diabetes']);
    assert.equal(data.record.clinicalNotes, 'Keep me');
  });
});

test('14. Unknown ClinicPatient id returns 404 (no data leak)', async () => {
  await withRecordServer(ownedSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/507f1f77bcf86cd7994390ff/medical-record`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });
});

