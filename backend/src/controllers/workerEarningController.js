// backend/src/controllers/workerEarningController.js
// Worker Earnings Ledger — Phase 1 read API + Phase 2 confirmation
// submission for the authenticated worker.
// Ownership always comes from req.userId (User.id). No :userId parameter.
import prisma from '../lib/prisma.js';
import {
  WORKER_EARNING_STATUS,
  submitWorkerConfirmation,
} from '../services/workerEarningService.js';
import {
  createNotification,
  NOTIFICATION_TYPES,
} from '../services/notificationService.js';

// Build the ledger summary buckets. In Phase 1 only PENDING records exist,
// so earned/paid balances are correctly 0. AWAITING_CONFIRMATION (Phase 2)
// is still contractual (worker submitted, employer not yet approved) so it
// counts toward pending contract value. We must not fake values.
const buildSummary = (records) => {
  let pendingContractValue = 0;
  let earnedBalance = 0;
  let paidTotal = 0;
  let onHoldAmount = 0;
  let disputedAmount = 0;
  let awaitingConfirmationCount = 0;

  for (const r of records) {
    switch (r.status) {
      case 'PENDING':
      case 'AWAITING_CONFIRMATION':
        pendingContractValue += r.amount || 0;
        if (r.status === 'AWAITING_CONFIRMATION') awaitingConfirmationCount += 1;
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
    awaitingConfirmationCount,
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

// POST /api/worker/earnings/:earningId/submit
// Worker marks a PENDING period as completed and submits it for employer
// confirmation. Idempotent: a second submit is a no-op (record is no
// longer PENDING). Only works while the underlying hire is still active.
export const submitWorkerEarning = async (req, res) => {
  try {
    const { earningId } = req.params;
    const userId = String(req.userId);

    const earning = await prisma.workerEarning.findUnique({
      where: { id: String(earningId) },
    });

    if (!earning || String(earning.workerId) !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Earning record not found',
      });
    }

    if (earning.status === WORKER_EARNING_STATUS.AWAITING_CONFIRMATION) {
      return res.status(400).json({
        success: false,
        message: 'This period is already awaiting employer confirmation',
      });
    }

    if (earning.status !== WORKER_EARNING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending contract periods can be submitted',
      });
    }

    // Confirmations are frozen once the hire is no longer active.
    const hire = await prisma.hire.findUnique({ where: { id: earning.hireId } });
    if (!hire || hire.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This period cannot be submitted because the hire is not active',
      });
    }

    const updated = await submitWorkerConfirmation({
      earningId,
      workerId: userId,
      workerRole: req.userRole,
    });

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'This period was already submitted or updated',
      });
    }

    // Notify the employer to confirm the period.
    try {
      await createNotification(hire.employerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Work period submitted for confirmation',
        message: `${req.user?.fullName || 'The worker'} submitted a work period for your confirmation.`,
        entityType: 'HIRE',
        entityId: hire.id,
        link: '/my-hires',
      });
    } catch (notifyError) {
      console.error('[WorkerEarning] Failed to notify employer:', notifyError.message);
    }

    res.json({ success: true, record: updated });
  } catch (error) {
    console.error('[WorkerEarning] Error submitting confirmation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit work period for confirmation',
    });
  }
};

export default {
  getWorkerEarnings,
  submitWorkerEarning,
};