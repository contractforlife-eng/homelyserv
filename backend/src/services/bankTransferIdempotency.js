import crypto from 'crypto';

const ATTEMPT_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export const normalizeBankTransferAttemptKey = (value) => {
  const key = String(value || '').trim();
  return ATTEMPT_KEY_PATTERN.test(key) ? key : null;
};

export const buildBankTransferOrderId = ({ userId, purpose, planId = '', hireId = '', attemptKey }) => {
  const scope = [String(userId), String(purpose), String(planId), String(hireId), String(attemptKey)].join('|');
  return `BT-${crypto.createHash('sha256').update(scope).digest('hex').slice(0, 40)}`;
};

export const isUniqueConstraintError = (error) => error?.code === 'P2002';

export const isActionableBankTransfer = (payment) => Boolean(
  payment
  && payment.paymentMethod === 'bank_transfer'
  && payment.currency === 'USD'
  && ['pending', 'processing'].includes(payment.status)
  && ['awaiting_transfer', 'proof_submitted', 'pending_verification'].includes(payment.manualReviewState)
);
