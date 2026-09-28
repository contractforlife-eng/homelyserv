// backend/src/routes/doctorPatients.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import doctorsRouter from './doctors.js';

// DoctorPatientLink mock (Medical Center links): in-memory, empty by default
// so appointment-based relationship rules drive these tests.
const patientLinkStore = [];
DoctorPatientLink.findOne = (filter = {}) => {
  const match = patientLinkStore.some((l) => String(l.doctorId) === String(filter.doctorId)
    && String(l.patientId) === String(filter.patientId)
    && l.isActive !== false);
  return {
    select: () => Promise.resolve(match ? { _id: '507f1f77bcf86cd7994390f1' } : null)
  };
};
DoctorPatientLink.find = (filter = {}) => ({
  sort: () => ({
    then(resolve) {
      resolve(patientLinkStore.filter((l) => String(l.doctorId) === String(filter.doctorId)
        && l.isActive !== false));
    }
  })
});

const secret = 'doctor-patients-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439050';
const DOCTOR_B_ID = '507f1f77bcf86cd799439051';
const PATIENT_1_ID = '507f1f77bcf86cd799439052';
const PATIENT_2_ID = '507f1f77bcf86cd799439053';
const UNRELATED_USER_ID = '507f1f77bcf86cd799439054';
const WORKER_ROLE_ID = '507f1f77bcf86cd799439055';

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
    isSuspended: false,
    isVerified: true
  },
  [DOCTOR_B_ID]: {
    _id: DOCTOR_B_ID,
    fullName: 'Dr. Beta Doctor',
    email: 'doctorB@homelyserv.test',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false,
    isVerified: true
  },
  [PATIENT_1_ID]: {
    _id: PATIENT_1_ID,
    fullName: 'Patient One',
    email: 'patient1@homelyserv.test',
    profileImage: 'https://example.com/p1.jpg',
    phone: '+201000000001',
    language: 'en',
    city: 'Cairo',
    countryName: 'Egypt',
    role: 'WORKER'
  },
  [PATIENT_2_ID]: {
    _id: PATIENT_2_ID,
    fullName: 'Patient Two',
    email: 'patient2@homelyserv.test',
    profileImage: null,
    phone: '+201000000002',
    language: 'ar',
    city: 'Giza',
    countryName: 'Egypt',
    role: 'EMPLOYER'
  },
  [UNRELATED_USER_ID]: {
    _id: UNRELATED_USER_ID,
    fullName: 'Unrelated User',
    email: 'unrelated@homelyserv.test',
    role: 'EMPLOYER'
  },
  [WORKER_ROLE_ID]: {
    _id: WORKER_ROLE_ID,
    fullName: 'Regular Worker',
    email: 'regular@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false,
    isVerified: true
  }
};

const withDoctorPatientsServer = async ({ initialAppointments = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalAppointmentFind = DoctorAppointment.find;
  const originalAppointmentCountDocuments = DoctorAppointment.countDocuments;

  const appointmentsStore = initialAppointments.map((a, idx) => {
    const pUser = usersMockStore[String(a.patientId)] || { _id: String(a.patientId), fullName: 'Patient' };
    return {
      _id: a._id || `507f1f77bcf86cd79943909${idx}`,
      doctorId: String(a.doctorId),
      patientId: pUser,
      status: a.status || 'CONFIRMED',
      consultationType: a.consultationType || 'CLINIC',
      startsAt: a.startsAt instanceof Date ? a.startsAt : new Date(a.startsAt || Date.now() - 86400000 * (idx + 1)),
      endsAt: a.endsAt instanceof Date ? a.endsAt : new Date(Date.now() - 86400000 * (idx + 1) + 1800000),
      reason: a.reason || 'Routine check',
      feeSnapshot: a.feeSnapshot || 200,
      currency: 'EGP',
      clinicId: a.clinicId ? { clinicName: 'Central Clinic', city: 'Cairo' } : null,
      serviceId: a.serviceId ? { serviceName: 'Consultation', price: 200, durationMinutes: 30 } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  User.findById = (id) => {
    const idStr = String(id);
    const user = usersMockStore[idStr] || null;
    return wrapQuery(user);
  };

  const createPopulatedQuery = (result) => {
    const chain = {
      populate: () => chain,
      sort: () => chain,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };
    return chain;
  };

  DoctorAppointment.find = (filter = {}) => {
    let result = appointmentsStore.filter(a => {
      if (filter.doctorId && String(a.doctorId) !== String(filter.doctorId)) return false;
      if (filter.patientId && String(a.patientId._id || a.patientId) !== String(filter.patientId)) return false;
      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$in) {
          if (!filter.status.$in.includes(a.status)) return false;
        } else if (a.status !== filter.status) {
          return false;
        }
      }
      return true;
    });

    return createPopulatedQuery(result);
  };

  DoctorAppointment.countDocuments = (filter = {}) => {
    let count = 0;
    for (const a of appointmentsStore) {
      if (filter.doctorId && String(a.doctorId) !== String(filter.doctorId)) continue;
      if (filter.patientId && String(a.patientId._id || a.patientId) !== String(filter.patientId)) continue;
      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$in) {
          if (!filter.status.$in.includes(a.status)) continue;
        } else if (a.status !== filter.status) {
          continue;
        }
      }
      count++;
    }
    return Promise.resolve(count);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, appointmentsStore });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    DoctorAppointment.find = originalAppointmentFind;
    DoctorAppointment.countDocuments = originalAppointmentCountDocuments;
  }
};

// ============================================
// TEST SUITE: Doctor Patients API & Access Control
// ============================================

test('1. Doctor can list their valid patients', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 1);
      assert.equal(data.patients[0].patientId, PATIENT_1_ID);
      assert.equal(data.patients[0].patientName, 'Patient One');
    }
  );
});

test('2. Multiple appointments with the same patient produce one deduplicated patient', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED' },
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'COMPLETED' },
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'COMPLETED' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 1);
      assert.equal(data.patients[0].totalAppointments, 3);
    }
  );
});

test('3. CONFIRMED appointment establishes patient visibility', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const data = await res.json();
      assert.equal(data.count, 1);
      assert.equal(data.patients[0].patientId, PATIENT_1_ID);
    }
  );
});

test('4. COMPLETED appointment establishes patient visibility', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_2_ID, status: 'COMPLETED' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const data = await res.json();
      assert.equal(data.count, 1);
      assert.equal(data.patients[0].patientId, PATIENT_2_ID);
    }
  );
});

test('5. PENDING appointment alone does not establish patient visibility', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'PENDING' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const data = await res.json();
      assert.equal(data.count, 0);

      // Details endpoint should also return 404
      const resDetails = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_1_ID}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      assert.equal(resDetails.status, 404);
    }
  );
});

test('6. CANCELLED appointment does not establish patient visibility', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CANCELLED' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const data = await res.json();
      assert.equal(data.count, 0);
    }
  );
});

test('7. NO_SHOW appointment does not establish patient visibility', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'NO_SHOW' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const data = await res.json();
      assert.equal(data.count, 0);
    }
  );
});

test("8. Doctor cannot access another Doctor's patient", async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_B_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED' }
      ]
    },
    async ({ baseUrl }) => {
      // Doctor A tries to access Doctor B's patient
      const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_1_ID}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      assert.equal(res.status, 404);
    }
  );
});

test('9. Arbitrary unrelated user ID returns 404', async () => {
  await withDoctorPatientsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/patients/${UNRELATED_USER_ID}`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });
});

test('10. Patient appointment history is scoped to the current Doctor', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED', reason: 'Apt with Doc A' },
        { doctorId: DOCTOR_B_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED', reason: 'Apt with Doc B' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_1_ID}/appointments`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.count, 1);
      assert.equal(data.appointments[0].reason, 'Apt with Doc A');
    }
  );
});

test('11. Non-Doctor receives 403', async () => {
  await withDoctorPatientsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/patients`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });
});

test('12. No medical fields are returned from the patient list/details endpoints', async () => {
  await withDoctorPatientsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, patientId: PATIENT_1_ID, status: 'CONFIRMED' }
      ]
    },
    async ({ baseUrl }) => {
      // Check list endpoint
      const resList = await fetch(`${baseUrl}/api/doctors/patients`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const dataList = await resList.json();
      const patientSummary = dataList.patients[0];

      assert.equal(patientSummary.diagnosis, undefined);
      assert.equal(patientSummary.medications, undefined);
      assert.equal(patientSummary.allergies, undefined);
      assert.equal(patientSummary.chronicConditions, undefined);
      assert.equal(patientSummary.medicalHistory, undefined);
      assert.equal(patientSummary.prescriptions, undefined);

      // Check details endpoint
      const resDetails = await fetch(`${baseUrl}/api/doctors/patients/${PATIENT_1_ID}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      const dataDetails = await resDetails.json();
      const patientDetail = dataDetails.patient;

      assert.equal(patientDetail.diagnosis, undefined);
      assert.equal(patientDetail.medications, undefined);
      assert.equal(patientDetail.allergies, undefined);
      assert.equal(patientDetail.chronicConditions, undefined);
      assert.equal(patientDetail.medicalHistory, undefined);
      assert.equal(patientDetail.prescriptions, undefined);
    }
  );
});
