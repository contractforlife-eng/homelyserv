import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import User from '../models/User.js';
import ParentStudent from '../models/ParentStudent.js';
import StudentLocationObservation from '../models/StudentLocationObservation.js';
import StudentTrackingSetting from '../models/StudentTrackingSetting.js';
import StudentProfile from '../models/StudentProfile.js';
import parentStudentRouter from './parentStudents.js';
import {
  buildRouteSegments,
  cleanupStudentHistory,
  FREE_RETENTION_DAYS,
  getRetentionWindow,
  getUtcDayRange,
  isDateWithinRetention,
  isValidTimeZone,
  PREMIUM_RETENTION_DAYS,
  validateObservation
} from '../services/familyTrackingService.js';
import {
  createFamilyTrackingRateLimit,
  resetFamilyTrackingRateLimitsForTests
} from '../middleware/familyTrackingRateLimit.js';

const JWT_SECRET = 'family-tracking-test-secret-2026-secure';
process.env.JWT_SECRET = JWT_SECRET;
const GUARDIAN_ID = '64a000000000000000000001';
const PREMIUM_GUARDIAN_ID = '64a000000000000000000002';
const STUDENT_ID = '64a000000000000000000011';
const OTHER_STUDENT_ID = '64a000000000000000000012';
const OBSERVATION_ID = '550e8400-e29b-41d4-a716-446655440000';

const makeQuery = (value) => {
  const query = {
    select() { return query; },
    sort() { return query; },
    limit() { return query; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
  };
  return query;
};

const users = new Map([
  [GUARDIAN_ID, { _id: GUARDIAN_ID, role: 'EMPLOYER', tokenVersion: 0, isSuspended: false }],
  [PREMIUM_GUARDIAN_ID, { _id: PREMIUM_GUARDIAN_ID, role: 'DOCTOR', tokenVersion: 0, isSuspended: false }],
  [STUDENT_ID, { _id: STUDENT_ID, role: 'STUDENT', tokenVersion: 0, isSuspended: false }],
  [OTHER_STUDENT_ID, { _id: OTHER_STUDENT_ID, role: 'STUDENT', tokenVersion: 0, isSuspended: false }]
]);
let activeGuardianIds = new Set([GUARDIAN_ID]);
let trackingSetting = null;
let observations = [];

User.findOneAndUpdate = () => Promise.resolve({});
User.findById = (id) => makeQuery(users.get(String(id)) || null);
StudentProfile.findOne = () => makeQuery({ dateOfBirth: null });
ParentStudent.findOne = ({ parentUserId, studentUserId, relationshipStatus }) => {
  const active = String(studentUserId) === STUDENT_ID
    && relationshipStatus === 'ACTIVE'
    && (parentUserId == null ? activeGuardianIds.size > 0 : activeGuardianIds.has(String(parentUserId)));
  return makeQuery(active ? { _id: '64a000000000000000000099', parentUserId, studentUserId, relationshipStatus } : null);
};
StudentTrackingSetting.findOne = () => {
  if (!trackingSetting) return makeQuery(null);
  trackingSetting.save = async () => { trackingSetting = { ...trackingSetting }; return trackingSetting; };
  return makeQuery(trackingSetting);
};
StudentTrackingSetting.findOneAndUpdate = (_filter, update) => {
  const values = update.$set || update;
  trackingSetting = { studentUserId: STUDENT_ID, ...trackingSetting, ...values };
  return makeQuery(trackingSetting);
};
StudentTrackingSetting.updateOne = async (_filter, update) => {
  trackingSetting = { studentUserId: STUDENT_ID, ...trackingSetting, ...(update.$set || update) };
  return { modifiedCount: 1 };
};
StudentLocationObservation.findOne = (filter) => {
  const cutoff = filter.recordedAt?.$gte?.getTime?.() ?? Number.NEGATIVE_INFINITY;
  const latest = observations
    .filter((row) => String(row.studentUserId) === String(filter.studentUserId) && new Date(row.recordedAt).getTime() >= cutoff)
    .sort((first, second) => new Date(second.recordedAt) - new Date(first.recordedAt))[0] || null;
  return makeQuery(latest);
};
StudentLocationObservation.bulkWrite = async (operations) => {
  let upsertedCount = 0;
  for (const operation of operations) {
    const { filter, update } = operation.updateOne;
    if (!observations.some((row) => row.observationId === filter.observationId && String(row.studentUserId) === String(filter.studentUserId))) {
      observations.push({ _id: `row-${observations.length + 1}`, ...update.$setOnInsert });
      upsertedCount += 1;
    }
  }
  return { upsertedCount };
};

const app = express();
app.use(express.json());
app.use('/api/parent-students', parentStudentRouter);
const server = http.createServer(app);

const authHeader = (userId, role) => ({
  authorization: `Bearer ${jwt.sign({ userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' })}`,
  'content-type': 'application/json'
});

const request = async (method, path, headers = {}, body = null) => new Promise((resolve, reject) => {
  const address = server.address();
  const req = http.request({ host: '127.0.0.1', port: address.port, path, method, headers }, (res) => {
    let raw = '';
    res.on('data', (chunk) => { raw += chunk; });
    res.on('end', () => resolve({
      status: res.statusCode,
      headers: res.headers,
      body: raw ? JSON.parse(raw) : null
    }));
  });
  req.on('error', reject);
  if (body) req.write(JSON.stringify(body));
  req.end();
});

test('Family Tracking route security and activation state machine', async (t) => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  await t.test('unauthenticated requests are rejected and never cacheable', async () => {
    const response = await request('GET', `/api/parent-students/${STUDENT_ID}/tracking/current`);
    assert.equal(response.status, 401);
    assert.match(response.headers['cache-control'], /no-store/);
  });

  await t.test('wrong student cannot submit another student location', async () => {
    const response = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/observations`,
      authHeader(OTHER_STUDENT_ID, 'STUDENT'),
      { observationId: OBSERVATION_ID, latitude: 30, longitude: 31, accuracy: 5, recordedAt: new Date().toISOString() }
    );
    assert.equal(response.status, 403);
  });

  await t.test('activation requires an active guardian', async () => {
    activeGuardianIds = new Set();
    const response = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/request`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { consentVersion: 'family-tracking-v1', timeZone: 'Africa/Cairo', platform: 'android' }
    );
    assert.equal(response.status, 409);
    assert.equal(response.body.code, 'NO_ACTIVE_GUARDIAN');
  });

  await t.test('visible activation request cannot enable collection before native and age verification', async () => {
    activeGuardianIds = new Set([GUARDIAN_ID]);
    const response = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/request`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { consentVersion: 'family-tracking-v1', timeZone: 'Africa/Cairo', platform: 'android' }
    );
    assert.equal(response.status, 202);
    assert.equal(response.body.activationState, 'AWAITING_AGE_SAFEGUARD');
    assert.equal(response.body.collectionEnabled, false);
  });

  await t.test('client permission claim remains unverified and collection stays disabled', async () => {
    const response = await request(
      'PUT', `/api/parent-students/${STUDENT_ID}/tracking/status`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { permissionStatus: 'GRANTED_BACKGROUND', platform: 'android' }
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.activationState, 'AWAITING_NATIVE_VERIFICATION');
    assert.equal(response.body.collectionEnabled, false);
  });

  await t.test('tracking-disabled submissions are rejected', async () => {
    const response = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/observations`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { observationId: OBSERVATION_ID, latitude: 30, longitude: 31, accuracy: 5, recordedAt: new Date().toISOString() }
    );
    assert.equal(response.status, 409);
    assert.equal(response.body.code, 'TRACKING_NOT_ACTIVE');
  });

  await t.test('permission revocation pauses collection', async () => {
    trackingSetting = {
      ...trackingSetting,
      activationState: 'ACTIVE', collectionEnabled: true,
      nativePermissionVerifiedAt: new Date(), ageSafeguardStatus: 'VERIFIED_ADULT'
    };
    const response = await request(
      'PUT', `/api/parent-students/${STUDENT_ID}/tracking/status`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { permissionStatus: 'DENIED', platform: 'android' }
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.activationState, 'PAUSED');
    assert.equal(trackingSetting.collectionEnabled, false);
  });

  await t.test('guardian safeguard and one-time native key proof activate collection', async () => {
    trackingSetting = { ...trackingSetting, consentAt: new Date(), ageSafeguardStatus: 'REQUIRED', activationState: 'AWAITING_AGE_SAFEGUARD' };
    const approval = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/guardian-approve`,
      authHeader(GUARDIAN_ID, 'EMPLOYER'), {}
    );
    assert.equal(approval.status, 200);
    assert.equal(approval.body.ageSafeguardStatus, 'GUARDIAN_APPROVED');

    const activation = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/request`,
      authHeader(STUDENT_ID, 'STUDENT'),
      { consentVersion: 'family-tracking-v1', timeZone: 'Africa/Cairo', platform: 'android' }
    );
    assert.equal(activation.body.activationState, 'AWAITING_NATIVE_VERIFICATION');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const exportedPublicKey = publicKey.export({ type: 'spki', format: 'pem' });
    const proofPayload = `android-native-v1\n${STUDENT_ID}\n${activation.body.challenge}\nGRANTED_BACKGROUND`;
    const signature = crypto.sign('sha256', Buffer.from(proofPayload), privateKey).toString('base64');
    const completed = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1', challenge: activation.body.challenge,
        permissionStatus: 'GRANTED_BACKGROUND', publicKey: exportedPublicKey, signature
      }
    );
    assert.equal(completed.status, 200);
    assert.equal(completed.body.activationState, 'ACTIVE');
    assert.equal(trackingSetting.collectionEnabled, true);

    const replay = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1', challenge: activation.body.challenge,
        permissionStatus: 'GRANTED_BACKGROUND', publicKey: exportedPublicKey, signature
      }
    );
    assert.equal(replay.status, 409);

    // Verify invalid/forged certificate chain is rejected
    const badAttestation = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1', challenge: activation.body.challenge,
        permissionStatus: 'GRANTED_BACKGROUND', publicKey: exportedPublicKey, signature,
        certificateChain: ['not-a-valid-cert', 'also-not-valid']
      }
    );
    assert.ok([403, 409].includes(badAttestation.status));
  });

  await t.test('production rejects with 503 by default and requires certificateChain when ENABLE_ANDROID_KEY_ATTESTATION=true', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_ANDROID_KEY_ATTESTATION;
    process.env.SHADOW_ATTESTATION_PILOT_ENABLED = 'true';
    process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS = STUDENT_ID;

    // Set setting in AWAITING_NATIVE_VERIFICATION
    trackingSetting = {
      ...trackingSetting,
      activationState: 'AWAITING_NATIVE_VERIFICATION',
      ageSafeguardStatus: 'VERIFIED_ADULT',
      collectionEnabled: false,
      activationChallengeHash: crypto.createHash('sha256').update('prod-challenge-xyz').digest('hex'),
      activationChallengeExpiresAt: new Date(Date.now() + 600000)
    };

    const response = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1',
        challenge: 'prod-challenge-xyz',
        permissionStatus: 'GRANTED_BACKGROUND',
        publicKey: 'pubKey',
        signature: 'sig',
        certificateChain: ['certA', 'certB']
      }
    );

    // Assert that HTTP 503 guard is strictly preserved when gate is OFF
    assert.equal(response.status, 503);
    assert.equal(response.body.code, 'PRODUCTION_DEVICE_ATTESTATION_REQUIRED');
    assert.equal(response.body.message, 'Production activation requires an approved Android app-attestation provider');
    assert.equal(trackingSetting.activationState, 'AWAITING_NATIVE_VERIFICATION');
    assert.equal(trackingSetting.collectionEnabled, false);

    // Now enable attestation gate in production and verify it requires certificateChain
    process.env.ENABLE_ANDROID_KEY_ATTESTATION = 'true';

    const testChallenge = 'prod-challenge-xyz';
    const resetSetting = () => {
      trackingSetting = {
        ...trackingSetting,
        activationState: 'AWAITING_NATIVE_VERIFICATION',
        ageSafeguardStatus: 'VERIFIED_ADULT',
        collectionEnabled: false,
        activationChallengeHash: crypto.createHash('sha256').update(testChallenge).digest('hex'),
        activationChallengeExpiresAt: new Date(Date.now() + 600000),
        nativePublicKey: null
      };
    };

    // 1. Missing certificateChain -> 403 HARDWARE_ATTESTATION_REQUIRED
    resetSetting();
    const missingChainResponse = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1',
        challenge: testChallenge,
        permissionStatus: 'GRANTED_BACKGROUND',
        publicKey: 'pubKey',
        signature: 'sig'
      }
    );
    assert.equal(missingChainResponse.status, 403);
    assert.equal(missingChainResponse.body.code, 'HARDWARE_ATTESTATION_REQUIRED');

    // 2. Empty certificateChain -> 403 HARDWARE_ATTESTATION_REQUIRED
    resetSetting();
    const emptyChainResponse = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1',
        challenge: testChallenge,
        permissionStatus: 'GRANTED_BACKGROUND',
        publicKey: 'pubKey',
        signature: 'sig',
        certificateChain: []
      }
    );
    assert.equal(emptyChainResponse.status, 403);
    assert.equal(emptyChainResponse.body.code, 'HARDWARE_ATTESTATION_REQUIRED');

    // 3. Invalid/untrusted chain -> 403 ATTESTATION_VERIFICATION_FAILED
    resetSetting();
    const invalidChainResponse = await request(
      'POST', `/api/parent-students/${STUDENT_ID}/tracking/activation/native-complete`,
      authHeader(STUDENT_ID, 'STUDENT'),
      {
        proofVersion: 'android-native-v1',
        challenge: testChallenge,
        permissionStatus: 'GRANTED_BACKGROUND',
        publicKey: 'pubKey',
        signature: 'sig',
        certificateChain: ['not-a-valid-cert', 'still-not-valid']
      }
    );
    assert.equal(invalidChainResponse.status, 403);
    assert.equal(invalidChainResponse.body.code, 'MALFORMED_CERTIFICATE');

    // Tracking still disabled and unactivated
    assert.equal(trackingSetting.activationState, 'AWAITING_NATIVE_VERIFICATION');
    assert.equal(trackingSetting.collectionEnabled, false);

    // Reset env
    process.env.NODE_ENV = oldEnv;
    delete process.env.ENABLE_ANDROID_KEY_ATTESTATION;
    delete process.env.SHADOW_ATTESTATION_PILOT_ENABLED;
    delete process.env.SHADOW_ATTESTATION_PILOT_STUDENT_IDS;
  });

  await t.test('idempotent observation UUID prevents retry duplicates', async () => {
    trackingSetting = {
      ...trackingSetting,
      activationState: 'ACTIVE', collectionEnabled: true,
      nativePermissionVerifiedAt: new Date(), ageSafeguardStatus: 'VERIFIED_ADULT',
      reportedPermissionStatus: 'GRANTED_WHILE_IN_USE'
    };
    observations = [];
    const payload = { observationId: OBSERVATION_ID, latitude: 30, longitude: 31, accuracy: 5, recordedAt: new Date().toISOString() };
    const first = await request('POST', `/api/parent-students/${STUDENT_ID}/tracking/observations`, authHeader(STUDENT_ID, 'STUDENT'), payload);
    const retry = await request('POST', `/api/parent-students/${STUDENT_ID}/tracking/observations`, authHeader(STUDENT_ID, 'STUDENT'), payload);
    assert.equal(first.status, 201);
    assert.equal(first.body.acceptedCount, 1);
    assert.equal(retry.body.acceptedCount, 0);
    assert.equal(retry.body.duplicateCount, 1);
    assert.equal(observations.length, 1);
  });

  await t.test('relationship revocation immediately removes guardian access', async () => {
    activeGuardianIds = new Set();
    const response = await request('GET', `/api/parent-students/${STUDENT_ID}/tracking/current`, authHeader(GUARDIAN_ID, 'EMPLOYER'));
    assert.equal(response.status, 403);
  });
});

test('strict GPS validation rejects coercible and non-finite values', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const valid = { observationId: OBSERVATION_ID, latitude: 30, longitude: 31, accuracy: 5, recordedAt: now.toISOString() };
  assert.equal(validateObservation(valid, now).valid, true);
  for (const invalid of [null, undefined, '', false, Number.NaN, Number.POSITIVE_INFINITY, '30']) {
    assert.equal(validateObservation({ ...valid, latitude: invalid }, now).valid, false);
    assert.equal(validateObservation({ ...valid, accuracy: invalid }, now).valid, false);
  }
  assert.equal(validateObservation({ ...valid, speed: '1' }, now).valid, false);
  assert.equal(validateObservation({ ...valid, heading: true }, now).valid, false);
  assert.equal(validateObservation({ ...valid, latitude: 91 }, now).valid, false);
  assert.equal(validateObservation({ ...valid, recordedAt: '2026-10-22T12:06:00Z' }, now).valid, false);
});

test('student-local calendar boundaries and plan windows are deterministic', () => {
  const now = new Date('2026-10-21T22:30:00Z');
  assert.equal(isValidTimeZone('Africa/Cairo'), true);
  assert.equal(isValidTimeZone('Not/AZone'), false);
  const cairoDay = getUtcDayRange('2026-10-22', 'Africa/Cairo');
  assert.equal(cairoDay.start.toISOString(), '2026-10-21T21:00:00.000Z');
  assert.equal(cairoDay.end.toISOString(), '2026-10-22T21:00:00.000Z');
  assert.equal(getRetentionWindow(false, now, 'Africa/Cairo').retentionDays, FREE_RETENTION_DAYS);
  assert.equal(getRetentionWindow(true, now, 'Africa/Cairo').retentionDays, PREMIUM_RETENTION_DAYS);
  assert.equal(isDateWithinRetention('2026-10-20', false, now, 'Africa/Cairo'), true);
  assert.equal(isDateWithinRetention('2026-10-19', false, now, 'Africa/Cairo'), false);
});

test('route segmentation breaks poor accuracy, long gaps, and implausible speed', () => {
  const points = [
    { id: 'start', latitude: 30, longitude: 31, accuracy: 8, recordedAt: '2026-10-22T10:00:00Z' },
    { id: 'jump', latitude: 30.1, longitude: 31.1, accuracy: 8, recordedAt: '2026-10-22T10:00:05Z' },
    { id: 'poor', latitude: 30.11, longitude: 31.11, accuracy: 500, recordedAt: '2026-10-22T10:01:00Z' },
    { id: 'late', latitude: 30.12, longitude: 31.12, accuracy: 8, recordedAt: '2026-10-22T11:00:00Z' }
  ];
  assert.deepEqual(buildRouteSegments(points).map((segment) => segment.map((point) => point.id)), [['start'], ['jump'], ['late']]);
  assert.deepEqual(buildRouteSegments([]), []);
});

test('observation quota counts records and expired limiter keys can be reset', () => {
  resetFamilyTrackingRateLimitsForTests();
  const middleware = createFamilyTrackingRateLimit({ windowMs: 60_000, maximum: 3, cost: (req) => req.body.observations.length });
  const response = { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json() { return this; } };
  let allowed = 0;
  middleware({ userId: STUDENT_ID, method: 'POST', baseUrl: '/api', path: '/tracking', body: { observations: [{}, {}] } }, response, () => { allowed += 1; });
  middleware({ userId: STUDENT_ID, method: 'POST', baseUrl: '/api', path: '/tracking', body: { observations: [{}, {}] } }, response, () => { allowed += 1; });
  assert.equal(allowed, 1);
  assert.equal(response.statusCode, 429);

  resetFamilyTrackingRateLimitsForTests();
  const requestLimiter = createFamilyTrackingRateLimit({ windowMs: 60_000, maximum: 1 });
  response.statusCode = 200;
  requestLimiter({ userId: GUARDIAN_ID, method: 'GET', baseUrl: '/api', path: '/tracking/status', body: {} }, response, () => { allowed += 1; });
  requestLimiter({ userId: GUARDIAN_ID, method: 'GET', baseUrl: '/api', path: '/tracking/status', body: {} }, response, () => { allowed += 1; });
  assert.equal(response.statusCode, 429);
});

test('cleanup deletes all data without guardians and preserves Premium boundary', async () => {
  const originalFind = ParentStudent.find;
  const originalSettingFind = StudentTrackingSetting.findOne;
  const originalObservationFind = StudentLocationObservation.find;
  const originalDeleteMany = StudentLocationObservation.deleteMany;
  const originalRelationshipFindOne = ParentStudent.findOne;
  let deletedIds = [];
  ParentStudent.findOne = () => makeQuery(null);
  ParentStudent.find = () => makeQuery([]);
  StudentTrackingSetting.findOne = () => makeQuery({ timeZone: 'Africa/Cairo' });
  StudentLocationObservation.find = () => makeQuery([{ _id: 'old-1' }, { _id: 'old-2' }]);
  StudentLocationObservation.deleteMany = async ({ _id }) => { deletedIds = _id.$in; return { deletedCount: deletedIds.length }; };
  try {
    const result = await cleanupStudentHistory(STUDENT_ID, new Date('2026-10-22T12:00:00Z'));
    assert.equal(result.deletedCount, 2);
    assert.deepEqual(deletedIds, ['old-1', 'old-2']);

    ParentStudent.find = () => makeQuery([
      { parentUserId: GUARDIAN_ID },
      { parentUserId: PREMIUM_GUARDIAN_ID }
    ]);
    let resolvedIds = [];
    await cleanupStudentHistory(STUDENT_ID, new Date('2026-10-22T12:00:00Z'), {
      resolvePremiumUserIds: async (ids) => { resolvedIds = ids; return new Set([PREMIUM_GUARDIAN_ID]); }
    });
    assert.deepEqual(resolvedIds.sort(), [GUARDIAN_ID, PREMIUM_GUARDIAN_ID].sort());
  } finally {
    ParentStudent.find = originalFind;
    ParentStudent.findOne = originalRelationshipFindOne;
    StudentTrackingSetting.findOne = originalSettingFind;
    StudentLocationObservation.find = originalObservationFind;
    StudentLocationObservation.deleteMany = originalDeleteMany;
  }
});

test('cleanup fails closed when Premium entitlement cannot be resolved', async () => {
  const originalFind = ParentStudent.find;
  const originalSettingFind = StudentTrackingSetting.findOne;
  const originalObservationFind = StudentLocationObservation.find;
  let queriedObservations = false;
  ParentStudent.find = () => makeQuery([{ parentUserId: GUARDIAN_ID }]);
  StudentTrackingSetting.findOne = () => makeQuery({ timeZone: 'Africa/Cairo' });
  StudentLocationObservation.find = () => {
    queriedObservations = true;
    return makeQuery([]);
  };
  try {
    await assert.rejects(
      cleanupStudentHistory(STUDENT_ID, new Date('2026-10-22T12:00:00Z'), {
        resolvePremiumUserIds: async () => { throw new Error('subscription unavailable'); }
      }),
      /subscription unavailable/
    );
    assert.equal(queriedObservations, false);
  } finally {
    ParentStudent.find = originalFind;
    StudentTrackingSetting.findOne = originalSettingFind;
    StudentLocationObservation.find = originalObservationFind;
  }
});
