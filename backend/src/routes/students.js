// backend/src/routes/students.js
// ============================================================
// STUDENT SYSTEM ROUTES
// ============================================================
// Authenticated student routes strictly guarded by requireStudent
// and scoped to req.userId.
// ============================================================
import express from 'express';
import { requireStudent } from '../middleware/auth.js';
import {
  getStudentProfile,
  updateStudentProfile
} from '../controllers/studentProfileController.js';
import {
  getStudentTeachers,
  getStudentTeacherById,
  acceptStudentTeacher,
  endStudentTeacher
} from '../controllers/studentTeacherController.js';
import {
  getStudentLessons,
  getStudentLessonById
} from '../controllers/studentLessonController.js';
import {
  getStudentProgressOverview,
  getStudentAssessments,
  getStudentAssessmentById
} from '../controllers/studentProgressController.js';

import {
  discoverTeachers,
  requestTeacherConnection,
  cancelTeacherRequest
} from '../controllers/studentTeacherDiscoveryController.js';

const router = express.Router();

// Student Profile endpoints
router.get('/profile', requireStudent, getStudentProfile);
router.put('/profile', requireStudent, updateStudentProfile);

// Student Teacher Discovery & Requests
router.get('/teachers/discover', requireStudent, discoverTeachers);
router.post('/teachers/:teacherId/request', requireStudent, requestTeacherConnection);
router.post('/teachers/:teacherId/cancel-request', requireStudent, cancelTeacherRequest);

// Student My Teacher / Teacher Relationships endpoints
router.get('/teachers', requireStudent, getStudentTeachers);
router.get('/teachers/:id', requireStudent, getStudentTeacherById);
router.post('/teachers/:id/accept', requireStudent, acceptStudentTeacher);
router.post('/teachers/:id/end', requireStudent, endStudentTeacher);

// Student Lessons / Schedule endpoints (READ-ONLY)
router.get('/lessons', requireStudent, getStudentLessons);
router.get('/lessons/:id', requireStudent, getStudentLessonById);

// Student Progress endpoints (READ-ONLY)
router.get('/progress/overview', requireStudent, getStudentProgressOverview);
router.get('/progress/assessments', requireStudent, getStudentAssessments);
router.get('/progress/assessments/:id', requireStudent, getStudentAssessmentById);

export default router;
