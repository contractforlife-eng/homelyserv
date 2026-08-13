import prisma from '../lib/prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LEGACY_PLAN = 'legacy_monthly';
const ALLOWED_ROLES = new Set(['EMPLOYER', 'WORKER']);
const PLAN_DURATIONS = Object.freeze({ weekly: 7, monthly: 30 });

export const resolveSubscriptionGrantSnapshot = (metadata, legacyRole) => {
  const snapshot = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata
    : {};
  const hasPlan = Object.hasOwn(snapshot, 'plan');
  const hasRole = Object.hasOwn(snapshot, 'purchaserRole');
  const hasDuration = Object.hasOwn(snapshot, 'durationDays');

  if (!hasPlan && !hasRole && !hasDuration) {
    if (!ALLOWED_ROLES.has(legacyRole)) {
      throw new Error('Legacy subscription Payment has no eligible purchaser role');
    }
    return { plan: LEGACY_PLAN, purchaserRole: legacyRole, durationDays: 30, legacy: true };
  }

  if (!hasPlan || !hasRole || !hasDuration) {
    throw new Error('Subscription Payment entitlement snapshot is incomplete');
  }
  if (!Object.hasOwn(PLAN_DURATIONS, snapshot.plan)) {
    throw new Error('Subscription Payment plan snapshot is invalid');
  }
  if (!ALLOWED_ROLES.has(snapshot.purchaserRole)) {
    throw new Error('Subscription Payment purchaser role snapshot is invalid');
  }
  if (!Number.isInteger(snapshot.durationDays) || snapshot.durationDays !== PLAN_DURATIONS[snapshot.plan]) {
    throw new Error('Subscription Payment duration snapshot is invalid');
  }

  return {
    plan: snapshot.plan,
    purchaserRole: snapshot.purchaserRole,
    durationDays: snapshot.durationDays,
    legacy: false,
  };
};

export const calculateSubscriptionGrantInterval = (now, activeEndDate, durationDays) => {
  const startsAt = activeEndDate && new Date(activeEndDate) >= now
    ? new Date(activeEndDate)
    : new Date(now);
  const endsAt = new Date(startsAt.getTime() + durationDays * DAY_MS);
  return { startsAt, endsAt };
};

/**
 * Atomically creates one immutable entitlement grant per Payment, advances the
 * mutable Subscription projection, and marks fulfillment complete. Acquisition
 * status/provider evidence are verified and recorded before this function.
 */
export const fulfillSubscriptionPaymentInTransaction = async (tx, paymentId) => {
  const payment = await tx.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.purpose !== 'SUBSCRIPTION') {
    throw new Error('Subscription Payment not found');
  }
  if (!payment.userId) {
    throw new Error('Subscription Payment has no userId');
  }

  const existingGrant = await tx.subscriptionGrant.findUnique({
    where: { paymentId: payment.id },
  });
  if (existingGrant) {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        fulfillmentStatus: 'fulfilled',
        fulfillmentError: null,
        fulfillmentCompletedAt: payment.fulfillmentCompletedAt || new Date(),
      },
    });
    return { grant: existingGrant, subscription: null, wasRenewal: null, reused: true };
  }

  const user = await tx.user.findUnique({
    where: { id: String(payment.userId) },
    select: { role: true },
  });
  if (!user) throw new Error('Subscription purchaser no longer exists');

  const entitlement = resolveSubscriptionGrantSnapshot(payment.metadata, user.role);
  const now = new Date();
  const activeSubscription = await tx.subscription.findFirst({
    where: {
      userId: String(payment.userId),
      status: 'active',
      endDate: { gte: now },
    },
    orderBy: { endDate: 'desc' },
  });
  const { startsAt, endsAt } = calculateSubscriptionGrantInterval(
    now,
    activeSubscription?.endDate,
    entitlement.durationDays,
  );

  const grant = await tx.subscriptionGrant.create({
    data: {
      userId: String(payment.userId),
      paymentId: payment.id,
      plan: entitlement.plan,
      purchaserRole: entitlement.purchaserRole,
      durationDays: entitlement.durationDays,
      startsAt,
      endsAt,
      status: 'active',
      metadata: { legacyPayment: entitlement.legacy },
    },
  });

  const projectionData = {
    plan: entitlement.plan,
    amount: payment.amount,
    status: 'active',
    endDate: endsAt,
  };
  const subscription = activeSubscription
    ? await tx.subscription.update({
        where: { id: activeSubscription.id },
        data: projectionData,
      })
    : await tx.subscription.create({
        data: {
          userId: String(payment.userId),
          ...projectionData,
          startDate: startsAt,
        },
      });

  await tx.payment.update({
    where: { id: payment.id },
    data: {
      fulfillmentStatus: 'fulfilled',
      fulfillmentError: null,
      fulfillmentCompletedAt: new Date(),
    },
  });

  return { grant, subscription, wasRenewal: !!activeSubscription, reused: false };
};

export const fulfillSubscriptionPayment = async (paymentId) => {
  return prisma.$transaction((tx) => fulfillSubscriptionPaymentInTransaction(tx, paymentId));
};

export default fulfillSubscriptionPayment;
