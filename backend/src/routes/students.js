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
  getStudentDashboardSummary
} from '../controllers/studentDashboardController.js';
import {
  getStudentTeachers,
  getStudentTeacherById,
  acceptStudentTeacher,
  endStudentTeacher
} from '../controllers/studentTeacherController.js';
import {
  getStudentLessons,
  getStudentLessonById,
  submitStudentHomework,
  getLessonMaterialDownloadUrl
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
import {
  createStudentBooking,
  getStudentBookings,
  getStudentBookingById,
  cancelStudentBooking
} from '../controllers/studentBookingController.js';
import {
  searchClassmates,
  sendFriendRequest,
  getStudentFriends,
  acceptFriendRequest,
  rejectFriendRequest
} from '../controllers/studentFriendshipController.js';
import {
  enrollInFreeCourse,
  getMyEnrolledCourses,
  getCourseMaterialDownloadUrl
} from '../controllers/studentCourseController.js';

const router = express.Router();

// Student Profile & Dashboard endpoints
router.get('/profile', requireStudent, getStudentProfile);
router.put('/profile', requireStudent, updateStudentProfile);
router.get('/dashboard/summary', requireStudent, getStudentDashboardSummary);

// Student Teacher Discovery & Requests
router.get('/teachers/discover', requireStudent, discoverTeachers);
router.post('/teachers/:teacherId/request', requireStudent, requestTeacherConnection);
router.post('/teachers/:teacherId/cancel-request', requireStudent, cancelTeacherRequest);

// Student My Teacher / Teacher Relationships endpoints
router.get('/teachers', requireStudent, getStudentTeachers);
router.get('/teachers/:id', requireStudent, getStudentTeacherById);
router.post('/teachers/:id/accept', requireStudent, acceptStudentTeacher);
router.post('/teachers/:id/end', requireStudent, endStudentTeacher);

// Student Lesson Bookings endpoints (Phase 6A)
router.post('/bookings', requireStudent, createStudentBooking);
router.get('/bookings', requireStudent, getStudentBookings);
router.get('/bookings/:id', requireStudent, getStudentBookingById);
router.post('/bookings/:id/cancel', requireStudent, cancelStudentBooking);

// Student Lessons / Schedule endpoints
router.get('/lessons', requireStudent, getStudentLessons);
router.get('/lessons/:id', requireStudent, getStudentLessonById);
router.put('/lessons/:id/homework', requireStudent, submitStudentHomework);
router.get('/lessons/:id/materials/:materialId/download', requireStudent, getLessonMaterialDownloadUrl);

// Student Progress endpoints (READ-ONLY)
router.get('/progress/overview', requireStudent, getStudentProgressOverview);
router.get('/progress/assessments', requireStudent, getStudentAssessments);
router.get('/progress/assessments/:id', requireStudent, getStudentAssessmentById);

// Student Classmates & Friendship endpoints (Phase 9A)
router.get('/classmates', requireStudent, searchClassmates);
router.post('/friends/request', requireStudent, sendFriendRequest);
router.get('/friends', requireStudent, getStudentFriends);
router.post('/friends/:id/accept', requireStudent, acceptFriendRequest);
router.post('/friends/:id/reject', requireStudent, rejectFriendRequest);

// Student Recorded Courses endpoints (Phase 1 LMS)
router.get('/courses/enrolled', requireStudent, getMyEnrolledCourses);
router.post('/courses/:id/enroll', requireStudent, enrollInFreeCourse);
router.get('/courses/:id/materials/:materialId/download', requireStudent, getCourseMaterialDownloadUrl);

export default router;
