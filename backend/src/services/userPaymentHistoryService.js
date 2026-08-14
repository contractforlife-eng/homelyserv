import prisma from '../lib/prisma.js';
import {
  getDuplicateRefundEvidence,
  reconcilePayment,
} from './paymentReconciliationService.js';

export const DEFAULT_PAYMENT_HISTORY_LIMIT = 20;
const MAX_PAYMENT_HISTORY_LIMIT = 25;

const normalizeProvider = (payment) => {
  const method = String(payment?.paymentMethod || '').trim().toLowerCase();
  if (method === 'paypal') return 'PayPal';
  if (method === 'paymob') return 'Paymob';
  return null;
};

const paymentPurpose = (payment) => {
  const purpose = String(payment?.purpose || '').trim().toUpperCase();
  return ['SUBSCRIPTION', 'COMMISSION'].includes(purpose) ? purpose : 'LEGACY';
};

const paidForContext = (payment) => {
  const purpose = paymentPurpose(payment);
  if (purpose === 'SUBSCRIPTION') {
    const grant = payment.SubscriptionGrant;
    return {
      type: 'SUBSCRIPTION',
      plan: grant?.plan || null,
      purchaserRole: grant?.purchaserRole || null,
      durationDays: grant?.durationDays || null,
      entitlementStatus: grant?.status || null,
      startsAt: grant?.startsAt || null,
      endsAt: grant?.endsAt || null,
    };
  }
  if (purpose === 'COMMISSION') {
    return {
      type: 'COMMISSION',
      hireId: payment.hireId || null,
      jobTitle: payment.jobTitle || null,
      workerName: payment.workerName || null,
      employerName: payment.employerName || null,
    };
  }
  return { type: 'LEGACY' };
};

const commonRefund = (refund) => ({
  type: refund.type,
  status: refund.status,
  bookAmount: refund.bookAmount,
  bookCurrency: refund.bookCurrency,
  providerAmount: refund.providerAmount,
  providerCurrency: refund.providerCurrency,
  createdAt: refund.createdAt,
  completedAt: refund.completedAt,
  failedAt: refund.failedAt,
});

const supportVerificationState = (payment, reconciliation) => {
  if (reconciliation.state !== 'MATCHED') return 'NEEDS_REVIEW';
  if ((payment.Refunds || []).some((refund) => ['pending', 'processing'].includes(refund.status))) {
    return 'REFUND_PROCESSING';
  }
  if ((payment.Refunds || []).some((refund) => refund.status === 'completed')) {
    return 'REFUND_COMPLETED';
  }
  return payment.status === 'completed' ? 'PAYMENT_VERIFIED' : 'PAYMENT_PENDING';
};

export const buildPaymentHistoryItem = (payment, reconciliation, audience) => {
  const provider = normalizeProvider(payment);
  const common = {
    id: payment.id,
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    purpose: paymentPurpose(payment),
    paidFor: paidForContext(payment),
    bookAmount: payment.amount,
    bookCurrency: payment.currency,
    provider: {
      name: provider,
      method: payment.paymentMethod || null,
      amount: payment.providerAmount,
      currency: payment.providerCurrency,
      evidenceAvailable: payment.providerAmount != null && payment.providerCurrency != null,
    },
    status: payment.status,
    refunds: (payment.Refunds || []).map(commonRefund),
  };

  if (audience === 'support') {
    return {
      ...common,
      verificationState: supportVerificationState(payment, reconciliation),
    };
  }

  return {
    ...common,
    fulfillmentStatus: payment.fulfillmentStatus,
    references: {
      orderId: payment.orderId,
      transactionId: payment.transactionId,
      paypalOrderId: payment.paypalOrderId,
      captureId: payment.captureId,
      paymobOrderId: payment.paymobOrderId,
      paymobTransactionId: payment.paymobTransactionId,
      hireId: payment.hireId,
    },
    refunds: (payment.Refunds || []).map((refund) => ({
      ...commonRefund(refund),
      id: refund.id,
      requestedProviderAmount: refund.requestedProviderAmount,
      providerRefundId: refund.providerRefundId,
      reason: refund.reason,
    })),
    reconciliation: {
      state: reconciliation.state,
      refundState: reconciliation.refundSummary.refundState,
      subscriptionState: reconciliation.subscriptionReconciliation?.state || null,
    },
  };
};

export const getUserPaymentHistory = async ({ userId, page = 1, limit = DEFAULT_PAYMENT_HISTORY_LIMIT, audience }) => {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_PAYMENT_HISTORY_LIMIT, Math.max(1, Number.parseInt(limit, 10) || DEFAULT_PAYMENT_HISTORY_LIMIT));
  const where = {
    OR: [
      { userId },
      // Legacy commission rows may identify the payer only as employerId.
      { employerId: userId },
    ],
  };

  const [pagePayments, relatedGrants, refundEvidencePayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        Refunds: { orderBy: { createdAt: 'desc' } },
        SubscriptionGrant: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit + 1,
    }),
    prisma.subscriptionGrant.findMany({
      where: { userId },
      select: {
        paymentId: true,
        userId: true,
        plan: true,
        durationDays: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    }),
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        Refunds: {
          select: {
            providerRefundId: true,
            idempotencyKey: true,
          },
        },
      },
    }),
  ]);

  const hasMore = pagePayments.length > parsedLimit;
  const payments = pagePayments.slice(0, parsedLimit);
  const duplicateEvidence = getDuplicateRefundEvidence(refundEvidencePayments);
  const items = payments.map((payment) => {
    const reconciliation = reconcilePayment(payment, duplicateEvidence, { relatedGrants });
    return buildPaymentHistoryItem(payment, reconciliation, audience);
  });

  return {
    items,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      hasMore,
      nextPage: hasMore ? parsedPage + 1 : null,
    },
  };
};
