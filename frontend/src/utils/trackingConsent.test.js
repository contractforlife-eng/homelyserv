import assert from 'node:assert/strict';
import test from 'node:test';
import { getTrackingConsent, hasTrackingConsent, setTrackingConsent, subscribeTrackingConsent, TRACKING_CONSENT_KEY } from './trackingConsent.js';

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  },
  dispatchEvent: () => true,
  CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } }
};

test('tracking consent defaults to unknown and persists accepted/rejected choices', () => {
  storage.clear();
  assert.equal(getTrackingConsent(), 'unknown');
  assert.equal(hasTrackingConsent(), false);
  assert.equal(setTrackingConsent('accepted'), true);
  assert.equal(storage.get(TRACKING_CONSENT_KEY), 'accepted');
  assert.equal(hasTrackingConsent(), true);
  setTrackingConsent('rejected');
  assert.equal(getTrackingConsent(), 'rejected');
  assert.equal(hasTrackingConsent(), false);
});

test('reactive transitions notify subscribers exactly once per consent update', () => {
  storage.clear();
  const seen = [];
  const unsubscribe = subscribeTrackingConsent((value) => seen.push(value));
  setTrackingConsent('accepted');
  setTrackingConsent('rejected');
  setTrackingConsent('accepted');
  setTrackingConsent('accepted');
  unsubscribe();
  assert.deepEqual(seen, ['accepted', 'rejected', 'accepted', 'accepted']);
});
