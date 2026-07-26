import prisma from '../lib/prisma.js';

export const canContactWorker = async (employerId, workerId) => {
  if (!employerId || !workerId) return false;

  const payment = await prisma.payment.findFirst({
    where: {
      employerId: String(employerId),
      workerId: String(workerId),
      status: 'completed'
    }
  });

  return !!payment;
};

export const hasActiveSubscription = async (userId) => {
  if (!userId) return false;

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: String(userId),
      status: 'active',
      endDate: { gte: new Date() }
    }
  });

  return !!subscription;
};

export const recordSearch = async (employerId) => {
  if (!employerId) return { allowed: false, remaining: 0 };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tracking = await prisma.employerSearchTracking.findFirst({
      where: { employerId: String(employerId) }
    });

    if (!tracking) {
      tracking = await prisma.employerSearchTracking.create({
        data: {
          employerId: String(employerId),
          searchCount: 1,
          lastResetDate: today
        }
      });

      return { allowed: true, remaining: 2 };
    }

    const lastReset = new Date(tracking.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    if (lastReset.getTime() !== today.getTime()) {
      await prisma.employerSearchTracking.update({
        where: { id: tracking.id },
        data: {
          searchCount: 1,
          lastResetDate: today
        }
      });

      return { allowed: true, remaining: 2 };
    }

    const isPremium = await hasActiveSubscription(employerId);

    if (isPremium) {
      return { allowed: true, remaining: Infinity };
    }

    if (tracking.searchCount >= 3) {
      return { allowed: false, remaining: 0 };
    }

    tracking = await prisma.employerSearchTracking.update({
      where: { id: tracking.id },
      data: {
        searchCount: tracking.searchCount + 1
      }
    });

    return {
      allowed: true,
      remaining: 3 - tracking.searchCount
    };

  } catch (error) {
    console.error("⚠️ Search tracking failed:", error.message);

    // لا نوقف البحث بسبب مشكلة tracking
    return {
      allowed: true,
      remaining: null
    };
  }
};
export const getSearchLimitStatus = async (employerId) => {
  if (!employerId) return { count: 0, limit: 3, remaining: 0, isPremium: false };

  const isPremium = await hasActiveSubscription(employerId);
  if (isPremium) {
    return { count: 0, limit: Infinity, remaining: Infinity, isPremium: true };
  }

  const tracking = await prisma.employerSearchTracking.findFirst({
    where: { employerId: String(employerId) }
  });

  if (!tracking) {
    return { count: 0, limit: 3, remaining: 3, isPremium: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReset = new Date(tracking.lastResetDate);
  lastReset.setHours(0, 0, 0, 0);

  if (lastReset.getTime() !== today.getTime()) {
    return { count: 0, limit: 3, remaining: 3, isPremium: false };
  }

  const remaining = Math.max(0, 3 - tracking.searchCount);
  return { count: tracking.searchCount, limit: 3, remaining, isPremium: false };
};
