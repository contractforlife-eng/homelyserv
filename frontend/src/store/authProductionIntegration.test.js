import test from 'node:test';
import assert from 'node:assert/strict';

// Set up browser/Capacitor environment mocks prior to importing production modules
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return [...this.store.keys()][index] ?? null;
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

globalThis.window = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  location: { pathname: '/admin', href: 'http://localhost/admin' },
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.localStorage = mockLocalStorage;
globalThis.sessionStorage = mockSessionStorage;

// Import the actual production StorageService module
const { StorageService } = await import('../services/storage.service.ts');

test('Production StorageService: setToken, setUser, and clearSession lifecycle', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // 1. Establish session
  await StorageService.setToken('admin-valid-jwt-token-12345');
  await StorageService.setUser({ id: 'admin-1', role: 'ADMIN', email: 'admin@homelyserv.com' });

  // 2. Synchronous & asynchronous reads verify session is active
  assert.equal(StorageService.getSyncToken(), 'admin-valid-jwt-token-12345');
  const userSync = StorageService.getSyncUser();
  assert.equal(userSync.role, 'ADMIN');

  assert.equal(await StorageService.getToken(), 'admin-valid-jwt-token-12345');
  const userAsync = await StorageService.getUser();
  assert.equal(userAsync.email, 'admin@homelyserv.com');

  // 3. Explicit clearSession (Logout)
  await StorageService.clearSession();

  // 4. Everything must be purged immediately
  assert.equal(StorageService.getSyncToken(), null);
  assert.equal(StorageService.getSyncUser(), null);
  assert.equal(await StorageService.getToken(), null);
  assert.equal(await StorageService.getUser(), null);

  // 5. Native storage mirrors in window.localStorage must be cleared
  assert.equal(mockLocalStorage.getItem('homelyserv_access_token'), null);
  assert.equal(mockLocalStorage.getItem('homelyserv_token'), null);
  assert.equal(mockLocalStorage.getItem('homelyserv_user_profile'), null);
});

test('Production StorageService: bootstrapAndMigrate does not restore purged session', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // Purge session
  await StorageService.clearSession();

  // Attempt cold start hydration
  const hydrated = await StorageService.bootstrapAndMigrate();
  assert.equal(hydrated.token, null);
  assert.equal(hydrated.user, null);
  assert.equal(StorageService.getSyncToken(), null);
  assert.equal(StorageService.getSyncUser(), null);
});

test('Production StorageService: Account A -> clearSession -> Account B immediate login', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // Admin logs in
  await StorageService.setToken('admin-token-aaa');
  await StorageService.setUser({ id: 'admin1', role: 'ADMIN' });
  assert.equal(await StorageService.getToken(), 'admin-token-aaa');

  // Admin logs out
  await StorageService.clearSession();
  assert.equal(await StorageService.getToken(), null);

  // Student immediately logs in
  await StorageService.setToken('student-token-bbb');
  await StorageService.setUser({ id: 'student1', role: 'STUDENT', email: 'student@homelyserv.com' });

  // Verify Student is the active session
  assert.equal(StorageService.getSyncToken(), 'student-token-bbb');
  assert.equal(await StorageService.getToken(), 'student-token-bbb');
  const current = await StorageService.getUser();
  assert.equal(current.role, 'STUDENT');
  assert.equal(current.email, 'student@homelyserv.com');
});

test('Production StorageService: bootstrapAndMigrate migrates and preserves across restarts', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  // User establishes valid session
  await StorageService.setToken('valid-user-persisted-token');
  await StorageService.setUser({ id: 'worker1', role: 'WORKER' });

  // Re-run bootstrapAndMigrate (simulating app cold start)
  const hydrated = await StorageService.bootstrapAndMigrate();
  assert.equal(hydrated.token, 'valid-user-persisted-token');
  assert.equal(hydrated.user.role, 'WORKER');
});
