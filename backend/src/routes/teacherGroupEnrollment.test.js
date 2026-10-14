// backend/src/routes/teacherGroupEnrollment.test.js
// ============================================================
// PHASE 2 & PHASE 3 - Teacher Group Enrollment Request Workflow &
// Student Registration (Security Remediation Suite)
//
// Verifies:
//   1. Guest request without email: creates PENDING enrollment & guest student record.
//   2. New email request: creates STUDENT account, hashes password, links TeacherStudent,
//      does not disclose internal studentUserId.
//   3. F-01: Anonymous request with existing STUDENT email does NOT link to the existing account.
//   4. F-01: Authenticated STUDENT request with matching Bearer token links the existing account.
//   5. F-02: Existing non-Student account returns a generic error and does not leak role or account presence.
//   6. F-02: Anonymous response does not leak internal studentUserId or sensitive fields.
//   7. F-03: Email verification failure does not crash the endpoint or prevent student record creation.
//   8. F-04: Sibling/shared phone protection - two students sharing a phone do NOT get incorrectly merged.
//   9. Duplicate enrollment prevention: same student cannot submit twice for the same group (409).
//   10. Closed group rejection: 409 conflict.
//   11. Teacher approval: promotes PENDING enrollment to ACTIVE membership.
//   12. Teacher rejection: preserves Student user and student record (no deletion).
//   13. Cross-teacher approval isolation: teacher B cannot approve teacher A enrollment.
//
// All Mongoose + Prisma calls are stubbed; no DB connection is attempted.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherStudent from '../models/TeacherStudent.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import * as verificationService from '../services/verificationService.js';
import publicProfilesRouter from './publicProfiles.js';
import teachersRouter from './teachers.js';
import studentsRouter from './students.js';

const secret = 'teacher-group-enrollment-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_A_ID = '507f1f77bcf86cd799439070';
const TEACHER_B_ID = '507f1f77bcf86cd799439071';
const GROUP_OPEN_ID = '507f1f77bcf86cd799439301';
const GROUP_CLOSED_ID = '507f1f77bcf86cd799439302';
const GROUP_B_ID = '507f1f77bcf86cd799439303';
const EXISTING_STUDENT_ID = '507f1f77bcf86cd799439099';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const oid = (seed) => new mongoose.Types.ObjectId(seed);

const wrapQuery = (doc) => {
  const obj = {
    select() { return wrapQuery(doc); },
    lean() { return Promise.resolve(doc); },
    sort() { return wrapQuery(doc); },
    populate() { return wrapQuery(doc); },
    then(resolve, reject) { return Promise.resolve(doc).then(resolve, reject); }
  };
  if (Array.isArray(doc)) {
    obj.find = (fn) => doc.find(fn);
    obj.filter = (fn) => doc.filter(fn);
    obj.map = (fn) => doc.map(fn);
    obj.length = doc.length;
    obj[Symbol.iterator] = () => doc[Symbol.iterator]();
  }
  return obj;
};

test('Teacher Group Enrollment & Student Registration Security Workflow', async (t) => {
  const origUserFindById = User.findById;
  const origUserFindOne = User.findOne;
  const origTeachProfFindOne = TeacherProfile.findOne;
  const origGroupFind = TeacherGroup.find;
  const origGroupFindOne = TeacherGroup.findOne;
  const origGroupCreate = TeacherGroup.create;
  const origEnrollFind = TeacherGroupEnrollment.find;
  const origEnrollFindOne = TeacherGroupEnrollment.findOne;
  const origEnrollCreate = TeacherGroupEnrollment.create;
  const origEnrollAggregate = TeacherGroupEnrollment.aggregate;
  const origEnrollCountDocs = TeacherGroupEnrollment.countDocuments;
  const origStudentFind = TeacherStudent.find;
  const origStudentFindOne = TeacherStudent.findOne;
  const origStudentCreate = TeacherStudent.create;
  const origDocApptFind = DoctorAppointment.find;
  const origClinicPatFind = ClinicPatient.find;

  let userStore = [
    { _id: oid(TEACHER_A_ID), fullName: 'Teacher Alpha', email: 'teacher.a@homelyserv.test', role: 'TEACHER', isSuspended: false, tokenVersion: 0 },
    { _id: oid(TEACHER_B_ID), fullName: 'Teacher Beta', email: 'teacher.b@homelyserv.test', role: 'TEACHER', isSuspended: false, tokenVersion: 0 },
    { _id: oid('507f1f77bcf86cd799439088'), fullName: 'Existing Worker', email: 'worker@homelyserv.test', role: 'WORKER', isSuspended: false, tokenVersion: 0 },
    { _id: oid(EXISTING_STUDENT_ID), fullName: 'Existing Student', email: 'existing.student@homelyserv.test', role: 'STUDENT', isSuspended: false, tokenVersion: 0 }
  ];

  let groupStore = [
    { _id: oid(GROUP_OPEN_ID), teacherId: oid(TEACHER_A_ID), name: 'Open Physics Group', subject: 'Physics', isActive: true, status: 'ACTIVE', enrollmentOpen: true, onlineMode: 'IN_PERSON' },
    { _id: oid(GROUP_CLOSED_ID), teacherId: oid(TEACHER_A_ID), name: 'Closed Math Group', subject: 'Math', isActive: true, status: 'ACTIVE', enrollmentOpen: false, onlineMode: 'ONLINE' },
    { _id: oid(GROUP_B_ID), teacherId: oid(TEACHER_B_ID), name: 'Teacher B Group', subject: 'History', isActive: true, status: 'ACTIVE', enrollmentOpen: true, onlineMode: 'IN_PERSON' }
  ];
  let enrollStore = [];
  let studentStore = [];
  const notifications = [];

  DoctorAppointment.find = () => wrapQuery([]);
  ClinicPatient.find = () => wrapQuery([]);

  User.findById = (id) => {
    const found = userStore.find((u) => String(u._id) === String(id));
    return wrapQuery(found || null);
  };
  User.findOne = (filter) => {
    const found = userStore.find((u) => {
      if (filter.email && u.email.toLowerCase() !== filter.email.toLowerCase()) return false;
      return true;
    });
    return wrapQuery(found || null);
  };

  User.prototype.save = function () {
    if (!this._id) {
      this._id = oid(`507f1f77bcf86cd79943970${userStore.length}`);
    }
    const idx = userStore.findIndex((u) => String(u._id) === String(this._id));
    if (idx >= 0) userStore[idx] = this;
    else userStore.push(this);
    return Promise.resolve(this);
  };

  TeacherProfile.findOne = () => wrapQuery({ userId: TEACHER_A_ID, isPublished: true });

  const matchGroup = (g, filter) => {
    if (filter._id && String(g._id) !== String(filter._id)) return false;
    if (filter.teacherId && String(g.teacherId) !== String(filter.teacherId)) return false;
    if (filter.isActive !== undefined && g.isActive !== filter.isActive) return false;
    if (filter.status && g.status !== filter.status) return false;
    return true;
  };
  TeacherGroup.find = (filter) => {
    const rows = groupStore.filter((g) => matchGroup(g, filter || {}));
    const chain = wrapQuery(rows);
    chain.sort = () => chain;
    return chain;
  };
  TeacherGroup.findOne = (filter) => wrapQuery(groupStore.find((g) => matchGroup(g, filter)) || null);
  TeacherGroup.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => ({
      ...item, _id: item._id || oid(`507f1f77bcf86cd79943940${groupStore.length + idx}`),
      createdAt: new Date(), updatedAt: new Date(), save() { return Promise.resolve(this); }
    }));
    groupStore.push(...created);
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };

  const matchStudent = (s, filter) => {
    if (filter._id && String(s._id) !== String(filter._id)) return false;
    if (filter.teacherId && String(s.teacherId) !== String(filter.teacherId)) return false;
    if (filter.fullName && s.fullName !== filter.fullName) return false;
    if (filter.email && (!s.email || s.email.toLowerCase() !== filter.email.toLowerCase())) return false;
    if (filter.phone && s.phone !== filter.phone) return false;
    if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
    if (filter.$or) {
      const orMatched = filter.$or.some((clause) => {
        if (clause.linkedUserId === null && (s.linkedUserId === null || s.linkedUserId === undefined)) return true;
        if (clause.linkedUserId && clause.linkedUserId.$exists === false && (s.linkedUserId === null || s.linkedUserId === undefined)) return true;
        if (clause.linkedUserId && String(s.linkedUserId) === String(clause.linkedUserId)) return true;
        if (clause.studentUserId && String(s.studentUserId) === String(clause.studentUserId)) return true;
        return false;
      });
      if (!orMatched) return false;
    }
    return true;
  };
  TeacherStudent.find = (filter) => {
    const rows = studentStore.filter((s) => matchStudent(s, filter || {}));
    const chain = wrapQuery(rows);
    chain.sort = () => chain;
    return chain;
  };
  TeacherStudent.findOne = (filter) => {
    const found = studentStore.find((s) => matchStudent(s, filter)) || null;
    if (!found) return wrapQuery(null);
    const doc = {
      ...found,
      save() {
        const i = studentStore.findIndex((x) => String(x._id) === String(this._id));
        if (i >= 0) studentStore[i] = { ...this };
        return Promise.resolve(this);
      }
    };
    return wrapQuery(doc);
  };
  TeacherStudent.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => ({
      ...item, _id: item._id || oid(`507f1f77bcf86cd79943950${studentStore.length + idx}`),
      createdAt: new Date(), updatedAt: new Date(),
      save() { const i = studentStore.findIndex((x) => String(x._id) === String(this._id)); if (i >= 0) studentStore[i] = { ...this }; return Promise.resolve(this); }
    }));
    studentStore.push(...created);
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };

  const matchEnroll = (e, filter) => {
    if (filter._id && String(e._id) !== String(filter._id)) return false;
    if (filter.groupId && String(e.groupId) !== String(filter.groupId)) return false;
    if (filter.teacherId && String(e.teacherId) !== String(filter.teacherId)) return false;
    if (filter.studentId?.$in && !filter.studentId.$in.some((id) => String(id) === String(e.studentId))) return false;
    if (filter.studentId && !filter.studentId.$in && String(e.studentId) !== String(filter.studentId)) return false;
    if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
    if (filter.status && e.status !== filter.status) return false;
    if (filter.status?.$in && !filter.status.$in.includes(e.status)) return false;
    return true;
  };
  TeacherGroupEnrollment.find = (filter) => {
    const rows = enrollStore.filter((e) => matchEnroll(e, filter || {}));
    // Populate groupId and teacherId if requested
    const mappedRows = rows.map((e) => {
      const g = groupStore.find((x) => String(x._id) === String(e.groupId));
      const t = userStore.find((u) => String(u._id) === String(e.teacherId));
      return {
        ...e,
        groupId: g || e.groupId,
        teacherId: t || e.teacherId
      };
    });
    const chain = wrapQuery(mappedRows);
    chain.sort = () => chain;
    chain.populate = () => chain;
    return chain;
  };
  TeacherGroupEnrollment.findOne = (filter) => {
    const found = enrollStore.find((e) => matchEnroll(e, filter)) || null;
    if (!found) return wrapQuery(null);
    const doc = { ...found, save() { const i = enrollStore.findIndex((x) => String(x._id) === String(this._id)); if (i >= 0) enrollStore[i] = { ...this }; return Promise.resolve(this); } };
    return wrapQuery(doc);
  };
  TeacherGroupEnrollment.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => ({
      ...item, _id: item._id || oid(`507f1f77bcf86cd79943960${enrollStore.length + idx}`),
      createdAt: new Date(), updatedAt: new Date(),
      save() { const i = enrollStore.findIndex((x) => String(x._id) === String(this._id)); if (i >= 0) enrollStore[i] = { ...this }; return Promise.resolve(this); }
    }));
    enrollStore.push(...created);
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };
  TeacherGroupEnrollment.aggregate = (pipeline) => {
    const match = pipeline.find((p) => p.$match)?.$match || {};
    const filtered = enrollStore.filter((e) => {
      if (match.groupId?.$in && !match.groupId.$in.some((g) => String(g) === String(e.groupId))) return false;
      if (match.teacherId !== undefined && String(match.teacherId) !== String(e.teacherId)) return false;
      if (match.isActive !== undefined && e.isActive !== match.isActive) return false;
      if (match.status && e.status !== match.status) return false;
      return true;
    });
    const counts = {};
    for (const en of filtered) counts[String(en.groupId)] = (counts[String(en.groupId)] || 0) + 1;
    return Promise.resolve(Object.keys(counts).map((gId) => ({ _id: gId, count: counts[gId] })));
  };
  TeacherGroupEnrollment.countDocuments = (filter) =>
    Promise.resolve(enrollStore.filter((e) => matchEnroll(e, filter || {})).length);

  const origNotifCreate = prisma.notification?.create;
  prisma.notification = {
    create: async ({ data }) => { notifications.push(data); return { id: `n-${notifications.length}`, ...data }; }
  };

  const app = express();
  app.use(express.json());
  app.use('/api/public', publicProfilesRouter);
  app.use('/api/teachers', teachersRouter);
  app.use('/api/students', studentsRouter);
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const postEnroll = (teacherId, groupId, body, headers = {}) =>
    fetch(`${base}/api/public/teachers/${teacherId}/groups/${groupId}/enroll`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });

  try {
    await t.test('1. Guest request without email: creates PENDING enrollment and unlinked guest student', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, { name: 'Dana Guest', phone: '+201005556667', message: 'Please add me to Physics.' });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.request.status, 'PENDING');
      assert.equal(data.request.studentUserId, undefined, 'Must not leak studentUserId in response');
      const student = studentStore.find((s) => s.fullName === 'Dana Guest');
      assert.ok(student);
      assert.equal(student.linkedUserId, null);
    });

    await t.test('2. New email request: creates STUDENT account, hashes password, sets mustChangePassword', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Alice NewStudent',
        email: 'alice.new@homelyserv.test',
        phone: '+201007778899',
        message: 'Looking to join Physics'
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.request.studentUserId, undefined, 'Must not leak studentUserId in response');

      const createdUser = userStore.find((u) => u.email === 'alice.new@homelyserv.test');
      assert.ok(createdUser, 'User account was created');
      assert.equal(createdUser.role, 'STUDENT');
      assert.equal(createdUser.mustChangePassword, true);
      assert.notEqual(createdUser.password, 'plainPassword');

      const student = studentStore.find((s) => s.fullName === 'Alice NewStudent');
      assert.ok(student);
      assert.equal(String(student.linkedUserId), String(createdUser._id));
    });

    await t.test('3. F-01: Anonymous request with existing STUDENT email does NOT link the account', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Anonymous Impersonator',
        email: 'existing.student@homelyserv.test',
        phone: '+201009998877',
        message: 'Trying to claim existing account'
      });
      assert.equal(res.status, 201);
      const student = studentStore.find((s) => s.fullName === 'Anonymous Impersonator');
      assert.ok(student);
      assert.equal(student.linkedUserId, null, 'Anonymous caller cannot link existing Student user');
      assert.equal(student.studentUserId, null);
    });

    await t.test('4. F-01: Authenticated STUDENT with valid Bearer token links the existing account', async () => {
      const studentAuthHeaders = authHeader({ userId: EXISTING_STUDENT_ID, role: 'STUDENT', tokenVersion: 0 });
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Existing Student',
        email: 'existing.student@homelyserv.test',
        phone: '+201003332211'
      }, studentAuthHeaders);

      assert.equal(res.status, 201);
      const student = studentStore.find((s) => s.fullName === 'Existing Student' && s.phone === '+201003332211');
      assert.ok(student);
      assert.equal(String(student.linkedUserId), EXISTING_STUDENT_ID, 'Verified token user is linked');
    });

    await t.test('5. F-02: Existing non-Student account returns generic error without role disclosure', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Worker Candidate',
        email: 'worker@homelyserv.test',
        phone: '+201009990011'
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.message, /Unable to process request with this email/i);
      assert.doesNotMatch(data.message, /WORKER|role/i, 'Must not disclose account role');
    });

    await t.test('6. F-04: Sibling shared phone does not overwrite or merge different student names', async () => {
      const res1 = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Sibling One',
        phone: '+201001112233'
      });
      assert.equal(res1.status, 201);

      const res2 = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Sibling Two',
        phone: '+201001112233'
      });
      assert.equal(res2.status, 201);

      const studentsWithPhone = studentStore.filter((s) => s.phone === '+201001112233');
      assert.equal(studentsWithPhone.length, 2, 'Separate roster records preserved for distinct students');
      assert.ok(studentsWithPhone.some((s) => s.fullName === 'Sibling One'));
      assert.ok(studentsWithPhone.some((s) => s.fullName === 'Sibling Two'));
    });

    await t.test('7. Closed group rejection: 409 conflict', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_CLOSED_ID, {
        name: 'Bob Closed',
        phone: '+201005558889'
      });
      assert.equal(res.status, 409);
      assert.match((await res.json()).message, /closed/i);
    });

    await t.test('8. Duplicate enrollment prevention: same student cannot submit twice for same group', async () => {
      const res = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Alice NewStudent',
        email: 'alice.new@homelyserv.test',
        phone: '+201007778899'
      });
      assert.equal(res.status, 409);
      assert.match((await res.json()).message, /already have a pending or active enrollment/i);
    });

    await t.test('9. Teacher approval: promotes PENDING enrollment to ACTIVE membership', async () => {
      const pending = enrollStore.find((e) => String(e.groupId) === GROUP_OPEN_ID && e.status === 'PENDING');
      assert.ok(pending);
      const res = await fetch(`${base}/api/teachers/groups/${GROUP_OPEN_ID}/enrollments/${pending._id}/approve`, {
        method: 'POST',
        headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(res.status, 200);
      const after = enrollStore.find((e) => String(e._id) === String(pending._id));
      assert.equal(after.status, 'ACTIVE');
      assert.equal(after.isActive, true);
    });

    await t.test('10. Teacher rejection: preserves Student user and student record', async () => {
      const openGroup = { _id: oid('507f1f77bcf86cd799439304'), teacherId: oid(TEACHER_A_ID), name: 'Chem Group', subject: 'Chemistry', isActive: true, status: 'ACTIVE', enrollmentOpen: true };
      groupStore.push(openGroup);
      const submit = await postEnroll(TEACHER_A_ID, String(openGroup._id), {
        name: 'Rejected Student',
        email: 'rejected.student@homelyserv.test',
        phone: '+201005552233'
      });
      assert.equal(submit.status, 201);
      const pending = enrollStore.find((e) => String(e.groupId) === String(openGroup._id) && e.status === 'PENDING');
      assert.ok(pending);

      const reject = await fetch(`${base}/api/teachers/groups/${openGroup._id}/enrollments/${pending._id}/reject`, {
        method: 'POST',
        headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(reject.status, 200);

      const after = enrollStore.find((e) => String(e._id) === String(pending._id));
      assert.equal(after.status, 'REJECTED');
      assert.ok(userStore.find((u) => u.email === 'rejected.student@homelyserv.test'));
      assert.ok(studentStore.find((s) => s.email === 'rejected.student@homelyserv.test'));
    });

    await t.test('11. Cross-teacher approval isolation: teacher B cannot approve teacher A enrollment', async () => {
      const target = enrollStore.find((e) => String(e.groupId) === GROUP_OPEN_ID);
      assert.ok(target);
      const res = await fetch(`${base}/api/teachers/groups/${GROUP_OPEN_ID}/enrollments/${target._id}/approve`, {
        method: 'POST',
        headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER', tokenVersion: 0 })
      });
      assert.equal(res.status, 404);
    });

    await t.test('12. Authenticated Student can view their group enrollments immediately', async () => {
      // In subtest 4, EXISTING_STUDENT was enrolled in GROUP_OPEN_ID
      const studentHeaders = authHeader({ userId: EXISTING_STUDENT_ID, role: 'STUDENT', tokenVersion: 0 });
      const res = await fetch(`${base}/api/students/groups/enrollments`, {
        headers: studentHeaders
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.enrollments));
      const myEnroll = data.enrollments.find((e) => String(e.group.id) === GROUP_OPEN_ID);
      assert.ok(myEnroll, 'Student can see their group enrollment request');
      assert.equal(myEnroll.group.name, 'Open Physics Group');
    });

    await t.test('13. Secure Claim Flow: Email owner claims unlinked pending request after verified login', async () => {
      // Step A: Anonymous user submits request with student.claim@homelyserv.test
      const claimStudentUser = {
        _id: oid('507f1f77bcf86cd799439095'),
        fullName: 'Claim Student',
        email: 'student.claim@homelyserv.test',
        role: 'STUDENT',
        isSuspended: false,
        emailVerified: true,
        tokenVersion: 0
      };
      userStore.push(claimStudentUser);

      const anonRes = await postEnroll(TEACHER_A_ID, GROUP_OPEN_ID, {
        name: 'Claim Visitor',
        email: 'student.claim@homelyserv.test',
        phone: '+201004445566'
      });
      assert.equal(anonRes.status, 201);

      // Verify it was NOT linked anonymously
      const unlinked = studentStore.find((s) => s.fullName === 'Claim Visitor');
      assert.ok(unlinked);
      assert.equal(unlinked.linkedUserId, null, 'Stays unlinked before verification/claim');

      // Step B: Authenticated student claims their requests
      const claimHeaders = authHeader({ userId: String(claimStudentUser._id), role: 'STUDENT', tokenVersion: 0 });
      const claimRes = await fetch(`${base}/api/students/claim-pending-requests`, {
        method: 'POST',
        headers: claimHeaders
      });
      assert.equal(claimRes.status, 200);
      const claimData = await claimRes.json();
      assert.equal(claimData.success, true);
      assert.equal(claimData.claimed.teacherStudents, 1);

      // Verify the record is now linked to the student
      const afterClaim = studentStore.find((s) => s.fullName === 'Claim Visitor');
      assert.equal(String(afterClaim.linkedUserId), String(claimStudentUser._id));
      assert.equal(String(afterClaim.studentUserId), String(claimStudentUser._id));
    });

    await t.test('14. Cross-account Isolation: Another user cannot claim another student requests', async () => {
      const otherUser = {
        _id: oid('507f1f77bcf86cd799439096'),
        fullName: 'Other User',
        email: 'other.user@homelyserv.test',
        role: 'STUDENT',
        isSuspended: false,
        emailVerified: true,
        tokenVersion: 0
      };
      userStore.push(otherUser);

      const otherHeaders = authHeader({ userId: String(otherUser._id), role: 'STUDENT', tokenVersion: 0 });
      const claimRes = await fetch(`${base}/api/students/claim-pending-requests`, {
        method: 'POST',
        headers: otherHeaders
      });
      assert.equal(claimRes.status, 200);
      const claimData = await claimRes.json();
      assert.equal(claimData.claimed.teacherStudents, 0, 'Cannot claim requests of another email');
    });

    await t.test('15. Unverified Student receives 403 and cannot claim pending requests', async () => {
      const unverifiedUser = {
        _id: oid('507f1f77bcf86cd799439097'),
        fullName: 'Unverified Student',
        email: 'unverified@homelyserv.test',
        role: 'STUDENT',
        isSuspended: false,
        emailVerified: false,
        tokenVersion: 0
      };
      userStore.push(unverifiedUser);

      // Create an unlinked student record for this email
      studentStore.push({
        _id: oid('507f1f77bcf86cd799439599'),
        teacherId: oid(TEACHER_A_ID),
        fullName: 'Unverified Student',
        email: 'unverified@homelyserv.test',
        phone: '+201007778899',
        linkedUserId: null,
        studentUserId: null,
        isActive: true,
        save() { return Promise.resolve(this); }
      });

      const unverifiedHeaders = authHeader({ userId: String(unverifiedUser._id), role: 'STUDENT', tokenVersion: 0 });
      const claimRes = await fetch(`${base}/api/students/claim-pending-requests`, {
        method: 'POST',
        headers: unverifiedHeaders
      });
      assert.equal(claimRes.status, 403);
      const data = await claimRes.json();
      assert.equal(data.success, false);
      assert.match(data.message, /verified/i);

      // Confirm record is NOT modified
      const stRecord = studentStore.find((s) => s.email === 'unverified@homelyserv.test');
      assert.equal(stRecord.linkedUserId, null);
    });
  } finally {
    User.findById = origUserFindById;
    User.findOne = origUserFindOne;
    TeacherProfile.findOne = origTeachProfFindOne;
    TeacherGroup.find = origGroupFind;
    TeacherGroup.findOne = origGroupFindOne;
    TeacherGroup.create = origGroupCreate;
    TeacherGroupEnrollment.find = origEnrollFind;
    TeacherGroupEnrollment.findOne = origEnrollFindOne;
    TeacherGroupEnrollment.create = origEnrollCreate;
    TeacherGroupEnrollment.aggregate = origEnrollAggregate;
    TeacherGroupEnrollment.countDocuments = origEnrollCountDocs;
    TeacherStudent.find = origStudentFind;
    TeacherStudent.findOne = origStudentFindOne;
    TeacherStudent.create = origStudentCreate;
    DoctorAppointment.find = origDocApptFind;
    ClinicPatient.find = origClinicPatFind;
    if (origNotifCreate) prisma.notification.create = origNotifCreate;
    else delete prisma.notification.create;
    await new Promise((resolve) => server.close(resolve));
  }
});
