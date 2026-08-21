export const MANUAL_SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;
export const MANUAL_REFERENCE_PATTERN = /^HS-\d{4}-[A-Z2-9]{6}$/;
export const MANUAL_SUBMISSION_REVIEW_STATE = 'pending_verification';

export const getManualSubmissionOrderId = (submissionId) => `MANUAL-${submissionId}`;

export const isActionableManualSubmission = (payment) => (
  payment?.status === 'pending' &&
  payment?.fulfillmentStatus === 'pending' &&
  payment?.manualReviewState === MANUAL_SUBMISSION_REVIEW_STATE
);
