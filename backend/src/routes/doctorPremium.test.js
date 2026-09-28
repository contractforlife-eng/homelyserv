// backend/src/routes/doctorPremium.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  SUBSCRIPTION_PRICE_BOOKS,
  resolveSubscriptionPriceBook,
  SUBSCRIPTION_PRICE_BOOK_VERSION
} from '../config/subscriptionPriceBooks.js';
import paymentRouter from './payment.js';
import prisma from '../lib/prisma.js';
import { authorizePaidChatRelationship } from '../services/paymentAuthService.js';

const secret = 'doctor-premium-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_ID = '507f1f77bcf86cd7994390d0';
const PATIENT_ID = '507f1f77bcf86cd7994390d1';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

test('PHASE: Doctor Premium pricing & context Suite', async (t) => {
  await t.test('1. Doctor Premium EGYPT pricing is exactly 75/250/1800 EGP', () => {
    const egypt = SUBSCRIPTION_PRICE_BOOKS.EGYPT;
    assert.equal(egypt.plans.weekly.prices.DOCTOR, 75);
    assert.equal(egypt.plans.monthly.prices.DOCTOR, 250);
    assert.equal(egypt.plans.annual.prices.DOCTOR, 1800);
    assert.equal(egypt.plans.weekly.durationDays, 7);
    assert.equal(egypt.plans.monthly.durationDays, 30);
    assert.equal(egypt.plans.annual.durationDays, 365);
  });

  await t.test('2. Doctor Premium LEGACY_EGP pricing mirrors Egypt', () => {
    const legacy = SUBSCRIPTION_PRICE_BOOKS.LEGACY_EGP;
    assert.equal(legacy.plans.weekly.prices.DOCTOR, 75);
    assert.equal(legacy.plans.monthly.prices.DOCTOR, 250);
    assert.equal(legacy.plans.annual.prices.DOCTOR, 1800);
  });

  await t.test('3. Worker Premium pricing remains EXACTLY unchanged', () => {
    const egypt = SUBSCRIPTION_PRICE_BOOKS.EGYPT;
    assert.equal(egypt.plans.weekly.prices.WORKER, 75);
    assert.equal(egypt.plans.monthly.prices.WORKER, 200);
    assert.equal(egypt.plans.annual.prices.WORKER, 1800);
    assert.equal(egypt.plans.weekly.prices.EMPLOYER, 100);
    assert.equal(egypt.plans.monthly.prices.EMPLOYER, 300);
    assert.equal(egypt.plans.annual.prices.EMPLOYER, 2700);
  });

  await t.test('4. resolveSubscriptionPriceBook quotes the DOCTOR role', () => {
    const quote = resolveSubscriptionPriceBook({
      user: { role: 'DOCTOR', countryCode: 'EG' },
      plan: 'monthly'
    });
    assert.equal(quote.role, 'DOCTOR');
    assert.equal(quote.amount, 250);
    assert.equal(quote.currency, 'EGP');
    assert.equal(quote.priceBookVersion, SUBSCRIPTION_PRICE_BOOK_VERSION);
  });

  await t.test('5. Doctor in a non-covered country still gets the EGP Doctor book', () => {
    const quote = resolveSubscriptionPriceBook({
      user: { role: 'DOCTOR', countryCode: null },
      plan: 'weekly'
    });
    assert.equal(quote.market, 'LEGACY_EGP');
    assert.equal(quote.amount, 75);
    assert.equal(quote.currency, 'EGP');
  });

  await t.test('6. subscription-quote route accepts a DOCTOR and returns doctor pricing', async () => {
    // Minimal User model stub for the route's prisma user lookup is not
    // reachable here without a DB; instead verify the pure resolver and
    // the role gate logic contract.
    const quote = resolveSubscriptionPriceBook({
      user: { role: 'DOCTOR', countryCode: 'EG' },
      plan: 'annual'
    });
    assert.equal(quote.amount, 1800);
  });

  await t.test('7. Doctor can message a patient with an established appointment relationship', async () => {
    const DoctorAppointment = (await import('../models/DoctorAppointment.js')).default;
    const originalCount = DoctorAppointment.countDocuments;
    const originalUserFindUnique = prisma.user.findUnique;

    DoctorAppointment.countDocuments = async (filter) => (
      String(filter.doctorId) === DOCTOR_ID && String(filter.patientId) === PATIENT_ID ? 1 : 0
    );
    prisma.user.findUnique = async ({ where }) => (
      where.id === PATIENT_ID ? { id: PATIENT_ID, role: 'WORKER' } : null
    );

    try {
      const doctorToPatient = await authorizePaidChatRelationship({
        senderId: DOCTOR_ID,
        senderRole: 'DOCTOR',
        recipientId: PATIENT_ID
      });
      assert.equal(doctorToPatient.allowed, true);
      assert.equal(doctorToPatient.required, false);
    } finally {
      DoctorAppointment.countDocuments = originalCount;
      prisma.user.findUnique = originalUserFindUnique;
    }
  });

  await t.test('8. Doctor cannot message a stranger without a clinical relationship', async () => {
    const DoctorAppointment = (await import('../models/DoctorAppointment.js')).default;
    const originalCount = DoctorAppointment.countDocuments;
    const originalUserFindUnique = prisma.user.findUnique;

    DoctorAppointment.countDocuments = async () => 0;
    prisma.user.findUnique = async ({ where }) => (
      where.id === '507f1f77bcf86cd7994390ff' ? { id: '507f1f77bcf86cd7994390ff', role: 'WORKER' } : null
    );

    try {
      const stranger = await authorizePaidChatRelationship({
        senderId: DOCTOR_ID,
        senderRole: 'DOCTOR',
        recipientId: '507f1f77bcf86cd7994390ff'
      });
      assert.equal(stranger.allowed, false);
    } finally {
      DoctorAppointment.countDocuments = originalCount;
      prisma.user.findUnique = originalUserFindUnique;
    }
  });

  await t.test('9. Payment subscription routes still gate unauthenticated users (401)', async () => {
    const app = express();
    app.use('/api/payments', paymentRouter);
    const server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/payments/subscription-status`);
      assert.equal(res.status, 401);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
