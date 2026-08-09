// backend/src/services/workerEarningService.js
// Worker Earnings Ledger — Phase 1 service layer.
//
// IMPORTANT PHASE-1 SEMANTICS:
// A WorkerEarning record represents a CONTRACTUAL/PENDING earning period
// tied to an active hire (Hire.agreedSalary). It does NOT mean the worker
// has received any money. HomelyServ does not process worker salaries.
//
// Phase 1 ONLY creates PENDING records. We never auto-transition to EARNED
// or PAID because there is no trustworthy work-completion or salary-payment
// event in the system yet.
import prisma from '../lib/prisma.js';

export const WORKER_EARNING_STATUS = {
  PENDING: 'PENDING',
  EARNED: 'EARNED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  ON_HOLD: 'ON_HOLD',
};

export const WORKER_EARNING_TYPE = {
  MONTHLY_CONTRACT: 'MONTHLY_CONTRACT',
};

// Deterministic idempotency key for the single initial contract ledger entry.
// Safe unique key (no nullable compound index). Kept stable per hire forever,
// so repeated activations / confirmations / backfills never duplicate a row.
export const initialEarningIdempotencyKey = (hireId) =>
  `worker_earning_initial_${hireId}`;

// Creates ONE PENDING ledger entry for a hire, if none exists.
// `hire` must be a raw Prisma Hire record (includes workerId, employerId,
// offerId, agreedSalary, createdAt, employmentStartDate, etc).
// Idempotent: returns existing record when one already exists for the key,
// and handles concurrent unique-key races safely.
export const ensureInitialWorkerEarning = async (hire) => {
  if (!hire || !hire.id) {
    return null;
  }

  const idempotencyKey = initialEarningIdempotencyKey(hire.id);

  // Resolve the authenticated worker identity (User.id).
  // Hire.workerId references WorkerProfile, so we must trace
  // WorkerProfile.userId instead of comparing ids directly.
  let workerId = hire.workerId;
  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { id: hire.workerId },
      select: { userId: true },
    });
    if (profile?.userId) {
      workerId = profile.userId;
    }
  } catch (resolveError) {
    console.warn(
      `[WorkerEarning] Could not resolve worker profile for hire ${hire.id}:`,
      resolveError.message
    );
  }

  const periodStart = hire.employmentStartDate || hire.startDate || hire.createdAt || null;

  const data = {
    workerId: String(workerId),
    workerProfileId: String(hire.workerId),
    employerId: String(hire.employerId),
    hireId: String(hire.id),
    offerId: hire.offerId ? String(hire.offerId) : null,
    amount: Number(hire.agreedSalary || 0),
    currency: 'EGP',
    earningType: WORKER_EARNING_TYPE.MONTHLY_CONTRACT,
    status: WORKER_EARNING_STATUS.PENDING,
    periodStart,
    periodEnd: null,
    earnedAt: null,
    dueAt: null,
    paidAt: null,
    idempotencyKey,
    metadata: {
      source: 'hire_activation',
      // informational only — never implies money moved to the worker
      note: 'contractual pending amount',
      createdAt: new Date().toISOString(),
    },
  };

  try {
    // Fast path: avoid a write when the key already exists.
    const existing = await prisma.workerEarning.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }
  } catch (readError) {
    console.warn(
      `[WorkerEarning] Ledger lookup failed for hire ${hire.id}:`,
      readError.message
    );
  }

  try {
    return await prisma.workerEarning.create({ data });
  } catch (createError) {
    // P2002 = unique constraint violation. Another concurrent request
    // created the same idempotency key — treat as already done.
    if (createError.code === 'P2002') {
      const existing = await prisma.workerEarning.findUnique({
        where: { idempotencyKey },
      });
      return existing || null;
    }
    console.error(
      `[WorkerEarning] Failed to create ledger record for hire ${hire.id}:`,
      createError.message
    );
    return null;
  }
};

export default {
  WORKER_EARNING_STATUS,
  WORKER_EARNING_TYPE,
  initialEarningIdempotencyKey,
  ensureInitialWorkerEarning,
};