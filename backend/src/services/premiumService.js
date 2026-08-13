// backend/src/services/premiumService.js
// Worker/Employer Premium entitlement helpers.
// The ONLY source of truth is the backend Subscription row:
//   userId = User.id AND status = 'active' AND endDate >= now
// Nothing is ever inferred from client/frontend state.

import prisma from '../lib/prisma.js';

/**
 * Batch entitlement check for many users in ONE query (no N+1).
 * Returns a Set of normalized user ids that have an ACTIVE subscription.
 */
export const getActivePremiumUserIds = async (userIds) => {
  const normalized = [...new Set((userIds || [])
    .map((id) => (id == null ? '' : String(id)))
    .filter((id) => id.length > 0))];

  if (normalized.length === 0) return new Set();

  const active = await prisma.subscription.findMany({
    where: {
      userId: { in: normalized },
      status: 'active',
      endDate: { gte: new Date() }
    },
    select: { userId: true }
  });

  return new Set(active.map((s) => String(s.userId)));
};

/**
 * Single-user entitlement check (Boolean).
 */
export const isUserPremium = async (userId) => {
  if (!userId) return false;
  const ids = await getActivePremiumUserIds([userId]);
  return ids.has(String(userId));
};

/**
 * Returns the active subscription row for a single user (for expiry display),
 * or null when there is no active subscription.
 */
export const getActiveSubscription = async (userId) => {
  if (!userId) return null;
  return prisma.subscription.findFirst({
    where: {
      userId: String(userId),
      status: 'active',
      endDate: { gte: new Date() }
    },
    orderBy: { endDate: 'desc' }
  });
};

const normalizePlanProjection = (plan) => {
  if (plan === 'weekly' || plan === 'monthly' || plan === 'legacy_monthly') return plan;
  return plan ? 'legacy_unknown' : null;
};

export const isActiveSubscriptionRow = (subscription, now = new Date()) => (
  subscription?.status === 'active'
  && subscription?.endDate instanceof Date
  && subscription.endDate > now
);

/** Batched, curated staff visibility summaries. One Subscription query only. */
export const getSubscriptionSummaries = async (userIds) => {
  const ids = [...new Set((userIds || []).map(String).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const rows = await prisma.subscription.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, plan: true, status: true, startDate: true, endDate: true },
    orderBy: { endDate: 'desc' },
  });
  const now = new Date();
  const summaries = new Map(ids.map((id) => [id, {
    isPremium: false, status: 'inactive', endDate: null, startDate: null, latestPlan: null,
  }]));
  for (const row of rows) {
    const id = String(row.userId);
    const current = summaries.get(id);
    const active = isActiveSubscriptionRow(row, now);
    if (!current.endDate) {
      summaries.set(id, {
        isPremium: false,
        status: row.status === 'active' ? 'expired' : row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        latestPlan: normalizePlanProjection(row.plan),
      });
    }
    if (active && !current.isPremium) {
      summaries.set(id, {
        isPremium: true,
        status: 'active',
        startDate: row.startDate,
        endDate: row.endDate,
        latestPlan: normalizePlanProjection(row.plan),
      });
    }
  }
  return summaries;
};

/** Curated single-user summary plus immutable grant history (newest first). */
export const getSubscriptionStaffDetail = async (userId, grantLimit = 20) => {
  const id = String(userId);
  const [summaries, grants] = await Promise.all([
    getSubscriptionSummaries([id]),
    prisma.subscriptionGrant.findMany({
      where: { userId: id },
      select: {
        plan: true, purchaserRole: true, durationDays: true, startsAt: true,
        endsAt: true, status: true, createdAt: true, reversedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: grantLimit,
    }),
  ]);
  const grantCounts = { weekly: 0, monthly: 0, legacy: 0 };
  for (const grant of grants) {
    if (grant.plan === 'weekly' || grant.plan === 'monthly') grantCounts[grant.plan] += 1;
    else grantCounts.legacy += 1;
  }
  return { ...summaries.get(id), grantCounts, grants, historyAvailable: grants.length > 0 };
};
