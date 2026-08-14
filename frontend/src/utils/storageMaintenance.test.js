import test from 'node:test';
import assert from 'node:assert/strict';

class QuotaStorage {
  constructor(limit) { this.limit = limit; this.values = new Map(); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  removeItem(key) { this.values.delete(key); }
  setItem(key, value) {
    const next = new Map(this.values); next.set(key, String(value));
    const size = [...next].reduce((total, [storedKey, storedValue]) => total + storedKey.length + storedValue.length, 0);
    if (size > this.limit) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    this.values = next;
  }
}

globalThis.localStorage = new QuotaStorage(600);
const { persistAuthToken } = await import('./storageMaintenance.js');

test('auth persistence recovers quota by removing only obsolete HomelyServ mirrors', () => {
  localStorage.setItem('unrelated_application_key', 'keep-me');
  localStorage.setItem('homelyserv_profiles', 'x'.repeat(400));
  const token = `header.${'p'.repeat(180)}.signature`;
  const result = persistAuthToken(token);
  assert.equal(result.success, true);
  assert.equal(result.recovered, true);
  assert.equal(localStorage.getItem('homelyserv_token'), token);
  assert.equal(localStorage.getItem('homelyserv_profiles'), null);
  assert.equal(localStorage.getItem('unrelated_application_key'), 'keep-me');
});

test('auth token validation rejects non-string and oversized values', () => {
  assert.equal(persistAuthToken({ token:'not-a-string' }).success, false);
  assert.equal(persistAuthToken('x'.repeat(20_000)).success, false);
});
