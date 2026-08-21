import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSearchLimitState,
  hasEmployerSearchAccountChanged,
  hasMeaningfulEmployerSearchFilters,
  isSearchLimitResponse,
  shouldShowWorkerDiscovery,
} from './employerSearchQuota.js';

test('recognizes the known search-limit 403 response', () => {
  assert.equal(isSearchLimitResponse({
    response: {
      status: 403,
      data: { message: 'Daily search limit reached. Upgrade to Premium for unlimited searches.' }
    }
  }), true);
});

test('does not classify unrelated authorization failures as quota exhaustion', () => {
  assert.equal(isSearchLimitResponse({
    response: { status: 403, data: { message: 'Access denied. Employer role required.' } }
  }), false);
});

test('quota state preserves unrelated page state while marking the limit reached', () => {
  const previous = { count: 1, limit: 3, remaining: 2, isPremium: false, limitReached: false };
  assert.deepEqual(getSearchLimitState({ searchCount: 3, searchLimit: 3, isPremium: false }, previous), {
    count: 3,
    limit: 3,
    remaining: 0,
    isPremium: false,
    limitReached: true,
  });
});

test('worker discovery is hidden only for a non-Premium employer after quota exhaustion', () => {
  assert.equal(shouldShowWorkerDiscovery({ limitReached: false, isPremium: false }), true);
  assert.equal(shouldShowWorkerDiscovery({ limitReached: true, isPremium: false }), false);
  assert.equal(shouldShowWorkerDiscovery({ limitReached: true, isPremium: true }), true);
});

test('account changes are detected without treating the initial account as a switch', () => {
  assert.equal(hasEmployerSearchAccountChanged(null, 'employer-a'), false);
  assert.equal(hasEmployerSearchAccountChanged('employer-a', 'employer-a'), false);
  assert.equal(hasEmployerSearchAccountChanged('employer-a', 'employer-b'), true);
});

test('removing the job filter can restore discovery only when no other filter is active', () => {
  assert.equal(hasMeaningfulEmployerSearchFilters({}), false);
  assert.equal(hasMeaningfulEmployerSearchFilters({ query: 'cook' }), true);
  assert.equal(hasMeaningfulEmployerSearchFilters({ location: 'Cairo' }), true);
  assert.equal(hasMeaningfulEmployerSearchFilters({ availability: 'all', language: 'all' }), false);
});
