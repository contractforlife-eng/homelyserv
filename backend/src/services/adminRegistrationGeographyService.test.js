import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import {
  getRegistrationGeographySummary,
  getRegistrationGeographyUsers,
  parseGeographyUserQuery,
} from './adminRegistrationGeographyService.js';

test('legacy user without registration metadata remains valid', async () => {
  const legacy = new User({ fullName: 'Legacy User', email: 'legacy@example.com', password: 'hashed' });
  await legacy.validate();
  assert.equal(legacy.registrationCountryCode, null);
  assert.equal(legacy.registrationIp, null);
});

test('registration geography fields are immutable and hidden outside explicit admin selection', () => {
  for (const field of ['registrationIp', 'registrationCountryCode', 'registrationCountryName', 'registrationLocationCapturedAt']) {
    assert.equal(User.schema.path(field).options.immutable, true, field);
    assert.equal(User.schema.path(field).options.select, false, field);
  }
  assert.equal(User.schema.path('registrationCountryCode').options.index, true);
  assert.equal(User.schema.path('registrationIp').options.index, undefined);
});

test('summary maps MongoDB aggregation counts, percentages, and Unknown users correctly', async () => {
  let pipeline;
  const UserModel = { aggregate: async (value) => {
    pipeline = value;
    return [{ totals: [{ totalUsers: 10, knownCountryUsers: 7 }], countries: [
      { _id: { countryCode: 'EG', countryName: 'Egypt' }, count: 4 },
      { _id: { countryCode: 'DE', countryName: 'Germany' }, count: 3 },
    ] }];
  } };
  const result = await getRegistrationGeographySummary(UserModel);
  assert.ok(pipeline[0].$facet, 'uses MongoDB aggregation facets');
  assert.equal(result.totalUsers, 10);
  assert.equal(result.knownCountryUsers, 7);
  assert.equal(result.unknownCountryUsers, 3);
  assert.equal(result.countriesRepresented, 2);
  assert.deepEqual(result.countries.map(({ count, percentage }) => ({ count, percentage })), [
    { count: 4, percentage: 40 }, { count: 3, percentage: 30 },
  ]);
});

const queryModel = (documents = []) => {
  const state = {};
  const chain = {
    select(value) { state.select = value; return this; },
    sort(value) { state.sort = value; return this; },
    skip(value) { state.skip = value; return this; },
    limit(value) { state.limit = value; return this; },
    async lean() { return documents; },
  };
  return {
    state,
    model: {
      countDocuments: async (filter) => { state.countFilter = filter; return 45; },
      find: (filter) => { state.findFilter = filter; return chain; },
    },
  };
};

test('users endpoint service paginates and returns only dedicated page fields', async () => {
  const { model, state } = queryModel([{ _id: 'u1', fullName: 'Ada', email: 'ada@example.com', role: 'ADMIN', createdAt: new Date('2026-01-01'), registrationCountryCode: 'DE', registrationCountryName: 'Germany', registrationIp: '8.8.8.8', password: 'must-not-leak' }]);
  const result = await getRegistrationGeographyUsers({ page: '2', limit: '20' }, model);
  assert.equal(state.skip, 20);
  assert.equal(state.limit, 20);
  assert.deepEqual(result.pagination, { page: 2, limit: 20, total: 45, totalPages: 3 });
  assert.equal(result.users[0].password, undefined);
  assert.equal(result.users[0].registrationIp, '8.8.8.8');
});

test('users search is server-side and escaped', async () => {
  const { model, state } = queryModel();
  await getRegistrationGeographyUsers({ search: 'Ada.*' }, model);
  const searchClause = state.findFilter.$and[0].$or;
  assert.equal(searchClause[0].fullName.source, 'Ada\\.\\*');
  assert.equal(searchClause[1].email.source, 'Ada\\.\\*');
});

test('users country and role filters are server-side', async () => {
  const { model, state } = queryModel();
  await getRegistrationGeographyUsers({ country: 'eg', role: 'worker' }, model);
  assert.deepEqual(state.findFilter, { $and: [{ registrationCountryCode: 'EG' }, { role: 'WORKER' }] });
});

test('Unknown country filter includes missing, null, and blank legacy values', async () => {
  const { model, state } = queryModel();
  await getRegistrationGeographyUsers({ country: 'UNKNOWN' }, model);
  assert.deepEqual(state.findFilter.$and[0].$or, [
    { registrationCountryCode: { $exists: false } },
    { registrationCountryCode: null },
    { registrationCountryCode: '' },
  ]);
});

test('geography query validation bounds pagination and validates filters', () => {
  assert.throws(() => parseGeographyUserQuery({ page: '0' }), TypeError);
  assert.throws(() => parseGeographyUserQuery({ limit: '101' }), TypeError);
  assert.throws(() => parseGeographyUserQuery({ country: 'Egypt' }), TypeError);
  assert.throws(() => parseGeographyUserQuery({ role: 'GUEST' }), TypeError);
});
