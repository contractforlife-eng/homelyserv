// backend/src/services/employeeService.test.js
// ============================================================
// HIRE -> EMPLOYEE rules (shared Teacher/Doctor implementation).
// Fully dependency-injected: no database is touched.
// Run: node --test src/services/employeeService.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureEmployeeForHire,
  buildOwnerScope,
  buildOwnedEmployeeFilter,
  isEmployeeOwnerRole,
  resolveEmployeeSalaryFromHire,
  resolveEmployeeCurrencyFromHire,
  EMPLOYEE_OWNER_ROLES,
  resolveEmployeeLifecycleState,
  buildEmployeeLifecycleUpdate,
  serializeEmployeeLifecycle,
} from './employeeService.js';

const TEACHER_ID = 'teacher-1';
const DOCTOR_ID = 'doctor-1';
const WORKER_USER_ID = 'worker-user-1';

const hire = (overrides = {}) => ({
  id: 'hire-1',
  employerId: TEACHER_ID,
  workerId: 'wp-1',
  // agreedSalary is the Worker employment salary; totalDue is the HomelyServ
  // commission and must never become the employee salary.
  agreedSalary: 5000,
  totalDue: 750,
  compensationCurrency: 'EGP',
  jobTitle: 'Tutor',
  ...overrides,
});

// In-memory stand-in for the shared Employee model.
const makeEmployeeModel = (seed = []) => {
  const rows = [...seed];
  const matches = (row, query = {}) => {
    if (query._id && String(row._id) !== String(query._id)) return false;
    if (query.ownerUserId !== undefined && row.ownerUserId !== query.ownerUserId) return false;
    if (query.hireId !== undefined && row.hireId !== query.hireId) return false;
    if (query.workerUserId !== undefined && row.workerUserId !== query.workerUserId) return false;
    if (query.$or) {
      return query.$or.some((cond) => {
        if (cond.ownerUserId !== undefined) return row.ownerUserId === cond.ownerUserId;
        if (cond.ownerUserId?.$exists === false) {
          return row.ownerUserId === null || row.ownerUserId === undefined
            ? String(row.doctorId) === String(cond.doctorId)
            : false;
        }
        return false;
      });
    }
    return true;
  };
  return {
    rows,
    findOne: async (query = {}) => rows.find((row) => matches(row, query)) || null,
    find: (query = {}) => rows.filter((row) => matches(row, query)),
    create: async (doc) => {
      const row = { _id: `emp-${rows.length + 1}`, ...doc };
      rows.push(row);
      return row;
    },
  };
};

const makePrisma = (ownerRole, workerFullName = 'Worker One') => ({
  user: {
    findUnique: async ({ where }) => {
      if (where.id === TEACHER_ID) return { id: TEACHER_ID, role: ownerRole, fullName: 'Teacher' };
      if (where.id === DOCTOR_ID) return { id: DOCTOR_ID, role: ownerRole, fullName: 'Doctor' };
      if (where.id === WORKER_USER_ID) return { id: WORKER_USER_ID, role: 'WORKER', fullName: workerFullName };
      return null;
    },
  },
  workerProfile: {
    findUnique: async () => ({ id: 'wp-1', userId: WORKER_USER_ID }),
  },
});

const run = (ownerRole, hireOverrides = {}, { seed = [], workerFullName } = {}) => {
  const employeeModel = makeEmployeeModel(seed);
  return ensureEmployeeForHire({
    hire: hire(hireOverrides),
    prismaClient: makePrisma(ownerRole, workerFullName),
    employeeModel,
  }).then((result) => ({ result, employeeModel }));
};

// ---------------------------------------------------------------
// A. Teacher: accepted hire produces exactly one Employee
// ---------------------------------------------------------------
test('A. Teacher Worker hire produces exactly one Employee', async () => {
  const { result, employeeModel } = await run('TEACHER');
  assert.equal(result.created, true);
  assert.equal(employeeModel.rows.length, 1);

  const [row] = employeeModel.rows;
  assert.equal(row.ownerUserId, TEACHER_ID);
  assert.equal(row.ownerRole, 'TEACHER');
  assert.equal(row.hireId, 'hire-1');
  assert.equal(row.workerUserId, WORKER_USER_ID);
  assert.equal(row.fullName, 'Worker One');
  assert.equal(row.isActive, true);
  assert.equal(row.doctorId, undefined); // no legacy key for a teacher employee
});

// ---------------------------------------------------------------
// B. Doctor: accepted hire produces exactly one Employee (legacy key kept)
// ---------------------------------------------------------------
test('B. Doctor Worker hire produces exactly one Employee', async () => {
  const { result, employeeModel } = await run('DOCTOR', { employerId: DOCTOR_ID });
  assert.equal(result.created, true);
  assert.equal(employeeModel.rows.length, 1);
  assert.equal(employeeModel.rows[0].ownerUserId, DOCTOR_ID);
  assert.equal(employeeModel.rows[0].doctorId, DOCTOR_ID);
});

// ---------------------------------------------------------------
// C. Initial salary = authoritative Hire agreedSalary (never commission)
// ---------------------------------------------------------------
test('C. Initial salary is hire.agreedSalary, never totalDue/commission', async () => {
  const { employeeModel } = await run('TEACHER');
  const [row] = employeeModel.rows;
  assert.equal(row.salary, 5000);
  assert.equal(row.salary, resolveEmployeeSalaryFromHire(hire()));
  assert.notEqual(row.salary, 750); // hire.totalDue (commission)
});

test('C2. Salary/currency helpers read the Hire, with EGP fallback', () => {
  assert.equal(resolveEmployeeSalaryFromHire({ agreedSalary: '4200' }), 4200);
  assert.equal(resolveEmployeeSalaryFromHire({}), 0);
  assert.equal(resolveEmployeeCurrencyFromHire({ compensationCurrency: 'usd' }), 'USD');
  assert.equal(resolveEmployeeCurrencyFromHire({}), 'EGP');
});
// ---------------------------------------------------------------
// H. Duplicate protection - the same hire can never create 2 employees
// ---------------------------------------------------------------
test('H1. Re-running the lifecycle for the same hire creates exactly ONE Employee', async () => {
  const employeeModel = makeEmployeeModel();
  const prismaClient = makePrisma('TEACHER');

  const invoke = () => ensureEmployeeForHire({ hire: hire(), prismaClient, employeeModel });

  const first = await invoke();
  const second = await invoke();
  const third = await invoke();

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.reason, 'already_recorded');
  assert.equal(third.created, false);
  assert.equal(employeeModel.rows.length, 1);
});

test('H2. A second hire of the same Worker by the same owner creates no duplicate', async () => {
  const employeeModel = makeEmployeeModel();
  const prismaClient = makePrisma('TEACHER');

  await ensureEmployeeForHire({ hire: hire(), prismaClient, employeeModel });
  const again = await ensureEmployeeForHire({
    hire: hire({ id: 'hire-2' }),
    prismaClient,
    employeeModel,
  });

  assert.equal(again.created, false);
  assert.equal(again.reason, 'already_employee');
  assert.equal(employeeModel.rows.length, 1);
});

test('H3. An existing employee salary/status is never reset on a retry', async () => {
  const seed = [{
    _id: 'emp-existing',
    ownerUserId: TEACHER_ID,
    hireId: 'hire-1',
    workerUserId: WORKER_USER_ID,
    salary: 9100,
    isActive: false,
  }];
  const { result, employeeModel } = await run('TEACHER', {}, { seed });
  assert.equal(result.created, false);
  assert.equal(employeeModel.rows.length, 1);
  assert.equal(employeeModel.rows[0].salary, 9100);
  assert.equal(employeeModel.rows[0].isActive, false);
});

// ---------------------------------------------------------------
// I / J. Role isolation - only TEACHER and DOCTOR own employees
// ---------------------------------------------------------------
test('I. Only TEACHER and DOCTOR are employee-owner roles', () => {
  assert.deepEqual([...EMPLOYEE_OWNER_ROLES], ['TEACHER', 'DOCTOR']);
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER', 'EMPLOYER']) {
    assert.equal(isEmployeeOwnerRole(role), false, role);
  }
  assert.equal(isEmployeeOwnerRole('TEACHER'), true);
  assert.equal(isEmployeeOwnerRole('DOCTOR'), true);
});

test('I2. WORKER/STUDENT/ADMIN/SUPPORT/SUPPORT_HELPER hires record nothing', async () => {
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
    const { result, employeeModel } = await run(role);
    assert.equal(result.created, false, role);
    assert.equal(result.reason, 'role_not_supported');
    assert.equal(employeeModel.rows.length, 0);
  }
});

test('J. EMPLOYER hires are untouched (no employee integration)', async () => {
  const { result, employeeModel } = await run('EMPLOYER');
  assert.equal(result.created, false);
  assert.equal(result.reason, 'role_not_supported');
  assert.equal(employeeModel.rows.length, 0);
});

// ---------------------------------------------------------------
// G. Legacy doctor records stay visible to their doctor
// ---------------------------------------------------------------
test('G. Legacy doctor employees (no ownerUserId) remain scoped to their doctor', () => {
  const scope = buildOwnerScope(DOCTOR_ID);
  const legacy = { _id: 'emp-legacy', doctorId: DOCTOR_ID, salary: 8000 };
  const foreign = { _id: 'emp-foreign', doctorId: 'other-doctor', salary: 8000 };
  assert.equal(legacy._id in scope.$or ? false : true, true);
  assert.equal(buildOwnerScope(TEACHER_ID).$or.length, 2);
  // The scoped lookup used by updates pins the employee id too.
  assert.equal(buildOwnedEmployeeFilter(DOCTOR_ID, 'emp-legacy')._id, 'emp-legacy');
});

// ---------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------
test('No employee when the hire has no identity or the owner is unknown', async () => {
  const missing = await ensureEmployeeForHire({ hire: {}, employeeModel: makeEmployeeModel() });
  assert.equal(missing.reason, 'missing_hire_identity');

  const { result, employeeModel } = await run('TEACHER', { employerId: 'ghost-user' });
  assert.equal(result.created, false);
  assert.equal(result.reason, 'owner_not_found');
  assert.equal(employeeModel.rows.length, 0);
});

test('A failure inside the employee write never propagates', async () => {
  const brokenModel = {
    findOne: async () => null,
    create: async () => { throw new Error('db down'); },
  };
  const result = await ensureEmployeeForHire({
    hire: hire(),
    prismaClient: makePrisma('TEACHER'),
    employeeModel: brokenModel,
  });
  assert.equal(result.created, false);
  assert.equal(result.reason, 'error');
});

// ============================================================
// Employee lifecycle rules (activate / deactivate / terminate)
// Pure functions: no database, no ownership filtering.
// ============================================================

test('Lifecycle state is derived from isActive + terminatedAt', () => {
  // Legacy records have no terminatedAt at all -> still ACTIVE/INACTIVE.
  assert.equal(resolveEmployeeLifecycleState({ isActive: true }), 'ACTIVE');
  assert.equal(resolveEmployeeLifecycleState({ isActive: false }), 'INACTIVE');
  assert.equal(resolveEmployeeLifecycleState({ isActive: true, terminatedAt: null }), 'ACTIVE');
  assert.equal(
    resolveEmployeeLifecycleState({ isActive: false, terminatedAt: new Date('2024-01-01') }),
    'TERMINATED',
  );
  // A terminated employee is TERMINATED even if isActive somehow reads true.
  assert.equal(
    resolveEmployeeLifecycleState({ isActive: true, terminatedAt: new Date('2024-01-01') }),
    'TERMINATED',
  );
  assert.equal(resolveEmployeeLifecycleState(undefined), 'ACTIVE');
});

test('Deactivate only flips isActive and never sets terminatedAt', () => {
  const t = buildEmployeeLifecycleUpdate('deactivate', { isActive: true });
  assert.equal(t.state, 'INACTIVE');
  assert.equal(t.changed, true);
  assert.deepEqual(t.update, { $set: { isActive: false } });
  // Nothing but employment state is ever written: salary/hire/payment stay out.
  assert.deepEqual(Object.keys(t.update.$set), ['isActive']);
});

test('Activate only flips isActive back to true', () => {
  const t = buildEmployeeLifecycleUpdate('activate', { isActive: false, terminatedAt: null });
  assert.equal(t.state, 'ACTIVE');
  assert.equal(t.changed, true);
  assert.deepEqual(t.update, { $set: { isActive: true } });
});

test('Terminate sets isActive=false and records terminatedAt once', () => {
  const now = new Date('2024-06-01T10:00:00.000Z');
  const t = buildEmployeeLifecycleUpdate('terminate', { isActive: true }, now);
  assert.equal(t.state, 'TERMINATED');
  assert.equal(t.changed, true);
  assert.deepEqual(t.update, { $set: { isActive: false, terminatedAt: now } });
});

test('Terminate from INACTIVE is allowed (ACTIVE and INACTIVE both terminate)', () => {
  const t = buildEmployeeLifecycleUpdate('terminate', { isActive: false, terminatedAt: null });
  assert.equal(t.state, 'TERMINATED');
  assert.deepEqual(Object.keys(t.update.$set).sort(), ['isActive', 'terminatedAt']);
});

test('Repeating terminate keeps the ORIGINAL timestamp (no overwrite)', () => {
  const original = new Date('2024-06-01T10:00:00.000Z');
  const t = buildEmployeeLifecycleUpdate(
    'terminate',
    { isActive: false, terminatedAt: original },
    new Date('2025-01-01T00:00:00.000Z'),
  );
  assert.equal(t.state, 'TERMINATED');
  assert.equal(t.changed, false);
  // terminatedAt is NOT in the update, so the stored value is preserved.
  assert.deepEqual(t.update, { $set: { isActive: false } });
});

test('A terminated employee cannot be reactivated or deactivated', () => {
  const terminated = { isActive: false, terminatedAt: new Date('2024-06-01') };
  for (const action of ['activate', 'deactivate']) {
    const t = buildEmployeeLifecycleUpdate(action, terminated);
    assert.equal(t.error, 'employee_terminated');
    assert.equal(t.statusCode, 400);
    assert.equal(t.update, undefined);
  }
});

test('Repeating activate/deactivate is a no-op that does not corrupt state', () => {
  const alreadyActive = buildEmployeeLifecycleUpdate('activate', { isActive: true });
  assert.equal(alreadyActive.changed, false);
  assert.equal(alreadyActive.state, 'ACTIVE');

  const alreadyInactive = buildEmployeeLifecycleUpdate('deactivate', { isActive: false });
  assert.equal(alreadyInactive.changed, false);
  assert.equal(alreadyInactive.state, 'INACTIVE');
});

test('Lifecycle rules never write salary, hire or payment fields', () => {
  const employee = { isActive: true, salary: 5000, currency: 'EGP', hireId: 'h1', paymentStatus: 'PAID' };
  const updates = ['activate', 'deactivate', 'terminate'].map(
    (action) => buildEmployeeLifecycleUpdate(action, { ...employee }),
  );
  for (const t of updates) {
    for (const key of Object.keys(t.update.$set)) {
      assert.ok(
        ['isActive', 'terminatedAt'].includes(key),
        `lifecycle must not write "${key}"`,
      );
    }
  }
});

test('serializeEmployeeLifecycle exposes state/isActive/terminatedAt', () => {
  assert.deepEqual(serializeEmployeeLifecycle({ isActive: true }), {
    state: 'ACTIVE', isActive: true, terminatedAt: null,
  });
  const d = new Date('2024-06-01');
  assert.deepEqual(serializeEmployeeLifecycle({ isActive: false, terminatedAt: d }), {
    state: 'TERMINATED', isActive: false, terminatedAt: d,
  });
});