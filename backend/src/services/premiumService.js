// backend/src/services/premiumService.js
// Worker/Employer Premium entitlement helpers.
// Paid/legacy Subscription rows and the transition ManualPremiumGrant row are
// the only entitlement sources. Nothing is ever inferred from client state.

import prisma from '../lib/prisma.js';

/**
 * Batch entitlement check for many users in ONE query (no N+1).
 * Returns a Set of normalized user ids that have an active paid, legacy
 * manual Subscription, or ManualPremiumGrant entitlement.
 */
export const getActivePremiumUserIds = async (userIds, db = prisma) => {
  const normalized = [...new Set((userIds || [])
    .map((id) => (id == null ? '' : String(id)))
    .filter((id) => id.length > 0))];

  if (normalized.length === 0) return new Set();

  const now = new Date();
  const [activeSubscriptions, activeManualGrants] = await Promise.all([
    db.subscription.findMany({
      where: {
        userId: { in: normalized },
        status: 'active',
        endDate: { gte: now }
      },
      select: { userId: true }
    }),
    db.manualPremiumGrant.findMany({
      where: {
        userId: { in: normalized },
        status: 'active',
        endDate: { gt: now }
      },
      select: { userId: true }
    }),
  ]);

  return new Set([
    ...activeSubscriptions.map((s) => String(s.userId)),
    ...activeManualGrants.map((grant) => String(grant.userId)),
  ]);
};

/**
 * Single-user entitlement check (Boolean).
 */
export const isUserPremium = async (userId, db = prisma) => {
  if (!userId) return false;
  const ids = await getActivePremiumUserIds([userId], db);
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

/**
 * Premium projection for UI/benefit boundaries. The legacy helper above
 * intentionally remains Subscription-only for callers that require that
 * record shape. A ManualPremiumGrant is projected only when it is the latest
 * active entitlement by end date.
 */
export const getActivePremiumEntitlement = async (userId, db = prisma) => {
  if (!userId) return null;
  const now = new Date();
  const [subscription, grant] = await Promise.all([
    db.subscription.findFirst({
      where: { userId: String(userId), status: 'active', endDate: { gte: now } },
      orderBy: { endDate: 'desc' },
    }),
    db.manualPremiumGrant.findUnique({
      where: { userId: String(userId) },
      select: { id: true, status: true, startDate: true, endDate: true },
    }),
  ]);
  const grantIsActive = grant?.status === 'active'
    && grant.endDate instanceof Date
    && grant.endDate > now;
  if (!grantIsActive) return subscription;
  if (!subscription || grant.endDate > subscription.endDate) {
    return {
      id: grant.id,
      plan: 'manual',
      status: 'active',
      startDate: grant.startDate,
      endDate: grant.endDate,
    };
  }
  return subscription;
};

export const normalizePlanProjection = (plan) => {
  if (plan === 'weekly' || plan === 'monthly' || plan === 'annual' || plan === 'legacy_monthly' || plan === 'manual') return plan;
  return plan ? 'legacy_unknown' : null;
};

export const isManualPremiumTargetRole = (role) => {
  const normalizedRole = String(role || '').trim().toUpperCase();
  return normalizedRole === 'EMPLOYER' || normalizedRole === 'WORKER';
};

export const isActiveSubscriptionRow = (subscription, now = new Date()) => (
  subscription?.status === 'active'
  && subscription?.endDate instanceof Date
  && subscription.endDate > now
);

/** Batched, curated staff visibility summaries across both manual sources. */
export const getSubscriptionSummaries = async (userIds, db = prisma) => {
  const ids = [...new Set((userIds || []).map(String).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const [rows, manualGrants] = await Promise.all([
    db.subscription.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, plan: true, status: true, startDate: true, endDate: true },
      orderBy: { endDate: 'desc' },
    }),
    db.manualPremiumGrant.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, status: true, startDate: true, endDate: true },
    }),
  ]);
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

  // ManualPremiumGrant is the authority for new manual state. Keep legacy
  // Subscription(plan="manual") rows in the summary during the transition,
  // but let a grant-only user receive the same Premium projection.
  for (const grant of manualGrants) {
    const id = String(grant.userId);
    const current = summaries.get(id);
    if (!current) continue;
    const active = grant.status === 'active'
      && grant.endDate instanceof Date
      && grant.endDate > now;
    const grantIsLater = !current.endDate || new Date(grant.endDate) > new Date(current.endDate);

    if (grantIsLater) {
      const projectedPremium = active || current.isPremium;
      summaries.set(id, {
        isPremium: projectedPremium,
        status: projectedPremium ? 'active' : grant.status,
        startDate: grant.startDate,
        endDate: grant.endDate,
        latestPlan: 'manual',
      });
    } else if (active && !current.isPremium) {
      summaries.set(id, { ...current, isPremium: true });
    }
  }
  return summaries;
};

/** Curated single-user summary plus immutable grant history (newest first). */
export const getSubscriptionStaffDetail = async (userId, grantLimit = 20, db = prisma) => {
  const id = String(userId);
  const [summaries, grants] = await Promise.all([
    getSubscriptionSummaries([id], db),
    db.subscriptionGrant.findMany({
      where: { userId: id },
      select: {
        plan: true, purchaserRole: true, durationDays: true, startsAt: true,
        endsAt: true, status: true, createdAt: true, reversedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: grantLimit,
    }),
  ]);
  const grantCounts = { weekly: 0, monthly: 0, annual: 0, legacy: 0 };
  for (const grant of grants) {
    if (grant.plan === 'weekly' || grant.plan === 'monthly' || grant.plan === 'annual') grantCounts[grant.plan] += 1;
    else grantCounts.legacy += 1;
  }
  return { ...summaries.get(id), grantCounts, grants, historyAvailable: grants.length > 0 };
};

// ============================================================
// Admin manual Premium helpers
// ============================================================

const MANUAL_PLAN = 'manual';
const MANUAL_DEFAULT_DURATION_DAYS = 30;

const getActiveLegacyManualRow = async (userId, db = prisma) => db.subscription.findFirst({
  where: {
    userId: String(userId),
    plan: MANUAL_PLAN,
    status: 'active',
    endDate: { gte: new Date() },
  },
  orderBy: { endDate: 'desc' },
  select: { endDate: true },
});

export const getManualPremiumState = async (userId, db = prisma) => {
  if (!userId) return { hasActiveManualPremium: false, manualPremiumEndDate: null };
  const [legacyRow, grant] = await Promise.all([
    getActiveLegacyManualRow(userId, db),
    db.manualPremiumGrant.findUnique({
      where: { userId: String(userId) },
      select: { status: true, endDate: true },
    }),
  ]);
  const now = new Date();
  const grantIsActive = grant?.status === 'active'
    && grant.endDate instanceof Date
    && grant.endDate > now;
  const legacyIsActive = !!legacyRow && new Date(legacyRow.endDate) >= now;
  const activeEndDates = [
    legacyIsActive ? legacyRow.endDate : null,
    grantIsActive ? grant.endDate : null,
  ].filter(Boolean);
  const manualPremiumEndDate = activeEndDates.length > 0
    ? activeEndDates.reduce((latest, value) => (new Date(value) > new Date(latest) ? value : latest))
    : null;
  return {
    hasActiveManualPremium: !!manualPremiumEndDate,
    manualPremiumEndDate,
  };
};

export const activateManualPremium = async (userId, endDate, adminId, db = prisma) => {
  const id = String(userId);
  const now = new Date();
  const targetEndDate = endDate ? new Date(endDate) : new Date(now.getTime() + MANUAL_DEFAULT_DURATION_DAYS * 24 * 60 * 60 * 1000);

  if (!(targetEndDate instanceof Date) || isNaN(targetEndDate.getTime())) {
    throw new Error('Invalid endDate');
  }
  if (targetEndDate <= now) {
    throw new Error('endDate must be in the future');
  }

  // userId is Prisma-owned and unique, so this is the cross-instance
  // duplicate-prevention boundary for all new manual state.
  let grant;
  try {
    grant = await db.manualPremiumGrant.upsert({
      where: { userId: id },
      create: {
        userId: id,
        status: 'active',
        startDate: now,
        endDate: targetEndDate,
        adminId: adminId ? String(adminId) : null,
      },
      update: {
        adminId: adminId ? String(adminId) : null,
      },
    });
  } catch (error) {
    // Prisma/Mongo can surface a uniqueness race as P2002 even though the
    // unique userId index prevented a duplicate. Re-read the winner rather
    // than creating a legacy row or reporting a false duplicate state.
    if (error?.code !== 'P2002') throw error;
    grant = await db.manualPremiumGrant.findUnique({ where: { userId: id } });
    if (!grant) throw error;
  }

  // Reactivate an existing row without replacing its identity. Active rows
  // keep their original startDate; inactive/expired rows receive this action's
  // server timestamp. This update is conditional and therefore safe to repeat.
  await db.manualPremiumGrant.updateMany({
    where: { userId: id, status: { not: 'active' } },
    data: { status: 'active', startDate: now, adminId: adminId ? String(adminId) : null },
  });

  // Only move entitlement forward. A later concurrent request cannot be
  // shortened by an earlier request completing afterward.
  await db.manualPremiumGrant.updateMany({
    where: { userId: id, endDate: { lt: targetEndDate } },
    data: { endDate: targetEndDate },
  });

  const finalGrant = await db.manualPremiumGrant.findUnique({ where: { userId: id } });
  return {
    action: grant.createdAt?.getTime?.() === grant.updatedAt?.getTime?.() ? 'created' : 'updated',
    subscriptionId: finalGrant?.id || grant.id,
    startDate: finalGrant?.startDate || grant.startDate,
    endDate: finalGrant?.endDate || grant.endDate,
  };
};

export const deactivateManualPremium = async (userId, db = prisma) => {
  const grantResult = await db.manualPremiumGrant.updateMany({
    where: { userId: String(userId), status: 'active' },
    data: { status: 'inactive' },
  });
  const legacyResult = await db.subscription.updateMany({
    where: { userId: String(userId), plan: MANUAL_PLAN, status: 'active' },
    data: { status: 'inactive' },
  });
  return {
    deactivatedCount: grantResult.count + legacyResult.count,
    grantDeactivatedCount: grantResult.count,
    legacyDeactivatedCount: legacyResult.count,
  };
};
