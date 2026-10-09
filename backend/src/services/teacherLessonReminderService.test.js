// backend/src/services/teacherLessonReminderService.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import ParentStudent from '../models/ParentStudent.js';
import notificationService from './notificationService.js';
import {
  getLessonStartDateTime,
  resolveLessonRecipients,
  processLessonReminderWindow,
  checkAndDispatchTeacherLessonReminders
} from './teacherLessonReminderService.js';

test('Teacher Lesson Reminder Service', async (t) => {
  const TEACHER_USER_ID = '507f1f77bcf86cd799439001';
  const STUDENT_USER_ID = '507f1f77bcf86cd799439002';
  const PARENT_USER_ID = '507f1f77bcf86cd799439003';
  const UNRELATED_PARENT_ID = '507f1f77bcf86cd799439004';
  const UNRELATED_STUDENT_ID = '507f1f77bcf86cd799439005';

  await t.test('1. getLessonStartDateTime calculates correct UTC date and handles invalid times', () => {
    const valid = getLessonStartDateTime('2026-10-10T00:00:00.000Z', '14:30');
    assert.equal(valid.getUTCFullYear(), 2026);
    assert.equal(valid.getUTCMonth(), 9); // October
    assert.equal(valid.getUTCDate(), 10);
    assert.equal(valid.getUTCHours(), 14);
    assert.equal(valid.getUTCMinutes(), 30);

    assert.equal(getLessonStartDateTime(null, '14:00'), null);
    assert.equal(getLessonStartDateTime('2026-10-10', 'invalid'), null);
    assert.equal(getLessonStartDateTime('invalid-date', '14:00'), null);
  });

  await t.test('2. resolveLessonRecipients resolves teacher, eligible student and active parent only', async () => {
    const origParentFind = ParentStudent.find;

    ParentStudent.find = (filter) => {
      assert.deepEqual(filter.relationshipStatus, 'ACTIVE');
      return {
        select: () => Promise.resolve([
          { parentUserId: PARENT_USER_ID }
        ])
      };
    };

    try {
      const lesson = {
        lessonType: 'ONE_ON_ONE',
        teacherId: TEACHER_USER_ID,
        studentId: {
          linkedUserId: STUDENT_USER_ID
        }
      };

      const recipients = await resolveLessonRecipients(lesson);
      assert.equal(recipients.teacherUserId, TEACHER_USER_ID);
      assert.deepEqual(recipients.studentUserIds, [STUDENT_USER_ID]);
      assert.deepEqual(recipients.parentUserIds, [PARENT_USER_ID]);
      assert.ok(!recipients.parentUserIds.includes(UNRELATED_PARENT_ID));
      assert.ok(!recipients.studentUserIds.includes(UNRELATED_STUDENT_ID));
    } finally {
      ParentStudent.find = origParentFind;
    }
  });

  await t.test('3. processLessonReminderWindow prevents duplicates and dispatches to all recipients', async () => {
    const origFindOneAndUpdate = TeacherLesson.findOneAndUpdate;
    const origCreateNotification = notificationService.createNotification;
    const origParentFind = ParentStudent.find;

    const dispatched = [];
    notificationService.createNotification = (userId, payload) => {
      dispatched.push({ userId, payload });
      return Promise.resolve({ id: 'notif-123' });
    };

    ParentStudent.find = () => ({
      select: () => Promise.resolve([{ parentUserId: PARENT_USER_ID }])
    });

    const mockLesson = {
      _id: '507f1f77bcf86cd799439010',
      lessonType: 'ONE_ON_ONE',
      teacherId: TEACHER_USER_ID,
      studentId: { fullName: 'Adam', linkedUserId: STUDENT_USER_ID },
      subject: 'Mathematics',
      date: new Date('2026-10-10T00:00:00.000Z'),
      startTime: '10:00',
      remindersSent: { h24: false, h1: false }
    };

    let callCount = 0;
    TeacherLesson.findOneAndUpdate = (query) => {
      callCount++;
      if (query['remindersSent.h24']?.$ne === true && callCount === 1) {
        return {
          populate: () => ({
            populate: () => Promise.resolve({
              ...mockLesson,
              remindersSent: { h24: true, h1: false }
            })
          })
        };
      }
      return {
        populate: () => ({
          populate: () => Promise.resolve(null)
        })
      };
    };

    try {
      // First run: should dispatch
      const first = await processLessonReminderWindow(mockLesson, 'h24', '24 hours');
      assert.equal(first, true);
      assert.equal(dispatched.length, 3); // teacher + student + parent
      assert.equal(dispatched[0].userId, TEACHER_USER_ID);
      assert.equal(dispatched[1].userId, STUDENT_USER_ID);
      assert.equal(dispatched[2].userId, PARENT_USER_ID);

      // Second run: duplicate call should be blocked by atomic query
      const second = await processLessonReminderWindow(mockLesson, 'h24', '24 hours');
      assert.equal(second, false);
      assert.equal(dispatched.length, 3); // no new notifications
    } finally {
      TeacherLesson.findOneAndUpdate = origFindOneAndUpdate;
      notificationService.createNotification = origCreateNotification;
      ParentStudent.find = origParentFind;
    }
  });

  await t.test('4. checkAndDispatchTeacherLessonReminders skips cancelled/completed and outside window', async () => {
    const origFind = TeacherLesson.find;
    const origFindOneAndUpdate = TeacherLesson.findOneAndUpdate;
    const origCreateNotification = notificationService.createNotification;
    const origParentFind = ParentStudent.find;

    const dispatched = [];
    notificationService.createNotification = (userId, payload) => {
      dispatched.push({ userId, payload });
      return Promise.resolve({ id: 'notif-123' });
    };

    ParentStudent.find = () => ({
      select: () => Promise.resolve([])
    });

    // Reference now: 2026-10-10 10:00 UTC
    const mockNow = new Date('2026-10-10T10:00:00.000Z');

    // Lesson A: in 24 hours (2026-10-11 at 10:00 UTC) -> should receive 24h
    // Lesson B: in 1 hour (2026-10-10 at 11:00 UTC) -> should receive 1h
    // Lesson C: in 5 hours (2026-10-10 at 15:00 UTC) -> outside both windows
    const lessons = [
      {
        _id: '507f1f77bcf86cd799439021',
        teacherId: TEACHER_USER_ID,
        date: new Date('2026-10-11T00:00:00.000Z'),
        startTime: '10:00',
        lessonType: 'ONE_ON_ONE',
        studentId: null,
        remindersSent: { h24: false, h1: false }
      },
      {
        _id: '507f1f77bcf86cd799439022',
        teacherId: TEACHER_USER_ID,
        date: new Date('2026-10-10T00:00:00.000Z'),
        startTime: '11:00',
        lessonType: 'ONE_ON_ONE',
        studentId: null,
        remindersSent: { h24: false, h1: false }
      },
      {
        _id: '507f1f77bcf86cd799439023',
        teacherId: TEACHER_USER_ID,
        date: new Date('2026-10-10T00:00:00.000Z'),
        startTime: '15:00',
        lessonType: 'ONE_ON_ONE',
        studentId: null,
        remindersSent: { h24: false, h1: false }
      }
    ];

    TeacherLesson.find = () => ({
      lean: () => Promise.resolve(lessons)
    });

    TeacherLesson.findOneAndUpdate = (query) => {
      const target = lessons.find((l) => String(l._id) === String(query._id));
      if (!target) return { populate: () => ({ populate: () => Promise.resolve(null) }) };
      return {
        populate: () => ({
          populate: () => Promise.resolve(target)
        })
      };
    };

    try {
      const res = await checkAndDispatchTeacherLessonReminders(mockNow);
      assert.equal(res.checked, 3);
      assert.equal(res.sent24h, 1);
      assert.equal(res.sent1h, 1);
      assert.equal(dispatched.length, 2); // 1 for 24h teacher, 1 for 1h teacher
    } finally {
      TeacherLesson.find = origFind;
      TeacherLesson.findOneAndUpdate = origFindOneAndUpdate;
      notificationService.createNotification = origCreateNotification;
      ParentStudent.find = origParentFind;
    }
  });

  await t.test('5. processLessonReminderWindow safely skips CANCELLED or COMPLETED lessons', async () => {
    const origFindOneAndUpdate = TeacherLesson.findOneAndUpdate;

    TeacherLesson.findOneAndUpdate = (query) => {
      // Query requires lessonStatus: 'SCHEDULED'
      if (query.lessonStatus === 'SCHEDULED' && query._id === 'cancelled-id') {
        return { populate: () => ({ populate: () => Promise.resolve(null) }) };
      }
      return { populate: () => ({ populate: () => Promise.resolve(null) }) };
    };

    try {
      const cancelledLesson = {
        _id: 'cancelled-id',
        lessonStatus: 'CANCELLED',
        teacherId: TEACHER_USER_ID,
        remindersSent: { h24: false, h1: false }
      };

      const result = await processLessonReminderWindow(cancelledLesson, 'h24', '24 hours');
      assert.equal(result, false);
    } finally {
      TeacherLesson.findOneAndUpdate = origFindOneAndUpdate;
    }
  });

  await t.test('6. Rescheduled lesson resets reminder flags and allows re-dispatching reminders', async () => {
    const origFindOneAndUpdate = TeacherLesson.findOneAndUpdate;
    const origCreateNotification = notificationService.createNotification;
    const origParentFind = ParentStudent.find;

    const dispatched = [];
    notificationService.createNotification = (userId, payload) => {
      dispatched.push({ userId, payload });
      return Promise.resolve({ id: 'notif-rescheduled' });
    };

    ParentStudent.find = () => ({
      select: () => Promise.resolve([])
    });

    // Simulating lesson previously reminded, then rescheduled (flags reset to false)
    const rescheduledLesson = {
      _id: '507f1f77bcf86cd799439099',
      lessonType: 'ONE_ON_ONE',
      teacherId: TEACHER_USER_ID,
      studentId: null,
      subject: 'Physics',
      date: new Date('2026-10-12T00:00:00.000Z'),
      startTime: '16:00',
      remindersSent: { h24: false, h1: false } // reset after rescheduling
    };

    TeacherLesson.findOneAndUpdate = (query) => {
      if (query['remindersSent.h24']?.$ne === true) {
        return {
          populate: () => ({
            populate: () => Promise.resolve({
              ...rescheduledLesson,
              remindersSent: { h24: true, h1: false }
            })
          })
        };
      }
      return { populate: () => ({ populate: () => Promise.resolve(null) }) };
    };

    try {
      const res = await processLessonReminderWindow(rescheduledLesson, 'h24', '24 hours');
      assert.equal(res, true);
      assert.equal(dispatched.length, 1);
      assert.equal(dispatched[0].userId, TEACHER_USER_ID);
    } finally {
      TeacherLesson.findOneAndUpdate = origFindOneAndUpdate;
      notificationService.createNotification = origCreateNotification;
      ParentStudent.find = origParentFind;
    }
  });
});
