// backend/src/services/teacherStudentProfileStaffView.test.js
// ============================================================
// Role isolation for the Admin/Sup-Admin/Sup-Help profile read model.
//
//   DOCTOR -> DoctorProfile only   (handled by doctorProfileStaffView)
//   TEACHER -> TeacherProfile only
//   STUDENT -> StudentProfile only
//   anything else -> untouched
//
// DB-FREE: the Mongoose models are replaced with in-memory stubs, so no live
// MongoDB connection is required.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import TeacherProfile from '../models/TeacherProfile.js';
import StudentProfile from '../models/StudentProfile.js';
import {
  attachTeacherStudentView,
  serializeTeacherProfile,
  serializeStudentProfile,
  getTeacherProfileStaffView,
  getStudentProfileStaffView,
  PUBLIC_TEACHER_PROFILE_FIELDS,
  PUBLIC_STUDENT_PROFILE_FIELDS
} from './teacherStudentProfileStaffView.js';

const USER_ID = 'u1';

/** Swap both models for in-memory fakes; returns a restore fn. */
const installModels = ({ teacher = null, student = null } = {}) => {
  const savedTeacherFind = TeacherProfile.findOne;
  const savedStudentFind = StudentProfile.findOne;
  const makeFindOne = (doc) => () => ({ select: () => ({ lean: async () => doc }) });
  TeacherProfile.findOne = makeFindOne(teacher);
  StudentProfile.findOne = makeFindOne(student);
  return () => {
    TeacherProfile.findOne = savedTeacherFind;
    StudentProfile.findOne = savedStudentFind;
  };
};

// ---------------------------------------------------------------
// Serializers - canonical fields only
// ---------------------------------------------------------------
test('TeacherProfile serializer exposes the canonical teacher fields', () => {
  const out = serializeTeacherProfile({
    userId: USER_ID,
    title: 'Math Teacher',
    mainSubject: 'mathematics',
    additionalSubjects: ['physics'],
    specialization: 'Secondary',
    teachingLevels: ['grade_10'],
    teachingMethod: 'online',
    yearsOfExperience: 7,
    languages: ['English'],
    qualifications: ['BSc'],
    education: ['BSc Maths'],
    certifications: ['TESOL'],
    hourlyRate: 300,
    lessonRate: 250,
    pricingCurrency: 'EGP',
    availableForNewStudents: true
  });
  assert.equal(out.title, 'Math Teacher');
  assert.equal(out.mainSubject, 'mathematics');
  assert.equal(out.yearsOfExperience, 7);
  assert.equal(out.hourlyRate, 300);
  assert.equal(out.lessonRate, 250);
  assert.equal(out.pricingCurrency, 'EGP');
  assert.equal(out.availableForNewStudents, true);
  assert.deepEqual(out.additionalSubjects, ['physics']);
  assert.deepEqual(out.certifications, ['TESOL']);
  assert.equal(serializeTeacherProfile(null), null);
});

test('StudentProfile serializer exposes the canonical student fields', () => {
  const out = serializeStudentProfile({
    userId: USER_ID,
    firstName: 'Nour',
    lastName: 'Abdel Karim',
    gender: 'FEMALE',
    dateOfBirth: new Date('2010-05-04'),
    school: 'Cairo High',
    gradeLevel: 'grade_9',
    educationLevel: 'secondary',
    subjects: ['mathematics'],
    country: 'Egypt',
    city: 'Cairo',
    address: '12 Nile St',
    notes: 'Evening classes'
  });
  assert.equal(out.firstName, 'Nour');
  assert.equal(out.lastName, 'Abdel Karim');
  assert.equal(out.gender, 'FEMALE');
  assert.equal(out.school, 'Cairo High');
  assert.equal(out.gradeLevel, 'grade_9');
  assert.equal(out.city, 'Cairo');
  assert.deepEqual(out.subjects, ['mathematics']);
  assert.equal(serializeStudentProfile(null), null);
});

test('The allow-listed select fields cover the real model paths', () => {
  for (const f of ['title', 'mainSubject', 'lessonRate', 'pricingCurrency']) {
    assert.ok(PUBLIC_TEACHER_PROFILE_FIELDS.includes(f), `teacher field missing: ${f}`);
  }
  for (const f of ['firstName', 'gradeLevel', 'educationLevel', 'dateOfBirth']) {
    assert.ok(PUBLIC_STUDENT_PROFILE_FIELDS.includes(f), `student field missing: ${f}`);
  }
});
// ---------------------------------------------------------------
// Role isolation
// ---------------------------------------------------------------
test('A TEACHER receives TeacherProfile only', async () => {
  const restore = installModels({ teacher: { userId: USER_ID, title: 'T' }, student: { userId: USER_ID, firstName: 'S' } });
  try {
    const out = await attachTeacherStudentView({ id: USER_ID, role: 'TEACHER' });
    assert.ok('TeacherProfile' in out, 'teacher must receive TeacherProfile');
    assert.equal(out.TeacherProfile.title, 'T');
    assert.ok(!('StudentProfile' in out), 'a teacher must NEVER receive StudentProfile');
  } finally { restore(); }
});

test('A STUDENT receives StudentProfile only', async () => {
  const restore = installModels({ teacher: { userId: USER_ID, title: 'T' }, student: { userId: USER_ID, firstName: 'S' } });
  try {
    const out = await attachTeacherStudentView({ id: USER_ID, role: 'STUDENT' });
    assert.ok('StudentProfile' in out, 'student must receive StudentProfile');
    assert.equal(out.StudentProfile.firstName, 'S');
    assert.ok(!('TeacherProfile' in out), 'a student must NEVER receive TeacherProfile');
  } finally { restore(); }
});

test('Other roles are returned untouched (Doctor / Worker / Employer / staff)', async () => {
  const restore = installModels({ teacher: { userId: USER_ID, title: 'T' }, student: { userId: USER_ID, firstName: 'S' } });
  try {
    for (const role of ['DOCTOR', 'WORKER', 'EMPLOYER', 'ADMIN', 'SUPPORT', 'SUPPORT_HELPER']) {
      const payload = { id: USER_ID, role, WorkerProfile: { category: 'x' } };
      const out = await attachTeacherStudentView(payload);
      assert.equal(out, payload, `${role} payload must be returned untouched`);
      assert.ok(!('TeacherProfile' in out), `${role} must not receive TeacherProfile`);
      assert.ok(!('StudentProfile' in out), `${role} must not receive StudentProfile`);
    }
  } finally { restore(); }
});

test('A matching role always gets the key, even with no profile document', async () => {
  const restore = installModels({ teacher: null, student: null });
  try {
    const teacher = await attachTeacherStudentView({ id: USER_ID, role: 'TEACHER' });
    assert.ok('TeacherProfile' in teacher);
    assert.equal(teacher.TeacherProfile, null, 'null = "no profile yet", not "not a teacher"');
    const student = await attachTeacherStudentView({ id: USER_ID, role: 'STUDENT' });
    assert.ok('StudentProfile' in student);
    assert.equal(student.StudentProfile, null);
  } finally { restore(); }
});

test('Views are safe for a missing user id and never throw', async () => {
  const restore = installModels({});
  try {
    assert.deepEqual(await getTeacherProfileStaffView(null), { TeacherProfile: null });
    assert.deepEqual(await getStudentProfileStaffView(null), { StudentProfile: null });
  } finally { restore(); }
});

test('The read model never exposes credentials', () => {
  for (const fields of [PUBLIC_TEACHER_PROFILE_FIELDS, PUBLIC_STUDENT_PROFILE_FIELDS]) {
    for (const forbidden of ['password', 'token', 'secret', 'credential', 'payment']) {
      assert.ok(!fields.includes(forbidden), `must not expose ${forbidden}`);
    }
  }
});
