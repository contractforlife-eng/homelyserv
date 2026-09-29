// backend/src/routes/doctorAccounts.js
// ============================================================
// DOCTOR ACCOUNTS ROUTES (Step 1 — Income only)
// ============================================================
// Internal clinic accounting. Every route requires an authenticated
// Doctor (authenticate + requireDoctor) and is scoped to req.userId.
// Independent of every HomelyServ payment system and gateway.
// ============================================================
import express from 'express';
import { requireDoctor } from '../middleware/auth.js';
import {
  getDoctorIncome,
  createDoctorIncome,
  updateDoctorIncome,
  deleteDoctorIncome
} from '../controllers/doctorAccountsController.js';
import {
  getDoctorEmployees,
  createDoctorEmployee,
  updateDoctorEmployee,
  deleteDoctorEmployee
} from '../controllers/doctorAccountsController.js';
import {
  getDoctorExpenses,
  createDoctorExpense,
  updateDoctorExpense,
  deleteDoctorExpense
} from '../controllers/doctorAccountsController.js';
import { getDoctorAccountsSummary } from '../controllers/doctorAccountsController.js';
import {
  getDoctorEmployeeAdjustments,
  createDoctorEmployeeAdjustment,
  updateDoctorEmployeeAdjustment,
  deleteDoctorEmployeeAdjustment,
  getDoctorEmployeeSalaryPeriod,
  createDoctorEmployeeSalarySettlement,
  getDoctorEmployeeSettlements,
  getDoctorEmployeeSettlementById,
  reverseDoctorEmployeeSettlement
} from '../controllers/doctorAccountsController.js';

const router = express.Router();

// INCOME — money the doctor has actually received.
router.get('/income', requireDoctor, getDoctorIncome);
router.post('/income', requireDoctor, createDoctorIncome);
router.patch('/income/:id', requireDoctor, updateDoctorIncome);
router.delete('/income/:id', requireDoctor, deleteDoctorIncome);

// EMPLOYEES — the doctor's own clinic staff records.
router.get('/employees', requireDoctor, getDoctorEmployees);
router.post('/employees', requireDoctor, createDoctorEmployee);
router.patch('/employees/:id', requireDoctor, updateDoctorEmployee);
router.delete('/employees/:id', requireDoctor, deleteDoctorEmployee);

// EXPENSES — the doctor's own clinic cost records.
router.get('/expenses', requireDoctor, getDoctorExpenses);
router.post('/expenses', requireDoctor, createDoctorExpense);
router.patch('/expenses/:id', requireDoctor, updateDoctorExpense);
router.delete('/expenses/:id', requireDoctor, deleteDoctorExpense);

// SUMMARY — read-only financial + operational rollup.
router.get('/summary', requireDoctor, getDoctorAccountsSummary);

// EMPLOYEE SALARY ADJUSTMENTS — advances and penalties against one of the
// doctor's own employees. Bookkeeping only: never a DoctorExpense, never a
// payment, and never a change to the financial summary. Recovery/settlement
// is deliberately NOT part of this CRUD step.
router.get('/adjustments', requireDoctor, getDoctorEmployeeAdjustments);
router.post('/adjustments', requireDoctor, createDoctorEmployeeAdjustment);
router.patch('/adjustments/:id', requireDoctor, updateDoctorEmployeeAdjustment);
router.delete('/adjustments/:id', requireDoctor, deleteDoctorEmployeeAdjustment);

// READ-ONLY payroll view for one employee over a selected period. Calculation
// only: it never writes deductedAmount/status, settles nothing, and creates no
// payment. Declared after the /adjustments routes so it cannot shadow them.
router.get(
  '/employees/:employeeId/salary-period',
  requireDoctor,
  getDoctorEmployeeSalaryPeriod
);

// EXPLICIT settlement: the doctor confirms a salary period was paid. Unlike the
// read-only salary-period view above, this WRITES an immutable snapshot and
// recovers advances, inside a MongoDB transaction. View never settles.
router.post(
  '/employees/:employeeId/settlements',
  requireDoctor,
  createDoctorEmployeeSalarySettlement
);

// READ-ONLY settlement history. These return the STORED snapshot exactly as it
// was settled and never recompute it, never write, and never open a session or
// transaction. Declared after the POST above so they cannot shadow it.
router.get(
  '/employees/:employeeId/settlements',
  requireDoctor,
  getDoctorEmployeeSettlements
);
router.get(
  '/employees/:employeeId/settlements/:settlementId',
  requireDoctor,
  getDoctorEmployeeSettlementById
);

// EXPLICIT reversal: the doctor corrects a settled salary period. This WRITES
// — it restores the advances the period consumed and flips the original
// document SETTLED -> REVERSED inside a MongoDB transaction. It never creates a
// second document and never recalculates salary. Viewing still settles nothing.
router.post(
  '/employees/:employeeId/settlements/:settlementId/reversal',
  requireDoctor,
  reverseDoctorEmployeeSettlement
);

export default router;