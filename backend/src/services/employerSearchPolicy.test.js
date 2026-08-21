import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalJobFilter,
  buildWorkerTextSearchFilter,
  isIntentionalWorkerSearch
} from './employerSearchPolicy.js';

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

const matchesCanonicalJob = (worker, category) => {
  const filter = buildCanonicalJobFilter(category);
  if (!filter) return true;
  return new RegExp(filter.desiredJob.$regex, filter.desiredJob.$options).test(worker.desiredJob || '');
};

test('job filters match the canonical desiredJob, including label casing', () => {
  const worker = { desiredJob: 'nurse', skills: ['Patient care', 'First Aid'] };
  assert.equal(matchesCanonicalJob(worker, 'Nurse'), true);
  assert.equal(matchesCanonicalJob(worker, 'nurse'), true);
});

test('job filters do not match a skills-only coincidence', () => {
  const worker = { desiredJob: 'cook', skills: ['Nurse', 'Food safety'] };
  assert.equal(matchesCanonicalJob(worker, 'Nurse'), false);
});

test('legacy space and canonical underscore job values remain compatible', () => {
  assert.equal(matchesCanonicalJob({ desiredJob: 'elderly caregiver' }, 'elderly_caregiver'), true);
  assert.equal(matchesCanonicalJob({ desiredJob: 'elderly_caregiver' }, 'Elderly Caregiver'), true);
});

const matchesWorkerTextSearch = (worker, query) => {
  const clauses = buildWorkerTextSearchFilter(query).$or;
  return clauses.some(clause => {
    if (clause.desiredJob) {
      return new RegExp(clause.desiredJob.$regex, clause.desiredJob.$options).test(worker.desiredJob || '');
    }
    if (clause.skills) {
      return (worker.skills || []).some(skill => clause.skills.$in[0].test(skill));
    }
    const field = Object.keys(clause)[0];
    return new RegExp(clause[field].$regex, clause[field].$options).test(worker[field] || '');
  });
};

test('free-text search matches canonical desiredJob and preserves skills matching', () => {
  assert.equal(
    matchesWorkerTextSearch({ desiredJob: 'cook', skills: ['Kitchen hygiene'] }, 'cook'),
    true
  );
  assert.equal(
    matchesWorkerTextSearch({ desiredJob: 'nurse', skills: ['cookware safety'] }, 'cook'),
    true
  );
});
