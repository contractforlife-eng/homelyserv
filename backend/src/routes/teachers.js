// backend/src/routes/teachers.js
import express from 'express';
import { requireTeacher } from '../middleware/auth.js';
import { getTeacherProfile, updateTeacherProfile } from '../controllers/teacherProfileController.js';
import {
  getTeacherStudents,
  getTeacherStudentById,
  createTeacherStudent,
  updateTeacherStudent,
  deleteTeacherStudent,
  acceptTeacherStudent,
  rejectTeacherStudent
} from '../controllers/teacherStudentController.js';
import {
  getTeacherGroups,
  getTeacherGroupById,
  createTeacherGroup,
  updateTeacherGroup,
  deleteTeacherGroup,
  getGroupStudents,
  enrollStudentInGroup,
  removeStudentFromGroup
} from '../controllers/teacherGroupController.js';
import {
  getTeacherLessons,
  getTeacherLessonById,
  createTeacherLesson,
  updateTeacherLesson,
  updateLessonAttendance,
  deleteTeacherLesson,
  recordLessonFee
} from '../controllers/teacherLessonController.js';
import {
  getTeacherBookings,
  getTeacherBookingById,
  acceptTeacherBooking,
  rejectTeacherBooking
} from '../controllers/teacherBookingController.js';
import {
  getTeacherIncome,
  createTeacherIncome,
  updateTeacherIncome,
  deleteTeacherIncome,
  getTeacherExpenses,
  createTeacherExpense,
  updateTeacherExpense,
  deleteTeacherExpense,
  getTeacherAccountsSummary,
  getTeacherIncomeDocument
} from '../controllers/teacherAccountsController.js';
import teacherProgressRoutes from './teacherProgressRoutes.js';
import { getTeacherPromotionHistory } from '../controllers/teacherPromotionController.js';
import { isUserPremium } from '../services/premiumService.js';
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

const router = express.Router();

// Middleware: Require active Premium status for Teacher Accounts
const requirePremiumTeacher = async (req, res, next) => {
  try {
    const hasPremium = await isUserPremium(req.userId);
    if (!hasPremium) {
      return res.status(403).json({
        success: false,
        message: 'Teacher Accounts is a Premium-only feature. Please upgrade your subscription.'
      });
    }
    next();
  } catch (err) {
    console.error('Error verifying teacher premium status:', err);
    return res.status(500).json({ success: false, message: 'Server error checking subscription' });
  }
};

// Teacher profile routes
router.get('/profile', requireTeacher, getTeacherProfile);
router.put('/profile', requireTeacher, updateTeacherProfile);

// Teacher student routes (all scoped by requireTeacher and req.userId)
router.get('/students', requireTeacher, getTeacherStudents);
router.get('/students/:id', requireTeacher, getTeacherStudentById);
router.post('/students', requireTeacher, createTeacherStudent);
router.post('/students/:id/accept', requireTeacher, acceptTeacherStudent);
router.post('/students/:id/reject', requireTeacher, rejectTeacherStudent);
router.put('/students/:id', requireTeacher, updateTeacherStudent);
router.delete('/students/:id', requireTeacher, deleteTeacherStudent);

// Teacher group routes (all scoped by requireTeacher and req.userId)
router.get('/groups', requireTeacher, getTeacherGroups);
router.get('/groups/:id', requireTeacher, getTeacherGroupById);
router.post('/groups', requireTeacher, createTeacherGroup);
router.put('/groups/:id', requireTeacher, updateTeacherGroup);
router.delete('/groups/:id', requireTeacher, deleteTeacherGroup);

// Teacher group enrollment routes
router.get('/groups/:groupId/students', requireTeacher, getGroupStudents);
router.post('/groups/:groupId/students', requireTeacher, enrollStudentInGroup);
router.delete('/groups/:groupId/students/:studentId', requireTeacher, removeStudentFromGroup);

// Teacher lesson routes (all scoped by requireTeacher and req.userId)
router.get('/lessons', requireTeacher, getTeacherLessons);
router.get('/lessons/:id', requireTeacher, getTeacherLessonById);
router.post('/lessons', requireTeacher, createTeacherLesson);
router.put('/lessons/:id', requireTeacher, updateTeacherLesson);
router.put('/lessons/:id/attendance', requireTeacher, updateLessonAttendance);
router.delete('/lessons/:id', requireTeacher, deleteTeacherLesson);
router.post('/lessons/:id/fee', requireTeacher, requirePremiumTeacher, recordLessonFee);

// Teacher lesson booking routes (Phase 6A, all scoped by requireTeacher and req.userId)
router.get('/bookings', requireTeacher, getTeacherBookings);
router.get('/bookings/:id', requireTeacher, getTeacherBookingById);
router.post('/bookings/:id/accept', requireTeacher, acceptTeacherBooking);
router.post('/bookings/:id/reject', requireTeacher, rejectTeacherBooking);

// ============================================================
// Teacher Accounts / Bookkeeping routes (Premium-only)
// ============================================================
router.get('/accounts/summary', requireTeacher, requirePremiumTeacher, getTeacherAccountsSummary);

router.get('/accounts/income', requireTeacher, requirePremiumTeacher, getTeacherIncome);
router.get('/accounts/income/:id/document', requireTeacher, requirePremiumTeacher, getTeacherIncomeDocument);
router.post('/accounts/income', requireTeacher, requirePremiumTeacher, createTeacherIncome);
router.put('/accounts/income/:id', requireTeacher, requirePremiumTeacher, updateTeacherIncome);
router.delete('/accounts/income/:id', requireTeacher, requirePremiumTeacher, deleteTeacherIncome);

router.get('/accounts/expenses', requireTeacher, requirePremiumTeacher, getTeacherExpenses);
router.post('/accounts/expenses', requireTeacher, requirePremiumTeacher, createTeacherExpense);
router.put('/accounts/expenses/:id', requireTeacher, requirePremiumTeacher, updateTeacherExpense);
router.delete('/accounts/expenses/:id', requireTeacher, requirePremiumTeacher, deleteTeacherExpense);

// ============================================================
// Teacher Student Progress / Assessments (Core feature)
// ============================================================
router.use('/progress', teacherProgressRoutes);

// ============================================================
// Teacher Promotion / Premium History (Core feature)
// ============================================================
router.get('/promotion-history', requireTeacher, getTeacherPromotionHistory);

// ============================================================
// Teacher Recorded Courses (Phase 1 LMS - Premium NOT required)
// ============================================================
router.get('/courses', requireTeacher, getTeacherCourses);
router.post('/courses', requireTeacher, createTeacherCourse);
router.post('/courses/upload-thumbnail', requireTeacher, upload.single('thumbnail'), uploadCourseThumbnail);
router.get('/courses/:id', requireTeacher, getTeacherCourseById);
router.put('/courses/:id', requireTeacher, updateTeacherCourse);
router.patch('/courses/:id/publish', requireTeacher, toggleCoursePublish);
router.delete('/courses/:id', requireTeacher, deleteTeacherCourse);

export default router;

