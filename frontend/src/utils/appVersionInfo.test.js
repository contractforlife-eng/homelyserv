import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAppVersionInfo } from './appVersionInfo.js';

test('fetchAppVersionInfo returns null when on web platform', async () => {
  const result = await fetchAppVersionInfo({
    isNativePlatform: () => false,
    getInfo: async () => ({ version: '1.0.41', build: '42' }),
  });
  assert.equal(result, null, 'Must return null on web platform to avoid misleading version display');
});

test('fetchAppVersionInfo returns version and build when on native platform', async () => {
  const result = await fetchAppVersionInfo({
    isNativePlatform: () => true,
    getInfo: async () => ({ version: '1.0.46', build: '47' }),
  });
  assert.deepEqual(result, { version: '1.0.46', build: '47' });
});

test('fetchAppVersionInfo handles retrieval errors gracefully without throwing', async () => {
  const result = await fetchAppVersionInfo({
    isNativePlatform: () => true,
    getInfo: async () => {
      throw new Error('Capacitor plugin not implemented');
    },
  });
  assert.equal(result, null, 'Must return null on error without crashing');
});

test('fetchAppVersionInfo handles empty getInfo result gracefully', async () => {
  const result = await fetchAppVersionInfo({
    isNativePlatform: () => true,
    getInfo: async () => ({ version: '', build: '' }),
  });
  assert.equal(result, null, 'Must return null when info has neither version nor build');
});
