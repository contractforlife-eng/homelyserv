import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import { getActivePremiumEntitlement } from '../services/premiumService.js';
import getWorkerPaymentHistory from '../services/workerPaymentHistoryService.js';

const router = express.Router();

const projectEntitlement = (entitlement) => {
  if (!entitlement) return null;
  const source = entitlement.plan === 'manual' ? 'manual' : 'paid';
  return {
    source,
    plan: entitlement.plan || null,
    status: entitlement.status || null,
    startDate: entitlement.startDate || null,
    endDate: entitlement.endDate || null,
  };
};

// GET /api/worker/payment-history
// Authenticated Worker financial history only. Read-only; no payout details.
router.get('/payment-history', requireWorker, async (req, res) => {
  try {
    const userId = String(req.userId);
    const [entitlement, history] = await Promise.all([
      getActivePremiumEntitlement(userId),
      getWorkerPaymentHistory(userId),
    ]);

    return res.json({
      success: true,
      currentPremium: projectEntitlement(entitlement),
      history,
    });
  } catch (error) {
    console.error('[WorkerPaymentHistory] Error reading worker history:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load payment history',
    });
  }
});

export default router;
