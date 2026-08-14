import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import {
  buildWorkerProfileUpdate,
  profileUpdateErrorResponse,
  REGISTRATION_GEOGRAPHY_FIELDS,
} from './userProfileUpdateService.js';

test('Worker profile updates retain allowed fields and reject registration geography payload fields', () => {
  const update = buildWorkerProfileUpdate({
    fullName: 'Updated Worker',
    location: 'Giza',
    skills: ['First Aid'],
    registrationIp: '8.8.8.8',
    registrationCountryCode: 'US',
    registrationCountryName: 'Fake',
    registrationLocationCapturedAt: '2000-01-01',
    role: 'ADMIN',
  });
  assert.deepEqual(update, { fullName: 'Updated Worker', location: 'Giza', skills: ['First Aid'] });
  for (const field of REGISTRATION_GEOGRAPHY_FIELDS) assert.equal(Object.hasOwn(update, field), false, field);
});

test('geography fields remain immutable at the Mongoose schema boundary', () => {
  for (const field of REGISTRATION_GEOGRAPHY_FIELDS) {
    assert.equal(User.schema.path(field).options.immutable, true, field);
    assert.equal(User.schema.path(field).options.select, false, field);
  }
});

test('Worker profile validation and cast failures return actionable 400 responses', () => {
  assert.equal(profileUpdateErrorResponse({ name: 'ValidationError', message: 'fullName is required' }).status, 400);
  assert.equal(profileUpdateErrorResponse({ name: 'CastError', message: 'bad id' }).status, 400);
  assert.equal(profileUpdateErrorResponse(new Error('database offline')).status, 500);
});
