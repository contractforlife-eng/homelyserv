// backend/src/services/supportUserStats.test.js
// ============================================================
// Focused regression tests for the Admin / Co-Admin View Profile statistics
// served by GET /api/support/users/:id/stats (backend/src/routes/support.js).
//
//   FIX 1 - Doctor uses the canonical VALID_PATIENT_RELATIONSHIP_STATUSES
//           instead of a duplicated hardcoded status array.
//   FIX 2 - Student teachersCount follows the canonical Student dashboard
//           semantics: ACTIVE only, isActive true, UNIQUE teacherId.
//
// The i18n checks evaluate the REAL translation resource objects (extracted from
// frontend/src/i18n/index.js with the browser-only imports stubbed) rather than
// scanning text, so a sibling namespace can never satisfy them.
//
// No database is read or written.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { VALID_PATIENT_RELATIONSHIP_STATUSES } from '../services/doctorPatientAccessService.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SUPPORT_JS = path.join(ROOT, 'backend/src/routes/support.js');
const I18N_JS = path.join(ROOT, 'frontend/src/i18n/index.js');

const supportSource = fs.readFileSync(SUPPORT_JS, 'utf8');

/** The /users/:id/stats handler body only. */
const statsHandler = supportSource.slice(
  supportSource.indexOf("router.get('/users/:id/stats'"),
);

/** Strip comments so prose can never satisfy an assertion. */
const codeOnly = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

// ---------------------------------------------------------------
// FIX 1 - Doctor canonical statuses
// ---------------------------------------------------------------
test('Fix 1: the Doctor block uses the canonical VALID_PATIENT_RELATIONSHIP_STATUSES', () => {
  assert.ok(
    supportSource.includes(
      "import { VALID_PATIENT_RELATIONSHIP_STATUSES } from '../services/doctorPatientAccessService.js'",
    ),
    'support.js must import the canonical constant',
  );
  assert.ok(
    statsHandler.includes('VALID_PATIENT_RELATIONSHIP_STATUSES'),
    'the stats handler must reference the constant',
  );
});

// ---------------------------------------------------------------
// FIX 2 - Student teacher count semantics
// ---------------------------------------------------------------
/** Mirrors the exact filter the route now applies, against a fake collection. */
const countCanonicalTeachers = (rows, studentUserId) => {
  const matched = rows.filter(
    (row) =>
      (row.linkedUserId === studentUserId || row.studentUserId === studentUserId) &&
      row.isActive === true &&
      row.relationshipStatus === 'ACTIVE',
  );
  return new Set(matched.map((row) => String(row.teacherId)).filter(Boolean)).size;
};

test('Fix 2: the Student block filters ACTIVE + isActive and counts unique teacherId', () => {
  const code = codeOnly(statsHandler);
  assert.ok(code.includes("relationshipStatus: 'ACTIVE'"), 'must require ACTIVE');
  assert.ok(code.includes('isActive: true'), 'must require isActive true');
  assert.ok(
    code.includes('$or: [{ linkedUserId: studentUserId }, { studentUserId: studentUserId }]'),
    'the existing relationship identity logic must be preserved',
  );
  assert.ok(/new Set\(/.test(code), 'must count unique teacherId');
  assert.ok(
    !code.includes("relationshipStatus: { $ne: 'REJECTED' }"),
    'the broad $ne REJECTED filter must be gone',
  );
});

test('Fix 2: PENDING / ENDED / REJECTED / inactive relationships do not count', () => {
  const S = 'student-1';
  const rows = [
    { teacherId: 't1', studentUserId: S, isActive: true, relationshipStatus: 'ACTIVE' },
    { teacherId: 't2', studentUserId: S, isActive: true, relationshipStatus: 'PENDING' },
    { teacherId: 't3', studentUserId: S, isActive: true, relationshipStatus: 'ENDED' },
    { teacherId: 't4', studentUserId: S, isActive: true, relationshipStatus: 'REJECTED' },
    { teacherId: 't5', studentUserId: S, isActive: false, relationshipStatus: 'ACTIVE' },
  ];
  assert.equal(countCanonicalTeachers(rows, S), 1, 'only the ACTIVE + active row counts');
});

test('Fix 2: duplicate records for the SAME teacher count once', () => {
  const S = 'student-1';
  const rows = [
    { teacherId: 't1', studentUserId: S, isActive: true, relationshipStatus: 'ACTIVE' },
    { teacherId: 't1', linkedUserId: S, isActive: true, relationshipStatus: 'ACTIVE' },
    { teacherId: 't2', studentUserId: S, isActive: true, relationshipStatus: 'ACTIVE' },
  ];
  assert.equal(countCanonicalTeachers(rows, S), 2, 'two distinct teachers -> 2');
});

test('Fix 2: matching by linkedUserId OR studentUserId both work', () => {
  assert.equal(
    countCanonicalTeachers([{ teacherId: 't1', linkedUserId: 's9', isActive: true, relationshipStatus: 'ACTIVE' }], 's9'),
    1,
  );
  assert.equal(
    countCanonicalTeachers([{ teacherId: 't1', studentUserId: 's9', isActive: true, relationshipStatus: 'ACTIVE' }], 's9'),
    1,
  );
  assert.equal(
    countCanonicalTeachers([{ teacherId: 't1', studentUserId: 'other', isActive: true, relationshipStatus: 'ACTIVE' }], 's9'),
    0,
  );
// ---------------------------------------------------------------
// FIX 3 - translations (real resource objects, not a text scan)
// ---------------------------------------------------------------
const loadRealTranslations = async () => {
  const lines = fs.readFileSync(I18N_JS, 'utf8').split(/\r?\n/);
  // The six locale consts, then the `resources` object.
  const start = lines.findIndex((l) => /^const en = \{$/.test(l));
  const resStart = lines.findIndex((l, i) => i > start && /^const resources = \{$/.test(l));
  const end = lines.findIndex((l, i) => i > resStart && /^\};$/.test(l));
  const stubs = [
    'const HOME_TRANSLATIONS={};',
    'const DOCTOR_CMS_TRANSLATIONS={};',
    'const DOCTOR_CMS_NAV_TRANSLATIONS={};',
    'const CLINIC_PATIENT_TRANSLATIONS={};',
    'const DOCTOR_ACCOUNTS_TRANSLATIONS={};',
    'const DOCTOR_ACCOUNTS_NAV_TRANSLATIONS={};',
    'const TEACHER_TRANSLATIONS={};',
    'const STUDENT_TRANSLATIONS={};',
  ].join('\n');
  const body = `${stubs}\n${lines.slice(start, end + 1).join('\n')}\nexport default resources;`;
  const tmp = path.join(os.tmpdir(), `hs-userprofilestats-${process.pid}.mjs`);
  fs.writeFileSync(tmp, body, 'utf8');
  try {
    return (await import(pathToFileURL(tmp).href)).default;
  } finally {
    fs.unlinkSync(tmp);
  }
};

const LOCALES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

test('Fix 3: assigned / inProgress / resolved / escalated resolve in ALL six locales', async () => {
  const resources = await loadRealTranslations();
  const required = ['assigned', 'inProgress', 'resolved', 'escalated'];
  const seen = new Map();
  for (const locale of LOCALES) {
    const ns = resources[locale]?.translation?.userProfileView;
    assert.ok(ns, `${locale}: userProfileView namespace missing`);
    for (const key of required) {
      const value = ns[key];
      assert.equal(typeof value, 'string', `${locale}: userProfileView.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${locale}: userProfileView.${key} must not be empty`);
      seen.set(value, (seen.get(value) || 0) + 1);
    }
  }
  // Real translations, not six copies of the English fallback.
  assert.ok(seen.size >= 5, `expected per-locale translations, got ${seen.size} distinct values`);
  assert.equal(seen.get('Assigned'), 1, 'English keeps its original wording');
});

test('Fix 3: the pre-existing doctor/teacher/student statistic labels still resolve', async () => {
  const resources = await loadRealTranslations();
  const required = [
    'statistics', 'teachers',
    'homelyServPatients', 'regularPatients',
    'homelyServStudents', 'regularStudents',
    'complaints', 'messages', 'payments', 'hires', 'offers',
  ];
  for (const locale of LOCALES) {
    const ns = resources[locale].translation.userProfileView;
    for (const key of required) {
      assert.equal(
        typeof ns[key] === 'string' && ns[key].trim().length > 0,
        true,
        `${locale}: userProfileView.${key} must still resolve`,
      );
    }
  }
});
});
test('Fix 1: no duplicated hardcoded CONFIRMED/COMPLETED array remains', () => {
  const code = codeOnly(statsHandler);
  assert.ok(
    !/\[\s*'CONFIRMED'\s*,\s*'COMPLETED'\s*\]/.test(code),
    'the hardcoded ["CONFIRMED","COMPLETED"] list must be gone',
  );
  // Semantics are unchanged: the constant still holds the same values.
  assert.deepEqual([...VALID_PATIENT_RELATIONSHIP_STATUSES], ['CONFIRMED', 'COMPLETED']);
});