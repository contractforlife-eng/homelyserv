// backend/src/routes/doctorCenter.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import Prescription from '../models/Prescription.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorClinic from '../models/DoctorClinic.js';
import ClinicPatient from '../models/ClinicPatient.js';
import Message from '../models/Message.js';
import prisma from '../lib/prisma.js';
import doctorsRouter from './doctors.js';

const secret = 'doctor-center-test-secret-2026-extended-length';
process.env.JWT_SECRET = secret;

const FREE_DOCTOR_ID = '507f1f77bcf86cd7994390e0';
const PREMIUM_DOCTOR_ID = '507f1f77bcf86cd7994390e1';

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
  [FREE_DOCTOR_ID]: { _id: FREE_DOCTOR_ID, fullName: 'Free Doctor', role: 'DOCTOR', tokenVersion: 0, isSuspended: false },
  [PREMIUM_DOCTOR_ID]: { _id: PREMIUM_DOCTOR_ID, fullName: 'Premium Doctor', role: 'DOCTOR', tokenVersion: 0, isSuspended: false }
};

User.findById = (id) => wrapQuery(usersMockStore[String(id)] || null);

// Real-data stores
const appointments = [
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e5', status: 'PENDING', consultationType: 'CLINIC', startsAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e5', status: 'CONFIRMED', consultationType: 'HOME_VISIT', startsAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e6', status: 'COMPLETED', consultationType: 'ONLINE', startsAt: new Date() }
];

const countWhere = (list, filter) => list.filter((item) => {
  if (filter.doctorId && String(item.doctorId) !== String(filter.doctorId)) return false;
  if (filter.consultationType && item.consultationType !== filter.consultationType) return false;
  if (filter.status && filter.status.$in) {
    if (!filter.status.$in.includes(item.status)) return false;
  } else if (filter.status && item.status !== filter.status) return false;
  if (filter.startsAt) {
    if (filter.startsAt.$gte && item.startsAt < filter.startsAt.$gte) return false;
    if (filter.startsAt.$lte && item.startsAt > filter.startsAt.$lte) return false;
  }
  return true;
});

DoctorAppointment.countDocuments = async (filter) => countWhere(appointments, filter).length;
// Mimics real MongoDB `distinct`: a clinic-patient appointment (patientId
// null) contributes a literal null value, which the controller must drop.
DoctorAppointment.distinct = async (field, filter) => {
  const set = new Set(countWhere(appointments, filter).map((a) => a.patientId ?? null));
  return [...set];
};
DoctorAppointment.find = (filter) => ({
  select() {
    return {
      sort() {
        return Promise.resolve(countWhere(appointments, { ...filter }).filter((a) => a.startsAt >= (filter.startsAt?.$gte || new Date(0))));
      }
    };
  }
});
DoctorAppointment.findOne = (filter) => ({
  sort() {
    const match = appointments
      .filter((a) => String(a.doctorId) === String(filter.doctorId))
      .sort((a, b) => b.startsAt - a.startsAt)[0] || null;
    return {
      select() { return Promise.resolve(match); },
      then(resolve, reject) { return Promise.resolve(match).then(resolve, reject); }
    };
  }
});

// Consultation records: 2 SIGNED + 1 DRAFT + 1 AMENDED for the premium
// doctor; nothing for anyone else.
const consultationRecords = [
  { doctorId: PREMIUM_DOCTOR_ID, status: 'SIGNED', createdAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, status: 'SIGNED', createdAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, status: 'DRAFT', createdAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, status: 'AMENDED', createdAt: new Date() }
];
DoctorConsultationRecord.countDocuments = async (filter) => consultationRecords.filter((r) => {
  if (String(r.doctorId) !== String(filter.doctorId)) return false;
  if (filter.status && r.status !== filter.status) return false;
  if (filter.createdAt) {
    if (filter.createdAt.$gte && r.createdAt < filter.createdAt.$gte) return false;
    if (filter.createdAt.$lte && r.createdAt > filter.createdAt.$lte) return false;
  }
  return true;
}).length;

// Clinic Patients (doctor-owned records). One is linked to the premium
// doctor's HomelyServ patient e5 — the combined patient count must count
// that entity exactly once.
const clinicPatientsStore = [
  { doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null },
  { doctorId: PREMIUM_DOCTOR_ID, linkedUserId: '507f1f77bcf86cd7994390e5' }
];
ClinicPatient.countDocuments = async (filter) => (
  clinicPatientsStore.filter((p) => String(p.doctorId) === String(filter.doctorId)).length
);
ClinicPatient.distinct = async (field, filter) => [...new Set(
  clinicPatientsStore
    .filter((p) => String(p.doctorId) === String(filter.doctorId) && p[field])
    .map((p) => String(p[field]))
)];

Prescription.countDocuments = async (filter) => (
  String(filter.doctorId) === PREMIUM_DOCTOR_ID && filter.status === 'ISSUED' ? 3 : 0
);
DoctorConsultationService.countDocuments = async (filter) => (
  String(filter.doctorId) === PREMIUM_DOCTOR_ID && filter.isActive === true ? 2 : 0
);
DoctorClinic.countDocuments = async (filter) => (
  String(filter.doctorId) === PREMIUM_DOCTOR_ID && filter.isActive === true ? 1 : 0
);
Message.countDocuments = async (filter) => (
  String(filter.recipientId) === PREMIUM_DOCTOR_ID && filter.isRead === false ? 4 : 0
);

// Premium state: only PREMIUM_DOCTOR_ID has an active entitlement
prisma.subscription = {
  findMany: async ({ where }) => (
    (where.userId?.in || []).includes(PREMIUM_DOCTOR_ID)
      ? [{ userId: PREMIUM_DOCTOR_ID }]
      : []
  ),
  findFirst: async ({ where }) => (
    String(where.userId) === PREMIUM_DOCTOR_ID
      ? { userId: PREMIUM_DOCTOR_ID, plan: 'monthly', status: 'active', endDate: new Date(Date.now() + 86400000) }
      : null
  )
};
prisma.manualPremiumGrant = { findMany: async () => [], findUnique: async () => null };

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

test('PHASE: Doctor Center (dashboard + analytics) Suite', async (t) => {
  await t.test('1. Unauthenticated dashboard summary rejected (401)', async () => {
    const res = await req('/api/doctors/dashboard/summary');
    assert.equal(res.status, 401);
  });

  await t.test('2. Dashboard summary returns real counts only', async () => {
    const res = await req('/api/doctors/dashboard/summary', {
      headers: authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.appointments.total, 3);
    assert.equal(res.body.summary.appointments.pending, 1);
    assert.equal(res.body.summary.appointments.confirmed, 1);
    assert.equal(res.body.summary.appointments.completed, 1);
    assert.equal(res.body.summary.appointments.cancelled, 0);
    assert.equal(res.body.summary.appointments.noShow, 0);
    assert.deepEqual(res.body.summary.appointments.byConsultationType, {
      CLINIC: 1,
      HOME_VISIT: 1,
      ONLINE: 1
    });
    assert.equal(res.body.summary.patients, 2);
    // Dedup: 2 HomelyServ + 2 Clinic Patients - 1 linkedUserId overlap = 3
    assert.deepEqual(res.body.summary.patientBreakdown, {
      homelyServ: 2,
      clinicPatients: 2,
      combined: 3
    });
    assert.equal(res.body.summary.consultations.total, 4);
    assert.equal(res.body.summary.consultations.signed, 2);
    assert.equal(res.body.summary.consultations.drafts, 1);
    assert.equal(res.body.summary.consultations.amended, 1);
    assert.equal(res.body.summary.prescriptionsIssued, 3);
    assert.equal(res.body.summary.activeServices, 2);
    assert.equal(res.body.summary.unreadMessages, 4);
    assert.equal(res.body.summary.dateRange, null);
  });

  await t.test('3. Free doctor cannot access analytics (403 PREMIUM_REQUIRED)', async () => {
    const res = await req('/api/doctors/analytics/performance', {
      headers: authHeader({ userId: FREE_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
  });

  await t.test('4. Premium doctor receives real analytics metrics', async () => {
    const res = await req('/api/doctors/analytics/performance', {
      headers: authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.analytics.metrics.APPOINTMENTS_REQUESTED, 3);
    assert.equal(res.body.analytics.metrics.APPOINTMENTS_CONFIRMED, 1);
    assert.equal(res.body.analytics.metrics.APPOINTMENTS_COMPLETED, 1);
    assert.equal(res.body.analytics.metrics.PATIENTS_SERVED, 1);
    assert.equal(res.body.analytics.metrics.CONSULTATIONS_SIGNED, 2);
    assert.equal(res.body.analytics.metrics.PRESCRIPTIONS_ISSUED, 3);
    assert.equal(res.body.analytics.metrics.SERVICES_ACTIVE, 2);
    assert.ok(Array.isArray(res.body.analytics.dailyActivity));
    assert.equal(res.body.analytics.dailyActivity.length, 30);
    // Every daily bucket must sum to only real appointments (1 confirmed + 1 completed)
    const totalConfirmed = res.body.analytics.dailyActivity.reduce((s, d) => s + d.confirmed, 0);
    const totalCompleted = res.body.analytics.dailyActivity.reduce((s, d) => s + d.completed, 0);
    assert.equal(totalConfirmed, 2); // CONFIRMED(1) + COMPLETED(1, also counted as confirmed)
    assert.equal(totalCompleted, 1);
  });

  await t.test('5. Clinic-patient appointments are never counted as HomelyServ patients', async () => {
    // Simulate a COMPLETED clinic-patient appointment (patientId is null).
    appointments.push({
      doctorId: PREMIUM_DOCTOR_ID,
      patientId: null,
      clinicPatientId: '507f1f77bcf86cd7994390d0',
      status: 'COMPLETED',
      consultationType: 'CLINIC',
      startsAt: new Date()
    });
    try {
      const res = await req('/api/doctors/dashboard/summary', {
        headers: authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' })
      });
      assert.equal(res.status, 200);
      // `distinct` returns a null entry for the clinic-patient appointment;
      // it must never be counted as a patient (matches GET /patients).
      assert.equal(res.body.summary.patients, 2);
      assert.equal(res.body.summary.patientBreakdown.homelyServ, 2);
      // ...but the appointment itself is still part of the total.
      assert.equal(res.body.summary.appointments.total, 4);
      assert.equal(res.body.summary.appointments.completed, 2);
    } finally {
      appointments.pop();
    }
  });

  await t.test('6. Summary date range filters activity (appointments by startsAt, consultations by createdAt)', async () => {
    const headers = authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' });

    const coveringFrom = new Date(Date.now() - 7 * 86400000).toISOString();
    const coveringTo = new Date(Date.now() + 7 * 86400000).toISOString();
    const resIn = await req(
      `/api/doctors/dashboard/summary?from=${encodeURIComponent(coveringFrom)}&to=${encodeURIComponent(coveringTo)}`,
      { headers }
    );
    assert.equal(resIn.status, 200);
    assert.equal(resIn.body.summary.appointments.total, 3);
    assert.equal(resIn.body.summary.appointments.pending, 1);
    assert.equal(resIn.body.summary.consultations.total, 4);
    assert.equal(resIn.body.summary.consultations.signed, 2);
    assert.ok(resIn.body.summary.dateRange);

    const oldFrom = new Date('2000-01-01T00:00:00.000Z').toISOString();
    const oldTo = new Date('2000-01-02T00:00:00.000Z').toISOString();
    const resOut = await req(
      `/api/doctors/dashboard/summary?from=${encodeURIComponent(oldFrom)}&to=${encodeURIComponent(oldTo)}`,
      { headers }
    );
    assert.equal(resOut.status, 200);
    assert.equal(resOut.body.summary.appointments.total, 0);
    assert.equal(resOut.body.summary.consultations.total, 0);
    // Patient/relationship counts stay all-time regardless of the range.
    assert.equal(resOut.body.summary.patientBreakdown.homelyServ, 2);
    assert.equal(resOut.body.summary.patientBreakdown.clinicPatients, 2);
  });

  await t.test('7. Invalid date range rejected (400)', async () => {
    const headers = authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' });

    const bad = await req('/api/doctors/dashboard/summary?from=not-a-date', { headers });
    assert.equal(bad.status, 400);

    const inverted = await req(
      `/api/doctors/dashboard/summary?from=${encodeURIComponent(new Date('2026-06-01').toISOString())}` +
      `&to=${encodeURIComponent(new Date('2026-05-01').toISOString())}`,
      { headers }
    );
    assert.equal(inverted.status, 400);
  });

  await t.test('8. Summary is scoped to the authenticated doctor (another doctor sees zeros)', async () => {
    const res = await req('/api/doctors/dashboard/summary', {
      headers: authHeader({ userId: FREE_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.appointments.total, 0);
    assert.equal(res.body.summary.appointments.pending, 0);
    assert.equal(res.body.summary.appointments.completed, 0);
    assert.deepEqual(res.body.summary.patientBreakdown, {
      homelyServ: 0,
      clinicPatients: 0,
      combined: 0
    });
    assert.equal(res.body.summary.patients, 0);
    assert.equal(res.body.summary.consultations.total, 0);
    assert.equal(res.body.summary.consultations.signed, 0);
    assert.equal(res.body.summary.prescriptionsIssued, 0);
    assert.equal(res.body.summary.unreadMessages, 0);
    assert.equal(res.body.summary.latestAppointment, null);
  });

  await t.test('9. doctorId query parameter is never trusted', async () => {
    const res = await req(`/api/doctors/dashboard/summary?doctorId=${PREMIUM_DOCTOR_ID}`, {
      headers: authHeader({ userId: FREE_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    // Identity comes from the token only — the premium doctor's data stays hidden.
    assert.equal(res.body.summary.appointments.total, 0);
    assert.equal(res.body.summary.patientBreakdown.combined, 0);
    assert.equal(res.body.summary.consultations.signed, 0);
  });
});
