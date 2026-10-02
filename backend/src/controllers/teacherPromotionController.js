// backend/src/controllers/teacherPromotionController.js
// ============================================================
// TEACHER PROMOTION / SUBSCRIPTION HISTORY CONTROLLER
// ============================================================
// Retrieves authenticated Teacher's historical Premium subscription
// records and current entitlement using canonical services:
// - getActivePremiumEntitlement (premiumService.js)
// - prisma.payment (filtered by userId and purpose: 'SUBSCRIPTION')
//
// OWNERSHIP / TENANCY:
// Strictly scoped to req.userId. Never accepts teacherId from params/query/body.
// Never exposes sensitive payment credentials, tokens, or provider secrets.
// ============================================================
import prisma from '../lib/prisma.js';
import { getActivePremiumEntitlement } from '../services/premiumService.js';
import { isMeaningfulPremiumPayment } from '../services/workerPaymentHistoryService.js';

const planFromMetadata = (metadata) => (
  metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata.plan || null
    : null
);

/**
 * GET /api/teachers/promotion-history
 * Returns the authenticated Teacher's current premium status and historical subscription records.
 */
export const getTeacherPromotionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const id = String(userId);

    // Parallel fetch: current active entitlement + payment records + manual grants
    const [entitlement, payments, manualGrant, legacyManualSubscriptions] = await Promise.all([
      getActivePremiumEntitlement(id),
      prisma.payment.findMany({
        where: { userId: id, purpose: 'SUBSCRIPTION' },
        select: {
          id: true,
          orderId: true,
          transactionId: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          status: true,
          fulfillmentStatus: true,
          manualReviewState: true,
          metadata: true,
          createdAt: true,
          completedAt: true,
          SubscriptionGrant: {
            select: {
              plan: true,
              status: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.manualPremiumGrant.findUnique({
        where: { userId: id },
        select: { status: true, startDate: true, endDate: true, createdAt: true },
      }),
      prisma.subscription.findMany({
        where: { userId: id, plan: 'manual' },
        select: { status: true, startDate: true, endDate: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format current entitlement
    const currentPremium = entitlement
      ? {
          source: entitlement.plan === 'manual' ? 'manual' : 'paid',
          plan: entitlement.plan || null,
          status: entitlement.status || null,
          startDate: entitlement.startDate ? new Date(entitlement.startDate).toISOString() : null,
          endDate: entitlement.endDate ? new Date(entitlement.endDate).toISOString() : null,
        }
      : null;

    // Filter meaningful paid records and map safely (omitting secrets and internal tokens)
    const paidRecords = (payments || [])
      .filter(isMeaningfulPremiumPayment)
      .map((p) => {
        const plan = p.SubscriptionGrant?.plan || planFromMetadata(p.metadata) || 'premium';
        const reference = p.transactionId || p.orderId || null;
        return {
          id: p.id,
          source: 'paid',
          plan,
          status: p.status,
          paymentStatus: p.status,
          subscriptionStatus: p.SubscriptionGrant?.status || null,
          startDate: p.SubscriptionGrant?.startsAt ? new Date(p.SubscriptionGrant.startsAt).toISOString() : null,
          endDate: p.SubscriptionGrant?.endsAt ? new Date(p.SubscriptionGrant.endsAt).toISOString() : null,
          amount: Number(p.amount),
          currency: p.currency || 'EGP',
          paymentMethod: p.paymentMethod || null,
          reference,
          date: (p.completedAt || p.createdAt) ? new Date(p.completedAt || p.createdAt).toISOString() : null,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        };
      });

    // Format manual / admin grant records
    const manualRecords = [
      ...(manualGrant
        ? [{
            id: 'manual-grant',
            source: 'manual',
            plan: 'manual',
            status: manualGrant.status,
            paymentStatus: 'completed',
            subscriptionStatus: manualGrant.status,
            startDate: manualGrant.startDate ? new Date(manualGrant.startDate).toISOString() : null,
            endDate: manualGrant.endDate ? new Date(manualGrant.endDate).toISOString() : null,
            amount: 0,
            currency: 'EGP',
            paymentMethod: 'admin_grant',
            reference: 'Admin Grant',
            date: manualGrant.createdAt ? new Date(manualGrant.createdAt).toISOString() : null,
            createdAt: manualGrant.createdAt ? new Date(manualGrant.createdAt).toISOString() : null,
          }]
        : []),
      ...(legacyManualSubscriptions || []).map((sub, index) => ({
        id: `legacy-manual-${index}`,
        source: 'manual',
        plan: 'manual',
        status: sub.status,
        paymentStatus: 'completed',
        subscriptionStatus: sub.status,
        startDate: sub.startDate ? new Date(sub.startDate).toISOString() : null,
        endDate: sub.endDate ? new Date(sub.endDate).toISOString() : null,
        amount: 0,
        currency: 'EGP',
        paymentMethod: 'admin_grant',
        reference: 'Admin Grant',
        date: sub.createdAt ? new Date(sub.createdAt).toISOString() : null,
        createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : null,
      })),
    ];

    // Unified history sorted chronologically descending
    const history = [...paidRecords, ...manualRecords].sort(
      (a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
    );

    return res.json({
      success: true,
      currentPremium,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching teacher promotion history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion history',
      error: error.message,
    });
  }
};

export default {
  getTeacherPromotionHistory,
};
