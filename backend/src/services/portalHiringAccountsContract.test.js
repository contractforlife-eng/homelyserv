// backend/src/services/portalHiringAccountsContract.test.js
// ============================================================
// Cross-cutting tests for the four Teacher/Doctor hiring fixes:
//
//   1. My Hires payment button resolves to REAL translated text.
//   2. Payment Options uses the caller's own portal theme (Teacher/Doctor red,
//      Employer/Worker unchanged).
//   3. An ACTIVE employee exposes the End Employment (terminate) control, and
//      termination stays ownership-safe and lifecycle-only.
//   4. Employee salaries are visible per portal, and the HomelyServ recruitment
//      commission expense remains visible in the Accounts Expenses lists.
//
// There is no frontend test runner in this project, so the UI contracts are
// asserted against the real source files, while the REAL translation modules are
// imported so "the key resolves in all six locales" is checked against actual
// values rather than a grep.
//
// No database is touched: TeacherExpense / DoctorExpense statics are stubbed.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import TeacherExpense from '../models/TeacherExpense.js';
import TeacherIncome from '../models/TeacherIncome.js';
import DoctorExpense from '../models/DoctorExpense.js';
import DoctorEmployee from '../models/DoctorEmployee.js';
import { getTeacherExpenses, getTeacherAccountsSummary } from '../controllers/teacherAccountsController.js';
import { getDoctorExpenses } from '../controllers/doctorAccountsController.js';
import { buildCommissionExpenseReference } from './hireCommissionExpenseService.js';
import { resolveEmployeeLifecycleState } from './employeeService.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, '../../../frontend/src');
const read = (relative) => fs.readFileSync(path.join(FRONTEND, relative), 'utf8');

const PORTAL_HIRES = read('pages/PortalHires.jsx');
const PAYMENT_OPTIONS = read('pages/PaymentOptions.jsx');
const EMPLOYEES_PAGE = read('pages/Employees.jsx');
const TEACHER_ACCOUNTS = read('pages/TeacherAccounts.jsx');
const DOCTOR_ACCOUNTS = read('pages/DoctorAccounts.jsx');
const SALARY_LIST = read('components/accounts/EmployeeSalaryList.jsx');
const I18N_INDEX = read('i18n/index.js');

const LOCALES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

/** Source with comments stripped, so assertions test real code, not prose. */
const codeOnly = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

// The translation modules are plain ESM, so the REAL values can be imported.
// (pathToFileURL is required: on Windows a bare absolute path is not a valid
// ESM specifier.)
const { DOCTOR_ACCOUNTS_TRANSLATIONS } = await import(
  pathToFileURL(path.join(FRONTEND, 'i18n/doctorAccounts.js')).href
);
const { TEACHER_TRANSLATIONS } = await import(
  pathToFileURL(path.join(FRONTEND, 'i18n/teacherTranslations.js')).href
);

// ---------------------------------------------------------------
// ISSUE 1 - the payment button must resolve to translated text
// ---------------------------------------------------------------
test('Issue 1: Portal Hires uses a Pay key that actually exists, never the missing ones', () => {
  // BOTH `employerPayments.payNow` and `myHiresPage.payNow` are undefined in the
  // real resources - verified by evaluating the resource object at runtime, NOT
  // by a backwards text scan (which previously produced a FALSE PASS here).
  // Comments are stripped so the explanatory note cannot satisfy/fail the check.
  const code = codeOnly(PORTAL_HIRES);
  assert.ok(!code.includes('employerPayments.payNow'));
  assert.ok(!code.includes('myHiresPage.payNow'));
  assert.ok(
    code.includes("t('paymentOptionsPage.payNow')"),
    'the Pay button must use the key that exists in all six locales',
  );
});

test('Issue 1: paymentOptionsPage.payNow is a REAL key in all six locales', () => {
  // Anchored on the paymentOptionsPage block itself, so a payNow belonging to a
  // SIBLING namespace can never satisfy this check.
  const blocks = [];
  const re = /paymentOptionsPage:\{/g;
  let m;
  while ((m = re.exec(I18N_INDEX)) !== null) blocks.push(m.index);
  assert.equal(blocks.length, LOCALES.length, 'one paymentOptionsPage block per locale');

  blocks.forEach((start, i) => {
    const end = blocks[i + 1] ?? I18N_INDEX.length;
    const hit = I18N_INDEX.slice(start, end).match(/\bpayNow:'([^']+)'/);
    assert.ok(hit, `${LOCALES[i]}: paymentOptionsPage.payNow must exist`);
    assert.ok(hit[1].trim().length > 0);
    assert.notEqual(hit[1], 'payNow');
  });
});
// ---------------------------------------------------------------
// ISSUE 2 - role-aware Payment Options theme
// ---------------------------------------------------------------
test('Issue 2: PaymentOptions resolves the accent from the CURRENT role', () => {
  assert.ok(
    PAYMENT_OPTIONS.includes("const accent = portalRole === 'TEACHER' || portalRole === 'DOCTOR'"),
    'the accent must be derived from the authenticated role',
  );
  // The role comes from the auth store, never from the URL or query string.
  assert.ok(PAYMENT_OPTIONS.includes("String(authUser?.role || '').toUpperCase()"));
});

test('Issue 2: the Employer/Worker accent map is an IDENTITY map (appearance unchanged)', () => {
  const block = PAYMENT_OPTIONS.slice(
    PAYMENT_OPTIONS.indexOf('const ACCENT_TOKENS = {'),
    PAYMENT_OPTIONS.indexOf('const PORTAL_RED_ACCENT_TOKENS = {'),
  );
  const entries = [...block.matchAll(/'([^']+)':\s*'([^']+)'/g)];
  assert.ok(entries.length >= 15, 'the teal token map must be populated');
  for (const [, token, value] of entries) {
    assert.equal(token, value, `Employer class "${token}" must map to itself`);
    assert.ok(value.includes('teal'), 'the Employer/Worker appearance stays teal');
  }
});

test('Issue 2: the Teacher/Doctor accent map is the portal red', () => {
  const start = PAYMENT_OPTIONS.indexOf('const PORTAL_RED_ACCENT_TOKENS = {');
  const block = PAYMENT_OPTIONS.slice(start, PAYMENT_OPTIONS.indexOf('};', start));
  const entries = [...block.matchAll(/'([^']+)':\s*'([^']+)'/g)];
  assert.ok(entries.length >= 15);
  for (const [, token, value] of entries) {
    assert.ok(!value.includes('teal'), `Teacher/Doctor must not keep teal: ${value}`);
    assert.ok(value.includes('red'), `Teacher/Doctor must use red: ${value}`);
    assert.ok(token.includes('teal'), 'the red map must cover the same teal token');
  }
});

test('Issue 2: Teacher and Doctor keep their own sidebars, Employer unchanged', () => {
  assert.ok(PAYMENT_OPTIONS.includes("if (portalRole === 'TEACHER') return <TeacherSidebar"));
  assert.ok(PAYMENT_OPTIONS.includes("if (portalRole === 'DOCTOR') return <DoctorSidebar"));
  assert.ok(PAYMENT_OPTIONS.includes('return <EmployerSidebar language={language} {...sharedProps} />;'));
});

test('Issue 2: no raw Employer teal class is left in the Payment Options markup', () => {
  // Every accent colour must flow through `accent[...]`; only the maps and the
  // avatar placeholder brand colour may still mention teal literally.
  const offenders = PAYMENT_OPTIONS.split('\n')
    .map((text, i) => ({ line: i + 1, text }))
    .filter(({ text }) => text.includes('teal'))
    .filter(({ text }) => !text.includes('accent['))
    .filter(({ text }) => !/^\s*'[^']*teal[^']*':/.test(text))
    .filter(({ text }) => !text.trim().startsWith('//'))
    .filter(({ text }) => !text.includes("color: 'teal'"));
  assert.deepEqual(
    offenders.map((o) => `L${o.line}: ${o.text.trim()}`),
    [],
    'every teal accent must be resolved through the role-aware accent map',
  );
});

test('Issue 2: payment behaviour is untouched (providers, commission, API)', () => {
// ---------------------------------------------------------------
// ISSUE 3 - End Employment beside an ACTIVE employee
// ---------------------------------------------------------------
test('Issue 3: an ACTIVE employee is offered the Terminate (End Employment) control', () => {
  // Rendered for every non-terminated employee, i.e. including ACTIVE.
  assert.ok(
    EMPLOYEES_PAGE.includes("lifecycleStateOf(employee) !== 'TERMINATED'"),
    'the terminate control must be offered for ACTIVE and INACTIVE employees',
  );
  assert.ok(EMPLOYEES_PAGE.includes("t('doctorCms.lifecycle.terminate')"));
});

test('Issue 3: Activate is offered for INACTIVE only, never for TERMINATED', () => {
  const at = EMPLOYEES_PAGE.indexOf("=== 'INACTIVE' ?");
  assert.ok(at > 0, 'the activate branch must exist');
  const activateBlock = EMPLOYEES_PAGE.slice(at, at + 400);
  assert.ok(activateBlock.includes("runLifecycle(employee, 'activate')"));
  assert.ok(!activateBlock.includes('TERMINATED'), 'activate must not be offered for TERMINATED');
});

test('Issue 3: termination requires confirmation and uses the existing endpoint', () => {
  assert.ok(EMPLOYEES_PAGE.includes("t('doctorCms.lifecycle.terminateTitle')"));
  assert.ok(EMPLOYEES_PAGE.includes("t('doctorCms.lifecycle.terminateBody')"));
  assert.ok(EMPLOYEES_PAGE.includes("runLifecycle(terminateTarget, 'terminate')"));
  // The SAME canonical service is reused - no duplicate API call.
  assert.ok(EMPLOYEES_PAGE.includes('employeeService.terminateEmployee'));
  // The confirmation copy must state that nothing is deleted and history remains.
  const body = DOCTOR_ACCOUNTS_TRANSLATIONS.en.lifecycle.terminateBody;
  assert.match(body, /NOT be deleted/i);
  assert.match(body, /remain available/i);
});

test('Issue 3: the Employees page resolves keys from the doctorCms namespace', () => {
  // DOCTOR_ACCOUNTS_TRANSLATIONS is merged into `doctorCms` (i18n/index.js), so
  // a `doctorAccounts.*` prefix would render the raw key on screen.
  assert.ok(
    !/doctorAccounts\./.test(EMPLOYEES_PAGE),
    'Employees.jsx must not use the non-existent doctorAccounts namespace',
  );
  assert.ok(EMPLOYEES_PAGE.includes("t('doctorCms."));
});

test('Issue 3: a terminated employee keeps its record and cannot be reactivated', () => {
  assert.equal(
    resolveEmployeeLifecycleState({ isActive: false, terminatedAt: new Date() }),
    'TERMINATED',
  );
  // Doctor Accounts must not offer the Activate toggle for a TERMINATED row.
  assert.ok(DOCTOR_ACCOUNTS.includes("employeeLifecycleState(record) === 'TERMINATED'"));
});
  // Only presentation changed: the providers, the commission constant and every
// ---------------------------------------------------------------
// ISSUE 4A - the commission expense is visible in both Accounts
// ---------------------------------------------------------------
const COMMISSION_EXPENSE = {
  _id: 'exp-commission',
  teacherId: 'teacher-1',
  category: 'OTHER',
  description: 'HomelyServ recruitment commission',
  amount: 750,
  currency: 'EGP',
  expenseDate: new Date('2024-06-01'),
  notes: `${buildCommissionExpenseReference('hire-1')}|payment=txn-1`,
};

/** Minimal in-memory stand-in for the Mongoose list query. */
const installExpenseModel = (model, rows) => {
  const saved = model.find;
  model.find = (filter = {}) => ({
    sort: async () =>
      rows.filter((row) =>
        Object.entries(filter).every(
          ([key, value]) => key.startsWith('$') || row[key] === value,
        ),
      ),
  });
  return () => { model.find = saved; };
};

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.json = (payload) => { res.body = payload; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  return res;
};

test('Issue 4A: the commission expense is listed in Teacher Accounts expenses', async () => {
  const restore = installExpenseModel(TeacherExpense, [COMMISSION_EXPENSE]);
  try {
    const res = makeRes();
    await getTeacherExpenses({ userId: 'teacher-1', query: {} }, res);
    assert.equal(res.statusCode, 200);
    const expenses = res.body.expenses;
    assert.equal(expenses.length, 1, 'exactly one expense - never a duplicate record');
    assert.equal(expenses[0].amount, 750, 'the commission amount is not recalculated');
    assert.equal(expenses[0].category, 'OTHER');
    assert.match(expenses[0].notes, /HOMELYSERV_HIRE_COMMISSION\|hire=hire-1/);
  } finally {
    restore();
  }
});

test('Issue 4A: the commission expense is listed in Doctor Accounts expenses', async () => {
  const row = { ...COMMISSION_EXPENSE, _id: 'exp-commission-d', doctorId: 'doctor-1' };
  delete row.teacherId;
  const restore = installExpenseModel(DoctorExpense, [row]);
  try {
    const res = makeRes();
    await getDoctorExpenses({ userId: 'doctor-1', query: {} }, res);
    assert.equal(res.statusCode, 200);
    const expenses = res.body.expenses;
    assert.equal(expenses.length, 1);
    assert.equal(expenses[0].amount, 750);
    assert.equal(expenses[0].category, 'OTHER');
// ---------------------------------------------------------------
// ISSUE 4B - the Employee Salaries area
// ---------------------------------------------------------------
test('Issue 4B: Teacher Accounts exposes a dedicated Employee Salaries tab', () => {
  assert.ok(TEACHER_ACCOUNTS.includes("setActiveTab('employeeSalaries')"));
  assert.ok(TEACHER_ACCOUNTS.includes("activeTab === 'employeeSalaries'"));
  assert.ok(TEACHER_ACCOUNTS.includes('<EmployeeSalaryList'));
  assert.ok(TEACHER_ACCOUNTS.includes('teacherAccounts.tabs.employeeSalaries'));
});

test('Issue 4B: the salary view is fed by the owner-scoped employees endpoint', () => {
  assert.ok(SALARY_LIST.includes('employeeService.getEmployees()'));
  const code = codeOnly(SALARY_LIST);
  // It must never send an owner id, and it must not filter client-side.
  assert.ok(!/ownerUserId/.test(code));
  assert.ok(!/doctorId/.test(code));
  // Salary comes from the employee document, never from a payment figure.
  assert.ok(code.includes('employee.salary'));
  assert.ok(!/totalDue|commissionAmount|payment\.amount/.test(code));
});

test('Issue 4B: the salary view shows status, salary, currency and start date', () => {
  for (const marker of [
    'copy.salary', 'copy.startDate', 'copy.worker', 'copy.status',
    'employee.currency', 'employee.salary', 'employeeLifecycleState',
  ]) {
    assert.ok(SALARY_LIST.includes(marker), `missing: ${marker}`);
  }
  // The three lifecycle states each resolve to their own copy key.
  assert.ok(SALARY_LIST.includes('copy[`status${'));
  assert.ok(SALARY_LIST.includes('TERMINATED'));
});

test('Issue 4B: Teacher Employee Salaries translations resolve in ALL six locales', () => {
  const required = [
    'title', 'subtitle', 'worker', 'status', 'salary', 'startDate',
    'empty', 'emptyDesc', 'note',
    'statusActive', 'statusInactive', 'statusTerminated',
  ];
  for (const locale of LOCALES) {
    const accounts = TEACHER_TRANSLATIONS[locale]?.teacherAccounts;
    assert.ok(accounts, `${locale}: teacherAccounts missing`);
    assert.ok(accounts.employeeSalaries, `${locale}: employeeSalaries missing`);
    for (const key of required) {
      assert.ok(
        typeof accounts.employeeSalaries[key] === 'string' && accounts.employeeSalaries[key].trim().length > 0,
        `${locale}: teacherAccounts.employeeSalaries.${key} missing`,
      );
    }
    // No state may render a raw key (e.g. a non-existent common.loading).
    for (const key of ['loading', 'loadError']) {
      assert.ok(accounts.employeeSalaries[key], `${locale}: ${key} missing`);
    }
    assert.ok(!SALARY_LIST.includes("t('common."));
    assert.ok(SALARY_LIST.includes('copy.loading'));
    assert.ok(accounts.tabs.employeeSalaries, `${locale}: tabs.employeeSalaries missing`);
    // The note must name the HomelyServ recruitment commission (an untranslated
    // brand token, so this holds in every locale) to keep salary and the
    // commission expense clearly separated.
    assert.match(accounts.employeeSalaries.note, /HomelyServ/);
    assert.match(accounts.employeeSalaries.subtitle, /HomelyServ/);
  }
});

test('Issue 4B: Doctor Employee lifecycle labels resolve in ALL six locales', () => {
  for (const locale of LOCALES) {
    const lifecycle = DOCTOR_ACCOUNTS_TRANSLATIONS[locale]?.lifecycle;
    assert.ok(lifecycle, `${locale}: doctorCms.lifecycle missing`);
    for (const key of [
      'active', 'inactive', 'terminated', 'activate', 'deactivate',
      'terminate', 'terminateTitle', 'terminateBody',
      'terminateConfirm', 'terminateCancel',
    ]) {
      assert.ok(
        typeof lifecycle[key] === 'string' && lifecycle[key].trim().length > 0,
        `${locale}: doctorCms.lifecycle.${key} missing`,
      );
    }
  }
});

test('Issue 4B: no page reads from a non-existent translation namespace', () => {
  // `doctorAccounts` (the Doctor Accounts copy) is merged into `doctorCms`, so
  // a `doctorAccounts.*` lookup would render the raw key.
  assert.ok(!/t\('doctorAccounts\./.test(EMPLOYEES_PAGE));
  assert.ok(!/t\('doctorAccounts\./.test(DOCTOR_ACCOUNTS));
});

// ---------------------------------------------------------------
// Teacher Employees navigation label
// ---------------------------------------------------------------
test('Sidebar: the Employees label resolves to a real translation', () => {
  for (const [name, source] of [
    ['TeacherSidebar', read('components/teacher/TeacherSidebar.jsx')],
    ['DoctorSidebar', read('components/doctor/DoctorSidebar.jsx')],
  ]) {
    assert.ok(
      !source.includes('doctorAccounts.employeesTitle'),
      `${name}: doctorAccounts.employeesTitle does not exist and renders the raw key`,
    );
    assert.ok(source.includes("doctorCms.employeesTitle"), `${name}: must use doctorCms.employeesTitle`);
  }
});

test('Sidebar: employeesTitle exists in ALL six locales', () => {
  for (const locale of LOCALES) {
    const value = DOCTOR_ACCOUNTS_TRANSLATIONS[locale]?.employeesTitle;
    assert.ok(
      typeof value === 'string' && value.trim().length > 0,
      `${locale}: employeesTitle must resolve to real text`,
    );
    assert.notEqual(value, 'employeesTitle');
  }
});

test('Sidebar: the Teacher Employees route is wired to the shared page', () => {
  const app = read('App.jsx');
  assert.ok(app.includes('/teacher-employees'));
  assert.ok(app.includes('/doctor-employees'));
  // Both portals share ONE page - no duplicated Employee list.
  const teacherSidebar = read('components/teacher/TeacherSidebar.jsx');
  assert.ok(teacherSidebar.includes("path: '/teacher-employees'"));
});

test('PortalHires: HomelyServ rows expose the canonical employee lifecycle controls', () => {
  // Matched ONLY through the existing employee.hireId link - never by name,
  // salary, job title or any displayed text.
  assert.ok(PORTAL_HIRES.includes('employeeByHireId'));
  assert.ok(PORTAL_HIRES.includes('employee?.hireId'));
  assert.ok(PORTAL_HIRES.includes('employeeByHireId.get(String(hire.id ?? hire.hireId))'));

  // Reuses the EXISTING handler - no duplicate lifecycle functions.
  for (const bad of ['deactivateHireEmployee', 'terminateHireEmployee', 'deactivatePortalHire', 'terminatePortalHire']) {
    assert.ok(!PORTAL_HIRES.includes(bad), `must not add a duplicate handler: ${bad}`);
  }
  assert.ok(PORTAL_HIRES.includes('const lifecycleActions = (employee) =>'));
  assert.ok(PORTAL_HIRES.includes('{lifecycleActions(employee)}'));
  // Still the one existing handler calling the canonical employee service.
  assert.ok(PORTAL_HIRES.includes('const runManualLifecycle = async (employee, action) =>'));
  for (const call of ['activateEmployee', 'deactivateEmployee', 'terminateEmployee']) {
    assert.ok(PORTAL_HIRES.includes(`employeeService.${call}(employee._id)`), `missing ${call}`);
  }
});

test('PortalHires: lifecycle controls never create an employee or call the create API', () => {
  // My Hires must only READ the existing employee and expose its controls.
  const life = PORTAL_HIRES.slice(PORTAL_HIRES.indexOf('const lifecycleActions'));
  assert.ok(!life.includes('employeeService.createEmployee'));
  assert.ok(!life.includes('POST'));
});

test('PortalHires: Pay Commission rule is preserved', () => {
  // Unpaid -> Pay button; the button disappears once payment is completed.
  assert.ok(PORTAL_HIRES.includes('hireNeedsPayment(hire) ? ('));
  assert.ok(PORTAL_HIRES.includes('onClick={() => handlePay(hire)}'));
  assert.ok(PORTAL_HIRES.includes("t('paymentOptionsPage.payNow')"));
});

test('PortalHires: a TERMINATED employee gets no Activate/Deactivate control', () => {
  const block = PORTAL_HIRES.slice(
    PORTAL_HIRES.indexOf('const lifecycleActions'),
    PORTAL_HIRES.indexOf('// Canonical Hire -> Employee lookup'),
  );
  assert.ok(block.includes("=== 'TERMINATED'"), 'TERMINATED must short-circuit');
  // The terminate button sits after the TERMINATED early-return.
  assert.ok(block.indexOf("=== 'TERMINATED'") < block.indexOf('doctorCms.lifecycle.terminate'));
});

test('Employees page: renders the fetched list and the empty state', () => {
  assert.ok(EMPLOYEES_PAGE.includes('employeeService.getEmployees()'));
  assert.ok(EMPLOYEES_PAGE.includes('emptyLabel'));
  // The list is rendered from the API payload, never from a local fixture.
  assert.ok(!/seed|mock|demoEmployee|FAKE_/i.test(EMPLOYEES_PAGE));
});

// ---------------------------------------------------------------
// Teacher Employees presentation (UI-only fix)
// ---------------------------------------------------------------
test('Teacher page: source badge uses ONLY the backend-provided source field', () => {
  // It must read `employee.source` and never infer it from anything else.
  assert.ok(EMPLOYEES_PAGE.includes('source={employee.source}'));
  for (const forbidden of ['fullName ===', 'salary ===', 'jobTitle ===', 'workerUserId']) {
    const inBadge = EMPLOYEES_PAGE.slice(
      EMPLOYEES_PAGE.indexOf('const SourceBadge'),
      EMPLOYEES_PAGE.indexOf('const SourceBadge') + 900,
    );
    assert.ok(!inBadge.includes(forbidden), `badge must not infer source from ${forbidden}`);
  }
});

test('Teacher page: source labels match the My Hires terminology exactly', () => {
  // Reused keys - no duplicated source vocabulary.
  assert.ok(EMPLOYEES_PAGE.includes('myHiresPage.manualHires.manualBadge'));
  assert.ok(EMPLOYEES_PAGE.includes('myHiresPage.manualHires.homelyservBadge'));
  for (const bad of ['External', 'Manual Employee', 'HomelyServ Employee', 'HomelyServ Hire']) {
    assert.ok(!EMPLOYEES_PAGE.includes(bad), `must not introduce alternative wording: ${bad}`);
  }
});

test('Teacher page: role-aware copy so no clinic wording is shown', () => {
  assert.ok(EMPLOYEES_PAGE.includes("const isTeacher = role === 'TEACHER';"));
  assert.ok(EMPLOYEES_PAGE.includes("t('teacherEmployees.subtitle')"));
  assert.ok(EMPLOYEES_PAGE.includes("t('doctorCms.employeesSubtitle')"));
  // Doctor keeps its own wording; the Teacher never falls back to it.
  assert.ok(EMPLOYEES_PAGE.includes("const title = isTeacher ? t('teacherEmployees.title') : t('doctorCms.employeesTitle');"));
});

test('Teacher page: real Teacher red header banner', () => {
  assert.ok(EMPLOYEES_PAGE.includes('bg-gradient-to-r from-red-600 to-red-700'));
  assert.ok(EMPLOYEES_PAGE.includes('rounded-2xl p-6 text-white shadow-sm'));
});

test('Doctor Employees page now has the same portal red header banner', () => {
  // A single shared banner serves both portals; only the copy is role-aware.
  // No Doctor-only markup is lost.
  assert.ok(EMPLOYEES_PAGE.includes('<Users size={24} />'));
  assert.ok(EMPLOYEES_PAGE.includes('text-sm text-red-100 mt-1'));
  // The Doctor description must be the Doctor wording.
  assert.ok(EMPLOYEES_PAGE.includes("const subtitle = isTeacher ? t('teacherEmployees.subtitle') : t('doctorCms.employeesSubtitle');"));
});

test('Doctor Employees header reuses existing Doctor keys (no new Doctor i18n)', () => {
  // employeesTitle / employeesSubtitle already exist under doctorCms in all six.
  for (const locale of LOCALES) {
    const ns = DOCTOR_ACCOUNTS_TRANSLATIONS[locale];
    assert.ok(typeof ns?.employeesTitle === 'string' && ns.employeesTitle.trim(), `${locale}: employeesTitle`);
    assert.ok(typeof ns?.employeesSubtitle === 'string' && ns.employeesSubtitle.trim(), `${locale}: employeesSubtitle`);
  }
});

test('Teacher Employees translations resolve in ALL six locales', () => {
  for (const locale of LOCALES) {
    const ns = TEACHER_TRANSLATIONS[locale]?.teacherEmployees;
    assert.ok(ns, `${locale}: teacherEmployees missing`);
    for (const key of ['title', 'subtitle', 'empty']) {
      assert.ok(typeof ns[key] === 'string' && ns[key].trim().length > 0, `${locale}: ${key} missing`);
    }
    // The Teacher description must not mention a clinic.
    assert.ok(!/clinic/i.test(ns.subtitle), `${locale}: Teacher subtitle must not mention a clinic`);
  }
});

test('Existing employee actions and lifecycle calls are untouched', () => {
  for (const marker of [
    'employeeService.updateEmployeeSalary',
    'employeeService.activateEmployee',
    'employeeService.deactivateEmployee',
    'employeeService.terminateEmployee',
    'doctorCms.accountsEdit',
    'doctorCms.employeeSalaryNote',
  ]) {
    assert.ok(EMPLOYEES_PAGE.includes(marker), `must keep existing action: ${marker}`);
  }
});
  } finally {
    restore();
  }
});

test('Issue 4A: expenses stay scoped to their own owner', async () => {
  const restore = installExpenseModel(TeacherExpense, [COMMISSION_EXPENSE]);
  try {
    const res = makeRes();
    await getTeacherExpenses({ userId: 'teacher-somebody-else', query: {} }, res);
    assert.deepEqual(res.body.expenses, [], 'another teacher sees nothing');
  } finally {
    restore();
  }
});

test('Teacher Accounts summary includes employee salaries in salaryExpense, totalExpenses, and netProfit', async () => {
  const savedExpenseAgg = TeacherExpense.aggregate;
  const savedIncomeAgg = TeacherIncome.aggregate;
  const savedEmpFind = DoctorEmployee.find;

  const TEACHER_ID = 'teacher-101';
  const OTHER_TEACHER_ID = 'teacher-999';

  const mockExpenses = [
    { _id: 'EGP', total: 750, count: 1 }
  ];
  const mockReceivedIncome = [
    { _id: 'EGP', total: 5000, count: 2 }
  ];
  const mockPendingIncome = [
    { _id: 'EGP', total: 1000, count: 1 }
  ];

  const mockEmployees = [
    {
      _id: 'emp-1',
      ownerUserId: TEACHER_ID,
      fullName: 'Teacher Assistant',
      salary: 3000,
      currency: 'EGP',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      isActive: true
    },
    {
      _id: 'emp-inactive',
      ownerUserId: TEACHER_ID,
      fullName: 'Inactive Assistant',
      salary: 2000,
      currency: 'EGP',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      isActive: false
    },
    {
      _id: 'emp-other',
      ownerUserId: OTHER_TEACHER_ID,
      fullName: 'Other Assistant',
      salary: 4000,
      currency: 'EGP',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      isActive: true
    }
  ];

  TeacherExpense.aggregate = async (pipeline = []) => {
    const isCount = pipeline.some((p) => p.$group && p.$group.count);
    return isCount ? [{ _id: 'EGP', count: 1 }] : mockExpenses;
  };
  TeacherIncome.aggregate = async (pipeline = []) => {
    const match = pipeline.find((p) => p.$match)?.$match || {};
    const isCount = pipeline.some((p) => p.$group && p.$group.count);
    if (match.status === 'RECEIVED') {
      return isCount ? [{ _id: 'EGP', count: 2 }] : mockReceivedIncome;
    }
    if (match.status === 'PENDING') {
      return isCount ? [{ _id: 'EGP', count: 1 }] : mockPendingIncome;
    }
    return [];
  };
  DoctorEmployee.find = (filter = {}) => {
    const list = mockEmployees.filter((e) => {
      if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
      if (filter.$or) {
        const matchesOwner = filter.$or.some((clause) => {
          if (clause.ownerUserId && String(clause.ownerUserId) === String(e.ownerUserId)) return true;
          if (clause.doctorId && String(clause.doctorId) === String(e.doctorId)) return true;
          return false;
        });
        if (!matchesOwner) return false;
      }
      if (filter.startDate && filter.startDate.$lte) {
        if (new Date(e.startDate).getTime() > new Date(filter.startDate.$lte).getTime()) return false;
      }
      return true;
    });
    return {
      select: () => list,
      then: (resolve, reject) => Promise.resolve(list).then(resolve, reject)
    };
  };

  try {
    const res = makeRes();
    await getTeacherAccountsSummary(
      {
        userId: TEACHER_ID,
        query: { from: '2026-09-01', to: '2026-09-30' }
      },
      res
    );

    assert.equal(res.statusCode, 200);
    const summary = res.body.summary;
    assert.ok(summary, 'summary object must be returned');

    // Salary: 1 month of 3000 EGP for active employee emp-1
    assert.equal(summary.salaryExpense.EGP, 3000, 'salaryExpense must be 3000 EGP');
    assert.equal(summary.expenses.EGP, 750, 'other expenses must be 750 EGP');
    // Total expenses: 750 (other) + 3000 (salary) = 3750
    assert.equal(summary.totalExpenses.EGP, 3750, 'totalExpenses must include both other expenses and salary');
    // Net profit: 5000 (received) - 3750 (totalExpenses) = 1250
    assert.equal(summary.netProfit.EGP, 1250, 'netProfit must be receivedIncome minus totalExpenses');
    assert.equal(summary.receivedIncome.EGP, 5000);
    assert.equal(summary.pendingIncome.EGP, 1000);
  } finally {
    TeacherExpense.aggregate = savedExpenseAgg;
    TeacherIncome.aggregate = savedIncomeAgg;
    DoctorEmployee.find = savedEmpFind;
  }
});
  // payment service call must still be present.
  assert.ok(PAYMENT_OPTIONS.includes('RECRUITMENT_COMMISSION_RATE'));
  assert.ok(PAYMENT_OPTIONS.includes('createPayPalOrder'));
  assert.ok(PAYMENT_OPTIONS.includes('capturePayPalOrder'));
  assert.ok(PAYMENT_OPTIONS.includes('fetchCommissionProviders'));
  // Paymob must not be introduced. The word may only appear inside the
  // pre-existing explanatory comment, never as a live payment method.
  const code = PAYMENT_OPTIONS.split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.ok(!/PAYMOB/i.test(code), 'Paymob must not be introduced');
  assert.ok(code.includes('PAYPAL'), 'PayPal remains the online provider');
});