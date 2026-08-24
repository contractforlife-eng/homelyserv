// Curated, read-only financial history for the authenticated Worker.
// This intentionally excludes payout details, provider identifiers, and secrets.
import prisma from '../lib/prisma.js';

const planFromMetadata = (metadata) => (
  metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata.plan || null
    : null
);

export const buildWorkerPaymentHistory = ({ payments, manualGrant, legacyManualSubscriptions }) => ({
  paid: (payments || []).map((payment) => ({
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
