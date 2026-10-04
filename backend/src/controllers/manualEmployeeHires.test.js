// backend/src/controllers/manualEmployeeHires.test.js
// ============================================================
// Manual Hires: the Teacher/Doctor "My Hires" view must show employees added
// DIRECTLY, alongside the canonical HomelyServ hires.
//
// BOUNDARY UNDER TEST: a manual employee is an EMPLOYMENT record only. It must
// never become a HomelyServ Hire - no Offer, no acceptance, no payment, no 15%
// commission and no commission Expense.
//
// Everything is in-memory. No database is read or written.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import DoctorEmployee from '../models/DoctorEmployee.js';
import {
  createEmployee,
  getEmployees,
  __setEmployeeDataSources,
} from './employeeController.js';
import { resolveEmployeeSource, EMPLOYEE_SOURCES } from '../services/employeeService.js';

const TEACHER = 'teacher-1';
const TEACHER_2 = 'teacher-2';
const DOCTOR = 'doctor-1';
const DOCTOR_2 = 'doctor-2';

const VALID = {
  fullName: 'Manual Staff',
  jobTitle: 'Assistant',
  salary: 4000,
  currency: 'EGP',
  startDate: '2026-01-15',
  notes: 'added directly',
};

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (p) => { res.body = p; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  return res;
};

const matches = (row, query = {}) => {
  if (query._id && String(row._id) !== String(query._id)) return false;
  if (query.$or) {
    return query.$or.some((cond) => {
      // Legacy branch first: its ownerUserId is an operator, not a value.
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

let rows = [];
let created = [];
let hireTouches = 0;

const install = ({ employees = [], roles = {} } = {}) => {
  rows = employees.map((e) => ({ ...e }));
  created = [];
  hireTouches = 0;

  __setEmployeeDataSources({
    prisma: {
      hire: { findMany: async () => { hireTouches += 1; return []; } },
      user: { findUnique: async ({ where }) => ({ id: where.id, role: roles[where.id] }) },
    },
    ensureEmployeeForHire: async () => { hireTouches += 1; return { created: false, reason: 'none' }; },
  });

  const saved = { find: DoctorEmployee.find, create: DoctorEmployee.create };
  DoctorEmployee.create = async (doc) => {
    const row = { _id: `emp-${created.length + 1}`, ...doc };
    rows.push(row);
    created.push(row);
    return row;
  };
  DoctorEmployee.find = (query = {}) => ({ sort: async () => rows.filter((r) => matches(r, query)) });

  return { created, restore: () => Object.assign(DoctorEmployee, saved) };
};

const stubSources = () =>
  __setEmployeeDataSources({
    prisma: { hire: { findMany: async () => [] }, user: { findUnique: async () => null } },
    ensureEmployeeForHire: async () => ({ created: false, reason: 'stubbed' }),
  });

stubSources();

const list = async (userId) => {
  const res = makeRes();
  await getEmployees({ userId, query: {} }, res);
  return res;
};

// ---------------------------------------------------------------
// Source classification (derived, never stored)
// ---------------------------------------------------------------
test('1. An employee with a hireId is classified HOMELYSERV', () => {
  assert.equal(resolveEmployeeSource({ hireId: 'hire-1' }), EMPLOYEE_SOURCES.HOMELYSERV);
});

test('2. An employee without a hireId is classified MANUAL', () => {
  assert.equal(resolveEmployeeSource({ hireId: null }), EMPLOYEE_SOURCES.MANUAL);
  assert.equal(resolveEmployeeSource({ hireId: undefined }), EMPLOYEE_SOURCES.MANUAL);
  assert.equal(resolveEmployeeSource({ hireId: '' }), EMPLOYEE_SOURCES.MANUAL);
  // Legacy DoctorEmployee records are genuinely manual staff.
  assert.equal(resolveEmployeeSource({ doctorId: 'doc-1' }), EMPLOYEE_SOURCES.MANUAL);
});

// ---------------------------------------------------------------
// Creation
// ---------------------------------------------------------------
test('3. A Teacher can add a manual employee, owned by the authenticated user', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' } });
  try {
    const res = makeRes();
    await createEmployee({ userId: TEACHER, body: VALID }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.source, EMPLOYEE_SOURCES.MANUAL);
    const row = res.body.employee;
    assert.equal(row.ownerUserId, TEACHER);
    assert.equal(row.ownerRole, 'TEACHER');
    assert.equal(row.hireId, undefined, 'no hireId => MANUAL source');
    assert.equal(row.salary, 4000);
    assert.equal(row.isActive, true);
    assert.equal(row.terminatedAt, undefined);
  } finally { world.restore(); }
});

test('4. A Doctor manual employee also carries the legacy doctorId key', async () => {
  const world = install({ roles: { [DOCTOR]: 'DOCTOR' } });
  try {
    const res = makeRes();
    await createEmployee({ userId: DOCTOR, body: VALID }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.employee.doctorId, DOCTOR);
    assert.equal(res.body.employee.ownerRole, 'DOCTOR');
  } finally { world.restore(); }
});

test('5. Ownership is never taken from the request body', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' } });
  try {
    const res = makeRes();
    await createEmployee({
      userId: TEACHER,
      body: { ...VALID, ownerUserId: TEACHER_2, doctorId: TEACHER_2, ownerRole: 'DOCTOR' },
    }, res);
    assert.equal(res.body.employee.ownerUserId, TEACHER, 'always the authenticated user');
    assert.equal(res.body.employee.ownerRole, 'TEACHER', 'role comes from the database');
  } finally { world.restore(); }
});

test('6. Creating a manual employee touches NO Hire and NO payment', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' } });
  try {
    const before = hireTouches;
    const res = makeRes();
    await createEmployee({ userId: TEACHER, body: VALID }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(hireTouches, before, 'no hire read/write during manual creation');
    assert.equal(world.created.length, 1, 'exactly one employee document');
  } finally { world.restore(); }
});

// ---------------------------------------------------------------
// Validation and role gating
// ---------------------------------------------------------------
test('7. Manual employees are validated exactly like existing employees', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' } });
  try {
    const cases = [
      [{ ...VALID, fullName: '' }, 'Full name is required'],
      [{ ...VALID, salary: '' }, 'Salary is required'],
      [{ ...VALID, salary: -1 }, 'Salary must be a number between 0 and 1000000'],
      [{ ...VALID, salary: 1000001 }, 'Salary must be a number between 0 and 1000000'],
      [{ ...VALID, startDate: '' }, 'Start date is required'],
      [{ ...VALID, startDate: 'not-a-date' }, 'Start date must be a valid date'],
      [{ ...VALID, isActive: 'yes' }, 'isActive must be a boolean'],
    ];
    for (const [body, message] of cases) {
      const res = makeRes();
      await createEmployee({ userId: TEACHER, body }, res);
      assert.equal(res.statusCode, 400, message);
      assert.equal(res.body.message, message);
    }
    assert.equal(created.length, 0, 'no employee is created on invalid input');
  } finally { world.restore(); }
});

test('8. A non-Teacher/Doctor cannot create an employee', async () => {
  const world = install({ roles: { employer: 'EMPLOYER', worker: 'WORKER' } });
  try {
    for (const userId of ['employer', 'worker']) {
      const res = makeRes();
      await createEmployee({ userId, body: VALID }, res);
      assert.equal(res.statusCode, 403);
    }
    assert.equal(created.length, 0);
  } finally { world.restore(); }
});

// ---------------------------------------------------------------
// My Hires listing / isolation
// ---------------------------------------------------------------
test('9. A Teacher manual employee appears in the Teacher My Hires data', async () => {
  const world = install({
    roles: { [TEACHER]: 'TEACHER' },
    employees: [
      { _id: 'm1', ownerUserId: TEACHER, ownerRole: 'TEACHER', fullName: 'Manual A', salary: 1000, isActive: true, hireId: null },
      { _id: 'h1', ownerUserId: TEACHER, ownerRole: 'TEACHER', fullName: 'HomelyServ A', salary: 2000, isActive: true, hireId: 'hire-1' },
    ],
  });
  try {
    const res = await list(TEACHER);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.employees.find((e) => e._id === 'm1').source, 'MANUAL');
    assert.equal(res.body.employees.find((e) => e._id === 'h1').source, 'HOMELYSERV');
  } finally { world.restore(); }
});

test('10-13. Manual employees stay strictly owner-scoped', async () => {
  const world = install({
    roles: { [TEACHER]: 'TEACHER', [TEACHER_2]: 'TEACHER', [DOCTOR]: 'DOCTOR', [DOCTOR_2]: 'DOCTOR' },
    employees: [
      { _id: 'mT1', ownerUserId: TEACHER, ownerRole: 'TEACHER', hireId: null, isActive: true },
      { _id: 'mT2', ownerUserId: TEACHER_2, ownerRole: 'TEACHER', hireId: null, isActive: true },
      { _id: 'mD1', ownerUserId: DOCTOR, ownerRole: 'DOCTOR', hireId: null, isActive: true },
      { _id: 'mD2', ownerUserId: DOCTOR_2, ownerRole: 'DOCTOR', hireId: null, isActive: true },
    ],
  });
  try {
    const ids = async (userId) => (await list(userId)).body.employees.map((e) => e._id);
    assert.deepEqual(await ids(TEACHER), ['mT1']);
    assert.deepEqual(await ids(TEACHER_2), ['mT2']);
    assert.deepEqual(await ids(DOCTOR), ['mD1']);
    assert.deepEqual(await ids(DOCTOR_2), ['mD2']);
  } finally { world.restore(); }
});

test('14. Legacy DoctorEmployee records remain accessible to their Doctor', async () => {
  const world = install({
    roles: { [DOCTOR]: 'DOCTOR' },
    employees: [{ _id: 'legacy', doctorId: DOCTOR, fullName: 'Old Staff', isActive: true }],
  });
  try {
    const res = await list(DOCTOR);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.employees[0].source, 'MANUAL');
  } finally { world.restore(); }
});

test('15. Repeated reads never create a duplicate manual employee', async () => {
  const world = install({ roles: { [TEACHER]: 'TEACHER' } });
  try {
    const res = makeRes();
    await createEmployee({ userId: TEACHER, body: VALID }, res);
    await list(TEACHER);
    await list(TEACHER);
    await list(TEACHER);
    assert.equal(created.length, 1, 'only the explicit create wrote a row');
    assert.equal(rows.length, 1);
  } finally { world.restore(); }
});

test('16. A manual employee uses the EXISTING lifecycle and stays MANUAL', async () => {
  const world = install({
    roles: { [TEACHER]: 'TEACHER' },
    employees: [{ _id: 'm1', ownerUserId: TEACHER, ownerRole: 'TEACHER', hireId: null, isActive: true }],
  });
  try {
    const res = await list(TEACHER);
    const manual = res.body.employees[0];
    assert.equal(manual.source, 'MANUAL');
    assert.equal(manual.isActive, true);
    assert.equal(manual.terminatedAt, undefined);
  } finally { world.restore(); }
});