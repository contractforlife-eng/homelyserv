// backend/src/routes/teacherGroups.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import teachersRouter from './teachers.js';

const secret = 'teacher-groups-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const TEACHER_A_ID = '507f1f77bcf86cd799439070';
const TEACHER_B_ID = '507f1f77bcf86cd799439071';
const WORKER_ID = '507f1f77bcf86cd799439072';
const STUDENT_USER_ID = '507f1f77bcf86cd799439073';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const wrapQuery = (doc) => ({
  select(fields) {
    if (!doc) return Promise.resolve(null);
    if (fields === '-password') {
      const { password, ...rest } = doc;
      return Promise.resolve(rest);
    }
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  }
});

const withTeacherGroupsServer = async (
  { mockStudents = [], mockGroups = [], mockEnrollments = [] } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origStudentFind = TeacherStudent.find;
  const origStudentFindOne = TeacherStudent.findOne;
  const origGroupFind = TeacherGroup.find;
  const origGroupFindOne = TeacherGroup.findOne;
  const origGroupCreate = TeacherGroup.create;
  const origEnrollFind = TeacherGroupEnrollment.find;
  const origEnrollFindOne = TeacherGroupEnrollment.findOne;
  const origEnrollCreate = TeacherGroupEnrollment.create;
  const origEnrollAggregate = TeacherGroupEnrollment.aggregate;
  const origEnrollCountDocs = TeacherGroupEnrollment.countDocuments;

  let studentStore = [...mockStudents];
  let groupStore = [...mockGroups];
  let enrollStore = [...mockEnrollments];

  User.findById = (id) => {
    const sId = String(id);
    if (sId === TEACHER_A_ID) {
      return wrapQuery({
        _id: TEACHER_A_ID,
        fullName: 'Teacher Alpha',
        role: 'TEACHER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    if (sId === TEACHER_B_ID) {
      return wrapQuery({
        _id: TEACHER_B_ID,
        fullName: 'Teacher Beta',
        role: 'TEACHER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    if (sId === WORKER_ID) {
      return wrapQuery({
        _id: WORKER_ID,
        fullName: 'Worker John',
        role: 'WORKER',
        tokenVersion: 0,
        isSuspended: false
      });
    }
    return wrapQuery(null);
  };

  TeacherStudent.findOne = (filter) => {
    const found = studentStore.find((s) => {
      if (filter._id && String(s._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(s.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
      return true;
    });

    const chain = {
      populate() { return chain; },
      then(resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        return Promise.resolve({
          ...found,
          toObject: function () { return { ...this }; }
        }).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherGroup.find = (filter) => {
    let result = groupStore.filter((g) => {
      if (filter.teacherId && String(g.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && g.isActive !== filter.isActive) return false;
      if (filter.status && g.status !== filter.status) return false;
      return true;
    });

    const chain = {
      sort() { return chain; },
      then(resolve, reject) {
        return Promise.resolve(result.map((doc) => ({
          ...doc,
          toObject: function () { return { ...this }; }
        }))).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherGroup.findOne = (filter) => {
    const found = groupStore.find((g) => {
      if (filter._id && String(g._id) !== String(filter._id)) return false;
      if (filter.teacherId && String(g.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && g.isActive !== filter.isActive) return false;
      return true;
    });

    const chain = {
      then(resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        const docObj = {
          ...found,
          toObject: function () { return { ...this }; },
          save: function () {
            const idx = groupStore.findIndex((x) => String(x._id) === String(found._id));
            if (idx >= 0) groupStore[idx] = { ...this };
            return Promise.resolve(this);
          }
        };
        return Promise.resolve(docObj).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherGroup.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => ({
      ...item,
      _id: item._id || `507f1f77bcf86cd79943910${groupStore.length + idx}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: function () { return { ...this }; },
      save: function () { return Promise.resolve(this); }
    }));
    groupStore.push(...created);
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };

  TeacherGroupEnrollment.find = (filter) => {
    let result = enrollStore.filter((e) => {
      if (filter.groupId && String(e.groupId) !== String(filter.groupId)) return false;
      if (filter.teacherId && String(e.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    });

    const chain = {
      sort() { return chain; },
      populate(field) {
        if (field === 'studentId') {
          result = result.map((en) => {
            const st = studentStore.find((s) => String(s._id) === String(en.studentId));
            return {
              ...en,
              studentId: st ? { ...st } : en.studentId
            };
          });
        }
        return chain;
      },
      then(resolve, reject) {
        return Promise.resolve(result.map((doc) => ({
          ...doc,
          toObject: function () { return { ...this }; }
        }))).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherGroupEnrollment.findOne = (filter) => {
    const found = enrollStore.find((e) => {
      const eStudentId = e.studentId?._id ? String(e.studentId._id) : String(e.studentId);
      if (filter.groupId && String(e.groupId) !== String(filter.groupId)) return false;
      if (filter.studentId && eStudentId !== String(filter.studentId)) return false;
      if (filter.teacherId && String(e.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    });

    const chain = {
      then(resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        const docObj = {
          ...found,
          toObject: function () { return { ...this }; },
          save: function () {
            const idx = enrollStore.findIndex((x) => String(x._id) === String(found._id));
            if (idx >= 0) enrollStore[idx] = { ...this };
            return Promise.resolve(this);
          }
        };
        return Promise.resolve(docObj).then(resolve, reject);
      }
    };
    return chain;
  };

  TeacherGroupEnrollment.create = (items) => {
    const list = Array.isArray(items) ? items : [items];
    const created = list.map((item, idx) => {
      const doc = {
        ...item,
        _id: item._id || new mongoose.Types.ObjectId(`507f1f77bcf86cd79943920${enrollStore.length + idx}`),
        teacherId: item.teacherId ? new mongoose.Types.ObjectId(String(item.teacherId)) : item.teacherId,
        groupId: item.groupId ? new mongoose.Types.ObjectId(String(item.groupId)) : item.groupId,
        studentId: item.studentId ? new mongoose.Types.ObjectId(String(item.studentId)) : item.studentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: function () { return { ...this }; },
        save: function () {
          const idx = enrollStore.findIndex((x) => String(x._id) === String(this._id));
          if (idx >= 0) enrollStore[idx] = { ...this };
          return Promise.resolve(this);
        }
      };
      enrollStore.push(doc);
      return doc;
    });
    return Promise.resolve(Array.isArray(items) ? created : created[0]);
  };

  TeacherGroupEnrollment.aggregate = (pipeline) => {
    const match = pipeline.find((p) => p.$match)?.$match || {};
    const filtered = enrollStore.filter((e) => {
      if (match.groupId?.$in) {
        const hasMatch = match.groupId.$in.some((g) => {
          // In real MongoDB aggregation, BSON ObjectIds match ObjectIds.
          if (g instanceof mongoose.Types.ObjectId && e.groupId instanceof mongoose.Types.ObjectId) {
            return g.equals(e.groupId);
          }
          return g === e.groupId;
        });
        if (!hasMatch) return false;
      }
      if (match.teacherId !== undefined) {
        // Enforce strict BSON type matching (catching uncast String vs ObjectId bugs)
        if (match.teacherId instanceof mongoose.Types.ObjectId && e.teacherId instanceof mongoose.Types.ObjectId) {
          if (!match.teacherId.equals(e.teacherId)) return false;
        } else if (match.teacherId !== e.teacherId) {
          // Type mismatch (e.g. string vs ObjectId) or different values: no match in Mongo aggregate
          return false;
        }
      }
      if (match.isActive !== undefined && e.isActive !== match.isActive) return false;
      if (match.status && e.status !== match.status) return false;
      return true;
    });

    const counts = {};
    for (const en of filtered) {
      const gId = String(en.groupId);
      counts[gId] = (counts[gId] || 0) + 1;
    }

    const res = Object.keys(counts).map((gId) => ({ _id: gId, count: counts[gId] }));
    return Promise.resolve(res);
  };

  TeacherGroupEnrollment.countDocuments = (filter) => {
    const count = enrollStore.filter((e) => {
      if (filter.groupId && String(e.groupId) !== String(filter.groupId)) return false;
      if (filter.teacherId && String(e.teacherId) !== String(filter.teacherId)) return false;
      if (filter.isActive !== undefined && e.isActive !== filter.isActive) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    }).length;
    return Promise.resolve(count);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/teachers', teachersRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const port = server.address().port;
    await run(`http://127.0.0.1:${port}`, {
      getGroups: () => groupStore,
      getEnrollments: () => enrollStore
    });
  } finally {
    User.findById = origUserFindById;
    TeacherStudent.find = origStudentFind;
    TeacherStudent.findOne = origStudentFindOne;
    TeacherGroup.find = origGroupFind;
    TeacherGroup.findOne = origGroupFindOne;
    TeacherGroup.create = origGroupCreate;
    TeacherGroupEnrollment.find = origEnrollFind;
    TeacherGroupEnrollment.findOne = origEnrollFindOne;
    TeacherGroupEnrollment.create = origEnrollCreate;
    TeacherGroupEnrollment.aggregate = origEnrollAggregate;
    TeacherGroupEnrollment.countDocuments = origEnrollCountDocs;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('Teacher Groups & Enrollment Suite', async (t) => {
  await t.test('1. Auth Guards: 401 unauthenticated, 403 non-teacher', async () => {
    await withTeacherGroupsServer({}, async (baseUrl) => {
      // Unauthenticated
      const noAuth = await fetch(`${baseUrl}/api/teachers/groups`);
      assert.equal(noAuth.status, 401);

      // Non-teacher (Worker)
      const workerRes = await fetch(`${baseUrl}/api/teachers/groups`, {
        headers: authHeader({ userId: WORKER_ID, role: 'WORKER', tokenVersion: 0 })
      });
      assert.equal(workerRes.status, 403);
    });
  });

  await t.test('2. Group Ownership & Tenancy: Teacher A cannot access or mutate Teacher B group', async () => {
    const groupB = {
      _id: '507f1f77bcf86cd799439199',
      teacherId: TEACHER_B_ID,
      name: 'Group of Teacher B',
      subject: 'History',
      isActive: true,
      status: 'ACTIVE'
    };

    await withTeacherGroupsServer({ mockGroups: [groupB] }, async (baseUrl) => {
      const headersA = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      // Teacher A lists groups -> should see 0 groups
      const listRes = await fetch(`${baseUrl}/api/teachers/groups`, { headers: headersA });
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.equal(listJson.count, 0);

      // Teacher A gets Teacher B's group -> 404
      const getRes = await fetch(`${baseUrl}/api/teachers/groups/${groupB._id}`, { headers: headersA });
      assert.equal(getRes.status, 404);

      // Teacher A updates Teacher B's group -> 404
      const putRes = await fetch(`${baseUrl}/api/teachers/groups/${groupB._id}`, {
        method: 'PUT',
        headers: headersA,
        body: JSON.stringify({ name: 'Hacked Group Name' })
      });
      assert.equal(putRes.status, 404);

      // Teacher A deletes Teacher B's group -> 404
      const delRes = await fetch(`${baseUrl}/api/teachers/groups/${groupB._id}`, {
        method: 'DELETE',
        headers: headersA
      });
      assert.equal(delRes.status, 404);
    });
  });

  await t.test('3. Student Ownership: Teacher A cannot enroll Teacher B student', async () => {
    const groupA = {
      _id: '507f1f77bcf86cd799439101',
      teacherId: TEACHER_A_ID,
      name: 'Physics Class',
      subject: 'Physics',
      isActive: true,
      status: 'ACTIVE'
    };
    const studentB = {
      _id: '507f1f77bcf86cd799439089',
      teacherId: TEACHER_B_ID,
      fullName: 'Student belonging to Teacher B',
      isActive: true
    };

    await withTeacherGroupsServer(
      { mockGroups: [groupA], mockStudents: [studentB] },
      async (baseUrl) => {
        const headersA = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

        const enrollRes = await fetch(`${baseUrl}/api/teachers/groups/${groupA._id}/students`, {
          method: 'POST',
          headers: headersA,
          body: JSON.stringify({ studentId: studentB._id })
        });

        // Rejected with 404 (student not found in teacher's list)
        assert.equal(enrollRes.status, 404);
      }
    );
  });

  await t.test('4. Group CRUD Operations', async () => {
    await withTeacherGroupsServer({}, async (baseUrl) => {
      const headersA = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

      // Create Group
      const createRes = await fetch(`${baseUrl}/api/teachers/groups`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
          name: 'Advanced Chemistry Grade 12',
          subject: 'Chemistry',
          gradeLevel: 'Grade 12',
          academicYear: '2026/2027',
          scheduleDays: ['sunday', 'tuesday'],
          color: '#059669'
        })
      });
      assert.equal(createRes.status, 201);
      const createJson = await createRes.json();
      assert.equal(createJson.success, true);
      assert.equal(createJson.group.name, 'Advanced Chemistry Grade 12');
      assert.equal(createJson.group.studentCount, 0);

      const groupId = createJson.group.id;

      // Update Group
      const updateRes = await fetch(`${baseUrl}/api/teachers/groups/${groupId}`, {
        method: 'PUT',
        headers: headersA,
        body: JSON.stringify({
          name: 'Updated Chemistry Grade 12'
        })
      });
      assert.equal(updateRes.status, 200);
      const updateJson = await updateRes.json();
      assert.equal(updateJson.group.name, 'Updated Chemistry Grade 12');

      // Soft-Delete / Archive Group
      const delRes = await fetch(`${baseUrl}/api/teachers/groups/${groupId}`, {
        method: 'DELETE',
        headers: headersA
      });
      assert.equal(delRes.status, 200);

      // Once archived/deleted, get returns 404
      const getRes = await fetch(`${baseUrl}/api/teachers/groups/${groupId}`, { headers: headersA });
      assert.equal(getRes.status, 404);
    });
  });

  await t.test('5. Enrollment: Enroll, Duplicate Prevention, and Removal without deleting student', async () => {
    const groupA = {
      _id: '507f1f77bcf86cd799439101',
      teacherId: TEACHER_A_ID,
      name: 'Biology Class',
      subject: 'Biology',
      isActive: true,
      status: 'ACTIVE'
    };
    const student1 = {
      _id: '507f1f77bcf86cd799439081',
      teacherId: TEACHER_A_ID,
      fullName: 'Layla Ahmed',
      linkedUserId: null, // External student
      isActive: true
    };
    const student2 = {
      _id: '507f1f77bcf86cd799439082',
      teacherId: TEACHER_A_ID,
      fullName: 'Omar Hassan',
      linkedUserId: STUDENT_USER_ID, // Homely student
      isActive: true
    };

    await withTeacherGroupsServer(
      { mockGroups: [groupA], mockStudents: [student1, student2] },
      async (baseUrl, { getEnrollments }) => {
        const headersA = authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 });

        // 1. Enroll external student
        const enroll1Res = await fetch(`${baseUrl}/api/teachers/groups/${groupA._id}/students`, {
          method: 'POST',
          headers: headersA,
          body: JSON.stringify({ studentId: student1._id, notes: 'Seat 1' })
        });
        assert.equal(enroll1Res.status, 201);
        const enroll1Json = await enroll1Res.json();
        assert.equal(enroll1Json.enrollment.isHomelyStudent, false);

        // 2. Enroll Homely student
        const enroll2Res = await fetch(`${baseUrl}/api/teachers/groups/${groupA._id}/students`, {
          method: 'POST',
          headers: headersA,
          body: JSON.stringify({ studentId: student2._id })
        });
        assert.equal(enroll2Res.status, 201);
        const enroll2Json = await enroll2Res.json();
        assert.equal(enroll2Json.enrollment.isHomelyStudent, true);

        // 3. Prevent duplicate active enrollment
        const dupRes = await fetch(`${baseUrl}/api/teachers/groups/${groupA._id}/students`, {
          method: 'POST',
          headers: headersA,
          body: JSON.stringify({ studentId: student1._id })
        });
        assert.equal(dupRes.status, 400);

        // 4. List students in group details
        const listStudentsRes = await fetch(
          `${baseUrl}/api/teachers/groups/${groupA._id}/students`,
          { headers: headersA }
        );
        assert.equal(listStudentsRes.status, 200);
        const listStudentsJson = await listStudentsRes.json();
        assert.equal(listStudentsJson.count, 2);

        // 4b. Verify GET /api/teachers/groups list returns exact active studentCount = 2
        const listGroupsRes = await fetch(`${baseUrl}/api/teachers/groups`, {
          headers: headersA
        });
        assert.equal(listGroupsRes.status, 200);
        const listGroupsJson = await listGroupsRes.json();
        assert.equal(listGroupsJson.groups.length, 1);
        assert.equal(listGroupsJson.groups[0].studentCount, 2);

        // 5. Remove student from group
        const removeRes = await fetch(
          `${baseUrl}/api/teachers/groups/${groupA._id}/students/${student1._id}`,
          {
            method: 'DELETE',
            headers: headersA
          }
        );
        assert.equal(removeRes.status, 200);

        // Group now has 1 enrolled student in details
        const afterRemoveRes = await fetch(
          `${baseUrl}/api/teachers/groups/${groupA._id}/students`,
          { headers: headersA }
        );
        const afterRemoveJson = await afterRemoveRes.json();
        assert.equal(afterRemoveJson.count, 1);
        assert.equal(afterRemoveJson.students[0].fullName, 'Omar Hassan');

        // 5b. Verify GET /api/teachers/groups list returns exact updated studentCount = 1
        const listGroupsAfterRemoveRes = await fetch(
          `${baseUrl}/api/teachers/groups`,
          { headers: headersA }
        );
        assert.equal(listGroupsAfterRemoveRes.status, 200);
        const listGroupsAfterRemoveJson = await listGroupsAfterRemoveRes.json();
        assert.equal(listGroupsAfterRemoveJson.groups.length, 1);
        assert.equal(listGroupsAfterRemoveJson.groups[0].studentCount, 1);

        // Verify underlying student record was NOT deleted
        assert.equal(student1.isActive, true);
      }
    );
  });
});
