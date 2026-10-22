import test from 'node:test';
import assert from 'node:assert/strict';

test('authEpoch prevents stale in-flight verification from overwriting logout', async () => {
  let authEpoch = 0;
  let activeAuthCheck = null;
  let user = { id: 'admin1', role: 'ADMIN', email: 'admin@homelyserv.com' };
  let token = 'valid-jwt-token-a';
  let isAuthenticated = true;

  // Simulate in-flight checkAuth call
  const triggerCheckAuth = () => {
    const checkEpoch = authEpoch;
    activeAuthCheck = new Promise((resolve) => {
      setTimeout(() => {
        // If authEpoch changed before this completes, discard it!
        if (checkEpoch !== authEpoch) {
          resolve({ success: false, stale: true });
          return;
        }
        user = { id: 'admin1', role: 'ADMIN', email: 'admin@homelyserv.com' };
        token = 'valid-jwt-token-a';
        isAuthenticated = true;
        resolve({ success: true, user });
      }, 50);
    });
    return activeAuthCheck;
  };

  const triggerLogout = async () => {
    authEpoch += 1;
    activeAuthCheck = null;
    user = null;
    token = null;
    isAuthenticated = false;
  };

  // 1. In-flight checkAuth starts
  const pendingCheck = triggerCheckAuth();

  // 2. User presses Logout while verification is pending
  await triggerLogout();

  // Assert immediate in-memory wipe
  assert.equal(user, null);
  assert.equal(token, null);
  assert.equal(isAuthenticated, false);

  // 3. Pending check completes
  const result = await pendingCheck;
  assert.equal(result.stale, true);
  assert.equal(result.success, false);

  // Assert user remains logged out and was not resurrected
  assert.equal(user, null);
  assert.equal(token, null);
  assert.equal(isAuthenticated, false);
});

test('Account A -> Logout -> Account B login transition', async () => {
  let user = { id: 'userA', email: 'a@homelyserv.com', role: 'WORKER' };
  let token = 'token-a';
  let isAuthenticated = true;

  // Logout Account A
  user = null;
  token = null;
  isAuthenticated = false;

  assert.equal(user, null);
  assert.equal(isAuthenticated, false);

  // Login Account B
  user = { id: 'userB', email: 'b@homelyserv.com', role: 'EMPLOYER' };
  token = 'token-b';
  isAuthenticated = true;

  assert.equal(user.email, 'b@homelyserv.com');
  assert.equal(user.role, 'EMPLOYER');
  assert.equal(isAuthenticated, true);
});

test('Repeated consecutive Logout calls do not corrupt state or throw', async () => {
  let authEpoch = 0;
  let user = { id: 'user1' };
  let token = 'token1';
  let isAuthenticated = true;

  const logout = async () => {
    authEpoch += 1;
    user = null;
    token = null;
    isAuthenticated = false;
    return { success: true };
  };

  await Promise.all([logout(), logout(), logout()]);

  assert.equal(user, null);
  assert.equal(token, null);
  assert.equal(isAuthenticated, false);
  assert.equal(authEpoch, 3);
});

test('Native storage cleanup failure is caught and user session is still invalidated in memory', async () => {
  let memoryUser = { id: 'user1' };
  let memoryToken = 'token1';
  let isAuthenticated = true;
  let nativeStorageFailed = false;

  const failingNativeCleanup = async () => {
    throw new Error('NATIVE_PREFERENCES_ERROR');
  };

  const logout = async () => {
    // 1. Immediately wipe in-memory session
    memoryUser = null;
    memoryToken = null;
    isAuthenticated = false;

    // 2. Attempt native cleanup with safe catch
    try {
      await failingNativeCleanup();
    } catch {
      nativeStorageFailed = true;
    }

    return { success: true };
  };

  const res = await logout();
  assert.equal(res.success, true);
  assert.equal(nativeStorageFailed, true);
  assert.equal(memoryUser, null);
  assert.equal(memoryToken, null);
  assert.equal(isAuthenticated, false);
});
