import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDevice } from './deviceType.js';

test('classifies Android browsers', () => {
  assert.equal(classifyDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)'), 'android');
});

test('classifies iPhone and iPad browsers', () => {
  assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'ios');
  assert.equal(classifyDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'ios');
  assert.equal(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5), 'ios');
});

test('classifies desktop browsers and safely falls back for unknown devices', () => {
  assert.equal(classifyDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
  assert.equal(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'desktop');
  assert.equal(classifyDevice('Mozilla/5.0 (X11; Linux x86_64)'), 'desktop');
  assert.equal(classifyDevice('HomelyServTest/1.0'), 'unknown');
});
