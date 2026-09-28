// backend/src/routes/doctorAppointments.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-appointments-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439050';
const DOCTOR_B_ID = '507f1f77bcf86cd799439051';
const PATIENT_USER_ID = '507f1f77bcf86cd799439052';
const EMPLOYER_USER_ID = '507f1f77bcf86cd799439053';

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
 * Test harness with in-memory simulated DoctorAppointment storage
 */
const withDoctorAppointmentsServer = async ({ initialAppointments = [], initialClinics = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalClinicFindOne = DoctorClinic.findOne;
  const originalScheduleFindOne = DoctorSchedule.findOne;
  const originalServiceFindOne = DoctorConsultationService.findOne;
  const originalProfileFindOne = DoctorProfile.findOne;
  const originalAppointmentFind = DoctorAppointment.find;
  const originalAppointmentFindOne = DoctorAppointment.findOne;
  const originalAppointmentCreate = DoctorAppointment.create;

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

  const appointmentsStore = initialAppointments.map((a, idx) => ({
    _id: a._id || `507f1f77bcf86cd79943908${idx}`,
    doctorId: String(a.doctorId),
    patientId: a.patientId ? (typeof a.patientId === 'object' ? a.patientId : { _id: String(a.patientId), fullName: 'Patient Test' }) : { _id: PATIENT_USER_ID, fullName: 'Patient Test' },
    scheduleId: a.scheduleId ? String(a.scheduleId) : null,
    clinicId: a.clinicId ? String(a.clinicId) : null,
    serviceId: a.serviceId ? String(a.serviceId) : null,
    consultationType: a.consultationType || 'CLINIC',
    startsAt: a.startsAt instanceof Date ? a.startsAt : new Date(a.startsAt || Date.now() + 86400000),
    endsAt: a.endsAt instanceof Date ? a.endsAt : new Date(a.endsAt || Date.now() + 86400000 + 1800000),
    status: a.status || 'PENDING',
    reason: a.reason || '',
    notes: a.notes || '',
    feeSnapshot: a.feeSnapshot || 0,
    currency: a.currency || 'EGP',
    createdBy: a.createdBy || String(a.doctorId),
    cancellationReason: a.cancellationReason || '',
    cancelledBy: a.cancelledBy || null,
    cancelledAt: a.cancelledAt || null,
    createdAt: a.createdAt || new Date(),
    updatedAt: a.updatedAt || new Date(),
    populate: async function() { return this; },
    save: async function() {
      this.updatedAt = new Date();
      return this;
    }
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
    if (idStr === PATIENT_USER_ID) {
      return wrapQuery(createMockUser({ _id: PATIENT_USER_ID, email: 'patient@homelyserv.test', role: 'WORKER', fullName: 'Patient Worker' }));
    }
    if (idStr === EMPLOYER_USER_ID) {
      return wrapQuery(createMockUser({ _id: EMPLOYER_USER_ID, email: 'employer@homelyserv.test', role: 'EMPLOYER' }));
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

  DoctorSchedule.findOne = (query = {}) => {
    return Promise.resolve({
      _id: query._id,
      doctorId: query.doctorId,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00'
    });
  };

  DoctorConsultationService.findOne = (query = {}) => {
    return Promise.resolve({
      _id: query._id,
      doctorId: query.doctorId,
      serviceName: 'General Consultation',
      price: 300,
      currency: 'EGP',
      durationMinutes: 30
    });
  };

  DoctorProfile.findOne = (query = {}) => {
    return Promise.resolve({
      userId: query.userId,
      consultationFee: 250,
      examinationFee: 350
    });
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
      if (filter.consultationType && a.consultationType !== filter.consultationType) return false;
      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$in) {
          if (!filter.status.$in.includes(a.status)) return false;
        } else if (a.status !== filter.status) {
          return false;
        }
      }
      if (filter.startsAt) {
        if (filter.startsAt.$lt && a.startsAt >= filter.startsAt.$lt) return false;
        if (filter.startsAt.$gte && a.startsAt < filter.startsAt.$gte) return false;
      }
      if (filter.endsAt) {
        if (filter.endsAt.$gt && a.endsAt <= filter.endsAt.$gt) return false;
      }
      return true;
    });

    return createPopulatedQuery(result);
  };

  DoctorAppointment.findOne = (query = {}) => {
    const match = appointmentsStore.find(a => {
      if (query._id && String(a._id) !== String(query._id)) return false;
      if (query.doctorId && String(a.doctorId) !== String(query.doctorId)) return false;
      return true;
    });
    return createPopulatedQuery(match || null);
  };

  DoctorAppointment.create = async (doc) => {
    const newDoc = {
      _id: `507f1f77bcf86cd7994390${idCounter++}`,
      doctorId: String(doc.doctorId),
      patientId: typeof doc.patientId === 'object' ? doc.patientId : { _id: String(doc.patientId), fullName: 'Patient Test' },
      scheduleId: doc.scheduleId ? String(doc.scheduleId) : null,
      clinicId: doc.clinicId ? String(doc.clinicId) : null,
      serviceId: doc.serviceId ? String(doc.serviceId) : null,
      consultationType: doc.consultationType || 'CLINIC',
      startsAt: new Date(doc.startsAt),
      endsAt: new Date(doc.endsAt),
      status: doc.status || 'PENDING',
      reason: doc.reason || '',
      notes: doc.notes || '',
      feeSnapshot: doc.feeSnapshot || 0,
      currency: doc.currency || 'EGP',
      createdBy: String(doc.createdBy || doc.doctorId),
      cancellationReason: '',
      cancelledBy: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      populate: async function() { return this; },
      save: async function() { return this; }
    };
    appointmentsStore.push(newDoc);
    return newDoc;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run({ baseUrl, appointmentsStore, clinicsStore });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    DoctorClinic.findOne = originalClinicFindOne;
    DoctorSchedule.findOne = originalScheduleFindOne;
    DoctorConsultationService.findOne = originalServiceFindOne;
    DoctorProfile.findOne = originalProfileFindOne;
    DoctorAppointment.find = originalAppointmentFind;
    DoctorAppointment.findOne = originalAppointmentFindOne;
    DoctorAppointment.create = originalAppointmentCreate;
  }
};

// ===============================================
// TEST SUITE: Doctor Appointments API & Lifecycle
// ===============================================

test('1. Doctor can list own appointments with tab filtering', async () => {
  const futureDate = new Date(Date.now() + 86400000);
  const futureEnd = new Date(futureDate.getTime() + 1800000);

  await withDoctorAppointmentsServer(
    {
      initialAppointments: [
        { doctorId: DOCTOR_A_ID, status: 'PENDING', startsAt: futureDate, endsAt: futureEnd, consultationType: 'CLINIC' },
        { doctorId: DOCTOR_A_ID, status: 'PENDING', startsAt: futureDate, endsAt: futureEnd, consultationType: 'HOME_VISIT' },
        { doctorId: DOCTOR_B_ID, status: 'PENDING', startsAt: futureDate, endsAt: futureEnd, consultationType: 'CLINIC' }
      ]
    },
    async ({ baseUrl }) => {
      // List all own
      const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 2);

      // Home visits tab filter
      const resHV = await fetch(`${baseUrl}/api/doctors/appointments?tab=home_visits`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      assert.equal(resHV.status, 200);
      const dataHV = await resHV.json();
      assert.equal(dataHV.count, 1);
      assert.equal(dataHV.appointments[0].consultationType, 'HOME_VISIT');
    }
  );
});

test('2. Doctor can create an appointment with snapshot fee and valid patient', async () => {
  const startsAt = new Date(Date.now() + 86400000).toISOString();
  const endsAt = new Date(Date.now() + 86400000 + 1800000).toISOString();

  await withDoctorAppointmentsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        patientId: PATIENT_USER_ID,
        consultationType: 'CLINIC',
        clinicId: CLINIC_A_ID,
        startsAt,
        endsAt,
        reason: 'Regular consultation checkup'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.appointment.doctorId, DOCTOR_A_ID);
    assert.equal(data.appointment.consultationType, 'CLINIC');
    assert.equal(data.appointment.status, 'PENDING');
    assert.equal(data.appointment.feeSnapshot, 250); // derived from doctorProfile
  });
});

test('3. Doctor cannot attach another Doctor clinic to an appointment', async () => {
  const startsAt = new Date(Date.now() + 86400000).toISOString();
  const endsAt = new Date(Date.now() + 86400000 + 1800000).toISOString();

  await withDoctorAppointmentsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        patientId: PATIENT_USER_ID,
        consultationType: 'CLINIC',
        clinicId: CLINIC_B_ID, // Doctor B clinic!
        startsAt,
        endsAt
      })
    });

    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /not found or not owned/i);
  });
});

test('4. Overlapping appointment for the same Doctor is rejected', async () => {
  const startTime = new Date(Date.now() + 86400000);
  const endTime = new Date(startTime.getTime() + 3600000); // 1 hour

  await withDoctorAppointmentsServer(
    {
      initialAppointments: [
        {
          doctorId: DOCTOR_A_ID,
          patientId: PATIENT_USER_ID,
          status: 'CONFIRMED',
          startsAt: startTime,
          endsAt: endTime
        }
      ]
    },
    async ({ baseUrl }) => {
      // Overlapping slot: starts 15 mins into existing appointment
      const overlapStart = new Date(startTime.getTime() + 900000).toISOString();
      const overlapEnd = new Date(startTime.getTime() + 2700000).toISOString();

      const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({
          patientId: PATIENT_USER_ID,
          consultationType: 'CLINIC',
          clinicId: CLINIC_A_ID,
          startsAt: overlapStart,
          endsAt: overlapEnd
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /overlaps with an existing appointment/i);
    }
  );
});

test('5. Doctor can confirm, complete, cancel, or mark no-show on appointment', async () => {
  const aptId = '507f1f77bcf86cd799439080';

  await withDoctorAppointmentsServer(
    {
      initialAppointments: [
        {
          _id: aptId,
          doctorId: DOCTOR_A_ID,
          patientId: PATIENT_USER_ID,
          status: 'PENDING'
        }
      ]
    },
    async ({ baseUrl }) => {
      // PENDING -> CONFIRMED
      const resConfirm = await fetch(`${baseUrl}/api/doctors/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
      assert.equal(resConfirm.status, 200);
      const dataConfirm = await resConfirm.json();
      assert.equal(dataConfirm.appointment.status, 'CONFIRMED');

      // CONFIRMED -> COMPLETED
      const resComplete = await fetch(`${baseUrl}/api/doctors/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      assert.equal(resComplete.status, 200);
      const dataComplete = await resComplete.json();
      assert.equal(dataComplete.appointment.status, 'COMPLETED');

      // Attempt to modify terminal state COMPLETED must fail
      const resTerminal = await fetch(`${baseUrl}/api/doctors/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      assert.equal(resTerminal.status, 400);
      const dataTerminal = await resTerminal.json();
      assert.match(dataTerminal.message, /terminal state/i);
    }
  );
});

test('6. Doctor cannot access or mutate another Doctor appointment', async () => {
  const aptId = '507f1f77bcf86cd799439080';

  await withDoctorAppointmentsServer(
    {
      initialAppointments: [
        {
          _id: aptId,
          doctorId: DOCTOR_B_ID,
          patientId: PATIENT_USER_ID,
          status: 'PENDING'
        }
      ]
    },
    async ({ baseUrl }) => {
      // GET Doctor B appointment as Doctor A
      const resGet = await fetch(`${baseUrl}/api/doctors/appointments/${aptId}`, {
        method: 'GET',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
      });
      assert.equal(resGet.status, 404);

      // PUT status Doctor B appointment as Doctor A
      const resPut = await fetch(`${baseUrl}/api/doctors/appointments/${aptId}/status`, {
        method: 'PUT',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify({ status: 'CONFIRMED' })
      });
      assert.equal(resPut.status, 404);
    }
  );
});

test('7. Non-Doctor cannot access Doctor appointments endpoints', async () => {
  await withDoctorAppointmentsServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'GET',
      headers: authHeader({ userId: EMPLOYER_USER_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 403);
  });
});
