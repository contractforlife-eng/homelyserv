// backend/src/routes/doctorPrescriptions.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import Prescription from '../models/Prescription.js';
import doctorsRouter from './doctors.js';
import medicalRouter from './medical.js';

const secret = 'doctor-prescriptions-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd799439070';
const DOCTOR_B_ID = '507f1f77bcf86cd799439071';
const PATIENT_A_ID = '507f1f77bcf86cd799439072';
const PATIENT_B_ID = '507f1f77bcf86cd799439073';
const WORKER_ROLE_ID = '507f1f77bcf86cd799439075';
const EMPLOYER_ROLE_ID = '507f1f77bcf86cd799439076';

const APPT_SIGNED_A_ID = '507f1f77bcf86cd799439080';
const APPT_DRAFT_A_ID = '507f1f77bcf86cd799439081';
const APPT_DOC_B_ID = '507f1f77bcf86cd799439082';

const CLINIC_A_ID = '507f1f77bcf86cd799439090';

const CONSULT_SIGNED_A_ID = '507f1f77bcf86cd799439100';
const CONSULT_DRAFT_A_ID = '507f1f77bcf86cd799439101';
const CONSULT_SIGNED_B_ID = '507f1f77bcf86cd799439102';

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
    phone: '+1234567890',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [DOCTOR_B_ID]: {
    _id: DOCTOR_B_ID,
    fullName: 'Dr. Gregory House',
    email: 'house@homelyserv.test',
    phone: '+1987654321',
    role: 'DOCTOR',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_A_ID]: {
    _id: PATIENT_A_ID,
    fullName: 'Sherlock Holmes',
    email: 'sherlock@homelyserv.test',
    phone: '+1122334455',
    city: 'London',
    countryName: 'United Kingdom',
    role: 'WORKER',
    tokenVersion: 0,
    isSuspended: false
  },
  [PATIENT_B_ID]: {
    _id: PATIENT_B_ID,
    fullName: 'Irene Adler',
    email: 'irene@homelyserv.test',
    phone: '+1555666777',
    city: 'New Jersey',
    countryName: 'United States',
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
  }
};

const clinicsMockStore = {
  [CLINIC_A_ID]: {
    _id: CLINIC_A_ID,
    clinicName: '221B Baker Clinic',
    addressLine: '221B Baker St',
    city: 'London',
    phone: '+1234567890'
  }
};

const doctorProfilesMockStore = {
  [DOCTOR_A_ID]: {
    userId: DOCTOR_A_ID,
    professionalTitle: 'Dr.',
    specialty: 'General Practitioner'
  },
  [DOCTOR_B_ID]: {
    userId: DOCTOR_B_ID,
    professionalTitle: 'Dr.',
    specialty: 'Diagnostic Medicine'
  }
};

const consultationsMockStore = {
  [CONSULT_SIGNED_A_ID]: {
    _id: CONSULT_SIGNED_A_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    appointmentId: APPT_SIGNED_A_ID,
    clinicId: CLINIC_A_ID,
    consultationType: 'CLINIC',
    status: 'SIGNED',
    signedAt: new Date('2026-09-25T11:00:00Z'),
    diagnosis: [{ name: 'Acute Bronchitis', icdCode: 'J20.9' }]
  },
  [CONSULT_DRAFT_A_ID]: {
    _id: CONSULT_DRAFT_A_ID,
    doctorId: DOCTOR_A_ID,
    patientId: PATIENT_A_ID,
    appointmentId: APPT_DRAFT_A_ID,
    clinicId: CLINIC_A_ID,
    consultationType: 'CLINIC',
    status: 'DRAFT',
    diagnosis: [{ name: 'Mild Cough' }]
  },
  [CONSULT_SIGNED_B_ID]: {
    _id: CONSULT_SIGNED_B_ID,
    doctorId: DOCTOR_B_ID,
    patientId: PATIENT_B_ID,
    appointmentId: APPT_DOC_B_ID,
    clinicId: null,
    consultationType: 'ONLINE',
    status: 'SIGNED',
    signedAt: new Date('2026-09-26T12:00:00Z'),
    diagnosis: [{ name: 'Migraine', icdCode: 'G43.909' }]
  }
};

let prescriptionsStore = {};
let nextRxCounter = 1;

// Mocks
User.findById = (id) => wrapQuery(usersMockStore[String(id)] || null);
DoctorClinic.findById = (id) => wrapQuery(clinicsMockStore[String(id)] || null);
DoctorProfile.findOne = (filter) => wrapQuery(doctorProfilesMockStore[String(filter?.userId)] || null);

DoctorConsultationRecord.findOne = (filter) => {
  const match = Object.values(consultationsMockStore).find((rec) => {
    if (filter._id && String(rec._id) !== String(filter._id)) return false;
    if (filter.doctorId && String(rec.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(rec.patientId) !== String(filter.patientId)) return false;
    return true;
  });
  return wrapChain(match || null);
};

DoctorConsultationRecord.findById = (id) => wrapChain(consultationsMockStore[String(id)] || null);

// Prescription Mongoose mock
Prescription.find = (filter) => {
  let list = Object.values(prescriptionsStore).filter((rx) => {
    if (filter.doctorId && String(rx.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(rx.patientId) !== String(filter.patientId)) return false;
    if (filter.consultationRecordId && String(rx.consultationRecordId) !== String(filter.consultationRecordId)) return false;
    if (filter.status && rx.status !== filter.status) return false;
    return true;
  });
  return wrapChain(list);
};

Prescription.findOne = (filter) => {
  const match = Object.values(prescriptionsStore).find((rx) => {
    if (filter._id && String(rx._id) !== String(filter._id)) return false;
    if (filter.consultationRecordId && String(rx.consultationRecordId) !== String(filter.consultationRecordId)) return false;
    if (filter.doctorId && String(rx.doctorId) !== String(filter.doctorId)) return false;
    if (filter.patientId && String(rx.patientId) !== String(filter.patientId)) return false;
    if (filter.status && rx.status !== filter.status) return false;
    return true;
  });
  return wrapChain(match || null);
};

Prescription.exists = async (filter) => {
  const match = Object.values(prescriptionsStore).find((rx) => {
    if (filter.prescriptionNumber && rx.prescriptionNumber !== filter.prescriptionNumber) return false;
    return true;
  });
  return Boolean(match);
};

Prescription.deleteOne = async (filter) => {
  if (filter._id && prescriptionsStore[String(filter._id)]) {
    delete prescriptionsStore[String(filter._id)];
    return { acknowledged: true, deletedCount: 1 };
  }
  return { acknowledged: true, deletedCount: 0 };
};

Prescription.prototype.save = async function () {
  if (!this._id) {
    this._id = `507f1f77bcf86cd79943920${nextRxCounter++}`;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    prescriptionsStore[String(this._id)] = this;
  } else {
    this.updatedAt = new Date();
    prescriptionsStore[String(this._id)] = this;
  }
  return this;
};

// Test Server Setup
const app = express();
app.use(express.json());
app.use('/api/doctors', doctorsRouter);
app.use('/api/medical', medicalRouter);

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
});

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

test('PHASE 9: Doctor Prescriptions & Printing Suite', async (t) => {
  prescriptionsStore = {};
  let createdRxDraftId = null;
  let issuedRxId = null;

  // 1. Authentication & Role checks
  await t.test('1. Unauthenticated request is rejected with 401', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`);
    assert.equal(res.status, 401);
  });

  await t.test('2. WORKER role cannot create or read doctor prescriptions (403)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      headers: authHeader({ userId: WORKER_ROLE_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('3. EMPLOYER role cannot create or read doctor prescriptions (403)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      headers: authHeader({ userId: EMPLOYER_ROLE_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 403);
  });

  // 2. Consultation Ownership & Relationship
  await t.test('4. Doctor cannot create prescription for non-existent consultation (404)', async () => {
    const fakeConsultId = '507f1f77bcf86cd799439999';
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${fakeConsultId}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ items: [] })
    });
    assert.equal(res.status, 404);
  });

  await t.test('5. Doctor cannot create prescription for another Doctor consultation (404)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_B_ID}/consultations/${CONSULT_SIGNED_B_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ items: [] })
    });
    assert.equal(res.status, 404);
  });

  await t.test('6. Prescription creation rejected if consultation is in DRAFT status (400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_DRAFT_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ items: [] })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Consultation must be SIGNED/);
  });

  // 3. Medication Items Validation
  await t.test('7. Validation fails if items is not an array', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ items: 'not-an-array' })
    });
    assert.equal(res.status, 400);
  });

  await t.test('8. Validation fails if medication item misses required field dosage', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Amoxicillin', frequency: '3 times daily', duration: '7 days' }]
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /requires 'dosage'/);
  });

  await t.test('9. Validation fails if medication item misses required field duration', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily' }]
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /requires 'duration'/);
  });

  await t.test('10. Validation fails if medication item has unrecognized unknown keys', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', duration: '7 days', maliciousKey: 'xyz' }]
      })
    });
    assert.equal(res.status, 400);
  });

  // 4. Creation & Server-side Generation
  await t.test('11. Doctor successfully creates a DRAFT prescription', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [
          {
            drugName: 'Amoxicillin',
            strength: '500mg',
            form: 'Capsule',
            dosage: '1 capsule',
            frequency: '3 times a day after meals',
            duration: '7 days',
            quantity: '21 capsules',
            instructions: 'Take full course even if symptoms improve'
          }
        ],
        notes: 'Drink plenty of water',
        followUpDate: '2026-10-02T10:00:00Z'
      })
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.prescription);
    assert.equal(res.body.prescription.status, 'DRAFT');
    assert.match(res.body.prescription.prescriptionNumber, /^RX-\d{8}-[A-F0-9]{6}$/);
    assert.equal(res.body.prescription.doctorId, DOCTOR_A_ID);
    assert.equal(res.body.prescription.patientId, PATIENT_A_ID);
    assert.equal(res.body.prescription.consultationRecordId, CONSULT_SIGNED_A_ID);
    createdRxDraftId = res.body.prescription._id;
  });

  await t.test('12. Client-supplied prescriptionNumber is ignored and server-generated', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        prescriptionNumber: 'CLIENT-HACKED-NUMBER',
        items: [
          { drugName: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '3 days' }
        ]
      })
    });

    assert.equal(res.status, 201);
    assert.notEqual(res.body.prescription.prescriptionNumber, 'CLIENT-HACKED-NUMBER');
    assert.match(res.body.prescription.prescriptionNumber, /^RX-\d{8}-[A-F0-9]{6}$/);
  });

  await t.test('13. Client-supplied doctorId and patientId are ignored and derived server-side', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        doctorId: DOCTOR_B_ID,
        patientId: PATIENT_B_ID,
        items: [
          { drugName: 'Ibuprofen', dosage: '400mg', frequency: 'Once daily', duration: '2 days' }
        ]
      })
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.prescription.doctorId, DOCTOR_A_ID);
    assert.equal(res.body.prescription.patientId, PATIENT_A_ID);
  });

  await t.test('14. Document snapshot contains immutable doctor and clinic information', async () => {
    const rx = prescriptionsStore[createdRxDraftId];
    assert.ok(rx.documentSnapshot);
    assert.equal(rx.documentSnapshot.doctor.fullName, 'Dr. John Watson');
    assert.equal(rx.documentSnapshot.doctor.specialty, 'General Practitioner');
    assert.equal(rx.documentSnapshot.patient.fullName, 'Sherlock Holmes');
    assert.equal(rx.documentSnapshot.clinic.clinicName, '221B Baker Clinic');
  });

  // 5. Query Prescriptions
  await t.test('15. Doctor can list prescriptions for consultation', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.prescriptions.length >= 3);
  });

  await t.test('16. Doctor can view single prescription details by id', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${createdRxDraftId}`, {
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.prescription._id, createdRxDraftId);
  });

  await t.test('17. Another doctor cannot view prescription details (404)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${createdRxDraftId}`, {
      headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 404);
  });

  // 6. Draft Updates
  await t.test('18. Doctor can update a DRAFT prescription', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${createdRxDraftId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        notes: 'Updated instructions: Take with meals',
        items: [
          { drugName: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '10 days' }
        ]
      })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.prescription.notes, 'Updated instructions: Take with meals');
    assert.equal(res.body.prescription.items[0].duration, '10 days');
  });

  // 7. Issuing Prescription
  await t.test('19. Doctor can issue a DRAFT prescription', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${createdRxDraftId}/issue`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.prescription.status, 'ISSUED');
    assert.ok(res.body.prescription.issuedAt);
    issuedRxId = createdRxDraftId;
  });

  await t.test('20. Once ISSUED, prescription cannot be modified (PUT rejected with 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ notes: 'Attempted modification after issuance' })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Only DRAFT prescriptions can be edited/);
  });

  await t.test('21. Once ISSUED, prescription cannot be deleted (DELETE rejected with 400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Issued or cancelled prescriptions cannot be deleted/);
  });

  await t.test('22. Cannot re-issue an already ISSUED prescription (400)', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}/issue`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Only DRAFT prescriptions can be issued/);
  });

  // 8. Cancellation
  await t.test('23. Cannot cancel a DRAFT prescription directly without issuing (400)', async () => {
    // Create new draft
    const draftRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '5 days' }]
      })
    });
    const draftId = draftRes.body.prescription._id;

    const cancelRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${draftId}/cancel`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ cancellationReason: 'Error in entry' })
    });
    assert.equal(cancelRes.status, 400);
    assert.match(cancelRes.body.message, /Only ISSUED prescriptions can be cancelled/);

    // Can delete this draft
    const delRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${draftId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(delRes.status, 200);
  });

  await t.test('24. Doctor can cancel an ISSUED prescription with reason', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}/cancel`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ cancellationReason: 'Patient reported adverse allergy' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.prescription.status, 'CANCELLED');
    assert.ok(res.body.prescription.cancelledAt);
    assert.equal(res.body.prescription.cancelledBy, DOCTOR_A_ID);
    assert.equal(res.body.prescription.cancellationReason, 'Patient reported adverse allergy');
  });

  await t.test('25. Once CANCELLED, prescription cannot be modified or deleted (400)', async () => {
    const putRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ notes: 'modify cancelled' })
    });
    assert.equal(putRes.status, 400);

    const delRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${issuedRxId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(delRes.status, 400);
  });

  // 9. Historical Preservation (Creating new prescription does not overwrite older)
  await t.test('26. Creating a new prescription does NOT overwrite or mutate older prescription', async () => {
    const res = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Azithromycin', dosage: '250mg', frequency: 'OD', duration: '3 days' }]
      })
    });
    assert.equal(res.status, 201);
    const newRx = res.body.prescription;
    assert.notEqual(newRx._id, issuedRxId);

    // Old prescription remains intact
    const oldRx = prescriptionsStore[issuedRxId];
    assert.equal(oldRx.status, 'CANCELLED');
    assert.equal(oldRx.cancellationReason, 'Patient reported adverse allergy');
  });

  // 10. Patient Read-only Access
  await t.test('27. Patient can list their own ISSUED prescriptions via /api/medical/prescriptions', async () => {
    // Create & issue a clean prescription for Patient A
    const postRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({
        items: [{ drugName: 'Vitamin D3', dosage: '1000 IU', frequency: 'Daily', duration: '30 days' }]
      })
    });
    const rxId = postRes.body.prescription._id;
    await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${rxId}/issue`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    const res = await req('/api/medical/prescriptions', {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.prescriptions.some((p) => p._id === rxId));
  });

  await t.test('28. Patient cannot see DRAFT or CANCELLED prescriptions via /api/medical/prescriptions', async () => {
    const res = await req('/api/medical/prescriptions', {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 200);
    const statuses = res.body.prescriptions.map((p) => p.status);
    assert.ok(statuses.every((s) => s === 'ISSUED'));
  });

  await t.test('29. Patient can view single ISSUED prescription by id', async () => {
    const patientPrescriptions = Object.values(prescriptionsStore).filter(
      (p) => String(p.patientId) === PATIENT_A_ID && p.status === 'ISSUED'
    );
    const target = patientPrescriptions[0];
    assert.ok(target);

    const res = await req(`/api/medical/prescriptions/${target._id}`, {
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.prescription._id, String(target._id));
  });

  await t.test('30. Patient cannot view another patient prescription (404)', async () => {
    const patientPrescriptions = Object.values(prescriptionsStore).filter(
      (p) => String(p.patientId) === PATIENT_A_ID && p.status === 'ISSUED'
    );
    const target = patientPrescriptions[0];

    const res = await req(`/api/medical/prescriptions/${target._id}`, {
      headers: authHeader({ userId: PATIENT_B_ID, role: 'EMPLOYER' })
    });
    assert.equal(res.status, 404);
  });

  await t.test('31. Patient cannot modify or cancel prescription (no patient write routes)', async () => {
    const patientPrescriptions = Object.values(prescriptionsStore).filter(
      (p) => String(p.patientId) === PATIENT_A_ID && p.status === 'ISSUED'
    );
    const target = patientPrescriptions[0];

    const resPut = await req(`/api/medical/prescriptions/${target._id}`, {
      method: 'PUT',
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' }),
      body: JSON.stringify({ notes: 'patient edit' })
    });
    assert.equal(resPut.status, 404); // Route does not exist on medical router

    const resDelete = await req(`/api/medical/prescriptions/${target._id}`, {
      method: 'DELETE',
      headers: authHeader({ userId: PATIENT_A_ID, role: 'WORKER' })
    });
    assert.equal(resDelete.status, 404);
  });

  await t.test('32. Cannot issue an empty prescription without medication items (400)', async () => {
    const postRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ items: [] })
    });
    assert.equal(postRes.status, 201);
    const emptyDraftId = postRes.body.prescription._id;

    const issueRes = await req(`/api/doctors/patients/${PATIENT_A_ID}/consultations/${CONSULT_SIGNED_A_ID}/prescriptions/${emptyDraftId}/issue`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(issueRes.status, 400);
    assert.match(issueRes.body.message, /Add at least one medication item/);
  });
});
