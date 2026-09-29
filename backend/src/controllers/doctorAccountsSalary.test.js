// backend/src/controllers/doctorAccountsSalary.test.js
// ============================================================
// DOCTOR ACCOUNTS — FIXED MONTHLY SALARY RULE
// ============================================================
// An employee's `salary` is a FIXED MONTHLY amount. It is the figure earned for
// EACH eligible calendar month and is NEVER prorated by elapsed or calendar
// days:
//
//   gross = salary x eligibleMonths
//
// This file locks that rule down at the HTTP boundary, using the project's
// standard mocked-model pattern: a real Express app mounts the real
// `doctorAccounts` router (so real routing, auth and validation all run) while
// the Mongoose models are replaced with in-memory stores.
//
// NO DATABASE CONNECTION IS EVER OPENED — the production Atlas URI in .env is
// never read, and no document is ever created, updated or deleted.
//
// Behaviours asserted here that MUST NOT regress:
//   * one full month of salary per eligible calendar month, including a partial
//     or single-day month and a period spanning two months;
//   * `startDate` is a MONTH eligibility boundary, never a prorating fraction;
//   * ADVANCE and PENALTY reduce NET only and never change gross;
//   * net salary is floored at zero;
//   * FIFO advance ordering (adjustmentDate -> createdAt -> _id) is intact;
//   * the salary-period endpoint and the summary agree on gross salary.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorEmployee from '../models/DoctorEmployee.js';
import DoctorEmployeeAdjustment from '../models/DoctorEmployeeAdjustment.js';
import DoctorIncome from '../models/DoctorIncome.js';
import DoctorExpense from '../models/DoctorExpense.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorSalarySettlement from '../models/DoctorSalarySettlement.js';
import ClinicPatient from '../models/ClinicPatient.js';
import doctorAccountsRouter from '../routes/doctorAccounts.js';

const secret = 'doctor-accounts-fixed-salary-test-secret-2026';
process.env.JWT_SECRET = secret;

const DOCTOR_ID = '507f1f77bcf86cd7994390a0';
const EMP_ID = '507f1f77bcf86cd7994390a2';
const SALARY = 8000;

const doctorAuth = () => ({
  authorization: `Bearer ${jwt.sign({ userId: DOCTOR_ID, role: 'DOCTOR', tokenVersion: 0 }, secret, { expiresIn: '1h' })}`,
  'content-type': 'application/json'
});

// A UTC date helper, so every boundary in these tests is timezone-proof.
const D = (y, m, d) => new Date(Date.UTC(y, m, d));

// ---------------- In-memory stores (no database) ----------------
let employees = [];
let adjustments = [];
let settlements = [];
let seq = 10;
const oid = () => `507f1f77bcf86cd799439b${String(seq++).padStart(2, '0')}`;

const wrapQuery = (doc) => ({
  select: () => wrapQuery(doc),
  session: () => wrapQuery(doc),
  sort: () => wrapQuery(doc),
  limit: () => wrapQuery(doc),
  populate: () => wrapQuery(doc),
  lean: () => Promise.resolve(doc),
  then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject)
});

User.findById = (id) => wrapQuery({
  _id: String(id), fullName: 'Dr Test', role: 'DOCTOR', tokenVersion: 0, isSuspended: false
});

DoctorEmployee.find = (filter = {}) => {
  const list = employees.filter((e) =>
    (!filter.doctorId || String(e.doctorId) === String(filter.doctorId)) &&
    (!filter.isActive || e.isActive === filter.isActive)
  );
  return { select: () => wrapQuery(list), then: (r, j) => Promise.resolve(list).then(r, j) };
};
DoctorEmployee.findOne = (filter) => {
  const match = employees.find((e) =>
    (!filter._id || String(e._id) === String(filter._id)) &&
    (!filter.doctorId || String(e.doctorId) === String(filter.doctorId))
  );
  return wrapQuery(match || null);
};

const matchAdjustments = (f = {}) => adjustments.filter((a) => {
  if (f._id && String(a._id) !== String(f._id)) return false;
  if (f.doctorId && String(a.doctorId) !== String(f.doctorId)) return false;
  if (f.employeeId && String(a.employeeId) !== String(f.employeeId)) return false;
  if (f.type) {
    const want = f.type.$in ? f.type.$in : [f.type];
    if (!want.includes(a.type)) return false;
  }
  const d = f.adjustmentDate;
  if (d) {
    const t = new Date(a.adjustmentDate).getTime();
    if (d.$gte && t < new Date(d.$gte).getTime()) return false;
    if (d.$lte && t > new Date(d.$lte).getTime()) return false;
  }
  return true;
});

DoctorEmployeeAdjustment.find = (f = {}) => {
  const chain = {};
  chain.select = () => chain;
  chain.session = () => chain;
  chain.sort = () => chain;
  chain.populate = () => chain;
  chain.lean = () => Promise.resolve(matchAdjustments(f));
  chain.then = (r, j) => Promise.resolve(matchAdjustments(f)).then(r, j);
  return chain;
};
// Mirrors the real $expr guards so the advance invariants are genuinely exercised.
DoctorEmployeeAdjustment.findOneAndUpdate = async (f, pipeline) => {
  const a = matchAdjustments(f)[0];
  if (!a) return null;
  if (f.$expr) {
    if (f.$expr.$add) {
      if (a.deductedAmount + f.$expr.$add[1] > a.amount) return null;
    } else if (f.$expr.$gte) {
      if (a.deductedAmount - f.$expr.$gte[1] < 0) return null;
    }
  }
  const set = pipeline[0].$set;
  if (set.deductedAmount.$add) {
    a.deductedAmount += set.deductedAmount.$add[1];
    a.status = a.deductedAmount >= a.amount ? 'SETTLED' : 'PARTIALLY_SETTLED';
  } else {
    a.deductedAmount -= set.deductedAmount.$subtract[1];
    a.status = a.deductedAmount <= 0 ? 'PENDING' : (a.deductedAmount >= a.amount ? 'SETTLED' : 'PARTIALLY_SETTLED');
  }
  return { ...a };
};

const matchSettlements = (f = {}) => settlements.filter((s) =>
  (!f._id || String(s._id) === String(f._id)) &&
  (!f.doctorId || String(s.doctorId) === String(f.doctorId)) &&
  (!f.employeeId || String(s.employeeId) === String(f.employeeId)) &&
  (!f.status || s.status === f.status)
);

DoctorSalarySettlement.exists = async (f) => matchSettlements(f).length > 0;
DoctorSalarySettlement.find = (f = {}) => {
  const chain = {};
  chain.select = () => chain;
  chain.sort = () => chain;
  chain.lean = () => Promise.resolve(matchSettlements(f));
  chain.then = (r, j) => Promise.resolve(matchSettlements(f)).then(r, j);
  return chain;
};
DoctorSalarySettlement.findOne = (f) => wrapQuery(matchSettlements(f)[0] || null);
DoctorSalarySettlement.create = async (arr) => {
  const doc = { _id: oid(), ...arr[0] };
  // The partial unique index constrains SETTLED rows only.
  const dup = settlements.find((s) =>
    s.doctorId === doc.doctorId && s.employeeId === doc.employeeId &&
    s.status === 'SETTLED' &&
    new Date(s.periodFrom).getTime() === new Date(doc.periodFrom).getTime() &&
    new Date(s.periodTo).getTime() === new Date(doc.periodTo).getTime()
  );
  if (dup) { const e = new Error('E11000 duplicate key'); e.code = 11000; throw e; }
  settlements.push(doc);
  return [doc];
};
DoctorSalarySettlement.findOneAndUpdate = async (f, update) => {
  const s = matchSettlements(f)[0];
  if (!s) return null;
  Object.assign(s, update.$set);
  return { ...s };
};

// Money lists and dashboard counters are irrelevant here but must not crash.
const emptyAggregate = () => Promise.resolve([]);
DoctorIncome.aggregate = emptyAggregate;
DoctorIncome.countDocuments = async () => 0;
DoctorIncome.distinct = async () => [];
DoctorExpense.aggregate = emptyAggregate;
DoctorExpense.countDocuments = async () => 0;
DoctorExpense.distinct = async () => [];
DoctorAppointment.distinct = async () => [];
DoctorAppointment.countDocuments = async () => 0;
ClinicPatient.countDocuments = async () => 0;
ClinicPatient.distinct = async () => [];

mongoose.startSession = async () => ({
  withTransaction: async (fn) => fn(),
  endSession: async () => {}
});

const app = express();
app.use(express.json());
app.use('/api/doctor-accounts', doctorAccountsRouter);
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}/api/doctor-accounts`;
test.after(() => server.close());

const req = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, options);
  let body = null;
  try { body = await res.json(); } catch (_) { body = null; }
  return { status: res.status, body };
};

/** Reset every store and install one active employee with the given start date. */
const seedEmployee = (startDate) => {
  employees = [{
    _id: EMP_ID, doctorId: DOCTOR_ID, fullName: 'Nurse Test', jobTitle: 'Nurse',
    salary: SALARY, currency: 'EGP', startDate, isActive: true
  }];
  adjustments = [];
  settlements = [];
  adjSeq = 0;
};

let adjSeq = 0;
const addAdjustment = ({ type = 'ADVANCE', amount, date, currency = 'EGP' }) => {
  const record = {
    _id: oid(), doctorId: DOCTOR_ID, employeeId: EMP_ID, type, amount, currency,
    // Distinct createdAt ordering per record, so FIFO tie-breaks are exercised.
    adjustmentDate: date,
    createdAt: new Date(date.getTime() + (adjSeq++ * 1000)),
    deductedAmount: 0, status: 'PENDING',
    reason: type === 'PENALTY' ? 'Test penalty' : 'Test advance', notes: ''
  };
  adjustments.push(record);
  return record;
};

const period = async (from, to) => {
  const res = await req(`/employees/${EMP_ID}/salary-period?from=${from}&to=${to}`, { headers: doctorAuth() });
  assert.equal(res.status, 200, `salary-period ${from}..${to} should succeed`);
  return res.body.salaryPeriod;
};

const summaryFor = async (from, to) => {
  const res = await req(`/summary?from=${from}&to=${to}`, { headers: doctorAuth() });
  assert.equal(res.status, 200, `summary ${from}..${to} should succeed`);
  return res.body.summary;
};

const settle = (from, to) => req(`/employees/${EMP_ID}/settlements`, {
  method: 'POST', headers: doctorAuth(), body: JSON.stringify({ from, to, notes: '' })
});

// Sep 2026 is the reference month; the employee predates it.
const sep = (d) => D(2026, 8, d);
const oct = (d) => D(2026, 9, d);
const aug = (d) => D(2026, 7, d);
const fmt = (d) => d.toISOString().slice(0, 10);

test('FIXED MONTHLY SALARY: gross is never prorated by elapsed days', async (t) => {
  // A start date long before the period, so nothing here is limited by start.
  seedEmployee(D(2020, 0, 1));

  await t.test('1. Sep 1 -> Sep 29 (month not finished) = 8,000', async () => {
    const p = await period(fmt(sep(1)), fmt(sep(29)));
    assert.equal(p.grossSalary, 8000);
    assert.equal(p.netSalary, 8000);
  });

  await t.test('2. Sep 1 -> Sep 30 (complete month) = 8,000', async () => {
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000);
  });

  await t.test('3. Sep 15 -> Oct 15 (two months touched) = 16,000', async () => {
    const p = await period(fmt(sep(15)), fmt(oct(15)));
    assert.equal(p.grossSalary, 16000);
  });

  await t.test('4. Sep 29 -> Sep 29 (single day) = 8,000, not a 1/30 fraction', async () => {
    const p = await period(fmt(sep(29)), fmt(sep(29)));
    assert.equal(p.grossSalary, 8000);
  });

  await t.test('5. the old day-based result (7,733.33) can never reappear', async () => {
    const p = await period(fmt(sep(1)), fmt(sep(29)));
    assert.notEqual(p.grossSalary, 7733.33);
    assert.equal(p.grossSalary, Math.round(p.grossSalary * 100) / 100);
  });
});

test('START DATE is a month eligibility boundary, never a prorating fraction', async (t) => {
  await t.test('starting Sep 15: August = 0, September = 8,000, October = 8,000', async () => {
    seedEmployee(sep(15));

    const august = await period(fmt(aug(1)), fmt(aug(31)));
    assert.equal(august.grossSalary, 0, 'a month entirely before the start month earns nothing');

    const september = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(september.grossSalary, 8000, 'the start month earns the FULL salary, not 16/30');

    const october = await period(fmt(oct(1)), fmt(oct(31)));
    assert.equal(october.grossSalary, 8000);
  });

  await t.test('a period spanning the start month counts only eligible months', async () => {
    seedEmployee(sep(15));
    // Aug 1 -> Oct 31 touches three months, but August is before the start month.
    const p = await period(fmt(aug(1)), fmt(oct(31)));
    assert.equal(p.grossSalary, 16000, 'September + October only');
  });
});

test('ADJUSTMENTS affect net salary only and never change gross', async (t) => {
  await t.test('6. an advance reduces net but not gross', async () => {
    seedEmployee(D(2020, 0, 1));
    addAdjustment({ type: 'ADVANCE', amount: 2000, date: sep(10) });
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000, 'gross must be untouched by an advance');
    assert.equal(p.advanceDeduction, 2000);
    assert.equal(p.netSalary, 6000);
  });

  await t.test('7. a penalty reduces net but not gross', async () => {
    seedEmployee(D(2020, 0, 1));
    addAdjustment({ type: 'PENALTY', amount: 500, date: sep(10) });
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000, 'gross must be untouched by a penalty');
    assert.equal(p.penaltyDeduction, 500);
    assert.equal(p.netSalary, 7500);
  });

  await t.test('8. advance + penalty together still leave gross at 8,000', async () => {
    seedEmployee(D(2020, 0, 1));
    addAdjustment({ type: 'ADVANCE', amount: 1000, date: sep(5) });
    addAdjustment({ type: 'PENALTY', amount: 750, date: sep(20) });
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000);
    assert.equal(p.advanceDeduction, 1000);
    assert.equal(p.penaltyDeduction, 750);
    assert.equal(p.netSalary, 6250);
  });

  await t.test('9. net salary is floored at zero and never negative', async () => {
    seedEmployee(D(2020, 0, 1));
    addAdjustment({ type: 'ADVANCE', amount: 99999, date: sep(5) });
    addAdjustment({ type: 'PENALTY', amount: 99999, date: sep(6) });
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000);
    assert.equal(p.netSalary, 0);
    assert.ok(p.netSalary >= 0);
  });

  await t.test('10. FIFO advance ordering survives the fixed-salary change', async () => {
    seedEmployee(D(2020, 0, 1));
    // Two advances totalling 12,000 against an 8,000 gross: FIFO decides the ORDER
    // in which they are consumed, and the older one is fully recovered first.
    addAdjustment({ type: 'ADVANCE', amount: 6000, date: sep(3) });
    addAdjustment({ type: 'ADVANCE', amount: 6000, date: sep(12) });
    const p = await period(fmt(sep(1)), fmt(sep(30)));
    assert.equal(p.grossSalary, 8000);
    assert.equal(p.advanceLines.length, 2);
    assert.equal(String(p.advanceLines[0].adjustmentId), String(adjustments[0]._id), 'older advance is first');
    assert.equal(p.advanceLines[0].applied, 6000, 'the older advance is recovered in full first');
    assert.equal(p.advanceLines[1].applied, 2000, 'the newer advance then takes only what remains');
    assert.equal(p.advanceDeduction, 8000, 'deductions are capped at the gross');
    assert.equal(p.advanceOutstandingAfter, 4000, 'the unrecovered balance carries forward');
    assert.equal(p.netSalary, 0);
  });
});

test('SUMMARY and SALARY PERIOD agree on the fixed monthly gross', async (t) => {
  await t.test('summary salary expense = 8,000 for Sep 1 -> Sep 29', async () => {
    seedEmployee(D(2020, 0, 1));
    const s = await summaryFor(fmt(sep(1)), fmt(sep(29)));
    assert.equal(s.salaryExpense.EGP, 8000);
    assert.equal(s.totalExpenses.EGP, 8000, 'no other expenses exist, so total = salary');
    assert.equal(s.netBalance.EGP, -8000);
  });

  await t.test('summary agrees with the salary-period endpoint for every case', async () => {
    for (const [from, to] of [
      [sep(1), sep(29)], [sep(1), sep(30)], [sep(15), oct(15)], [sep(29), sep(29)]
    ]) {
      seedEmployee(D(2020, 0, 1));
      const p = await period(fmt(from), fmt(to));
      const s = await summaryFor(fmt(from), fmt(to));
      assert.equal(s.salaryExpense.EGP, p.grossSalary, `summary must match ${fmt(from)}..${fmt(to)}`);
    }
  });

  await t.test('summary honours the start-month boundary', async () => {
    seedEmployee(sep(15));
    const s = await summaryFor(fmt(aug(1)), fmt(aug(31)));
    assert.equal(s.salaryExpense.EGP, undefined, 'August is before the start month: no salary');
  });
});

test('SETTLEMENT snapshots the fixed monthly gross, not a prorated one', async (t) => {
  await t.test('a period settled before month end records the full month', async () => {
    seedEmployee(D(2020, 0, 1));
    addAdjustment({ type: 'ADVANCE', amount: 1000, date: sep(10) });
    const res = await settle(fmt(sep(1)), fmt(sep(29)));
    assert.equal(res.status, 201);
    const s = res.body.settlement;
    assert.equal(s.status, 'SETTLED');
    assert.equal(s.grossSalary, 8000, 'settlement must snapshot the fixed monthly salary');
    assert.equal(s.advanceDeduction, 1000);
    assert.equal(s.netSalary, 7000);
  });

  await t.test('a duplicate settlement of the same period is rejected', async () => {
    const res = await settle(fmt(sep(1)), fmt(sep(29)));
    assert.equal(res.status, 409);
  });

  await t.test('reversal restores the advance and frees the period for re-settlement', async () => {
    // Self-contained: settle, reverse, then re-settle the SAME period.
    seedEmployee(D(2020, 0, 1));
    const advance = addAdjustment({ type: 'ADVANCE', amount: 1000, date: sep(10) });

    const first = await settle(fmt(sep(1)), fmt(sep(29)));
    assert.equal(first.status, 201);
    const id = first.body.settlement._id;
    assert.equal(advance.deductedAmount, 1000, 'settling recovers the advance');

    const rev = await req(`/employees/${EMP_ID}/settlements/${id}/reversal`, {
      method: 'POST', headers: doctorAuth(), body: JSON.stringify({})
    });
    assert.equal(rev.status, 201);
    assert.equal(rev.body.settlement.status, 'REVERSED');
    assert.equal(rev.body.settlement.grossSalary, 8000, 'the snapshot is frozen, not re-priced');
    assert.equal(advance.deductedAmount, 0, 'reversal restores the advance');

    const again = await settle(fmt(sep(1)), fmt(sep(29)));
    assert.equal(again.status, 201, 'a REVERSED period can be settled again');
    assert.equal(again.body.settlement.grossSalary, 8000, 'the replacement uses the fixed monthly salary');
  });
});
