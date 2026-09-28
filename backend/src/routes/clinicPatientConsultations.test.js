// backend/src/routes/clinicPatientConsultations.test.js
// ============================================================
// Consultation creation for BOTH patient sources.
//
// Regression focus: `appointmentId` is MANDATORY and must reference a
// real appointment owned by the requesting doctor AND belonging to the
// scoped patient. Also covers the additive ClinicPatient path.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import ClinicPatient from '../models/ClinicPatient.js';
import doctorsRouter from './doctors.js';

const secret = 'clinic-patient-consultations-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_A_ID = '507f1f77bcf86cd7994390d0';
const DOCTOR_B_ID = '507f1f77bcf86cd7994390d1';
const PATIENT_A_ID = '507f1f77bcf86cd7994390d2';      // HomelyServ User
const PATIENT_B_ID = '507f1f77bcf86cd7994390d3';      // another HomelyServ User
const CLINIC_PATIENT_A = '507f1f77bcf86cd7994390d4';  // doctor A's ClinicPatient
const CLINIC_PATIENT_B = '507f1f77bcf86cd7994390d5';  // doctor B's ClinicPatient
const APPT_CONFIRMED = '507f1f77bcf86cd7994390e0';
const APPT_OTHER_DOC = '507f1f77bcf86cd7994390e1';
const APPT_OTHER_PATIENT = '507f1f77bcf86cd7994390e2';
const APPT_CLINIC = '507f1f77bcf86cd7994390e3';

const createToken = (p) => jwt.sign(p, secret, { expiresIn: '1h' });
const authHeader = (p) => ({
  authorization: `Bearer ${createToken(p)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select: () => Promise.resolve(doc),
  then: (res, rej) => Promise.resolve(doc).then(res, rej)
});

const chain = (res) => {
  const c = { populate: () => c, sort: () => c, then: (r, j) => Promise.resolve(res).then(r, j) };
  return c;
};


const withServer = async ({ appointments = [], clinicPatients = [] } = {}, run) => {
  const orig = {
    userFindById: User.findById,
    aptFind: DoctorAppointment.find,
    aptFindOne: DoctorAppointment.findOne,
    aptExists: DoctorAppointment.exists,
    recFind: DoctorConsultationRecord.find,
    recFindOne: DoctorConsultationRecord.findOne,
    recUpdateOne: DoctorConsultationRecord.updateOne,
    recDeleteOne: DoctorConsultationRecord.deleteOne,
    cpOne: ClinicPatient.findOne
  };

  const apts = appointments.map((a) => ({
    _id: a._id,
    doctorId: a.doctorId,
    patientId: a.patientId ?? null,
    clinicPatientId: a.clinicPatientId ?? null,
    clinicId: null, serviceId: null,
    consultationType: 'CLINIC',
    status: a.status || 'CONFIRMED',
    startsAt: new Date(), endsAt: new Date()
  }));

  const cps = clinicPatients.map((c) => ({ _id: c._id, doctorId: c.doctorId, fullName: c.fullName }));
  const recs = [];
  let seq = 0;

  User.findById = (id) => wrapQuery(
    (String(id) === DOCTOR_A_ID || String(id) === DOCTOR_B_ID)
      ? { _id: String(id), role: 'DOCTOR', tokenVersion: 0, isSuspended: false, isVerified: true }
      : null
  );

  const matchApt = (f = {}) => apts.find((a) =>
    (!f._id || String(a._id) === String(f._id)) &&
    (!f.doctorId || String(a.doctorId) === String(f.doctorId)) &&
    (f.patientId === undefined || String(a.patientId) === String(f.patientId)) &&
    (f.clinicPatientId === undefined || String(a.clinicPatientId) === String(f.clinicPatientId)) &&
    (!f.status || (f.status.$in ? f.status.$in.includes(a.status) : a.status === f.status))
  );

  // A clinic appointment must not satisfy a HomelyServ scope and vice versa.
  const scopedMatch = (f) => {
    const m = matchApt(f);
    if (!m) return null;
    if (f.clinicPatientId !== undefined && String(m.patientId) === String(f.clinicPatientId)) return null;
    if (f.patientId !== undefined && String(m.clinicPatientId) === String(f.patientId)) return null;
    return m;
  };

  DoctorAppointment.findOne = (f = {}) => chain(scopedMatch(f) || null);
  DoctorAppointment.exists = async (f = {}) => Boolean(scopedMatch(f));
  DoctorAppointment.find = (f = {}) => chain(apts.filter((a) => {
    if (f.doctorId && String(a.doctorId) !== String(f.doctorId)) return false;
    if (f.patientId && String(a.patientId) !== String(f.patientId)) return false;
    if (f.clinicPatientId && String(a.clinicPatientId) !== String(f.clinicPatientId)) return false;
    return true;
  }));

  ClinicPatient.findOne = (f = {}) => {
    const m = cps.find((c) => String(c._id) === String(f._id) &&
      (!f.doctorId || String(c.doctorId) === String(f.doctorId))) || null;
    // Support .select() and .lean() on the mocked query.
    const q = { then: (res, rej) => Promise.resolve(m).then(res, rej) };
    q.select = () => q;
    q.lean = () => Promise.resolve(m);
    return q;
  };

  // Stub the real Mongoose constructor so validation runs but nothing is
  // written to MongoDB. This exercises the schema-level XOR rule.
  const OrigModel = DoctorConsultationRecord;
  const realConstruct = DoctorConsultationRecord.prototype;
  DoctorConsultationRecord.prototype.validate = async function validate() {
    const hasUser = Boolean(this.patientId);
    const hasClinic = Boolean(this.clinicPatientId);
    if (hasUser && hasClinic) throw new Error('exactly one patient source');
    if (!hasUser && !hasClinic) throw new Error('a consultation requires a patient');
  };
  DoctorConsultationRecord.prototype.save = async function save() {
    this._id = this._id || `507f1f77bcf86cd7994391${String(seq++).padStart(2, '0')}`;
    // A Mongoose document keeps its schema fields on `_doc`, so spreading
    // `this` directly would store internals instead of the fields. Persist
    // a plain object so the in-memory store is queryable.
    const plain = typeof this.toObject === 'function'
      ? { ...this.toObject(), _id: this._id }
      : { ...this, _id: this._id };
    const idx = recs.findIndex((r) => String(r._id) === String(this._id));
    if (idx >= 0) recs[idx] = plain; else recs.push(plain);
    return this;
  };
  void realConstruct; void OrigModel;

  DoctorConsultationRecord.find = (f = {}) => chain(recs.filter((r) =>
    (!f.doctorId || String(r.doctorId) === String(f.doctorId)) &&
    (f.patientId === undefined || String(r.patientId) === String(f.patientId)) &&
    (f.clinicPatientId === undefined || String(r.clinicPatientId) === String(f.clinicPatientId))
  ));
  // Lifecycle handlers call `record.save()`, so hydrate the matched store
  // entry into a document-like object that writes back to `recs`.
  const hydrate = (r) => {
    if (!r) return null;
    const doc = { ...r };
    Object.defineProperty(doc, 'save', {
      value: async function save() {
        const plain = { ...this };
        const i = recs.findIndex((x) => String(x._id) === String(plain._id));
        if (i >= 0) recs[i] = plain;
        return this;
      },
      enumerable: false
    });
    doc.toObject = () => ({ ...doc });
    return doc;
  };

  // Scoped lookup used by every lifecycle handler. `status` is NOT filtered
  // here so a caller can observe a record regardless of state.
  DoctorConsultationRecord.findOne = (f = {}) => chain(hydrate(recs.find((r) =>
    (!f._id || String(r._id) === String(f._id)) &&
    (!f.doctorId || String(r.doctorId) === String(f.doctorId)) &&
    (f.patientId === undefined || String(r.patientId) === String(f.patientId)) &&
    (f.clinicPatientId === undefined || String(r.clinicPatientId) === String(f.clinicPatientId)) &&
    (!f.appointmentId || String(r.appointmentId) === String(f.appointmentId)) &&
    (!f.amendedRecordId || String(r.amendedRecordId) === String(f.amendedRecordId)) &&
    (!f.status || r.status === f.status)
  )));
  DoctorConsultationRecord.updateOne = async (f = {}, u = {}) => {
    const t = recs.find((r) => (!f._id || String(r._id) === String(f._id)) &&
      (!f.doctorId || String(r.doctorId) === String(f.doctorId)));
    if (t && u.$set) Object.assign(t, u.$set);
    return { acknowledged: true };
  };
  DoctorConsultationRecord.deleteOne = async (f = {}) => {
    const i = recs.findIndex((r) => String(r._id) === String(f._id));
    if (i >= 0) recs.splice(i, 1);
    return { acknowledged: true };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/doctors', doctorsRouter);
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run({ baseUrl, recs, apts });
  } finally {
    server.close();
    User.findById = orig.userFindById;
    DoctorAppointment.find = orig.aptFind;
    DoctorAppointment.findOne = orig.aptFindOne;
    DoctorAppointment.exists = orig.aptExists;
    DoctorConsultationRecord.find = orig.recFind;
    DoctorConsultationRecord.findOne = orig.recFindOne;
    DoctorConsultationRecord.updateOne = orig.recUpdateOne;
    DoctorConsultationRecord.deleteOne = orig.recDeleteOne;
    ClinicPatient.findOne = orig.cpOne;
    delete DoctorConsultationRecord.prototype.validate;
    delete DoctorConsultationRecord.prototype.save;
  }
};

const baseSeed = {
  clinicPatients: [
    { _id: CLINIC_PATIENT_A, doctorId: DOCTOR_A_ID, fullName: 'Walk-in A' },
    { _id: CLINIC_PATIENT_B, doctorId: DOCTOR_B_ID, fullName: 'Walk-in B' }
  ],
  appointments: [
    { _id: APPT_CONFIRMED, doctorId: DOCTOR_A_ID, patientId: PATIENT_A_ID, status: 'CONFIRMED' },
    { _id: APPT_OTHER_DOC, doctorId: DOCTOR_B_ID, patientId: PATIENT_A_ID, status: 'CONFIRMED' },
    { _id: APPT_OTHER_PATIENT, doctorId: DOCTOR_A_ID, patientId: PATIENT_B_ID, status: 'CONFIRMED' },
    { _id: APPT_CLINIC, doctorId: DOCTOR_A_ID, clinicPatientId: CLINIC_PATIENT_A, status: 'CONFIRMED' }
  ]
};

const body = (appointmentId) => ({ appointmentId, chiefComplaint: 'Headache' });
const HOMELY_URL = (id) => `/api/doctors/patients/${id}/consultations`;
const CLINIC_URL = () => '/api/doctors/clinic-patients/consultations';

// ============================================
// Consultation creation — both patient sources
// ============================================

test('1. HomelyServ patient + valid CONFIRMED appointment → consultation created', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_CONFIRMED))
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(String(data.consultation.patientId), PATIENT_A_ID);
    assert.equal(data.consultation.clinicPatientId, null);
    assert.equal(String(data.consultation.appointmentId), APPT_CONFIRMED);
    assert.equal(data.consultation.status, 'DRAFT');
    assert.equal(recs.length, 1);
  });
});

test('2. ClinicPatient + valid appointment → consultation created', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const url = `${baseUrl}${CLINIC_URL()}?clinicPatientId=${CLINIC_PATIENT_A}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_CLINIC))
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(String(data.consultation.clinicPatientId), CLINIC_PATIENT_A);
    assert.equal(data.consultation.patientId, null);
    assert.equal(String(data.consultation.appointmentId), APPT_CLINIC);
  });
});

test('3. Missing appointmentId → rejected (400)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ chiefComplaint: 'Headache' })
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /appointmentId/i);
    assert.equal(recs.length, 0, 'no consultation persisted');
  });
});

test('3b. Empty/invalid appointmentId → rejected (400)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    for (const bad of ['', 'not-an-id']) {
      const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
        method: 'POST',
        headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
        body: JSON.stringify(body(bad))
      });
      assert.equal(res.status, 400, `appointmentId=${JSON.stringify(bad)}`);
    }
    assert.equal(recs.length, 0);
  });
});

test('4. Appointment belonging to ANOTHER doctor → rejected (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_OTHER_DOC))
    });
    assert.equal(res.status, 404);
    assert.equal(recs.length, 0);
  });
});

test('5. Appointment belonging to ANOTHER patient → rejected (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_OTHER_PATIENT))
    });
    assert.equal(res.status, 404);
    assert.equal(recs.length, 0);
  });
});

test('5b. ClinicPatient appointment cannot be used for a HomelyServ consultation', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const res = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_CLINIC))
    });
    assert.equal(res.status, 404);
    assert.equal(recs.length, 0);
  });
});

test('6. Another doctor cannot create for someone else’s ClinicPatient (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}${CLINIC_URL()}?clinicPatientId=${CLINIC_PATIENT_B}`, {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify(body(APPT_CLINIC))
    });
    assert.equal(res.status, 404);
  });
});

test('7. Unauthenticated → 401; non-Doctor → 403', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const anon = await fetch(`${baseUrl}${HOMELY_URL(PATIENT_A_ID)}`, {
      method: 'POST',
      body: JSON.stringify(body(APPT_CONFIRMED))
    });
    assert.equal(anon.status, 401);
  });
});


// ============================================
// ClinicPatient consultation LIFECYCLE
// DRAFT -> SIGNED -> AMENDED
// ============================================

/** Creates a DRAFT via the API and returns the created consultation. */
const createClinicDraft = async (baseUrl) => {
  const res = await fetch(`${baseUrl}${CLINIC_URL()}?clinicPatientId=${CLINIC_PATIENT_A}`, {
    method: 'POST',
    headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
    body: JSON.stringify(body(APPT_CLINIC))
  });
  assert.equal(res.status, 201);
  return (await res.json()).consultation;
};

// The id belongs in the PATH; the query string must come last.
const clinicRecUrl = (baseUrl, id, suffix = '', cp = CLINIC_PATIENT_A) =>
  `${baseUrl}/api/doctors/clinic-patients/consultations/${id}${suffix}?clinicPatientId=${cp}`;

test('A+B. ClinicPatient DRAFT can be created, then updated', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const created = await createClinicDraft(baseUrl);
    assert.equal(created.status, 'DRAFT');
    assert.equal(String(created.clinicPatientId), CLINIC_PATIENT_A);
    assert.equal(created.patientId, null);

    const res = await fetch(clinicRecUrl(baseUrl, created._id), {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ chiefComplaint: 'Updated complaint', history: 'Updated history' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.consultation.chiefComplaint, 'Updated complaint');
    assert.equal(data.consultation.status, 'DRAFT', 'saving keeps it a DRAFT');
  });
});

test('C. ClinicPatient DRAFT can be SIGNED (stamps signedAt, seals)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const created = await createClinicDraft(baseUrl);
    const res = await fetch(clinicRecUrl(baseUrl, created._id, '/sign'), {
      method: 'POST',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.consultation.status, 'SIGNED');
    assert.ok(data.consultation.signedAt, 'signedAt stamped');
  });
});

test('D. SIGNED ClinicPatient consultation is immutable via draft update (400)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const created = await createClinicDraft(baseUrl);
    await fetch(clinicRecUrl(baseUrl, created._id, '/sign'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const res = await fetch(clinicRecUrl(baseUrl, created._id), {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ chiefComplaint: 'Should not apply' })
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /immutable/i);
  });
});


test('E+F. SIGNED can be AMENDED; original preserved, becomes AMENDED after amendment is signed', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const original = await createClinicDraft(baseUrl);
    await fetch(clinicRecUrl(baseUrl, original._id, '/sign'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });

    const amendRes = await fetch(clinicRecUrl(baseUrl, original._id, '/amend'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(amendRes.status, 201);
    const amendment = (await amendRes.json()).consultation;
    assert.equal(amendment.status, 'DRAFT');
    assert.equal(String(amendment.clinicPatientId), CLINIC_PATIENT_A, 'stays a ClinicPatient record');
    assert.equal(amendment.patientId, null, 'never converted to a HomelyServ record');
    assert.equal(String(amendment.appointmentId), APPT_CLINIC, 'appointment carried over');
    assert.equal(String(amendment.amendedRecordId), String(original._id));

    // F: the original SIGNED record is NOT mutated by amendment creation.
    const orig = recs.find((r) => String(r._id) === String(original._id));
    assert.equal(orig.status, 'SIGNED', 'original untouched at creation time');

    const signAmend = await fetch(clinicRecUrl(baseUrl, amendment._id, '/sign'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(signAmend.status, 200);
    assert.equal((await signAmend.json()).consultation.status, 'SIGNED');
    assert.equal(
      recs.find((r) => String(r._id) === String(original._id)).status,
      'AMENDED',
      'referenced record becomes AMENDED'
    );
  });
});

test('E2. A duplicate DRAFT amendment is rejected (409)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const original = await createClinicDraft(baseUrl);
    await fetch(clinicRecUrl(baseUrl, original._id, '/sign'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const amend = clinicRecUrl(baseUrl, original._id, '/amend');
    const opts = { method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }) };
    assert.equal((await fetch(amend, opts)).status, 201);
    assert.equal((await fetch(amend, opts)).status, 409);
  });
});

test('G. Cross-doctor access to a ClinicPatient consultation is rejected (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const created = await createClinicDraft(baseUrl);
    const cases = [
      ['PUT', '', { chiefComplaint: 'hack' }],
      ['POST', '/sign', undefined],
      ['POST', '/amend', undefined]
    ];
    for (const [method, suffix, payload] of cases) {
      const res = await fetch(
        clinicRecUrl(baseUrl, created._id, suffix, CLINIC_PATIENT_B),
        { method, headers: authHeader({ userId: DOCTOR_B_ID, role: 'DOCTOR' }),
          body: payload ? JSON.stringify(payload) : undefined }
      );
      assert.equal(res.status, 404, `${method} ${suffix || '(update)'}`);
    }
  });
});

test('H. Cross-patient access is rejected (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl }) => {
    const created = await createClinicDraft(baseUrl);
    const res = await fetch(
      clinicRecUrl(baseUrl, created._id, '', CLINIC_PATIENT_B),
      { headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }) }
    );
    assert.equal(res.status, 404);
  });
});

test('I. Consultation whose linked appointment no longer matches is rejected (404)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const created = await createClinicDraft(baseUrl);
    recs.find((r) => String(r._id) === String(created._id)).appointmentId = APPT_OTHER_DOC;
    const res = await fetch(clinicRecUrl(baseUrl, created._id), {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' }),
      body: JSON.stringify({ chiefComplaint: 'Should fail' })
    });
    assert.equal(res.status, 404);
  });
});

test('D3. SIGNED cannot be deleted (400); DRAFT delete works (200)', async () => {
  await withServer(baseSeed, async ({ baseUrl, recs }) => {
    const signed = await createClinicDraft(baseUrl);
    await fetch(clinicRecUrl(baseUrl, signed._id, '/sign'), {
      method: 'POST', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    const delSigned = await fetch(clinicRecUrl(baseUrl, signed._id), {
      method: 'DELETE', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(delSigned.status, 400);

    const before = recs.length;
    const draft = await createClinicDraft(baseUrl);
    const delDraft = await fetch(clinicRecUrl(baseUrl, draft._id), {
      method: 'DELETE', headers: authHeader({ userId: DOCTOR_A_ID, role: 'DOCTOR' })
    });
    assert.equal(delDraft.status, 200);
    assert.equal(recs.length, before, 'DRAFT removed from the store');
  });
});

