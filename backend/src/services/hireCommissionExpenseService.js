// backend/src/services/hireCommissionExpenseService.js
// ============================================================
// HIRE COMMISSION -> ACCOUNTS EXPENSE (Teacher / Doctor only)
// ============================================================
// When a Teacher or Doctor completes the HomelyServ recruitment commission
// for one of their own WORKER hires, the amount actually paid to HomelyServ
// must appear once as an Expense in that user's EXISTING Accounts system
// (TeacherExpense / DoctorExpense).
//
// REUSED ARCHITECTURE (no new model, no new Accounts system):
//   - TeacherExpense / DoctorExpense are the existing Models; this service
//     only writes through them with the same fields the existing
//     createTeacherExpense / createDoctorExpense controllers use.
//   - 'OTHER' is an existing category in BOTH enums, so no schema change.
//   - `notes` (existing free-text field, <=1000) carries the stable
//     idempotency/reference token.
//
// AMOUNT AUTHORITY: the completed Payment amount (what was actually paid to
// HomelyServ for the recruitment commission), which the existing payment
// architecture derives from Hire.totalDue. Never the Worker salary, never a
// frontend/request value. The 15% commission is NEVER recalculated here.
//
// ROLE ISOLATION: only TEACHER and DOCTOR payers are recorded. EMPLOYER
// accounting is untouched (there is no Employer expense integration today and
// none is added), and WORKER/STUDENT/ADMIN/SUPPORT/SUPPORT_HELPER can never
// produce a Teacher/Doctor hire expense.
//
// OWNERSHIP: the tenant key always comes from the authoritative
// `hire.employerId`, never from a request body/query.
//
// IDEMPOTENCY: one expense per hire. Re-running the completion path (PayPal
// capture retry, admin approval, bank transfer reconciliation) is a no-op.
// ============================================================
import prisma from '../lib/prisma.js';
import TeacherExpense, { TEACHER_EXPENSE_CATEGORIES } from '../models/TeacherExpense.js';
import DoctorExpense, { DOCTOR_EXPENSE_CATEGORIES } from '../models/DoctorExpense.js';

// Roles whose Accounts systems receive the automatic commission expense.
export const COMMISSION_EXPENSE_ROLES = Object.freeze(['TEACHER', 'DOCTOR']);

// 'OTHER' already exists in both existing enums - no schema change needed.
export const COMMISSION_EXPENSE_CATEGORY = 'OTHER';

const MAX_AMOUNT = 1000000;

const escapeForRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Stable, deterministic reference token stored in the existing `notes` field.
 * Scoped to the HIRE so every retry/finalization path for the same hire
 * resolves to the same token.
 */
export const buildCommissionExpenseReference = (hireId) =>
  `HOMELYSERV_HIRE_COMMISSION|hire=${String(hireId)}`;

/** True when a hire's employer is a role that records commission expenses. */
export const shouldRecordCommissionExpenseForRole = (role) =>
  COMMISSION_EXPENSE_ROLES.includes(String(role || '').trim().toUpperCase());

/**
 * Authoritative amount paid to HomelyServ for the commission.
 * Prefers the completed Payment amount (what was actually charged) and falls
 * back to the Hire's authoritative totalDue. Never a Worker salary.
 */
export const resolveCommissionExpenseAmount = (payment, hire) => {
  const fromPayment = Number(payment?.amount);
  if (Number.isFinite(fromPayment) && fromPayment > 0) return fromPayment;

  const fromHire = Number(hire?.totalDue);
  if (Number.isFinite(fromHire) && fromHire > 0) return fromHire;

  return null;
};

export const resolveCommissionExpenseCurrency = (payment, hire) => {
  const candidate = payment?.currency || hire?.compensationCurrency;
  const normalized = String(candidate || '').trim().toUpperCase();
  return normalized || 'EGP';
};

export const buildCommissionExpenseDescription = (hire) => {
  const jobTitle = String(hire?.jobTitle || '').trim();
  const base = 'HomelyServ recruitment commission for a Worker hire';
  return jobTitle ? `${base} (${jobTitle})`.slice(0, 200) : base;
};
/**
 * Record the HomelyServ commission expense for a completed Worker-hire
 * commission payment made by a TEACHER or DOCTOR.
 *
 * Returns { created: boolean, reason: string, expense?: object }
 * Never throws: an inapplicable hire (wrong role / missing data) is simply
 * skipped so Employer behavior and payment completion are never affected.
 */
export const recordHireCommissionExpense = async ({
  hire,
  payment,
  prismaClient = prisma,
  teacherExpenseModel = TeacherExpense,
  doctorExpenseModel = DoctorExpense,
} = {}) => {
  try {
    if (!hire?.id || !hire?.employerId) {
      return { created: false, reason: 'missing_hire_identity' };
    }

    // Only a genuinely COMPLETED commission payment may create an expense.
    // The canonical trigger (updateHireAfterPayment) sets the Hire to
    // paymentStatus='completed' immediately before calling this, and that DB
    // value - not any client/in-flight payment object - is the authority here.
    // This also guarantees nothing is recorded for pending / created /
    // awaiting-verification / failed / cancelled payments.
    const hirePaymentStatus = String(hire?.paymentStatus || '').trim().toLowerCase();
    if (hirePaymentStatus !== 'completed') {
      return { created: false, reason: 'payment_not_completed' };
    }

    // Role isolation - always resolved from the database, never the request.
    const employer = await prismaClient.user.findUnique({
      where: { id: String(hire.employerId) },
      select: { id: true, role: true },
    });

    if (!employer) {
      return { created: false, reason: 'employer_not_found' };
    }
    if (!shouldRecordCommissionExpenseForRole(employer.role)) {
      // EMPLOYER (and every other role) is intentionally unaffected.
      return { created: false, reason: 'role_not_supported' };
    }

    const amount = resolveCommissionExpenseAmount(payment, hire);
    if (amount === null || amount > MAX_AMOUNT) {
      return { created: false, reason: 'invalid_amount' };
    }

    const currency = resolveCommissionExpenseCurrency(payment, hire);
    const reference = buildCommissionExpenseReference(hire.id);

    const isDoctor = String(employer.role).trim().toUpperCase() === 'DOCTOR';
    const model = isDoctor ? doctorExpenseModel : teacherExpenseModel;
    const allowedCategories = isDoctor ? DOCTOR_EXPENSE_CATEGORIES : TEACHER_EXPENSE_CATEGORIES;
    if (!allowedCategories.includes(COMMISSION_EXPENSE_CATEGORY)) {
      return { created: false, reason: 'category_not_supported' };
    }

    // Tenant key is always the authoritative hire owner.
    const tenantField = isDoctor ? 'doctorId' : 'teacherId';
    const tenantId = String(hire.employerId);

    // IDEMPOTENCY: one expense per hire, whichever path completed the payment.
    const existing = await model.findOne({
      [tenantField]: tenantId,
      notes: new RegExp(`^${escapeForRegex(buildCommissionExpenseReference(hire.id))}\\|`),
    });
    if (existing) {
      return { created: false, reason: 'already_recorded', expense: existing };
    }

    const expense = await model.create({
      [tenantField]: tenantId,
      category: COMMISSION_EXPENSE_CATEGORY,
      description: buildCommissionExpenseDescription(hire),
      amount,
      currency,
      expenseDate: payment?.completedAt ? new Date(payment.completedAt) : new Date(),
      notes: `${reference}|payment=${String(payment?.transactionId || payment?.id || 'unknown')}`,
    });

    return { created: true, reason: 'recorded', expense };
  } catch (error) {
    // Never let bookkeeping break payment completion.
    console.error(
      `⚠️ Could not record HomelyServ commission expense for hire ${hire?.id}:`,
      error.message,
    );
    return { created: false, reason: 'error', error: error.message };
  }
};

export default {
  COMMISSION_EXPENSE_ROLES,
  COMMISSION_EXPENSE_CATEGORY,
  buildCommissionExpenseReference,
  shouldRecordCommissionExpenseForRole,
  resolveCommissionExpenseAmount,
  resolveCommissionExpenseCurrency,
  buildCommissionExpenseDescription,
  recordHireCommissionExpense,
};