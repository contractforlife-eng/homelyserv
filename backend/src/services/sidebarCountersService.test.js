import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmployerHiresCounterWhere } from './sidebarCountersService.js';

test('Employer My Hires counter includes only visible non-terminated pending Hires', () => {
  assert.deepEqual(buildEmployerHiresCounterWhere('employer-id'), {
    employerId: 'employer-id',
    paymentStatus: 'pending',
    status: { not: 'terminated' },
    OR: [
      { employerHiddenAt: null },
      { employerHiddenAt: { isSet: false } },
    ],
  });
});
