import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmployerPaymentsCounterWhere,
  buildWorkerPaymentsCounterWhere,
} from './sidebarCountersService.js';

test('Worker payment badge counts only payer-owned awaiting-transfer items', () => {
  assert.deepEqual(buildWorkerPaymentsCounterWhere('worker-1'), {
    status: 'pending',
    manualReviewState: 'awaiting_transfer',
    userId: 'worker-1',
  });
});
test('Employer payment badge counts only employer-owned awaiting-transfer items', () => {
  assert.deepEqual(buildEmployerPaymentsCounterWhere('employer-1'), {
    status: 'pending',
    manualReviewState: 'awaiting_transfer',
    OR: [
      { userId: 'employer-1' },
      { employerId: 'employer-1' },
    ],
  });
});
