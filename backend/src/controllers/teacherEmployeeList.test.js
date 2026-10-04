// backend/src/controllers/teacherEmployeeList.test.js
// ============================================================
// Root-cause regression tests for the empty Teacher Employees page.
//
// THE BUG: an Employee is created when a Worker accepts an offer. Hires accepted
// BEFORE that hook shipped (or while a stale server build was running) have a
// Hire and a My Hires row but NO Employee document, so /teacher-employees
// rendered the empty state even though the Worker had been hired.
//
// THE FIX: GET /api/employees self-heals the caller's OWN hires through the same
// idempotent ensureEmployeeForHire(), then lists the owner-scoped employees.
//
// Everything is in-memory: Prisma, the employee model and the doctor_employees
// "database" are stubbed. No real database is read or written.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import DoctorEmployee from '../models/DoctorEmployee.js';
import { getEmployees, __setEmployeeDataSources } from './employeeController.js';
import { isEmployeeOwnerRole } from '../services/employeeService.js';

const TEACHER = 'teacher-1';
const OTHER_TEACHER = 'teacher-2';
const DOCTOR = 'doctor-1';

let rows = [];

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (payload) => { res.body = payload; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  return res;
};

const matches = (row, query = {}) => {
  if (query._id && String(row._id) !== String(query._id)) return false;
  if (query.isActive !== undefined && row.isActive !== query.isActive) return false;
  if (query.ownerUserId !== undefined && row.ownerUserId !== query.ownerUserId) return false;
  if (query.$or) {
    return query.$or.some((cond) => {
      // The legacy branch must be checked first: its ownerUserId is an operator.
      if (cond.ownerUserId && cond.ownerUserId.$exists === false) {
        const legacy = row.ownerUserId === null || row.ownerUserId === undefined;
        return legacy && String(row.doctorId) === String(cond.doctorId);
      }
      if (cond.ownerUserId !== undefined) return row.ownerUserId === cond.ownerUserId;
      return false;
    });
  }
  return true;
};

/**
 * Install an in-memory world: the caller's own hires, the employee collection
 * and a faithful re-implementation of the real creation guards (owner role must
 * be TEACHER/DOCTOR, the worker profile must resolve, and idempotency by
 * owner+hire then owner+worker).
 */
const install = ({ hires = [], employees = [], roles = {} } = {}) => {
  rows = employees.map((e) => ({ ...e }));
  const created = [];

  const prisma = {
    hire: {
      findMany: async ({ where }) =>
        hires.filter((h) => String(h.employerId) === String(where.employerId)),
    },
  };

  __setEmployeeDataSources({
    prisma,
    ensureEmployeeForHire: async ({ hire }) => {
      const ownerRole = String(roles[String(hire.employerId)] || '').toUpperCase();
      if (!isEmployeeOwnerRole(ownerRole)) return { created: false, reason: 'role_not_supported' };
      const profile = hires.find((h) => String(h.workerId) === String(hire.workerId))?.profile;
      if (!profile?.userId) return { created: false, reason: 'worker_not_found' };
      if (rows.find((r) => r.ownerUserId === hire.employerId && r.hireId === hire.id)) {
        return { created: false, reason: 'already_recorded' };
      }
      if (rows.find((r) => r.ownerUserId === hire.employerId && r.workerUserId === profile.userId)) {
        return { created: false, reason: 'already_employee' };
      }
      const row = {
        _id: `emp-${hire.id}`,
        ownerUserId: String(hire.employerId),
        ownerRole,
        hireId: String(hire.id),
        workerUserId: profile.userId,
        salary: hire.agreedSalary,
        currency: hire.compensationCurrency || 'EGP',
        startDate: new Date('2026-01-01'),
        isActive: true,
        terminatedAt: null,
      };
      rows.push(row);
      created.push(row);
      return { created: true, reason: 'recorded', employee: row };
    },
  });

  const saved = DoctorEmployee.find;
  DoctorEmployee.find = (query = {}) => ({
    sort: async () => rows.filter((r) => matches(r, query)),
  });

  return { created, restore: () => { DoctorEmployee.find = saved; } };
};

const stubSources = () =>
  __setEmployeeDataSources({
    prisma: { hire: { findMany: async () => [] } },
    ensureEmployeeForHire: async () => ({ created: false, reason: 'stubbed' }),
  });

const list = async (userId, extra = {}) => {
  const res = makeRes();
  await getEmployees({ userId, query: extra.query || {}, body: extra.body }, res);
  return res;
};
const teacherHire = {
  id: 'h1', employerId: TEACHER, workerId: 'wp1', agreedSalary: 5000, compensationCurrency: 'EGP',
  profile: { id: 'wp1', userId: 'worker-user-1' },
};

test('1. A Teacher-owned Employee is returned by GET /api/employees', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' }, hires: [teacherHire] });
  try {
    const res = await list(TEACHER);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.employees[0].ownerUserId, TEACHER);
    assert.equal(res.body.employees[0].ownerRole, 'TEACHER');
    assert.equal(res.body.employees[0].salary, 5000);
  } finally { world.restore(); }
});

test('2. A Doctor-owned Employee is NOT returned to a Teacher', async () => {
  const world = install({
    roles: { [TEACHER]: 'TEACHER', [DOCTOR]: 'DOCTOR' },
    employees: [{ _id: 'emp-doc', ownerUserId: DOCTOR, ownerRole: 'DOCTOR', salary: 9000, isActive: true }],
  });
  try {
    const res = await list(TEACHER);
    assert.equal(res.body.count, 0, 'a teacher must never see a doctor employee');
  } finally { world.restore(); }
});

test('3. A Teacher-owned Employee is NOT returned to a Doctor', async () => {
  const world = install({
    roles: { [TEACHER]: 'TEACHER', [DOCTOR]: 'DOCTOR' },
    employees: [{ _id: 'emp-tch', ownerUserId: TEACHER, ownerRole: 'TEACHER', salary: 5000, isActive: true }],
  });
  try {
    const res = await list(DOCTOR);
    assert.equal(res.body.count, 0, 'a doctor must never see a teacher employee');
  } finally { world.restore(); }
});

test('4. Ownership comes from the authenticated user, never from the request', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' }, hires: [teacherHire] });
  try {
    // A hostile client sending someone else's owner id must not change anything.
    const res = await list(TEACHER, { query: { ownerUserId: OTHER_TEACHER }, body: { ownerUserId: OTHER_TEACHER } });
    assert.equal(res.body.count, 1);
    assert.equal(res.body.employees[0].ownerUserId, TEACHER, 'always the authenticated owner');
  } finally { world.restore(); }
});

test('5. Legacy DoctorEmployee records (doctorId only) stay accessible to their Doctor', async () => {
  const world = install({
    roles: { [DOCTOR]: 'DOCTOR' },
    employees: [{ _id: 'legacy-1', doctorId: DOCTOR, salary: 8000, isActive: true }],
  });
  try {
    const res = await list(DOCTOR);
    assert.equal(res.body.count, 1, 'the legacy doctorId fallback must still work');
    assert.equal(res.body.employees[0]._id, 'legacy-1');
  } finally { world.restore(); }
});

test('6. THE BUG: a hire that never produced an Employee is healed on read', async () => {
  // The exact reported scenario: the hire exists, no employee record does.
  const world = install({ roles: { [TEACHER]: 'TEACHER' }, hires: [teacherHire], employees: [] });
  try {
    assert.equal(rows.length, 0, 'precondition: no employee exists');
    const res = await list(TEACHER);
    assert.equal(res.body.count, 1, 'the missing employee is reconciled and returned');
    assert.equal(world.created.length, 1);
    assert.equal(world.created[0].ownerUserId, TEACHER);
    assert.equal(world.created[0].ownerRole, 'TEACHER');
    assert.equal(world.created[0].hireId, 'h1');
  } finally { world.restore(); }
});

test('7. Reconciliation never creates a DUPLICATE employee', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' }, hires: [teacherHire] });
  try {
    await list(TEACHER);
    await list(TEACHER);
    await list(TEACHER);
    assert.equal(rows.length, 1, 'repeated reads must not multiply the employee');
    assert.equal(world.created.length, 1, 'only the first read creates it');
  } finally { world.restore(); }
});

test('8. Only TEACHER/DOCTOR hires are reconciled (EMPLOYER accounting untouched)', async () => {
  const world = install({
    roles: { 'employer-1': 'EMPLOYER' },
    hires: [{
      id: 'h-emp', employerId: 'employer-1', workerId: 'wp1', agreedSalary: 1000,
      profile: { id: 'wp1', userId: 'worker-user-9' },
    }],
  });
  try {
    await list('employer-1');
    assert.equal(rows.length, 0, 'no employer employee system may be created');
  } finally { world.restore(); }
});

test('9. A failing reconciliation never breaks the list response', async () => {
  const saved = DoctorEmployee.find;
  rows = [{ _id: 'emp-x', ownerUserId: TEACHER, ownerRole: 'TEACHER', salary: 1, isActive: true }];
  DoctorEmployee.find = (query = {}) => ({ sort: async () => rows.filter((r) => matches(r, query)) });
  __setEmployeeDataSources({
    prisma: { hire: { findMany: async () => { throw new Error('db down'); } } },
    ensureEmployeeForHire: async () => ({ created: false }),
  });
  try {
    const res = await list(TEACHER);
    assert.equal(res.statusCode, 200, 'a bookkeeping failure must not fail the page');
    assert.equal(res.body.count, 1);
  } finally {
    DoctorEmployee.find = saved;
    stubSources();
  }
});