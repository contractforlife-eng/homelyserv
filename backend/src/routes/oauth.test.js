import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import oauthRouter from './oauth.js';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtSecret.js';

const withOAuthServer = async (run) => {
  const originalUserFindOne = User.findOne;
  const originalUserSave = User.prototype.save;
  const savedUsers = [];

  User.findOne = async () => null; // Email not taken
  User.prototype.save = async function () {
    savedUsers.push(this);
    return this;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/oauth', oauthRouter);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    await run(baseUrl, savedUsers);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    User.findOne = originalUserFindOne;
    User.prototype.save = originalUserSave;
  }
};

const createValidOnboardingToken = (overrides = {}) => {
  return jwt.sign(
    {
      purpose: 'social_onboarding',
      provider: 'google',
      email: 'test.social.user@example.com',
      fullName: 'Social User',
      profileImage: 'https://example.com/photo.jpg',
      registrationCountryCode: 'AE',
      registrationCountryName: 'United Arab Emirates',
      registrationLocationCapturedAt: new Date(),
      ...overrides,
    },
    getJwtSecret(),
    { expiresIn: '15m' }
  );
};

const postOnboardingComplete = (baseUrl, body) =>
  fetch(`${baseUrl}/api/oauth/social-onboarding/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('Google onboarding accepts all five public registration roles', async () => {
  await withOAuthServer(async (baseUrl, savedUsers) => {
    const publicRoles = [
      { role: 'WORKER', extra: { desiredJob: 'cleaner', hourlyRate: 40 } },
      { role: 'EMPLOYER', extra: {} },
      { role: 'DOCTOR', extra: {} },
      { role: 'TEACHER', extra: {} },
      { role: 'STUDENT', extra: {} },
    ];

    for (const { role, extra } of publicRoles) {
      const token = createValidOnboardingToken({ email: `${role.toLowerCase()}@example.com` });
      const res = await postOnboardingComplete(baseUrl, {
        onboardingToken: token,
        role,
        countryCode: 'AE',
        phone: '+971501234567',
        ...extra,
      });

      assert.strictEqual(res.status, 201, `Role ${role} should be accepted with 201`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, role);
    }

    assert.strictEqual(savedUsers.length, 5);
    assert.deepStrictEqual(savedUsers.map(u => u.role), ['WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT']);
  });
});

test('Google onboarding rejects administrative and non-public roles', async () => {
  await withOAuthServer(async (baseUrl, savedUsers) => {
    const forbiddenRoles = ['ADMIN', 'SUPPORT', 'SUPPORT_HELPER', 'RANDOM_ROLE', ''];

    for (const role of forbiddenRoles) {
      const token = createValidOnboardingToken({ email: `forbidden_${role || 'empty'}@example.com` });
      const res = await postOnboardingComplete(baseUrl, {
        onboardingToken: token,
        role,
        countryCode: 'AE',
        phone: '+971501234567',
      });

      assert.strictEqual(res.status, 400, `Role ${role} should be rejected with 400`);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /valid account role/i);
    }

    assert.strictEqual(savedUsers.length, 0, 'No user should be created for forbidden roles');
  });
});

test('Google onboarding enforces worker-specific validations only for WORKER', async () => {
  await withOAuthServer(async (baseUrl, savedUsers) => {
    // Missing desiredJob for WORKER -> 400
    const workerToken = createValidOnboardingToken({ email: 'worker_invalid@example.com' });
    const resWorker = await postOnboardingComplete(baseUrl, {
      onboardingToken: workerToken,
      role: 'WORKER',
      countryCode: 'AE',
      phone: '+971501234567',
    });
    assert.strictEqual(resWorker.status, 400);

    // DOCTOR / TEACHER / STUDENT do not require desiredJob or hourlyRate -> 201
    const doctorToken = createValidOnboardingToken({ email: 'doctor_valid@example.com' });
    const resDoctor = await postOnboardingComplete(baseUrl, {
      onboardingToken: doctorToken,
      role: 'DOCTOR',
      countryCode: 'AE',
      phone: '+971501234567',
    });
    assert.strictEqual(resDoctor.status, 201);
  });
});
