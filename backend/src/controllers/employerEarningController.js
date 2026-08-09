// backend/src/controllers/employerEarningController.js
// Employer side of the Worker Earnings ledger (Phase 2).
// Employers approve or dispute work periods the worker has submitted.
//
// Ownership always comes from req.userId: an employer may only act on
// earning records of hires they own (hire.employerId === req.userId).
import prisma from '../lib/prisma.js';
import {
  WORKER_EARNING_STATUS,
  approveByEmployer,
  disputeByEmployer,
} from '../services/workerEarningService.js';
import {
  createNotification,
  NOTIFICATION_TYPES,
} from '../services/notificationService.js';

// Resolve the hire for a target and verify the calling employer owns it.
const resolveOwnedHire = async (hireId, employerId) => {
  const hire = await prisma.hire.findUnique({ where: { id: String(hireId) } });
  if (!hire) return { error: 'Hire not found', code: 404 };
  if (String(hire.employerId) !== String(employerId)) {
    return { error: 'Access denied', code: 403 };
  }
  return { hire };
};

// GET /api/employer/hires/:hireId/earnings
// Ledger rows for one hire (employer-owned). Used to surface periods
// that are awaiting the employer's confirmation.
export const getHireEarnings = async (req, res) => {
  try {
    const { hireId } = req.params;
    const { hire, error, code } = await resolveOwnedHire(hireId, req.userId);
    if (error) return res.status(code).json({ success: false, message: error });

    const records = await prisma.workerEarning.findMany({
      where: { hireId: String(hireId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, hireId: String(hireId), count: records.length, records });
  } catch (error) {
    console.error('[EmployerEarning] Error listing hire earnings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load earning periods for this hire',
    });
  }
};

// POST /api/employer/hires/:hireId/earnings/:earningId/approve
// Employer confirms a worker-submitted period: AWAITING_CONFIRMATION -> EARNED.
// Idempotent (state-guarded); repeated clicks are a no-op.
export const approveWorkerEarning = async (req, res) => {
  try {
    const { hireId, earningId } = req.params;
    const employerId = String(req.userId);

    const { hire, error, code } = await resolveOwnedHire(hireId, employerId);
    if (error) return res.status(code).json({ success: false, message: error });

    if (!hire || hire.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Work periods can only be approved while the hire is active',
      });
    }

    const earning = await prisma.workerEarning.findUnique({
      where: { id: String(earningId) },
    });
    if (!earning || String(earning.hireId) !== String(hire.id)) {
      return res.status(404).json({ success: false, message: 'Earning record not found' });
    }

    if (earning.status !== WORKER_EARNING_STATUS.AWAITING_CONFIRMATION) {
      return res.status(400).json({
        success: false,
        message: 'Only periods submitted for confirmation can be approved',
      });
    }

    const updatedRecord = await approveByEmployer({
      earningId,
      employerId,
      employerRole: req.userRole,
    });

    if (!updatedRecord) {
      return res.status(409).json({
        success: false,
        message: 'This period was already approved or updated',
      });
    }

    // Notify the worker their submitted period was confirmed.
    try {
      await createNotification(earning.workerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Work period confirmed',
        message: `${req.user?.fullName || 'The employer'} confirmed your submitted work period. This does NOT mean the salary has been paid.`,
        entityType: 'HIRE',
        entityId: hire.id,
        link: '/worker-payment',
      });
    } catch (notifyError) {
      console.error('[EmployerEarning] Failed to notify worker:', notifyError.message);
    }

    res.json({ success: true, record: updatedRecord });
  } catch (error) {
    console.error('[EmployerEarning] Error approving earning:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve work period',
    });
  }
};

// POST /api/employer/hires/:hireId/earnings/:earningId/dispute
// Employer disputes a submitted period: AWAITING_CONFIRMATION -> DISPUTED.
export const disputeWorkerEarning = async (req, res) => {
  try {
    const { hireId, earningId } = req.params;
    const { reason } = req.body;
    const employerId = String(req.userId);

    const { hire, error, code } = await resolveOwnedHire(hireId, employerId);
    if (error) return res.status(code).json({ success: false, message: error });

    const earning = await prisma.workerEarning.findUnique({
      where: { id: String(earningId) },
    });
    if (!earning || String(earning.hireId) !== String(hire.id)) {
      return res.status(404).json({ success: false, message: 'Earning record not found' });
    }

    if (earning.status !== WORKER_EARNING_STATUS.AWAITING_CONFIRMATION) {
      return res.status(400).json({
        success: false,
        message: 'Only periods submitted for confirmation can be disputed',
      });
    }

    const updated = await disputeByEmployer({
      earningId,
      employerId,
      employerRole: req.userRole,
      reason: reason ? String(reason).slice(0, 500) : null,
    });

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'This period was already updated',
      });
    }

    // Notify the worker their submitted period was disputed.
    try {
      await createNotification(earning.workerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Work period disputed',
        message: 'The employer disputed a work period you submitted. Please open a complaint for review.',
        entityType: 'HIRE',
        entityId: hire.id,
        link: '/worker-payment',
      });
    } catch (notifyError) {
      console.error('[EmployerEarning] Failed to notify worker:', notifyError.message);
    }

    res.json({ success: true, record: updated });
  } catch (error) {
    console.error('[EmployerEarning] Error disputing earning:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to dispute work period',
    });
  }
};

export default {
  getHireEarnings,
  approveWorkerEarning,
  disputeWorkerEarning,
};