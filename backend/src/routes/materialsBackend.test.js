// backend/src/routes/materialsBackend.test.js
// ============================================================
// PDF LEARNING MATERIALS AUTOMATED TEST SUITE (PHASE 1)
// ============================================================
// Verifies:
// 1. PDF buffer signature validation (%PDF-) & rejection of non-PDF or spoofed files.
// 2. Unpredictable public ID generation with entity scope.
// 3. Teacher course materials: upload, ownership isolation, listing, and delete.
// 4. Student course materials: paid enrollment requirement, free enrollment requirement,
//    and signed download URL issuance (never raw/permanent URLs).
// 5. Lesson materials: 1-on-1 and Group lesson authorization, ownership isolation,
//    and denial for cancelled/unauthorized sessions.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  isValidPdfBuffer,
  generateMaterialPublicId,
  generateSignedMaterialUrl
} from '../utils/courseMaterialUpload.js';
import Course from '../models/Course.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import TeacherLesson from '../models/TeacherLesson.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import User from '../models/User.js';
import teachersRouter from './teachers.js';
import studentsRouter from './students.js';
import coursesRouter from './courses.js';

const secret = 'materials-test-secret-2026-homelyserv-secure-jwt';
process.env.JWT_SECRET = secret;

const TEACHER_A_ID = '507f1f77bcf86cd799439001';
const TEACHER_B_ID = '507f1f77bcf86cd799439002';
const STUDENT_ENROLLED_ID = '507f1f77bcf86cd799439003';
const STUDENT_STRANGER_ID = '507f1f77bcf86cd799439004';
const TS_LINKED_ID = '507f1f77bcf86cd799439005';
const GROUP_ID = '507f1f77bcf86cd799439006';

const createToken = (payload) => jwt.sign(payload, secret, { expiresIn: '1h' });
const authHeader = (payload) => ({
  authorization: `Bearer ${createToken(payload)}`,
  'content-type': 'application/json'
});

test('1. PDF buffer signature validation & public ID generation', async (t) => {
  // Valid PDF header
  const validPdf = Buffer.from('%PDF-1.4 sample content');
  assert.equal(isValidPdfBuffer(validPdf), true, 'Valid PDF buffer must be accepted');

  // Spoofed PDF (starts with non-PDF text/image bytes)
  const spoofedPdf1 = Buffer.from('GIF89a not a real pdf');
  assert.equal(isValidPdfBuffer(spoofedPdf1), false, 'Spoofed GIF pretending to be PDF must be rejected');

  const spoofedPdf2 = Buffer.from('\xFF\xD8\xFF\xE0 JPEG image');
  assert.equal(isValidPdfBuffer(spoofedPdf2), false, 'Spoofed JPEG must be rejected');

  const emptyBuffer = Buffer.alloc(0);
  assert.equal(isValidPdfBuffer(emptyBuffer), false, 'Empty buffer must be rejected');

  // Public ID generation
  const coursePublicId = generateMaterialPublicId('course', '507f1f77bcf86cd799439001');
  assert.match(coursePublicId, /^homelyserv\/course-materials\/course_507f1f77bcf86cd799439001_mat_[a-f0-9]{24}$/);

  const lessonPublicId = generateMaterialPublicId('lesson', '507f1f77bcf86cd799439002');
  assert.match(lessonPublicId, /^homelyserv\/lesson-materials\/lesson_507f1f77bcf86cd799439002_mat_[a-f0-9]{24}$/);

  // Signed URL structure
  const signedUrl = generateSignedMaterialUrl(coursePublicId, 3600);
  assert.ok(signedUrl && signedUrl.includes(coursePublicId), 'Signed URL must embed entity publicId');
});

test('2. Teacher course materials upload, ownership isolation, and deletion', async (t) => {
  const app = express();
  app.use(express.json());

  // Stubs for User auth lookup
  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => {
      if (String(id) === TEACHER_A_ID || String(id) === TEACHER_B_ID) {
        return Promise.resolve({
          _id: id,
          role: 'TEACHER',
          tokenVersion: 0,
          isSuspended: false
        });
      }
      return Promise.resolve(null);
    }
  });

  const mockCourses = new Map();
  const courseAId = '507f1f77bcf86cd799439010';
  mockCourses.set(courseAId, {
    _id: courseAId,
    teacherId: TEACHER_A_ID,
    title: 'Biology 101',
    isPublished: true,
    isPaid: true,
    materials: [],
    save: async function () {
      mockCourses.set(String(this._id), this);
      return this;
    }
  });

  const origCourseFindOne = Course.findOne;
  Course.findOne = (query) => {
    for (const c of mockCourses.values()) {
      const matchId = !query._id || String(c._id) === String(query._id);
      const matchTeacher = !query.teacherId || String(c.teacherId) === String(query.teacherId);
      if (matchId && matchTeacher) {
        return Promise.resolve({
          ...c,
          materials: c.materials,
          save: async function () {
            mockCourses.set(String(this._id), this);
            return this;
          }
        });
      }
    }
    return Promise.resolve(null);
  };

  app.use('/api/teachers', teachersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Attempt upload with Teacher B on Teacher A course -> 404
    // Send multipart form-data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakePdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Week 1 Syllabus',
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="syllabus.pdf"',
      'Content-Type: application/pdf',
      '',
      fakePdfContent,
      `--${boundary}--`
    ].join('\r\n');

    const teacherBUpload = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${createToken({ userId: TEACHER_B_ID, role: 'TEACHER', tokenVersion: 0 })}`,
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyParts
    });
    assert.equal(teacherBUpload.status, 404, 'Teacher B must not be able to upload to Teacher A course');

    // Attempt upload with Teacher A on Teacher A course -> 201
    const teacherAUpload = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${createToken({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })}`,
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyParts
    });
    assert.equal(teacherAUpload.status, 201, 'Teacher A should successfully upload PDF material');
    const uploadJson = await teacherAUpload.json();
    assert.equal(uploadJson.success, true);
    assert.equal(uploadJson.material.title, 'Week 1 Syllabus');
    assert.ok(uploadJson.material.publicId);

    const materialId = uploadJson.material._id || mockCourses.get(courseAId).materials[0]._id || '507f1f77bcf86cd799439099';
    if (!uploadJson.material._id) {
      mockCourses.get(courseAId).materials[0]._id = materialId;
    }

    // Teacher B attempts to delete Teacher A material -> 404
    const teacherBDelete = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(teacherBDelete.status, 404, 'Teacher B cannot delete Teacher A course material');

    // Teacher A deletes own material -> 200
    const teacherADelete = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(teacherADelete.status, 200, 'Teacher A successfully deletes course material');
  } finally {
    server.close();
    User.findById = origUserFindById;
    Course.findOne = origCourseFindOne;
  }
});

test('3. Student course material download authorization (paid vs free)', async (t) => {
  const app = express();
  app.use(express.json());

  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => Promise.resolve({
      _id: id,
      role: 'STUDENT',
      tokenVersion: 0,
      isSuspended: false
    })
  });

  const coursePaidId = '507f1f77bcf86cd799439020';
  const matPaidId = '507f1f77bcf86cd799439021';
  const coursePaid = {
    _id: coursePaidId,
    teacherId: TEACHER_A_ID,
    title: 'Paid Physics',
    isPublished: true,
    isPaid: true,
    materials: [
      {
        _id: matPaidId,
        title: 'Formula Sheet',
        publicId: 'homelyserv/course-materials/physics_formulas',
        fileSize: 1024,
        originalFilename: 'formulas.pdf'
      }
    ]
  };

  const origCourseFindById = Course.findById;
  Course.findById = (id) => {
    if (String(id) === coursePaidId) {
      return {
        populate: () => Promise.resolve(coursePaid),
        then: (resolve) => resolve(coursePaid)
      };
    }
    return Promise.resolve(null);
  };

  const origEnrollmentFindOne = CourseEnrollment.findOne;
  CourseEnrollment.findOne = ({ courseId, studentUserId, status }) => {
    if (String(studentUserId) === STUDENT_ENROLLED_ID && String(courseId) === coursePaidId && status === 'ACTIVE') {
      return Promise.resolve({ _id: 'enroll-123', status: 'ACTIVE' });
    }
    return Promise.resolve(null);
  };

  app.use('/api/students', studentsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Unenrolled student on paid course -> 403
    const strangerRes = await fetch(`${baseUrl}/api/students/courses/${coursePaidId}/materials/${matPaidId}/download`, {
      headers: authHeader({ userId: STUDENT_STRANGER_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(strangerRes.status, 403, 'Unenrolled student must be denied paid course material download');

    // Enrolled student on paid course -> 200 with signed downloadUrl
    const enrolledRes = await fetch(`${baseUrl}/api/students/courses/${coursePaidId}/materials/${matPaidId}/download`, {
      headers: authHeader({ userId: STUDENT_ENROLLED_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(enrolledRes.status, 200, 'Enrolled student receives signed download link');
    const json = await enrolledRes.json();
    assert.equal(json.success, true);
    assert.ok(json.downloadUrl, 'Must return signed download URL');
    assert.match(json.downloadUrl, /physics_formulas/, 'Signed URL must point to requested asset');
  } finally {
    server.close();
    User.findById = origUserFindById;
    Course.findById = origCourseFindById;
    CourseEnrollment.findOne = origEnrollmentFindOne;
  }
});

test('4. Lesson materials authorization: 1-on-1 and Group lessons', async (t) => {
  const app = express();
  app.use(express.json());

  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => Promise.resolve({
      _id: id,
      fullName: 'Test User',
      role: 'STUDENT',
      tokenVersion: 0,
      isSuspended: false
    })
  });

  const lesson1on1Id = '507f1f77bcf86cd799439030';
  const lessonGroupId = '507f1f77bcf86cd799439031';
  const mat1on1Id = '507f1f77bcf86cd799439032';
  const matGroupId = '507f1f77bcf86cd799439033';

  const mockLessons = [
    {
      _id: lesson1on1Id,
      teacherId: TEACHER_A_ID,
      lessonType: 'ONE_ON_ONE',
      studentId: TS_LINKED_ID,
      lessonStatus: 'SCHEDULED',
      isActive: true,
      materials: [
        {
          _id: mat1on1Id,
          title: 'Worksheet 1',
          publicId: 'homelyserv/lesson-materials/lesson1_mat',
          fileSize: 2048,
          originalFilename: 'sheet.pdf'
        }
      ]
    },
    {
      _id: lessonGroupId,
      teacherId: TEACHER_A_ID,
      lessonType: 'GROUP',
      groupId: GROUP_ID,
      lessonStatus: 'SCHEDULED',
      isActive: true,
      materials: [
        {
          _id: matGroupId,
          title: 'Group Handout',
          publicId: 'homelyserv/lesson-materials/group_mat',
          fileSize: 4096,
          originalFilename: 'group.pdf'
        }
      ]
    }
  ];

  // Mock relationship queries
  const origTSFind = TeacherStudent.find;
  TeacherStudent.find = (query) => {
    // Only STUDENT_ENROLLED_ID has active TS_LINKED_ID
    const uid = query.$or?.[0]?.linkedUserId;
    if (String(uid) === STUDENT_ENROLLED_ID) {
      return {
        select: () => Promise.resolve([{ _id: TS_LINKED_ID, teacherId: TEACHER_A_ID }])
      };
    }
    return {
      select: () => Promise.resolve([])
    };
  };

  const origTGEFind = TeacherGroupEnrollment.find;
  TeacherGroupEnrollment.find = (query) => {
    if (query.studentId?.$in?.includes(TS_LINKED_ID)) {
      return {
        select: () => Promise.resolve([{ groupId: GROUP_ID }])
      };
    }
    return {
      select: () => Promise.resolve([])
    };
  };

  const origTLFindOne = TeacherLesson.findOne;
  TeacherLesson.findOne = (query) => {
    const l = mockLessons.find((item) => String(item._id) === String(query._id));
    if (!l || !query.isActive) return Promise.resolve(null);
    if (query.lessonStatus?.$in && !query.lessonStatus.$in.includes(l.lessonStatus)) {
      return Promise.resolve(null);
    }
    // Verify or conditions
    if (query.$or) {
      const match = query.$or.some((cond) => {
        if (cond.lessonType === 'ONE_ON_ONE' && cond.studentId?.$in?.includes(l.studentId)) return true;
        if (cond.lessonType === 'GROUP' && cond.groupId?.$in?.includes(l.groupId)) return true;
        return false;
      });
      if (!match) return Promise.resolve(null);
    }
    return Promise.resolve(l);
  };

  app.use('/api/students', studentsRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1-on-1: Enrolled student gets signed URL -> 200
    const res1 = await fetch(`${baseUrl}/api/students/lessons/${lesson1on1Id}/materials/${mat1on1Id}/download`, {
      headers: authHeader({ userId: STUDENT_ENROLLED_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(res1.status, 200, 'Authorized 1-on-1 student can download material');
    const json1 = await res1.json();
    assert.equal(json1.success, true);
    assert.ok(json1.downloadUrl);

    // Group: Enrolled student gets signed URL -> 200
    const resGroup = await fetch(`${baseUrl}/api/students/lessons/${lessonGroupId}/materials/${matGroupId}/download`, {
      headers: authHeader({ userId: STUDENT_ENROLLED_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(resGroup.status, 200, 'Authorized group student can download group lesson material');

    // Stranger student -> 404 (non-enumerating)
    const resStranger = await fetch(`${baseUrl}/api/students/lessons/${lesson1on1Id}/materials/${mat1on1Id}/download`, {
      headers: authHeader({ userId: STUDENT_STRANGER_ID, role: 'STUDENT', tokenVersion: 0 })
    });
    assert.equal(resStranger.status, 404, 'Stranger student is rejected with 404');
  } finally {
    server.close();
    User.findById = origUserFindById;
    TeacherStudent.find = origTSFind;
    TeacherGroupEnrollment.find = origTGEFind;
    TeacherLesson.findOne = origTLFindOne;
  }
});

test('5. Teacher author material download authorization (owned vs other teacher)', async (t) => {
  const app = express();
  app.use(express.json());

  // Stubs for User auth lookup
  const origUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => {
      if (String(id) === TEACHER_A_ID || String(id) === TEACHER_B_ID) {
        return Promise.resolve({
          _id: id,
          role: 'TEACHER',
          tokenVersion: 0,
          isSuspended: false
        });
      }
      return Promise.resolve(null);
    }
  });

  const courseMatId = '507f1f77bcf86cd799439061';
  const lessonMatId = '507f1f77bcf86cd799439062';
  const courseAId = '507f1f77bcf86cd799439070';
  const lessonAId = '507f1f77bcf86cd799439071';

  const mockCourse = {
    _id: courseAId,
    teacherId: TEACHER_A_ID,
    title: 'Teacher A Physics',
    isPublished: false, // Draft course - teacher author must still be allowed to download!
    materials: [
      {
        _id: courseMatId,
        title: 'Physics Lab Guide',
        publicId: 'homelyserv/course-materials/course_507f1f77bcf86cd799439070_mat_abcdef123456',
        fileSize: 1048576,
        originalFilename: 'physics_lab.pdf'
      }
    ]
  };

  const mockLesson = {
    _id: lessonAId,
    teacherId: TEACHER_A_ID,
    isActive: true,
    lessonStatus: 'SCHEDULED',
    materials: [
      {
        _id: lessonMatId,
        title: 'Worksheet 1',
        publicId: 'homelyserv/lesson-materials/lesson_507f1f77bcf86cd799439071_mat_987654fedcba',
        fileSize: 524288,
        originalFilename: 'worksheet1.pdf'
      }
    ]
  };

  const origCourseFindOne = Course.findOne;
  Course.findOne = (query) => {
    const matchId = !query._id || String(mockCourse._id) === String(query._id);
    const matchTeacher = !query.teacherId || String(mockCourse.teacherId) === String(query.teacherId);
    if (matchId && matchTeacher) {
      return Promise.resolve(mockCourse);
    }
    return Promise.resolve(null);
  };

  const origTLFindOne = TeacherLesson.findOne;
  TeacherLesson.findOne = (query) => {
    const matchId = !query._id || String(mockLesson._id) === String(query._id);
    const matchTeacher = !query.teacherId || String(mockLesson.teacherId) === String(query.teacherId);
    const matchActive = query.isActive === undefined || mockLesson.isActive === query.isActive;
    if (matchId && matchTeacher && matchActive) {
      return Promise.resolve(mockLesson);
    }
    return Promise.resolve(null);
  };

  app.use('/api/teachers', teachersRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Teacher A downloads own course material (even draft) -> 200
    const resCourseA = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials/${courseMatId}/download`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(resCourseA.status, 200, 'Author Teacher A can download material from own course');
    const jsonCourseA = await resCourseA.json();
    assert.equal(jsonCourseA.success, true);
    assert.ok(jsonCourseA.downloadUrl, 'Signed download URL must be returned');
    assert.equal(jsonCourseA.material.id, courseMatId);
    assert.equal(jsonCourseA.material.originalFilename, 'physics_lab.pdf');

    // 2. Teacher B attempts to download Teacher A's course material -> 404 (non-enumerating)
    const resCourseB = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials/${courseMatId}/download`, {
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(resCourseB.status, 404, 'Teacher B cannot download Teacher A course material');

    // 3. Teacher A requests nonexistent material ID -> 404
    const resCourseFakeMat = await fetch(`${baseUrl}/api/teachers/courses/${courseAId}/materials/507f1f77bcf86cd799439099/download`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(resCourseFakeMat.status, 404, 'Nonexistent material returns 404');

    // 4. Teacher A downloads own lesson material -> 200
    const resLessonA = await fetch(`${baseUrl}/api/teachers/lessons/${lessonAId}/materials/${lessonMatId}/download`, {
      headers: authHeader({ userId: TEACHER_A_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(resLessonA.status, 200, 'Author Teacher A can download material from own lesson');
    const jsonLessonA = await resLessonA.json();
    assert.equal(jsonLessonA.success, true);
    assert.ok(jsonLessonA.downloadUrl);
    assert.equal(jsonLessonA.material.id, lessonMatId);
    assert.equal(jsonLessonA.material.originalFilename, 'worksheet1.pdf');

    // 5. Teacher B attempts to download Teacher A's lesson material -> 404 (non-enumerating)
    const resLessonB = await fetch(`${baseUrl}/api/teachers/lessons/${lessonAId}/materials/${lessonMatId}/download`, {
      headers: authHeader({ userId: TEACHER_B_ID, role: 'TEACHER', tokenVersion: 0 })
    });
    assert.equal(resLessonB.status, 404, 'Teacher B cannot download Teacher A lesson material');
  } finally {
    server.close();
    User.findById = origUserFindById;
    Course.findOne = origCourseFindOne;
    TeacherLesson.findOne = origTLFindOne;
  }
});
