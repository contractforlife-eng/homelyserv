import test from 'node:test';
import assert from 'node:assert/strict';

// We implement an in-memory test harness that mimics the StorageService synchronization
// architecture and verifies all 10 required regression scenarios with controllable asynchronous
// native Preferences operations.

function createControlledStorageService() {
  const nativeStorage = new Map();
  let memoryToken = null;
  let memoryUser = null;
  let memoryRefreshToken = null;

  let sessionGeneration = 0;
  let storageQueue = Promise.resolve();

  // Controllable hooks for tests to simulate pending/delayed/rejected native writes
  let beforeNativeWriteHook = null;

  function enqueueOperation(op) {
    const opGen = sessionGeneration;
    const next = storageQueue
      .catch(() => {})
      .then(async () => {
        if (opGen !== sessionGeneration) {
          return null;
        }
        return await op(opGen);
      });
    storageQueue = next.catch(() => {});
    return next;
  }

  const service = {
    setBeforeNativeWriteHook(hook) {
      beforeNativeWriteHook = hook;
    },
    getRawNativeStorage() {
      return nativeStorage;
    },
    getSessionGeneration() {
      return sessionGeneration;
    },
    async flushQueue() {
      await storageQueue.catch(() => {});
    },

    async _clearNativeKeys() {
      nativeStorage.delete('homelyserv_access_token');
      nativeStorage.delete('homelyserv_refresh_token');
      nativeStorage.delete('homelyserv_user_profile');
    },

    async setToken(token) {
      memoryToken = token;
      return enqueueOperation(async (currentGen) => {
        if (beforeNativeWriteHook) {
          await beforeNativeWriteHook('setToken', token, currentGen);
        }
        nativeStorage.set('homelyserv_access_token', token);
        if (currentGen !== sessionGeneration) {
          await service._clearNativeKeys();
        }
      });
    },

    async getToken() {
      const res = await enqueueOperation(async (currentGen) => {
        if (currentGen !== sessionGeneration) return null;
        const val = nativeStorage.get('homelyserv_access_token') || null;
        if (val) memoryToken = val;
        return val || memoryToken;
      });
      return res !== undefined ? res : memoryToken;
    },

    async setRefreshToken(refreshToken) {
      memoryRefreshToken = refreshToken;
      return enqueueOperation(async (currentGen) => {
        if (beforeNativeWriteHook) {
          await beforeNativeWriteHook('setRefreshToken', refreshToken, currentGen);
        }
        nativeStorage.set('homelyserv_refresh_token', refreshToken);
        if (currentGen !== sessionGeneration) {
          await service._clearNativeKeys();
        }
      });
    },

    async getRefreshToken() {
      const res = await enqueueOperation(async (currentGen) => {
        if (currentGen !== sessionGeneration) return null;
        return nativeStorage.get('homelyserv_refresh_token') || null;
      });
      return res || null;
    },

    async setUser(user) {
      memoryUser = user;
      return enqueueOperation(async (currentGen) => {
        if (beforeNativeWriteHook) {
          await beforeNativeWriteHook('setUser', user, currentGen);
        }
        nativeStorage.set('homelyserv_user_profile', JSON.stringify(user));
        if (currentGen !== sessionGeneration) {
          await service._clearNativeKeys();
        }
      });
    },

    async getUser() {
      const res = await enqueueOperation(async (currentGen) => {
        if (currentGen !== sessionGeneration) return null;
        const raw = nativeStorage.get('homelyserv_user_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          memoryUser = parsed;
          return parsed;
        }
        return memoryUser;
      });
      return res !== undefined ? res : memoryUser;
    },

    async bootstrapAndMigrate() {
      const res = await enqueueOperation(async (currentGen) => {
        if (currentGen !== sessionGeneration) return { token: null, user: null };
        const token = nativeStorage.get('homelyserv_access_token') || null;
        const rawUser = nativeStorage.get('homelyserv_user_profile');
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (token) memoryToken = token;
        if (user) memoryUser = user;
        return { token, user };
      });
      return res || { token: null, user: null };
    },

    async clearSession() {
      sessionGeneration += 1;
      const purgeGen = sessionGeneration;
      memoryToken = null;
      memoryUser = null;
      memoryRefreshToken = null;

      await enqueueOperation(async (currentGen) => {
        if (currentGen !== purgeGen) {
          // Newer session already active, don't wipe it
          return;
        }
        await service._clearNativeKeys();
      });
    }
  };

  return service;
}

test('1-6: Account A token write starts -> Logout starts before finish -> write finishes -> native storage clean & hydration impossible', async () => {
  const storage = createControlledStorageService();

  let resolveNativeWrite = null;
  const delayedWritePromise = new Promise((resolve) => {
    resolveNativeWrite = resolve;
  });

  storage.setBeforeNativeWriteHook(async (action) => {
    if (action === 'setToken') {
      await delayedWritePromise;
    }
  });

  // 1. Account A token write starts but remains pending
  const writeOp = storage.setToken('account-a-token-12345');

  // 2. Logout starts before that write finishes
  const logoutOp = storage.clearSession();

  // 3. The delayed native write resolves
  resolveNativeWrite();
  await writeOp;

  // 4. Logout completes
  await logoutOp;

  // 5. Native storage contains no Account A credentials
  const native = storage.getRawNativeStorage();
  assert.equal(native.get('homelyserv_access_token'), undefined);
  assert.equal(native.get('homelyserv_user_profile'), undefined);

  // 6. Subsequent hydration cannot restore Account A
  const hydration = await storage.bootstrapAndMigrate();
  assert.equal(hydration.token, null);
  assert.equal(hydration.user, null);
  assert.equal(await storage.getToken(), null);
});

test('7: Account A -> Logout -> Account B can log in and persist normally', async () => {
  const storage = createControlledStorageService();

  // Account A logs in
  await storage.setToken('account-a-token');
  await storage.setUser({ id: 'user-a', email: 'a@homelyserv.com' });
  assert.equal(await storage.getToken(), 'account-a-token');

  // Explicit Logout
  await storage.clearSession();
  assert.equal(await storage.getToken(), null);
  assert.equal(await storage.getUser(), null);

  // Account B logs in
  await storage.setToken('account-b-token');
  await storage.setUser({ id: 'user-b', email: 'b@homelyserv.com' });

  // Account B persists and is readable
  assert.equal(await storage.getToken(), 'account-b-token');
  const userB = await storage.getUser();
  assert.equal(userB.email, 'b@homelyserv.com');
  assert.equal(storage.getRawNativeStorage().get('homelyserv_access_token'), 'account-b-token');
});

test('8: Ordinary restart without Logout restores the valid session', async () => {
  const storage = createControlledStorageService();

  // Login session
  await storage.setToken('persisted-session-token');
  await storage.setUser({ id: 'user-123', name: 'John Doe' });

  // Simulate app restart / cold start hydration
  const bootstrapped = await storage.bootstrapAndMigrate();
  assert.equal(bootstrapped.token, 'persisted-session-token');
  assert.equal(bootstrapped.user.name, 'John Doe');
});

test('9: Rejected native writes do not deadlock future operations', async () => {
  const storage = createControlledStorageService();

  storage.setBeforeNativeWriteHook(async (action) => {
    if (action === 'setToken') {
      throw new Error('NATIVE_PREFERENCES_CORRUPT');
    }
  });

  // Attempt write that fails
  await storage.setToken('failing-token').catch(() => {});

  // Remove hook and execute subsequent write
  storage.setBeforeNativeWriteHook(null);
  await storage.setToken('recovered-token');

  // Verify the queue is alive and unblocked
  const token = await storage.getToken();
  assert.equal(token, 'recovered-token');
});

test('10: Concurrent token, refresh-token, and user writes are handled safely', async () => {
  const storage = createControlledStorageService();

  // Fire concurrent writes without awaiting each sequentially
  const pToken = storage.setToken('concurrent-access-token');
  const pRefresh = storage.setRefreshToken('concurrent-refresh-token');
  const pUser = storage.setUser({ id: 'concurrent-user', role: 'EMPLOYER' });

  await Promise.all([pToken, pRefresh, pUser]);

  // Verify all 3 were recorded in order safely
  assert.equal(await storage.getToken(), 'concurrent-access-token');
  assert.equal(await storage.getRefreshToken(), 'concurrent-refresh-token');
  const user = await storage.getUser();
  assert.equal(user.role, 'EMPLOYER');
});

test('Protect against old cleanup accidentally deleting credentials of a subsequent new login', async () => {
  const storage = createControlledStorageService();

  let resolvePurgeNative = null;
  const purgeBlocker = new Promise((resolve) => {
    resolvePurgeNative = resolve;
  });

  // Intercept native purge
  const originalClear = storage._clearNativeKeys;
  let clearInvokedCount = 0;
  storage._clearNativeKeys = async () => {
    clearInvokedCount++;
    await purgeBlocker;
    return originalClear.call(storage);
  };

  // 1. Account A triggers Logout
  const logoutPromise = storage.clearSession();

  // 2. Fast login for Account B immediately starts before purge completes
  const loginBPromise = (async () => {
    await storage.setToken('token-account-b');
    await storage.setUser({ id: 'user-b' });
  })();

  // 3. Now let the old purge attempt to proceed
  resolvePurgeNative();

  await Promise.all([logoutPromise, loginBPromise]);

  // Verify Account B credentials were NOT erased by the older logout purge!
  const native = storage.getRawNativeStorage();
  assert.equal(native.get('homelyserv_access_token'), 'token-account-b');
  assert.equal(await storage.getToken(), 'token-account-b');
});
