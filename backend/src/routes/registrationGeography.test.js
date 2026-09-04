import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createRegistrationGeographyRouter } from './registrationGeography.js';

const secret = 'registration-geography-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const withServer = async (run) => {
  const app = express();
  app.use('/api/admin/registration-geography', createRegistrationGeographyRouter({
    getSummary: async () => ({ totalUsers: 2, knownCountryUsers: 1, unknownCountryUsers: 1, countriesRepresented: 1, countries: [] }),
    getUsers: async () => ({ users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
  }));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve) => server.close(resolve)); }
};

const tokenFor = (role) => jwt.sign({ userId: `legacy-${role.toLowerCase()}`, role, tokenVersion: 0 }, secret);
const get = (base, path, role) => fetch(`${base}${path}`, { headers: { authorization: `Bearer ${tokenFor(role)}` } });

test('ADMIN can access geography summary and user table', async () => withServer(async (base) => {
  const summary = await get(base, '/api/admin/registration-geography/summary', 'ADMIN');
  const users = await get(base, '/api/admin/registration-geography/users', 'ADMIN');
  assert.equal(summary.status, 200);
  assert.equal(users.status, 200);
  const summaryData = await summary.json();
  const usersData = await users.json();
  assert.equal(summaryData.totalUsers, 2);
  assert.deepEqual(usersData.users, []);
  assert.equal(usersData.pagination.page, 1);
}));

test('SUPPORT (Sup-Admin) can access geography summary and user table', async () => withServer(async (base) => {
  const summary = await get(base, '/api/admin/registration-geography/summary', 'SUPPORT');
  const users = await get(base, '/api/admin/registration-geography/users', 'SUPPORT');
  assert.equal(summary.status, 200);
  assert.equal(users.status, 200);
  const summaryData = await summary.json();
  const usersData = await users.json();
  assert.equal(summaryData.totalUsers, 2);
  assert.deepEqual(usersData.users, []);
  assert.equal(usersData.pagination.page, 1);
}));

test('Unauthenticated requests receive 401', async () => withServer(async (base) => {
  for (const path of ['/api/admin/registration-geography/summary', '/api/admin/registration-geography/users']) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 401, `unauthenticated: ${path}`);
  }
}));

for (const role of ['SUPPORT_HELPER', 'EMPLOYER', 'WORKER']) {
  test(`${role} cannot access registration geography endpoints (403)`, async () => withServer(async (base) => {
    for (const path of ['/api/admin/registration-geography/summary', '/api/admin/registration-geography/users']) {
      assert.equal((await get(base, path, role)).status, 403, `${role}: ${path}`);
    }
  }));
}

test('Registration geography response contains approved analytics fields and does not expose sensitive fields', async () => {
  const sampleUser = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Test Agent',
    email: 'agent@example.com',
    role: 'SUPPORT_HELPER',
    registrationCountryName: 'Egypt',
    registrationCountryCode: 'EG',
    registrationIp: '197.35.20.1',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };
  const app = express();
  app.use('/api/admin/registration-geography', createRegistrationGeographyRouter({
    getSummary: async () => ({
      totalUsers: 1,
      knownCountryUsers: 1,
      unknownCountryUsers: 0,
      countriesRepresented: 1,
      countries: [{ countryCode: 'EG', countryName: 'Egypt', count: 1, percentage: 100 }],
    }),
    getUsers: async (query) => {
      const { page = 1, limit = 20, search, country, role } = query || {};
      let filtered = [sampleUser];
      if (role) filtered = filtered.filter(u => u.role === role);
      if (country) filtered = filtered.filter(u => u.registrationCountryCode === country);
      return {
        users: filtered.map(u => ({
          id: u._id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          registrationCountryName: u.registrationCountryName,
          registrationCountryCode: u.registrationCountryCode,
          registrationIp: u.registrationIp,
          createdAt: u.createdAt,
        })),
        pagination: { page: Number(page), limit: Number(limit), total: filtered.length, totalPages: 1 },
      };
    },
  }));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const res = await get(base, '/api/admin/registration-geography/users?role=SUPPORT_HELPER&country=EG&page=1&limit=10', 'SUPPORT');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.users.length, 1);
    const user = body.users[0];
    assert.equal(user.id, '507f1f77bcf86cd799439011');
    assert.equal(user.name, 'Test Agent');
    assert.equal(user.email, 'agent@example.com');
    assert.equal(user.role, 'SUPPORT_HELPER');
    assert.equal(user.registrationCountryCode, 'EG');
    assert.equal(user.registrationIp, '197.35.20.1');
    assert.equal(user.password, undefined);
    assert.equal(user.tokenVersion, undefined);
    assert.equal(user.resetPasswordToken, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
