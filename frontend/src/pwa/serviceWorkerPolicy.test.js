import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeStaticRequest } from './serviceWorkerPolicy.js';

const appOrigin = 'https://homelyserv.com';
const request = (overrides = {}) => ({
  method: 'GET',
  origin: appOrigin,
  appOrigin,
  pathname: '/assets/app.js',
  destination: 'script',
  ...overrides
});

test('allows same-origin static application assets', () => {
  assert.equal(isSafeStaticRequest(request()), true);
});

test('never caches API, payment, backend, download, or Socket.IO paths', () => {
  for (const pathname of [
    '/api/auth/check',
    '/api/payments/paypal/order',
    '/api/payments/manual/submit',
    '/api/hires',
    '/api/messages',
    '/socket.io/?EIO=4',
    '/downloads/android/HomelyServ.apk',
    '/backend/status'
  ]) {
    assert.equal(isSafeStaticRequest(request({ pathname })), false, pathname);
  }
});

test('never caches non-GET requests', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal(isSafeStaticRequest(request({ method })), false, method);
  }
});

test('never caches cross-origin resources', () => {
  assert.equal(isSafeStaticRequest(request({ origin: 'https://api.homelyserv.com' })), false);
});
