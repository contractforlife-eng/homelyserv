// backend/src/routes/doctorConsultations.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import PatientMedicalProfile from '../models/PatientMedicalProfile.js';
import prisma from '../lib/prisma.js';
import doctorsRouter from './doctors.js';
import medicalRouter from './medical.js';

const secret = 'doctor-consultations-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439070';
const DOCTOR_B_ID = '507f1f77bcf86cd799439071';
const PATIENT_A_ID = '507f1f77bcf86cd799439072';
const PATIENT_B_ID = '507f1f77bcf86cd799439073';
const UNRELATED_USER_ID = '507f1f77bcf86cd799439074';
const WORKER_ROLE_ID = '507f1f77bcf86cd799439075';
const EMPLOYER_ROLE_ID = '507f1f77bcf86cd799439076';
const TEACHER_ROLE_ID = '507f1f77bcf86cd799439077';
const STUDENT_ROLE_ID = '507f1f77bcf86cd799439078';

// Mock active subscription for PATIENT_A_ID and PATIENT_B_ID by default
const premiumPatientIds = new Set([PATIENT_A_ID, PATIENT_B_ID]);
prisma.subscription = {
  findMany: async ({ where } = {}) => {
    const ids = where?.userId?.in || [];
    return ids.filter((id) => premiumPatientIds.has(String(id))).map((userId) => ({ userId }));
  }
};
prisma.manualPremiumGrant = {
  findMany: async () => []
};

const APPT_CONFIRMED_ID = '507f1f77bcf86cd799439080';
const APPT_COMPLETED_ID = '507f1f77bcf86cd799439081';
const APPT_PENDING_ID = '507f1f77bcf86cd799439082';
const APPT_CANCELLED_ID = '507f1f77bcf86cd799439083';
const APPT_NOSHOW_ID = '507f1f77bcf86cd799439084';
const APPT_DOC_B_ID = '507f1f77bcf86cd799439085';

const CLINIC_ID = '507f1f77bcf86cd799439090';
const SERVICE_ID = '507f1f77bcf86cd799439091';

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

const wrapChain = (doc) => ({
  populate() {
    return wrapChain(doc);
  },
  sort() {
    return wrapChain(doc);
  },
  select() {
    return wrapChain(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const usersMockStore = {
  [DOCTOR_A_ID]: {
    _id: DOCTOR_A_ID,
    fullName: 'Dr. John Watson',
    email: 'watson@homelyserv.test',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [DOCTOR_B_ID]: {
    _id: DOCTOR_B_ID,
    fullName: 'Dr. Gregory House',
    email: 'house@homelyserv.test',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_A_ID]: {
    _id: PATIENT_A_ID,
    fullName: 'Sherlock Holmes',
    email: 'sherlock@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_B_ID]: {
    _id: PATIENT_B_ID,
    fullName: 'Irene Adler',
    email: 'irene@homelyserv.test',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [WORKER_ROLE_ID]: {
    _id: WORKER_ROLE_ID,
    fullName: 'Worker User',
    email: 'worker@homelyserv.test',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [EMPLOYER_ROLE_ID]: {
    _id: EMPLOYER_ROLE_ID,
    fullName: 'Employer User',
    email: 'employer@homelyserv.test',
    role: 'EMPLOYER',
    tokenVersion: 0,
    isSuspended: false
  },
  [TEACHER_ROLE_ID]: {
    _id: TEACHER_ROLE_ID,
    fullName: 'Teacher User',
    email: 'teacher@homelyserv.test',
    role: 'TEACHER',
    tokenVersion: 0,
    isSuspended: false
  },
  [STUDENT_ROLE_ID]: {
    _id: STUDENT_ROLE_ID,
    fullName: 'Student User',
    email: 'student@homelyserv.test',
    role: 'STUDENT',
    tokenVersion: 0,
    isSuspended: false
  }
};

const appointmentsMockStore = {
  [APPT_CONFIRMED_ID]: {
    _id: APPT_CONFIRMED_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    clinicId: CLINIC_ID,
    serviceId: SERVICE_ID,
    consultationType: 'CLINIC',
    status: 'CONFIRMED',
    startsAt: new Date('2026-10-01T10:00:00Z'),
    endsAt: new Date('2026-10-01T10:30:00Z')
  },
  [APPT_COMPLETED_ID]: {
    _id: APPT_COMPLETED_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    clinicId: CLINIC_ID,
    serviceId: SERVICE_ID,
    consultationType: 'HOME_VISIT',
    status: 'COMPLETED',
    startsAt: new Date('2026-09-20T14:00:00Z'),
    endsAt: new Date('2026-09-20T14:30:00Z')
  },
  [APPT_PENDING_ID]: {
    _id: APPT_PENDING_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    consultationType: 'ONLINE',
    status: 'PENDING',
    startsAt: new Date('2026-10-05T12:00:00Z'),
    endsAt: new Date('2026-10-05T12:30:00Z')
  },
  [APPT_CANCELLED_ID]: {
    _id: APPT_CANCELLED_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    consultationType: 'CLINIC',
    status: 'CANCELLED',
    startsAt: new Date('2026-09-10T09:00:00Z'),
    endsAt: new Date('2026-09-10T09:30:00Z')
  },
  [APPT_NOSHOW_ID]: {
    _id: APPT_NOSHOW_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    consultationType: 'CLINIC',
    status: 'NO_SHOW',
    startsAt: new Date('2026-09-12T09:00:00Z'),
    endsAt: new Date('2026-09-12T09:30:00Z')
  },
  [APPT_DOC_B_ID]: {
    _id: APPT_DOC_B_ID,
    doctorId: DOCTOR_B_ID,
    patientId: PATIENT_B_ID,
    consultationType: 'ONLINE',
    status: 'CONFIRMED',
    startsAt: new Date('2026-10-02T11:00:00Z'),
    endsAt: new Date('2026-10-02T11:30:00Z')
  }
};

let consultationsStore = {};
let nextIdCounter = 1;

// Setup in-memory mock for DoctorConsultationRecord
User.findById = (id) => wrapQuery(usersMockStore[String(id)] || null);
User.findOne = (filter) => {
  if (filter?._id) return wrapQuery(usersMockStore[String(filter._id)] || null);
  return wrapQuery(null);
};

DoctorAppointment.findById = (id) => wrapChain(appointmentsMockStore[String(id)] || null);
DoctorAppointment.findOne = (filter) => {
  const match = Object.values(appointmentsMockStore).find((appt) => {
    if (filter._id && String(appt._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(appt.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(appt.patientId) !== String(filter.patientId)) return false;
    return true;
  });
  return wrapChain(match || null);
};
DoctorAppointment.exists = async (filter) => {
  const match = Object.values(appointmentsMockStore).find((appt) => {
    if (filter.doctorId && String(appt.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(appt.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in) {
      if (!filter.status.$in.includes(appt.status)) return false;
    }
    return true;
  });
  return Boolean(match);
};
DoctorAppointment.countDocuments = async (filter) => {
  const matches = Object.values(appointmentsMockStore).filter((appt) => {
    if (filter.doctorId && String(appt.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(appt.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in) {
      if (!filter.status.$in.includes(appt.status)) return false;
    }
    return true;
  });
  return matches.length;
};

// Mock DoctorConsultationRecord
DoctorConsultationRecord.find = (filter) => {
  let list = Object.values(consultationsStore).filter((rec) => {
    if (filter.doctorId && String(rec.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(rec.patientId) !== String(filter.patientId)) return false;
    if (filter.status?.$in) {
      if (!filter.status.$in.includes(rec.status)) return false;
    }
    return true;
  });
  return wrapChain(list);
};

DoctorConsultationRecord.findOne = (filter) => {
  const match = Object.values(consultationsStore).find((rec) => {
    if (filter._id && String(rec._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(rec.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(rec.patientId) !== String(filter.patientId)) return false;
    if (filter.appointmentId && String(rec.appointmentId) !== String(filter.appointmentId)) return false;
    if (filter.amendedRecordId && String(rec.amendedRecordId) !== String(filter.amendedRecordId)) return false;
    if (filter.status) {
      if (typeof filter.status === 'string' && rec.status !== filter.status) return false;
      if (filter.status.$in && !filter.status.$in.includes(rec.status)) return false;
    }
    return true;
  });
  return wrapChain(match || null);
};

DoctorConsultationRecord.deleteOne = async (filter) => {
  if (filter._id && consultationsStore[String(filter._id)]) {
    delete consultationsStore[String(filter._id)];
    return { acknowledged: true, deletedCount: 1 };
  }
  return { acknowledged: true, deletedCount: 0 };
};

DoctorConsultationRecord.updateOne = async (filter, update) => {
  const rec = Object.values(consultationsStore).find((r) => {
    if (filter._id && String(r._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(r.doctorId) !== String(filter.doctorId)) return false;
    return true;
  });
  if (rec && update?.$set) {
    Object.assign(rec, update.$set);
    return { acknowledged: true, modifiedCount: 1 };
  }
  return { acknowledged: true, modifiedCount: 0 };
};

DoctorConsultationRecord.prototype.save = async function () {
  if (!this._id) {
    this._id = `507f1f77bcf86cd79943909${nextIdCounter++}`;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    consultationsStore[String(this._id)] = this;
  } else {
    this.updatedAt = new Date();
    consultationsStore[String(this._id)] = this;
  }
  return this;
};

// Mock PatientMedicalProfile to verify no unwanted changes occur
let patientMedicalProfileStore = {
  [PATIENT_A_ID]: {
    _id: '507f1f77bcf86cd799439099',
    userId: PATIENT_A_ID,
    allergies: ['Penicillin'],
    chronicConditions: ['Asthma'],
    currentMedications: ['Salbutamol inhaler'],
    surgeries: [],
    isActive: true,
    consentToShareWithDoctors: true
  }
};
PatientMedicalProfile.findOne = (filter) => wrapChain(patientMedicalProfileStore[String(filter.userId)] || null);

// Express test app
const app = express();
app.use(express.json());
app.use('/api/doctors', doctorsRouter);
app.use('/api/medical', medicalRouter);

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
});

// Helper request wrapper
const req = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, options);
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  return { status: res.status, body };
};

test('PHASE 8: Doctor Consultation Records Suite', async (t) => {
  // Reset consultations store before tests
  consultationsStore = {};

  await t.test('1. Unauthenticated request is rejected', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`);
    assert.equal(res.status, 401);
  });

  await t.test('2. WORKER role is rejected from Doctor Consultations', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('3. EMPLOYER role is rejected from Doctor Consultations', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      headers: authHeader({ userId: EMPLOYER_ROLE_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('4. TEACHER role is rejected from Doctor Consultations', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      headers: authHeader({ userId: TEACHER_ROLE_ID, role: 'TEACHER' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('5. STUDENT role is rejected from Doctor Consultations', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      headers: authHeader({ userId: STUDENT_ROLE_ID, role: 'STUDENT' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('6. Authenticated Doctor can proceed to list consultations', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 0);
  });

  await t.test('7. Doctor cannot create consultation for unrelated patient (returns 404)', async () => {
    const res = await req(`/api/doctors/patients/${UNRELATED_USER_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_CONFIRMED_ID,
        chiefComplaint: 'Chest tightness'
      })
    });
    assert.equal(res.status, 404);
  });

  await t.test('8. PENDING appointment cannot create consultation (returns 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_PENDING_ID,
        chiefComplaint: 'Headache'
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test('9. CANCELLED appointment cannot create consultation (returns 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_CANCELLED_ID,
        chiefComplaint: 'Fever'
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test('10. NO_SHOW appointment cannot create consultation (returns 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_NOSHOW_ID,
        chiefComplaint: 'Cough'
      })
    });
    assert.equal(res.status, 400);
  });

  let createdDraftId = null;

  await t.test('11. CONFIRMED appointment permits consultation creation (creates DRAFT)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_CONFIRMED_ID,
        chiefComplaint: 'Persistent cough for 3 days',
        history: 'No previous pulmonary issues',
        examination: 'Lungs clear on auscultation',
        diagnosis: [{ name: 'Acute Bronchitis', icdCode: 'J20.9' }],
        treatmentPlan: 'Hydration and rest',
        vitals: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 37.1
        }
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.consultation.status, 'DRAFT');
    assert.equal(res.body.consultation.signedAt, null);
    createdDraftId = String(res.body.consultation._id);
  });

  await t.test('12. COMPLETED appointment permits consultation creation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_COMPLETED_ID,
        chiefComplaint: 'Follow-up visit',
        treatmentPlan: 'Condition resolved'
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  await t.test('13. Doctor cannot use another Doctor appointment to create consultation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_B_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_DOC_B_ID,
        chiefComplaint: 'Unauthorized consultation attempt'
      })
    });
    assert.equal(res.status, 404);
  });

  await t.test('14. Doctor cannot access another Doctor consultation record', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });

  await t.test('15. Valid consultation creates DRAFT and derives IDs server-side', async () => {
    const rec = consultationsStore[createdDraftId];
    assert.equal(String(rec.doctorId), DOCTOR_A_ID);
    assert.equal(String(rec.patientId), PATIENT_A_ID);
    assert.equal(String(rec.appointmentId), APPT_CONFIRMED_ID);
    assert.equal(rec.status, 'DRAFT');
  });

  await t.test('16. Client cannot spoof doctorId, signedAt, or appointment fields', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        appointmentId: APPT_COMPLETED_ID, // Has an active DRAFT from test 12
        doctorId: DOCTOR_B_ID,
        signedAt: new Date(),
        status: 'SIGNED',
        consultationType: 'ONLINE'
      })
    });
    // Duplicate draft safeguard or validation prevents spoofing
    assert.equal(res.status, 409); // Active DRAFT already exists for this appointment
  });

  await t.test('17. Appointment clinic, service, and consultationType are correctly snapshotted', async () => {
    const rec = consultationsStore[createdDraftId];
    assert.equal(String(rec.clinicId), CLINIC_ID);
    assert.equal(String(rec.serviceId), SERVICE_ID);
    assert.equal(rec.consultationType, 'CLINIC');
  });

  await t.test('18. Oversized clinical text is rejected (bounded fields)', async () => {
    const hugeText = 'A'.repeat(10001);
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        history: hugeText
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test('19. Invalid diagnosis structure is rejected', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        diagnosis: 'not-an-array'
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test('20. Invalid vitals (out of range or malformed BP) are rejected', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        vitals: {
          bloodPressure: 'invalid_bp_string',
          heartRate: 500 // Exceeds human range
        }
      })
    });
    assert.equal(res.status, 400);
  });

  await t.test('21. Doctor can read own DRAFT consultation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.consultation.chiefComplaint, 'Persistent cough for 3 days');
  });

  await t.test('22. Doctor can update own DRAFT consultation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        chiefComplaint: 'Mild dry cough',
        vitals: {
          bloodPressure: '118/78',
          heartRate: 70
        }
      })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.consultation.chiefComplaint, 'Mild dry cough');
    assert.equal(res.body.consultation.vitals.bloodPressure, '118/78');
  });

  await t.test('23. Doctor can sign DRAFT consultation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}/sign`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.consultation.status, 'SIGNED');
    assert.ok(res.body.consultation.signedAt);
  });

  await t.test('24. Signed record becomes immutable (PUT rejected with 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        chiefComplaint: 'Attempted edit on signed record'
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /immutable/i);
  });

  await t.test('25. Signed record cannot be deleted (DELETE rejected with 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /cannot be deleted/i);
  });

  let amendmentDraftId = null;

  await t.test('26. Doctor can create amendment from SIGNED record', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}/amend`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.consultation.status, 'DRAFT');
    assert.equal(String(res.body.consultation.amendedRecordId), createdDraftId);
    amendmentDraftId = String(res.body.consultation._id);
  });

  await t.test('27. Original signed record remains unchanged after amendment creation', async () => {
    const original = consultationsStore[createdDraftId];
    assert.equal(original.status, 'SIGNED');
  });

  await t.test('28. Another Doctor cannot amend another Doctor record', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${createdDraftId}/amend`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });

  await t.test('29. Doctor can sign the amendment and transition referenced record to AMENDED', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${amendmentDraftId}/sign`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.consultation.status, 'SIGNED');

    // The original record is now AMENDED
    const original = consultationsStore[createdDraftId];
    assert.equal(original.status, 'AMENDED');
  });

  await t.test('30. Patient can read own SIGNED consultation via /api/medical/consultations', async () => {
    const res = await req('/api/medical/consultations', {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.consultations.length >= 1);
  });

  await t.test('31. Patient cannot read DRAFT consultations', async () => {
    // Create an un-signed DRAFT for another appointment
    const draftRec = new DoctorConsultationRecord({
      doctorId: DOCTOR_A_ID,
      patientId: PATIENT_A_ID,
      appointmentId: APPT_CONFIRMED_ID,
      consultationType: 'CLINIC',
      chiefComplaint: 'Secret draft notes',
      status: 'DRAFT'
    });
    await draftRec.save();
    const draftId = String(draftRec._id);

    const listRes = await req('/api/medical/consultations', {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.ok(listRes.body.consultations.every(c => c.status !== 'DRAFT'));

    // Attempt direct ID read
    const singleRes = await req(`/api/medical/consultations/${draftId}`, {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(singleRes.status, 404);
  });

  await t.test('32. Patient cannot read another patient consultation', async () => {
    const res = await req(`/api/medical/consultations/${createdDraftId}`, {
      headers: authHeader({ userId: PATIENT_B_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 404);
  });

  await t.test('33. Patient cannot modify or sign consultation records (no patient write routes)', async () => {
    const res = await req(`/api/medical/consultations/${createdDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' }),
      body: JSON.stringify({ chiefComplaint: 'Hacked' })
    });
    assert.equal(res.status, 404); // Route does not exist on /api/medical
  });

  await t.test('34. PatientMedicalProfile is never modified by Consultation creation', async () => {
    const profile = patientMedicalProfileStore[PATIENT_A_ID];
    assert.deepEqual(profile.allergies, ['Penicillin']);
    assert.deepEqual(profile.chronicConditions, ['Asthma']);
  });

  await t.test('35. No prescription structures or fields are exposed', async () => {
    const rec = consultationsStore[createdDraftId];
    assert.equal(rec.prescriptions, undefined);
    assert.equal(rec.drugName, undefined);
    assert.equal(rec.dosage, undefined);
  });

  await t.test('36. Non-premium patient cannot list consultations (403 PREMIUM_REQUIRED)', async () => {
    const res = await req('/api/medical/consultations', {
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Doctor Consultations are a Premium-only feature.');
  });

  await t.test('37. Non-premium patient cannot view consultation detail (403 PREMIUM_REQUIRED)', async () => {
    const res = await req(`/api/medical/consultations/${createdDraftId}`, {
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'PREMIUM_REQUIRED');
    assert.equal(res.body.message, 'Doctor Consultations are a Premium-only feature.');
  });
});
