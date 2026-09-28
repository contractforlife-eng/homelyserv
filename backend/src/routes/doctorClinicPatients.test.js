// backend/src/routes/doctorClinicPatients.test.js
// ============================================================
// PHASE 1 — Independent Clinic Patients API.
//
// These tests cover the NEW additive endpoints only. They assert
// that an account-less clinic patient works, and that a doctor can
// never reach another doctor's clinic patient.
//
// The pre-existing HomelyServ patient suites (doctorPatients.test.js,
// doctorConsultations.test.js, doctorPrescriptions.test.js, …) are
// NOT modified or mocked by this file.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ClinicPatient from '../models/ClinicPatient.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-clinic-patients-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439070';
const DOCTOR_B_ID = '507f1f77bcf86cd799439071';
const CLINIC_ID = '507f1f77bcf86cd799439072';
const LINKED_USER_ID = '507f1f77bcf86cd799439073';
const WORKER_ID = '507f1f77bcf86cd799439074';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const usersMockStore = {
  [DOCTOR_A_ID]: { _id: DOCTOR_A_ID, fullName: 'Dr. Alpha', role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [DOCTOR_B_ID]: { _id: DOCTOR_B_ID, fullName: 'Dr. Beta', role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [WORKER_ID]: { _id: WORKER_ID, fullName: 'Some Worker', role: 'WORKER', tokenVersion: 0, isSuspended: false }
};

const originalUserFindById = User.findById;

/**
 * Installed INSIDE withClinicPatientServer (and restored in its finally)
 * so every test gets a working auth middleware — the real User model has
 * no live DB connection in unit tests.
 */
const installUserMock = () => {
  User.findById = (id) => {
    const doc = usersMockStore[String(id)] || null;
    return { select: () => Promise.resolve(doc) };
  };
};

/**
 * Minimal in-memory stand-in for the ClinicPatient model.
 * Mirrors the real schema fields and the doctorId scoping the
 * controller relies on.
 */
const makeDoc = (raw) => {
  const doc = {
    _id: raw._id,
    doctorId: raw.doctorId,
    clinicId: raw.clinicId ?? null,
    linkedUserId: raw.linkedUserId ?? null,
    fullName: raw.fullName ?? '',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    dateOfBirth: raw.dateOfBirth ?? null,
    sex: raw.sex ?? null,
    address: raw.address ?? '',
    notes: raw.notes ?? '',
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date()
  };
  doc.toObject = () => ({ ...doc });
  doc.save = async () => doc;
  return doc;
};

const withClinicPatientServer = async (seed, run) => {
  installUserMock();
  const store = seed.map((r) => makeDoc(r));
  let seq = 0;

  const originalFind = ClinicPatient.find;
  const originalFindOne = ClinicPatient.findOne;
  const originalCreate = ClinicPatient.create;

  ClinicPatient.create = async (payload) => {
    seq += 1;
    const doc = makeDoc({
      _id: `507f1f77bcf86cd7994391${String(seq).padStart(2, '0')}`,
      ...payload
    });
    store.push(doc);
    return doc;
  };

  ClinicPatient.find = (filter = {}) => {
    const results = store.filter((d) => {
      if (filter.doctorId && String(d.doctorId) !== String(filter.doctorId)) return false;
      return true;
    });
    return { sort: () => Promise.resolve(results) };
  };

  ClinicPatient.findOne = (filter = {}) => {
    const found = store.find((d) => {
      if (filter._id && String(d._id) !== String(filter._id)) return false;
      if (filter.doctorId && String(d.doctorId) !== String(filter.doctorId)) return false;
      return true;
    }) || null;
    return { then: (res, rej) => Promise.resolve(found).then(res, rej) };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, store });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    ClinicPatient.find = originalFind;
    ClinicPatient.findOne = originalFindOne;
    ClinicPatient.create = originalCreate;
  }
};

const A_PATIENT_ID = '507f1f77bcf86cd799439180';
const B_PATIENT_ID = '507f1f77bcf86cd799439181';

// ============================================
// TEST SUITE: Clinic Patients API (Phase 1)
// ============================================

test('1. Doctor can create a ClinicPatient WITHOUT a HomelyServ account', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        fullName: 'Walk-in Patient',
        phone: '+201111111111',
        dateOfBirth: '1990-05-20',
        sex: 'MALE',
        address: 'Cairo'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.patient.fullName, 'Walk-in Patient');
    // The whole point: no HomelyServ account is involved.
    assert.equal(data.patient.linkedUserId, null);
    assert.equal(data.patient.doctorId, DOCTOR_A_ID);
  });
});

test('2. linkedUserId is optional (defaults to null)', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ fullName: 'No Account Patient' })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.patient.linkedUserId, null);
  });
});

test('3. Missing fullName is rejected', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ phone: '+201111111111' })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });
});

test('4. Doctor can list their own ClinicPatients only', async () => {
  await withClinicPatientServer([
    { _id: A_PATIENT_ID, doctorId: DOCTOR_A_ID, fullName: 'Mine One' },
    { _id: '507f1f77bcf86cd799439182', doctorId: DOCTOR_A_ID, fullName: 'Mine Two' },
    { _id: B_PATIENT_ID, doctorId: DOCTOR_B_ID, fullName: 'Theirs' }
  ], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.count, 2);
    assert.equal(data.patients.some((p) => p.fullName === 'Theirs'), false);
  });
});

test('5. Doctor can retrieve their own ClinicPatient', async () => {
  await withClinicPatientServer(
    [{ _id: A_PATIENT_ID, doctorId: DOCTOR_A_ID, fullName: 'Retrieve Me', phone: '+20' }],
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${A_PATIENT_ID}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.patient.fullName, 'Retrieve Me');
    }
  );
});

test('6. Doctor can update their own ClinicPatient', async () => {
  await withClinicPatientServer(
    [{ _id: A_PATIENT_ID, doctorId: DOCTOR_A_ID, fullName: 'Before' }],
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${A_PATIENT_ID}`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ fullName: 'After', notes: 'Follow up in 2 weeks' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.patient.fullName, 'After');
      assert.equal(data.patient.notes, 'Follow up in 2 weeks');
    }
  );
});


test('7. Doctor CANNOT retrieve another doctor ClinicPatient (404)', async () => {
  await withClinicPatientServer(
    [{ _id: B_PATIENT_ID, doctorId: DOCTOR_B_ID, fullName: 'Private' }],
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${B_PATIENT_ID}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 404);
    }
  );
});

test('8. Doctor CANNOT update another doctor ClinicPatient (404)', async () => {
  await withClinicPatientServer(
    [{ _id: B_PATIENT_ID, doctorId: DOCTOR_B_ID, fullName: 'Private' }],
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${B_PATIENT_ID}`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ fullName: 'Hijacked' })
      });

      assert.equal(res.status, 404);
    }
  );
});

test('9. Non-Doctor role cannot access ClinicPatients (403)', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
    });

    assert.equal(res.status, 403);
  });
});

test('10. Unauthenticated request is rejected (401)', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, { method: 'GET' });
    assert.equal(res.status, 401);
  });
});

test('11. Invalid sex / DOB / email are rejected', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const bad = async (payload) => {
      const res = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify(payload)
      });
      assert.equal(res.status, 400);
    };

    await bad({ fullName: 'X', sex: 'ALIEN' });
    await bad({ fullName: 'X', dateOfBirth: 'not-a-date' });
    await bad({ fullName: 'X', dateOfBirth: '2999-01-01' });
    await bad({ fullName: 'X', email: 'not-an-email' });
  });
});

test('12. Optional linkedUserId and clinicId are accepted', async () => {
  await withClinicPatientServer([], async ({ baseUrl }) => {
    const linked = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ fullName: 'Linked', linkedUserId: LINKED_USER_ID })
    });
    assert.equal(linked.status, 201);
    assert.equal((await linked.json()).patient.linkedUserId, LINKED_USER_ID);

    const atClinic = await fetch(`${baseUrl}/api/doctors/clinic-patients`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ fullName: 'At Clinic', clinicId: CLINIC_ID })
    });
    assert.equal(atClinic.status, 201);
    assert.equal((await atClinic.json()).patient.clinicId, CLINIC_ID);
  });
});

