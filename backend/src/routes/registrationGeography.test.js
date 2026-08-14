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
  assert.equal((await summary.json()).totalUsers, 2);
  assert.deepEqual((await users.json()).users, []);
}));

for (const role of ['SUPPORT', 'EMPLOYER', 'WORKER']) {
  test(`${role} cannot access registration geography endpoints`, async () => withServer(async (base) => {
    for (const path of ['/api/admin/registration-geography/summary', '/api/admin/registration-geography/users']) {
      assert.equal((await get(base, path, role)).status, 403, `${role}: ${path}`);
    }
  }));
}
