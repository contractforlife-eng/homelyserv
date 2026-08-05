// backend/src/controllers/adminCommandCenterController.js
// ============================================================
// ADMIN COMMAND CENTER - Aggregated dashboard endpoint
//
// GET /api/admin/command-center
// Returns all platform KPIs, needs-attention complaints,
// recent activity, recent users, recent payments, and recent hires
// in a single response using parallel queries (Promise.all).
//
// Security: protected by requireAdmin (which internally calls
// authenticate) at the router level in routes/admin.js.
//
// Performance: uses Prisma count()/aggregate() and Mongoose
// countDocuments() — never loads full collections.
// ============================================================
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';

// ============================================================
// LIGHTWEIGHT COMPLAINT SERIALIZER
// (kept local to avoid modifying the complaint system)
// ============================================================
const serializeComplaint = (complaint) => {
  if (!complaint) return null;
  return {
    id: complaint.id,
    ticketNumber: complaint.ticketNumber || null,
    userId: complaint.userId,
    subject: complaint.subject,
    description: complaint.description,
    status: complaint.status,
    priority: complaint.priority,
    category: complaint.category || 'Other',
    assignedSupport: complaint.AssignedSupport
      ? {
          id: complaint.AssignedSupport.id,
          fullName: complaint.AssignedSupport.fullName,
          email: complaint.AssignedSupport.email,
          role: complaint.AssignedSupport.role,
          image: complaint.AssignedSupport.image,
        }
      : null,
    escalatedAt: complaint.escalatedAt,
    escalationReason: complaint.escalationReason,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    User: complaint.User
      ? {
          id: complaint.User.id,
          fullName: complaint.User.fullName,
          email: complaint.User.email,
          role: complaint.User.role,
          image: complaint.User.image,
        }
      : null,
  };
};

// ============================================================
// GET /api/admin/command-center
// ============================================================
export const getCommandCenter = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================================
    // ALL QUERIES RUN IN PARALLEL (Promise.all)
    // ============================================================
    const [
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalSupport,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      newUsers7d,
      totalComplaints,
      openComplaints,
      escalatedComplaints,
      resolvedToday,
      totalPayments,
      verifiedPayments,
      pendingPayments,
      totalRevenueAgg,
      totalHires,
      activeHires,
      completedHires,
      unreadNotifications,
      unreadSupportMessages,
      needsAttention,
      recentActivity,
      recentUsers,
      recentPayments,
      recentHires,
    ] = await Promise.all([
      // ---- User stats ----
      prisma.user.count(),
      prisma.user.count({ where: { role: 'WORKER' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.user.count({ where: { role: 'SUPPORT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isSuspended: false } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

      // ---- Complaint stats ----
      prisma.complaint.count(),
      prisma.complaint.count({
        where: { status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER'] } },
      }),
      prisma.complaint.count({ where: { status: 'ESCALATED' } }),
      prisma.complaint.count({
        where: { status: 'RESOLVED', resolvedAt: { gte: today } },
      }),

      // ---- Payment stats ----
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'completed' } }),
      prisma.payment.count({
        where: { status: { in: ['pending', 'processing', 'pending_verification'] } },
      }),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),

      // ---- Hire stats ----
      prisma.hire.count(),
      prisma.hire.count({ where: { status: 'active' } }),
      prisma.hire.count({ where: { status: 'completed' } }),

      // ---- Notifications & messages ----
      prisma.notification.count({
        where: { isRead: false, User: { role: 'ADMIN' } },
      }),
      Message.countDocuments({
        read: false,
        recipientRole: { $in: ['ADMIN', 'SUPPORT'] },
      }),

      // ---- Needs attention (max 10) ----
      prisma.complaint.findMany({
        where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
        include: {
          User: { select: { id: true, fullName: true, email: true, role: true, image: true } },
          AssignedSupport: { select: { id: true, fullName: true, email: true, role: true, image: true } },
        },
        orderBy: [{ priority: 'desc' }, { status: 'asc' }, { createdAt: 'desc' }],
        take: 10,
      }),

      // ---- Recent activity (max 20) ----
      prisma.complaintTimeline.findMany({
        include: {
          Complaint: {
            select: { id: true, ticketNumber: true, subject: true, status: true, priority: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // ---- Recent users (max 10) ----
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          phone: true,
          city: true,
          image: true,
          isVerified: true,
          isSuspended: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // ---- Recent payments (max 10) ----
      prisma.payment.findMany({
        include: {
          User: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // ---- Recent hires (max 10) ----
      prisma.hire.findMany({
        include: {
          WorkerProfile: {
            include: { User: { select: { fullName: true, phone: true, city: true } } },
          },
          User: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // ============================================================
    // SORT NEEDS ATTENTION
    // Order: Critical > Escalated > Waiting for User > Newest
    // ============================================================
    const priorityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const statusWeight = { ESCALATED: 0, WAITING_FOR_USER: 1, NEW: 2, OPEN: 3, IN_PROGRESS: 4 };
    needsAttention.sort((a, b) => {
      const aW = (priorityWeight[a.priority] ?? 4) * 10 + (statusWeight[a.status] ?? 5);
      const bW = (priorityWeight[b.priority] ?? 4) * 10 + (statusWeight[b.status] ?? 5);
      return aW - bW;
    });

    return res.json({
      success: true,
      stats: {
        // Users
        totalUsers,
        totalWorkers,
        totalEmployers,
        totalSupport,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        newUsers7d,
        // Complaints
        totalComplaints,
        openComplaints,
        escalatedComplaints,
        resolvedToday,
        // Payments
        totalPayments,
        verifiedPayments,
        pendingPayments,
        totalRevenue: totalRevenueAgg._sum.amount || 0,
        // Hires
        totalHires,
        activeHires,
        completedHires,
        // Notifications & messages
        unreadNotifications,
        unreadSupportMessages,
      },
      needsAttention: needsAttention.map(serializeComplaint),
      recentActivity,
      recentUsers,
      recentPayments,
      recentHires,
    });
  } catch (error) {
    console.error('❌ Error fetching admin command center:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch command center data',
    });
  }
};

export default { getCommandCenter };