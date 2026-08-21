import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANUAL_SUBMISSION_REVIEW_STATE,
  getManualSubmissionOrderId,
  isActionableManualSubmission,
} from './manualPaymentLifecycle.js';

test('pre-submit draft is not an actionable admin payment', () => {
  assert.equal(isActionableManualSubmission({
    status: 'draft',
    fulfillmentStatus: 'pending',
    manualReviewState: 'draft',
  }), false);
});

test('method selection and instruction viewing remain draft-only', () => {
  for (const stage of ['method-selection', 'instruction-view', 'abandoned-flow']) {
    assert.equal(isActionableManualSubmission({
      stage,
      status: 'draft',
      fulfillmentStatus: 'pending',
      manualReviewState: 'draft',
    }), false);
  }
});

test('final submission enters the existing actionable review state', () => {
  assert.equal(isActionableManualSubmission({
    status: 'pending',
    fulfillmentStatus: 'pending',
    manualReviewState: MANUAL_SUBMISSION_REVIEW_STATE,
  }), true);
});

for (const purpose of ['COMMISSION', 'SUBSCRIPTION']) {
  for (const paymentMethod of ['vodafone_cash', 'instapay']) {
    test(`${purpose} ${paymentMethod} is draft-only before final submit`, () => {
      assert.equal(isActionableManualSubmission({
        purpose,
        paymentMethod,
        status: 'draft',
        fulfillmentStatus: 'pending',
        manualReviewState: 'draft',
      }), false);
    });

    test(`${purpose} ${paymentMethod} becomes reviewable only after final submit`, () => {
      const submittedPayment = {
        purpose,
        paymentMethod,
        status: 'pending',
        fulfillmentStatus: 'pending',
        manualReviewState: MANUAL_SUBMISSION_REVIEW_STATE,
      };

      assert.equal(isActionableManualSubmission(submittedPayment), true);
      assert.equal(submittedPayment.fulfillmentStatus, 'pending');
      assert.notEqual(submittedPayment.status, 'completed');
    });
  }
}

test('final manual submission does not represent subscription activation or commission fulfillment', () => {
  for (const purpose of ['COMMISSION', 'SUBSCRIPTION']) {
    assert.equal(isActionableManualSubmission({
      purpose,
      status: 'pending',
      fulfillmentStatus: 'pending',
      manualReviewState: MANUAL_SUBMISSION_REVIEW_STATE,
    }), true);
  }
});

test('the same submission id produces the same unique order id', () => {
  assert.equal(
    getManualSubmissionOrderId('manual-test-submission-123'),
    getManualSubmissionOrderId('manual-test-submission-123'),
  );
  assert.notEqual(
    getManualSubmissionOrderId('manual-work-period-a'),
    getManualSubmissionOrderId('manual-work-period-b'),
  );
});
