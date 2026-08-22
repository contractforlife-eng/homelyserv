import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyLegacyManualDeactivation,
  deactivateLegacyManualPremium,
} from './legacyManualPremiumDeactivation.js';

const user = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const now = new Date('2026-08-22T00:00:00.000Z');

const legacy = (overrides = {}) => ({
  id: 'legacy-1',
  userId: user,
  plan: 'manual',
  amount: 0,
  status: 'active',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-12-01T00:00:00.000Z'),
  ...overrides,
});

const grant = (overrides = {}) => ({
  id: 'grant-1',
  userId: user,
  status: 'active',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-12-01T00:00:00.000Z'),
  ...overrides,
});

test('active legacy with matching active grant is safe to deactivate', () => {
  const result = classifyLegacyManualDeactivation(legacy(), [grant()], now);
  assert.equal(result.action, 'WOULD_DEACTIVATE');
  assert.equal(result.reason, 'VALID_ACTIVE_LEGACY');
});

test('inactive legacy is reported without requiring a write', () => {
  const result = classifyLegacyManualDeactivation(legacy({ status: 'inactive' }), [], now);
  assert.equal(result.action, 'ALREADY_INACTIVE');
});

test('missing or unsafe grants fail closed', () => {
  assert.equal(classifyLegacyManualDeactivation(legacy(), [], now).action, 'SKIP_MISSING_GRANT');
  assert.equal(
    classifyLegacyManualDeactivation(legacy(), [grant({ endDate: new Date('2026-11-01T00:00:00.000Z') })], now).action,
    'SKIP_GRANT_MISMATCH',
  );
  assert.equal(
    classifyLegacyManualDeactivation(legacy(), [grant({ status: 'inactive' })], now).action,
    'SKIP_GRANT_MISMATCH',
  );
});

test('expired active legacy can be normalized only with a matching grant', () => {
  const expired = legacy({ endDate: new Date('2026-08-01T00:00:00.000Z') });
  assert.equal(classifyLegacyManualDeactivation(expired, [grant({ endDate: expired.endDate })], now).action, 'WOULD_DEACTIVATE');
  assert.equal(classifyLegacyManualDeactivation(expired, [], now).action, 'SKIP_MISSING_GRANT');
});

const makeDb = () => {
  const state = {
    legacyRows: [legacy(), legacy({ id: 'legacy-2', userId: 'bbbbbbbbbbbbbbbbbbbbbbbb', status: 'inactive' })],
    grants: [grant(), grant({ id: 'grant-2', userId: 'bbbbbbbbbbbbbbbbbbbbbbbb', status: 'inactive' })],
    updates: [],
  };
  return {
    _state: state,
    subscription: {
      findMany: async () => state.legacyRows.map((row) => ({ ...row })),
      updateMany: async ({ where, data }) => {
        const row = state.legacyRows.find((candidate) => candidate.id === where.id);
        if (!row || row.plan !== where.plan || row.status !== where.status) return { count: 0 };
        Object.assign(row, data);
        state.updates.push({ id: row.id, data: { ...data } });
        return { count: 1 };
      },
    },
    manualPremiumGrant: {
      findMany: async () => state.grants.map((row) => ({ ...row })),
    },
  };
};

test('dry-run performs no writes and reports expected actions', async () => {
  const db = makeDb();
  const result = await deactivateLegacyManualPremium({ db, dryRun: true, now });
  assert.equal(result.legacyRows, 2);
  assert.equal(result.activeLegacyRows, 1);
  assert.equal(result.alreadyInactive, 1);
  assert.equal(result.wouldDeactivate, 1);
  assert.equal(db._state.updates.length, 0);
});

test('apply changes only verified legacy manual status and is idempotent', async () => {
  const db = makeDb();
  const first = await deactivateLegacyManualPremium({ db, dryRun: false, now });
  const second = await deactivateLegacyManualPremium({ db, dryRun: false, now });

  assert.equal(first.wouldDeactivate, 1);
  assert.equal(db._state.updates.length, 1);
  assert.equal(db._state.legacyRows[0].status, 'inactive');
  assert.equal(db._state.grants[0].status, 'active');
  assert.equal(second.wouldDeactivate, 0);
  assert.equal(second.alreadyInactive, 2);
});
