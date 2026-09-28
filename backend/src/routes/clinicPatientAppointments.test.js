// backend/src/routes/clinicPatientAppointments.test.js
// ============================================================
// PHASE 2B — Doctor CMS Appointments for ClinicPatients.
//
// Verifies the ADDITIVE clinicPatientId branch while leaving the
// HomelyServ patientId path untouched (covered by
// doctorAppointments.test.js, which is unchanged and still passes).
// ============================================================
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
import ClinicPatient from '../models/ClinicPatient.js';
import doctorsRouter from './doctors.js';

const secret = 'clinic-patient-appointments-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd7994390a0';
const DOCTOR_B_ID = '507f1f77bcf86cd7994390a1';
const CLINIC_PATIENT_A = '507f1f77bcf86cd7994390b0';
const CLINIC_PATIENT_B = '507f1f77bcf86cd7994390b1';
const CLINIC_A_ID = '507f1f77bcf86cd7994390c0';
const HOMELY_PATIENT = '507f1f77bcf86cd7994390c1';
const LINKED_USER = '507f1f77bcf86cd7994390c2';

const createToken = (p) => jwt.sign(p, secret, { expiresIn: '1h' });
const authHeader = (p) => ({
  authorization: `Bearer ${createToken(p)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select: () => Promise.resolve(doc),
  then: (res, rej) => Promise.resolve(doc).then(res, rej)
});

const mockUser = (o = {}) => ({
  _id: DOCTOR_A_ID, role: 'DOCTOR', tokenVersion: 0, isSuspended: false,
  isVerified: true, ...o
});

/** Harness: in-memory ClinicPatient + DoctorAppointment stores. */
const withServer = async ({ clinicPatients = [], appointments = [] } = {}, run) => {
  const orig = {
    userFindById: User.findById,
    clinicOne: DoctorClinic.findOne,
    schedOne: DoctorSchedule.findOne,
    svcOne: DoctorConsultationService.findOne,
    profOne: DoctorProfile.findOne,
    aptFind: DoctorAppointment.find,
    aptFindOne: DoctorAppointment.findOne,
    aptCreate: DoctorAppointment.create,
    cpOne: ClinicPatient.findOne
  };

  const store = clinicPatients.map((c) => ({
    _id: c._id, doctorId: String(c.doctorId),
    fullName: c.fullName || 'Walk-in Patient',
    phone: c.phone || null, email: c.email || null,
    linkedUserId: c.linkedUserId ?? null,
    isActive: true,
    toObject() { return { ...this }; }
  }));

  const mkApt = (a, i) => ({
    _id: a._id || `507f1f77bcf86cd7994390d${i}`,
    doctorId: String(a.doctorId),
    patientId: a.patientId ? { _id: String(a.patientId), fullName: 'Homely Patient' } : null,
    clinicPatientId: a.clinicPatientId ? String(a.clinicPatientId) : null,
    scheduleId: null,
    clinicId: a.clinicId ? String(a.clinicId) : null,
    serviceId: null,
    consultationType: a.consultationType || 'CLINIC',
    startsAt: new Date(a.startsAt || Date.now() + 86400000),
    endsAt: new Date(a.endsAt || Date.now() + 86400000 + 1800000),
    status: a.status || 'PENDING',
    reason: a.reason || '', notes: a.notes || '',
    feeSnapshot: a.feeSnapshot || 0, currency: 'EGP',
    createdBy: String(a.doctorId),
    cancellationReason: '', cancelledBy: null, cancelledAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    populate: async function () { return this; },
    save: async function () { return this; }
  });
  const apts = appointments.map(mkApt);
  let seq = 0;

  User.findById = (id) => {
    const s = String(id);
    if (s === DOCTOR_A_ID) return wrapQuery(mockUser({ _id: DOCTOR_A_ID }));
    if (s === DOCTOR_B_ID) return wrapQuery(mockUser({ _id: DOCTOR_B_ID, fullName: 'Dr B' }));
    if (s === HOMELY_PATIENT) return wrapQuery(mockUser({ _id: HOMELY_PATIENT, role: 'WORKER' }));
    if (s === LINKED_USER) return wrapQuery(mockUser({ _id: LINKED_USER, role: 'WORKER' }));
    return wrapQuery(null);
  };

  // ClinicPatient ownership is by doctorId ONLY.
  ClinicPatient.findOne = (q = {}) => wrapQuery(
    store.find((c) => String(c._id) === String(q._id) &&
      (!q.doctorId || String(c.doctorId) === String(q.doctorId))) || null
  );

  DoctorClinic.findOne = (q = {}) => Promise.resolve(
    (String(q._id) === CLINIC_A_ID && String(q.doctorId) === DOCTOR_A_ID)
      ? { _id: CLINIC_A_ID, doctorId: DOCTOR_A_ID, clinicName: 'Alpha Clinic', city: 'Cairo', addressLine: '1 St', isActive: true, isPrimary: true }
      : null
  );
  DoctorSchedule.findOne = (q = {}) => Promise.resolve({ _id: q._id, doctorId: q.doctorId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
  DoctorConsultationService.findOne = (q = {}) => Promise.resolve({ _id: q._id, doctorId: q.doctorId, serviceName: 'General', price: 300, currency: 'EGP', durationMinutes: 30 });
  DoctorProfile.findOne = (q = {}) => Promise.resolve({ userId: q.userId, consultationFee: 250 });

  const chain = (res) => {
    const c = { populate: () => c, sort: () => c, then: (r, j) => Promise.resolve(res).then(r, j) };
    return c;
  };

  DoctorAppointment.find = (f = {}) => {
    const res = apts.filter((a) => {
      if (f.doctorId && String(a.doctorId) !== String(f.doctorId)) return false;
      if (f.clinicPatientId && String(a.clinicPatientId) !== String(f.clinicPatientId)) return false;
      if (f.consultationType && a.consultationType !== f.consultationType) return false;
      if (f.status) {
        if (f.status.$in) { if (!f.status.$in.includes(a.status)) return false; }
        else if (a.status !== f.status) return false;
      }
      if (f.startsAt) {
        if (f.startsAt.$lt && a.startsAt >= f.startsAt.$lt) return false;
        if (f.startsAt.$gte && a.startsAt < f.startsAt.$gte) return false;
      }
      if (f.endsAt && f.endsAt.$lt && a.endsAt >= f.endsAt.$lt) return false;
      return true;
    });
    return chain(res);
  };

  DoctorAppointment.findOne = (q = {}) =>
    chain(apts.find((a) => String(a._id) === String(q._id) &&
      (!q.doctorId || String(a.doctorId) === String(q.doctorId))) || null);

  DoctorAppointment.create = async (doc) => {
    // Enforce the model-level XOR rule so invalid states cannot persist.
    if (Boolean(doc.patientId) === Boolean(doc.clinicPatientId)) {
      const e = new Error('An appointment requires exactly one patient source');
      e.name = 'ValidationError';
      throw e;
    }
    const a = mkApt({
      ...doc,
      patientId: doc.patientId || undefined,
      clinicPatientId: doc.clinicPatientId || undefined
    }, 100 + seq);
    a._id = `507f1f77bcf86cd7994390e${seq++}`;
    apts.push(a);
    return a;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run({ baseUrl, apts, store });
  } finally {
    server.close();
    User.findById = orig.userFindById;
    DoctorClinic.findOne = orig.clinicOne;
    DoctorSchedule.findOne = orig.schedOne;
    DoctorConsultationService.findOne = orig.svcOne;
    DoctorProfile.findOne = orig.profOne;
    DoctorAppointment.find = orig.aptFind;
    DoctorAppointment.findOne = orig.aptFindOne;
    DoctorAppointment.create = orig.aptCreate;
    ClinicPatient.findOne = orig.cpOne;
  }
};

const ownSeed = {
  clinicPatients: [{ _id: CLINIC_PATIENT_A, doctorId: DOCTOR_A_ID, fullName: 'Walk-in Patient' }]
};

const futureStart = () => new Date(Date.now() + 5 * 86400000).toISOString();
const futureEnd = () => new Date(Date.now() + 5 * 86400000 + 1800000).toISOString();

const createBody = (extra) => ({
  clinicPatientId: CLINIC_PATIENT_A,
  clinicId: CLINIC_A_ID,
  consultationType: 'CLINIC',
  startsAt: futureStart(),
  endsAt: futureEnd(),
  reason: 'Follow-up',
  ...extra
});


// ============================================
// PHASE 2B: Clinic Patient Appointments
// ============================================

test('1. Doctor creates an appointment for their own ClinicPatient', async () => {
  await withServer(ownSeed, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody())
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(String(data.appointment.clinicPatientId), CLINIC_PATIENT_A);
    // HomelyServ reference must stay null — not polymorphic.
    assert.equal(data.appointment.patientId, null);
    assert.equal(apts.length, 1);
  });
});

test('2. Doctor retrieves the ClinicPatient appointment', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f0' }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments/507f1f77bcf86cd7994390f0`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).appointment.status, 'PENDING');
  });
});

test('3. Doctor lists the ClinicPatient appointment in their workspace', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f1' }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.count, 1);
  });
});

test('4. Doctor confirms and completes the ClinicPatient appointment', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f2', status: 'PENDING' }]
  }, async ({ baseUrl }) => {
    const put = (status) => fetch(`${baseUrl}/api/doctors/appointments/507f1f77bcf86cd7994390f2/status`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ status })
    });

    const confirmed = await put('CONFIRMED');
    assert.equal(confirmed.status, 200);
    assert.equal((await confirmed.json()).appointment.status, 'CONFIRMED');

    const completed = await put('COMPLETED');
    assert.equal(completed.status, 200);
    assert.equal((await completed.json()).appointment.status, 'COMPLETED');
  });
});

test('5. Doctor cancels the ClinicPatient appointment', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f3' }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments/507f1f77bcf86cd7994390f3/status`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ status: 'CANCELLED', cancellationReason: 'Patient rescheduled' })
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).appointment.status, 'CANCELLED');
  });
});


test('6. Another Doctor cannot create for someone else’s ClinicPatient (404)', async () => {
  await withServer({
    clinicPatients: [{ _id: CLINIC_PATIENT_B, doctorId: DOCTOR_B_ID, fullName: 'B Patient' }]
  }, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody({ clinicPatientId: CLINIC_PATIENT_B }))
    });
    assert.equal(res.status, 404);
    assert.equal(apts.length, 0, 'nothing was persisted');
  });
});

test('7. Another Doctor cannot retrieve it (404)', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f4' }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments/507f1f77bcf86cd7994390f4`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });
});

test('8. Another Doctor cannot modify it (404)', async () => {
  await withServer({
    ...ownSeed,
    appointments: [{ doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f5' }]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments/507f1f77bcf86cd7994390f5/status`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ status: 'CANCELLED' })
    });
    assert.equal(res.status, 404);
  });
});

test('9. Missing BOTH patient sources is rejected (400)', async () => {
  await withServer(ownSeed, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ clinicId: CLINIC_A_ID, consultationType: 'CLINIC', startsAt: futureStart(), endsAt: futureEnd() })
    });
    assert.equal(res.status, 400);
    assert.equal(apts.length, 0);
  });
});

test('10. Supplying BOTH patientId and clinicPatientId is rejected (400)', async () => {
  await withServer(ownSeed, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody({ patientId: HOMELY_PATIENT }))
    });
    assert.equal(res.status, 400);
    assert.equal(apts.length, 0, 'ambiguous state never persisted');
  });
});


test('11. Invalid / unknown ClinicPatient ID is rejected safely', async () => {
  await withServer(ownSeed, async ({ baseUrl, apts }) => {
    const bad = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody({ clinicPatientId: 'not-an-object-id' }))
    });
    assert.equal(bad.status, 400);

    const missing = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody({ clinicPatientId: '507f1f77bcf86cd7994390ff' }))
    });
    assert.equal(missing.status, 404);
    assert.equal(apts.length, 0);
  });
});

test('12. linkedUserId does NOT bypass ownership', async () => {
  // Owned by Doctor B but links an account — must still be 404 for Doctor A.
  await withServer({
    clinicPatients: [{ _id: CLINIC_PATIENT_B, doctorId: DOCTOR_B_ID, fullName: 'Linked', linkedUserId: LINKED_USER }]
  }, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(createBody({ clinicPatientId: CLINIC_PATIENT_B }))
    });
    assert.equal(res.status, 404);
    assert.equal(apts.length, 0);
  });
});

test('13. Unauthenticated is 401 and non-Doctor is 403', async () => {
  await withServer(ownSeed, async ({ baseUrl }) => {
    const anon = await fetch(`${baseUrl}/api/doctors/appointments`, { method: 'POST' });
    assert.equal(anon.status, 401);

    const worker = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: LINKED_USER, role: 'WORKER' }),
      body: JSON.stringify(createBody())
    });
    assert.equal(worker.status, 403);
  });
});

test('14. Patient File endpoint returns upcoming/past for own ClinicPatient', async () => {
  const past = new Date(Date.now() - 5 * 86400000).toISOString();
  await withServer({
    ...ownSeed,
    appointments: [
      { doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f6', status: 'CONFIRMED' },
      { doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd7994390f7', status: 'COMPLETED', startsAt: past, endsAt: past }
    ]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${CLINIC_PATIENT_A}/appointments`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.upcoming.length, 1);
    assert.equal(data.past.length, 1);
    assert.equal(data.patient.fullName, 'Walk-in Patient');
  });
});

test('15. Patient File appointments endpoint rejects another Doctor (404)', async () => {
  await withServer(ownSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/clinic-patients/${CLINIC_PATIENT_A}/appointments`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });
});

test('16. HomelyServ patientId path is UNAFFECTED by this change', async () => {
  await withServer(ownSeed, async ({ baseUrl, apts }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        patientId: HOMELY_PATIENT,
        clinicId: CLINIC_A_ID,
        consultationType: 'CLINIC',
        startsAt: futureStart(),
        endsAt: futureEnd()
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.appointment.patientId, 'HomelyServ patientId still set');
    assert.equal(data.appointment.clinicPatientId, null, 'clinicPatientId stays null');
    assert.equal(apts.length, 1);
  });
});


// ============================================
// REGRESSION GUARD (Phase 2B regression)
// ============================================
// REGRESSION: the pre('validate') XOR hook introduced in Phase 2B was
// written with `next(new Error(...))`. Mongoose 9 (this project runs
// 9.8.0) does NOT pass a callable `next` to pre('validate') hooks, so
// EVERY appointment creation died with "next is not a function" and no
// appointment was ever persisted — the Upcoming tab was always empty.
// These tests assert the model can actually be saved, which is what the
// mocked API tests could not detect.

test('R1. Model CAN be persisted with a ClinicPatient (validates against real Mongoose)', async () => {
  // No mocks: exercise the actual schema + validate hook.
  const doc = new DoctorAppointment({
    doctorId: DOCTOR_A_ID,
    clinicPatientId: CLINIC_PATIENT_A,
    consultationType: 'CLINIC',
    startsAt: new Date(Date.now() + 5 * 86400000),
    endsAt: new Date(Date.now() + 5 * 86400000 + 1800000),
    createdBy: DOCTOR_A_ID
  });
  // Must NOT throw "next is not a function" — that was the regression.
  await assert.doesNotReject(() => doc.validate());
});

test('R2. Model CAN be persisted with a HomelyServ patientId', async () => {
  const doc = new DoctorAppointment({
    doctorId: DOCTOR_A_ID,
    patientId: HOMELY_PATIENT,
    consultationType: 'CLINIC',
    startsAt: new Date(Date.now() + 5 * 86400000),
    endsAt: new Date(Date.now() + 5 * 86400000 + 1800000),
    createdBy: DOCTOR_A_ID
  });
  await assert.doesNotReject(() => doc.validate());
});

test('R3. XOR rule still enforced on the real model (neither / both rejected)', async () => {
  const neither = new DoctorAppointment({
    doctorId: DOCTOR_A_ID, consultationType: 'CLINIC',
    startsAt: new Date(), endsAt: new Date(Date.now() + 1800000), createdBy: DOCTOR_A_ID
  });
  await assert.rejects(() => neither.validate(), /requires a patient/i);

  const both = new DoctorAppointment({
    doctorId: DOCTOR_A_ID, patientId: HOMELY_PATIENT, clinicPatientId: CLINIC_PATIENT_A,
    consultationType: 'CLINIC',
    startsAt: new Date(), endsAt: new Date(Date.now() + 1800000), createdBy: DOCTOR_A_ID
  });
  await assert.rejects(() => both.validate(), /exactly one patient/i);
});

test('R4. Upcoming returns BOTH patient sources (ClinicPatient + HomelyServ)', async () => {
  const future = new Date(Date.now() + 3 * 86400000).toISOString();
  const past = new Date(Date.now() - 3 * 86400000).toISOString();
  await withServer({
    ...ownSeed,
    appointments: [
      // future + ClinicPatient
      { doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd799439aa1', status: 'PENDING', startsAt: future, endsAt: future },
      // future + HomelyServ
      { doctorId: DOCTOR_A_ID, patientId: HOMELY_PATIENT, _id: '507f1f77bcf86cd799439aa2', status: 'CONFIRMED', startsAt: future, endsAt: future },
      // past — must NOT appear in Upcoming
      { doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd799439aa3', status: 'PENDING', startsAt: past, endsAt: past },
      // cancelled future — must NOT appear in Upcoming
      { doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, _id: '507f1f77bcf86cd799439aa4', status: 'CANCELLED', startsAt: future, endsAt: future }
    ]
  }, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/doctors/appointments?tab=upcoming`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const ids = (await res.json()).appointments.map((a) => String(a._id));
    assert.equal(ids.length, 2, 'only the two future, non-cancelled appointments');
    assert.ok(ids.includes('507f1f77bcf86cd799439aa1'), 'ClinicPatient upcoming included');
    assert.ok(ids.includes('507f1f77bcf86cd799439aa2'), 'HomelyServ upcoming included');
    assert.ok(!ids.includes('507f1f77bcf86cd799439aa3'), 'past appointment excluded');
    assert.ok(!ids.includes('507f1f77bcf86cd799439aa4'), 'cancelled appointment excluded');
  });
});

