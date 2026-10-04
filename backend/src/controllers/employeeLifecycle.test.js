// backend/src/controllers/employeeLifecycle.test.js
// ============================================================
// Employee LIFECYCLE (activate / deactivate / terminate).
// Covers ownership isolation, role gating, salary/hire/accounts separation,
// idempotency, termination semantics and legacy doctorId employees.
//
// DoctorEmployee statics are stubbed in memory - no database is touched and no
// real delete/unsafe update call is ever issued.
// Run: node --test src/controllers/employeeLifecycle.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import DoctorEmployee from '../models/DoctorEmployee.js';
import { authorize } from '../middleware/auth.js';
import {
  activateEmployee,
  deactivateEmployee,
  terminateEmployee,
  getEmployees,
  __setEmployeeDataSources,
} from './employeeController.js';
import { isEmployeeOwnerRole } from '../services/employeeService.js';

// Keep the list reconciliation away from the database in these tests.
__setEmployeeDataSources({
  prisma: { hire: { findMany: async () => [] } },
  ensureEmployeeForHire: async () => ({ created: false, reason: 'stubbed' }),
});

const TEACHER_A = 'teacher-a';
const TEACHER_B = 'teacher-b';
const DOCTOR_A = 'doctor-a';
const DOCTOR_B = 'doctor-b';

const seedRows = () => ([
  { _id: 'emp-ta', ownerUserId: TEACHER_A, ownerRole: 'TEACHER', hireId: 'h1', workerUserId: 'w1', salary: 5000, currency: 'EGP', isActive: true, terminatedAt: null },
  { _id: 'emp-tb', ownerUserId: TEACHER_B, ownerRole: 'TEACHER', hireId: 'h2', workerUserId: 'w2', salary: 4000, currency: 'EGP', isActive: true, terminatedAt: null },
  { _id: 'emp-da', ownerUserId: DOCTOR_A, ownerRole: 'DOCTOR', doctorId: DOCTOR_A, hireId: 'h3', workerUserId: 'w3', salary: 8000, currency: 'EGP', isActive: true, terminatedAt: null },
  { _id: 'emp-db', ownerUserId: DOCTOR_B, ownerRole: 'DOCTOR', doctorId: DOCTOR_B, salary: 9000, currency: 'EGP', isActive: true, terminatedAt: null },
  // Legacy doctor record: no ownerUserId, only the historical doctorId key.
  { _id: 'emp-legacy', doctorId: DOCTOR_A, salary: 8000, currency: 'EGP', isActive: true },
]);

let rows = [];
let lastUpdate = null;
let calls = [];

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
  calls = [];
  const saved = {
    findOne: DoctorEmployee.findOne,
    findOneAndUpdate: DoctorEmployee.findOneAndUpdate,
    deleteOne: DoctorEmployee.deleteOne,
    deleteMany: DoctorEmployee.deleteMany,
    findByIdAndDelete: DoctorEmployee.findByIdAndDelete,
    findByIdAndUpdate: DoctorEmployee.findByIdAndUpdate,
  };
  DoctorEmployee.findOne = async (query = {}) => {
    calls.push('findOne');
    return rows.find((row) => matches(row, query)) || null;
  };
  DoctorEmployee.findOneAndUpdate = async (query = {}, update = {}) => {
    calls.push('findOneAndUpdate');
    lastUpdate = { query, update };
    const row = rows.find((r) => matches(r, query));
    if (!row) return null;
    Object.assign(row, update.$set || {});
    return row;
  };
  // Any destructive or ownership-less call is a hard failure for this feature.
  for (const name of ['deleteOne', 'deleteMany', 'findByIdAndDelete', 'findByIdAndUpdate']) {
    DoctorEmployee[name] = async () => {
      calls.push(name);
      throw new Error(`${name} must never be used by the lifecycle`);
    };
  }
  return () => { Object.assign(DoctorEmployee, saved); };
};

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (payload) => { res.body = payload; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  return res;
};

/** Run one lifecycle handler in-memory and expose the resulting rows. */
const asUser = async (handler, userId, { params = {}, body = {} } = {}) => {
  const restore = install();
  try {
    const res = makeRes();
    await handler({ userId, params, body, query: {} }, res);
    return {
      res,
      row: (id) => rows.find((r) => r._id === id),
      getLastUpdate: () => lastUpdate,
      getCalls: () => calls,
    };
  } finally {
    restore();
  }
};

/** Run one lifecycle handler against hand-mutated rows. */
const withRows = async (handler, userId, mutate, params) => {
  const restore = install();
  try {
    mutate(rows);
    const res = makeRes();
    await handler({ userId, params, body: {}, query: {} }, res);
    return { res, row: (id) => rows.find((r) => r._id === id), getCalls: () => calls };
  } finally {
    restore();
  }
};

/**
 * Run a SEQUENCE of lifecycle calls against ONE shared dataset, so idempotency
 * checks see the effect of the previous call (asUser re-seeds every time).
 */
const sequence = async (steps) => {
  const restore = install();
  try {
    const out = [];
    for (const { handler, userId, id, mutate } of steps) {
      if (mutate) mutate(rows);
      const res = makeRes();
      await handler({ userId, params: { id }, body: {}, query: {} }, res);
      // Snapshot eagerly: the row is read NOW, not after later steps ran.
      const snapshot = { ...rows.find((r) => r._id === id) };
      out.push({ res, snapshot, getLastUpdate: () => lastUpdate });
    }
    return out;
  } finally {
    restore();
  }
};

const LIFECYCLE = [activateEmployee, deactivateEmployee, terminateEmployee];
// ---------------------------------------------------------------
// A. Activate
// ---------------------------------------------------------------
test('A1. Teacher activates their OWN inactive employee', async () => {
  const r = await withRows(activateEmployee, TEACHER_A,
    (rs) => { rs.find((x) => x._id === 'emp-ta').isActive = false; },
    { id: 'emp-ta' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.success, true);
  assert.equal(r.res.body.state, 'ACTIVE');
  assert.equal(r.row('emp-ta').isActive, true);
  assert.equal(r.row('emp-ta').terminatedAt, null);
  assert.deepEqual(r.res.body.employee.isActive, true);
});

test('A2. Doctor activates their OWN inactive employee', async () => {
  const r = await withRows(activateEmployee, DOCTOR_A,
    (rs) => { rs.find((x) => x._id === 'emp-da').isActive = false; },
    { id: 'emp-da' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'ACTIVE');
  assert.equal(r.row('emp-da').isActive, true);
});

// ---------------------------------------------------------------
// B. Deactivate
// ---------------------------------------------------------------
test('B1. Teacher deactivates their OWN active employee', async () => {
  const r = await asUser(deactivateEmployee, TEACHER_A, { params: { id: 'emp-ta' } });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'INACTIVE');
  assert.equal(r.row('emp-ta').isActive, false);
  // INACTIVE is NOT terminated - the record stays employable.
  assert.equal(r.row('emp-ta').terminatedAt, null);
});

test('B2. Doctor deactivates their OWN active employee', async () => {
  const r = await asUser(deactivateEmployee, DOCTOR_A, { params: { id: 'emp-da' } });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'INACTIVE');
  assert.equal(r.row('emp-da').isActive, false);
  assert.equal(r.row('emp-da').terminatedAt, null);
});

// ---------------------------------------------------------------
// C. Terminate
// ---------------------------------------------------------------
test('C1. Teacher terminates their OWN employee', async () => {
  const r = await asUser(terminateEmployee, TEACHER_A, { params: { id: 'emp-ta' } });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'TERMINATED');
  assert.equal(r.row('emp-ta').isActive, false);
  assert.ok(r.row('emp-ta').terminatedAt instanceof Date);
});

test('C2. Doctor terminates their OWN employee', async () => {
  const r = await asUser(terminateEmployee, DOCTOR_A, { params: { id: 'emp-da' } });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'TERMINATED');
  assert.ok(r.row('emp-da').terminatedAt instanceof Date);
});

test('C3. An INACTIVE employee can be terminated as well', async () => {
  const r = await withRows(terminateEmployee, TEACHER_A,
    (rs) => { rs.find((x) => x._id === 'emp-ta').isActive = false; },
    { id: 'emp-ta' });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.res.body.state, 'TERMINATED');
  assert.ok(r.row('emp-ta').terminatedAt instanceof Date);
});

test('C4. Termination keeps the record and its history', async () => {
  const r = await asUser(terminateEmployee, TEACHER_A, { params: { id: 'emp-ta' } });
  assert.ok(r.row('emp-ta'), 'the employee row must still exist');
  assert.equal(r.row('emp-ta').salary, 5000);
  assert.equal(r.row('emp-ta').hireId, 'h1');
  assert.equal(r.row('emp-ta').workerUserId, 'w1');
  // No worker/hire/payment/expense object is deleted or created.
  assert.ok(!r.getCalls().includes('deleteOne'));
  assert.ok(!r.getCalls().includes('deleteMany'));
});

// ---------------------------------------------------------------
// D. Ownership isolation
// ---------------------------------------------------------------
test('D1. Teacher cannot modify another Teacher employee', async () => {
  for (const h of LIFECYCLE) {
    const r = await asUser(h, TEACHER_A, { params: { id: 'emp-tb' } });
    assert.equal(r.res.statusCode, 404);
    assert.equal(r.res.body.success, false);
    assert.equal(r.row('emp-tb').isActive, true);
    assert.equal(r.row('emp-tb').terminatedAt ?? null, null);
    assert.ok(!r.getCalls().includes('findOneAndUpdate'), 'must not write');
  }
});

test('D2. Doctor cannot modify another Doctor employee', async () => {
  for (const h of LIFECYCLE) {
    const r = await asUser(h, DOCTOR_A, { params: { id: 'emp-db' } });
    assert.equal(r.res.statusCode, 404);
    assert.equal(r.row('emp-db').isActive, true);
    assert.ok(!r.getCalls().includes('findOneAndUpdate'));
  }
});

test('D3. Teacher cannot modify a Doctor employee and vice versa', async () => {
  const t = await asUser(terminateEmployee, TEACHER_A, { params: { id: 'emp-da' } });
  assert.equal(t.res.statusCode, 404);
  assert.equal(t.row('emp-da').isActive, true);
  assert.ok(!t.getCalls().includes('findOneAndUpdate'));

  const d = await asUser(terminateEmployee, DOCTOR_A, { params: { id: 'emp-ta' } });
  assert.equal(d.res.statusCode, 404);
  assert.equal(d.row('emp-ta').isActive, true);
  assert.ok(!d.getCalls().includes('findOneAndUpdate'));
});

test('D4. A forged owner id in the body is never trusted', async () => {
  const r = await asUser(terminateEmployee, TEACHER_B, {
    params: { id: 'emp-ta' },
    body: { ownerUserId: TEACHER_B, doctorId: TEACHER_B, isActive: true },
  });
  assert.equal(r.res.statusCode, 404);
  assert.equal(r.row('emp-ta').isActive, true);
  assert.ok(!r.getCalls().includes('findOneAndUpdate'));
});

// ---------------------------------------------------------------
// E. Role security
// ---------------------------------------------------------------
test('E1. Only TEACHER and DOCTOR pass the employees route gate', () => {
  const gate = authorize(['TEACHER', 'DOCTOR']);
  const rejected = ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER', 'EMPLOYER'];
  for (const role of rejected) {
    let payload = null;
    let code = 200;
    const res = { json: (p) => { payload = p; return res; }, status: (c) => { code = c; return res; } };
    let nexted = false;
    gate({ userRole: role }, res, () => { nexted = true; });
    assert.equal(nexted, false, `${role} must be rejected`);
    assert.equal(code, 403);
    assert.equal(payload.success, false);
  }
  for (const role of ['TEACHER', 'DOCTOR']) {
    let nexted = false;
    const res = { json: () => res, status: () => res };
    gate({ userRole: role }, res, () => { nexted = true; });
    assert.equal(nexted, true, `${role} must be allowed`);
  }
});

test('E2. No role other than Teacher/Doctor gains employee ownership', () => {
  assert.equal(isEmployeeOwnerRole('TEACHER'), true);
  assert.equal(isEmployeeOwnerRole('DOCTOR'), true);
  // Employer behavior is unchanged: it is not granted this capability.
  assert.equal(isEmployeeOwnerRole('EMPLOYER'), false);
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
    assert.equal(isEmployeeOwnerRole(role), false);
  }
});

// ---------------------------------------------------------------
// F / G / H. Salary, hire and accounts separation
// ---------------------------------------------------------------
test('F. No lifecycle call modifies the salary', async () => {
  for (const h of LIFECYCLE) {
    const r = await asUser(h, TEACHER_A, { params: { id: 'emp-ta' } });
    assert.equal(r.row('emp-ta').salary, 5000);
    assert.equal(r.row('emp-ta').currency, 'EGP');
    for (const key of Object.keys(r.getLastUpdate().update.$set)) {
      assert.ok(['isActive', 'terminatedAt'].includes(key), `must not write ${key}`);
    }
  }
});

test('G. No lifecycle call modifies hire, payment or commission data', async () => {
  for (const h of LIFECYCLE) {
    const r = await asUser(h, DOCTOR_A, { params: { id: 'emp-da' } });
    const row = r.row('emp-da');
    // The hire link and agreed employment salary stay intact.
    assert.equal(row.hireId, 'h3');
    assert.equal(row.workerUserId, 'w3');
    assert.equal(row.salary, 8000);
    for (const key of Object.keys(r.getLastUpdate().update.$set)) {
      assert.ok(['isActive', 'terminatedAt'].includes(key));
    }
  }
});

test('H. The lifecycle writes once and creates no side effects', async () => {
  for (const h of LIFECYCLE) {
    const r = await asUser(h, TEACHER_A, { params: { id: 'emp-ta' } });
    const c = r.getCalls();
    for (const unsafe of ['deleteOne', 'deleteMany', 'findByIdAndDelete', 'findByIdAndUpdate']) {
      assert.ok(!c.includes(unsafe), `${unsafe} must never be used`);
    }
    // Exactly one scoped write: no duplicate history/payment/expense creation.
    assert.equal(c.filter((x) => x === 'findOneAndUpdate').length, 1);
    assert.ok(r.row('emp-ta'));
  }
});

// ---------------------------------------------------------------
// I / J. Idempotency and termination semantics
// ---------------------------------------------------------------
test('I1. Repeating deactivate / activate is a safe no-op', async () => {
  const [first, second, up, upAgain] = await sequence([
    { handler: deactivateEmployee, userId: TEACHER_A, id: 'emp-ta' },
    { handler: deactivateEmployee, userId: TEACHER_A, id: 'emp-ta' },
    { handler: activateEmployee, userId: TEACHER_A, id: 'emp-ta' },
    { handler: activateEmployee, userId: TEACHER_A, id: 'emp-ta' },
  ]);

  assert.equal(first.res.body.changed, true);
  assert.equal(second.res.statusCode, 200);
  assert.equal(second.res.body.changed, false, 'repeat deactivate is a no-op');
  assert.equal(second.res.body.state, 'INACTIVE');
  assert.equal(second.snapshot.isActive, false);
  assert.equal(second.snapshot.terminatedAt, null, 'a no-op deactivate never terminates');

  assert.equal(up.res.body.state, 'ACTIVE');
  assert.equal(up.snapshot.isActive, true);
  assert.equal(upAgain.res.body.changed, false, 'repeat activate is a no-op');
  assert.equal(upAgain.res.body.state, 'ACTIVE');
  assert.equal(upAgain.snapshot.isActive, true);
});

test('J1. Repeated terminate keeps the ORIGINAL timestamp', async () => {
  const [first, second] = await sequence([
    { handler: terminateEmployee, userId: TEACHER_A, id: 'emp-ta' },
    { handler: terminateEmployee, userId: TEACHER_A, id: 'emp-ta' },
  ]);

  assert.equal(first.res.statusCode, 200);
  assert.equal(first.res.body.changed, true);
  const original = first.snapshot.terminatedAt;
  assert.ok(original instanceof Date);

  assert.equal(second.res.statusCode, 200);
  assert.equal(second.res.body.changed, false);
  assert.equal(second.res.body.state, 'TERMINATED');
  // Same instant preserved, never overwritten.
  assert.equal(second.snapshot.terminatedAt.getTime(), original.getTime());
  assert.equal(second.snapshot.isActive, false);
  // The repeat write carries no terminatedAt at all.
  assert.deepEqual(second.getLastUpdate().update, { $set: { isActive: false } });
});

test('J2. A terminated employee cannot be reactivated or deactivated', async () => {
  const mutate = (rs) => {
    const row = rs.find((x) => x._id === 'emp-ta');
    row.isActive = false;
    row.terminatedAt = new Date('2024-01-01');
  };
  for (const h of [activateEmployee, deactivateEmployee]) {
    const r = await withRows(h, TEACHER_A, mutate, { id: 'emp-ta' });
    assert.equal(r.res.statusCode, 400);
    assert.equal(r.res.body.success, false);
    assert.equal(r.res.body.code, 'employee_terminated');
    // Historical termination preserved and nothing written.
    assert.equal(r.row('emp-ta').terminatedAt.getTime(), new Date('2024-01-01').getTime());
    assert.ok(!r.getCalls().includes('findOneAndUpdate'));
  }
});

// ---------------------------------------------------------------
// K. Legacy doctorId employees (no ownerUserId)
// ---------------------------------------------------------------
test('K. Legacy doctorId employee can be activated, deactivated and terminated', async () => {
  const act = await asUser(activateEmployee, DOCTOR_A, { params: { id: 'emp-legacy' } });
  assert.equal(act.res.statusCode, 200);
  assert.equal(act.row('emp-legacy').isActive, true);

  const deact = await asUser(deactivateEmployee, DOCTOR_A, { params: { id: 'emp-legacy' } });
  assert.equal(deact.res.statusCode, 200);
  assert.equal(deact.row('emp-legacy').isActive, false);

  const term = await asUser(terminateEmployee, DOCTOR_A, { params: { id: 'emp-legacy' } });
  assert.equal(term.res.statusCode, 200);
  assert.equal(term.res.body.state, 'TERMINATED');
  assert.ok(term.row('emp-legacy').terminatedAt instanceof Date);
  // History kept untouched; no backfill or migration is required.
  assert.equal(term.row('emp-legacy').salary, 8000);
  assert.equal(term.row('emp-legacy').ownerUserId, undefined);
});

test('K2. A legacy employee stays private to its own doctor', async () => {
  const r = await asUser(terminateEmployee, DOCTOR_B, { params: { id: 'emp-legacy' } });
  assert.equal(r.res.statusCode, 404);
  assert.ok(!r.getCalls().includes('findOneAndUpdate'));
});

test('L. Employer regression: Employer gains no employee lifecycle access', async () => {
  // Employer is not an employee-owner role and is not routed here, so Employer
  // behavior (hires/workers) is exactly as before - with no lifecycle access.
  assert.equal(isEmployeeOwnerRole('EMPLOYER'), false);
  const r = await asUser(terminateEmployee, 'employer-1', { params: { id: 'emp-ta' } });
  assert.equal(r.res.statusCode, 404);
  assert.equal(r.row('emp-ta').isActive, true);
  assert.ok(!r.getCalls().includes('findOneAndUpdate'));
});