// backend/src/routes/courses.js
// ============================================================
// COURSES ROUTER (HomelyServ LMS Phase 1)
// ============================================================
// Mounts:
// 1. Teacher course authoring routes: /api/teachers/courses (via requireTeacher)
// 2. Student course discovery & playback: /api/courses
// 3. Student enrollment & my courses: /api/students/courses (via requireStudent)
// ============================================================
import express from 'express';
import {
  authenticate,
  requireTeacher,
  requireStudent
} from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';
import {
  getTeacherCourses,
  getTeacherCourseById,
  createTeacherCourse,
  updateTeacherCourse,
  toggleCoursePublish,
  deleteTeacherCourse,
  uploadCourseThumbnail
} from '../controllers/teacherCourseController.js';
import {
  getPublishedCourses,
  getCourseDetails,
  enrollInFreeCourse,
  getMyEnrolledCourses
} from '../controllers/studentCourseController.js';

// Optional auth middleware: extracts req.userId if a valid JWT is present,
// but does NOT block or reject unauthenticated visitors.
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

const router = express.Router();

// ============================================================
// PUBLIC / CONSUMER COURSE DISCOVERY & DETAILS
// ============================================================
router.get('/', getPublishedCourses);
router.get('/:id', optionalAuth, getCourseDetails);

export default router;
export { optionalAuth };
