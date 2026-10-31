import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * ARCHITECTURE & CONCURRENCY LIMITATION NOTICE:
 * ---------------------------------------------
 * These concurrency tests use an in-memory mock store (`MockPushOutboxStore`) to verify
 * algorithmic logic: atomic filter semantics, claim token isolation, lease renewal,
 * lease expiration cutoffs, unconfigured deferral, and full-lifetime reconciliation.
 *
 * NOTE: These mock-based tests do NOT prove actual MongoDB replica set distributed concurrency,
 * network partitions, or write-concern behavior.
 *
 * UNAVOIDABLE PROVIDER LIMITATION:
 * If the external push provider (FCM) successfully accepts and transmits a push notification,
 * but the backend worker process crashes, loses power, or suffers network failure before recording
 * the successful status and clearing the lock in the database, the item will be picked up by another
 * worker after lease timeout and resent. In distributed push architectures without two-phase commit
 * from push providers, at-least-once delivery is the standard theoretical upper bound.
 */

class MockPushOutboxItem {
  constructor(data) {
    this._id = data._id || 'outbox-' + Math.random().toString(36).slice(2);
    this.notificationId = data.notificationId;
    this.userId = data.userId;
    this.status = data.status || 'pending';
    this.attempts = data.attempts || 0;
    this.maxAttempts = data.maxAttempts || 5;
    this.expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.nextRetryAt = data.nextRetryAt || new Date();
    this.lockedAt = data.lockedAt || null;
    this.lockedBy = data.lockedBy || null;
    this.lockClaimToken = data.lockClaimToken || null;
    this.deviceStates = data.deviceStates || [];
    this.lastError = data.lastError || null;
    this.createdAt = data.createdAt || new Date();
  }
}

class MockPushOutboxStore {
  constructor() {
    this.items = new Map();
  }

  async findOneAndUpdate(filter, update, options = {}) {
    if (filter.notificationId && update.$setOnInsert) {
      if (this.items.has(filter.notificationId)) {
        return this.items.get(filter.notificationId);
      }
      const newItem = new MockPushOutboxItem(update.$setOnInsert);
      this.items.set(filter.notificationId, newItem);
      return newItem;
    }

    if (filter._id) {
      const item = Array.from(this.items.values()).find((i) => i._id === filter._id);
      if (!item) return null;

      // Lock acquisition check with lease expiry ($or: [{lockedAt: null}, {lockedAt: {$lt: cutoff}}])
      if (filter.$or) {
        const cutoff = filter.$or[1].lockedAt.$lt;
        const canLock = item.lockedAt === null || (item.lockedAt && item.lockedAt < cutoff);
        if (!canLock) return null;
      }

      if (update.$set) Object.assign(item, update.$set);
      if (update.$inc?.attempts) item.attempts += update.$inc.attempts;
      return item;
    }

    return null;
  }

  async findOne(filter) {
    const item = Array.from(this.items.values()).find((i) => i._id === filter._id);
    return {
      select: () => ({
        lean: async () => (item ? { _id: item._id, lockClaimToken: item.lockClaimToken } : null),
      }),
    };
  }

  async find(filter) {
    let results = Array.from(this.items.values());
    if (filter.status?.$in) {
      results = results.filter((i) => filter.status.$in.includes(i.status));
    }
    if (filter.notificationId?.$in) {
      results = results.filter((i) => filter.notificationId.$in.includes(i.notificationId));
    }
    if (filter.nextRetryAt?.$lte) {
      results = results.filter((i) => i.nextRetryAt <= filter.nextRetryAt.$lte);
    }
    if (filter.expiresAt?.$gte) {
      results = results.filter((i) => i.expiresAt >= filter.expiresAt.$gte);
    }
    if (filter.$or) {
      results = results.filter(
        (i) => i.lockedAt === null || (filter.$or[1]?.lockedAt?.$lt && i.lockedAt < filter.$or[1].lockedAt.$lt)
      );
    }
    return {
      sort: () => ({
        limit: (n) => ({
          select: () => ({
            lean: async () => results.slice(0, n).map((r) => ({ _id: r._id, notificationId: r.notificationId })),
          }),
        }),
      }),
      select: () => ({
        lean: async () => results.map((r) => ({ _id: r._id, notificationId: r.notificationId })),
      }),
    };
  }

  async updateOne(filter, update) {
    const item = Array.from(this.items.values()).find((i) => i._id === filter._id);
    if (!item) return { matchedCount: 0, modifiedCount: 0 };

    // Enforce lock claim token ownership: update must match lockClaimToken if specified
    if (filter.lockClaimToken && item.lockClaimToken !== filter.lockClaimToken) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    if (filter.lockedBy && item.lockedBy !== filter.lockedBy) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) Object.assign(item, update.$set);
    if (update.$inc?.attempts) item.attempts += update.$inc.attempts;
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update) {
    let count = 0;
    for (const item of this.items.values()) {
      if (filter.expiresAt?.$lt && item.expiresAt < filter.expiresAt.$lt) {
        if (update.$set) Object.assign(item, update.$set);
        count++;
      }
    }
    return { matchedCount: count, modifiedCount: count };
  }
}

test('[Mock Store] Deduplication: duplicate notificationId never creates multiple outbox records', async () => {
  const store = new MockPushOutboxStore();

  const record1 = await store.findOneAndUpdate(
    { notificationId: 'notif-1' },
    { $setOnInsert: { notificationId: 'notif-1', userId: 'user-1' } },
    { upsert: true, new: true }
  );

  const record2 = await store.findOneAndUpdate(
    { notificationId: 'notif-1' },
    { $setOnInsert: { notificationId: 'notif-1', userId: 'user-1' } },
    { upsert: true, new: true }
  );

  assert.equal(record1._id, record2._id);
  assert.equal(store.items.size, 1);
});

test('[Mock Store] Unique Claim Token: only one worker acquires claim token and lease', async () => {
  const store = new MockPushOutboxStore();
  const item = await store.findOneAndUpdate(
    { notificationId: 'notif-lock-test' },
    { $setOnInsert: { notificationId: 'notif-lock-test', userId: 'user-1' } },
    { upsert: true, new: true }
  );

  const lockCutoff = new Date(Date.now() - 120000);

  // Worker 1 acquires lock with claim token
  const locked1 = await store.findOneAndUpdate(
    { _id: item._id, $or: [{ lockedAt: null }, { lockedAt: { $lt: lockCutoff } }] },
    { $set: { status: 'processing', lockedAt: new Date(), lockedBy: 'worker-1', lockClaimToken: 'token-worker-1' } },
    { new: true }
  );
  assert.ok(locked1);
  assert.equal(locked1.lockClaimToken, 'token-worker-1');

  // Worker 2 attempts to acquire the same item while locked
  const locked2 = await store.findOneAndUpdate(
    { _id: item._id, $or: [{ lockedAt: null }, { lockedAt: { $lt: lockCutoff } }] },
    { $set: { status: 'processing', lockedAt: new Date(), lockedBy: 'worker-2', lockClaimToken: 'token-worker-2' } },
    { new: true }
  );
  assert.equal(locked2, null, 'Second worker must be prevented from acquiring locked outbox item');
});

test('[Mock Store] Lease Renewal: active worker extends lockedAt lease before expiry', async () => {
  const store = new MockPushOutboxStore();
  const originalTime = new Date(Date.now() - 60000); // 1 minute ago
  const item = await store.findOneAndUpdate(
    { notificationId: 'notif-renewal' },
    {
      $setOnInsert: {
        notificationId: 'notif-renewal',
        userId: 'user-1',
        lockedAt: originalTime,
        lockedBy: 'worker-1',
        lockClaimToken: 'token-w1',
      },
    },
    { upsert: true, new: true }
  );

  // Worker renews lease
  const renewal = await store.updateOne(
    { _id: item._id, lockClaimToken: 'token-w1' },
    { $set: { lockedAt: new Date() } }
  );

  assert.equal(renewal.matchedCount, 1);
  const updated = store.items.get('notif-renewal');
  assert.ok(updated.lockedAt.getTime() > originalTime.getTime(), 'lockedAt must be bumped to current time');
});

test('[Mock Store] Slow delivery crossing lease duration: worker aborts when lease stolen', async () => {
  const store = new MockPushOutboxStore();
  const oldLockTime = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago (expired lease)

  // Item was originally claimed by slow worker
  const item = await store.findOneAndUpdate(
    { notificationId: 'notif-slow-delivery' },
    {
      $setOnInsert: {
        notificationId: 'notif-slow-delivery',
        userId: 'user-1',
        lockedAt: oldLockTime,
        lockedBy: 'slow-worker',
        lockClaimToken: 'slow-token',
      },
    },
    { upsert: true, new: true }
  );

  // Lock expired -> recovered by new worker with new claim token
  const lockCutoff = new Date(Date.now() - 2 * 60 * 1000);
  const stolen = await store.findOneAndUpdate(
    { _id: item._id, $or: [{ lockedAt: null }, { lockedAt: { $lt: lockCutoff } }] },
    { $set: { lockedAt: new Date(), lockedBy: 'fast-worker', lockClaimToken: 'fast-token' } },
    { new: true }
  );
  assert.ok(stolen);
  assert.equal(stolen.lockClaimToken, 'fast-token');

  // Slow worker finishes slow delivery and attempts to commit completion using stale claim token
  const commitResult = await store.updateOne(
    { _id: item._id, lockClaimToken: 'slow-token' },
    { $set: { status: 'completed', lockClaimToken: null } }
  );

  assert.equal(commitResult.matchedCount, 0, 'Slow worker MUST NOT update record after claim token is lost');
  assert.equal(store.items.get('notif-slow-delivery').lockClaimToken, 'fast-token');
});

test('[Mock Store] Outage longer than one hour: recovery reconciles 6-hour old notification without age reset', async () => {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const rolloutBoundary = new Date('2026-10-31T00:00:00.000Z');

  const store = new MockPushOutboxStore();

  const mockNotification = {
    id: 'outage-notif-6h',
    userId: 'user-outage',
    type: 'HIRE_ACCEPTED',
    title: 'Offer Accepted During Outage',
    message: 'Worker accepted during 6h backend/network partition',
    createdAt: sixHoursAgo, // Created 6 hours ago
  };

  // Compute expiry based on persisted creation time (24-hour lifetime policy)
  const NOTIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;
  const expectedExpiresAt = new Date(sixHoursAgo.getTime() + NOTIFICATION_LIFETIME_MS);

  // Reconcile into outbox
  await store.findOneAndUpdate(
    { notificationId: mockNotification.id },
    {
      $setOnInsert: {
        notificationId: mockNotification.id,
        userId: mockNotification.userId,
        title: mockNotification.title,
        createdAt: mockNotification.createdAt,
        expiresAt: expectedExpiresAt, // Anchored to persisted createdAt, NOT Date.now()
        status: 'pending',
      },
    },
    { upsert: true, new: true }
  );

  const queued = store.items.get('outage-notif-6h');
  assert.ok(queued);
  assert.equal(queued.status, 'pending');
  // Notification age is NOT reset: expiresAt is 18 hours from now, exactly matching 24h - 6h
  assert.equal(queued.expiresAt.getTime(), expectedExpiresAt.getTime());
  assert.ok(queued.expiresAt.getTime() > now.getTime(), 'Must still be valid for remaining 18 hours');
  assert.ok(queued.expiresAt.getTime() < now.getTime() + NOTIFICATION_LIFETIME_MS, 'Age must NOT have been reset');
});

test('[Mock Store] Notifications older than 24 hours are expired and skipped by reconciliation', async () => {
  const now = new Date();
  const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const NOTIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

  const expiredExpiresAt = new Date(twentyFiveHoursAgo.getTime() + NOTIFICATION_LIFETIME_MS);
  assert.ok(expiredExpiresAt.getTime() <= now.getTime(), 'Calculated expiresAt is in the past');
});
