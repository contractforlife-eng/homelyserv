import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegacyManualMigrationPlan,
  mergeLegacyManualGrant,
  migrateLegacyManualPremium,
} from './legacyManualPremiumMigration.js';

const user = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const now = new Date('2026-08-22T00:00:00.000Z');

const legacy = (overrides = {}) => ({
  id: 'legacy-1',
  userId: user,
  plan: 'manual',
  status: 'active',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-12-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const grant = (overrides = {}) => ({
  id: 'grant-1',
  userId: user,
  status: 'inactive',
  startDate: new Date('2026-02-01T00:00:00.000Z'),
  endDate: new Date('2026-11-01T00:00:00.000Z'),
  adminId: 'admin-known',
  createdAt: new Date('2026-02-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides,
});

test('active legacy-only row becomes an active grant with original dates and null admin', () => {
  const result = mergeLegacyManualGrant(legacy({ endDate: new Date('2026-09-01T00:00:00.000Z') }), null, now);
  assert.equal(result.status, 'active');
  assert.equal(result.startDate.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(result.endDate.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(result.adminId, null);
});

test('inactive and expired legacy rows never become active without another active source', () => {
  const inactive = mergeLegacyManualGrant(legacy({ status: 'inactive' }), null, now);
  const expired = mergeLegacyManualGrant(legacy({ endDate: new Date('2026-01-02T00:00:00.000Z') }), null, now);
  assert.equal(inactive.status, 'inactive');
  assert.equal(expired.status, 'inactive');
});

test('existing grant merge preserves known admin and the later entitlement date', () => {
  const result = mergeLegacyManualGrant(legacy(), grant(), now);
  assert.equal(result.status, 'active');
  assert.equal(result.adminId, 'admin-known');
  assert.equal(result.endDate.toISOString(), '2026-12-01T00:00:00.000Z');
});

test('existing later active grant is never shortened by legacy state', () => {
  const result = mergeLegacyManualGrant(
    legacy({ endDate: new Date('2026-09-01T00:00:00.000Z') }),
    grant({ status: 'active', endDate: new Date('2027-01-01T00:00:00.000Z') }),
    now,
  );
  assert.equal(result.status, 'active');
  assert.equal(result.endDate.toISOString(), '2027-01-01T00:00:00.000Z');
});

test('migration plan rejects duplicate legacy users before any write', () => {
  assert.throws(
    () => buildLegacyManualMigrationPlan([legacy(), legacy({ id: 'legacy-2' })], [], now),
    /Duplicate legacy manual rows/,
  );
});

test('dry-run reads and plans without writing grants', async () => {
  let upserts = 0;
  const db = {
    subscription: {
      findMany: async () => [legacy()],
    },
    manualPremiumGrant: {
      findMany: async () => [],
      upsert: async () => { upserts += 1; },
    },
  };
  const result = await migrateLegacyManualPremium({ db, dryRun: true, now });
  assert.equal(result.legacyRows, 1);
  assert.equal(upserts, 0);
});

test('apply copy/upsert is retry-safe and leaves legacy rows untouched', async () => {
  const legacyRow = legacy({ endDate: new Date('2026-10-01T00:00:00.000Z') });
  const state = { grants: [], legacyRows: [legacyRow], subscriptionUpdates: 0 };
  const db = {
    subscription: {
      findMany: async () => state.legacyRows.map((row) => ({ ...row })),
    },
    manualPremiumGrant: {
      findMany: async () => state.grants.map((row) => ({ ...row })),
      upsert: async ({ create, update }) => {
        let row = state.grants.find((grant) => grant.userId === create.userId);
        if (!row) {
          row = { id: 'grant-1', ...create, createdAt: now, updatedAt: now };
          state.grants.push(row);
        } else {
          Object.assign(row, update);
        }
        return { ...row };
      },
      findUnique: async ({ where }) => state.grants.find((row) => row.userId === where.userId) || null,
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of state.grants) {
          const matches = row.userId === where.userId
            && (!where.endDate?.lt || row.endDate < where.endDate.lt);
          if (matches) {
            Object.assign(row, data);
            count += 1;
          }
        }
        return { count };
      },
    },
  };

  const first = await migrateLegacyManualPremium({ db, dryRun: false, now });
  const second = await migrateLegacyManualPremium({ db, dryRun: false, now });

  assert.equal(first.created, 1);
  assert.equal(second.created, 0);
  assert.equal(state.grants.length, 1);
  assert.equal(state.grants[0].status, 'active');
  assert.equal(state.grants[0].endDate.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(state.legacyRows[0].status, 'active');
  assert.equal(state.legacyRows[0].endDate.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(state.subscriptionUpdates, 0);
});
