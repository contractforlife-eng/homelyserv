const DAY_MS = 24 * 60 * 60 * 1000;
const MATCHED = 'MATCHED';
const MISMATCH = 'MISMATCH';
const REVIEW_REQUIRED = 'REVIEW_REQUIRED';
const PLAN_DURATIONS = Object.freeze({ weekly: 7, monthly: 30 });
const KNOWN_GRANT_STATUSES = new Set(['active', 'reversed', 'review_required']);

export const SUBSCRIPTION_ENTITLEMENT_IMPACTS = Object.freeze({
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  REVERSED: 'REVERSED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED_ENTITLEMENT_ACTIVE: 'REFUNDED_ENTITLEMENT_ACTIVE',
  REFUNDED_ENTITLEMENT_REVERSED: 'REFUNDED_ENTITLEMENT_REVERSED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

export const SUBSCRIPTION_REFUND_ELIGIBILITY = Object.freeze({
  ELIGIBLE_FOR_ADMIN_REVIEW: 'ELIGIBLE_FOR_ADMIN_REVIEW',
  BLOCKED_PARTIAL_UNSUPPORTED: 'BLOCKED_PARTIAL_UNSUPPORTED',
  BLOCKED_MISSING_PROVIDER_EVIDENCE: 'BLOCKED_MISSING_PROVIDER_EVIDENCE',
  BLOCKED_MISSING_GRANT_CONTEXT: 'BLOCKED_MISSING_GRANT_CONTEXT',
  REQUIRES_ENTITLEMENT_DECISION: 'REQUIRES_ENTITLEMENT_DECISION',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

const addReason = (reasons, code, severity) => {
  if (!reasons.some((reason) => reason.code === code)) reasons.push({ code, severity });
};

const hasSnapshotField = (metadata, key) => (
  metadata && typeof metadata === 'object' && Object.hasOwn(metadata, key)
);

export const reconcileSubscriptionRefund = (payment, { relatedGrants = [] } = {}) => {
  if (String(payment?.purpose || '').toUpperCase() !== 'SUBSCRIPTION') return null;

  const reasons = [];
  const grant = payment.SubscriptionGrant || null;
  const refunds = payment.Refunds || [];
  const metadata = payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {};
  const snapshotFields = ['plan', 'purchaserRole', 'durationDays'];
  const snapshotCount = snapshotFields.filter((key) => hasSnapshotField(metadata, key)).length;
  const isSnapshotted = snapshotCount > 0;
  const isLegacyPlanless = snapshotCount === 0;
  const completedRefunds = refunds.filter((refund) => refund.status === 'completed');
  const completedFullRefund = completedRefunds.some((refund) => String(refund.type).toUpperCase() === 'FULL');
  const hasPartialRefund = refunds.some((refund) => String(refund.type).toUpperCase() === 'PARTIAL');
  const hasPendingRefund = refunds.some((refund) => ['pending', 'processing'].includes(refund.status));

  if (isSnapshotted && snapshotCount !== snapshotFields.length) {
    addReason(reasons, 'INCOMPLETE_SUBSCRIPTION_PAYMENT_METADATA', REVIEW_REQUIRED);
  }
  if (isSnapshotted) {
    if (!PLAN_DURATIONS[metadata.plan] || metadata.durationDays !== PLAN_DURATIONS[metadata.plan]) {
      addReason(reasons, 'INVALID_SUBSCRIPTION_PAYMENT_METADATA', MISMATCH);
    }
    if (!['EMPLOYER', 'WORKER'].includes(metadata.purchaserRole)) {
      addReason(reasons, 'INVALID_SUBSCRIPTION_PURCHASER_ROLE_METADATA', MISMATCH);
    }
  }

  if (!grant) {
    if (payment.fulfillmentStatus === 'fulfilled') {
      addReason(
        reasons,
        isSnapshotted ? 'SNAPSHOTTED_FULFILLED_SUBSCRIPTION_MISSING_GRANT' : 'LEGACY_FULFILLED_SUBSCRIPTION_MISSING_GRANT',
        isSnapshotted ? MISMATCH : REVIEW_REQUIRED
      );
    } else if (completedFullRefund && isLegacyPlanless) {
      addReason(reasons, 'LEGACY_REFUNDED_SUBSCRIPTION_GRANT_CONTEXT_MISSING', REVIEW_REQUIRED);
    }
  } else {
    if (String(grant.paymentId) !== String(payment.id)) {
      addReason(reasons, 'SUBSCRIPTION_GRANT_PAYMENT_MISMATCH', MISMATCH);
    }
    if (payment.userId && String(grant.userId) !== String(payment.userId)) {
      addReason(reasons, 'SUBSCRIPTION_GRANT_USER_MISMATCH', MISMATCH);
    }
    if (isSnapshotted) {
      if (grant.plan !== metadata.plan) addReason(reasons, 'SUBSCRIPTION_GRANT_PLAN_MISMATCH', MISMATCH);
      if (grant.purchaserRole !== metadata.purchaserRole) addReason(reasons, 'SUBSCRIPTION_GRANT_ROLE_MISMATCH', MISMATCH);
      if (grant.durationDays !== metadata.durationDays) addReason(reasons, 'SUBSCRIPTION_GRANT_DURATION_MISMATCH', MISMATCH);
    } else if (grant.plan !== 'legacy_monthly' || grant.durationDays !== 30) {
      addReason(reasons, 'LEGACY_SUBSCRIPTION_GRANT_MISMATCH', MISMATCH);
    }

    const startsAt = new Date(grant.startsAt);
    const endsAt = new Date(grant.endsAt);
    if (
      Number.isNaN(startsAt.getTime())
      || Number.isNaN(endsAt.getTime())
      || endsAt.getTime() - startsAt.getTime() !== grant.durationDays * DAY_MS
    ) {
      addReason(reasons, 'SUBSCRIPTION_GRANT_INTERVAL_MISMATCH', MISMATCH);
    }
    if (!KNOWN_GRANT_STATUSES.has(grant.status)) {
      addReason(reasons, 'UNKNOWN_SUBSCRIPTION_GRANT_STATUS', REVIEW_REQUIRED);
    }
    if (grant.status === 'active' && grant.reversedAt) {
      addReason(reasons, 'ACTIVE_SUBSCRIPTION_GRANT_HAS_REVERSAL_TIMESTAMP', MISMATCH);
    }
    if (grant.status === 'reversed') {
      if (!grant.reversedAt) addReason(reasons, 'REVERSED_SUBSCRIPTION_GRANT_MISSING_TIMESTAMP', REVIEW_REQUIRED);
      if (!grant.reversalReason) addReason(reasons, 'REVERSED_SUBSCRIPTION_GRANT_MISSING_REASON', REVIEW_REQUIRED);
      if (!grant.reversedBy) addReason(reasons, 'REVERSED_SUBSCRIPTION_GRANT_MISSING_OPERATOR', REVIEW_REQUIRED);
    }
    if (['pending', 'failed'].includes(payment.status)) {
      addReason(reasons, 'NON_COMPLETED_SUBSCRIPTION_PAYMENT_HAS_GRANT', MISMATCH);
    }
    if (payment.status === 'completed' && payment.fulfillmentStatus !== 'fulfilled') {
      addReason(
        reasons,
        'SUBSCRIPTION_GRANT_WITH_INCOMPLETE_FULFILLMENT',
        isSnapshotted ? MISMATCH : REVIEW_REQUIRED
      );
    }
  }

  if (hasPartialRefund) addReason(reasons, 'PARTIAL_SUBSCRIPTION_REFUND_UNSUPPORTED', REVIEW_REQUIRED);
  if (completedFullRefund && grant?.status === 'active') {
    addReason(reasons, 'REFUNDED_SUBSCRIPTION_GRANT_STILL_ACTIVE', REVIEW_REQUIRED);
  }
  if (grant?.status === 'reversed' && !completedFullRefund) {
    addReason(reasons, 'SUBSCRIPTION_GRANT_REVERSED_WITHOUT_COMPLETED_REFUND', REVIEW_REQUIRED);
  }

  const laterGrants = grant
    ? relatedGrants.filter((candidate) => (
      String(candidate.paymentId) !== String(grant.paymentId)
      && new Date(candidate.startsAt).getTime() >= new Date(grant.endsAt).getTime()
    ))
    : [];
  if ((completedFullRefund || grant?.status === 'reversed') && laterGrants.length > 0) {
    addReason(reasons, 'STACKED_SUBSCRIPTION_INTERVAL_REVERSAL_POLICY_UNRESOLVED', REVIEW_REQUIRED);
  }

  let entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.NONE;
  if (hasPendingRefund) entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REFUND_PENDING;
  else if (completedFullRefund && grant?.status === 'active') entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REFUNDED_ENTITLEMENT_ACTIVE;
  else if (completedFullRefund && grant?.status === 'reversed') entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REFUNDED_ENTITLEMENT_REVERSED;
  else if (grant?.status === 'active') entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.ACTIVE;
  else if (grant?.status === 'reversed') entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REVERSED;
  else if (grant) entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REVIEW_REQUIRED;
  if (!grant && reasons.length > 0) entitlementImpact = SUBSCRIPTION_ENTITLEMENT_IMPACTS.REVIEW_REQUIRED;

  let refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.NOT_APPLICABLE;
  if (hasPartialRefund) refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.BLOCKED_PARTIAL_UNSUPPORTED;
  else if (!payment.providerAmount || !payment.providerCurrency) refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.BLOCKED_MISSING_PROVIDER_EVIDENCE;
  else if (payment.fulfillmentStatus === 'fulfilled' && !grant) refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.BLOCKED_MISSING_GRANT_CONTEXT;
  else if (grant?.status === 'active' && completedFullRefund) refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.REQUIRES_ENTITLEMENT_DECISION;
  else if (completedFullRefund) refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.NOT_APPLICABLE;
  else if (payment.status === 'completed') refundEligibility = SUBSCRIPTION_REFUND_ELIGIBILITY.ELIGIBLE_FOR_ADMIN_REVIEW;

  const state = reasons.some((reason) => reason.severity === MISMATCH)
    ? MISMATCH
    : reasons.length > 0 ? REVIEW_REQUIRED : MATCHED;

  return {
    state,
    grantPresent: Boolean(grant),
    grantPlan: grant?.plan || null,
    grantDurationDays: grant?.durationDays || null,
    grantStatus: grant?.status || null,
    legacyPlanless: isLegacyPlanless,
    entitlementImpact,
    refundEligibility,
    reasons,
  };
};

export default reconcileSubscriptionRefund;
