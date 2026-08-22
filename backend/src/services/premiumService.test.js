import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateManualPremium,
  deactivateManualPremium,
  getActivePremiumUserIds,
  getActivePremiumEntitlement,
  getManualPremiumState,
  getSubscriptionSummaries,
} from './premiumService.js';

const ids = {
  employer: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  worker: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  paid: 'cccccccccccccccccccccccc',
};

const makeDb = ({ subscriptions = [], grants = [] } = {}) => {
  const state = {
    subscriptions: subscriptions.map((row) => ({ ...row })),
    grants: grants.map((row) => ({ ...row })),
    subscriptionCreates: 0,
  };

  const selectFields = (row, select) => {
    if (!select) return { ...row };
    return Object.fromEntries(Object.keys(select).map((key) => [key, row[key]]));
  };

  const db = {
    _state: state,
    subscription: {
      findMany: async ({ where, select }) => state.subscriptions
        .filter((row) => where.userId?.in?.includes(row.userId))
        .filter((row) => !where.status || row.status === where.status)
        .filter((row) => !where.plan || row.plan === where.plan)
        .filter((row) => !where.endDate?.gte || row.endDate >= where.endDate.gte)
        .map((row) => selectFields(row, select)),
      findFirst: async ({ where, select }) => state.subscriptions
        .filter((row) => row.userId === where.userId)
        .filter((row) => !where.plan || row.plan === where.plan)
        .filter((row) => !where.status || row.status === where.status)
        .filter((row) => !where.endDate?.gte || row.endDate >= where.endDate.gte)
        .sort((a, b) => b.endDate - a.endDate)
        .map((row) => selectFields(row, select))[0] || null,
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of state.subscriptions) {
          const matches = row.userId === where.userId
            && (!where.plan || row.plan === where.plan)
            && (!where.status || row.status === where.status);
          if (matches) {
            Object.assign(row, data);
            count += 1;
          }
        }
        return { count };
      },
    },
    manualPremiumGrant: {
      findMany: async ({ where, select }) => state.grants
        .filter((row) => where.userId?.in?.includes(row.userId))
        .filter((row) => !where.status || row.status === where.status)
        .filter((row) => !where.endDate?.gt || row.endDate > where.endDate.gt)
        .map((row) => selectFields(row, select)),
      findUnique: async ({ where, select }) => {
        const row = state.grants.find((grant) => grant.userId === where.userId);
        return row ? selectFields(row, select) : null;
      },
      upsert: async ({ where, create, update }) => {
        let row = state.grants.find((grant) => grant.userId === where.userId);
        if (!row) {
          row = {
            id: `grant-${state.grants.length + 1}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.grants.push(row);
        } else {
          Object.assign(row, update, { updatedAt: new Date() });
        }
        return { ...row };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of state.grants) {
          const matches = row.userId === where.userId
            && (!where.status || (where.status.not ? row.status !== where.status.not : row.status === where.status))
            && (!where.endDate?.lt || row.endDate < where.endDate.lt);
          if (matches) {
            Object.assign(row, data, { updatedAt: new Date() });
            count += 1;
          }
        }
        return { count };
      },
    },
    subscriptionGrant: {
      findMany: async () => [],
    },
  };
  return db;
};

test('new manual activation uses one ManualPremiumGrant and no legacy Subscription create', async () => {
  const db = makeDb();
  const result = await activateManualPremium(ids.employer, undefined, ids.paid, db);

  assert.equal(db._state.grants.length, 1);
  assert.equal(db._state.grants[0].status, 'active');
  assert.equal(db._state.grants[0].adminId, ids.paid);
  assert.equal(db._state.subscriptions.length, 0);
  assert.equal(result.subscriptionId, db._state.grants[0].id);
});

test('concurrent activations converge on one unique grant and extend only forward', async () => {
  const db = makeDb();
  await Promise.all([
    activateManualPremium(ids.worker, '2030-01-01T00:00:00.000Z', ids.paid, db),
    activateManualPremium(ids.worker, '2031-01-01T00:00:00.000Z', ids.paid, db),
  ]);

  assert.equal(db._state.grants.length, 1);
  assert.equal(db._state.grants[0].endDate.toISOString(), '2031-01-01T00:00:00.000Z');
});

test('active grant is never shortened and expired/inactive grant reuses its row', async () => {
  const later = new Date('2032-01-01T00:00:00.000Z');
  const db = makeDb({ grants: [{
    id: 'grant-existing',
    userId: ids.employer,
    status: 'active',
    startDate: new Date('2029-01-01T00:00:00.000Z'),
    endDate: later,
  }] });

  await activateManualPremium(ids.employer, '2030-01-01T00:00:00.000Z', ids.paid, db);
  assert.equal(db._state.grants[0].id, 'grant-existing');
  assert.equal(db._state.grants[0].endDate, later);
  assert.equal(db._state.grants[0].startDate.toISOString(), '2029-01-01T00:00:00.000Z');
});

test('dual-read recognizes paid, legacy manual, and grant-only Premium without duplicates', async () => {
  const now = new Date();
  const db = makeDb({
    subscriptions: [
      { userId: ids.paid, plan: 'weekly', status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) },
      { userId: ids.employer, plan: 'manual', status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) },
    ],
    grants: [
      { userId: ids.worker, status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) },
      { userId: ids.paid, status: 'active', startDate: now, endDate: new Date(now.getTime() + 172800000) },
    ],
  });

  const activeIds = await getActivePremiumUserIds([ids.paid, ids.employer, ids.worker, ids.paid], db);
  assert.deepEqual([...activeIds].sort(), [ids.employer, ids.paid, ids.worker].sort());
});

test('deactivation affects grant and legacy manual rows only, preserving paid rows', async () => {
  const now = new Date();
  const db = makeDb({
    subscriptions: [
      { id: 'legacy-manual', userId: ids.employer, plan: 'manual', status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) },
      { id: 'paid-row', userId: ids.employer, plan: 'monthly', status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) },
    ],
    grants: [{ id: 'grant-1', userId: ids.employer, status: 'active', startDate: now, endDate: new Date(now.getTime() + 86400000) }],
  });

  const result = await deactivateManualPremium(ids.employer, db);
  assert.equal(result.grantDeactivatedCount, 1);
  assert.equal(result.legacyDeactivatedCount, 1);
  assert.equal(db._state.subscriptions.find((row) => row.id === 'paid-row').status, 'active');
});

test('grant-only admin state is reported as active manual Premium', async () => {
  const now = new Date();
  const db = makeDb({ grants: [{
    userId: ids.worker,
    status: 'active',
    startDate: now,
    endDate: new Date(now.getTime() + 86400000),
  }] });
  const state = await getManualPremiumState(ids.worker, db);
  const summaries = await getSubscriptionSummaries([ids.worker], db);

  assert.equal(state.hasActiveManualPremium, true);
  assert.equal(summaries.get(ids.worker).isPremium, true);
  assert.equal(summaries.get(ids.worker).latestPlan, 'manual');
});

test('inactive manual grant never masks an active paid subscription', async () => {
  const now = new Date();
  const db = makeDb({
    subscriptions: [{
      userId: ids.paid,
      plan: 'monthly',
      status: 'active',
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
    }],
    grants: [{
      userId: ids.paid,
      status: 'inactive',
      startDate: now,
      endDate: new Date(now.getTime() + 172800000),
    }],
  });

  const summary = (await getSubscriptionSummaries([ids.paid], db)).get(ids.paid);
  assert.equal(summary.isPremium, true);
  assert.equal(summary.status, 'active');
});

test('Premium benefit projection can use a grant while preserving the subscription shape', async () => {
  const now = new Date();
  const db = makeDb({ grants: [{
    id: 'grant-worker',
    userId: ids.worker,
    status: 'active',
    startDate: now,
    endDate: new Date(now.getTime() + 86400000),
  }] });
  const entitlement = await getActivePremiumEntitlement(ids.worker, db);

  assert.deepEqual(entitlement, {
    id: 'grant-worker',
    plan: 'manual',
    status: 'active',
    startDate: now,
    endDate: new Date(now.getTime() + 86400000),
  });
});
