import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRepostData,
  canReopenJob,
  createJobLifecycleFields,
  getEffectiveJobStatus,
  getJobExpirationAt,
  isJobSystemExpired,
  isJobWorkerEligible,
  JOB_DEFAULT_LIFETIME_DAYS,
} from './jobLifecycle.js';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const beforeExpiry = new Date('2026-01-30T23:59:59.999Z');
const atExpiry = new Date('2026-01-31T00:00:00.000Z');

test('new jobs receive a server-owned 30-day expiration and ignore client expiry input', () => {
  const fields = createJobLifecycleFields(createdAt, { expiresAt: '2099-01-01' });
  assert.equal(JOB_DEFAULT_LIFETIME_DAYS, 30);
  assert.equal(fields.expiresAt.toISOString(), '2026-01-31T00:00:00.000Z');
  assert.equal(fields.status, 'open');
  assert.equal(getJobExpirationAt(createdAt).toISOString(), fields.expiresAt.toISOString());
});

test('legacy open jobs without expiry remain discoverable and applicable when deadline is valid', () => {
  const legacy = { status: 'open', expiresAt: null, deadline: null };
  assert.equal(isJobWorkerEligible(legacy, atExpiry), true);
  assert.equal(getEffectiveJobStatus(legacy, atExpiry), 'open');
});

test('new jobs are visible before expiration and hidden at expiration', () => {
  const job = { status: 'open', expiresAt: getJobExpirationAt(createdAt), deadline: null };
  assert.equal(isJobWorkerEligible(job, beforeExpiry), true);
  assert.equal(isJobWorkerEligible(job, atExpiry), false);
  assert.equal(isJobSystemExpired(job, atExpiry), true);
  assert.equal(getEffectiveJobStatus(job, atExpiry), 'expired');
});

test('application deadline independently hides and blocks discovery', () => {
  const job = { status: 'open', expiresAt: getJobExpirationAt(createdAt), deadline: '2026-01-15T00:00:00.000Z' };
  assert.equal(isJobWorkerEligible(job, beforeExpiry), false);
  assert.equal(getEffectiveJobStatus(job, beforeExpiry), 'open');
});

test('pause and reopen never extend expiration, and expired jobs cannot reopen', () => {
  const paused = { status: 'paused', expiresAt: getJobExpirationAt(createdAt) };
  assert.equal(getEffectiveJobStatus(paused, atExpiry), 'paused');
  assert.equal(canReopenJob(paused, atExpiry), false);
  assert.equal(canReopenJob({ status: 'open', expiresAt: null }, atExpiry), true);
});

test('repost creates a fresh lifecycle and excludes job history relationships', () => {
  const repost = buildRepostData({
    jobTitle: 'Caregiver',
    description: 'Description',
    deadline: '2026-01-10T00:00:00.000Z',
    applications: [{ id: 'application' }],
    offers: [{ id: 'offer' }],
    hires: [{ id: 'hire' }],
  }, 'employer-id', atExpiry);
  assert.equal(repost.status, 'open');
  assert.equal(repost.createdAt, atExpiry);
  assert.equal(repost.expiresAt.toISOString(), '2026-03-02T00:00:00.000Z');
  assert.equal(repost.deadline, null);
  assert.equal('applications' in repost, false);
  assert.equal('offers' in repost, false);
  assert.equal('hires' in repost, false);
});
