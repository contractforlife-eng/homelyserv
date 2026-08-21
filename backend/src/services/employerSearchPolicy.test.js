import test from 'node:test';
import assert from 'node:assert/strict';
import { isIntentionalWorkerSearch } from './employerSearchPolicy.js';

test('empty worker discovery request is not an intentional search', () => {
  assert.equal(isIntentionalWorkerSearch({}), false);
  assert.equal(isIntentionalWorkerSearch({ query: '', category: 'all', location: 'all', minRating: '0' }), false);
});

test('meaningful text, job, location, or rating filters are intentional searches', () => {
  assert.equal(isIntentionalWorkerSearch({ query: 'nanny' }), true);
  assert.equal(isIntentionalWorkerSearch({ category: 'Nanny' }), true);
  assert.equal(isIntentionalWorkerSearch({ location: 'Cairo' }), true);
  assert.equal(isIntentionalWorkerSearch({ minRating: '4' }), true);
  assert.equal(isIntentionalWorkerSearch({ minExperience: '2' }), true);
  assert.equal(isIntentionalWorkerSearch({ availability: 'available' }), true);
  assert.equal(isIntentionalWorkerSearch({ maxHourlyRateActive: 'true' }), true);
  assert.equal(isIntentionalWorkerSearch({ language: 'english' }), true);
});

test('blank and all-value filters remain discovery requests', () => {
  assert.equal(isIntentionalWorkerSearch({ query: '  ', category: 'All', location: ' all ', minRating: 0 }), false);
});
