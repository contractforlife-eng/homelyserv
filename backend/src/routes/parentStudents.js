// backend/src/routes/parentStudents.js
// ============================================================
// PARENT-STUDENT ROUTES (PHASE 10)
//
// Mount point: /api/parent-students
// Strictly guarded by authenticate middleware and verified roles.
// ============================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getParentChildren,
  requestChildLink,
  getStudentIncomingRequests,
  acceptParentRequest,
  rejectParentRequest,
  cancelParentRequest,
  endParentStudentRelationship,
  getChildOverview,
  getChildTeachers,
  getChildLessons,
  getChildProgress,
  getChildHomework,
  getChildBookings,
  createChildBooking
} from '../controllers/parentStudentController.js';
// Teacher discovery & request for a linked child (parent-side)
import {
  discoverParentsTeachers,
  requestParentTeacher
} from '../controllers/parentTeacherDiscoveryController.js';

const router = express.Router();

// Apply base authentication to all parent-student endpoints
router.use(authenticate);

// 1. Parent relationship management
router.get('/', getParentChildren);
router.post('/request', requestChildLink);

// 2. Student response to incoming parent requests
router.get('/requests', getStudentIncomingRequests);
router.post('/:id/accept', acceptParentRequest);
router.post('/:id/reject', rejectParentRequest);

// 3. Request cancellation & ending
router.post('/:id/cancel', cancelParentRequest);
router.post('/:id/end', endParentStudentRelationship);

// 4. Controlled educational child views (Server validates ACTIVE relationship)
router.get('/:studentId/overview', getChildOverview);
router.get('/:studentId/teachers', getChildTeachers);
router.get('/:studentId/lessons', getChildLessons);
router.get('/:studentId/progress', getChildProgress);
router.get('/:studentId/homework', getChildHomework);
router.get('/:studentId/bookings', getChildBookings);
router.post('/:studentId/bookings', createChildBooking);

// Teacher discovery & request for a linked child (parent)
router.get('/:studentId/teachers/discover', discoverParentsTeachers);
router.post('/:studentId/teachers/:teacherId/request', requestParentTeacher);

export default router;
