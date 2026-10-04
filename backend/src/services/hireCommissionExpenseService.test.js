// backend/src/services/hireCommissionExpenseService.test.js
// ============================================================
// Focused tests: completed HomelyServ Worker-hire commission ->
// ONE expense in the existing Teacher/Doctor Accounts ledgers.
//
// Fully dependency-injected (fake prisma + fake expense models), so no
// database is touched and the rules are verified deterministically.
// Run: node --test src/services/hireCommissionExpenseService.test.js
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordHireCommissionExpense,
  buildCommissionExpenseReference,
  shouldRecordCommissionExpenseForRole,
  resolveCommissionExpenseAmount,
  resolveCommissionExpenseCurrency,
  COMMISSION_EXPENSE_CATEGORY,
} from './hireCommissionExpenseService.js';

const TEACHER_ID = 'teacher-1';
const DOCTOR_ID = 'doctor-1';
const OTHER_ID = 'other-1';

// totalDue = 15 (the HomelyServ commission actually charged).
// agreedSalary = 100 (the Worker's salary - must NEVER become the expense).
const hire = (overrides = {}) => ({
  id: 'hire-1',
  employerId: TEACHER_ID,
  workerId: 'wp-1',
  jobTitle: 'Tutor',
  totalDue: 15,
  agreedSalary: 100,
  compensationCurrency: 'EGP',
  paymentStatus: 'completed',
  ...overrides,
});

const payment = (overrides = {}) => ({
  id: 'pay-1',
  transactionId: 'txn-1',
  amount: 15,
  currency: 'EGP',
  status: 'completed',
  completedAt: new Date('2026-05-01T00:00:00.000Z'),
  ...overrides,
});

// In-memory stand-in for the existing Mongoose expense models.
const makeExpenseModel = () => {
  const rows = [];
  return {
    rows,
    findOne: async (query = {}) => {
      const tenant = query.doctorId || query.teacherId;
      const tenantField = query.doctorId ? 'doctorId' : 'teacherId';
      const matcher = query.notes instanceof RegExp
        ? (value) => query.notes.test(value)
        : (value) => value === query.notes;
      return rows.find((row) => row[tenantField] === tenant && matcher(row.notes)) || null;
    },
    create: async (doc) => {
      const row = { ...doc };
      rows.push(row);
      return row;
    },
  };
};

// Minimal stand-in for the prisma client surface the service uses.
const makePrisma = (roles = {}) => ({
  user: {
    findUnique: async ({ where }) => (roles[where.id] ? { id: where.id, role: roles[where.id] } : null),
  },
});

const run = (overrides = {}, { roles = { [TEACHER_ID]: 'TEACHER' }, hireFixture, paymentFixture } = {}) => {
  const teacherExpenseModel = makeExpenseModel();
  const doctorExpenseModel = makeExpenseModel();
  return recordHireCommissionExpense({
    hire: hireFixture || hire(),
    payment: paymentFixture || payment(),
    prismaClient: makePrisma(roles),
    teacherExpenseModel,
    doctorExpenseModel,
    ...overrides,
  }).then((result) => ({ result, teacherExpenseModel, doctorExpenseModel }));
};
// ---------------------------------------------------------------
// A. Teacher: a completed commission creates exactly one Expense
// ---------------------------------------------------------------
test('A. Teacher completed Worker-hire commission creates exactly one Teacher expense', async () => {
  const { result, teacherExpenseModel, doctorExpenseModel } = await run();

  assert.equal(result.created, true);
  assert.equal(teacherExpenseModel.rows.length, 1);
  assert.equal(doctorExpenseModel.rows.length, 0);

  const [row] = teacherExpenseModel.rows;
  assert.equal(row.teacherId, TEACHER_ID);
  assert.equal(row.category, COMMISSION_EXPENSE_CATEGORY);
  assert.equal(row.description, 'HomelyServ recruitment commission for a Worker hire (Tutor)');
});

// ---------------------------------------------------------------
// B. Doctor: a completed commission creates exactly one Expense
// ---------------------------------------------------------------
test('B. Doctor completed Worker-hire commission creates exactly one Doctor expense', async () => {
  const { result, teacherExpenseModel, doctorExpenseModel } = await run(
    {},
    { roles: { [DOCTOR_ID]: 'DOCTOR' }, hireFixture: hire({ employerId: DOCTOR_ID }) },
  );

  assert.equal(result.created, true);
  assert.equal(doctorExpenseModel.rows.length, 1);
  assert.equal(teacherExpenseModel.rows.length, 0);
  assert.equal(doctorExpenseModel.rows[0].doctorId, DOCTOR_ID);
});

// ---------------------------------------------------------------
// C. Amount authority: the commission paid to HomelyServ, never the
//    Worker's salary and never a client/request value.
// ---------------------------------------------------------------
test('C. Expense amount is the authoritative commission paid, never the Worker salary', async () => {
  const { result, teacherExpenseModel } = await run();
  assert.equal(result.created, true);
  assert.equal(teacherExpenseModel.rows[0].amount, 15);
  assert.notEqual(teacherExpenseModel.rows[0].amount, 100); // hire.agreedSalary
});

test('C2. Amount prefers the completed payment and falls back to the Hire totalDue', () => {
  assert.equal(resolveCommissionExpenseAmount({ amount: 7 }, hire({ totalDue: 42 })), 7);
  assert.equal(resolveCommissionExpenseAmount({ amount: 0 }, hire({ totalDue: 42 })), 42);
  assert.equal(resolveCommissionExpenseAmount({}, hire({ totalDue: 42 })), 42);
  assert.equal(resolveCommissionExpenseAmount({}, hire({ totalDue: 0 })), null);
});

// ---------------------------------------------------------------
// D. Currency comes from the canonical payment/Hire currency
// ---------------------------------------------------------------
test('D. Expense currency matches the authoritative payment currency', async () => {
  const { teacherExpenseModel } = await run({}, { paymentFixture: payment({ amount: 9, currency: 'usd' }) });
  assert.equal(teacherExpenseModel.rows[0].currency, 'USD');
});

test('D2. Currency falls back to the Hire currency, then EGP', () => {
  assert.equal(resolveCommissionExpenseCurrency({ currency: 'EUR' }, hire()), 'EUR');
  assert.equal(resolveCommissionExpenseCurrency({}, hire({ compensationCurrency: 'GBP' })), 'GBP');
  assert.equal(resolveCommissionExpenseCurrency({}, hire({ compensationCurrency: null })), 'EGP');
});
// ---------------------------------------------------------------
// E. Idempotency - repeated completion creates exactly one expense
// ---------------------------------------------------------------
test('E. Running the completion path twice creates exactly ONE expense', async () => {
  const teacherExpenseModel = makeExpenseModel();
  const doctorExpenseModel = makeExpenseModel();
  const prismaClient = makePrisma({ [TEACHER_ID]: 'TEACHER' });

  const invoke = () => recordHireCommissionExpense({
    hire: hire(),
    payment: payment(),
    prismaClient,
    teacherExpenseModel,
    doctorExpenseModel,
  });

  const first = await invoke();
  const second = await invoke();
  const third = await invoke();

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.reason, 'already_recorded');
  assert.equal(third.created, false);
  assert.equal(teacherExpenseModel.rows.length, 1);
});

test('E2. The reference token is stable per hire and stored in notes', async () => {
  const { teacherExpenseModel } = await run();
  const notes = teacherExpenseModel.rows[0].notes;
  assert.ok(notes.startsWith(buildCommissionExpenseReference('hire-1')));
  assert.ok(notes.includes('hire-1'));
  assert.ok(notes.includes('txn-1'));
});

// ---------------------------------------------------------------
// F. No expense for incomplete payment states
// ---------------------------------------------------------------
test('F. No expense is created for any non-completed payment state', async () => {
  const states = ['pending', 'created', 'awaiting_verification', 'failed', 'cancelled', '', null, undefined];
  for (const paymentStatus of states) {
    const { result, teacherExpenseModel } = await run({}, { hireFixture: hire({ paymentStatus }) });
    assert.equal(result.created, false, `paymentStatus=${paymentStatus}`);
    assert.equal(result.reason, 'payment_not_completed');
    assert.equal(teacherExpenseModel.rows.length, 0);
  }
});

// ---------------------------------------------------------------
// G. Ownership: the tenant always comes from the authoritative hire
// ---------------------------------------------------------------
test('G. Expense is owned by the hire employerId, never by another user', async () => {
  const { result, teacherExpenseModel } = await run(
    {},
    { roles: { [OTHER_ID]: 'TEACHER' }, hireFixture: hire({ employerId: OTHER_ID }) },
  );
  assert.equal(result.created, true);
  assert.equal(teacherExpenseModel.rows[0].teacherId, OTHER_ID);
  assert.notEqual(teacherExpenseModel.rows[0].teacherId, TEACHER_ID);
});

// ---------------------------------------------------------------
// H. Employer regression: EMPLOYER accounting behaviour unchanged
// ---------------------------------------------------------------
test('H. EMPLOYER payment creates NO Teacher/Doctor expense (unchanged)', async () => {
  const { result, teacherExpenseModel, doctorExpenseModel } = await run(
    {},
    { roles: { [TEACHER_ID]: 'EMPLOYER' } },
  );
  assert.equal(result.created, false);
  assert.equal(result.reason, 'role_not_supported');
  assert.equal(teacherExpenseModel.rows.length, 0);
  assert.equal(doctorExpenseModel.rows.length, 0);
});

// ---------------------------------------------------------------
// I. No other role can produce a Teacher/Doctor hire expense
// ---------------------------------------------------------------
test('I. Only TEACHER and DOCTOR are supported roles', () => {
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
    assert.equal(shouldRecordCommissionExpenseForRole(role), false, role);
  }
  assert.equal(shouldRecordCommissionExpenseForRole('TEACHER'), true);
  assert.equal(shouldRecordCommissionExpenseForRole('DOCTOR'), true);
});

test('I2. WORKER/STUDENT/ADMIN/SUPPORT/SUPPORT_HELPER hires record nothing', async () => {
  for (const role of ['WORKER', 'STUDENT', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
    const { result, teacherExpenseModel } = await run({}, { roles: { [TEACHER_ID]: role } });
    assert.equal(result.created, false, role);
    assert.equal(result.reason, 'role_not_supported');
    assert.equal(teacherExpenseModel.rows.length, 0);
  }
});

// ---------------------------------------------------------------
// Robustness guards
// ---------------------------------------------------------------
test('No expense when the hire employer cannot be resolved', async () => {
  const { result, teacherExpenseModel } = await run({}, { roles: {} });
  assert.equal(result.created, false);
  assert.equal(result.reason, 'employer_not_found');
  assert.equal(teacherExpenseModel.rows.length, 0);
});

test('No expense for a missing amount', async () => {
  const { result, teacherExpenseModel } = await run(
    {},
    { hireFixture: hire({ totalDue: 0 }), paymentFixture: payment({ amount: 0 }) },
  );
  assert.equal(result.created, false);
  assert.equal(result.reason, 'invalid_amount');
  assert.equal(teacherExpenseModel.rows.length, 0);
});

test('A failure inside the expense write never propagates', async () => {
  const brokenModel = {
    findOne: async () => null,
    create: async () => { throw new Error('db down'); },
  };
  const result = await recordHireCommissionExpense({
    hire: hire(),
    payment: payment(),
    prismaClient: makePrisma({ [TEACHER_ID]: 'TEACHER' }),
    teacherExpenseModel: brokenModel,
    doctorExpenseModel: makeExpenseModel(),
  });
  assert.equal(result.created, false);
  assert.equal(result.reason, 'error');
});