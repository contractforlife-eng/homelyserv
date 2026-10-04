// backend/src/services/employeeService.js
// ============================================================
// HIRE -> EMPLOYEE (shared, role-aware)
// ============================================================
// Generalization of the EXISTING Employee architecture (DoctorEmployee,
// doctorAccountsController, Doctor Accounts UI). The model, lifecycle,
// status semantics, salary rules and UI are reused as-is; only the tenancy
// was made role-aware so the SAME implementation serves TEACHER and DOCTOR.
//
// ROLES: only TEACHER and DOCTOR own employees here. EMPLOYER behavior is
// untouched (there is no Employer employee integration today and none is
// added), and WORKER/STUDENT/ADMIN/SUPPORT/SUPPORT_HELPER are never owners.
//
// SALARY: `hire.agreedSalary` - the Worker's employment salary agreed on the
// Hire. NEVER the HomelyServ commission, `payment.amount` or `hire.totalDue`.
// CURRENCY: `hire.compensationCurrency` (no FX, no payment currency).
//
// IDEMPOTENCY: keyed on the authoritative (ownerUserId + hireId) pair, with a
// secondary (ownerUserId + workerUserId) lookup so a retry - or a second hire
// for the same Worker under the same owner - can never create a duplicate
// employee or reset an existing record's salary/status/dates.
// ============================================================
import prisma from '../lib/prisma.js';
import DoctorEmployee from '../models/DoctorEmployee.js';

// Roles allowed to own employees.
export const EMPLOYEE_OWNER_ROLES = Object.freeze(['TEACHER', 'DOCTOR']);

export const isEmployeeOwnerRole = (role) =>
  EMPLOYEE_OWNER_ROLES.includes(String(role || '').trim().toUpperCase());

/**
 * Tenancy scope for one owner.
 * `ownerUserId` is canonical; `doctorId` is the LEGACY tenant key so the
 * existing doctor_employees records stay visible to their doctor.
 */
export const buildOwnerScope = (userId) => {
  const uid = String(userId);
  return {
    $or: [
      { ownerUserId: uid },
      { ownerUserId: { $exists: false }, doctorId: uid },
    ],
  };
};

/**
 * Same scope, but restricted to ONE employee _id. Used by every update so a
 * foreign employee behaves exactly like a missing one.
 */
export const buildOwnedEmployeeFilter = (userId, employeeId) => ({
  _id: employeeId,
  ...buildOwnerScope(userId),
});

/** Resolve the initial salary from the authoritative Hire. */
export const resolveEmployeeSalaryFromHire = (hire) => {
  const salary = Number(hire?.agreedSalary);
  if (Number.isFinite(salary) && salary >= 0) return salary;
  return 0;
};

export const resolveEmployeeCurrencyFromHire = (hire) => {
  const currency = String(hire?.compensationCurrency || '').trim().toUpperCase();
  return currency || 'EGP';
};
/**
 * Ensure an Employee exists for an accepted/active Worker Hire owned by a
 * TEACHER or DOCTOR. Idempotent: safe to call on every lifecycle replay.
 *
 * Returns { created: boolean, reason: string, employee?: object }
 * Never throws, so employment bookkeeping can never break the hire lifecycle.
 */
export const ensureEmployeeForHire = async ({
  hire,
  prismaClient = prisma,
  employeeModel = DoctorEmployee,
} = {}) => {
  try {
    if (!hire?.id || !hire?.employerId) {
      return { created: false, reason: 'missing_hire_identity' };
    }

    const ownerUserId = String(hire.employerId);

    // Role isolation - always resolved from the database, never the request.
    const owner = await prismaClient.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true, role: true },
    });
    if (!owner) return { created: false, reason: 'owner_not_found' };

    const ownerRole = String(owner.role || '').trim().toUpperCase();
    if (!isEmployeeOwnerRole(ownerRole)) {
      // EMPLOYER (and every other role) is intentionally unaffected.
      return { created: false, reason: 'role_not_supported' };
    }

    // Canonical Worker identity behind the Hire (WorkerProfile.userId).
    const workerProfile = await prismaClient.workerProfile.findUnique({
      where: { id: String(hire.workerId) },
      select: { id: true, userId: true },
    });
    if (!workerProfile?.userId) {
      return { created: false, reason: 'worker_not_found' };
    }
    const workerUserId = String(workerProfile.userId);

    // IDEMPOTENCY - 1: the very same hire.
    const existingForHire = await employeeModel.findOne({ ownerUserId, hireId: String(hire.id) });
    if (existingForHire) {
      return { created: false, reason: 'already_recorded', employee: existingForHire };
    }

    // IDEMPOTENCY - 2: this owner already employs that Worker.
    const existingForWorker = await employeeModel.findOne({ ownerUserId, workerUserId });
    if (existingForWorker) {
      return { created: false, reason: 'already_employee', employee: existingForWorker };
    }

    // Authoritative Worker display name (never a client value).
    const workerUser = await prismaClient.user.findUnique({
      where: { id: workerUserId },
      select: { id: true, fullName: true },
    });

    const employee = await employeeModel.create({
      ownerUserId,
      ownerRole,
      // Keep the legacy key populated for doctor-owned records so the
      // existing doctor-scoped queries keep matching them.
      ...(ownerRole === 'DOCTOR' ? { doctorId: ownerUserId } : {}),
      hireId: String(hire.id),
      workerUserId,
      fullName: String(workerUser?.fullName || workerUserId).slice(0, 120),
      jobTitle: String(hire.jobTitle || '').slice(0, 120),
      salary: resolveEmployeeSalaryFromHire(hire),
      currency: resolveEmployeeCurrencyFromHire(hire),
      startDate: new Date(),
      isActive: true,
      notes: `Auto-created from Worker hire ${hire.id}.`,
    });

    return { created: true, reason: 'recorded', employee };
  } catch (error) {
    console.error(`⚠️ Could not ensure employee for hire ${hire?.id}:`, error.message);
    return { created: false, reason: 'error', error: error.message };
  }
};

/**
 * Activate / deactivate / terminate.
 *
 * `isActive` is the canonical employment status already used by
 * doctorAccountsController (salary periods only read `isActive: true`), so no
 * second status enum is introduced. A single optional `terminatedAt` marker is
 * stored alongside it, because `isActive: false` alone cannot distinguish a
 * temporary pause from a permanent end of employment:
 *
 *   ACTIVE     -> isActive: true,  terminatedAt: null
 *   INACTIVE   -> isActive: false, terminatedAt: null
 *   TERMINATED -> isActive: false, terminatedAt: <timestamp>
 *
 * Nothing is ever deleted and no hire/payment/expense/salary field is written.
 */
export const EMPLOYEE_LIFECYCLE_ACTIONS = Object.freeze({
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  TERMINATE: 'terminate',
});

export const resolveEmployeeLifecycleState = (employee) => {
  if (employee?.terminatedAt) return 'TERMINATED';
  return employee?.isActive === false ? 'INACTIVE' : 'ACTIVE';
};

/**
 * Pure transition rules shared by every portal, so the lifecycle behaviour
 * cannot drift between endpoints.
 *
 * Returns `{ update, changed, state }` for a safe transition, or
 * `{ error, statusCode }` when the transition must be rejected. `update` only
 * ever contains employment-state fields.
 */
export const buildEmployeeLifecycleUpdate = (action, employee, now = new Date()) => {
  const state = resolveEmployeeLifecycleState(employee);

  if (action === EMPLOYEE_LIFECYCLE_ACTIONS.TERMINATE) {
    // Idempotent: repeating terminate keeps the ORIGINAL timestamp rather than
    // overwriting the historical end of employment.
    if (state === 'TERMINATED') {
      return { update: { $set: { isActive: false } }, changed: false, state };
    }
    return {
      update: { $set: { isActive: false, terminatedAt: now } },
      changed: true,
      state: 'TERMINATED',
    };
  }

  // Reinstatement of a permanently terminated employee is not supported by the
  // existing business logic (a rehire creates a new Employee via
  // ensureEmployeeForHire), so reject it instead of silently erasing the
  // historical termination.
  if (state === 'TERMINATED') {
    return { error: 'employee_terminated', statusCode: 400 };
  }

  const nextIsActive = action === EMPLOYEE_LIFECYCLE_ACTIONS.ACTIVATE;
  return {
    update: { $set: { isActive: nextIsActive } },
    changed: employee.isActive !== nextIsActive,
    state: nextIsActive ? 'ACTIVE' : 'INACTIVE',
  };
};

export const serializeEmployeeLifecycle = (employee) => ({
  state: resolveEmployeeLifecycleState(employee),
  isActive: employee.isActive !== false,
  terminatedAt: employee.terminatedAt || null,
});

/**
 * Where an Employee entered the system.
 *
 *   HOMELYSERV - created by the canonical Search Worker -> Send Hire ->
 *                Worker accepts flow. These records always carry the Hire they
 *                came from, and they keep the full payment/commission history.
 *   MANUAL    - added directly by the Teacher/Doctor as staff, with no HomelyServ
 *                Offer, Hire, acceptance or payment. They have no `hireId`.
 *
 * The source is DERIVED, never stored: `hireId` is written only by
 * ensureEmployeeForHire(), so its presence is the reliable discriminator.
 * Legacy DoctorEmployee records (doctorId only, no hireId) are genuinely manual
 * staff and are therefore correctly classified as MANUAL - no backfill needed.
 */
export const EMPLOYEE_SOURCES = Object.freeze({
  HOMELYSERV: 'HOMELYSERV',
  MANUAL: 'MANUAL',
});

export const resolveEmployeeSource = (employee) => {
  const hireId = employee?.hireId;
  const fromHire = hireId !== null && hireId !== undefined && String(hireId).trim() !== '';
  return fromHire ? EMPLOYEE_SOURCES.HOMELYSERV : EMPLOYEE_SOURCES.MANUAL;
};

export default {
  EMPLOYEE_OWNER_ROLES,
  isEmployeeOwnerRole,
  buildOwnerScope,
  buildOwnedEmployeeFilter,
  resolveEmployeeSalaryFromHire,
  resolveEmployeeCurrencyFromHire,
  ensureEmployeeForHire,
  EMPLOYEE_LIFECYCLE_ACTIONS,
  resolveEmployeeLifecycleState,
  buildEmployeeLifecycleUpdate,
  serializeEmployeeLifecycle,
  EMPLOYEE_SOURCES,
  resolveEmployeeSource,
};