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

// Group an array of { amount, createdAt } by month, summing amounts.
const sumByMonth = (items) => {
  const map = {};
  for (const item of items) {
    const date = new Date(item.createdAt);
    if (isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + (item.amount || 0);
  }
  return Object.entries(map)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

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
      recentCompletedPayments,
      revenueByMethodAgg,
      totalRevenueAgg,
      // ---- Hires ----
      totalHires,
      recentHires,
      hiresByStatusAgg,
      // ---- Complaints ----
      totalComplaints,
      recentComplaints,
      complaintsByStatusAgg,
      // ---- Subscriptions ----
      subscriptions,
      // ---- Worker categories ----
      workerProfiles,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.user.count(),

      prisma.payment.findMany({
        where: { status: 'completed', createdAt: { gte: twelveMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: { paymentMethod: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
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
        select: { plan: true, amount: true, status: true, createdAt: true },
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
    const revenueByMethod = (revenueByMethodAgg || []).map((item) => ({
      method: item.paymentMethod || 'unknown',
      total: item._sum.amount || 0,
      count: item._count.paymentMethod || 0,
    }));

    const revenueOverview = {
      total: totalRevenueAgg._sum.amount || 0,
      byMonth: sumByMonth(recentCompletedPayments),
      byMethod: revenueByMethod,
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
    const subsByPlan = {};
    subscriptions.forEach((s) => {
      subsByPlan[s.plan] = (subsByPlan[s.plan] || 0) + 1;
    });
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const subscriptionRevenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

    const subscriptionStatistics = {
      total: subscriptions.length,
      active: activeSubs.length,
      byPlan: subsByPlan,
      revenue: subscriptionRevenue,
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