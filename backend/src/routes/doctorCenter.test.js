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
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e5', status: 'PENDING', startsAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e5', status: 'CONFIRMED', startsAt: new Date() },
  { doctorId: PREMIUM_DOCTOR_ID, patientId: '507f1f77bcf86cd7994390e6', status: 'COMPLETED', startsAt: new Date() }
];

const countWhere = (list, filter) => list.filter((item) => {
  if (filter.doctorId && String(item.doctorId) !== String(filter.doctorId)) return false;
  if (filter.status && filter.status.$in) {
    if (!filter.status.$in.includes(item.status)) return false;
  } else if (filter.status && item.status !== filter.status) return false;
  return true;
});

DoctorAppointment.countDocuments = async (filter) => countWhere(appointments, filter).length;
DoctorAppointment.distinct = async (field, filter) => {
  const set = new Set(countWhere(appointments, filter).map((a) => String(a.patientId)));
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

DoctorConsultationRecord.countDocuments = async (filter) => (
  String(filter.doctorId) === PREMIUM_DOCTOR_ID && filter.status === 'SIGNED' ? 2 : 0
);
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
    assert.equal(res.body.summary.appointments.pending, 1);
    assert.equal(res.body.summary.appointments.confirmed, 1);
    assert.equal(res.body.summary.appointments.completed, 1);
    assert.equal(res.body.summary.consultations.signed, 2);
    assert.equal(res.body.summary.prescriptionsIssued, 3);
    assert.equal(res.body.summary.activeServices, 2);
    assert.equal(res.body.summary.unreadMessages, 4);
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
});
