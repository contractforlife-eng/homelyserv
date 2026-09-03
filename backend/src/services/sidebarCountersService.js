// backend/src/services/sidebarCountersService.js
// ============================================================
// SIDEBAR COUNTERS SERVICE
// Single source of truth for the unified sidebar activity
// badges. Computes ALL sidebar counters for the authenticated
// user in one place, according to the user's role.
//
// Counter semantics (state-based, self-clearing - a counter
// drops back to 0 once the underlying state is resolved):
//
//   messages      - unread chat messages addressed to the user
//                   (same rule as /api/chat/unread/:userId)
//   notifications - unread in-app notifications (reuses the
//                   existing NotificationService unread logic)
//   offers        - WORKER:   pending offers awaiting response
//                   EMPLOYER: accepted offers awaiting payment
//   hires         - WORKER:   active engagements (payment
//                             confirmed status update)
//                   EMPLOYER: hires awaiting commission payment
//                   ADMIN:    payment proofs awaiting verification
//   payments      - unfinished payment actions requiring the current
//                   role's action (WORKER/EMPLOYER: payer-owned records,
//                   ADMIN: all pending verification records)
//   complaints    - WORKER/EMPLOYER: waiting for the user's reply
//                   SUPPORT: new tickets + assigned tickets
//                            waiting for a support response
//                   ADMIN:    escalated tickets
//
// Security: every query is scoped to the authenticated user's
// own id (or their WorkerProfile id). No other users' data is
// ever counted.
// ============================================================
import prisma from '../lib/prisma.js';
import Message from '../models/Message.js';
import { getUnreadCount } from './notificationService.js';

export const SIDEBAR_COUNTER_KEYS = [
  'messages',
  'notifications',
  'offers',
  'hires',
  'payments',
  'complaints',
];

// Mirrors the pending definition used by the admin command center.
const ACTIONABLE_USER_PAYMENT_STATE = {
  status: 'pending',
  manualReviewState: 'awaiting_transfer',
};

export const ADMIN_PAYMENT_REVIEW_COUNTER_WHERE = Object.freeze({
  status: 'pending',
  fulfillmentStatus: 'pending',
  manualReviewState: 'pending_verification',
});

export const buildWorkerPaymentsCounterWhere = (userId) => ({
  ...ACTIONABLE_USER_PAYMENT_STATE,
  userId: String(userId),
});

export const buildEmployerPaymentsCounterWhere = (userId) => ({
  ...ACTIONABLE_USER_PAYMENT_STATE,
  OR: [
    { userId: String(userId) },
    { employerId: String(userId) },
  ],
});

export const buildWorkerActionableEarningsWhere = (userId, hireIds = []) => ({
  workerId: String(userId),
  hireId: { in: hireIds.map(String) },
  status: 'PENDING',
});

export const buildSupportComplaintsCounterWhere = (supportId) => ({
  OR: [
    {
      status: 'NEW',
      OR: [
        { assignedSupport: null },
        { assignedSupport: String(supportId) },
      ],
    },
    {
      assignedSupport: String(supportId),
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
  ],
});

// Guard: legacy tokens may carry non-ObjectId ids (e.g. emails or
// "user_123" strings) which crash Prisma ObjectId filters (P2023).
const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

export const buildEmployerHiresCounterWhere = (userId) => ({
  employerId: String(userId),
  paymentStatus: 'pending',
  status: { not: 'terminated' },
  OR: [
    { employerHiddenAt: null },
    { employerHiddenAt: { isSet: false } },
  ],
});

// Never let a single counter failure break the whole response.
const safeCount = async (label, promise) => {
  try {
    const result = await promise;
    return typeof result === 'number' && Number.isFinite(result) ? result : 0;
  } catch (error) {
    console.error(`❌ SidebarCounters: ${label} count failed:`, error.message);
    return 0;
  }
};

/**
 * Compute all sidebar counters for a user.
 * @param {string} userId - Authenticated user id (req.userId)
 * @param {string} role   - Authenticated user role (req.userRole)
 * @returns {Promise<{messages:number, notifications:number, offers:number, hires:number, payments:number, complaints:number}>}
 */
export const getSidebarCounters = async (userId, role) => {
  const uid = String(userId);
  const userRole = String(role || '').toUpperCase();
  const validId = isValidObjectId(uid);

  // Shared counters - identical for every role.
  const [messages, notifications] = await Promise.all([
    safeCount('messages', Message.countDocuments({ recipientId: uid, read: false })),
    validId ? safeCount('notifications', getUnreadCount(uid)) : 0,
  ]);

  const counters = {
    messages,
    notifications,
    offers: 0,
    hires: 0,
    payments: 0,
    complaints: 0,
  };

  // Role-specific counters need valid ObjectId-bound relations.
  if (!validId) {
    return counters;
  }

  // ============================================================
  // WORKER
  // ============================================================
  if (userRole === 'WORKER') {
    // Offer.workerId / Hire.workerId reference WorkerProfile.id,
    // so resolve the worker's profile once.
    let profileId = null;
    try {
      const profile = await prisma.workerProfile.findUnique({
        where: { userId: uid },
        select: { id: true },
      });
      profileId = profile?.id || null;
    } catch (error) {
      console.error('❌ SidebarCounters: worker profile lookup failed:', error.message);
    }

    let activeHireIds = [];
    if (profileId) {
      try {
        const activeHires = await prisma.hire.findMany({
          where: { workerId: profileId, status: 'active' },
          select: { id: true },
        });
        activeHireIds = activeHires.map((hire) => hire.id);
      } catch (error) {
        console.error('â‌Œ SidebarCounters: worker active hire lookup failed:', error.message);
      }
    }

    const [offers, hires, payments, complaints] = await Promise.all([
      profileId
        ? safeCount('offers', prisma.offer.count({
            where: { workerId: profileId, status: 'pending' },
          }))
        : 0,
      activeHireIds.length > 0
        ? safeCount('hires', prisma.workerEarning.count({
            where: buildWorkerActionableEarningsWhere(uid, activeHireIds),
          }))
        : 0,
      safeCount('payments', prisma.payment.count({
        where: buildWorkerPaymentsCounterWhere(uid),
      })),
      safeCount('complaints', prisma.complaint.count({
        where: { userId: uid, status: 'WAITING_FOR_USER' },
      })),
    ]);

    counters.offers = offers;
    counters.hires = hires;
    counters.payments = payments;
    counters.complaints = complaints;
    return counters;
  }

  // ============================================================
  // EMPLOYER
  // ============================================================
  if (userRole === 'EMPLOYER') {
    const [offers, hires, payments, complaints] = await Promise.all([
      safeCount('offers', prisma.offer.count({
        where: { employerId: uid, status: 'accepted', paymentConfirmed: false },
      })),
      safeCount('hires', prisma.hire.count({
        where: buildEmployerHiresCounterWhere(uid),
      })),
      safeCount('payments', prisma.payment.count({
        where: buildEmployerPaymentsCounterWhere(uid),
      })),
      safeCount('complaints', prisma.complaint.count({
        where: { userId: uid, status: 'WAITING_FOR_USER' },
      })),
    ]);

    counters.offers = offers;
    counters.hires = hires;
    counters.payments = payments;
    counters.complaints = complaints;
    return counters;
  }

  // ============================================================
  // ADMIN
  // ============================================================
  if (userRole === 'ADMIN') {
    const [hires, payments, complaints] = await Promise.all([
      safeCount('hires', prisma.hire.count({
        where: { paymentStatus: 'pending', paymentProofUrl: { not: null } },
      })),
      safeCount('payments', prisma.payment.count({
        where: ADMIN_PAYMENT_REVIEW_COUNTER_WHERE,
      })),
      safeCount('complaints', prisma.complaint.count({
        where: { status: 'ESCALATED' },
      })),
    ]);

    counters.hires = hires;
    counters.payments = payments;
    counters.complaints = complaints;
    return counters;
  }

  // ============================================================
  // SUPPORT & SUPPORT_HELPER
  // ============================================================
  if (userRole === 'SUPPORT' || userRole === 'SUPPORT_HELPER') {
    counters.complaints = await safeCount('complaints', prisma.complaint.count({
      where: buildSupportComplaintsCounterWhere(uid),
    }));
    return counters;
  }

  // Unknown role: shared counters only.
  return counters;
};

export default {
  getSidebarCounters,
  SIDEBAR_COUNTER_KEYS,
  buildEmployerHiresCounterWhere,
  buildWorkerPaymentsCounterWhere,
  buildEmployerPaymentsCounterWhere,
  buildWorkerActionableEarningsWhere,
  buildSupportComplaintsCounterWhere,
  ADMIN_PAYMENT_REVIEW_COUNTER_WHERE,
};
