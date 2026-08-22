import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmployerPaymentsCounterWhere,
  buildWorkerPaymentsCounterWhere,
  buildWorkerActionableEarningsWhere,
  buildSupportComplaintsCounterWhere,
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

test('Worker Hires badge targets pending earning actions for active hires', () => {
  assert.deepEqual(buildWorkerActionableEarningsWhere('worker-1', ['hire-1']), {
    workerId: 'worker-1',
    hireId: { in: ['hire-1'] },
    status: 'PENDING',
  });
});

test('Support complaints badge excludes waiting-for-user work', () => {
  assert.deepEqual(buildSupportComplaintsCounterWhere('support-1'), {
    OR: [
      {
        status: 'NEW',
        OR: [
          { assignedSupport: null },
          { assignedSupport: 'support-1' },
        ],
      },
      {
        assignedSupport: 'support-1',
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    ],
  });
});
