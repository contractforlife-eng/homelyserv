import test from 'node:test';
import assert from 'node:assert/strict';
import { HIRE_USER_SELECT, projectHireUser } from './hireUserProjection.js';

test('hire User projection selects only public response fields', () => {
  assert.deepEqual(Object.keys(HIRE_USER_SELECT).sort(), [
    'city',
    'email',
    'fullName',
    'id',
    'phone',
    'profileImage',
  ]);

  assert.equal('password' in HIRE_USER_SELECT, false);
  assert.equal('registrationCountryCode' in HIRE_USER_SELECT, false);
  assert.equal('registrationCountryName' in HIRE_USER_SELECT, false);
  assert.equal('registrationIp' in HIRE_USER_SELECT, false);
  assert.equal('registrationLocationCapturedAt' in HIRE_USER_SELECT, false);
});

test('hire User projection drops future/internal scalar fields', () => {
  const projected = projectHireUser({
    id: 'user-1',
    fullName: 'Worker',
    email: 'worker@example.com',
    phone: '123',
    city: 'Cairo',
    profileImage: 'image.jpg',
    password: 'hashed-password',
    registrationCountryCode: 'EG',
    futureInternalField: 'must-not-leak',
  });

  assert.deepEqual(projected, {
    id: 'user-1',
    fullName: 'Worker',
    email: 'worker@example.com',
    phone: '123',
    city: 'Cairo',
    profileImage: 'image.jpg',
  });
  assert.equal('registrationCountryCode' in projected, false);
  assert.equal('futureInternalField' in projected, false);
});
