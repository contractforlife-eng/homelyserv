import crypto from 'crypto';

const ATTEMPT_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
export const PAYPAL_PROVIDER_CLAIM_TIMEOUT_MS = 60_000;

// MongoDB distinguishes an optional field that is explicitly null from one that
// is absent. Claiming must treat both representations as missing provider evidence.
export const getPayPalProviderEvidenceMissingFilter = () => ({
  AND: [
    {
      OR: [
        { paypalOrderId: null },
        { paypalOrderId: { isSet: false } },
      ],
    },
    {
      OR: [
        { approvalUrl: null },
        { approvalUrl: { isSet: false } },
      ],
    },
  ],
});

export const normalizePayPalSubscriptionAttemptKey = (value) => {
  const key = String(value || '').trim();
  return ATTEMPT_KEY_PATTERN.test(key) ? key : null;
};

export const buildPayPalSubscriptionOrderId = ({ userId, purpose, planId, purchaserRole, attemptKey }) => {
  const scope = [String(userId), String(purpose), String(planId), String(purchaserRole), String(attemptKey)].join('|');
  return `PP-${crypto.createHash('sha256').update(scope).digest('hex').slice(0, 40)}`;
};

export const isActionablePayPalSubscription = (payment, { userId, planId, purchaserRole } = {}) => Boolean(
  payment
  && payment.paymentMethod === 'paypal'
  && payment.purpose === 'SUBSCRIPTION'
  && String(payment.userId) === String(userId)
  && ['pending', 'processing'].includes(payment.status)
  && payment.metadata?.plan === planId
  && payment.metadata?.purchaserRole === purchaserRole
);

export const getPayPalProviderClaimTimestamp = (payment) => {
  const metadataTimestamp = payment?.metadata?.paypalProviderClaimedAt;
  const timestamp = metadataTimestamp || payment?.updatedAt || payment?.createdAt;
  const parsed = timestamp ? new Date(timestamp).getTime() : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

export const isPayPalProviderClaimStale = (payment, now = Date.now()) => {
  const claimedAt = getPayPalProviderClaimTimestamp(payment);
  return claimedAt == null || now - claimedAt >= PAYPAL_PROVIDER_CLAIM_TIMEOUT_MS;
};

export default {
  normalizePayPalSubscriptionAttemptKey,
  getPayPalProviderEvidenceMissingFilter,
  buildPayPalSubscriptionOrderId,
  isActionablePayPalSubscription,
  getPayPalProviderClaimTimestamp,
  isPayPalProviderClaimStale,
};
