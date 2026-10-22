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
import {
  getHistoricalDay,
  getLastKnownLocation,
  getTodayHistory,
  getTrackingStatus,
  approveStudentTrackingSafeguard,
  completeNativeTrackingActivation,
  disableTracking,
  pauseTracking,
  receiveLocationObservations,
  requestTrackingActivation,
  reportTrackingStatus
} from '../controllers/familyTrackingController.js';
import { createFamilyTrackingRateLimit } from '../middleware/familyTrackingRateLimit.js';

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const protectTrackingResponse = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

router.use((req, res, next) => (
  req.path.includes('/tracking/') ? protectTrackingResponse(req, res, next) : next()
));

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

const trackingReadLimit = createFamilyTrackingRateLimit({ windowMs: 60_000, maximum: 60 });
const trackingWriteLimit = createFamilyTrackingRateLimit({ windowMs: 60_000, maximum: 12 });
const observationLimit = createFamilyTrackingRateLimit({
  windowMs: 60_000,
  maximum: 120,
  cost: (req) => Array.isArray(req.body?.observations) ? req.body.observations.length : 1
});

router.post('/:studentId/tracking/activation/request', trackingWriteLimit, asyncHandler(requestTrackingActivation));
router.post('/:studentId/tracking/activation/guardian-approve', trackingWriteLimit, asyncHandler(approveStudentTrackingSafeguard));
router.post('/:studentId/tracking/activation/native-complete', trackingWriteLimit, asyncHandler(completeNativeTrackingActivation));
router.post('/:studentId/tracking/pause', trackingWriteLimit, asyncHandler(pauseTracking));
router.post('/:studentId/tracking/disable', trackingWriteLimit, asyncHandler(disableTracking));
router.put('/:studentId/tracking/status', trackingWriteLimit, asyncHandler(reportTrackingStatus));
router.post('/:studentId/tracking/observations', trackingWriteLimit, observationLimit, asyncHandler(receiveLocationObservations));
router.get('/:studentId/tracking/status', trackingReadLimit, asyncHandler(getTrackingStatus));
router.get('/:studentId/tracking/current', trackingReadLimit, asyncHandler(getLastKnownLocation));
router.get('/:studentId/tracking/history/today', trackingReadLimit, asyncHandler(getTodayHistory));
router.get('/:studentId/tracking/history/:date', trackingReadLimit, asyncHandler(getHistoricalDay));

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
