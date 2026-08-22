import test from 'node:test';
import assert from 'node:assert/strict';
import { canHideTerminatedHire } from './hireHideEligibility.js';

const terminated = (paymentStatus = 'processing') => ({
  status: 'terminated',
  paymentStatus,
});

test('terminated hire with stale processing paymentStatus and no linked Payment can hide', () => {
  assert.equal(canHideTerminatedHire(terminated(), []), true);
});

test('terminated hire with unresolved processing Payment is rejected', () => {
  assert.equal(canHideTerminatedHire(terminated(), [{ status: 'processing' }]), false);
});

test('terminated hire with failed, cancelled, or declined Payment can hide', () => {
  for (const status of ['failed', 'cancelled', 'declined', 'refunded']) {
    assert.equal(canHideTerminatedHire(terminated(), [{ status }]), true);
  }
});

test('terminated hire with completed but unfulfilled Payment is rejected', () => {
  assert.equal(
    canHideTerminatedHire(terminated('completed'), [{ status: 'completed', fulfillmentStatus: 'pending' }]),
    false,
  );
});

test('terminated hire with completed and fulfilled Payment can hide', () => {
  assert.equal(
    canHideTerminatedHire(terminated('completed'), [{ status: 'completed', fulfillmentStatus: 'fulfilled' }]),
    true,
  );
});

test('active hire is rejected even without linked Payments', () => {
  assert.equal(canHideTerminatedHire({ status: 'active' }, []), false);
});
