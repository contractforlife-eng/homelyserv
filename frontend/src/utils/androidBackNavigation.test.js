import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_ROOT_PATHS,
  GUEST_ROOT_PATHS,
  EXIT_TOAST_MESSAGES,
  getExitToastMessage,
  isRootPath,
  createBackButtonHandler,
} from './androidBackNavigation.js';

test('androidBackNavigation: translations exist for all six languages', () => {
  const languages = ['en', 'ar', 'fr', 'de', 'ru', 'tr'];
  for (const lng of languages) {
    const msg = getExitToastMessage(lng);
    assert.ok(msg, `Missing message for ${lng}`);
    assert.equal(msg, EXIT_TOAST_MESSAGES[lng]);
  }
  // Fallback to English
  assert.equal(getExitToastMessage('es'), EXIT_TOAST_MESSAGES.en);
});

test('androidBackNavigation: role root path definitions for all account roles', () => {
  const roles = ['WORKER', 'EMPLOYER', 'ADMIN', 'DOCTOR', 'TEACHER', 'STUDENT', 'SUPPORT', 'SUPPORT_HELPER'];
  for (const role of roles) {
    assert.ok(ROLE_ROOT_PATHS[role], `Missing root path for role ${role}`);
  }
});

test('androidBackNavigation: isRootPath identifies dashboards and guest roots correctly', () => {
  // Guest
  assert.equal(isRootPath('/login', null, false), true);
  assert.equal(isRootPath('/', null, false), true);
  assert.equal(isRootPath('/register', null, false), true);
  assert.equal(isRootPath('/about', null, false), false);

  // Authenticated roles
  assert.equal(isRootPath('/worker-dashboard', 'WORKER', true), true);
  assert.equal(isRootPath('/worker-jobs', 'WORKER', true), false);

  assert.equal(isRootPath('/employer-dashboard', 'EMPLOYER', true), true);
  assert.equal(isRootPath('/employer-jobs', 'EMPLOYER', true), false);

  assert.equal(isRootPath('/admin', 'ADMIN', true), true);
  assert.equal(isRootPath('/admin/users', 'ADMIN', true), false);

  assert.equal(isRootPath('/doctor-dashboard', 'DOCTOR', true), true);
  assert.equal(isRootPath('/doctor-cms/patients', 'DOCTOR', true), false);

  assert.equal(isRootPath('/teacher-dashboard', 'TEACHER', true), true);
  assert.equal(isRootPath('/teacher-lessons', 'TEACHER', true), false);

  assert.equal(isRootPath('/student-dashboard', 'STUDENT', true), true);
  assert.equal(isRootPath('/student-lessons', 'STUDENT', true), false);

  assert.equal(isRootPath('/support-dashboard', 'SUPPORT', true), true);
  assert.equal(isRootPath('/sup-help', 'SUPPORT_HELPER', true), true);
});

test('androidBackNavigation: double-back to exit on dashboard prompts then exits', async () => {
  let exitCalls = 0;
  let notifications = [];

  const handler = createBackButtonHandler({
    navigate: () => {},
    getCurrentLocation: () => ({ pathname: '/worker-dashboard', key: 'default' }),
    getAuthState: () => ({ isAuthenticated: true, role: 'WORKER' }),
    getLanguage: () => 'en',
    exitApp: async () => { exitCalls++; },
    notify: (msg) => { notifications.push(msg); },
    exitTimeoutMs: 1500,
  });

  // First press: shows prompt
  await handler(false);
  assert.equal(exitCalls, 0);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0], 'Press back again to exit');

  // Second press immediately: triggers exit
  await handler(false);
  assert.equal(exitCalls, 1);
});

test('androidBackNavigation: back button navigates within app history when not at root', async () => {
  let navigateCalls = [];
  let exitCalls = 0;

  const handler = createBackButtonHandler({
    navigate: (path, opts) => { navigateCalls.push({ path, opts }); },
    getCurrentLocation: () => ({ pathname: '/worker-jobs', key: 'history-key-123' }),
    getAuthState: () => ({ isAuthenticated: true, role: 'WORKER' }),
    getLanguage: () => 'ar',
    exitApp: async () => { exitCalls++; },
    notify: () => {},
  });

  await handler(true);
  assert.equal(exitCalls, 0);
  assert.equal(navigateCalls.length, 1);
  assert.equal(navigateCalls[0].path, -1);
});

test('androidBackNavigation: recovers to dashboard safely if no back history exists', async () => {
  let navigateCalls = [];

  const handler = createBackButtonHandler({
    navigate: (path, opts) => { navigateCalls.push({ path, opts }); },
    getCurrentLocation: () => ({ pathname: '/worker-jobs', key: 'default' }),
    getAuthState: () => ({ isAuthenticated: true, role: 'WORKER' }),
    getLanguage: () => 'fr',
    exitApp: async () => {},
    notify: () => {},
  });

  // canGoBack is false and key is 'default' (e.g. entry from deep-link or fresh load)
  await handler(false);
  assert.equal(navigateCalls.length, 1);
  assert.equal(navigateCalls[0].path, '/worker-dashboard');
  assert.deepEqual(navigateCalls[0].opts, { replace: true });
});
