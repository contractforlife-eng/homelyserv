// backend/src/controllers/employeeController.test.js
// ============================================================
// Role-aware Employees controller: salary editing + ownership isolation.
// DoctorEmployee statics are stubbed in memory - no database is touched.
// Run: node --test src/controllers/employeeController.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import DoctorEmployee from '../models/DoctorEmployee.js';
import {
  getEmployees,
  updateEmployeeSalary,
  __setEmployeeDataSources,
} from './employeeController.js';

// The list endpoint self-heals missing employees from the caller's own hires.
// Point that at an empty, in-memory source so no test can read or write a real
// database row.
__setEmployeeDataSources({
  prisma: { hire: { findMany: async () => [] } },
  ensureEmployeeForHire: async () => ({ created: false, reason: 'stubbed' }),
});

const TEACHER_A = 'teacher-a';
const TEACHER_B = 'teacher-b';
const DOCTOR_A = 'doctor-a';

const seedRows = () => ([
  { _id: 'emp-ta', ownerUserId: TEACHER_A, ownerRole: 'TEACHER', hireId: 'h1', workerUserId: 'w1', salary: 5000, currency: 'EGP', isActive: true },
  { _id: 'emp-tb', ownerUserId: TEACHER_B, ownerRole: 'TEACHER', hireId: 'h2', workerUserId: 'w2', salary: 4000, currency: 'EGP', isActive: true },
  { _id: 'emp-da', ownerUserId: DOCTOR_A, ownerRole: 'DOCTOR', doctorId: DOCTOR_A, hireId: 'h3', workerUserId: 'w3', salary: 8000, currency: 'EGP', isActive: true },
  // Legacy doctor record: no ownerUserId, only the historical doctorId key.
  { _id: 'emp-legacy', doctorId: DOCTOR_A, salary: 8000, currency: 'EGP', isActive: true },
]);

let rows = [];
let lastUpdate = null;

const matches = (row, query = {}) => {
  if (query._id && String(row._id) !== String(query._id)) return false;
  if (query.isActive !== undefined && row.isActive !== query.isActive) return false;
  if (query.$or) {
    return query.$or.some((cond) => {
      // The legacy branch must be evaluated FIRST: its `ownerUserId` is an
      // operator object ({$exists:false}), not a plain value.
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

const install = () => {
  rows = seedRows();
  lastUpdate = null;
  const saved = {
    find: DoctorEmployee.find,
    findOne: DoctorEmployee.findOne,
    findOneAndUpdate: DoctorEmployee.findOneAndUpdate,
  };
  DoctorEmployee.find = (query = {}) => ({
    sort: async () => rows.filter((row) => matches(row, query)),
  });
  DoctorEmployee.findOne = async (query = {}) =>
    rows.find((row) => matches(row, query)) || null;
  DoctorEmployee.findOneAndUpdate = async (query = {}, update = {}) => {
    lastUpdate = { query, update };
    const row = rows.find((r) => matches(r, query));
    if (!row) return null;
    Object.assign(row, update.$set || {});
    return row;
  };
  return () => {
    DoctorEmployee.find = saved.find;
    DoctorEmployee.findOne = saved.findOne;
    DoctorEmployee.findOneAndUpdate = saved.findOneAndUpdate;
  };
};

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (payload) => { res.body = payload; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  return res;
};

const asUser = async (handler, userId, { params = {}, body = {}, query = {} } = {}) => {
  const restore = install();
  try {
    const res = makeRes();
    await handler({ userId, params, body, query }, res);
    return { res, getRows: () => rows, getLastUpdate: () => lastUpdate };
  } finally {
    restore();
  }
};

// ---------------------------------------------------------------
// D / E. Salary update succeeds for the owner
// ---------------------------------------------------------------
test('D. Teacher updates the salary of their OWN employee', async () => {
  const { res, getRows } = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-ta' },
    body: { salary: 5500 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.employee.salary, 5500);
  assert.equal(getRows().find((r) => r._id === 'emp-ta').salary, 5500);
});

test('E. Doctor updates the salary of their OWN employee', async () => {
  const { res } = await asUser(updateEmployeeSalary, DOCTOR_A, {
    params: { id: 'emp-da' },
    body: { salary: '8200' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.employee.salary, 8200);
});

// ---------------------------------------------------------------
// F. Unauthorized salary updates always fail
// ---------------------------------------------------------------
test('F. Teacher cannot edit another Teacher employee', async () => {
  const { res, getRows } = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-tb' },
    body: { salary: 1 },
  });
  assert.equal(res.statusCode, 404);
  assert.equal(getRows().find((r) => r._id === 'emp-tb').salary, 4000);
});

test('F2. Doctor cannot edit another Doctor employee', async () => {
  const own = await asUser(updateEmployeeSalary, DOCTOR_A, {
    params: { id: 'emp-da' },
    body: { salary: 1 },
  });
  assert.equal(own.res.statusCode, 200);

  const cross = await asUser(updateEmployeeSalary, 'doctor-b', {
    params: { id: 'emp-da' },
    body: { salary: 1 },
  });
  assert.equal(cross.res.statusCode, 404);
});

test('F3. Teacher cannot edit a Doctor employee and vice versa', async () => {
  const teacherOnDoctor = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-da' },
    body: { salary: 1 },
  });
  assert.equal(teacherOnDoctor.res.statusCode, 404);

  const doctorOnTeacher = await asUser(updateEmployeeSalary, DOCTOR_A, {
    params: { id: 'emp-ta' },
    body: { salary: 1 },
  });
  assert.equal(doctorOnTeacher.res.statusCode, 404);
});
// ---------------------------------------------------------------
// G. Listing isolation
// ---------------------------------------------------------------
test('G. Each owner lists only their own employees', async () => {
  const teacher = await asUser(getEmployees, TEACHER_A);
  assert.deepEqual(teacher.res.body.employees.map((e) => e._id), ['emp-ta']);

  const teacherB = await asUser(getEmployees, TEACHER_B);
  assert.deepEqual(teacherB.res.body.employees.map((e) => e._id), ['emp-tb']);

  // The doctor sees their own new record AND the legacy doctorId-only record.
  const doctor = await asUser(getEmployees, DOCTOR_A);
  assert.deepEqual(doctor.res.body.employees.map((e) => e._id).sort(), ['emp-da', 'emp-legacy']);
});

// ---------------------------------------------------------------
// Salary validation reuses the existing Employee rules
// ---------------------------------------------------------------
test('Salary validation reuses the existing 0..1000000 numeric rule', async () => {
  for (const salary of ['', null, undefined, 'abc', -1, 1000001]) {
    const { res } = await asUser(updateEmployeeSalary, TEACHER_A, {
      params: { id: 'emp-ta' },
      body: { salary },
    });
    assert.equal(res.statusCode, 400, `salary=${salary}`);
  }
  const ok = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-ta' },
    body: { salary: 0 },
  });
  assert.equal(ok.res.statusCode, 200);
  assert.equal(ok.res.body.employee.salary, 0);
});

// ---------------------------------------------------------------
// K. Salary separation: only `salary` is written
// ---------------------------------------------------------------
test('K. Updating salary writes ONLY salary (no hire/payment/expense fields)', async () => {
  const { getLastUpdate } = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-ta' },
    body: { salary: 6000, totalDue: 1, commission: 2, paymentAmount: 3, expenseId: 'x' },
  });
  const { update } = getLastUpdate();
  assert.deepEqual(Object.keys(update.$set), ['salary']);
  assert.equal(update.$set.salary, 6000);
});

test('K2. Salary editing never touches the hire, payment or expense collections', async () => {
  // Only the employee document is written; no prisma hire/payment access is
  // performed by the salary path at all.
  const { getRows, getLastUpdate } = await asUser(updateEmployeeSalary, TEACHER_A, {
    params: { id: 'emp-ta' },
    body: { salary: 6400 },
  });
  const row = getRows().find((r) => r._id === 'emp-ta');
  assert.equal(row.salary, 6400);
  assert.equal(row.hireId, 'h1');          // hire linkage untouched
  assert.equal(row.totalDue, undefined);   // no commission field on the employee
  assert.equal(getLastUpdate().query._id, 'emp-ta');
});