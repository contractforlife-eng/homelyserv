import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isUpdateAvailable,
  isUpdatePostponed,
  postponeUpdate,
  fetchLatestManifest,
  checkForAppUpdate,
  UPDATE_DISMISSED_KEY_PREFIX,
  TWENTY_FOUR_HOURS_MS
} from './appUpdateChecker.js';

class MockStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

test('isUpdateAvailable compares version codes correctly', () => {
  assert.equal(isUpdateAvailable(44, 45), true, '45 > 44 is an update');
  assert.equal(isUpdateAvailable('44', '45'), true, 'String codes parse and compare');
  assert.equal(isUpdateAvailable(45, 45), false, 'Same code is not an update');
  assert.equal(isUpdateAvailable(46, 45), false, 'Older published code is not an update');
  assert.equal(isUpdateAvailable('invalid', 45), false, 'Invalid installed code returns false');
  assert.equal(isUpdateAvailable(44, 'invalid'), false, 'Invalid latest code returns false');
});

test('postponeUpdate and isUpdatePostponed enforce 24-hour window per version code', () => {
  const storage = new MockStorage();
  const t0 = 1000000000000;

  assert.equal(isUpdatePostponed(45, storage, t0), false, 'Initial state is not postponed');

  postponeUpdate(45, storage, t0);
  assert.equal(isUpdatePostponed(45, storage, t0 + 1000), true, 'Postponed immediately after dismissing');
  assert.equal(isUpdatePostponed(45, storage, t0 + TWENTY_FOUR_HOURS_MS - 1000), true, 'Still postponed at 23h59m');
  assert.equal(isUpdatePostponed(45, storage, t0 + TWENTY_FOUR_HOURS_MS + 1000), false, 'Expires after 24 hours');

  // A different newer version (e.g. 46) is NOT postponed
  assert.equal(isUpdatePostponed(46, storage, t0 + 1000), false, 'Newer version code 46 is not blocked by 45 dismissal');
});

test('fetchLatestManifest handles network errors, timeouts, and invalid formats gracefully', async () => {
  // Offline / network failure
  const failingFetch = async () => { throw new Error('Network offline'); };
  const offlineResult = await fetchLatestManifest('https://homelyserv.com/release.json', 100, failingFetch);
  assert.equal(offlineResult, null, 'Must return null on network failure without throwing');

  // HTTP 404 or 500
  const errorFetch = async () => ({ ok: false, status: 500 });
  const errorResult = await fetchLatestManifest('https://homelyserv.com/release.json', 100, errorFetch);
  assert.equal(errorResult, null, 'Must return null on non-200 responses');

  // Malformed JSON / missing required fields
  const malformedFetch = async () => ({ ok: true, json: async () => ({ foo: 'bar' }) });
  const malformedResult = await fetchLatestManifest('https://homelyserv.com/release.json', 100, malformedFetch);
  assert.equal(malformedResult, null, 'Must return null when versionCode/versionName is missing');

  // Valid manifest
  const validFetch = async () => ({
    ok: true,
    json: async () => ({
      versionName: '1.0.44',
      versionCode: 45,
      downloadUrl: 'https://github.com/contractforlife-eng/homelyserv/releases/download/v1.0.44/HomelyServ.apk'
    })
  });
  const validResult = await fetchLatestManifest('https://homelyserv.com/release.json', 100, validFetch);
  assert.deepEqual(validResult, {
    versionName: '1.0.44',
    versionCode: 45,
    downloadUrl: 'https://github.com/contractforlife-eng/homelyserv/releases/download/v1.0.44/HomelyServ.apk'
  });
});

test('checkForAppUpdate returns null on web platform to avoid prompting ordinary website visits', async () => {
  const storage = new MockStorage();
  const result = await checkForAppUpdate({
    isNativePlatform: () => false, // Web visit
    getInfo: async () => ({ version: '1.0.43', build: '44' }),
    storage,
    fetchFn: async () => ({ ok: true, json: async () => ({ versionName: '1.0.44', versionCode: 45 }) }),
  });
  assert.equal(result, null, 'Must return null on web platform');
});

test('checkForAppUpdate detects update when native and newer build is published', async () => {
  const storage = new MockStorage();
  const result = await checkForAppUpdate({
    isNativePlatform: () => true, // Native Android
    getInfo: async () => ({ version: '1.0.43', build: '44' }),
    storage,
    fetchFn: async () => ({
      ok: true,
      json: async () => ({
        versionName: '1.0.44',
        versionCode: 45,
        downloadUrl: 'https://github.com/contractforlife-eng/homelyserv/releases/download/v1.0.44/HomelyServ.apk',
        releaseDate: '2026-11-06'
      })
    }),
  });

  assert.deepEqual(result, {
    installedVersion: '1.0.43',
    installedCode: '44',
    latestVersion: '1.0.44',
    latestCode: '45',
    downloadUrl: 'https://github.com/contractforlife-eng/homelyserv/releases/download/v1.0.44/HomelyServ.apk',
    releaseDate: '2026-11-06'
  });
});

test('checkForAppUpdate suppresses prompt when postponed within 24 hours', async () => {
  const storage = new MockStorage();
  const now = 1000000000000;
  postponeUpdate(45, storage, now);

  const result = await checkForAppUpdate({
    isNativePlatform: () => true,
    getInfo: async () => ({ version: '1.0.43', build: '44' }),
    storage,
    fetchFn: async () => ({
      ok: true,
      json: async () => ({
        versionName: '1.0.44',
        versionCode: 45
      })
    }),
    now: now + 3600000 // 1 hour later
  });

  assert.equal(result, null, 'Update prompt must be suppressed while postponed');
});
