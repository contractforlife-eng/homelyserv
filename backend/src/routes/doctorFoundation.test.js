// backend/src/routes/doctorFoundation.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import doctorsRouter from './doctors.js';
import authRouter from './auth.js';

const secret = 'doctor-foundation-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_ID = '507f1f77bcf86cd799439050';
const OTHER_DOCTOR_ID = '507f1f77bcf86cd799439051';
const WORKER_ID = '507f1f77bcf86cd799439052';
const EMPLOYER_ID = '507f1f77bcf86cd799439053';
const TEACHER_ID = '507f1f77bcf86cd799439054';
const STUDENT_ID = '507f1f77bcf86cd799439055';
const SUPPORT_ID = '507f1f77bcf86cd799439056';
const SUPPORT_HELPER_ID = '507f1f77bcf86cd799439057';

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

const createMockUser = (overrides = {}) => ({
  _id: DOCTOR_ID,
  fullName: 'Dr. Test Physician',
  email: 'doctor@homelyserv.test',
  role: 'DOCTOR',
  tokenVersion: 0,
  isSuspended: false,
  city: 'Dubai',
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  profileImage: '',
  isVerified: true,
  ...overrides
});

const withDoctorServer = async ({ mockUser = createMockUser(), initialProfile = null, initialClinics = [] } = {}, run) => {
  const originalUserFindById = User.findById;
  const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  const originalDoctorProfileFindOne = DoctorProfile.findOne;
  const originalDoctorProfileFindOneAndUpdate = DoctorProfile.findOneAndUpdate;
  const originalClinicFind = DoctorClinic.find;

  let currentProfile = initialProfile ? { ...initialProfile } : null;

  User.findById = (id) => {
    const idStr = String(id);
    if (idStr === DOCTOR_ID) {
      return wrapQuery(mockUser);
    }
    if (idStr === OTHER_DOCTOR_ID) {
      return wrapQuery(createMockUser({ _id: OTHER_DOCTOR_ID, email: 'otherdoctor@homelyserv.test' }));
    }
    if (idStr === WORKER_ID) {
      return wrapQuery(createMockUser({ _id: WORKER_ID, email: 'worker@homelyserv.test', role: 'WORKER' }));
    }
    if (idStr === EMPLOYER_ID) {
      return wrapQuery(createMockUser({ _id: EMPLOYER_ID, email: 'employer@homelyserv.test', role: 'EMPLOYER' }));
    }
    if (idStr === TEACHER_ID) {
      return wrapQuery(createMockUser({ _id: TEACHER_ID, email: 'teacher@homelyserv.test', role: 'TEACHER' }));
    }
    if (idStr === STUDENT_ID) {
      return wrapQuery(createMockUser({ _id: STUDENT_ID, email: 'student@homelyserv.test', role: 'STUDENT' }));
    }
    if (idStr === SUPPORT_ID) {
      return wrapQuery(createMockUser({ _id: SUPPORT_ID, email: 'support@homelyserv.test', role: 'SUPPORT' }));
    }
    if (idStr === SUPPORT_HELPER_ID) {
      return wrapQuery(createMockUser({ _id: SUPPORT_HELPER_ID, email: 'helper@homelyserv.test', role: 'SUPPORT_HELPER' }));
    }
    return wrapQuery(null);
  };

  User.findByIdAndUpdate = async (id, update) => {
    if (update?.$set?.profileImage !== undefined) {
      mockUser.profileImage = update.$set.profileImage;
    }
    return mockUser;
  };

  DoctorProfile.findOne = (query) => {
    if (query?.userId && currentProfile && String(query.userId) === String(currentProfile.userId)) {
      return Promise.resolve(currentProfile);
    }
    return Promise.resolve(null);
  };

  DoctorProfile.findOneAndUpdate = async (query, update, options) => {
    const userId = query.userId;
    const setFields = update.$set || {};
    if (!currentProfile) {
      currentProfile = {
        userId,
        professionalTitle: '',
        specialty: '',
        subspecialty: '',
        bio: '',
        yearsOfExperience: 0,
        languages: [],
        qualifications: [],
        licenseNumber: '',
        licenseAuthority: '',
        isPublished: false,
        searchVisibility: true,
        isProfileComplete: false,
        ...setFields
      };
    } else {
      currentProfile = {
        ...currentProfile,
        ...setFields
      };
    }
    return currentProfile;
  };

  // GET /api/doctors/profile also returns the Doctor's active clinics.
  DoctorClinic.find = (filter = {}) => {
    const matched = initialClinics.filter((clinic) => {
      if (filter.doctorId && String(clinic.doctorId) !== String(filter.doctorId)) return false;
      if (filter.isActive !== undefined && clinic.isActive !== filter.isActive) return false;
      return true;
    });
    const chain = {
      sort: () => chain,
      lean: () => Promise.resolve(matched)
    };
    return chain;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/doctors', doctorsRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`, () => currentProfile);
  } finally {
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    DoctorProfile.findOne = originalDoctorProfileFindOne;
    DoctorProfile.findOneAndUpdate = originalDoctorProfileFindOneAndUpdate;
    DoctorClinic.find = originalClinicFind;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('1. DOCTOR can fetch profile endpoint GET /api/doctors/profile successfully', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.email, 'doctor@homelyserv.test');
    assert.strictEqual(body.user.role, 'DOCTOR');
    assert.strictEqual(body.profile, null);
  });
});

test('2. DOCTOR can create and update profile via PUT /api/doctors/profile', async () => {
  await withDoctorServer({}, async (baseUrl, getProfile) => {
    const updateData = {
      professionalTitle: 'Consultant Cardiologist',
      specialty: 'cardiology',
      subspecialty: 'Interventional Cardiology',
      bio: 'Experienced cardiologist with 12 years of clinical practice.',
      yearsOfExperience: 12,
      languages: ['en', 'ar'],
      qualifications: ['MBBS', 'MD Cardiology'],
      licenseNumber: 'MD-12345',
      licenseAuthority: 'DHA',
      searchVisibility: true
    };

    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify(updateData)
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.profile.professionalTitle, 'Consultant Cardiologist');
    assert.strictEqual(body.profile.specialty, 'cardiology');
    assert.strictEqual(body.profile.yearsOfExperience, 12);
    assert.strictEqual(body.profile.isProfileComplete, true);
    assert.deepEqual(body.profile.languages, ['en', 'ar']);
  });
});

test('3. Rejects invalid specialty in PUT /api/doctors/profile', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({ specialty: 'FakeSpecialtyNotReal' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /invalid medical specialty/i);
  });
});

test('4. Rejects negative or excessive yearsOfExperience in PUT /api/doctors/profile', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const resNegative = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({ yearsOfExperience: -5 })
    });
    assert.strictEqual(resNegative.status, 400);

    const resExcessive = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({ yearsOfExperience: 95 })
    });
    assert.strictEqual(resExcessive.status, 400);
  });
});

test('5. Rejects non-string bio or bio exceeding 3000 chars', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const resTooLong = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({ bio: 'a'.repeat(3001) })
    });
    assert.strictEqual(resTooLong.status, 400);
  });
});

test('6. Sanitizes languages and qualifications arrays', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        languages: [' en ', 'ar', '', '   ', 'fr'],
        qualifications: [' MD ', ' PhD ', '   ']
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.profile.languages, ['en', 'ar', 'fr']);
    assert.deepEqual(body.profile.qualifications, ['MD', 'PhD']);
  });
});

test('7. requireDoctor middleware rejects WORKER role with 403', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /doctor role required/i);
  });
});

test('8. requireDoctor middleware rejects EMPLOYER role with 403', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: EMPLOYER_ID, role: 'EMPLOYER', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });
});

test('9. requireDoctor middleware rejects TEACHER role with 403', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: TEACHER_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });
});

test('10. requireDoctor middleware rejects STUDENT role with 403', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: STUDENT_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });
});

test('11. requireDoctor middleware rejects SUPPORT and SUPPORT_HELPER roles with 403', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res1 = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: SUPPORT_ID, role: 'SUPPORT', tokenVersion: 0 })
    });
    assert.strictEqual(res1.status, 403);

    const res2 = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: SUPPORT_HELPER_ID, role: 'SUPPORT_HELPER', tokenVersion: 0 })
    });
    assert.strictEqual(res2.status, 403);
  });
});

test('12. requireDoctor rejects unauthenticated requests with 401', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET'
    });
    assert.strictEqual(res.status, 401);
  });
});

test('13. Authenticated ownership: req.userId is always used regardless of body overrides', async () => {
  await withDoctorServer({}, async (baseUrl, getProfile) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        userId: OTHER_DOCTOR_ID, // attacker tries to update another doctor
        professionalTitle: 'Attacker Title',
        specialty: 'pediatrics'
      })
    });
    assert.strictEqual(res.status, 200);
    const saved = getProfile();
    // Saved record belongs to DOCTOR_ID, not OTHER_DOCTOR_ID
    assert.strictEqual(String(saved.userId), DOCTOR_ID);
  });
});

test('14. isProfileComplete becomes true only when required fields are present', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    // Incomplete: only professionalTitle
    const resIncomplete = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        professionalTitle: 'Dr.',
        specialty: '',
        bio: ''
      })
    });
    assert.strictEqual(resIncomplete.status, 200);
    const bodyInc = await resIncomplete.json();
    assert.strictEqual(bodyInc.profile.isProfileComplete, false);

    // Complete: title, canonical specialty, bio, yearsOfExperience, licenseNumber
    const resComplete = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        professionalTitle: 'Dr.',
        specialty: 'dermatology',
        bio: 'Board-certified dermatologist.',
        yearsOfExperience: 5,
        licenseNumber: 'LIC-9988'
      })
    });
    assert.strictEqual(resComplete.status, 200);
    const bodyComp = await resComplete.json();
    assert.strictEqual(bodyComp.profile.isProfileComplete, true);
  });
});

test('15. Profile image update syncs to User record', async () => {
  const mockUser = createMockUser();
  await withDoctorServer({ mockUser }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        profileImage: 'https://example.com/new-avatar.jpg'
      })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(mockUser.profileImage, 'https://example.com/new-avatar.jpg');
  });
});

test('16. DOCTOR public registration is rejected with 400 and creates no user', async () => {
  const originalUserSave = User.prototype.save;
  const originalUserFindOne = User.findOne;
  const savedRoles = [];

  User.findOne = async () => null; // Email not taken
  User.prototype.save = async function () {
    savedRoles.push(this.role);
    return this;
  };

  try {
    await withDoctorServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Dr. Jane Register',
          email: 'dr.jane@homelyserv.test',
          password: 'Password123!',
          role: 'DOCTOR',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /valid account role/i);
      assert.deepEqual(savedRoles, [], 'blocked DOCTOR registration must not create a user');

      // Existing DOCTOR accounts keep logging in with a DOCTOR role/token.
      const existingDoctor = createMockUser({
        _id: DOCTOR_ID,
        email: 'existing.doctor@homelyserv.test',
        role: 'DOCTOR',
        save: async function () { return this; },
        toObject() { return { ...this }; }
      });
      const loginUser = async () => existingDoctor;
      User.findOne = loginUser;

      const bcrypt = (await import('bcryptjs')).default;
      existingDoctor.password = await bcrypt.hash('DoctorPass123!', 10);

      const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'existing.doctor@homelyserv.test',
          password: 'DoctorPass123!'
        })
      });

      assert.strictEqual(resLogin.status, 200);
      const loginData = await resLogin.json();
      assert.strictEqual(loginData.user.role, 'DOCTOR');
      const decoded = jwt.verify(loginData.token, secret);
      assert.strictEqual(decoded.role, 'DOCTOR');
    });
  } finally {
    User.prototype.save = originalUserSave;
    User.findOne = originalUserFindOne;
  }
});

test('17. DOCTOR login returns DOCTOR role in user payload and JWT token', async () => {
  const originalUserFindOne = User.findOne;
  const originalUserSave = User.prototype.save;
  const bcrypt = (await import('bcryptjs')).default;
  const hashedPassword = await bcrypt.hash('DoctorPass123!', 10);

  const doctorDoc = createMockUser({
    _id: DOCTOR_ID,
    email: 'registered.doctor@homelyserv.test',
    password: hashedPassword,
    role: 'DOCTOR',
    save: async function () { return this; },
    toObject() { return { ...this }; }
  });

  User.findOne = async () => doctorDoc;
  User.prototype.save = async function () { return this; };

  try {
    await withDoctorServer({}, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'registered.doctor@homelyserv.test',
          password: 'DoctorPass123!'
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'DOCTOR');

      const decoded = jwt.verify(data.token, secret);
      assert.strictEqual(decoded.role, 'DOCTOR');
    });
  } finally {
    User.findOne = originalUserFindOne;
    User.prototype.save = originalUserSave;
  }
});

test('18. WORKER and EMPLOYER registration roles are preserved and STUDENT registration is rejected', async () => {
  const originalUserSave = User.prototype.save;
  const originalUserFindOne = User.findOne;
  const savedRoles = [];

  User.findOne = async () => null;
  User.prototype.save = async function () {
    savedRoles.push(this.role);
    return this;
  };

  try {
    await withDoctorServer({}, async (baseUrl) => {
      // 1. WORKER
      const resWorker = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Worker User',
          email: 'worker.reg@homelyserv.test',
          password: 'Password123!',
          role: 'WORKER',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates',
          desiredJob: 'cleaner',
          hourlyRate: 50
        })
      });
      assert.strictEqual(resWorker.status, 201);
      const dataWorker = await resWorker.json();
      assert.strictEqual(dataWorker.user.role, 'WORKER');

      // 2. EMPLOYER
      const resEmployer = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Employer User',
          email: 'employer.reg@homelyserv.test',
          password: 'Password123!',
          role: 'EMPLOYER',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });
      assert.strictEqual(resEmployer.status, 201);
      const dataEmployer = await resEmployer.json();
      assert.strictEqual(dataEmployer.user.role, 'EMPLOYER');

      // 3. STUDENT (public registration temporarily blocked)
      const resStudent = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Student User',
          email: 'student.reg@homelyserv.test',
          password: 'Password123!',
          role: 'STUDENT',
          phone: '+971501234567',
          countryCode: 'AE',
          countryName: 'United Arab Emirates'
        })
      });
      assert.strictEqual(resStudent.status, 400);
      const dataStudent = await resStudent.json();
      assert.strictEqual(dataStudent.success, false);
      assert.match(dataStudent.message, /valid account role/i);

      assert.deepEqual(savedRoles, ['WORKER', 'EMPLOYER']);
    });
  } finally {
    User.prototype.save = originalUserSave;
    User.findOne = originalUserFindOne;
  }
});

test('19. Unsupported registration role is rejected with 400', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Invalid Role User',
        email: 'invalid@homelyserv.test',
        password: 'Password123!',
        role: 'SUPERMAN',
        phone: '+971501234567',
        countryCode: 'AE',
        countryName: 'United Arab Emirates'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.message, /valid account role/i);
  });
});

test('20. Authentication middleware attaches req.userRole === DOCTOR and requireDoctor allows only DOCTOR', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    // DOCTOR succeeds (200)
    const resDoctor = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 })
    });
    assert.strictEqual(resDoctor.status, 200);

    // WORKER receives 403
    const resWorker = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: WORKER_ID, role: 'WORKER', tokenVersion: 0 })
    });
    assert.strictEqual(resWorker.status, 403);
  });
});


test('21. Doctor profile persists education, certifications and additional specialties', async () => {
  await withDoctorServer({}, async (baseUrl, getProfile) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({
        professionalTitle: 'Consultant Pediatrician',
        specialty: 'pediatrics',
        additionalSpecialties: ['physiotherapy', 'other'],
        experienceSummary: '10 years of paediatric practice.',
        education: [' MBBCh, Cairo University, 2010 ', '   '],
        certifications: [' Board Certified Pediatrics, 2016 ']
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.profile.education, ['MBBCh, Cairo University, 2010']);
    assert.deepStrictEqual(body.profile.certifications, ['Board Certified Pediatrics, 2016']);
    assert.deepStrictEqual(body.profile.additionalSpecialties, ['physiotherapy', 'other']);
    assert.strictEqual(body.profile.experienceSummary, '10 years of paediatric practice.');
    assert.strictEqual(getProfile().specialty, 'pediatrics');
  });
});

test('22. Additional specialties must use the canonical doctor specialty taxonomy', async () => {
  await withDoctorServer({}, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'PUT',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }),
      body: JSON.stringify({ additionalSpecialties: ['psychotherapist', 'plumber'] })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /invalid medical specialty/i);
  });
});

test('23. Psychotherapist remains a Doctor specialty and is never a Worker job type', async () => {
  const { CANONICAL_DOCTOR_SPECIALTIES } = await import('../constants/doctorSpecialties.js');
  assert.ok(CANONICAL_DOCTOR_SPECIALTIES.includes('psychotherapist'));
  assert.strictEqual(CANONICAL_DOCTOR_SPECIALTIES.at(-1), 'other', '"other" must remain the final option');
});

test('24. GET /api/doctors/profile returns the Doctor active clinics', async () => {
  const clinics = [{
    _id: '507f1f77bcf86cd799439080',
    doctorId: DOCTOR_ID,
    clinicName: 'City Hospital',
    phone: '+971500000000',
    email: 'clinic@example.test',
    addressLine: '1 Main St',
    city: 'Dubai',
    stateOrProvince: 'Dubai',
    countryCode: 'AE',
    postalCode: '00000',
    timezone: 'GST',
    instructions: '',
    isActive: true,
    isPrimary: true
  }];

  await withDoctorServer({ initialClinics: clinics }, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/doctors/profile`, {
      method: 'GET',
      headers: authHeader({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.user.role, 'DOCTOR');
    assert.strictEqual(body.clinics.length, 1);
    assert.strictEqual(body.clinics[0].clinicName, 'City Hospital');
    assert.strictEqual(body.clinics[0].isPrimary, true);
  });
});
