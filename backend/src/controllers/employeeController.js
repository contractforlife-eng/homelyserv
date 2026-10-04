// backend/src/controllers/employeeController.js
// ============================================================
// EMPLOYEES CONTROLLER (shared, role-aware: TEACHER / DOCTOR)
// ============================================================
// Role-aware front-end to the EXISTING DoctorEmployee architecture. The model,
// status semantics (isActive), salary validation rules and UI are the existing
// ones - only the tenancy is generalized so the same implementation serves the
// Teacher and Doctor portals. The existing /api/doctor-accounts/employees
// endpoints are left untouched, so Doctor behavior never regresses.
//
// OWNERSHIP: every query is scoped by buildOwnerScope(req.userId) (canonical
// ownerUserId + the legacy doctorId key). A foreign employee is therefore
// indistinguishable from a missing one, so one portal can never read or modify
// another portal's employees, and no owner id from the request is trusted.
import DoctorEmployee from '../models/DoctorEmployee.js';
import prisma from '../lib/prisma.js';
import {
  buildOwnerScope,
  buildOwnedEmployeeFilter,
  buildEmployeeLifecycleUpdate,
  resolveEmployeeLifecycleState,
  resolveEmployeeSource,
  isEmployeeOwnerRole,
  ensureEmployeeForHire,
  EMPLOYEE_LIFECYCLE_ACTIONS,
} from '../services/employeeService.js';

// Allow-listed employee fields, identical to the Doctor Accounts set
// (WRITABLE_EMPLOYEE_FIELDS), so both portals write identical documents.
const WRITABLE_EMPLOYEE_FIELDS = Object.freeze([
  'jobTitle',
  'currency',
  'isActive',
  'notes',
]);

const pickWritableEmployeeFields = (body, payload) => {
  for (const field of WRITABLE_EMPLOYEE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
};

// Cap so a long hire history can never turn a page load into a bulk write.
const RECONCILE_LIMIT = 50;

// Test seam. The reconciliation is the ONLY part of this controller that
// touches Prisma, so tests can replace both data sources instead of reaching a
// live database (which would otherwise read and WRITE real employee rows).
let prismaClient = prisma;
let employeeFactory = ensureEmployeeForHire;
export const __setEmployeeDataSources = ({ prisma: next, ensureEmployeeForHire: factory } = {}) => {
  if (next) prismaClient = next;
  if (factory) employeeFactory = factory;
};

/**
 * Self-heal the caller's OWN employees from their own hires.
 *
 * WHY THIS EXISTS: an Employee is created when a Worker accepts an offer
 * (ensureEmployeeForHire, hooked into hireController.respondToOffer). Hires that
 * were accepted BEFORE that hook shipped - or while a stale server build was
 * running - have a Hire and a My Hires row but no Employee document, so the
 * Employees page is legitimately empty for them.
 *
 * This reconciles that gap on read instead of leaving it permanently broken:
 *
 *   - ONLY the caller's own hires are considered (`employerId: req.userId`), so
 *     ownership is unchanged and nothing cross-portal is touched.
 *   - ONLY TEACHER/DOCTOR reach this route (router-level `authorize`).
 *   - Reuses the SAME idempotent ensureEmployeeForHire(), which no-ops on an
 *     owner+hire and owner+worker hit, so no duplicate Employee can be created.
 *   - Bounded by RECONCILE_LIMIT and fully wrapped in try/catch: a bookkeeping
 *     problem can never break the list response.
 *
 * It never modifies the Hire lifecycle, payments, commission or expenses.
 */
const reconcileEmployeesFromHires = async (userId) => {
  try {
    const hires = await prismaClient.hire.findMany({
      where: { employerId: String(userId) },
      orderBy: { createdAt: 'desc' },
      take: RECONCILE_LIMIT,
      select: {
        id: true,
        employerId: true,
        workerId: true,
        agreedSalary: true,
        compensationCurrency: true,
      },
    });

    for (const hire of hires) {
      const result = await employeeFactory({ hire });
      if (result.created) {
        console.log(`✅ Employee reconciled for hire ${hire.id}`);
      }
    }
  } catch (error) {
    console.error('⚠️ Employee reconciliation skipped:', error.message);
  }
};

/**
 * PATCH /api/employees/:id/activate | /deactivate | /terminate
 *
 * One implementation for all three transitions so the lifecycle rules can never
 * drift between them (they all delegate to the pure
 * buildEmployeeLifecycleUpdate() rules).
 *
 * Ownership is enforced twice, both times server-side: the read and the write
 * both use buildOwnedEmployeeFilter(req.userId, id), so a foreign employee is
 * indistinguishable from a missing one and changing the id in the request can
 * never reach another portal's employee.
 *
 * No owner/worker id from the request body or query is trusted, and the write
 * only ever touches employment-state fields - never salary, hire, payment or
 * expense data.
 */
const applyEmployeeLifecycle = async (req, res, action) => {
  try {
    const { id } = req.params;

    // Scoped read: 404 for a foreign employee, exactly like the salary route.
    const employee = await DoctorEmployee.findOne(buildOwnedEmployeeFilter(req.userId, id));
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const transition = buildEmployeeLifecycleUpdate(action, employee);
    if (transition.error) {
      return res.status(transition.statusCode).json({
        success: false,
        code: transition.error,
        message: 'A terminated employee cannot be reactivated or deactivated',
      });
    }

    // Scoped atomic update, also the concurrency guard: for terminate the
    // $set only carries `isActive` once already terminated, so repeating the
    // call never overwrites the original termination timestamp.
    const updated = await DoctorEmployee.findOneAndUpdate(
      buildOwnedEmployeeFilter(req.userId, id),
      transition.update,
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.json({
      success: true,
      changed: transition.changed,
      state: resolveEmployeeLifecycleState(updated),
      employee: updated,
    });
  } catch (error) {
    console.error(`Error applying employee ${action}:`, error);
    return res
      .status(500)
      .json({ success: false, message: `Server error applying employee ${action}` });
  }
};

/** PATCH /api/employees/:id/activate - temporarily inactive -> active. */
export const activateEmployee = (req, res) =>
  applyEmployeeLifecycle(req, res, EMPLOYEE_LIFECYCLE_ACTIONS.ACTIVATE);

/** PATCH /api/employees/:id/deactivate - active -> inactive (still an employee). */
export const deactivateEmployee = (req, res) =>
  applyEmployeeLifecycle(req, res, EMPLOYEE_LIFECYCLE_ACTIONS.DEACTIVATE);

/**
 * PATCH /api/employees/:id/terminate - permanently ends the employment.
 * The record, salary and all history are kept; only `isActive`/`terminatedAt`
 * change. Reinstating a terminated employee is not supported.
 */
export const terminateEmployee = (req, res) =>
  applyEmployeeLifecycle(req, res, EMPLOYEE_LIFECYCLE_ACTIONS.TERMINATE);

/**
 * GET /api/employees
 * List the authenticated Teacher/Doctor's own employees.
 */
export const getEmployees = async (req, res) => {
  try {
    // Heal any of the caller's own hires that never produced an Employee (see
    // reconcileEmployeesFromHires). Idempotent, so this is a no-op afterwards.
    await reconcileEmployeesFromHires(req.userId);

    const filter = buildOwnerScope(req.userId);

    // Same lenient-but-safe parsing as the existing doctor employees list:
    // only the exact string 'true'/'false' narrows the list.
    const { isActive } = req.query || {};
    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }

    const employees = await DoctorEmployee.find(filter)
      .sort({ startDate: -1, createdAt: -1 });

    // Each row carries its DERIVED source (HOMELYSERV when it has a hireId,
    // MANUAL otherwise) so the UI can badge it. Nothing extra is stored.
    const withSource = employees.map((employee) => {
      const plain = typeof employee?.toObject === 'function' ? employee.toObject() : employee;
      return { ...plain, source: resolveEmployeeSource(plain) };
    });

    return res.json({ success: true, count: withSource.length, employees: withSource });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching employees' });
  }
};

/**
 * POST /api/employees
 * Add a MANUAL employee (staff the Teacher/Doctor employed directly).
 *
 * A manual employee is an EMPLOYMENT record ONLY. This endpoint deliberately
 * touches nothing else - it never creates an Offer or a Hire, never involves a
 * Worker acceptance, and never touches payments, the 15% recruitment commission
 * or Accounts Expenses. It simply writes one owner-scoped DoctorEmployee with
 * NO `hireId`, which is exactly what marks it MANUAL.
 *
 * The validation rules are the EXACT existing Employee rules reused from
 * createDoctorEmployee (full name, salary, start date; optional job title,
 * currency, isActive, notes) - no new validation semantics.
 *
 * OWNERSHIP: ownerUserId is always req.userId and ownerRole is read from the
 * database, so neither can be supplied or spoofed by the client.
 */
export const createEmployee = async (req, res) => {
  try {
    const body = req.body || {};

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (fullName.length > 120) {
      return res.status(400).json({ success: false, message: 'Full name must not exceed 120 characters' });
    }

    if (body.salary === undefined || body.salary === null || body.salary === '') {
      return res.status(400).json({ success: false, message: 'Salary is required' });
    }
    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0 || salary > 1000000) {
      return res
        .status(400)
        .json({ success: false, message: 'Salary must be a number between 0 and 1000000' });
    }

    if (body.startDate === undefined || body.startDate === null || body.startDate === '') {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }
    const startDateMs = Date.parse(body.startDate);
    if (Number.isNaN(startDateMs)) {
      return res.status(400).json({ success: false, message: 'Start date must be a valid date' });
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    if (body.currency !== undefined && typeof body.currency !== 'string') {
      return res.status(400).json({ success: false, message: 'Currency must be a string' });
    }
    if (typeof body.jobTitle === 'string' && body.jobTitle.trim().length > 120) {
      return res.status(400).json({ success: false, message: 'Job title must not exceed 120 characters' });
    }
    if (typeof body.notes === 'string' && body.notes.length > 1000) {
      return res.status(400).json({ success: false, message: 'Notes must not exceed 1000 characters' });
    }

    // Role comes from the DATABASE, never from the request body.
    const owner = await prismaClient.user.findUnique({
      where: { id: String(req.userId) },
      select: { id: true, role: true },
    });
    if (!owner) {
      return res.status(401).json({ success: false, message: 'Owner account not found' });
    }
    const ownerRole = String(owner.role || '').trim().toUpperCase();
    if (!isEmployeeOwnerRole(ownerRole)) {
      return res.status(403).json({ success: false, message: 'Only a teacher or doctor can add employees' });
    }

    const payload = pickWritableEmployeeFields(body, {
      fullName,
      salary,
      startDate: new Date(startDateMs),
    });

    // Ownership is always the authenticated user.
    payload.ownerUserId = String(req.userId);
    payload.ownerRole = ownerRole;
    // Keep the legacy key populated for doctor-owned records so the existing
    // doctor-scoped queries keep matching them.
    if (ownerRole === 'DOCTOR') {
      payload.doctorId = String(req.userId);
    }
    // NOTE: `hireId` is deliberately NOT set. No hireId => MANUAL source.
    if (payload.isActive === undefined) payload.isActive = true;

    const employee = await DoctorEmployee.create(payload);
    return res.status(201).json({
      success: true,
      employee,
      source: resolveEmployeeSource(employee),
    });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error creating manual employee:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Server error creating employee', error: error.message });
  }
};

/**
 * PATCH /api/employees/:id/salary
 * Edit the salary of one employee the caller owns.
 *
 * Salary validation is the EXACT existing Employee rule (reused from
 * createDoctorEmployee): required, numeric, finite, 0..1000000. Ownership is
 * enforced server-side through the scoped lookup, so swapping an employee id
 * in the request can never edit someone else's salary.
 */
export const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (body.salary === undefined || body.salary === null || body.salary === '') {
      return res.status(400).json({ success: false, message: 'Salary is required' });
    }
    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0 || salary > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a number between 0 and 1000000',
      });
    }

    // Scoped lookup: a foreign employee behaves exactly like a missing one.
    const employee = await DoctorEmployee.findOne(buildOwnedEmployeeFilter(req.userId, id));
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updated = await DoctorEmployee.findOneAndUpdate(
      { _id: id, ...buildOwnerScope(req.userId) },
      { $set: { salary } },
      { new: true },
    );

    return res.json({ success: true, employee: updated });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.code === 11000) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error updating employee salary:', error);
    return res.status(500).json({ success: false, message: 'Server error updating employee' });
  }
};

export default { getEmployees, updateEmployeeSalary };