import prisma from '../lib/prisma.js';
import { aggregateAdminMoney } from '../controllers/adminController.js';
import { getDuplicateRefundEvidence, reconcilePayment } from './paymentReconciliationService.js';
import { addMoney } from '../utils/money.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

const upper = (value, fallback = 'UNKNOWN') => String(value || fallback).trim().toUpperCase();
const lower = (value, fallback = 'unknown') => String(value || fallback).trim().toLowerCase();
const validCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  return currency && isSupportedCurrency(currency) ? currency : null;
};

const parseDateRange = ({ range = '30d', from, to } = {}) => {
  const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  let start = null;
  if (range === 'custom' && from) start = new Date(`${from}T00:00:00.000Z`);
  else if (range !== 'all') {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
  }
  if (Number.isNaN(end.getTime()) || (start && Number.isNaN(start.getTime()))) {
    throw new TypeError('Invalid financial date range');
  }
  return { start, end, range: ['7d', '30d', '90d', 'all', 'custom'].includes(range) ? range : '30d' };
};

const inRange = (value, dates) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && (!dates.start || date >= dates.start) && date <= dates.end;
};

export const groupFinancialMoney = (records, dimensions = []) => aggregateAdminMoney(records, dimensions);

export const subtractFinancialTotals = (gross, refunded, dimensions = []) => {
  const keyOf = (item) => JSON.stringify([item.currency, ...dimensions.map((dimension) => item[dimension] || 'unknown')]);
  const grossMap = new Map(gross.map((item) => [keyOf(item), item]));
  const refundMap = new Map(refunded.map((item) => [keyOf(item), item]));
  return [...new Set([...grossMap.keys(), ...refundMap.keys()])].map((key) => {
    const grossItem = grossMap.get(key);
    const refundItem = refundMap.get(key);
    const source = grossItem || refundItem;
    return {
      currency: source.currency,
      ...Object.fromEntries(dimensions.map((dimension) => [dimension, source[dimension] || 'unknown'])),
      amount: addMoney([grossItem?.amount || 0, `-${refundItem?.amount || 0}`], source.currency),
    };
  });
};

const normalizeProvider = (payment) => {
  const method = lower(payment.paymentMethod);
  return ['paypal', 'paymob'].includes(method) ? method : 'legacy';
};

const purposeBucket = (payment) => {
  const purpose = upper(payment.purpose, 'LEGACY');
  return ['COMMISSION', 'SUBSCRIPTION'].includes(purpose) ? purpose : 'LEGACY_OTHER';
};

const applyPaymentFilters = (payments, filters, dates) => payments.filter((payment) => {
  const financialDate = lower(payment.status) === 'completed' && payment.completedAt
    ? payment.completedAt
    : payment.createdAt;
  if (!inRange(financialDate, dates)) return false;
  if (filters.currency && filters.currency !== 'ALL' && upper(payment.currency) !== filters.currency) return false;
  if (filters.provider && filters.provider !== 'all' && normalizeProvider(payment) !== filters.provider) return false;
  if (filters.purpose && filters.purpose !== 'ALL' && purposeBucket(payment) !== filters.purpose) return false;
  if (filters.paymentStatus && filters.paymentStatus !== 'all' && lower(payment.status) !== filters.paymentStatus) return false;
  if (filters.refundStatus && filters.refundStatus !== 'all'
    && !(payment.Refunds || []).some((refund) => lower(refund.status) === filters.refundStatus)) return false;
  return true;
});

const refundEventDate = (refund) => refund.completedAt || refund.failedAt || refund.createdAt;
const safeRefundRows = (payments, dates) => payments.flatMap((payment) => (payment.Refunds || [])
  .filter((refund) => inRange(refundEventDate(refund), dates))
  .map((refund) => ({ ...refund, payment })));

const refundMoney = (refunds, view, statuses = null) => groupFinancialMoney(refunds
  .filter(({ status }) => !statuses || statuses.includes(lower(status)))
  .map((refund) => ({
    amount: view === 'book' ? refund.bookAmount : refund.providerAmount,
    currency: view === 'book' ? refund.bookCurrency : refund.providerCurrency,
  }))
  .filter(({ amount }) => amount != null));

const countBy = (items, getter) => items.reduce((acc, item) => {
  const key = getter(item);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const allReconciliationReasons = (reconciliation) => [
  ...(reconciliation?.reasons || []),
  ...(reconciliation?.subscriptionReconciliation?.reasons || []),
];

const isLegacyEvidenceReview = (payment) => {
  const reasons = allReconciliationReasons(payment.reconciliation);
  const allowed = new Set(['MISSING_PROVIDER_EVIDENCE', 'COMPLETED_PAYMENT_FULFILLMENT_INCOMPLETE']);
  return purposeBucket(payment) === 'LEGACY_OTHER'
    && reasons.length > 0
    && reasons.every((reason) => allowed.has(reason.code));
};

export const getFinancialCenterData = async (query = {}) => {
  const dates = parseDateRange(query);
  const filters = {
    currency: upper(query.currency, 'ALL'),
    provider: lower(query.provider, 'all'),
    purpose: upper(query.purpose, 'ALL'),
    paymentStatus: lower(query.paymentStatus, 'all'),
    refundStatus: lower(query.refundStatus, 'all'),
    reconciliationState: upper(query.reconciliationState, 'ALL'),
  };

  const [allPayments, hires, grants] = await Promise.all([
    prisma.payment.findMany({
      include: { Refunds: true, SubscriptionGrant: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hire.findMany({
      select: { id: true, totalDue: true, commissionAmount: true, compensationCurrency: true, paymentStatus: true, createdAt: true },
    }),
    prisma.subscriptionGrant.findMany({
      select: { paymentId: true, userId: true, plan: true, purchaserRole: true, durationDays: true, status: true, startsAt: true, endsAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const duplicateEvidence = getDuplicateRefundEvidence(allPayments);
  const grantsByUser = grants.reduce((map, grant) => {
    const list = map.get(grant.userId) || [];
    list.push(grant);
    map.set(grant.userId, list);
    return map;
  }, new Map());
  let payments = applyPaymentFilters(allPayments, filters, dates).map((payment) => ({
    ...payment,
    reconciliation: reconcilePayment(payment, duplicateEvidence, { relatedGrants: grantsByUser.get(payment.userId) || [] }),
  }));
  if (filters.reconciliationState !== 'ALL') {
    payments = payments.filter((payment) => payment.reconciliation.state === filters.reconciliationState);
  }

  const completed = payments.filter((payment) => lower(payment.status) === 'completed');
  const refunds = safeRefundRows(payments, dates);
  const completedRefunds = refunds.filter((refund) => lower(refund.status) === 'completed');
  const gross = groupFinancialMoney(completed);
  const completedBookRefunds = refundMoney(completedRefunds, 'book');
  const providerCharges = groupFinancialMoney(completed
    .filter((payment) => payment.providerAmount != null)
    .map((payment) => ({ amount: payment.providerAmount, currency: payment.providerCurrency, provider: normalizeProvider(payment) })), ['provider']);
  const providerRefunds = groupFinancialMoney(completedRefunds
    .filter((refund) => refund.providerAmount != null)
    .map((refund) => ({ amount: refund.providerAmount, currency: refund.providerCurrency, provider: normalizeProvider(refund.payment) })), ['provider']);
  const providerNet = subtractFinancialTotals(
    providerCharges.totals.map(({ currency, amount, provider }) => ({ currency, amount, provider })),
    providerRefunds.totals.map(({ currency, amount, provider }) => ({ currency, amount, provider })),
    ['provider']
  );

  const reconciliationCounts = countBy(payments, (payment) => payment.reconciliation.state);
  const reasonCounts = countBy(payments.flatMap((payment) => allReconciliationReasons(payment.reconciliation)), (reason) => reason.code);
  const criticalMismatchCount = payments.filter((payment) => payment.reconciliation.state === 'MISMATCH').length;
  const legacyEvidenceGapCount = payments.filter(isLegacyEvidenceReview).length;
  const generalReviewRequiredCount = payments.filter((payment) => (
    payment.reconciliation.state === 'REVIEW_REQUIRED' && !isLegacyEvidenceReview(payment)
  )).length;
  const needsReview = payments.filter((payment) => payment.reconciliation.state !== 'MATCHED').slice(0, 50).map((payment) => ({
    paymentId: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    purpose: purposeBucket(payment),
    provider: normalizeProvider(payment),
    state: payment.reconciliation.state,
    reasons: allReconciliationReasons(payment.reconciliation).map(({ code, severity }) => ({ code, severity })),
    reviewCategory: payment.reconciliation.state === 'MISMATCH'
      ? 'CRITICAL_MISMATCH'
      : isLegacyEvidenceReview(payment) ? 'LEGACY_EVIDENCE_GAP' : 'GENERAL_REVIEW',
    createdAt: payment.createdAt,
  }));

  const commissionPayments = payments.filter((payment) => purposeBucket(payment) === 'COMMISSION');
  const filteredHires = hires.filter((hire) => inRange(hire.createdAt, dates)
    && (filters.currency === 'ALL' || upper(hire.compensationCurrency || 'EGP') === filters.currency));
  const obligationRecords = filteredHires.map((hire) => ({
    amount: hire.totalDue ?? hire.commissionAmount,
    currency: hire.compensationCurrency || 'EGP',
    paidState: ['paid', 'completed', 'confirmed'].includes(lower(hire.paymentStatus)) ? 'paid' : 'outstanding',
  }));

  const subscriptionPayments = payments.filter((payment) => purposeBucket(payment) === 'SUBSCRIPTION');
  const subscriptionRefunds = refunds.filter((refund) => purposeBucket(refund.payment) === 'SUBSCRIPTION' && lower(refund.status) === 'completed');
  const subscriptionPaymentIds = new Set(subscriptionPayments.map((payment) => payment.id));
  const filteredGrants = grants.filter((grant) => inRange(grant.createdAt, dates) && subscriptionPaymentIds.has(grant.paymentId));
  const grantCounts = countBy(filteredGrants, (grant) => {
    if (!['weekly', 'monthly', 'annual'].includes(grant.plan)) return 'legacy';
    return `${lower(grant.purchaserRole)}_${grant.plan}`;
  });

  const activities = [
    ...payments.map((payment) => ({ type: 'PAYMENT', id: payment.id, status: payment.status, amount: payment.amount, currency: payment.currency, provider: normalizeProvider(payment), purpose: purposeBucket(payment), occurredAt: payment.completedAt || payment.createdAt })),
    ...refunds.map((refund) => ({ type: 'REFUND', id: refund.id, paymentId: refund.paymentId, status: refund.status, amount: refund.bookAmount, currency: refund.bookCurrency, providerAmount: refund.providerAmount, providerCurrency: refund.providerCurrency, occurredAt: refund.completedAt || refund.failedAt || refund.createdAt })),
    ...filteredGrants.map((grant) => ({ type: 'SUBSCRIPTION_GRANT', id: grant.paymentId, status: grant.status, plan: grant.plan, role: grant.purchaserRole, durationDays: grant.durationDays, occurredAt: grant.createdAt })),
  ].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 30);

  const invalidCurrencyReviewCount = groupFinancialMoney(payments).rejectedCount
    + refundMoney(refunds, 'book').rejectedCount
    + refundMoney(refunds, 'provider').rejectedCount;

  return {
    filters: { ...filters, range: dates.range, from: dates.start?.toISOString() || null, to: dates.end.toISOString() },
    summary: {
      grossMoneyIn: gross.totals,
      completedBookRefunds: completedBookRefunds.totals,
      netBookRevenue: subtractFinancialTotals(gross.totals, completedBookRefunds.totals),
      paymentsNeedingReview: needsReview.length,
      invalidCurrencyReviewCount,
    },
    bookRevenue: { byPurpose: groupFinancialMoney(completed.map((payment) => ({ ...payment, purpose: purposeBucket(payment) })), ['purpose']).totals },
    refunds: {
      statusCounts: countBy(refunds, (refund) => lower(refund.status)),
      typeCounts: countBy(refunds, (refund) => upper(refund.type)),
      completedBookImpact: completedBookRefunds.totals,
      completedProviderOutflow: providerRefunds.totals,
    },
    providerMovement: { charges: providerCharges.totals, refunds: providerRefunds.totals, net: providerNet },
    commission: {
      paymentStatusCounts: countBy(commissionPayments, (payment) => lower(payment.status)),
      amountsByStatus: groupFinancialMoney(commissionPayments.map((payment) => ({ ...payment, paymentStatus: lower(payment.status) })), ['paymentStatus']).totals,
      completedRevenue: groupFinancialMoney(commissionPayments.filter((payment) => lower(payment.status) === 'completed')).totals,
      obligations: groupFinancialMoney(obligationRecords).totals,
      paidObligations: groupFinancialMoney(obligationRecords.filter((item) => item.paidState === 'paid')).totals,
      outstandingObligations: groupFinancialMoney(obligationRecords.filter((item) => item.paidState === 'outstanding')).totals,
    },
    subscription: {
      paymentStatusCounts: countBy(subscriptionPayments, (payment) => lower(payment.status)),
      completedRevenue: groupFinancialMoney(subscriptionPayments.filter((payment) => lower(payment.status) === 'completed')).totals,
      completedRefunds: refundMoney(subscriptionRefunds, 'book').totals,
      netRevenue: subtractFinancialTotals(
        groupFinancialMoney(subscriptionPayments.filter((payment) => lower(payment.status) === 'completed')).totals,
        refundMoney(subscriptionRefunds, 'book').totals
      ),
      grantCounts,
    },
    reconciliation: {
      counts: reconciliationCounts,
      reviewSummary: { criticalMismatchCount, generalReviewRequiredCount, legacyEvidenceGapCount },
      topReasons: Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, count]) => ({ code, count })),
      needsReview,
    },
    recentActivity: activities,
    semantics: {
      gross: 'gross_completed_book_revenue_by_currency',
      net: 'gross_completed_book_revenue_minus_completed_book_refunds_by_currency',
      provider: 'stored_provider_evidence_only_not_book_revenue',
      obligations: 'hire_commission_obligations_not_realized_payment_revenue',
    },
  };
};

export default getFinancialCenterData;
