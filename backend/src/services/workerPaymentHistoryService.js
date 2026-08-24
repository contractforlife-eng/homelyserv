// Curated, read-only financial history for the authenticated Worker.
// This intentionally excludes payout details, provider identifiers, and secrets.
import prisma from '../lib/prisma.js';

const planFromMetadata = (metadata) => (
  metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata.plan || null
    : null
);

const MANUAL_PAYMENT_METHODS = new Set(['bank_transfer', 'vodafone_cash', 'instapay']);
const MANUAL_REVIEW_STATES_TO_SHOW = new Set([
  'awaiting_transfer',
  'proof_submitted',
  'pending_verification',
  'verified',
  'rejected',
]);

// Only expose payment records that represent a meaningful financial or review outcome.
// Transient provider attempts (pending/processing/created/approval-required) remain
// stored for reconciliation but are intentionally omitted from Worker history.
export const isMeaningfulPremiumPayment = (payment) => {
  const status = String(payment?.status || '').trim().toLowerCase();
  const paymentMethod = String(payment?.paymentMethod || '').trim().toLowerCase();
  const fulfillmentStatus = String(payment?.fulfillmentStatus || '').trim().toLowerCase();
  const manualReviewState = String(payment?.manualReviewState || '').trim().toLowerCase();

  if (status === 'completed' || status === 'failed' || fulfillmentStatus === 'fulfilled') return true;

  return MANUAL_PAYMENT_METHODS.has(paymentMethod)
    && MANUAL_REVIEW_STATES_TO_SHOW.has(manualReviewState);
};

export const buildWorkerPaymentHistory = ({ payments, manualGrant, legacyManualSubscriptions }) => ({
  paid: (payments || []).filter(isMeaningfulPremiumPayment).map((payment) => ({
    source: 'paid',
    plan: payment.SubscriptionGrant?.plan || planFromMetadata(payment.metadata),
    status: payment.status,
    paymentStatus: payment.status,
    subscriptionStatus: payment.SubscriptionGrant?.status || null,
    startDate: payment.SubscriptionGrant?.startsAt || null,
    endDate: payment.SubscriptionGrant?.endsAt || null,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.paymentMethod || null,
    paymentDate: payment.completedAt || payment.createdAt,
    createdAt: payment.createdAt,
  })),
  manual: [
    ...(manualGrant ? [{
      source: 'manual',
      plan: 'manual',
      status: manualGrant.status,
      startDate: manualGrant.startDate,
      endDate: manualGrant.endDate,
      amount: null,
      currency: null,
      provider: null,
      paymentDate: manualGrant.createdAt,
      createdAt: manualGrant.createdAt,
    }] : []),
    ...(legacyManualSubscriptions || []).map((subscription) => ({
      source: 'manual',
      plan: 'manual',
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      amount: null,
      currency: null,
      provider: 'Admin Grant',
      paymentDate: subscription.createdAt,
      createdAt: subscription.createdAt,
    })),
  ],
});

export const getWorkerPaymentHistory = async (userId, db = prisma) => {
  const id = String(userId);
  const [payments, manualGrant, legacyManualSubscriptions] = await Promise.all([
    db.payment.findMany({
      where: { userId: id, purpose: 'SUBSCRIPTION' },
      select: {
        amount: true,
        currency: true,
        paymentMethod: true,
        status: true,
        fulfillmentStatus: true,
        manualReviewState: true,
        metadata: true,
        createdAt: true,
        completedAt: true,
        SubscriptionGrant: {
          select: {
            plan: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.manualPremiumGrant.findUnique({
      where: { userId: id },
      select: { status: true, startDate: true, endDate: true, createdAt: true },
    }),
    db.subscription.findMany({
      where: { userId: id, plan: 'manual' },
      select: { status: true, startDate: true, endDate: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return buildWorkerPaymentHistory({ payments, manualGrant, legacyManualSubscriptions });
};

export default getWorkerPaymentHistory;
