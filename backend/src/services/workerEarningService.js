// backend/src/services/workerEarningService.js
// Worker Earnings Ledger — Phase 1 + Phase 2 service layer.
//
// IMPORTANT SEMANTICS:
// A WorkerEarning record represents a CONTRACTUAL/PENDING earning period
// tied to an active hire (Hire.agreedSalary). It does NOT mean the worker
// has received any money. HomelyServ does not process worker salaries.
//
// Phase 1 ONLY creates PENDING records.
// Phase 2 adds the bilateral confirmation state machine:
//   PENDING -> (worker submits) -> AWAITING_CONFIRMATION
//   AWAITING_CONFIRMATION -> (employer approves) -> EARNED
//   AWAITING_CONFIRMATION -> (employer disputes) -> DISPUTED
// EARNED means "BOTH Worker and Employer confirmed the work period was
// completed inside HomelyServ" — never "salary received". The trip to
// PAID is intentionally not implemented yet.
import prisma from '../lib/prisma.js';
import {
  LEGACY_DEFAULT_CURRENCY,
  isSupportedCurrency,
  normalizeCurrencyCode,
} from '../utils/currencyMetadata.js';

export const WORKER_EARNING_STATUS = {
  PENDING: 'PENDING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  EARNED: 'EARNED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  ON_HOLD: 'ON_HOLD',
};

export const WORKER_EARNING_TYPE = {
  MONTHLY_CONTRACT: 'MONTHLY_CONTRACT',
};

// Roles allowed to perform confirmation actions per transition.
export const CONFIRMATION_ROLES = {
  WORKER: 'WORKER',
  EMPLOYER: 'EMPLOYER',
};

// Deterministic idempotency key for the single initial contract ledger entry.
// Safe unique key (no nullable compound index). Kept stable per hire forever,
// so repeated activations / confirmations / backfills never duplicate a row.
export const initialEarningIdempotencyKey = (hireId) =>
  `worker_earning_initial_${hireId}`;

// Hire is the sole currency authority for a contractual earning. Only a
// genuinely absent legacy value resolves to EGP; malformed or unsupported
// explicit values are rejected so corrupted contract data is never hidden.
export const resolveHireEarningCurrency = (hire) => {
  if (hire?.compensationCurrency === null || hire?.compensationCurrency === undefined) {
    return LEGACY_DEFAULT_CURRENCY;
  }

  const currency = normalizeCurrencyCode(hire.compensationCurrency);
  if (!currency || !isSupportedCurrency(currency)) {
    throw new Error(`Invalid Hire compensationCurrency for WorkerEarning: ${String(hire.compensationCurrency)}`);
  }

  return currency;
};

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

  // Preserve the immutable historical record exactly as created. In
  // particular, never rewrite an existing earning if its linked Hire now has
  // a different or invalid currency.
  try {
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

  let currency;
  try {
    currency = resolveHireEarningCurrency(hire);
  } catch (currencyError) {
    console.error(
      `[WorkerEarning] Refusing ledger creation for hire ${hire.id}:`,
      currencyError.message
    );
    return null;
  }

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
    amount: Number(hire.agreedSalary ?? 0),
    currency,
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

// ------------------------------------------------------------------
// PHASE 2 — BILATERAL CONFIRMATION STATE MACHINE
// Every transition is guarded atomically by (id + owner + expected
// status) so two concurrent callers can never double-apply a step, and
// a caller can never transition someone else's record.
// ------------------------------------------------------------------

// Append an immutable event to metadata.audit (best-effort, never throws).
const appendAudit = async (earningId, entry) => {
  try {
    const record = await prisma.workerEarning.findUnique({ where: { id: earningId } });
    if (!record) return;
    const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata : {};
    const audit = Array.isArray(metadata.audit) ? metadata.audit : [];
    await prisma.workerEarning.update({
      where: { id: earningId },
      data: {
        metadata: {
          ...metadata,
          audit: [...audit, { at: new Date().toISOString(), ...entry }],
        },
      },
    });
  } catch (error) {
    console.warn('[WorkerEarning] Failed to append audit entry:', error.message);
  }
};

// Worker submits a period for employer confirmation.
// PENDING -> AWAITING_CONFIRMATION. Returns the updated record or null.
export const submitWorkerConfirmation = async ({ earningId, workerId, workerRole }) => {
  const now = new Date();
  const actor = `${workerRole || CONFIRMATION_ROLES.WORKER}:${String(workerId)}`;

  const result = await prisma.workerEarning.updateMany({
    where: {
      id: String(earningId),
      workerId: String(workerId),
      status: WORKER_EARNING_STATUS.PENDING,
    },
    data: {
      status: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
      confirmationRequestedAt: now,
      confirmationRequestedBy: actor,
      confirmedByWorkerAt: now,
    },
  });

  if (result.count !== 1) return null;

  await appendAudit(String(earningId), {
    action: 'SUBMITTED',
    actor,
    from: WORKER_EARNING_STATUS.PENDING,
    to: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
  });

  return prisma.workerEarning.findUnique({ where: { id: String(earningId) } });
};

// Employer approves a submitted period.
// AWAITING_CONFIRMATION -> EARNED. Returns the updated record or null.
export const approveByEmployer = async ({ earningId, employerId, employerRole }) => {
  const now = new Date();
  const actor = `${employerRole || CONFIRMATION_ROLES.EMPLOYER}:${String(employerId)}`;

  const result = await prisma.workerEarning.updateMany({
    where: {
      id: String(earningId),
      employerId: String(employerId),
      status: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
    },
    data: {
      status: WORKER_EARNING_STATUS.EARNED,
      confirmedByEmployerAt: now,
      confirmedAt: now,
      earnedAt: now,
    },
  });

  if (result.count !== 1) return null;

  await appendAudit(String(earningId), {
    action: 'APPROVED',
    actor,
    from: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
    to: WORKER_EARNING_STATUS.EARNED,
  });

  return prisma.workerEarning.findUnique({ where: { id: String(earningId) } });
};

// Employer disputes a submitted period.
// AWAITING_CONFIRMATION -> DISPUTED. Returns the updated record or null.
export const disputeByEmployer = async ({ earningId, employerId, employerRole, reason }) => {
  const actor = `${employerRole || CONFIRMATION_ROLES.EMPLOYER}:${String(employerId)}`;

  const result = await prisma.workerEarning.updateMany({
    where: {
      id: String(earningId),
      employerId: String(employerId),
      status: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
    },
    data: {
      status: WORKER_EARNING_STATUS.DISPUTED,
    },
  });

  if (result.count !== 1) return null;

  await appendAudit(String(earningId), {
    action: 'DISPUTED',
    actor,
    from: WORKER_EARNING_STATUS.AWAITING_CONFIRMATION,
    to: WORKER_EARNING_STATUS.DISPUTED,
    reason: reason || null,
  });

  return prisma.workerEarning.findUnique({ where: { id: String(earningId) } });
};

export default {
  WORKER_EARNING_STATUS,
  WORKER_EARNING_TYPE,
  CONFIRMATION_ROLES,
  initialEarningIdempotencyKey,
  resolveHireEarningCurrency,
  ensureInitialWorkerEarning,
  submitWorkerConfirmation,
  approveByEmployer,
  disputeByEmployer,
};
