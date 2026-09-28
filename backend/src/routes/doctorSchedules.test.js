// backend/src/routes/doctorSchedules.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-schedules-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439050';
const DOCTOR_B_ID = '507f1f77bcf86cd799439051';
const WORKER_ID = '507f1f77bcf86cd799439052';
const EMPLOYER_ID = '507f1f77bcf86cd799439053';

const CLINIC_A_ID = '507f1f77bcf86cd799439060';
const CLINIC_B_ID = '507f1f77bcf86cd799439061';

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
 * Test harness with in-memory simulated DoctorSchedule and DoctorClinic storage
 */
const withDoctorScheduleServer = async ({ initialSchedules = [], initialClinics = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalClinicFindOne = DoctorClinic.findOne;
  const originalScheduleFind = DoctorSchedule.find;
  const originalScheduleFindOne = DoctorSchedule.findOne;
  const originalScheduleFindOneAndUpdate = DoctorSchedule.findOneAndUpdate;
  const originalScheduleCreate = DoctorSchedule.create;
  const originalScheduleDeleteOne = DoctorSchedule.deleteOne;

  const clinicsStore = [
    {
      _id: CLINIC_A_ID,
      doctorId: DOCTOR_A_ID,
      clinicName: 'Alpha Clinic',
      city: 'Cairo',
      addressLine: '123 Alpha St',
      isActive: true,
      isPrimary: true
    },
    {
      _id: CLINIC_B_ID,
      doctorId: DOCTOR_B_ID,
      clinicName: 'Beta Clinic',
      city: 'Alexandria',
      addressLine: '456 Beta St',
      isActive: true,
      isPrimary: true
    },
    ...initialClinics
  ];

  const schedulesStore = initialSchedules.map((s, idx) => ({
    _id: s._id || `507f1f77bcf86cd79943907${idx}`,
    doctorId: String(s.doctorId),
    clinicId: s.clinicId ? String(s.clinicId) : null,
    serviceId: null,
    consultationType: s.consultationType || 'CLINIC',
    dayOfWeek: s.dayOfWeek !== undefined ? s.dayOfWeek : 1,
    startTime: s.startTime || '09:00',
    endTime: s.endTime || '12:00',
    slotDurationMinutes: s.slotDurationMinutes || 30,
    isActive: s.isActive !== undefined ? s.isActive : true,
    createdAt: s.createdAt || new Date(),
    updatedAt: s.updatedAt || new Date(),
    populate: async function() { return this; }
  }));

  let idCounter = 80;

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

  DoctorClinic.findOne = (query = {}) => {
    const match = clinicsStore.find(c => {
      if (query._id && String(c._id) !== String(query._id)) return false;
      if (query.doctorId && String(c.doctorId) !== String(query.doctorId)) return false;
      return true;
    });
    return Promise.resolve(match || null);
  };

  DoctorSchedule.find = (filter = {}) => {
    let result = schedulesStore.filter(s => {
      if (filter.doctorId && String(s.doctorId) !== String(filter.doctorId)) return false;
      if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
      if (filter.dayOfWeek !== undefined && s.dayOfWeek !== filter.dayOfWeek) return false;
      if (filter._id && filter._id.$ne && String(s._id) === String(filter._id.$ne)) return false;
      return true;
    });

    return {
      populate: () => ({
        sort: () => Promise.resolve(result),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
      }),
      sort: () => Promise.resolve(result),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };
  };

  DoctorSchedule.findOne = (query = {}) => {
    const match = schedulesStore.find(s => {
      if (query._id && String(s._id) !== String(query._id)) return false;
      if (query.doctorId && String(s.doctorId) !== String(query.doctorId)) return false;
      return true;
    });
    return Promise.resolve(match || null);
  };

  DoctorSchedule.create = async (doc) => {
    const newDoc = {
      _id: `507f1f77bcf86cd7994390${idCounter++}`,
      doctorId: String(doc.doctorId),
      clinicId: doc.clinicId ? String(doc.clinicId) : null,
      serviceId: null,
      consultationType: doc.consultationType || 'CLINIC',
      dayOfWeek: doc.dayOfWeek,
      startTime: doc.startTime,
      endTime: doc.endTime,
      slotDurationMinutes: doc.slotDurationMinutes || 30,
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      populate: async function() { return this; }
    };
    schedulesStore.push(newDoc);
    return newDoc;
  };

  DoctorSchedule.findOneAndUpdate = (query, update, options) => {
    const idx = schedulesStore.findIndex(s => {
      if (query._id && String(s._id) !== String(query._id)) return false;
      if (query.doctorId && String(s.doctorId) !== String(query.doctorId)) return false;
      return true;
    });

    let updatedDoc = null;
    if (idx !== -1) {
      const existing = schedulesStore[idx];
      const setFields = update.$set || update;
      const merged = {
        ...existing,
        ...setFields,
        updatedAt: new Date(),
        populate: async function() { return this; }
      };
      schedulesStore[idx] = merged;
      updatedDoc = merged;
    }

    return {
      populate: () => Promise.resolve(updatedDoc),
      then: (resolve, reject) => Promise.resolve(updatedDoc).then(resolve, reject)
    };
  };

  DoctorSchedule.deleteOne = async (query = {}) => {
    const idx = schedulesStore.findIndex(s => {
      if (query._id && String(s._id) !== String(query._id)) return false;
      if (query.doctorId && String(s.doctorId) !== String(query.doctorId)) return false;
      return true;
    });
    if (idx !== -1) {
      schedulesStore.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, schedulesStore, clinicsStore });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    DoctorClinic.findOne = originalClinicFindOne;
    DoctorSchedule.find = originalScheduleFind;
    DoctorSchedule.findOne = originalScheduleFindOne;
    DoctorSchedule.findOneAndUpdate = originalScheduleFindOneAndUpdate;
    DoctorSchedule.create = originalScheduleCreate;
    DoctorSchedule.deleteOne = originalScheduleDeleteOne;
  }
};

// ==========================================
// TEST SUITE: Doctor Schedule API & Ownership
// ==========================================

test('1. Doctor can list own schedule', async () => {
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { doctorId: DOCTOR_A_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', consultationType: 'CLINIC' },
        { doctorId: DOCTOR_A_ID, dayOfWeek: 3, startTime: '14:00', endTime: '18:00', consultationType: 'ONLINE' },
        { doctorId: DOCTOR_B_ID, dayOfWeek: 1, startTime: '10:00', endTime: '13:00', consultationType: 'CLINIC' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 2);
      assert.equal(data.schedules.every(s => s.doctorId === DOCTOR_A_ID), true);
    }
  );
});

test('2. Doctor can create a schedule entry', async () => {
  await withDoctorScheduleServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '14:00',
        consultationType: 'CLINIC',
        clinicId: CLINIC_A_ID,
        slotDurationMinutes: 30
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.schedule.doctorId, DOCTOR_A_ID);
    assert.equal(data.schedule.dayOfWeek, 2);
    assert.equal(data.schedule.startTime, '10:00');
    assert.equal(data.schedule.endTime, '14:00');
    assert.equal(data.schedule.consultationType, 'CLINIC');
  });
});

test('3. Doctor can update own schedule', async () => {
  const slotId = '507f1f77bcf86cd799439070';
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { _id: slotId, doctorId: DOCTOR_A_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', consultationType: 'CLINIC' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule/${slotId}`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({
          startTime: '09:30',
          endTime: '13:00',
          consultationType: 'ONLINE'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.schedule.startTime, '09:30');
      assert.equal(data.schedule.endTime, '13:00');
      assert.equal(data.schedule.consultationType, 'ONLINE');
    }
  );
});

test('4. Doctor can delete own schedule', async () => {
  const slotId = '507f1f77bcf86cd799439070';
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { _id: slotId, doctorId: DOCTOR_A_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
      ]
    },
    async ({ baseUrl, schedulesStore }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule/${slotId}`, {
        method: 'DELETE',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(schedulesStore.length, 0);
    }
  );
});

test("5. Doctor cannot access or see another Doctor's schedule in list", async () => {
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { doctorId: DOCTOR_B_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.count, 0);
      assert.deepEqual(data.schedules, []);
    }
  );
});

test("6. Doctor cannot modify another Doctor's schedule", async () => {
  const slotId = '507f1f77bcf86cd799439070';
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { _id: slotId, doctorId: DOCTOR_B_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
      ]
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule/${slotId}`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ startTime: '10:00', endTime: '13:00' })
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
    }
  );
});

test("7. Doctor cannot delete another Doctor's schedule", async () => {
  const slotId = '507f1f77bcf86cd799439070';
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { _id: slotId, doctorId: DOCTOR_B_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
      ]
    },
    async ({ baseUrl, schedulesStore }) => {
      const res = await fetch(`${baseUrl}/api/doctors/schedule/${slotId}`, {
        method: 'DELETE',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(schedulesStore.length, 1);
    }
  );
});

test("8. Doctor cannot attach another Doctor's clinic", async () => {
  await withDoctorScheduleServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        consultationType: 'CLINIC',
        clinicId: CLINIC_B_ID // Clinic B belongs to Doctor B!
      })
    });

    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /clinic not found or not authorized/i);
  });
});

test('9. Invalid time range rejected (end <= start or invalid format)', async () => {
  await withDoctorScheduleServer({}, async ({ baseUrl }) => {
    // End before start
    const res1 = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '10:00',
        consultationType: 'CLINIC'
      })
    });
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.equal(data1.success, false);
    assert.match(data1.message, /end time must be after start time/i);

    // End equal to start
    const res2 = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '10:00',
        consultationType: 'CLINIC'
      })
    });
    assert.equal(res2.status, 400);

    // Invalid format
    const res3 = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: '9:00', // missing leading 0
        endTime: '12:00',
        consultationType: 'CLINIC'
      })
    });
    assert.equal(res3.status, 400);
  });
});

test('10. Overlapping availability rejected on same day', async () => {
  await withDoctorScheduleServer(
    {
      initialSchedules: [
        { doctorId: DOCTOR_A_ID, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isActive: true }
      ]
    },
    async ({ baseUrl }) => {
      // Overlapping slot (10:00 - 13:00 overlaps with 09:00 - 12:00)
      const res = await fetch(`${baseUrl}/api/doctors/schedule`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '13:00',
          consultationType: 'CLINIC'
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /overlaps with an existing slot/i);

      // Non-overlapping slot on same day (13:00 - 16:00 is after 12:00) should succeed
      const res2 = await fetch(`${baseUrl}/api/doctors/schedule`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({
          dayOfWeek: 1,
          startTime: '13:00',
          endTime: '16:00',
          consultationType: 'CLINIC'
        })
      });
      assert.equal(res2.status, 201);

      // Overlapping time on a DIFFERENT day should succeed
      const res3 = await fetch(`${baseUrl}/api/doctors/schedule`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({
          dayOfWeek: 2, // Tuesday
          startTime: '09:00',
          endTime: '12:00',
          consultationType: 'CLINIC'
        })
      });
      assert.equal(res3.status, 201);
    }
  );
});

test('11. Non-Doctor cannot use Doctor Schedule endpoints', async () => {
  await withDoctorScheduleServer({}, async ({ baseUrl }) => {
    // WORKER role receives 403
    const resWorker = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER' })
    });
    assert.equal(resWorker.status, 403);

    // EMPLOYER role receives 403
    const resEmployer = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'GET',
      headers: authHeader({ userId: EMPLOYER_ID, role: 'EMPLOYER' })
    });
    assert.equal(resEmployer.status, 403);

    // Unauthenticated receives 401
    const resUnauth = await fetch(`${baseUrl}/api/doctors/schedule`, {
      method: 'GET'
    });
    assert.equal(resUnauth.status, 401);
  });
});
