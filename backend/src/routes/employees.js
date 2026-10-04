// backend/src/routes/employees.js
// ============================================================
// EMPLOYEES ROUTES (shared: TEACHER + DOCTOR)
// ============================================================
// Role-aware front-end to the EXISTING Employee architecture. Only TEACHER and
// DOCTOR own employees on these routes; every other role is rejected here, and
// Employer behavior is left exactly as it is today.
// Ownership itself is enforced inside the controller through the scoped
// employee lookup, never from the request.
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getEmployees,
  createEmployee,
  updateEmployeeSalary,
  activateEmployee,
  deactivateEmployee,
  terminateEmployee,
} from '../controllers/employeeController.js';

const router = express.Router();

router.use(authenticate, authorize(['TEACHER', 'DOCTOR']));

router.get('/', getEmployees);
// MANUAL employee: staff added directly by the Teacher/Doctor. Writes only an
// owner-scoped Employee record - no Offer, Hire, payment or commission.
router.post('/', createEmployee);
router.patch('/:id/salary', updateEmployeeSalary);

// Employment lifecycle. Activate/deactivate only move `isActive`; terminate
// additionally records the permanent end via `terminatedAt`. None of them
// delete the employee or touch salary, hire, payment or expense data.
router.patch('/:id/activate', activateEmployee);
router.patch('/:id/deactivate', deactivateEmployee);
router.patch('/:id/terminate', terminateEmployee);

export default router;