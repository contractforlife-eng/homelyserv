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
  deleteTeacherLesson
} from '../controllers/teacherLessonController.js';
import {
  getTeacherIncome,
  createTeacherIncome,
  updateTeacherIncome,
  deleteTeacherIncome,
  getTeacherExpenses,
  createTeacherExpense,
  updateTeacherExpense,
  deleteTeacherExpense,
  getTeacherAccountsSummary
} from '../controllers/teacherAccountsController.js';
import teacherProgressRoutes from './teacherProgressRoutes.js';
import { getTeacherPromotionHistory } from '../controllers/teacherPromotionController.js';
import { isUserPremium } from '../services/premiumService.js';

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

// ============================================================
// Teacher Accounts / Bookkeeping routes (Premium-only)
// ============================================================
router.get('/accounts/summary', requireTeacher, requirePremiumTeacher, getTeacherAccountsSummary);

router.get('/accounts/income', requireTeacher, requirePremiumTeacher, getTeacherIncome);
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

export default router;

