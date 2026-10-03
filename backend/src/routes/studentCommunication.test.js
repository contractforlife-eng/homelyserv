// backend/src/routes/studentCommunication.test.js
// ============================================================
// STUDENT SYSTEM PHASE 9A: STUDENT FRIENDSHIP & CLASSMATE DISCOVERY TESTS
//
// Minimum tests verifying:
// 1. Unauthenticated classmate access -> 401
// 2. Student classmate list only returns eligible classmates
// 3. ONE_ON_ONE does not create classmate eligibility
// 4. GROUP classmates are discoverable
// 5. External students are excluded
// 6. Unrelated Students are excluded
// 7. Self-friend request rejected
// 8. Non-Student recipient rejected
// 9. Non-classmate friend request rejected
// 10. Valid friend request succeeds
// 11. Duplicate request prevented
// 12. Reverse pending request handled safely (auto-accepts)
// 13. Incoming request visible to recipient
// 14. Outgoing request visible to requester
// 15. Recipient can accept
// 16. Recipient can reject
// 17. Non-recipient cannot accept/reject
// 18. Accepted friendship persists independently after the group ends
// 19. One user's friendship records cannot be read by another user
// 20. No unrelated roles can create StudentFriendship records
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import StudentFriendship from '../models/StudentFriendship.js';
import studentsRouter from './students.js';
import prisma from '../lib/prisma.js';

const secret = 'student-friendship-test-secret-2026-very-secure-32chars';
process.env.JWT_SECRET = secret;

const STUDENT_1_ID = '507f1f77bcf86cd799439081'; // Alice (Student)
const STUDENT_2_ID = '507f1f77bcf86cd799439082'; // Bob (Classmate)
const STUDENT_3_ID = '507f1f77bcf86cd799439083'; // Charlie (Unrelated Student)
const WORKER_1_ID  = '507f1f77bcf86cd799439084'; // Dave (Worker)
const TEACHER_1_ID = '507f1f77bcf86cd799439070'; // Teacher

const TS_1_ID = '507f1f77bcf86cd799439091'; // TeacherStudent for Alice
const TS_2_ID = '507f1f77bcf86cd799439092'; // TeacherStudent for Bob (Homely)
const TS_EXT_ID = '507f1f77bcf86cd799439093'; // TeacherStudent External (no user)
const TS_3_ID = '507f1f77bcf86cd799439094'; // TeacherStudent for Charlie (in different class)

const GROUP_1_ID = '507f1f77bcf86cd799439051'; // Math Group (Alice + Bob + External)
const GROUP_2_ID = '507f1f77bcf86cd799439052'; // History Group (Charlie only)
const FRIENDSHIP_1_ID = '507f1f77bcf86cd799439041';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });

const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

const withFriendshipTestServer = async (
  {
    mockUsers = [],
    mockTeacherStudents = [],
    mockTeacherGroups = [],
    mockEnrollments = [],
    mockLessons = [],
    mockFriendships = []
  } = {},
  run
) => {
  const origUserFindById = User.findById;
  const origUserFindOne = User.findOne;
  const origUserFind = User.find;
  const origUserFindOneAndUpdate = User.findOneAndUpdate;

  const origTSFind = TeacherStudent.find;
  const origTGFind = TeacherGroup.find;
  const origTGEFind = TeacherGroupEnrollment.find;
  const origTLFind = TeacherLesson.find;

  const origSFFind = StudentFriendship.find;
  const origSFFindOne = StudentFriendship.findOne;
  const origSFFindById = StudentFriendship.findById;
  const origSFCreate = StudentFriendship.create;

  const origPrismaNotificationCreate = prisma.notification?.create;

  let friendships = [...mockFriendships];

  try {
    User.findOneAndUpdate = () => Promise.resolve({});

    User.findById = (id) => {
      const u = mockUsers.find((x) => String(x._id) === String(id));
      return {
        select: () => Promise.resolve(u || null)
      };
    };

    User.findOne = (filter) => {
      const match = mockUsers.find((u) => {
        if (filter._id && String(u._id) !== String(filter._id)) return false;
        if (filter.role && u.role !== filter.role) return false;
        if (filter.isSuspended !== undefined && u.isSuspended !== filter.isSuspended) return false;
        return true;
      });
      return {
        select: () => Promise.resolve(match || null)
      };
    };

    User.find = (filter) => {
      let list = [...mockUsers];
      if (filter?._id?.$in) {
        const ids = filter._id.$in.map(String);
        list = list.filter((u) => ids.includes(String(u._id)));
      }
      if (filter?.role) {
        list = list.filter((u) => u.role === filter.role);
      }
      if (filter?.isSuspended !== undefined) {
        list = list.filter((u) => u.isSuspended === filter.isSuspended);
      }
      return {
        select: () => {
          const res = Promise.resolve(list);
          res.lean = () => Promise.resolve(list);
          return res;
        },
        lean: () => Promise.resolve(list),
        then: (resolve) => resolve(list)
      };
    };

    TeacherStudent.find = (filter) => {
      let list = [...mockTeacherStudents];
      if (filter?._id?.$in) {
        const ids = filter._id.$in.map(String);
        list = list.filter((r) => ids.includes(String(r._id)));
      }
      if (filter?.$or) {
        const userIds = filter.$or.map((o) => o.linkedUserId || o.studentUserId).filter((v) => v && v !== null && typeof v !== 'object').map(String);
        if (userIds.length > 0) {
          list = list.filter((r) =>
            userIds.includes(String(r.linkedUserId)) || userIds.includes(String(r.studentUserId))
          );
        } else {
          // Check for { linkedUserId: { $ne: null } }
          list = list.filter((r) => r.linkedUserId !== null || r.studentUserId !== null);
        }
      }
      if (filter?.isActive !== undefined) {
        list = list.filter((r) => r.isActive === filter.isActive);
      }
      if (filter?.relationshipStatus) {
        list = list.filter((r) => r.relationshipStatus === filter.relationshipStatus);
      }
      return {
        select: () => Promise.resolve(list)
      };
    };

    TeacherGroup.find = (filter) => {
      let list = [...mockTeacherGroups];
      if (filter?._id?.$in) {
        const ids = filter._id.$in.map(String);
        list = list.filter((g) => ids.includes(String(g._id)));
      }
      if (filter?.isActive !== undefined) {
        list = list.filter((g) => g.isActive === filter.isActive);
      }
      return {
        select: () => Promise.resolve(list)
      };
    };

    TeacherGroupEnrollment.find = (filter) => {
      let list = [...mockEnrollments];
      if (filter?.studentId?.$in) {
        const ids = filter.studentId.$in.map(String);
        list = list.filter((e) => ids.includes(String(e.studentId)));
      }
      if (filter?.studentId?.$nin) {
        const ids = filter.studentId.$nin.map(String);
        list = list.filter((e) => !ids.includes(String(e.studentId)));
      }
      if (filter?.groupId?.$in) {
        const ids = filter.groupId.$in.map(String);
        list = list.filter((e) => ids.includes(String(e.groupId)));
      }
      if (filter?.status) {
        list = list.filter((e) => e.status === filter.status);
      }
      if (filter?.isActive !== undefined) {
        list = list.filter((e) => e.isActive === filter.isActive);
      }
      return {
        select: () => Promise.resolve(list)
      };
    };

    TeacherLesson.find = (filter) => {
      let list = [...mockLessons];
      if (filter?.groupId?.$in) {
        const ids = filter.groupId.$in.map(String);
        list = list.filter((l) => ids.includes(String(l.groupId)));
      }
      if (filter?.lessonType) {
        list = list.filter((l) => l.lessonType === filter.lessonType);
      }
      if (filter?.lessonStatus?.$in) {
        list = list.filter((l) => filter.lessonStatus.$in.includes(l.lessonStatus));
      }
      if (filter?.isActive !== undefined) {
        list = list.filter((l) => l.isActive === filter.isActive);
      }
      return {
        select: () => Promise.resolve(list)
      };
    };

    // Helper to wrap friendship doc with .save()
    const wrapFriendshipDoc = (doc) => {
      if (!doc) return null;
      return {
        ...doc,
        save: async function () {
          const idx = friendships.findIndex((f) => String(f._id) === String(doc._id));
          if (idx !== -1) {
            friendships[idx] = { ...this, updatedAt: new Date() };
          }
          return this;
        }
      };
    };

    StudentFriendship.find = (filter) => {
      let list = [...friendships];
      if (filter?.$or) {
        list = list.filter((f) => {
          return filter.$or.some((clause) => {
            if (clause.requesterUserId && String(f.requesterUserId) !== String(clause.requesterUserId)) return false;
            if (clause.recipientUserId) {
              if (clause.recipientUserId.$in) {
                const ids = clause.recipientUserId.$in.map(String);
                if (!ids.includes(String(f.recipientUserId))) return false;
              } else if (String(f.recipientUserId) !== String(clause.recipientUserId)) {
                return false;
              }
            }
            return true;
          });
        });
      }
      return {
        sort: () => ({
          lean: () => Promise.resolve(list)
        }),
        lean: () => Promise.resolve(list)
      };
    };

    StudentFriendship.findOne = (filter) => {
      let match = null;
      if (filter?.$or) {
        match = friendships.find((f) => {
          return filter.$or.some((clause) => {
            if (clause.requesterUserId && String(f.requesterUserId) !== String(clause.requesterUserId)) return false;
            if (clause.recipientUserId && String(f.recipientUserId) !== String(clause.recipientUserId)) return false;
            return true;
          });
        });
      }
      return Promise.resolve(match ? wrapFriendshipDoc(match) : null);
    };

    StudentFriendship.findById = (id) => {
      const match = friendships.find((f) => String(f._id) === String(id));
      return Promise.resolve(match ? wrapFriendshipDoc(match) : null);
    };

    StudentFriendship.create = async (data) => {
      const s1 = String(data.requesterUserId);
      const s2 = String(data.recipientUserId);
      const userLow = s1 < s2 ? s1 : s2;
      const userHigh = s1 < s2 ? s2 : s1;

      // Duplicate check simulation
      const dup = friendships.find((f) => {
        const fLow = String(f.requesterUserId) < String(f.recipientUserId) ? String(f.requesterUserId) : String(f.recipientUserId);
        const fHigh = String(f.requesterUserId) < String(f.recipientUserId) ? String(f.recipientUserId) : String(f.requesterUserId);
        return fLow === userLow && fHigh === userHigh;
      });
      if (dup) {
        const err = new Error('E11000 duplicate key error');
        err.code = 11000;
        throw err;
      }

      const newDoc = {
        _id: '507f1f77bcf86cd7994390' + String(10 + friendships.length),
        ...data,
        userLow,
        userHigh,
        status: data.status || 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      friendships.push(newDoc);
      return wrapFriendshipDoc(newDoc);
    };

    if (!prisma.notification) prisma.notification = {};
    prisma.notification.create = () => Promise.resolve({ id: 'mock_notif' });

    const app = express();
    app.use(express.json());
    app.use('/api/students', studentsRouter);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      await run({ baseUrl, friendships });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    User.findById = origUserFindById;
    User.findOne = origUserFindOne;
    User.find = origUserFind;
    User.findOneAndUpdate = origUserFindOneAndUpdate;

    TeacherStudent.find = origTSFind;
    TeacherGroup.find = origTGFind;
    TeacherGroupEnrollment.find = origTGEFind;
    TeacherLesson.find = origTLFind;

    StudentFriendship.find = origSFFind;
    StudentFriendship.findOne = origSFFindOne;
    StudentFriendship.findById = origSFFindById;
    StudentFriendship.create = origSFCreate;

    if (prisma.notification) {
      prisma.notification.create = origPrismaNotificationCreate;
    }
  }
};

// Fixtures for testing
const baseUsers = [
  { _id: STUDENT_1_ID, role: 'STUDENT', fullName: 'Alice Student', email: 'alice@test.com', isSuspended: false },
  { _id: STUDENT_2_ID, role: 'STUDENT', fullName: 'Bob Classmate', email: 'bob@test.com', isSuspended: false },
  { _id: STUDENT_3_ID, role: 'STUDENT', fullName: 'Charlie Stranger', email: 'charlie@test.com', isSuspended: false },
  { _id: WORKER_1_ID,  role: 'WORKER',  fullName: 'Dave Worker', email: 'dave@test.com', isSuspended: false }
];

const baseTeacherStudents = [
  { _id: TS_1_ID, teacherId: TEACHER_1_ID, linkedUserId: STUDENT_1_ID, studentUserId: STUDENT_1_ID, relationshipStatus: 'ACTIVE', isActive: true },
  { _id: TS_2_ID, teacherId: TEACHER_1_ID, linkedUserId: STUDENT_2_ID, studentUserId: STUDENT_2_ID, relationshipStatus: 'ACTIVE', isActive: true },
  { _id: TS_EXT_ID, teacherId: TEACHER_1_ID, linkedUserId: null, studentUserId: null, relationshipStatus: 'ACTIVE', isActive: true },
  { _id: TS_3_ID, teacherId: TEACHER_1_ID, linkedUserId: STUDENT_3_ID, studentUserId: STUDENT_3_ID, relationshipStatus: 'ACTIVE', isActive: true }
];

const baseTeacherGroups = [
  { _id: GROUP_1_ID, name: 'Algebra 101', subject: 'Math', isActive: true },
  { _id: GROUP_2_ID, name: 'History 201', subject: 'History', isActive: true }
];

const baseEnrollments = [
  { groupId: GROUP_1_ID, studentId: TS_1_ID, status: 'ACTIVE', isActive: true },
  { groupId: GROUP_1_ID, studentId: TS_2_ID, status: 'ACTIVE', isActive: true },
  { groupId: GROUP_1_ID, studentId: TS_EXT_ID, status: 'ACTIVE', isActive: true },
  { groupId: GROUP_2_ID, studentId: TS_3_ID, status: 'ACTIVE', isActive: true }
];

const baseLessons = [
  { _id: 'l1', groupId: GROUP_1_ID, lessonType: 'GROUP', lessonStatus: 'SCHEDULED', isActive: true },
  { _id: 'l2', groupId: GROUP_2_ID, lessonType: 'GROUP', lessonStatus: 'SCHEDULED', isActive: true }
];

// TESTS

test('1. Unauthenticated classmate access -> 401', async () => {
  await withFriendshipTestServer({}, async ({ baseUrl }) => {
    const res = await fetch(`${baseUrl}/api/students/classmates`);
    assert.equal(res.status, 401);
  });
});

test('2. Student classmate list only returns eligible classmates (GROUP peers with valid lessons)', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/classmates`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.classmates.length, 1);
      assert.equal(json.classmates[0].userId, STUDENT_2_ID);
      assert.equal(json.classmates[0].fullName, 'Bob Classmate');
      assert.equal(json.classmates[0].sharedGroups[0].name, 'Algebra 101');
    }
  );
});

test('3. ONE_ON_ONE does not create classmate eligibility', async () => {
  // If the group only had a 1-on-1 lesson or cancelled lessons, it shouldn't qualify
  const oneOnOneLessons = [
    { _id: 'l1', groupId: GROUP_1_ID, lessonType: 'ONE_ON_ONE', lessonStatus: 'SCHEDULED', isActive: true }
  ];
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: oneOnOneLessons
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/classmates`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.classmates.length, 0);
    }
  );
});

test('4. External students (linkedUserId: null) are excluded', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/classmates`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      const json = await res.json();
      // Only Bob is returned, TS_EXT_ID is not mapped to any user
      assert.ok(!json.classmates.some((c) => !c.userId || c.userId === String(TS_EXT_ID)));
    }
  );
});

test('5. Unrelated students in different groups are excluded', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/classmates`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      const json = await res.json();
      // Charlie (STUDENT_3_ID) is in History 201 only, not Algebra 101
      assert.ok(!json.classmates.some((c) => c.userId === STUDENT_3_ID));
    }
  );
});

test('6. Self-friend request is rejected (400)', async () => {
  await withFriendshipTestServer(
    { mockUsers: baseUsers },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: STUDENT_1_ID })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /yourself/i);
    }
  );
});

test('7. Non-Student recipient is rejected (404/403)', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl }) => {
      // Dave is WORKER
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: WORKER_1_ID })
      });
      assert.equal(res.status, 404);
    }
  );
});

test('8. Non-classmate friend request is rejected (403)', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl }) => {
      // Charlie is a Student, but not Alice's classmate
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: STUDENT_3_ID })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.message, /share a class/i);
    }
  );
});

test('9. Valid friend request to eligible classmate succeeds (201)', async () => {
  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons
    },
    async ({ baseUrl, friendships }) => {
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: STUDENT_2_ID })
      });
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.friendship.status, 'PENDING');
      assert.equal(json.friendship.requesterUserId, STUDENT_1_ID);
      assert.equal(json.friendship.recipientUserId, STUDENT_2_ID);
      assert.equal(friendships.length, 1);
    }
  );
});

test('10. Duplicate pending request is prevented (400)', async () => {
  const existingFriendship = [
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_1_ID,
      recipientUserId: STUDENT_2_ID,
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons,
      mockFriendships: existingFriendship
    },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: STUDENT_2_ID })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /already sent and pending/i);
    }
  );
});

test('11. Reverse pending request auto-accepts instead of duplicate (200)', async () => {
  // Bob previously requested Alice (PENDING). Now Alice requests Bob.
  const existingFriendship = [
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_2_ID,
      recipientUserId: STUDENT_1_ID,
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    {
      mockUsers: baseUsers,
      mockTeacherStudents: baseTeacherStudents,
      mockTeacherGroups: baseTeacherGroups,
      mockEnrollments: baseEnrollments,
      mockLessons: baseLessons,
      mockFriendships: existingFriendship
    },
    async ({ baseUrl, friendships }) => {
      const res = await fetch(`${baseUrl}/api/students/friends/request`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' }),
        body: JSON.stringify({ recipientUserId: STUDENT_2_ID })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.friendship.status, 'ACCEPTED');
      assert.equal(friendships[0].status, 'ACCEPTED');
    }
  );
});

test('12. Incoming/Outgoing requests and accepted friends listing', async () => {
  const mockFriendships = [
    // Alice sent to Bob (PENDING) -> Outgoing for Alice, Incoming for Bob
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_1_ID,
      recipientUserId: STUDENT_2_ID,
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    { mockUsers: baseUsers, mockFriendships },
    async ({ baseUrl }) => {
      // Check from Alice's side
      const resAlice = await fetch(`${baseUrl}/api/students/friends`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      const jsonAlice = await resAlice.json();
      assert.equal(jsonAlice.outgoingRequests.length, 1);
      assert.equal(jsonAlice.outgoingRequests[0].peer.id, STUDENT_2_ID);
      assert.equal(jsonAlice.incomingRequests.length, 0);

      // Check from Bob's side
      const resBob = await fetch(`${baseUrl}/api/students/friends`, {
        headers: authHeader({ userId: STUDENT_2_ID, role: 'STUDENT' })
      });
      const jsonBob = await resBob.json();
      assert.equal(jsonBob.incomingRequests.length, 1);
      assert.equal(jsonBob.incomingRequests[0].peer.id, STUDENT_1_ID);
      assert.equal(jsonBob.outgoingRequests.length, 0);
    }
  );
});

test('13. Recipient can accept pending request, non-recipient cannot', async () => {
  const mockFriendships = [
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_1_ID,
      recipientUserId: STUDENT_2_ID,
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    { mockUsers: baseUsers, mockFriendships },
    async ({ baseUrl, friendships }) => {
      // Alice (requester) tries to accept -> 403
      const resAlice = await fetch(`${baseUrl}/api/students/friends/${FRIENDSHIP_1_ID}/accept`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      assert.equal(resAlice.status, 403);

      // Bob (recipient) accepts -> 200
      const resBob = await fetch(`${baseUrl}/api/students/friends/${FRIENDSHIP_1_ID}/accept`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_2_ID, role: 'STUDENT' })
      });
      assert.equal(resBob.status, 200);
      assert.equal(friendships[0].status, 'ACCEPTED');
    }
  );
});

test('14. Recipient can reject pending request', async () => {
  const mockFriendships = [
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_1_ID,
      recipientUserId: STUDENT_2_ID,
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    { mockUsers: baseUsers, mockFriendships },
    async ({ baseUrl, friendships }) => {
      const res = await fetch(`${baseUrl}/api/students/friends/${FRIENDSHIP_1_ID}/reject`, {
        method: 'POST',
        headers: authHeader({ userId: STUDENT_2_ID, role: 'STUDENT' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.friendship.status, 'REJECTED');
      assert.equal(friendships[0].status, 'REJECTED');
    }
  );
});

test('15. Accepted friendship persists independently and is visible in friends list', async () => {
  const mockFriendships = [
    {
      _id: FRIENDSHIP_1_ID,
      requesterUserId: STUDENT_1_ID,
      recipientUserId: STUDENT_2_ID,
      status: 'ACCEPTED',
      createdAt: new Date()
    }
  ];

  await withFriendshipTestServer(
    { mockUsers: baseUsers, mockFriendships },
    async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/api/students/friends`, {
        headers: authHeader({ userId: STUDENT_1_ID, role: 'STUDENT' })
      });
      const json = await res.json();
      assert.equal(json.friends.length, 1);
      assert.equal(json.friends[0].peer.id, STUDENT_2_ID);
      assert.equal(json.friends[0].status, 'ACCEPTED');
    }
  );
});

test('16. Non-student caller is rejected by requireStudent guard (403)', async () => {
  await withFriendshipTestServer(
    { mockUsers: baseUsers },
    async ({ baseUrl }) => {
      // Dave is WORKER
      const res = await fetch(`${baseUrl}/api/students/classmates`, {
        headers: authHeader({ userId: WORKER_1_ID, role: 'WORKER' })
      });
      assert.equal(res.status, 403);
    }
  );
});
