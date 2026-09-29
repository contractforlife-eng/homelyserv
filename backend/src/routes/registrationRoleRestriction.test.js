// backend/src/routes/registrationRoleRestriction.test.js
// Focused coverage for the public-registration role policy:
// WORKER, EMPLOYER and DOCTOR stay open; TEACHER/STUDENT are rejected
// before any user document is created, and so are the privileged roles
// ADMIN, SUPPORT and SUPPORT_HELPER.
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import User from '../models/User.js';
import authRouter from './auth.js';

const secret = 'registration-role-restriction-test-secret-2026';
process.env.JWT_SECRET = secret;

const withRegistrationServer = async (run) => {
  const originalUserFindOne = User.findOne;
  const originalUserSave = User.prototype.save;
  const savedRoles = [];

  User.findOne = async () => null; // Email not taken
  User.prototype.save = async function () {
    savedRoles.push(this.role);
    return this;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    await run(baseUrl, savedRoles);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    User.findOne = originalUserFindOne;
    User.prototype.save = originalUserSave;
  }
};

const postRegister = (baseUrl, payload) =>
  fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

const basePayload = (overrides = {}) => ({
  fullName: 'Registration Test User',
  password: 'Password123!',
  phone: '+971501234567',
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  ...overrides
});

// Roles that must NEVER be publicly self-registered. DOCTOR is deliberately
// absent: it is a first-class self-service account role.
const BLOCKED_ROLES = ['TEACHER', 'STUDENT'];

test('1. WORKER registration still succeeds and persists User.role === WORKER', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    const res = await postRegister(
      baseUrl,
      basePayload({
        fullName: 'Worker User',
        email: 'worker.allowed@homelyserv.test',
        role: 'WORKER',
        desiredJob: 'cleaner',
        hourlyRate: 50
      })
    );

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'WORKER');
    assert.deepStrictEqual(savedRoles, ['WORKER']);
  });
});

test('2. EMPLOYER registration still succeeds and persists User.role === EMPLOYER', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    const res = await postRegister(
      baseUrl,
      basePayload({
        fullName: 'Employer User',
        email: 'employer.allowed@homelyserv.test',
        role: 'EMPLOYER'
      })
    );

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'EMPLOYER');
    assert.deepStrictEqual(savedRoles, ['EMPLOYER']);
  });
});

test('3. DOCTOR registration succeeds, persists User.role === DOCTOR, and needs no extra field', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    // Exactly the standard public fields. No specialty, license, clinic,
    // consultation fee, address or verification document is required — the
    // Doctor Profile system collects those after the account exists.
    const res = await postRegister(
      baseUrl,
      basePayload({
        fullName: 'Doctor User',
        email: 'doctor.allowed@homelyserv.test',
        role: 'DOCTOR'
      })
    );

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'DOCTOR');
    assert.deepStrictEqual(savedRoles, ['DOCTOR']);

    // A self-registered Doctor is NOT privileged and NOT pre-verified.
    assert.notStrictEqual(data.user.role, 'ADMIN');
    assert.notStrictEqual(data.user.role, 'SUPPORT');
    assert.notStrictEqual(data.user.role, 'SUPPORT_HELPER');
  });
});

test('4. lowercase DOCTOR is accepted and normalised to DOCTOR', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    const res = await postRegister(
      baseUrl,
      basePayload({
        fullName: 'Doctor Lowercase User',
        email: 'doctor.lower@homelyserv.test',
        role: 'doctor'
      })
    );

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'DOCTOR');
    assert.deepStrictEqual(savedRoles, ['DOCTOR']);
  });
});

for (const [index, role] of BLOCKED_ROLES.entries()) {
  test(`5.${index + 1} ${role} registration is rejected with 400 and creates no user`, async () => {
    await withRegistrationServer(async (baseUrl, savedRoles) => {
      const res = await postRegister(
        baseUrl,
        basePayload({
          fullName: `${role} User`,
          email: `${role.toLowerCase()}.blocked@homelyserv.test`,
          role
        })
      );

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message, 'rejection must include a validation message');
      assert.deepStrictEqual(savedRoles, [], `${role} must not create a user document`);
    });
  });
}

test('6. Blocked roles are rejected case-insensitively before user creation', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    for (const [index, role] of BLOCKED_ROLES.entries()) {
      const res = await postRegister(
        baseUrl,
        basePayload({
          fullName: `${role} Lowercase User`,
          email: `${role.toLowerCase()}.lower@homelyserv.test`,
          role: role.toLowerCase()
        })
      );

      assert.strictEqual(res.status, 400, `${role} lowercase must be rejected`);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.deepStrictEqual(savedRoles, [], `${role} lowercase must not create a user document`);
    }
  });
});

test('7. Privileged roles (ADMIN, SUPPORT, SUPPORT_HELPER) remain rejected with 400 and create no user', async () => {
  await withRegistrationServer(async (baseUrl, savedRoles) => {
    for (const role of ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
      const res = await postRegister(
        baseUrl,
        basePayload({
          fullName: `${role} User`,
          email: `${role.toLowerCase()}.blocked@homelyserv.test`,
          role
        })
      );

      assert.strictEqual(res.status, 400, `${role} must not be publicly registerable`);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    }

    assert.deepStrictEqual(savedRoles, [], 'no user documents may be created for rejected roles');
  });
});
