// backend/src/controllers/workerEarningController.js
// Worker Earnings Ledger — Phase 1 read API for the authenticated worker.
// Ownership always comes from req.userId (User.id). No :userId parameter.
import prisma from '../lib/prisma.js';

// Build the ledger summary buckets. In Phase 1 only PENDING records exist,
// so earned/paid balances are correctly 0. We must not fake values.
const buildSummary = (records) => {
  let pendingContractValue = 0;
  let earnedBalance = 0;
  let paidTotal = 0;
  let onHoldAmount = 0;
  let disputedAmount = 0;

  for (const r of records) {
    switch (r.status) {
      case 'PENDING':
        pendingContractValue += r.amount || 0;
        break;
      case 'EARNED':
        earnedBalance += r.amount || 0;
        break;
      case 'PAID':
        paidTotal += r.amount || 0;
        break;
      case 'ON_HOLD':
      case 'DISPUTED':
        onHoldAmount += r.amount || 0;
        if (r.status === 'DISPUTED') disputedAmount += r.amount || 0;
        break;
      default:
        // CANCELLED and unknown statuses contribute nothing to balances.
        break;
    }
  }

  return {
    pendingContractValue,
    earnedBalance,
    paidTotal,
    onHoldAmount,
    disputedAmount,
    pendingContractCount: records.filter((r) => r.status === 'PENDING').length,
    earnedCount: records.filter((r) => r.status === 'EARNED').length,
    paidCount: records.filter((r) => r.status === 'PAID').length,
    recordsCount: records.length,
  };
};

export const getWorkerEarnings = async (req, res) => {
  try {
    const userId = String(req.userId);

    const records = await prisma.workerEarning.findMany({
      where: { workerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const summary = buildSummary(records);

    res.json({
      success: true,
      summary,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('[WorkerEarning] Error reading worker earnings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load earnings ledger',
    });
  }
};

export default {
  getWorkerEarnings,
};