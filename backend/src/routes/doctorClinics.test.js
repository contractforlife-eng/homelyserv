// backend/src/routes/doctorClinics.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorClinic from '../models/DoctorClinic.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-clinics-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439050';
const DOCTOR_B_ID = '507f1f77bcf86cd799439051';
const WORKER_ID = '507f1f77bcf86cd799439052';
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
  _id: DOCTOR_A_ID,
  fullName: 'Dr. Doctor Alpha',
  email: 'doctorA@homelyserv.test',
  role: 'DOCTOR',
  tokenVersion: 0,
  isSuspended: false,
  isVerified: true,
  ...overrides
});

/**
 * Test harness with in-memory simulated DoctorClinic storage
 */
const withDoctorClinicsServer = async ({ initialClinics = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  const originalClinicFind = DoctorClinic.find;
  const originalClinicFindOne = DoctorClinic.findOne;
  const originalClinicFindOneAndUpdate = DoctorClinic.findOneAndUpdate;
  const originalClinicCreate = DoctorClinic.create;
  const originalClinicUpdateMany = DoctorClinic.updateMany;
  const originalClinicCountDocuments = DoctorClinic.countDocuments;

  // In-memory store
  const clinicsStore = initialClinics.map((c, i) => ({
    _id: c._id || `507f1f77bcf86cd79943908${i}`,
    doctorId: String(c.doctorId),
    clinicName: c.clinicName,
    phone: c.phone || '',
    email: c.email || '',
    addressLine: c.addressLine,
    city: c.city,
    stateOrProvince: c.stateOrProvince || '',
    countryCode: c.countryCode,
    postalCode: c.postalCode || '',
    latitude: c.latitude !== undefined ? c.latitude : null,
    longitude: c.longitude !== undefined ? c.longitude : null,
    timezone: c.timezone || 'UTC',
    instructions: c.instructions || '',
    isActive: c.isActive !== undefined ? c.isActive : true,
    isPrimary: c.isPrimary !== undefined ? c.isPrimary : false,
    createdAt: c.createdAt || new Date(),
    updatedAt: c.updatedAt || new Date(),
    save: async function() { return this; }
  }));

  let idCounter = 90;

  User.findById = (id) => {
    const idStr = String(id);
    if (idStr === DOCTOR_A_ID) {
      return wrapQuery(createMockUser({ _id: DOCTOR_A_ID, email: 'doctorA@homelyserv.test' }));
    }
    if (idStr === DOCTOR_B_ID) {
      return wrapQuery(createMockUser({ _id: DOCTOR_B_ID, email: 'doctorB@homelyserv.test', fullName: 'Dr. Doctor Beta' }));
    }
    if (idStr === WORKER_ID) {
      return wrapQuery(createMockUser({ _id: WORKER_ID, email: 'worker@homelyserv.test', role: 'WORKER' }));
    }
    if (idStr === EMPLOYER_ID) {
      return wrapQuery(createMockUser({ _id: EMPLOYER_ID, email: 'employer@homelyserv.test', role: 'EMPLOYER' }));
    }
    return wrapQuery(null);
  };

  User.findByIdAndUpdate = async (id, update) => {
    return createMockUser({ _id: id });
  };

  DoctorClinic.find = (filter = {}) => {
    let result = clinicsStore.filter(c => {
      if (filter.doctorId && String(c.doctorId) !== String(filter.doctorId)) return false;
      if (filter.isActive !== undefined && c.isActive !== filter.isActive) return false;
      return true;
    });

    return {
      sort: (sortCriteria) => {
        const sorted = [...result].sort((a, b) => {
          if (sortCriteria.isPrimary) {
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return Promise.resolve(sorted);
      },
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };
  };

  DoctorClinic.findOne = (query = {}) => {
    const match = clinicsStore.find(c => {
      if (query._id && String(c._id) !== String(query._id)) return false;
      if (query.doctorId && String(c.doctorId) !== String(query.doctorId)) return false;
      if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
      if (query.isPrimary !== undefined && c.isPrimary !== query.isPrimary) return false;
      return true;
    });

    return {
      sort: () => Promise.resolve(match || null),
      then: (resolve, reject) => Promise.resolve(match || null).then(resolve, reject)
    };
  };

  DoctorClinic.findOneAndUpdate = async (query = {}, update = {}, options = {}) => {
    const clinic = clinicsStore.find(c => {
      if (query._id && String(c._id) !== String(query._id)) return false;
      if (query.doctorId && String(c.doctorId) !== String(query.doctorId)) return false;
      return true;
    });

    if (!clinic) return null;

    if (update.$set) {
      Object.assign(clinic, update.$set);
    }
    clinic.updatedAt = new Date();
    return clinic;
  };

  DoctorClinic.updateMany = async (query = {}, update = {}) => {
    let matchedCount = 0;
    clinicsStore.forEach(c => {
      let matches = true;
      if (query.doctorId && String(c.doctorId) !== String(query.doctorId)) matches = false;
      if (query._id && query._id.$ne && String(c._id) === String(query._id.$ne)) matches = false;
      if (query.isPrimary !== undefined && c.isPrimary !== query.isPrimary) matches = false;

      if (matches) {
        matchedCount++;
        if (update.$set) {
          Object.assign(c, update.$set);
        }
      }
    });
    return { matchedCount, modifiedCount: matchedCount };
  };

  DoctorClinic.countDocuments = async (query = {}) => {
    return clinicsStore.filter(c => {
      if (query.doctorId && String(c.doctorId) !== String(query.doctorId)) return false;
      if (query.isActive !== undefined && c.isActive !== query.isActive) return false;
      return true;
    }).length;
  };

  DoctorClinic.create = async (doc) => {
    idCounter++;
    const newDoc = {
      _id: `507f1f77bcf86cd7994390${idCounter}`,
      doctorId: String(doc.doctorId),
      clinicName: doc.clinicName,
      phone: doc.phone || '',
      email: doc.email || '',
      addressLine: doc.addressLine,
      city: doc.city,
      stateOrProvince: doc.stateOrProvince || '',
      countryCode: doc.countryCode,
      postalCode: doc.postalCode || '',
      latitude: doc.latitude !== undefined ? doc.latitude : null,
      longitude: doc.longitude !== undefined ? doc.longitude : null,
      timezone: doc.timezone || 'UTC',
      instructions: doc.instructions || '',
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      isPrimary: doc.isPrimary !== undefined ? doc.isPrimary : false,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function() { return this; }
    };
    clinicsStore.push(newDoc);
    return newDoc;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, clinicsStore });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    DoctorClinic.find = originalClinicFind;
    DoctorClinic.findOne = originalClinicFindOne;
    DoctorClinic.findOneAndUpdate = originalClinicFindOneAndUpdate;
    DoctorClinic.create = originalClinicCreate;
    DoctorClinic.updateMany = originalClinicUpdateMany;
    DoctorClinic.countDocuments = originalClinicCountDocuments;
  }
};

// ============================================================
// TESTS
// ============================================================

test('1. Unauthenticated request to GET /api/doctors/clinics is rejected with 401', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics`);
    assert.equal(res.status, 401);
  });
});

test('2. WORKER role cannot access Doctor Clinics endpoints', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });
});

test('3. EMPLOYER role cannot access Doctor Clinics endpoints', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      headers: authHeader({ userId: EMPLOYER_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 403);
  });
});

test('4. DOCTOR can create a clinic with required fields', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    const clinicPayload = {
      clinicName: 'Alpha Medical Center',
      addressLine: '123 Health Ave, Suite 4',
      city: 'Cairo',
      countryCode: 'EG',
      phone: '+20 100 123 4567',
      email: 'clinic@alphamed.test',
      isPrimary: true
    };

    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(clinicPayload)
    });

    const body = await res.json();
    if (res.status !== 201) {
      console.error('TEST 4 FAILED RES BODY:', body);
    }
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.clinic.clinicName, 'Alpha Medical Center');
    assert.equal(body.clinic.doctorId, DOCTOR_A_ID);
    assert.equal(body.clinic.isPrimary, true);
    assert.equal(body.clinic.isActive, true);
  });
});

test('5. Created clinic belongs to authenticated doctor', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl, clinicsStore }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'Heart Care Clinic',
        addressLine: '45 Nile St',
        city: 'Giza',
        countryCode: 'EG'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.clinic.doctorId, DOCTOR_A_ID);

    const stored = clinicsStore.find(c => c._id === body.clinic._id);
    assert.ok(stored);
    assert.equal(stored.doctorId, DOCTOR_A_ID);
  });
});

test('6. Doctor can list only their own clinics', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439001',
      doctorId: DOCTOR_A_ID,
      clinicName: 'Doctor A Clinic 1',
      addressLine: 'A1 Address',
      city: 'Cairo',
      countryCode: 'EG',
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439002',
      doctorId: DOCTOR_B_ID,
      clinicName: 'Doctor B Clinic',
      addressLine: 'B Address',
      city: 'Alexandria',
      countryCode: 'EG',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.count, 1);
    assert.equal(body.clinics[0].clinicName, 'Doctor A Clinic 1');
    assert.equal(body.clinics[0].doctorId, DOCTOR_A_ID);
  });
});

test('7. Doctor A cannot read or access Doctor B clinic by ID (on update/delete)', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439002',
      doctorId: DOCTOR_B_ID,
      clinicName: 'Doctor B Clinic',
      addressLine: 'B Address',
      city: 'Alexandria',
      countryCode: 'EG',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl }) => {
    // Attempt update
    const updateRes = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439002`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicName: 'Hacked Name' })
    });
    assert.equal(updateRes.status, 404);
    const updateBody = await updateRes.json();
    assert.equal(updateBody.success, false);
  });
});

test('8. Doctor A cannot update Doctor B clinic', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439002',
      doctorId: DOCTOR_B_ID,
      clinicName: 'Original B Clinic',
      addressLine: 'B Address',
      city: 'Alexandria',
      countryCode: 'EG',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl, clinicsStore }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439002`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicName: 'Changed By A' })
    });

    assert.equal(res.status, 404);
    const stored = clinicsStore.find(c => c._id === '507f1f77bcf86cd799439002');
    assert.equal(stored.clinicName, 'Original B Clinic');
  });
});

test('9. Doctor A cannot delete Doctor B clinic', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439002',
      doctorId: DOCTOR_B_ID,
      clinicName: 'Doctor B Clinic',
      addressLine: 'B Address',
      city: 'Alexandria',
      countryCode: 'EG',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl, clinicsStore }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439002`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 404);
    const stored = clinicsStore.find(c => c._id === '507f1f77bcf86cd799439002');
    assert.equal(stored.isActive, true);
  });
});

test('10. Doctor can update their own clinic', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439001',
      doctorId: DOCTOR_A_ID,
      clinicName: 'Initial Clinic Name',
      addressLine: 'Old Address',
      city: 'Cairo',
      countryCode: 'EG',
      phone: '111',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl, clinicsStore }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439001`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'Updated Clinic Name',
        phone: '222',
        instructions: 'Ring bell upon arrival',
        isPrimary: true
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.clinic.clinicName, 'Updated Clinic Name');
    assert.equal(body.clinic.phone, '222');
    assert.equal(body.clinic.instructions, 'Ring bell upon arrival');
    assert.equal(body.clinic.isPrimary, true);

    const stored = clinicsStore.find(c => c._id === '507f1f77bcf86cd799439001');
    assert.equal(stored.clinicName, 'Updated Clinic Name');
  });
});

test('11. DELETE performs soft delete by setting isActive: false', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439001',
      doctorId: DOCTOR_A_ID,
      clinicName: 'Active Clinic To Delete',
      addressLine: 'Address 1',
      city: 'Cairo',
      countryCode: 'EG',
      isActive: true
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl, clinicsStore }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439001`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.clinic.isActive, false);

    // Verify document was not deleted physically from database
    const stored = clinicsStore.find(c => c._id === '507f1f77bcf86cd799439001');
    assert.ok(stored, 'Document still exists in DB');
    assert.equal(stored.isActive, false);
  });
});

test('12. Soft-deleted clinics are excluded from normal active clinic list', async () => {
  const initialClinics = [
    {
      _id: '507f1f77bcf86cd799439001',
      doctorId: DOCTOR_A_ID,
      clinicName: 'Active Clinic',
      addressLine: 'Address 1',
      city: 'Cairo',
      countryCode: 'EG',
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439002',
      doctorId: DOCTOR_A_ID,
      clinicName: 'Deactivated Clinic',
      addressLine: 'Address 2',
      city: 'Cairo',
      countryCode: 'EG',
      isActive: false
    }
  ];

  await withDoctorClinicsServer({ initialClinics }, async ({ baseUrl }) => {
    // Normal query returns only active
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 1);
    assert.equal(body.clinics[0].clinicName, 'Active Clinic');

    // Query with ?includeInactive=true returns both
    const resAll = await fetch(`${baseUrl}/api/doctors/clinics?includeInactive=true`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.equal(bodyAll.count, 2);
  });
});

test('13. Invalid required payload is rejected with 4xx', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    // Missing clinicName
    const res1 = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        addressLine: '123 Health Ave',
        city: 'Cairo',
        countryCode: 'EG'
      })
    });
    assert.equal(res1.status, 400);

    // Missing addressLine
    const res2 = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'My Clinic',
        city: 'Cairo',
        countryCode: 'EG'
      })
    });
    assert.equal(res2.status, 400);

    // Invalid coordinates (latitude > 90)
    const res3 = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'My Clinic',
        addressLine: '123 Health Ave',
        city: 'Cairo',
        countryCode: 'EG',
        latitude: 150
      })
    });
    assert.equal(res3.status, 400);

    // Invalid email format
    const res4 = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'My Clinic',
        addressLine: '123 Health Ave',
        city: 'Cairo',
        countryCode: 'EG',
        email: 'invalid-email-string'
      })
    });
    assert.equal(res4.status, 400);
  });
});

// ============================================================
// Phase: Clinics page audit coverage
// The Clinics UI now requests ?includeInactive=true so the doctor can see
// the Active/Inactive state and re-activate a soft-deleted clinic. These
// tests lock down that flow plus ownership on the reactivation path.
// ============================================================

const seedMixedClinics = () => ([
  {
    _id: '507f1f77bcf86cd799439001',
    doctorId: DOCTOR_A_ID,
    clinicName: 'Downtown Clinic',
    addressLine: 'Address 1',
    city: 'Cairo',
    countryCode: 'EG',
    isActive: true,
    isPrimary: true
  },
  {
    _id: '507f1f77bcf86cd799439002',
    doctorId: DOCTOR_A_ID,
    clinicName: 'Closed Branch',
    addressLine: 'Address 2',
    city: 'Cairo',
    countryCode: 'EG',
    isActive: false
  },
  {
    _id: '507f1f77bcf86cd799439003',
    doctorId: DOCTOR_B_ID,
    clinicName: 'Other Doctor Clinic',
    addressLine: 'Address 3',
    city: 'Berlin',
    countryCode: 'DE',
    isActive: false
  }
]);

test('14. Doctor sees own active AND inactive clinics with correct isActive flags', async () => {
  await withDoctorClinicsServer({ initialClinics: seedMixedClinics() }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics?includeInactive=true`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const { clinics, count } = await res.json();

    // Only doctor A's own clinics, never doctor B's.
    assert.equal(count, 2);
    assert.ok(!clinics.some((c) => c.clinicName === 'Other Doctor Clinic'));

    const downtown = clinics.find((c) => c.clinicName === 'Downtown Clinic');
    const closed = clinics.find((c) => c.clinicName === 'Closed Branch');
    assert.equal(downtown.isActive, true);
    assert.equal(downtown.isPrimary, true, 'primary clinic is still identified');
    assert.equal(closed.isActive, false, 'inactive clinic is visible to its owner');
  });
});

test('15. Doctor can re-activate their own inactive clinic', async () => {
  await withDoctorClinicsServer({ initialClinics: seedMixedClinics() }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439002`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isActive: true })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.clinic.isActive, true);
    assert.equal(body.clinic.clinicName, 'Closed Branch');
  });
});

test('16. Doctor CANNOT re-activate or edit another doctor inactive clinic (404)', async () => {
  await withDoctorClinicsServer({ initialClinics: seedMixedClinics() }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439003`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isActive: true })
    });
    assert.equal(res.status, 404, 'foreign clinic is never found');
  });
});

test('17. Doctor CANNOT make another doctor clinic primary (404)', async () => {
  await withDoctorClinicsServer({ initialClinics: seedMixedClinics() }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439003`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isPrimary: true })
    });
    assert.equal(res.status, 404);
  });
});

test('18. Setting primary demotes the doctor previous primary (single primary invariant)', async () => {
  await withDoctorClinicsServer({ initialClinics: seedMixedClinics() }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinics/507f1f77bcf86cd799439002`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isPrimary: true })
    });
    assert.equal(res.status, 200);

    const list = await fetch(`${baseUrl}/api/doctors/clinics?includeInactive=true`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const { clinics } = await list.json();
    const primaries = clinics.filter((c) => c.isPrimary);
    assert.equal(primaries.length, 1, 'exactly one primary clinic per doctor');
    assert.equal(primaries[0].clinicName, 'Closed Branch');
  });
});

test('19. Clinic response never leaks a doctorId from the request body', async () => {
  await withDoctorClinicsServer({}, async ({ baseUrl }) => {
    // A doctor trying to create a clinic owned by another doctor.
    const res = await fetch(`${baseUrl}/api/doctors/clinics`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        clinicName: 'Spoofed Clinic',
        addressLine: '1 Fake St',
        city: 'Cairo',
        countryCode: 'EG',
        doctorId: DOCTOR_B_ID
      })
    });
    assert.equal(res.status, 201);

    // The stored clinic belongs to the AUTHENTICATED doctor, never the spoofed id.
    const list = await fetch(`${baseUrl}/api/doctors/clinics`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    const bClinics = await list.json();
    assert.ok(
      !bClinics.clinics.some((c) => c.clinicName === 'Spoofed Clinic'),
      'spoofed doctorId in the body must be ignored'
    );
  });
});

