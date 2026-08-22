import prisma from '../lib/prisma.js';
import { isUserPremium } from './premiumService.js';

const CUSTOMER_ROLES = new Set(['EMPLOYER', 'WORKER']);
const STAFF_ROLES = new Set(['ADMIN', 'SUPPORT']);

const normalizeRole = (role) => String(role || '').trim().toUpperCase();
const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''));

const hasLegacyCommissionEvidence = (payment, employerId) => {
  if (payment.purpose != null || payment.hireId != null) return false;
  if (String(payment.userId || '') !== String(employerId)) return false;

  const metadata = payment.metadata && typeof payment.metadata === 'object'
    ? payment.metadata
    : {};

  return metadata.createdFrom === 'payment-intent'
    && (Boolean(String(payment.jobTitle || '').trim()) || Boolean(payment.offerId));
};

/**
 * A captured payment is not sufficient to unlock contact. Modern commission
 * access requires the payment entitlement and its Hire fulfillment to have
 * completed successfully.
 */
export const canContactWorker = async (employerId, workerProfileId, db = prisma) => {
  if (!employerId || !workerProfileId) return false;

  const workerProfile = await db.workerProfile.findUnique({
    where: { id: String(workerProfileId) },
    select: { id: true, userId: true }
  });
  if (!workerProfile) return false;

  // Historical payments use WorkerProfile.id; the current commission flow
  // stores the same worker as User.id. These are the only accepted aliases.
  const workerPaymentIds = [String(workerProfile.id), String(workerProfile.userId)];
  const payments = await db.payment.findMany({
    where: {
      employerId: String(employerId),
      workerId: { in: workerPaymentIds },
      status: 'completed'
    },
    select: {
      purpose: true,
      hireId: true,
      userId: true,
      offerId: true,
      jobTitle: true,
      metadata: true,
      fulfillmentStatus: true
    }
  });

  const qualifyingCandidates = payments.filter(
    (payment) => String(payment.purpose || '').toUpperCase() !== 'SUBSCRIPTION'
  );
  if (qualifyingCandidates.length === 0) return false;

  const modernHireIds = [...new Set(qualifyingCandidates
    .filter((payment) => String(payment.purpose || '').toUpperCase() === 'COMMISSION'
      && String(payment.fulfillmentStatus || '').toLowerCase() === 'fulfilled'
      && payment.hireId)
    .map((payment) => String(payment.hireId)))];

  if (modernHireIds.length > 0) {
    const matchingHire = await db.hire.findFirst({
      where: {
        id: { in: modernHireIds },
        employerId: String(employerId),
        workerId: String(workerProfile.id),
        paymentStatus: 'completed',
        status: 'active'
      },
      select: { id: true }
    });
    if (matchingHire) return true;
  }

  // Narrow grandfathering for the old contact-payment flow. These records
  // predate purpose/hireId but still contain exact pair ownership plus the
  // historical payment-intent and job/offer evidence. Subscription payments
  // are explicitly excluded by the query above.
  return qualifyingCandidates.some((payment) => hasLegacyCommissionEvidence(payment, employerId));
};

export const resolveUserParty = async (identifier, db = prisma) => {
  const id = String(identifier || '');
  if (!isObjectId(id)) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true }
  });
  if (user) return { userId: String(user.id), role: normalizeRole(user.role), profileId: null };

  const workerProfile = await db.workerProfile.findUnique({
    where: { id },
    select: { id: true, userId: true }
  });
  if (workerProfile) {
    return { userId: String(workerProfile.userId), role: 'WORKER', profileId: String(workerProfile.id) };
  }

  const employerProfile = await db.employerProfile.findUnique({
    where: { id },
    select: { id: true, userId: true }
  });
  if (employerProfile) {
    return { userId: String(employerProfile.userId), role: 'EMPLOYER', profileId: String(employerProfile.id) };
  }

  return null;
};

/**
 * Server-authoritative, bidirectional paid-contact decision for chat sends.
 * Identifier resolution here is authorization-only: it does not rewrite the
 * request, conversation ID, participant IDs, or stored message IDs.
 */
export const authorizePaidChatRelationship = async ({ senderId, senderRole, recipientId }, db = prisma) => {
  const role = normalizeRole(senderRole);
  if (STAFF_ROLES.has(role) || !CUSTOMER_ROLES.has(role)) {
    return { required: false, allowed: true };
  }

  const recipient = await resolveUserParty(recipientId, db);
  if (!recipient) {
    return { required: true, allowed: false };
  }

  if (STAFF_ROLES.has(recipient.role) || recipient.role === role) {
    return { required: false, allowed: true };
  }

  if (role === 'EMPLOYER' && recipient.role === 'WORKER') {
    const workerProfile = recipient.profileId
      ? { id: recipient.profileId }
      : await db.workerProfile.findUnique({
          where: { userId: recipient.userId },
          select: { id: true }
        });
    const allowed = workerProfile
      ? await canContactWorker(senderId, workerProfile.id, db)
      : false;
    return { required: true, allowed };
  }

  if (role === 'WORKER' && recipient.role === 'EMPLOYER') {
    const workerProfile = await db.workerProfile.findUnique({
      where: { userId: String(senderId) },
      select: { id: true }
    });
    const allowed = workerProfile
      ? await canContactWorker(recipient.userId, workerProfile.id, db)
      : false;
    return { required: true, allowed };
  }

  return { required: false, allowed: true };
};

export const hasActiveSubscription = async (userId) => {
  if (!userId) return false;
  return isUserPremium(userId);
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

    // Atomic quota consumption: only ONE concurrent request may increment the
    // counter while it is still below the daily limit (3). A conditional
    // updateMany (with searchCount < 3 in the WHERE) makes parallel requests
    // race safely — at most one increments at the boundary, so the free limit
    // cannot be trivially exceeded by issuing multiple requests at once.
    const claimed = await prisma.employerSearchTracking.updateMany({
      where: {
        id: tracking.id,
        searchCount: { lt: 3 }
      },
      data: {
        searchCount: { increment: 1 }
      }
    });

    if (claimed.count === 0) {
      return { allowed: false, remaining: 0 };
    }

    const freshTracking = await prisma.employerSearchTracking.findUnique({
      where: { id: tracking.id },
      select: { searchCount: true }
    });

    return {
      allowed: true,
      remaining: Math.max(0, 3 - (freshTracking?.searchCount ?? tracking.searchCount + 1))
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
