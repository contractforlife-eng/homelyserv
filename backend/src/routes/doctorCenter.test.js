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
// Mimics real MongoDB `distinct(field, filter)`: the requested field is read
// per document, so a clinic-patient appointment (patientId null) contributes a
// literal null to the patientId result — which the controller must drop — and
// contributes its clinicPatientId to the clinicPatientId result.
DoctorAppointment.distinct = async (field, filter) => {
  const set = new Set(countWhere(appointments, filter).map((a) => a[field] ?? null));
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
// that entity exactly once. Both are created long ago, so neither counts as
// "registered today" unless a test adds its own record.
const clinicPatientsStore = [
  { _id: '507f1f77bcf86cd7994390d1', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date('2020-01-01T00:00:00.000Z') },
  { _id: '507f1f77bcf86cd7994390d2', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: '507f1f77bcf86cd7994390e5', createdAt: new Date('2020-01-01T00:00:00.000Z') }
];
ClinicPatient.countDocuments = async (filter) => (
  clinicPatientsStore.filter((p) => String(p.doctorId) === String(filter.doctorId)).length
);
// Honours the `_id: { $in: [...] }` filter the dashboard uses to resolve
// `linkedUserId` for ONLY the clinic patients seen today.
ClinicPatient.distinct = async (field, filter) => [...new Set(
  clinicPatientsStore
    .filter((p) => String(p.doctorId) === String(filter.doctorId) && p[field])
    .filter((p) => {
      if (!filter._id?.$in) return true;
      return filter._id.$in.some((id) => String(id) === String(p._id));
    })
    .map((p) => String(p[field]))
)];
// Supports the dashboard's `ClinicPatient.find({ doctorId, _id: { $in } })`
// and `ClinicPatient.find({ doctorId, createdAt: { $gte, $lte } })` lookups.
ClinicPatient.find = (filter = {}) => {
  const rows = clinicPatientsStore
    .filter((p) => {
      if (filter.doctorId && String(p.doctorId) !== String(filter.doctorId)) return false;
      if (filter._id?.$in && !filter._id.$in.some((id) => String(id) === String(p._id))) return false;
      if (filter.createdAt) {
        const created = p.createdAt ? new Date(p.createdAt) : null;
        if (!created) return false;
        if (filter.createdAt.$gte && created < filter.createdAt.$gte) return false;
        if (filter.createdAt.$lte && created > filter.createdAt.$lte) return false;
      }
      return true;
    })
    .map((p) => ({ _id: p._id, linkedUserId: p.linkedUserId ?? null }));
  return { select: () => Promise.resolve(rows) };
};

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

  // ---- summary.today — Dashboard "work for TODAY" ----
  // The window is the REQUESTED ?from/?to (the Dashboard sends browser-local
  // start/end of day), so the tests drive it explicitly and deterministically.
  const DAY = 24 * 60 * 60 * 1000;
  const todayFrom = new Date(new Date().setHours(0, 0, 0, 0));
  const todayTo = new Date(new Date().setHours(23, 59, 59, 999));
  const todayQuery = `?from=${encodeURIComponent(todayFrom.toISOString())}`
    + `&to=${encodeURIComponent(todayTo.toISOString())}`;
  const todayReq = () => req(`/api/doctors/dashboard/summary${todayQuery}`, {
    headers: authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' })
  });

  await t.test('10. today block: today pending/confirmed counted, yesterday excluded', async () => {
    // The shared fixture uses `new Date()` (today). Add one of each status
    // dated YESTERDAY — neither may appear in the today block.
    appointments.push(
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e7', status: 'PENDING', consultationType: 'CLINIC', startsAt: new Date(Date.now() - DAY) },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e8', status: 'CONFIRMED', consultationType: 'CLINIC', startsAt: new Date(Date.now() - DAY) }
    );
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.ok(res.body.summary.today, 'today block must always be present');
      // Fixture: 1 PENDING + 1 CONFIRMED today. Yesterday's are excluded.
      assert.equal(res.body.summary.today.appointments.pending, 1);
      assert.equal(res.body.summary.today.appointments.confirmed, 1);
    } finally {
      appointments.pop();
      appointments.pop();
    }
  });

  await t.test('11. today uniquePatients: CONFIRMED + COMPLETED count once, bad statuses do not', async () => {
    appointments.push(
      // Same patient as the fixture CONFIRMED one (e5) seen again today → once.
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e5', status: 'COMPLETED', consultationType: 'CLINIC', startsAt: new Date() },
      // A patient whose ONLY today appointment is PENDING → not counted.
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e9', status: 'PENDING', consultationType: 'CLINIC', startsAt: new Date() },
      // CANCELLED and NO_SHOW patients → not counted.
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390ea', status: 'CANCELLED', consultationType: 'CLINIC', startsAt: new Date() },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390eb', status: 'NO_SHOW', consultationType: 'CLINIC', startsAt: new Date() },
      // Yesterday COMPLETED patient → excluded from today.
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390ec', status: 'COMPLETED', consultationType: 'CLINIC', startsAt: new Date(Date.now() - DAY) }
    );
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // Today has exactly 2 distinct HomelyServ patients: e5 (CONFIRMED +
      // COMPLETED → once) and e6 (COMPLETED).
      assert.equal(res.body.summary.today.uniquePatients, 2);
    } finally {
      for (let i = 0; i < 5; i += 1) appointments.pop();
    }
  });

  await t.test('12. today uniquePatients: ClinicPatient appointments are included', async () => {
    // d1 is a doctor-owned clinic patient with no HomelyServ link.
    appointments.push({
      doctorId: PREMIUM_DOCTOR_ID,
      patientId: null,
      clinicPatientId: '507f1f77bcf86cd7994390d1',
      status: 'COMPLETED',
      consultationType: 'CLINIC',
      startsAt: new Date()
    });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // 2 HomelyServ (e5, e6) + 1 clinic patient = 3. A patientId-only query
      // would have returned 2 here.
      assert.equal(res.body.summary.today.uniquePatients, 3);
    } finally {
      appointments.pop();
    }
  });

  await t.test('13. today uniquePatients: HomelyServ + linked ClinicPatient count once', async () => {
    // d2 is linked to e5, who is ALSO seen today as a HomelyServ patient
    // (fixture CONFIRMED). Same real person → exactly one entity.
    appointments.push({
      doctorId: PREMIUM_DOCTOR_ID,
      patientId: null,
      clinicPatientId: '507f1f77bcf86cd7994390d2',
      status: 'COMPLETED',
      consultationType: 'CLINIC',
      startsAt: new Date()
    });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // 2 HomelyServ (e5, e6) + 1 linked clinic patient, minus the 1 overlap = 2.
      assert.equal(res.body.summary.today.uniquePatients, 2);
    } finally {
      appointments.pop();
    }
  });

  await t.test('14. today block does not leak across doctors', async () => {
    const res = await req(`/api/doctors/dashboard/summary${todayQuery}`, {
      headers: authHeader({ userId: FREE_DOCTOR_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.today.appointments.pending, 0);
    assert.equal(res.body.summary.today.appointments.confirmed, 0);
    assert.equal(res.body.summary.today.uniquePatients, 0);
  });

  await t.test('15. all-time fields stay all-time while a today range is requested', async () => {
    // Yesterday-only patients must remain in the all-time fields even though
    // the request carried a today range — this protects Reports and Overview.
    appointments.push(
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390ed', status: 'COMPLETED', consultationType: 'CLINIC', startsAt: new Date(Date.now() - DAY) },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390ee', status: 'CONFIRMED', consultationType: 'CLINIC', startsAt: new Date(Date.now() - DAY) }
    );
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // Today block ignores both yesterday patients.
      assert.equal(res.body.summary.today.uniquePatients, 2);
      // All-time relationship fields still include them (e5, e6, ed, ee).
      assert.equal(res.body.summary.patients, 4);
      assert.deepEqual(res.body.summary.patientBreakdown, {
        homelyServ: 4,
        clinicPatients: 2,
        combined: 5
      });
      // The pre-existing ranged activity field still honours the range: only
      // the three "today" fixture appointments are inside it.
      assert.equal(res.body.summary.appointments.total, 3);
    } finally {
      appointments.pop();
      appointments.pop();
    }
  });

  // ---- "Patients Today" = appointments today (CONFIRMED/COMPLETED)
  //      UNION clinic patients REGISTERED today, globally de-duplicated. ----
  const addClinicPatient = (p) => { clinicPatientsStore.push(p); return p; };
  const dropClinicPatients = (n) => { for (let i = 0; i < n; i += 1) clinicPatientsStore.pop(); };
  // Baseline: the shared fixture has 2 HomelyServ patients seen today (e5
  // CONFIRMED, e6 COMPLETED). The two seeded clinic patients were created in
  // 2020, so they contribute nothing.
  const TODAY_BASELINE = 2;

  await t.test('16. ClinicPatient created today with NO appointment counts once', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d10', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 1);
    } finally {
      dropClinicPatients(1);
    }
  });

  await t.test('17. ClinicPatient created yesterday with NO appointment does not count', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d11', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date(Date.now() - DAY) });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE);
    } finally {
      dropClinicPatients(1);
    }
  });

  await t.test('18. two ClinicPatients created today, both unlinked, count twice', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d12', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d13', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 2);
    } finally {
      dropClinicPatients(2);
    }
  });

  await t.test('19. today ClinicPatient linked to a patient already seen today counts once', async () => {
    // e5 is ALREADY in today's count via the fixture CONFIRMED appointment.
    // This clinic patient is linked to e5 → the same real person.
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d14', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: '507f1f77bcf86cd7994390e5', createdAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE);
    } finally {
      dropClinicPatients(1);
    }
  });

  await t.test('20. today-created ClinicPatient with a PENDING appointment counts once (not twice)', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d15', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    appointments.push({ doctorId: PREMIUM_DOCTOR_ID, patientId: null, clinicPatientId: '507f1f77bcf86cd7994390d15', status: 'PENDING', consultationType: 'CLINIC', startsAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // The PENDING appointment contributes nothing; the registration counts once.
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 1);
    } finally {
      appointments.pop();
      dropClinicPatients(1);
    }
  });

  await t.test('21. today-created ClinicPatient with CANCELLED and NO_SHOW appointments counts once', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d16', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    appointments.push(
      { doctorId: PREMIUM_DOCTOR_ID, patientId: null, clinicPatientId: '507f1f77bcf86cd7994390d16', status: 'CANCELLED', consultationType: 'CLINIC', startsAt: new Date() },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: null, clinicPatientId: '507f1f77bcf86cd7994390d16', status: 'NO_SHOW', consultationType: 'CLINIC', startsAt: new Date() }
    );
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 1);
    } finally {
      appointments.pop();
      appointments.pop();
      dropClinicPatients(1);
    }
  });

  await t.test('22. today-created ClinicPatient seen via a COMPLETED appointment still counts once', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d17', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    appointments.push({ doctorId: PREMIUM_DOCTOR_ID, patientId: null, clinicPatientId: '507f1f77bcf86cd7994390d17', status: 'COMPLETED', consultationType: 'CLINIC', startsAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // Named by BOTH sources but the same record → exactly one.
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 1);
    } finally {
      appointments.pop();
      dropClinicPatients(1);
    }
  });

  await t.test('23. existing patient with only PENDING/CANCELLED/NO_SHOW today is NOT counted', async () => {
    appointments.push(
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e9', status: 'PENDING', consultationType: 'CLINIC', startsAt: new Date() },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390ea', status: 'CANCELLED', consultationType: 'CLINIC', startsAt: new Date() },
      { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390eb', status: 'NO_SHOW', consultationType: 'CLINIC', startsAt: new Date() }
    );
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE);
    } finally {
      for (let i = 0; i < 3; i += 1) appointments.pop();
    }
  });

  await t.test('24. another doctor\'s ClinicPatient created today is not counted', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d18', doctorId: FREE_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      // Ownership is doctorId-scoped, so the free doctor's record is invisible.
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE);
    } finally {
      dropClinicPatients(1);
    }
  });

  await t.test('25. today block is always present and new registrations do not alter all-time fields', async () => {
    addClinicPatient({ _id: '507f1f77bcf86cd7994390d19', doctorId: PREMIUM_DOCTOR_ID, linkedUserId: null, createdAt: new Date() });
    try {
      const res = await todayReq();
      assert.equal(res.status, 200);
      assert.ok(res.body.summary.today, 'today must always be present');
      assert.equal(typeof res.body.summary.today.uniquePatients, 'number');
      assert.equal(res.body.summary.today.uniquePatients, TODAY_BASELINE + 1);
      // All-time patient fields are untouched by a today registration.
      assert.equal(res.body.summary.patients, 2);
      assert.deepEqual(res.body.summary.patientBreakdown, {
        homelyServ: 2,
        clinicPatients: 3,
        combined: 4
      });
      // A no-range request still returns a fully-formed today block.
      const noRange = await req('/api/doctors/dashboard/summary', {
        headers: authHeader({ userId: PREMIUM_DOCTOR_ID, role: 'DOCTOR' })
      });
      assert.equal(noRange.status, 200);
      assert.ok(noRange.body.summary.today.appointments);
      assert.equal(typeof noRange.body.summary.today.uniquePatients, 'number');
    } finally {
      dropClinicPatients(1);
    }
  });
});
