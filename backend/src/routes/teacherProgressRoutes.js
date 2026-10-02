// backend/src/routes/teacherProgressRoutes.js
// ============================================================
// TEACHER STUDENT PROGRESS ROUTES
// ============================================================
// Core Teacher feature (available to all authenticated teachers).
// Strictly scoped to req.userId via requireTeacher.
// ============================================================
import express from 'express';
import { requireTeacher } from '../middleware/auth.js';
import {
  getTeacherAssessments,
  getTeacherAssessmentById,
  createTeacherAssessment,
  updateTeacherAssessment,
  deleteTeacherAssessment,
  getStudentProgressSummary,
  getTeacherProgressOverview
} from '../controllers/teacherProgressController.js';

const router = express.Router();

// High-level overview
router.get('/overview', requireTeacher, getTeacherProgressOverview);

// Student detailed progress summary
router.get('/students/:studentId', requireTeacher, getStudentProgressSummary);

// Assessments CRUD
router.get('/assessments', requireTeacher, getTeacherAssessments);
router.post('/assessments', requireTeacher, createTeacherAssessment);
router.get('/assessments/:id', requireTeacher, getTeacherAssessmentById);
router.put('/assessments/:id', requireTeacher, updateTeacherAssessment);
router.delete('/assessments/:id', requireTeacher, deleteTeacherAssessment);

export default router;
