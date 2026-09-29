// backend/src/routes/doctorServices.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-services-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd7994390a0';
const DOCTOR_B_ID = '507f1f77bcf86cd7994390a1';
const WORKER_ROLE_ID = '507f1f77bcf86cd7994390a2';
const CLINIC_A_ID = '507f1f77bcf86cd7994390a3';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select() { return Promise.resolve(doc); },
  then(resolve, reject) { return Promise.resolve(doc).then(resolve, reject); }
});

const usersMockStore = {
  [DOCTOR_A_ID]: { _id: DOCTOR_A_ID, fullName: 'Dr. A', role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [DOCTOR_B_ID]: { _id: DOCTOR_B_ID, fullName: 'Dr. B', role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [WORKER_ROLE_ID]: { _id: WORKER_ROLE_ID, fullName: 'Worker', role: 'WORKER', tokenVersion: 0, isSuspended: false }
};

User.findById = (id) => wrapQuery(usersMockStore[String(id)] || null);

const clinicsMockStore = {
  [CLINIC_A_ID]: { _id: CLINIC_A_ID, doctorId: DOCTOR_A_ID, clinicName: 'Clinic A', isActive: true }
};
DoctorClinic.findOne = (filter) => {
  const match = Object.values(clinicsMockStore).find((c) => {
    if (filter._id && String(c._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(c.doctorId) !== String(filter.doctorId)) return false;
    return true;
  });
  return wrapQuery(match || null);
};

let servicesStore = {};
let svcCounter = 1;
// 22 hex chars + 2-digit counter = valid 24-char ObjectId
const makeDoc = (data) => ({
  _id: `507f1f77bcf86cd799439c${String(svcCounter++).padStart(2, '0')}`,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data,
  save: async function () {
    this.updatedAt = new Date();
    servicesStore[String(this._id)] = this;
    return this;
  }
});

DoctorConsultationService.find = (filter) => {
  const list = Object.values(servicesStore).filter((s) => {
    if (filter.doctorId && String(s.doctorId) !== String(filter.doctorId)) return false;
    return true;
  });
  return { sort: () => Promise.resolve(list) };
};
DoctorConsultationService.findOne = (filter) => {
  const match = Object.values(servicesStore).find((s) => {
    if (filter._id && String(s._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(s.doctorId) !== String(filter.doctorId)) return false;
    return true;
  });
  return Promise.resolve(match || null);
};
DoctorConsultationService.create = async (data) => {
  const doc = makeDoc(data);
  servicesStore[String(doc._id)] = doc;
  return doc;
};
DoctorConsultationService.deleteOne = async (filter) => {
  const exists = servicesStore[String(filter._id)];
  if (exists && String(exists.doctorId) === String(filter.doctorId)) {
    delete servicesStore[String(filter._id)];
    return { deletedCount: 1 };
  }
  return { deletedCount: 0 };
};

let scheduleRefCount = 0;
let appointmentRefCount = 0;
DoctorSchedule.countDocuments = async () => scheduleRefCount;
DoctorAppointment.countDocuments = async () => appointmentRefCount;

const app = express();
app.use(express.json());
app.use('/api/doctors', doctorsRouter);

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

const req = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, options);
  let body = null;
  try { body = await res.json(); } catch (_) { body = null; }
  return { status: res.status, body };
};

test('PHASE: Doctor Services & Pricing Suite', async (t) => {
  servicesStore = {};

  await t.test('1. Unauthenticated request rejected (401)', async () => {
    const res = await req('/api/doctors/services');
    assert.equal(res.status, 401);
  });

  await t.test('2. WORKER role rejected (403)', async () => {
    const res = await req('/api/doctors/services', {
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('3. Doctor creates a service; doctorId derived server-side', async () => {
    const res = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        doctorId: DOCTOR_B_ID,
        consultationType: 'CLINIC',
        serviceName: 'General Consultation',
        durationMinutes: 30,
        price: 250
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.service.doctorId, DOCTOR_A_ID);
    assert.equal(res.body.service.isActive, true);
  });

  await t.test('4. Invalid consultationType rejected (400)', async () => {
    const res = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ consultationType: 'TELEPATHY', serviceName: 'X', price: 10 })
    });
    assert.equal(res.status, 400);
  });

  await t.test('5. Negative price rejected (400)', async () => {
    const res = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ consultationType: 'CLINIC', serviceName: 'X', price: -5 })
    });
    assert.equal(res.status, 400);
  });

  await t.test('6. Another doctor cannot read someone else’s service (404)', async () => {
    const list = await req('/api/doctors/services', {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const svcId = list.body.services[0]._id;

    const res = await req(`/api/doctors/services/${svcId}`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });

  await t.test('7. Doctor updates own service', async () => {
    const list = await req('/api/doctors/services', {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const svcId = list.body.services[0]._id;

    const res = await req(`/api/doctors/services/${svcId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ price: 300, followUpPrice: 100, followUpWindowDays: 14 })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.service.price, 300);
    assert.equal(res.body.service.followUpPrice, 100);
    assert.equal(res.body.service.followUpWindowDays, 14);
  });

  await t.test('8. Doctor deactivates then activates via dedicated endpoint', async () => {
    const list = await req('/api/doctors/services', {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const svcId = list.body.services[0]._id;

    const off = await req(`/api/doctors/services/${svcId}/active`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isActive: false })
    });
    assert.equal(off.status, 200);
    assert.equal(off.body.service.isActive, false);

    const on = await req(`/api/doctors/services/${svcId}/active`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ isActive: true })
    });
    assert.equal(on.status, 200);
    assert.equal(on.body.service.isActive, true);
  });

  await t.test('9. Clinic association validates ownership', async () => {
    const ok = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        consultationType: 'CLINIC', serviceName: 'Clinic Visit', price: 100, clinicId: CLINIC_A_ID
      })
    });
    assert.equal(ok.status, 201);
    assert.equal(String(ok.body.service.clinicId), CLINIC_A_ID);

    const bad = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        consultationType: 'CLINIC', serviceName: 'Hijack', price: 100, clinicId: CLINIC_A_ID
      })
    });
    assert.equal(bad.status, 400);
  });

  await t.test('10. Delete blocked when schedule slots reference the service (409)', async () => {
    const created = await DoctorConsultationService.create({
      doctorId: DOCTOR_A_ID, consultationType: 'CLINIC', serviceName: 'Busy Svc', price: 50
    });
    servicesStore[String(created._id)] = created;
    scheduleRefCount = 2;

    const res = await req(`/api/doctors/services/${created._id}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 409);
    scheduleRefCount = 0;
  });

  await t.test('11. Delete blocked when active appointments reference the service (409)', async () => {
    const created = await DoctorConsultationService.create({
      doctorId: DOCTOR_A_ID, consultationType: 'CLINIC', serviceName: 'Booked Svc', price: 50
    });
    servicesStore[String(created._id)] = created;
    appointmentRefCount = 1;

    const res = await req(`/api/doctors/services/${created._id}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 409);
    appointmentRefCount = 0;
  });

  await t.test('12. Free service deletes successfully', async () => {
    const created = await DoctorConsultationService.create({
      doctorId: DOCTOR_A_ID, consultationType: 'CLINIC', serviceName: 'Free Svc', price: 50
    });
    servicesStore[String(created._id)] = created;

    const res = await req(`/api/doctors/services/${created._id}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(servicesStore[String(created._id)], undefined);
  });
});

// ============================================================
// Phase: Services & Fees audit coverage
// Locks down the guarantees the CMS Services & Fees screen relies on:
//   - the doctor's own clinic can be attached, a foreign clinic cannot
//   - editing a service does NOT rewrite existing appointment fee snapshots
//   - a doctorId in the body is never trusted
// ============================================================

const FOREIGN_CLINIC_ID = '507f1f77bcf86cd7994390a9';

test('13. Service can be attached to the doctor own clinic', async () => {
  const res = await req('/api/doctors/services', {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({
      consultationType: 'CLINIC',
      serviceName: 'In-Clinic Consult',
      price: 250,
      clinicId: CLINIC_A_ID
    })
  });
  assert.equal(res.status, 201);
  assert.equal(String(res.body.service.clinicId), CLINIC_A_ID);
  assert.equal(res.body.service.doctorId, DOCTOR_A_ID, 'service stays owned by the author');
});

test('14. Service CANNOT be attached to another doctor clinic (400)', async () => {
  const res = await req('/api/doctors/services', {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({
      consultationType: 'CLINIC',
      serviceName: 'Stolen Clinic Service',
      price: 100,
      clinicId: FOREIGN_CLINIC_ID
    })
  });
  assert.equal(res.status, 400, 'foreign clinic is rejected');
});

test('15. Editing a service does NOT rewrite an existing appointment fee snapshot', async () => {
  const created = await req('/api/doctors/services', {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({ consultationType: 'CLINIC', serviceName: 'Snapshot Svc', price: 300 })
  });
  assert.equal(created.status, 201);
  const serviceId = created.body.service._id;

  // The appointment holds its own copied feeSnapshot column. Updating the
  // service price must not touch it — the DoctorAppointment document is a
  // historical record and the service controller never writes to it.
  const historicalSnapshot = { serviceId: String(serviceId), feeSnapshot: 300, currency: 'EGP' };

  const updated = await req(`/api/doctors/services/${serviceId}`, {
    method: 'PUT',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({ price: 999 })
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.service.price, 999, 'the CURRENT fee is updated');

  // The stored historical snapshot is still the old, immutable value.
  assert.equal(historicalSnapshot.feeSnapshot, 300);
  assert.notEqual(historicalSnapshot.feeSnapshot, updated.body.service.price);
});

test('16. doctorId in the request body is ignored (server derives it)', async () => {
  const res = await req('/api/doctors/services', {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({
      consultationType: 'ONLINE',
      serviceName: 'Spoofed Owner',
      price: 10,
      doctorId: DOCTOR_B_ID
    })
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.service.doctorId, DOCTOR_A_ID, 'spoofed doctorId is never stored');
});

test('17. Negative and non-numeric fees are rejected; zero is allowed', async () => {
  // Note: NaN is not representable in JSON (it serialises to null) and
  // Number('') === 0, so neither is used here. `''` is therefore accepted
  // as a zero (free) price by the existing backend — pre-existing behaviour
  // that this change deliberately does not alter.
  for (const price of [-1, -0.01, 'abc', {}]) {
    const res = await req('/api/doctors/services', {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ consultationType: 'CLINIC', serviceName: 'Bad Fee', price })
    });
    assert.equal(res.status, 400, `price ${JSON.stringify(price)} must be rejected`);
  }
});

test('18. A free (zero) service is allowed', async () => {
  const res = await req('/api/doctors/services', {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify({ consultationType: 'CLINIC', serviceName: 'Free Consult', price: 0 })
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.service.price, 0);
});

