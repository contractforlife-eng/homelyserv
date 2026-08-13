// backend/src/controllers/adminController.js
// ============================================================
// ADMIN ANALYTICS - Real aggregated data from Prisma models
//
// GET /api/admin/analytics
// Returns: usersGrowth, revenueOverview, hiresStatistics,
//          complaintsStatistics, subscriptionStatistics,
//          categoryDistribution
//
// No fake numbers. All data comes from the database.
// ============================================================
import prisma from '../lib/prisma.js';
import { addMoney } from '../utils/money.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

// ============================================================
// HELPERS
// ============================================================

// Group an array of dates by month (YYYY-MM) and return sorted counts.
const groupByMonth = (dates) => {
  const map = {};
  for (const d of dates) {
    const date = new Date(d);
    if (isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const currencyOrder = ['EGP', 'USD', 'EUR', 'GBP'];

export const aggregateAdminMoney = (records, dimensions = []) => {
  const groups = new Map();
  let rejectedCount = 0;
  for (const record of records || []) {
    const currency = normalizeCurrencyCode(record?.currency);
    if (!currency || !isSupportedCurrency(currency)) {
      rejectedCount += 1;
      continue;
    }
    const values = dimensions.map((dimension) => String(record?.[dimension] ?? 'unknown'));
    const key = JSON.stringify([currency, ...values]);
    const group = groups.get(key) || { currency, values, amounts: [] };
    group.amounts.push(record.amount);
    groups.set(key, group);
  }
  const totals = [...groups.values()].map((group) => {
    const result = { currency: group.currency, amount: addMoney(group.amounts, group.currency) };
    dimensions.forEach((dimension, index) => { result[dimension] = group.values[index]; });
    return result;
  });
  totals.sort((a, b) => {
    for (const dimension of dimensions) {
      const comparison = String(a[dimension]).localeCompare(String(b[dimension]));
      if (comparison !== 0) return comparison;
    }
    const aIndex = currencyOrder.indexOf(a.currency);
    const bIndex = currencyOrder.indexOf(b.currency);
    return (aIndex < 0 ? currencyOrder.length : aIndex) - (bIndex < 0 ? currencyOrder.length : bIndex)
      || a.currency.localeCompare(b.currency);
  });
  return { totals, rejectedCount };
};

const withPaymentMonth = (payments) => (payments || []).map((payment) => {
  const date = new Date(payment.createdAt);
  return {
    ...payment,
    month: Number.isNaN(date.getTime())
      ? 'unknown'
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  };
});

// ============================================================
// GET /api/admin/analytics
// ============================================================
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // ============================================================
    // ALL QUERIES RUN IN PARALLEL
    // ============================================================
    const [
      // ---- Users ----
      recentUsers,
      totalUsers,
      // ---- Payments (completed) ----
      completedPayments,
      // ---- Hires ----
      totalHires,
      recentHires,
      hiresByStatusAgg,
      // ---- Complaints ----
      totalComplaints,
      recentComplaints,
      complaintsByStatusAgg,
      // ---- Subscriptions ----
      activePremiumUsers,
      subscriptionGrants,
      legacySubscriptionProjections,
      // ---- Worker categories ----
      workerProfiles,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.user.count(),

      prisma.payment.findMany({
        where: { status: 'completed' },
        select: {
          amount: true, currency: true, paymentMethod: true, purpose: true, createdAt: true,
        },
      }),

      prisma.hire.count(),
      prisma.hire.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.hire.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      prisma.complaint.count(),
      prisma.complaint.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.complaint.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      prisma.subscription.findMany({
        where: { status: 'active', endDate: { gt: now } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.subscriptionGrant.groupBy({ by: ['plan'], _count: { _all: true } }),
      prisma.subscription.count({
        where: { plan: { notIn: ['weekly', 'monthly', 'legacy_monthly'] } },
      }),

      prisma.workerProfile.findMany({
        select: { category: true },
      }),
    ]);

    // ============================================================
    // USERS GROWTH
    // ============================================================
    const usersGrowth = groupByMonth(recentUsers.map((u) => u.createdAt));

    // ============================================================
    // REVENUE OVERVIEW
    // ============================================================
    const revenueByCurrency = aggregateAdminMoney(completedPayments);
    const revenueByMethod = aggregateAdminMoney(completedPayments, ['paymentMethod']);
    const recentCompletedPayments = completedPayments.filter((payment) => payment.createdAt >= twelveMonthsAgo);
    const revenueByMonth = aggregateAdminMoney(withPaymentMonth(recentCompletedPayments), ['month']);
    const commissionRevenue = aggregateAdminMoney(
      completedPayments.filter((payment) => payment.purpose === 'COMMISSION')
    );
    const completedSubscriptionPayments = completedPayments.filter((payment) => (
      payment.purpose === 'SUBSCRIPTION' && payment.currency === 'EGP'
    ));
    const subscriptionRevenue = aggregateAdminMoney(completedSubscriptionPayments).totals
      .find((entry) => entry.currency === 'EGP')?.amount || 0;

    const revenueOverview = {
      byCurrency: revenueByCurrency.totals,
      byMonth: revenueByMonth.totals,
      byMethod: revenueByMethod.totals,
      commissionByCurrency: commissionRevenue.totals,
      rejectedCurrencyRecords: revenueByCurrency.rejectedCount,
      semantic: 'gross_completed_payment_book_revenue_by_currency',
    };

    // ============================================================
    // HIRES STATISTICS
    // ============================================================
    const hiresByStatus = {};
    (hiresByStatusAgg || []).forEach((h) => {
      hiresByStatus[h.status] = h._count.status;
    });

    const hiresStatistics = {
      total: totalHires,
      byStatus: hiresByStatus,
      byMonth: groupByMonth(recentHires.map((h) => h.createdAt)),
    };

    // ============================================================
    // COMPLAINTS STATISTICS
    // ============================================================
    const complaintsByStatus = {};
    (complaintsByStatusAgg || []).forEach((c) => {
      complaintsByStatus[c.status] = c._count.status;
    });

    const complaintsStatistics = {
      total: totalComplaints,
      byStatus: complaintsByStatus,
      byMonth: groupByMonth(recentComplaints.map((c) => c.createdAt)),
    };

    // ============================================================
    // SUBSCRIPTION STATISTICS
    // ============================================================
    const grantsByPlan = { weekly: 0, monthly: 0, legacy: 0 };
    subscriptionGrants.forEach((grant) => {
      const count = grant._count._all;
      if (grant.plan === 'weekly' || grant.plan === 'monthly') grantsByPlan[grant.plan] += count;
      else grantsByPlan.legacy += count;
    });

    const subscriptionStatistics = {
      activePremiumUsers: activePremiumUsers.length,
      active: activePremiumUsers.length, // Backward-compatible AdminReports contract.
      completedPurchases: completedSubscriptionPayments.length,
      byPlan: grantsByPlan,
      legacyUntrackedProjections: legacySubscriptionProjections,
      revenue: subscriptionRevenue,
      currency: 'EGP',
      revenueSemantic: 'gross_completed_subscription_book_revenue',
      planBreakdownSemantic: 'subscription_grants_by_plan',
    };

    // ============================================================
    // CATEGORY DISTRIBUTION
    // ============================================================
    const categoryMap = {};
    workerProfiles.forEach((w) => {
      const cat = w.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      analytics: {
        totalUsers,
        usersGrowth,
        revenueOverview,
        hiresStatistics,
        complaintsStatistics,
        subscriptionStatistics,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching admin analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

export default { getAnalytics };
