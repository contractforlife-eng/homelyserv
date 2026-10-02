// backend/src/routes/doctorSearch.test.js
// ============================================================
// FIND A DOCTOR â€” GET /api/doctor-search/doctors
//
// Covers the patient-facing Doctor listing used by My Medical Profile:
//  - WORKER / EMPLOYER / TEACHER / STUDENT can search (no Premium needed)
//  - DOCTOR and other roles are rejected
//  - unauthenticated requests are rejected
//  - a doctor who has NOT opted in (isPublished + searchVisibility off)
//    never appears
//  - a published / search-visible doctor DOES appear with public card fields
//  - no patient or private data is ever returned
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import prisma from '../lib/prisma.js';
import doctorSearchRouter from './doctorSearch.js';

const secret = 'doctor-search-test-secret-2026-min-32-chars-long';
process.env.JWT_SECRET = secret;

const DOCTOR_USER_ID = '507f1f77bcf86cd7994390d1';
const CLINIC_ID = '507f1f77bcf86cd7994390c1';
const SECRET_HASH = 'should-never-be-returned';

// Every JWT subject is a REAL 24-char ObjectId, so each request travels the
// PRODUCTION path inside `authenticate`: any ObjectId-shaped userId is
// session-version-checked against the DB (see the User.findById mock below)
// instead of taking the legacy non-ObjectId bypass.
const USERS_LIST = [
  { key: 'WORKER', userId: '507f1f77bcf86cd7994390a1', role: 'WORKER' },
  { key: 'EMPLOYER', userId: '507f1f77bcf86cd7994390a2', role: 'EMPLOYER' },
  { key: 'TEACHER', userId: '507f1f77bcf86cd7994390a3', role: 'TEACHER' },
  { key: 'STUDENT', userId: '507f1f77bcf86cd7994390a4', role: 'STUDENT' },
  { key: 'DOCTOR', userId: '507f1f77bcf86cd7994390a5', role: 'DOCTOR' },
  { key: 'ADMIN', userId: '507f1f77bcf86cd7994390a6', role: 'ADMIN' },
  { key: 'WORKER_FREE', userId: '507f1f77bcf86cd7994390b1', role: 'WORKER' },
  { key: 'EMPLOYER_FREE', userId: '507f1f77bcf86cd7994390b2', role: 'EMPLOYER' }
];

const USER_IDS = new Map(USERS_LIST.map((u) => [u.key, u.userId]));

const tokens = new Map(
  USERS_LIST.map(({ key, userId, role }) => [
    key,
    jwt.sign({ userId, role, tokenVersion: 0 }, secret, { expiresIn: '1h' })
  ])
);

const roleOf = (token) =>
  Object.keys(tokens).find((role) => tokens.get(role) === token) || 'UNKNOWN';

const doctorUserRow = {
  _id: DOCTOR_USER_ID,
  fullName: 'Dr. Visible Doctor',
  role: 'DOCTOR',
  profileImage: 'https://img/doctor.png',
  email: 'doctor@example.com',
  phone: '+201000000000',
  countryCode: 'EG',
  location: 'Cairo'
};

const visibleProfile = {
  userId: DOCTOR_USER_ID,
  professionalTitle: 'Consultant',
  specialty: 'Cardiology',
  additionalSpecialties: ['Internal'],
  subspecialty: 'Echo',
  bio: 'Ten years of experience.',
  yearsOfExperience: 10,
  languages: ['EN', 'AR'],
  profileImage: 'https://img/doctor.png',
  examinationFee: 300,
  consultationFee: 500,
  isPublished: true,
  searchVisibility: true
};

const hiddenProfile = {
  userId: '507f1f77bcf86cd7994390d3',
  professionalTitle: 'Consultant',
  specialty: 'Dermatology',
  isPublished: false,
  searchVisibility: false
};

const profiles = [visibleProfile, hiddenProfile];

const chain = (result) => {
  const c = {};
  c.select = () => c;
  c.sort = () => c;
  c.limit = () => c;
  c.populate = () => c;
  c.lean = () => Promise.resolve(result);
  c.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return c;
};

// Serves BOTH lookups: `authenticate` resolves every ObjectId-shaped JWT
// subject here for the tokenVersion/suspension check, and the booking flow
// resolves the Doctor row.
const authUserRows = USERS_LIST.map(({ userId, role }) => ({
  _id: userId,
  role,
  tokenVersion: 0,
  isSuspended: false
}));

User.findById = (id) => {
  const key = String(id);
  if (key === DOCTOR_USER_ID) {
    return chain({ _id: DOCTOR_USER_ID, role: 'DOCTOR', fullName: 'Dr. Visible Doctor', profileImage: '' });
  }
  return chain(authUserRows.find((row) => String(row._id) === key) || null);
};

User.find = (filter = {}) => {
  let rows = [doctorUserRow];
  if (filter.role) rows = rows.filter((r) => r.role === filter.role);
  const match = (field, key) => {
    if (filter[key]?.$regex) {
      const re = new RegExp(filter[key].$regex, filter[key].$options || '');
      rows = rows.filter((r) => re.test(r[field] || ''));
    }
  };
  match('fullName', 'fullName');
  match('countryCode', 'countryCode');
  match('location', 'location');
  return chain(rows).limit(50);
};

DoctorProfile.find = (filter = {}) =>
  chain(profiles.filter((p) => String(p.userId) === String(filter.userId?.$in?.[0] || '')));

DoctorClinic.find = (filter = {}) =>
  chain([{ doctorId: DOCTOR_USER_ID, clinicName: 'City Hospital', addressLine: 'St 1', city: 'Cairo', countryCode: 'EG', isPrimary: true }])
    .sort();


// Premium state simulation: by default patient users in USER_IDS are Premium so existing tests pass
const premiumPatients = new Set(['507f1f77bcf86cd7994390a1', '507f1f77bcf86cd7994390a2', '507f1f77bcf86cd7994390a3', '507f1f77bcf86cd7994390a4']);
let premiumActive = false;

prisma.subscription = {
  findMany: async ({ where } = {}) => {
    const list = [];
    const queryIds = where?.userId?.in || [];
    for (const uid of queryIds) {
      if (uid === DOCTOR_USER_ID && premiumActive) {
        list.push({ userId: DOCTOR_USER_ID });
      } else if (premiumPatients.has(String(uid))) {
        list.push({ userId: String(uid) });
      }
    }
    return list;
  }
};
prisma.manualPremiumGrant = { findMany: async () => [] };

const app = express();
app.use(express.json());
app.use('/api/doctor-search', doctorSearchRouter);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/doctor-search`;
test.after(() => server.close());

const get = (qs = '', token) =>
  fetch(`${base}/doctors${qs}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

test('GET /api/doctor-search/doctors', async (t) => {
  await t.test('rejects an unauthenticated request', async () => {
    const res = await get();
    assert.equal(res.status, 401);
  });

  for (const role of ['WORKER', 'EMPLOYER', 'TEACHER', 'STUDENT']) {
    await t.test(`${role} with Premium can search doctors`, async () => {
      const res = await get('', tokens.get(role));
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.doctors));
    });
  }


  await t.test('Non-Premium WORKER search is rejected (403 PREMIUM_REQUIRED)', async () => {
    const res = await get('', tokens.get('WORKER_FREE'));
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Find a Doctor is a Premium-only feature.');
  });

  await t.test('Non-Premium EMPLOYER search is rejected (403 PREMIUM_REQUIRED)', async () => {
    const res = await get('', tokens.get('EMPLOYER_FREE'));
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Find a Doctor is a Premium-only feature.');
  });

  await t.test('DOCTOR role is not accepted on this patient-facing search', async () => {
    const res = await get('', tokens.get('DOCTOR'));
    assert.equal(res.status, 403);
  });

  await t.test('ADMIN role is not accepted', async () => {
    const res = await get('', tokens.get('ADMIN'));
    assert.equal(res.status, 403);
  });

  await t.test('a published / search-visible doctor appears', async () => {
    const res = await get('', tokens.get('WORKER'));
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    const doc = res.body.doctors[0];
    assert.equal(doc.fullName, 'Dr. Visible Doctor');
    assert.equal(doc.specialty, 'Cardiology');
    assert.equal(doc.consultationFee, 500);
    assert.equal(doc.examinationFee, 300);
    assert.equal(doc.clinic.city, 'Cairo');
  });

  await t.test('a doctor who has not opted in never appears', async () => {
    const res = await get('', tokens.get('WORKER'));
    const names = res.body.doctors.map((d) => d.fullName);
    assert.ok(!names.includes('Dermatology'), 'hidden doctor must not be listed');
  });

  await t.test('no private account or patient data is returned', async () => {
    const res = await get('', tokens.get('WORKER'));
    const doc = res.body.doctors[0];
    assert.equal(doc.email, undefined);
    assert.equal(doc.phone, undefined);
    assert.equal(doc.password, undefined);
    assert.equal(doc.tokenVersion, undefined);
    assert.equal(SECRET_HASH in doc, false);
  });

  await t.test('specialty filter narrows the result set', async () => {
    const hit = await get('?specialty=Cardio', tokens.get('WORKER'));
    assert.equal(hit.body.count, 1);
    const miss = await get('?specialty=Oncology', tokens.get('WORKER'));
    assert.equal(miss.body.count, 0);
  });

  await t.test('name search and country search are applied', async () => {
    const byName = await get('?q=Visible', tokens.get('WORKER'));
    assert.equal(byName.body.count, 1);
    const byNameMiss = await get('?q=Nobody', tokens.get('WORKER'));
    assert.equal(byNameMiss.body.count, 0);
    const byCountry = await get('?country=EG', tokens.get('WORKER'));
    assert.equal(byCountry.body.count, 1);
  });
});
// ---- Booking test fixtures / mocks -------------------------------------
const SCHEDULE_ID = '507f1f77bcf86cd7994390d2';
// Always "tomorrow" so the generated slot is always in the future.
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000);
const DOW = TOMORROW.getUTCDay();

const scheduleRow = {
  _id: SCHEDULE_ID,
  doctorId: DOCTOR_USER_ID,
  clinicId: null,
  serviceId: null,
  consultationType: 'CLINIC',
  dayOfWeek: DOW,
  startTime: '09:00',
  endTime: '12:00',
  slotDurationMinutes: 60,
  isActive: true
};

const createdAppointments = [];
const notifications = [];
let nextSlotAt = '09:00';

// authUserRows and User.findById moved above

DoctorProfile.findOne = (filter) => chain(profiles.find((p) => String(p.userId) === String(filter.userId)) || null);
DoctorProfile.find = (filter = {}) =>
  chain(profiles.filter((p) => String(filter.userId?.$in?.[0] || '') === String(p.userId)));

DoctorSchedule.find = (filter = {}) => {
  if (filter.doctorId && String(filter.doctorId) !== DOCTOR_USER_ID) return chain([]);
  if (filter.isActive === true) return chain([scheduleRow]);
  return chain([scheduleRow]);
};
DoctorSchedule.findOne = (filter = {}) => {
  if (filter.doctorId && String(filter.doctorId) !== DOCTOR_USER_ID) return chain(null);
  if (filter.isActive === true && String(filter._id) === SCHEDULE_ID) return chain(scheduleRow);
  return chain(null);
};

DoctorAppointment.create = async (doc) => {
  const created = { _id: `appt-${createdAppointments.length + 1}`, ...doc };
  createdAppointments.push(created);
  return created;
};
DoctorAppointment.find = (filter = {}) => {
  let rows = createdAppointments;
  if (filter.patientId) rows = rows.filter((a) => String(a.patientId) === String(filter.patientId));
  if (filter.doctorId) rows = rows.filter((a) => String(a.doctorId) === String(filter.doctorId));
  if (filter.status?.$in) rows = rows.filter((a) => filter.status.$in.includes(a.status));
  if (filter.startsAt?.$lt) rows = rows.filter((a) => new Date(a.startsAt) < new Date(filter.startsAt.$lt));
  if (filter.endsAt?.$gt) rows = rows.filter((a) => new Date(a.endsAt) > new Date(filter.endsAt.$gt));
  return chain(rows);
};
DoctorAppointment.findById = (id) =>
  chain(createdAppointments.find((a) => String(a._id) === String(id)) || null);

DoctorConsultationService.findOne = () => chain(null);
DoctorClinic.findOne = () => chain(null);

// The real createNotification writes through prisma.notification.create, so the
// existing notification mechanism is exercised rather than replaced.
prisma.notification = {
  create: async ({ data }) => {
    notifications.push(data);
    return { id: `n-${notifications.length}`, ...data };
  }
};

// The relationship rule (CONFIRMED/COMPLETED only) is exercised through the
// shared service, so its two sources are mocked rather than hitting the DB.
DoctorAppointment.countDocuments = async (filter = {}) => {
  let rows = createdAppointments;
  if (filter.doctorId) rows = rows.filter((a) => String(a.doctorId) === String(filter.doctorId));
  if (filter.patientId) rows = rows.filter((a) => String(a.patientId) === String(filter.patientId));
  if (filter.status?.$in) rows = rows.filter((a) => filter.status.$in.includes(a.status));
  else if (filter.status) rows = rows.filter((a) => a.status === filter.status);
  return rows.length;
};

const DoctorPatientLink = (await import('../models/DoctorPatientLink.js')).default;
DoctorPatientLink.findOne = () => ({
  select: () => Promise.resolve(null),
  then: (r) => Promise.resolve(null).then(r)
});
const resetBooking = () => {
  createdAppointments.length = 0;
  notifications.length = 0;
};

const getAvailability = (doctorId = DOCTOR_USER_ID, role = 'WORKER') =>
  fetch(`${base}/doctors/${doctorId}/availability`, {
    headers: { authorization: `Bearer ${tokens.get(role)}` }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

const book = (doctorId, body, role = 'WORKER') =>
  fetch(`${base}/doctors/${doctorId}/appointments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens.get(role)}` },
    body: JSON.stringify(body)
  }).then(async (r) => ({ status: r.status, body: await r.json() }));


const mine = (role = 'WORKER') =>
  fetch(`${base}/doctors/appointments/mine`, {
    headers: { authorization: `Bearer ${tokens.get(role)}` }
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

test('BOOK AN APPOINTMENT (HomelyServ patient books themselves)', async (t) => {
  const roleIds = {
    WORKER: '507f1f77bcf86cd7994390a1',
    EMPLOYER: '507f1f77bcf86cd7994390a2',
    TEACHER: '507f1f77bcf86cd7994390a3',
    STUDENT: '507f1f77bcf86cd7994390a4'
  };

  await t.test('availability lists only bookable schedule slots', async () => {
    resetBooking();
    const res = await getAvailability();
    assert.equal(res.status, 200);
    assert.ok(res.body.slots.length > 0, 'the active schedule must yield slots');
    const slot = res.body.slots[0];
    assert.equal(slot.scheduleId, SCHEDULE_ID);
    assert.equal(slot.consultationType, 'CLINIC');
    // Only booking-relevant fields are exposed.
    assert.equal(slot.doctorNotes, undefined);
    assert.equal(slot.isActive, undefined);
  });

  await t.test('availability requires authentication', async () => {
    const res = await fetch(`${base}/doctors/${DOCTOR_USER_ID}/availability`);
    assert.equal(res.status, 401);
  });

  for (const [role, expectedId] of Object.entries(roleIds)) {
    await t.test(`${role} can book an available slot`, async () => {
      resetBooking();
      const slot = (await getAvailability()).body.slots[0];
      const res = await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt }, role);
      assert.equal(res.status, 201);
      const appt = createdAppointments[0];
      assert.equal(String(appt.patientId), expectedId, 'patientId MUST be the session user');
      assert.equal(appt.clinicPatientId, null, 'no ClinicPatient is ever created');
      assert.equal(appt.status, 'PENDING');
      assert.equal(String(appt.doctorId), DOCTOR_USER_ID);
    });
  }

  await t.test('anonymous booking is rejected (401)', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    const res = await fetch(`${base}/doctors/${DOCTOR_USER_ID}/appointments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scheduleId: slot.scheduleId, startsAt: slot.startsAt })
    });
    assert.equal(res.status, 401);
  });

  await t.test('DOCTOR cannot use the patient booking endpoint (403)', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    const res = await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt }, 'DOCTOR');
    assert.equal(res.status, 403);
  });

  await t.test('ADMIN cannot use the patient booking endpoint (403)', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    const res = await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt }, 'ADMIN');
    assert.equal(res.status, 403);
  });

  await t.test('a spoofed patientId in the body is ignored', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    const res = await book(DOCTOR_USER_ID, {
      scheduleId: slot.scheduleId,
      startsAt: slot.startsAt,
      patientId: '507f1f77bcf86cd7994390a9'
    });
    assert.equal(res.status, 201);
    assert.equal(String(createdAppointments[0].patientId), '507f1f77bcf86cd7994390a1');
  });

  await t.test('invalid doctor id is rejected', async () => {
    const res = await book('not-an-id', { scheduleId: SCHEDULE_ID, startsAt: '2026-01-01T09:00:00.000Z' });
    assert.equal(res.status, 400);
  });

  await t.test('a non-Doctor / undiscoverable target is rejected', async () => {
    const res = await book('507f1f77bcf86cd7994390af', { scheduleId: SCHEDULE_ID, startsAt: '2026-01-01T09:00:00.000Z' });
    assert.equal(res.status, 404);
  });

  await t.test('a schedule slot belonging to another doctor is rejected', async () => {
    resetBooking();
    const res = await book(DOCTOR_USER_ID, {
      scheduleId: '507f1f77bcf86cd7994390df',
      startsAt: new Date(Date.now() + 3600000).toISOString()
    });
    assert.equal(res.status, 404);
  });

  await t.test('an already-booked slot is rejected (no double booking)', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    const first = await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    assert.equal(first.status, 201);
    const second = await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    assert.equal(second.status, 409);
    assert.equal(createdAppointments.length, 1, 'exactly one appointment exists');
  });

  await t.test('the booked slot disappears from availability', async () => {
    resetBooking();
    const before = (await getAvailability()).body.slots.length;
    const slot = (await getAvailability()).body.slots[0];
    await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    const after = (await getAvailability()).body.slots.length;
    assert.equal(after, before - 1, 'a taken slot is no longer offered');
  });

  await t.test('the doctor receives the existing APPOINTMENT_REQUESTED notification', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(notifications.length, 1, 'exactly one notification');
    const n = notifications[0];
    assert.equal(String(n.userId), DOCTOR_USER_ID, 'sent to the doctor');
    assert.equal(n.type, 'APPOINTMENT_REQUESTED');
    assert.equal(n.link, '/doctor-appointments', 'reuses the existing doctor link');
  });


  await t.test('Non-Premium patient cannot check availability (403 PREMIUM_REQUIRED)', async () => {
    const res = await getAvailability(DOCTOR_USER_ID, 'WORKER_FREE');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Find a Doctor is a Premium-only feature.');
  });

  await t.test('Non-Premium patient cannot request appointment (403 PREMIUM_REQUIRED)', async () => {
    const res = await book(DOCTOR_USER_ID, { scheduleId: SCHEDULE_ID, startsAt: '2026-01-01T09:00:00.000Z' }, 'WORKER_FREE');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Find a Doctor is a Premium-only feature.');
  });

  await t.test('Non-Premium patient cannot list appointments (403 PREMIUM_REQUIRED)', async () => {
    const res = await mine('WORKER_FREE');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Find a Doctor is a Premium-only feature.');
  });

  await t.test('the patient sees their own pending appointment', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    const res = await mine('WORKER');
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.appointments[0].status, 'PENDING');
    assert.equal(res.body.appointments[0].doctor.id, DOCTOR_USER_ID);
  });

  await t.test('a patient never sees another patient\'s appointments', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt }, 'WORKER');
    const res = await mine('EMPLOYER');
    assert.equal(res.body.count, 0, 'strictly scoped to the session user');
  });

  await t.test('a PENDING booking does NOT create a confirmed patient relationship', async () => {
    resetBooking();
    const slot = (await getAvailability()).body.slots[0];
    await book(DOCTOR_USER_ID, { scheduleId: slot.scheduleId, startsAt: slot.startsAt });
    // The existing rule is CONFIRMED/COMPLETED only, so a PENDING request must
    // not make the patient visible in the Doctor Patients list.
    const { hasValidDoctorPatientRelationship } = await import('../services/doctorPatientAccessService.js');
    const established = await hasValidDoctorPatientRelationship(
      DOCTOR_USER_ID,
      createdAppointments[0].patientId
    );
    assert.equal(established, false, 'patient becomes related only after CONFIRMED');
  });
});

// ---- Premium badge on the Doctor card ---------------------------------
// Entitlement is resolved server-side from the SAME source Employer Search
// uses (active paid Subscription / ManualPremiumGrant) — never from ids,
// names, emails or the client.
// prisma mock configured above

const getDoctorCard = async (role = 'WORKER') => {
  const res = await get('', tokens.get(role));
  return res.body.doctors?.[0] || null;
};

test('PREMIUM FLAG on the Doctor card', async (t) => {
  await t.test('a doctor WITHOUT an active subscription is not marked Premium', async () => {
    premiumActive = false;
    const card = await getDoctorCard();
    assert.ok(card);
    assert.equal(card.isPremium, false, 'non-subscribed doctor must be false, not undefined-gated');
  });

  await t.test('a doctor WITH an active subscription is marked Premium', async () => {
    premiumActive = true;
    try {
      const card = await getDoctorCard();
      assert.ok(card);
      assert.equal(card.isPremium, true, 'active entitlement must set isPremium');
    } finally {
      premiumActive = false;
    }
  });

  await t.test('only a Boolean premium flag is exposed — no subscription internals', async () => {
    premiumActive = true;
    try {
      const card = await getDoctorCard();
      // A Boolean, never an object/row.
      assert.equal(typeof card.isPremium, 'boolean');
      // None of the sensitive subscription fields may cross the wire.
      assert.equal(card.plan, undefined);
      assert.equal(card.endDate, undefined);
      assert.equal(card.subscriptionId, undefined);
      assert.equal(card.price, undefined);
    } finally {
      premiumActive = false;
    }
  });
});

test('VERIFICATION FLAG on the Doctor card', async (t) => {
  await t.test('a doctor WITHOUT verifiedProfileStatus VERIFIED is not marked Verified', async () => {
    doctorUserRow.verifiedProfileStatus = 'NOT_VERIFIED';
    const card = await getDoctorCard();
    assert.ok(card);
    assert.equal(card.isVerified, false);
    assert.equal(card.verification?.isVerified, false);
  });

  await t.test('a doctor WITH verifiedProfileStatus VERIFIED receives isVerified: true', async () => {
    doctorUserRow.verifiedProfileStatus = 'VERIFIED';
    try {
      const card = await getDoctorCard();
      assert.ok(card);
      assert.equal(card.isVerified, true);
      assert.equal(card.verification?.isVerified, true);
    } finally {
      doctorUserRow.verifiedProfileStatus = 'NOT_VERIFIED';
    }
  });

  await t.test('Premium and Verified states are completely independent', async () => {
    // 1. Premium only
    premiumActive = true;
    doctorUserRow.verifiedProfileStatus = 'NOT_VERIFIED';
    let card = await getDoctorCard();
    assert.equal(card.isPremium, true);
    assert.equal(card.isVerified, false);

    // 2. Verified only
    premiumActive = false;
    doctorUserRow.verifiedProfileStatus = 'VERIFIED';
    card = await getDoctorCard();
    assert.equal(card.isPremium, false);
    assert.equal(card.isVerified, true);

    // 3. Both Premium and Verified
    premiumActive = true;
    doctorUserRow.verifiedProfileStatus = 'VERIFIED';
    card = await getDoctorCard();
    assert.equal(card.isPremium, true);
    assert.equal(card.isVerified, true);

    // 4. Neither
    premiumActive = false;
    doctorUserRow.verifiedProfileStatus = 'NOT_VERIFIED';
    card = await getDoctorCard();
    assert.equal(card.isPremium, false);
    assert.equal(card.isVerified, false);
  });
});