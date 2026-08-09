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