// backend/src/controllers/doctorAccountsController.js
// ============================================================
// DOCTOR ACCOUNTS — INCOME (Step 1)
// ============================================================
// Internal clinic bookkeeping for money a doctor/clinic ACTUALLY RECEIVED.
//
// Strictly Doctor-scoped. `doctorId` is read ONLY from the authenticated
// `req.userId` — never from req.body, req.query or req.params — and every
// read/update/delete is scoped by `{ doctorId: req.userId }`. A record
// belonging to another doctor is reported exactly like a missing one, so
// this API never confirms that another doctor's record exists.
//
// This module is INDEPENDENT of PayPal, Paymob, Stripe, the HomelyServ
// `Payment` model, `AccountingEntry`, Worker/Employer payments, hiring and
// subscriptions. It never changes appointment status and never creates
// income automatically from an appointment.
//
// STATUS SEMANTICS: RECEIVED = real money. PENDING and REFUNDED are NOT
// income. Totals are intentionally NOT computed in this step.
// ============================================================
import mongoose from 'mongoose';
import DoctorIncome from '../models/DoctorIncome.js';
import DoctorEmployee from '../models/DoctorEmployee.js';
import DoctorExpense, { DOCTOR_EXPENSE_CATEGORIES } from '../models/DoctorExpense.js';
import DoctorEmployeeAdjustment, {
  DOCTOR_ADJUSTMENT_TYPES,
  DOCTOR_ADJUSTMENT_STATUSES
} from '../models/DoctorEmployeeAdjustment.js';
import DoctorSalarySettlement, {
  DOCTOR_SALARY_SETTLEMENT_STATUSES
} from '../models/DoctorSalarySettlement.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import { VALID_PATIENT_RELATIONSHIP_STATUSES } from '../services/doctorPatientAccessService.js';

// Normalises an id to a plain string, so a Mongoose ObjectId and the raw
// string it came from are compared as the SAME identity. Copied verbatim from
// doctorDashboardController.js: the patient de-duplication below is the same
// logic and must use the same normalisation.
const idStr = (v) => String(v || '');

// Matches the existing convention in doctorScheduleController.js /
// auth.js: legacy non-ObjectId ids must never reach Mongoose or Prisma.
const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// Same shape as parseDateBound() in doctorDashboardController.js.
const parseDateBound = (raw, field) => {
  if (raw === undefined || raw === null || raw === '') return { date: null };
  if (typeof raw !== 'string') return { error: `"${field}" must be a date string` };
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return { error: `"${field}" must be a valid ISO date` };
  return { date: new Date(ms) };
};

/**
 * Build the shared range filter for ?from / ?to against `dateField`.
 * Returns { error } on invalid input, otherwise { filter }.
 *
 * The date FIELD is supplied by the caller: `DoctorIncome` stores
 * `incomeDate`, `DoctorExpense` stores `expenseDate`. Filtering one
 * collection on the other's field name matches nothing in MongoDB (the field
 * is absent, so a $gte/$lte on it can never be satisfied), which silently
 * returned an empty list.
 *
 * Bound semantics are unchanged: both bounds optional, `from > to` rejected,
 * a missing bound means "unbounded on that side", and no range at all yields
 * an empty filter.
 */
const buildDateRangeFilter = (query, dateField) => {
  const fromParsed = parseDateBound(query?.from, 'from');
  if (fromParsed.error) return { error: fromParsed.error };
  const toParsed = parseDateBound(query?.to, 'to');
  if (toParsed.error) return { error: toParsed.error };

  const from = fromParsed.date;
  const to = toParsed.date;
  if (from && to && from.getTime() > to.getTime()) {
    return { error: '"from" must not be after "to"' };
  }
  if (!from && !to) return { filter: {} };
  return {
    filter: {
      [dateField]: {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {})
      }
    }
  };
};

// Explicit allow-list of the ONLY client-writable fields. `doctorId` is
// never present, and req.body is never spread into a model.
const WRITABLE_FIELDS = Object.freeze([
  'amount',
  'currency',
  'incomeDate',
  'source',
  'appointmentId',
  'patientId',
  'clinicPatientId',
  'status',
  'notes'
]);

const OPTION_ID_FIELDS = Object.freeze([
  'appointmentId',
  'patientId',
  'clinicPatientId'
]);

/**
 * Validate the three optional ObjectId reference fields.
 * Blank/absent values normalize to null; malformed values are rejected.
 */
const normalizeReferenceIds = (body) => {
  const out = {};
  for (const field of OPTION_ID_FIELDS) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') {
      out[field] = null;
      continue;
    }
    if (!isValidObjectId(String(raw))) {
      return { error: `"${field}" must be a valid 24-character ObjectId` };
    }
    out[field] = String(raw);
  }
  return { out };
};

/**
 * Copy only allow-listed fields from a request body onto a payload object.
 * Undefined values are skipped so PATCH never clears a field it wasn't given.
 */
const pickWritableFields = (body, payload) => {
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
};

/**
 * Verify an optional appointment reference really belongs to the
 * authenticated doctor. A foreign appointment is reported as not found so
 * this endpoint never discloses another doctor's appointment.
 */
const verifyAppointmentOwnership = async (appointmentId, doctorId) => {
  if (!appointmentId) return { appointment: null };
  if (!isValidObjectId(String(appointmentId))) {
    return { error: '"appointmentId" must be a valid 24-character ObjectId' };
  }
  const appointment = await DoctorAppointment.findOne({
    _id: appointmentId,
    doctorId
  });
  if (!appointment) {
    return { error: 'Appointment not found or not owned by doctor' };
  }
  return { appointment };
};

/**
 * GET /api/doctor-accounts/income
 * List income for the authenticated doctor only.
 * Optional ?from / ?to filter against `incomeDate` (ISO date strings).
 */
export const getDoctorIncome = async (req, res) => {
  try {
    const doctorId = req.userId;

    const { error, filter: dateFilter } = buildDateRangeFilter(req.query || {}, 'incomeDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const income = await DoctorIncome.find({
      doctorId,
      ...dateFilter
    })
      .sort({ incomeDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: income.length,
      income
    });
  } catch (error) {
    console.error('Error fetching doctor income:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching income',
      error: error.message
    });
  }
};

/**
 * POST /api/doctor-accounts/income
 * Record income the doctor has actually received.
 *
 * `doctorId` is taken exclusively from req.userId. An appointment link is
 * OPTIONAL and is only a price reference: when the client omits `amount`
 * and the owned appointment has a `feeSnapshot`, that value is used as a
 * convenience default. Income is NEVER created automatically — this
 * explicit doctor action is the only thing that records it.
 */
export const createDoctorIncome = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    // --- amount -----------------------------------------------------------
    let amount;
    if (body.amount === undefined || body.amount === null || body.amount === '') {
      amount = undefined; // may be defaulted from feeSnapshot below
    } else {
      amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a number between 0 and 1000000'
        });
      }
    }

    // --- incomeDate -------------------------------------------------------
    if (body.incomeDate === undefined || body.incomeDate === null || body.incomeDate === '') {
      return res.status(400).json({
        success: false,
        message: 'Income date is required'
      });
    }
    const incomeDateMs = Date.parse(body.incomeDate);
    if (Number.isNaN(incomeDateMs)) {
      return res.status(400).json({
        success: false,
        message: 'Income date must be a valid date'
      });
    }

    // --- optional ObjectId references ------------------------------------
    const { error: refError, out: refIds } = normalizeReferenceIds(body);
    if (refError) {
      return res.status(400).json({ success: false, message: refError });
    }

    // --- appointment ownership (must belong to THIS doctor) ---------------
    const { error: apptError, appointment } = await verifyAppointmentOwnership(
      refIds.appointmentId,
      doctorId
    );
    if (apptError) {
      return res.status(400).json({ success: false, message: apptError });
    }

    // Price-snapshot convenience default ONLY. Never an automatic creation.
    if (amount === undefined) {
      amount = appointment?.feeSnapshot ?? 0;
    }

    const payload = pickWritableFields(body, {
      amount,
      incomeDate: new Date(incomeDateMs),
      appointmentId: refIds.appointmentId,
      patientId: refIds.patientId,
      clinicPatientId: refIds.clinicPatientId
    });
    // Own the record to the authenticated doctor. Never a client value.
    payload.doctorId = doctorId;

    const record = await DoctorIncome.create(payload);

    return res.status(201).json({ success: true, income: record });
  } catch (error) {
    // Schema validation (including the CONSULTATION patient XOR rule and the
    // partial unique appointment index) surfaces here.
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error creating doctor income:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating income',
      error: error.message
    });
  }
};

/**
 * PATCH /api/doctor-accounts/income/:id
 * Update one of the authenticated doctor's income records.
 *
 * The lookup is scoped by `{ _id, doctorId: req.userId }`, so a record
 * owned by another doctor behaves exactly like a missing one. `doctorId` is
 * never in the update payload and can never be changed.
 */
export const updateDoctorIncome = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Income id must be a valid 24-character ObjectId'
      });
    }

    const { error: refError, out: refIds } = normalizeReferenceIds(body);
    if (refError) {
      return res.status(400).json({ success: false, message: refError });
    }

    // Any appointment supplied on update must also belong to this doctor.
    if (refIds.appointmentId) {
      const { error: apptError } = await verifyAppointmentOwnership(
        refIds.appointmentId,
        doctorId
      );
      if (apptError) {
        return res.status(400).json({ success: false, message: apptError });
      }
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a number between 0 and 1000000'
        });
      }
    }

    if (body.incomeDate !== undefined) {
      if (body.incomeDate === null || body.incomeDate === '') {
        return res.status(400).json({
          success: false,
          message: 'Income date cannot be cleared'
        });
      }
      if (Number.isNaN(Date.parse(body.incomeDate))) {
        return res.status(400).json({
          success: false,
          message: 'Income date must be a valid date'
        });
      }
      body.incomeDate = new Date(body.incomeDate);
    }

    // Explicit allow-list only. `doctorId` is not writable.
    const update = pickWritableFields(body, {});
    for (const field of OPTION_ID_FIELDS) {
      if (body[field] !== undefined) update[field] = refIds[field];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No supported fields provided to update'
      });
    }

    const record = await DoctorIncome.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    return res.json({ success: true, income: record });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error updating doctor income:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating income',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctor-accounts/income/:id
 * Delete one of the authenticated doctor's income records.
 * A record owned by another doctor behaves exactly like a missing one.
 */
export const deleteDoctorIncome = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Income id must be a valid 24-character ObjectId'
      });
    }

    const record = await DoctorIncome.findOneAndDelete({ _id: id, doctorId });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found'
      });
    }

    return res.json({ success: true, message: 'Income record deleted' });
  } catch (error) {
    console.error('Error deleting doctor income:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting income',
      error: error.message
    });
  }
};

// ============================================================
// EMPLOYEES
// ============================================================
// Internal clinic staffing records. `salary` is STORED ONLY here: nothing
// is paid, accrued, prorated, or written into an Expense/Income record in
// this step. A later Summary step decides how active salaries contribute.

// Explicit allow-list of the ONLY client-writable employee fields.
// `doctorId` is never present, and req.body is never spread into a model.
const WRITABLE_EMPLOYEE_FIELDS = Object.freeze([
  'fullName',
  'jobTitle',
  'salary',
  'currency',
  'startDate',
  'isActive',
  'notes'
]);

/**
 * Copy only allow-listed employee fields from a body onto a payload.
 * Undefined values are skipped so PATCH never clears a field it wasn't given.
 */
const pickWritableEmployeeFields = (body, payload) => {
  for (const field of WRITABLE_EMPLOYEE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
};

/**
 * GET /api/doctor-accounts/employees
 * List the authenticated doctor's employees only.
 * Optional ?isActive=true|false. Ordered by startDate DESC (newest join
 * first) with createdAt DESC as a stable tie-breaker.
 */
export const getDoctorEmployees = async (req, res) => {
  try {
    const doctorId = req.userId;

    const filter = { doctorId };

    // Same lenient-but-safe parsing as doctorScheduleController.js: only the
    // exact string 'true'/'false' narrows the list; anything else is ignored
    // rather than treated as an error.
    const { isActive } = req.query || {};
    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }

    const employees = await DoctorEmployee.find(filter)
      .sort({ startDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('Error fetching doctor employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching employees',
      error: error.message
    });
  }
};

/**
 * POST /api/doctor-accounts/employees
 * Register one of the authenticated doctor's employees.
 */
export const createDoctorEmployee = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }
    if (fullName.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Full name must not exceed 120 characters'
      });
    }

    if (body.salary === undefined || body.salary === null || body.salary === '') {
      return res.status(400).json({
        success: false,
        message: 'Salary is required'
      });
    }
    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary < 0 || salary > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a number between 0 and 1000000'
      });
    }

    if (body.startDate === undefined || body.startDate === null || body.startDate === '') {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }
    const startDateMs = Date.parse(body.startDate);
    if (Number.isNaN(startDateMs)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be a valid date'
      });
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    if (body.currency !== undefined && typeof body.currency !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a string'
      });
    }

    if (typeof body.jobTitle === 'string' && body.jobTitle.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Job title must not exceed 120 characters'
      });
    }

    if (typeof body.notes === 'string' && body.notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes must not exceed 1000 characters'
      });
    }

    const payload = pickWritableEmployeeFields(body, {
      fullName,
      salary,
      startDate: new Date(startDateMs)
    });
    // Own the record to the authenticated doctor. Never a client value.
    payload.doctorId = doctorId;

    const employee = await DoctorEmployee.create(payload);

    return res.status(201).json({ success: true, employee });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error creating doctor employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating employee',
      error: error.message
    });
  }
};

/**
 * PATCH /api/doctor-accounts/employees/:id
 * Update one of the authenticated doctor's employees.
 *
 * The lookup is scoped by `{ _id, doctorId: req.userId }`, so an employee
 * owned by another doctor behaves exactly like a missing one. `doctorId` is
 * never in the update payload and can never be changed.
 */
export const updateDoctorEmployee = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== 'string' || !body.fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be a non-empty string'
        });
      }
      body.fullName = body.fullName.trim();
      if (body.fullName.length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Full name must not exceed 120 characters'
        });
      }
    }

    if (body.salary !== undefined) {
      const salary = Number(body.salary);
      if (!Number.isFinite(salary) || salary < 0 || salary > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Salary must be a number between 0 and 1000000'
        });
      }
      body.salary = salary;
    }

    if (body.startDate !== undefined) {
      if (body.startDate === null || body.startDate === '') {
        return res.status(400).json({
          success: false,
          message: 'Start date cannot be cleared'
        });
      }
      const startDateMs = Date.parse(body.startDate);
      if (Number.isNaN(startDateMs)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be a valid date'
        });
      }
      body.startDate = new Date(startDateMs);
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    if (body.currency !== undefined && typeof body.currency !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a string'
      });
    }

    if (typeof body.jobTitle === 'string' && body.jobTitle.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Job title must not exceed 120 characters'
      });
    }

    if (typeof body.notes === 'string' && body.notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes must not exceed 1000 characters'
      });
    }

    // Explicit allow-list only. `doctorId` is not writable.
    const update = pickWritableEmployeeFields(body, {});
    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No supported fields provided to update'
      });
    }

    const employee = await DoctorEmployee.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.json({ success: true, employee });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error updating doctor employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating employee',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctor-accounts/employees/:id
 * Delete one of the authenticated doctor's employees.
 * An employee owned by another doctor behaves exactly like a missing one.
 *
 * Hard delete, matching the existing Doctor convention in
 * doctorScheduleController.deleteDoctorSchedule. `isActive` is a genuine
 * employment status here (not a delete flag), so a doctor who only wants
 * to mark someone as no longer on staff uses PATCH isActive:false.
 */
export const deleteDoctorEmployee = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }

    const employee = await DoctorEmployee.findOneAndDelete({ _id: id, doctorId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting doctor employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting employee',
      error: error.message
    });
  }
};

// ============================================================
// EXPENSES
// ============================================================
// Internal clinic cost records (rent, utilities, medical supplies,
// maintenance, other). Amounts are STORED ONLY here: nothing is totalled,
// netted against income, paid out, or created automatically from an
// employee salary or from anything else.

// Explicit allow-list of the ONLY client-writable expense fields.
// `doctorId` is never present, and req.body is never spread into a model.
const WRITABLE_EXPENSE_FIELDS = Object.freeze([
  'category',
  'description',
  'amount',
  'currency',
  'expenseDate',
  'notes'
]);

/**
 * Copy only allow-listed expense fields from a body onto a payload.
 * Undefined values are skipped so PATCH never clears a field it wasn't given.
 */
const pickWritableExpenseFields = (body, payload) => {
  for (const field of WRITABLE_EXPENSE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
};

/**
 * GET /api/doctor-accounts/expenses
 * List the authenticated doctor's expenses only.
 * Optional ?from / ?to (ISO dates, filtered against `expenseDate`) and
 * ?category. Ordered by expenseDate DESC (newest first) with createdAt DESC
 * as a stable tie-breaker.
 */
export const getDoctorExpenses = async (req, res) => {
  try {
    const doctorId = req.userId;

    // Same date-bound validation as the Income list, against this collection's
    // OWN date field: DoctorExpense stores `expenseDate`.
    const { error, filter: dateFilter } = buildDateRangeFilter(req.query || {}, 'expenseDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const filter = { doctorId, ...dateFilter };

    const { category } = req.query || {};
    if (category !== undefined && category !== null && category !== '') {
      const normalized = String(category).trim().toUpperCase();
      if (!DOCTOR_EXPENSE_CATEGORIES.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${DOCTOR_EXPENSE_CATEGORIES.join(', ')}`
        });
      }
      filter.category = normalized;
    }

    const expenses = await DoctorExpense.find(filter)
      .sort({ expenseDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    console.error('Error fetching doctor expenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching expenses',
      error: error.message
    });
  }
};

/**
 * POST /api/doctor-accounts/expenses
 * Record one expense the doctor's clinic has actually incurred.
 */
export const createDoctorExpense = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    if (body.category === undefined || body.category === null || body.category === '') {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    const category = String(body.category).trim().toUpperCase();
    if (!DOCTOR_EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${DOCTOR_EXPENSE_CATEGORIES.join(', ')}`
      });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    if (description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Description must not exceed 200 characters'
      });
    }

    if (body.amount === undefined || body.amount === null || body.amount === '') {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number between 0 and 1000000'
      });
    }

    if (body.expenseDate === undefined || body.expenseDate === null || body.expenseDate === '') {
      return res.status(400).json({
        success: false,
        message: 'Expense date is required'
      });
    }
    const expenseDateMs = Date.parse(body.expenseDate);
    if (Number.isNaN(expenseDateMs)) {
      return res.status(400).json({
        success: false,
        message: 'Expense date must be a valid date'
      });
    }

    if (body.currency !== undefined && typeof body.currency !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a string'
      });
    }

    if (typeof body.notes === 'string' && body.notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes must not exceed 1000 characters'
      });
    }

    const payload = pickWritableExpenseFields(body, {
      category,
      description,
      amount,
      expenseDate: new Date(expenseDateMs)
    });
    // Own the record to the authenticated doctor. Never a client value.
    payload.doctorId = doctorId;

    const expense = await DoctorExpense.create(payload);

    return res.status(201).json({ success: true, expense });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error creating doctor expense:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating expense',
      error: error.message
    });
  }
};

/**
 * PATCH /api/doctor-accounts/expenses/:id
 * Update one of the authenticated doctor's expenses.
 *
 * The lookup is scoped by `{ _id, doctorId: req.userId }`, so an expense
 * owned by another doctor behaves exactly like a missing one. `doctorId` is
 * never in the update payload and can never be changed. The four required
 * fields (category, description, amount, expenseDate) can be *changed* but
 * never *cleared*.
 */
export const updateDoctorExpense = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Expense id must be a valid 24-character ObjectId'
      });
    }

    if (body.category !== undefined) {
      if (body.category === null || body.category === '') {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be cleared'
        });
      }
      const category = String(body.category).trim().toUpperCase();
      if (!DOCTOR_EXPENSE_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${DOCTOR_EXPENSE_CATEGORIES.join(', ')}`
        });
      }
      body.category = category;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || !body.description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Description must be a non-empty string'
        });
      }
      body.description = body.description.trim();
      if (body.description.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Description must not exceed 200 characters'
        });
      }
    }

    if (body.amount !== undefined) {
      if (body.amount === null || body.amount === '') {
        return res.status(400).json({
          success: false,
          message: 'Amount cannot be cleared'
        });
      }
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a number between 0 and 1000000'
        });
      }
      body.amount = amount;
    }

    if (body.expenseDate !== undefined) {
      if (body.expenseDate === null || body.expenseDate === '') {
        return res.status(400).json({
          success: false,
          message: 'Expense date cannot be cleared'
        });
      }
      const expenseDateMs = Date.parse(body.expenseDate);
      if (Number.isNaN(expenseDateMs)) {
        return res.status(400).json({
          success: false,
          message: 'Expense date must be a valid date'
        });
      }
      body.expenseDate = new Date(expenseDateMs);
    }

    if (body.currency !== undefined && typeof body.currency !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a string'
      });
    }

    if (typeof body.notes === 'string' && body.notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes must not exceed 1000 characters'
      });
    }

    // Explicit allow-list only. `doctorId` is not writable.
    const update = pickWritableExpenseFields(body, {});
    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No supported fields provided to update'
      });
    }

    const expense = await DoctorExpense.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    return res.json({ success: true, expense });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    console.error('Error updating doctor expense:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating expense',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctor-accounts/expenses/:id
 * Delete one of the authenticated doctor's expenses.
 * An expense owned by another doctor behaves exactly like a missing one.
 *
 * Hard delete, matching the Step 2 employee behaviour. There is no
 * soft-delete and no `isActive` flag on this model by design.
 */
export const deleteDoctorExpense = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Expense id must be a valid 24-character ObjectId'
      });
    }

    const expense = await DoctorExpense.findOneAndDelete({ _id: id, doctorId });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    return res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Error deleting doctor expense:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting expense',
      error: error.message
    });
  }
};

// ============================================================
// EMPLOYEE SALARY ADJUSTMENTS — HELPERS ONLY (no routes yet)
// ============================================================
// Step 2 of the Doctor Accounts salary-adjustment feature. This block adds the
// internal building blocks a future adjustment controller will use. It registers
// NO route, exposes NO endpoint and performs NO database write, so Doctor
// Accounts behaviour is completely unchanged until the endpoints land.
//
// WHAT AN ADJUSTMENT IS: a Doctor-scoped salary record against ONE of the
// doctor's own employees.
//
//   ADVANCE — money paid to the employee BEFORE it was earned. A recoverable
//             debt, NOT a cost. Recovered from future salary; an unpaid
//             remainder carries forward across periods.
//   PENALTY — a doctor-defined deduction (e.g. unauthorized absence). The
//             doctor enters the EXACT amount; nothing here derives a penalty
//             from salary, a daily rate, absence days or a percentage.
//
// NOT A PAYMENT SYSTEM: no PayPal, Paymob, Stripe, Vodafone Cash, InstaPay or
// bank transfer. Not linked to `Payment`, `AccountingEntry`, Worker/Employer
// wages, `WorkerEarning`, hiring or subscriptions.
//
// NOT AN EXPENSE: an adjustment NEVER creates or modifies a `DoctorExpense`,
// and NEVER alters `DoctorEmployee`, `DoctorIncome`, `summary.salaryExpense`,
// `summary.totalExpenses` or `summary.netBalance`. Net salary
// (gross - advance recovered - penalty) is a LATER step.
//
// CURRENCY: an adjustment must use its employee's salary currency, because a
// deduction is only meaningful in the currency it is deducted from. There is NO
// conversion, no exchange rate, and no cross-currency arithmetic here.

// Explicit allow-list of the ONLY client-writable adjustment fields. `req.body`
// is never spread into a payload.
//
// `doctorId` is absent: ownership always comes from the authenticated
// `req.userId`, never from a body, query string or URL parameter, and a PATCH
// can never change it.
//
// `deductedAmount` and `status` are settlement-controlled fields. They must
// only be changed by the future settlement operation — never by an ordinary
// create/update request — so a client can never inflate a recovery or forge a
// settled state. `remainingAmount` is a derived virtual on the model and is not
// a stored field at all.
const WRITABLE_ADJUSTMENT_FIELDS = Object.freeze([
  'employeeId',
  'type',
  'amount',
  'currency',
  'adjustmentDate',
  'reason',
  'notes'
]);

/**
 * Copy only allow-listed adjustment fields from a request body onto a payload
 * object. Follows the same pattern as pickWritableFields /
 * pickWritableEmployeeFields / pickWritableExpenseFields: undefined values are
 * skipped so a PATCH never clears a field it was not given, and any field that
 * is not allow-listed is silently ignored.
 */
const pickWritableAdjustmentFields = (body) => {
  const payload = {};
  const source = body || {};
  for (const field of WRITABLE_ADJUSTMENT_FIELDS) {
    if (source[field] !== undefined) payload[field] = source[field];
  }
  return payload;
};

/**
 * Verify that an employee reference really belongs to the authenticated doctor.
 * A foreign employee is reported as not found (null) so this helper never
 * discloses that another doctor's employee exists — the same non-disclosure
 * rule verifyAppointmentOwnership applies to appointments.
 *
 * Scoping by BOTH `_id` and `doctorId` is essential: `employeeId` arrives from
 * the client, so scoping on `doctorId` alone would still let a caller attach an
 * adjustment to somebody else's employee.
 */
const verifyEmployeeOwnership = async (employeeId, doctorId) => {
  if (employeeId === undefined || employeeId === null || employeeId === '') return null;
  if (!isValidObjectId(String(employeeId))) return null;
  const employee = await DoctorEmployee.findOne({
    _id: employeeId,
    doctorId
  });
  return employee || null;
};

/**
 * Is this adjustment already baked into a SETTLED salary settlement?
 *
 * A settlement stores an immutable snapshot of the exact deduction applied to a
 * specific adjustment, so once a penalty is referenced the historical meaning of
 * that payslip is fixed. Editing the penalty's type/amount/currency/date, or
 * deleting it, would silently rewrite settled financial history — so both are
 * refused with 409.
 *
 * Only PENALTY details are consulted. Advances are already protected by their
 * own `deductedAmount > 0` lock, and an advance only reaches a settlement
 * through an increment, so this guard is deliberately penalty-scoped.
 *
 * REVERSED settlements do NOT lock anything: a reversed snapshot has been
 * cancelled, so its adjustments are editable again.
 */
const isAdjustmentSettled = async (adjustmentId, doctorId, session) =>
  Boolean(
    await DoctorSalarySettlement.exists({
      doctorId,
      status: 'SETTLED',
      'penaltyDetails.adjustmentId': adjustmentId,
      ...(session ? { session } : {})
    })
  );

/**
 * Validate the basic, non-financial fields of an adjustment payload.
 *
 * Returns { out } with the normalised values the caller should use, or
 * { error } with a message the future controller turns into HTTP 400. Nothing
 * is written anywhere.
 *
 * Rules:
 *   type            — exactly one of DOCTOR_ADJUSTMENT_TYPES ('ADVANCE'|'PENALTY')
 *   amount          — finite, greater than 0 (a zero/negative adjustment is
 *                     never meaningful) and at most 1000000
 *   currency        — non-empty string, trimmed and upper-cased, max 10 chars
 *   adjustmentDate  — a parseable date
 *   reason          — required for PENALTY, optional for ADVANCE, max 200
 *   notes           — optional, max 1000
 */
const validateDoctorEmployeeAdjustmentPayload = (body) => {
  const source = body || {};

  // ---- type ----
  const type = typeof source.type === 'string' ? source.type.trim().toUpperCase() : '';
  if (!type) {
    return { error: 'Type is required' };
  }
  if (!DOCTOR_ADJUSTMENT_TYPES.includes(type)) {
    return { error: `Type must be one of: ${DOCTOR_ADJUSTMENT_TYPES.join(', ')}` };
  }

  // ---- amount ----
  if (source.amount === undefined || source.amount === null || source.amount === '') {
    return { error: 'Amount is required' };
  }
  const amount = Number(source.amount);
  if (!Number.isFinite(amount)) {
    return { error: 'Amount must be a valid number' };
  }
  if (amount <= 0) {
    return { error: 'Amount must be greater than 0' };
  }
  if (amount > 1000000) {
    return { error: 'Amount must not exceed 1000000' };
  }

  // ---- currency (normalised only; NEVER converted) ----
  if (typeof source.currency !== 'string' || !source.currency.trim()) {
    return { error: 'Currency is required' };
  }
  const currency = source.currency.trim().toUpperCase();
  if (currency.length > 10) {
    return { error: 'Currency must not exceed 10 characters' };
  }

  // ---- adjustmentDate ----
  if (source.adjustmentDate === undefined || source.adjustmentDate === null || source.adjustmentDate === '') {
    return { error: 'Adjustment date is required' };
  }
  const adjustmentDateMs = Date.parse(source.adjustmentDate);
  if (Number.isNaN(adjustmentDateMs)) {
    return { error: 'Adjustment date must be a valid date' };
  }

  // ---- reason (required for PENALTY, optional for ADVANCE) ----
  const rawReason = typeof source.reason === 'string' ? source.reason.trim() : '';
  if (type === 'PENALTY' && !rawReason) {
    return { error: 'A reason is required for a penalty' };
  }
  if (rawReason.length > 200) {
    return { error: 'Reason must not exceed 200 characters' };
  }

  // ---- notes ----
  const notes = typeof source.notes === 'string' ? source.notes.trim() : '';
  if (notes.length > 1000) {
    return { error: 'Notes must not exceed 1000 characters' };
  }

  return {
    out: {
      type,
      amount,
      currency,
      adjustmentDate: new Date(adjustmentDateMs),
      reason: rawReason,
      notes
    }
  };
};

/**
 * Check that an adjustment's currency matches its employee's salary currency.
 *
 * Comparison is on the normalised upper-case value, so 'egp' and 'EGP' match.
 * When the employee has no stored currency nothing is enforced. There is NO
 * conversion of any kind: a deduction is only meaningful in the currency it is
 * deducted from, so a mismatch is a client error rather than something to
 * translate.
 *
 * Returns { ok: true } or { ok: false, error } for the caller to surface as 400.
 */
const validateAdjustmentCurrency = (employee, currency) => {
  const employeeCurrency =
    typeof employee?.currency === 'string' ? employee.currency.trim().toUpperCase() : '';
  if (!employeeCurrency) return { ok: true };
  const adjustmentCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
  if (adjustmentCurrency !== employeeCurrency) {
    return {
      ok: false,
      error: `Adjustment currency must match the employee salary currency (${employeeCurrency})`
    };
  }
  return { ok: true };
};

/** Round a monetary value to 2 decimals, avoiding float drift (e.g. 8000/30 * 12). */
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** UTC calendar-day midnight, the day precision the salary rule uses. */
const utcDayStart = (value) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

/**
 * Deterministic FIFO ordering for adjustments: oldest adjustmentDate first,
 * then createdAt, then _id. The _id tie-breaker is required because createdAt
 * has millisecond granularity, so two records can share it — without a final
 * deterministic key the same period could order differently twice.
 * Never mutates the caller's array.
 */
const compareAdjustmentsFifo = (a, b) => {
  const byDate = new Date(a.adjustmentDate).getTime() - new Date(b.adjustmentDate).getTime();
  if (Number.isFinite(byDate) && byDate !== 0) return byDate;
  const byCreated = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  if (Number.isFinite(byCreated) && byCreated !== 0) return byCreated;
  return String(a._id).localeCompare(String(b._id));
};

/**
 * CALCULATION ONLY — one employee's payroll for one salary period.
 *
 * PURE: no database access, no writes, no mutation of the inputs. It never
 * touches `deductedAmount` or `status`, settles nothing, and creates no
 * records. Viewing a salary period can never change stored state.
 *
 * GROSS SALARY IS FIXED PER CALENDAR MONTH (see `fixedMonthlySalary`):
 * `employee.salary x eligibleMonths`. The period is measured in whole months,
 * never prorated by elapsed days, so Sep 1 -> Sep 29 and Sep 1 -> Sep 30 both
 * yield one full month. `startDate` is a month eligibility boundary only.
 * ADVANCE and PENALTY are applied afterwards and affect NET salary only; they
 * never change the gross.
 *
 * APPROVED ORDERING: ADVANCE has priority over PENALTY. Advances are recovered
 * first (that money was already paid out); whatever gross salary is left is then
 * available to penalties. A penalty that cannot be fully applied is reported as
 * `shortfall` — it is never silently discarded.
 *
 * ADVANCE eligibility is `adjustmentDate <= reportEnd` and is deliberately NOT
 * bounded by `fromDate`: an advance granted in an earlier period stays
 * recoverable until exhausted. Carry-forward is exactly `amount - deductedAmount`,
 * so no extra state is needed.
 *
 * PENALTY eligibility requires the penalty to fall INSIDE the selected period
 * (`adjustmentDate >= fromDate` when a from bound exists, and `<= reportEnd`):
 * a penalty is a period event, not an outstanding balance.
 *
 * Currency is never converted. An adjustment whose normalised currency differs
 * from the employee's salary currency is ignored defensively, so a stray or
 * legacy record can never be deducted from the wrong salary.
 */
const computeSalaryPeriod = ({ employee, adjustments, fromDate, reportEnd }) => {
  const salary = Number(employee?.salary || 0);
  const currency =
    typeof employee?.currency === 'string' ? employee.currency.trim().toUpperCase() : '';

  // FIXED MONTHLY SALARY. The period is counted in whole CALENDAR MONTHS:
  // `startDate` is a month eligibility boundary, never a prorating fraction, and
  // `fromDate` (when supplied) defines the start of the period. The result is
  // the configured monthly salary multiplied by the number of eligible months.
  // Advances and penalties below reduce NET only; they never touch this gross.
  const grossSalary = round2(
    fixedMonthlySalary(salary, employee.startDate, fromDate || employee.startDate, reportEnd)
  );

  const endMs = reportEnd.getTime();
  const fromMs = fromDate ? utcDayStart(fromDate).getTime() : null;

  // Defensively drop other-currency adjustments; copy first so the caller's
  // array is never mutated by the sort.
  const typeOf = (a) => String(a?.type || '').toUpperCase();
  const eligible = (Array.isArray(adjustments) ? adjustments.slice() : [])
    .filter((a) => {
      const t = typeOf(a);
      if (t !== 'ADVANCE' && t !== 'PENALTY') return false;
      const aCurrency = typeof a?.currency === 'string' ? a.currency.trim().toUpperCase() : '';
      return aCurrency === currency;
    })
    .sort(compareAdjustmentsFifo);

  // ---------------- ADVANCE (priority) ----------------
  let availableLeft = grossSalary;
  let advanceTotal = 0;
  let outstanding = 0;
  const advanceLines = [];

  for (const advance of eligible.filter((a) => typeOf(a) === 'ADVANCE')) {
    // Not yet reached by the report end: not deductible this period.
    if (new Date(advance.adjustmentDate).getTime() > endMs) {
      advanceLines.push({
        adjustmentId: advance._id,
        requested: round2(advance.amount),
        available: round2(availableLeft),
        proposed: 0,
        applied: 0,
        deferred: 0,
        skipped: true,
        reason: 'NOT_YET_EFFECTIVE'
      });
      continue;
    }

    // Carry-forward is exactly amount - deductedAmount; nothing is written.
    const remaining = round2(
      Math.max(0, (Number(advance.amount) || 0) - (Number(advance.deductedAmount) || 0))
    );
    if (remaining <= 0) {
      advanceLines.push({
        adjustmentId: advance._id,
        requested: round2(advance.amount),
        available: round2(availableLeft),
        proposed: 0,
        applied: 0,
        deferred: 0,
        skipped: true,
        reason: 'ALREADY_SETTLED'
      });
      continue;
    }

    const proposed = round2(Math.min(remaining, availableLeft));
    if (proposed <= 0) {
      // No gross salary left this period; the balance carries forward.
      advanceLines.push({
        adjustmentId: advance._id,
        requested: round2(advance.amount),
        available: round2(availableLeft),
        proposed: 0,
        applied: 0,
        deferred: remaining,
        skipped: false,
        reason: 'NO_GROSS_AVAILABLE'
      });
      outstanding += remaining;
      continue;
    }

    advanceLines.push({
      adjustmentId: advance._id,
      requested: round2(advance.amount),
      available: round2(availableLeft),
      proposed,
      applied: proposed,
      deferred: round2(remaining - proposed),
      skipped: false,
      reason: 'APPLIED'
    });
    advanceTotal += proposed;
    availableLeft = round2(availableLeft - proposed);
    outstanding += round2(remaining - proposed);
  }

  // ---------------- PENALTY (only after advances) ----------------
  let penaltyTotal = 0;
  const penaltyLines = [];

  for (const penalty of eligible.filter((a) => typeOf(a) === 'PENALTY')) {
    const dateMs = new Date(penalty.adjustmentDate).getTime();
    const requested = round2(penalty.amount);

    // Outside the selected period: never applied here.
    if (dateMs > endMs || (fromMs !== null && dateMs < fromMs)) {
      penaltyLines.push({
        adjustmentId: penalty._id,
        requested,
        applied: 0,
        shortfall: 0,
        reason: 'OUTSIDE_PERIOD'
      });
      continue;
    }

    const applied = round2(Math.min(requested, availableLeft));
    if (applied <= 0) {
      // Explicitly reported, never silently dropped.
      penaltyLines.push({
        adjustmentId: penalty._id,
        requested,
        applied: 0,
        shortfall: requested,
        reason: 'NO_GROSS_AVAILABLE'
      });
      continue;
    }

    penaltyLines.push({
      adjustmentId: penalty._id,
      requested,
      applied,
      shortfall: round2(requested - applied),
      reason: requested - applied > 0 ? 'PARTIALLY_APPLIED' : 'APPLIED'
    });
    penaltyTotal += applied;
    availableLeft = round2(availableLeft - applied);
  }

  const advanceDeduction = round2(advanceTotal);
  const penaltyDeduction = round2(penaltyTotal);

  return {
    grossSalary,
    advanceDeduction,
    penaltyDeduction,
    // Floored at 0: deductions can never exceed the available gross salary.
    netSalary: round2(Math.max(0, grossSalary - advanceDeduction - penaltyDeduction)),
    currency,
    advanceOutstandingAfter: round2(outstanding),
    advanceLines,
    penaltyLines
  };
};

/**
 * Date filter for adjustmentDate. Mirrors the summary's `dateBound` helper
 * rather than reusing buildIncomeDateFilter, which is hard-coded to the
 * `incomeDate` field.
 */
const buildAdjustmentDateFilter = (query) => {
  const fromParsed = parseDateBound(query?.from, 'from');
  if (fromParsed.error) return { error: fromParsed.error };
  const toParsed = parseDateBound(query?.to, 'to');
  if (toParsed.error) return { error: toParsed.error };
  const from = fromParsed.date;
  const to = toParsed.date;
  if (from && to && from.getTime() > to.getTime()) {
    return { error: '"from" must not be after "to"' };
  }
  if (!from && !to) return { filter: {} };
  return {
    filter: {
      adjustmentDate: {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {})
      }
    }
  };
};

/**
 * GET /api/doctor-accounts/adjustments
 * List the authenticated doctor's adjustments only.
 *
 * Optional ?from / ?to (ISO dates, filtered against `adjustmentDate`),
 * ?employeeId, ?type and ?status. Ordered by adjustmentDate DESC (newest
 * first) with createdAt DESC as a stable tie-breaker. Only a minimal employee
 * projection is populated, for the UI label — no other employee field leaks.
 */
export const getDoctorEmployeeAdjustments = async (req, res) => {
  try {
    const doctorId = req.userId;

    const { error, filter: dateFilter } = buildAdjustmentDateFilter(req.query || {});
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // Tenant scope is ALWAYS present and is never taken from the query.
    const filter = { doctorId, ...dateFilter };

    const { employeeId } = req.query || {};
    if (employeeId !== undefined && employeeId !== null && employeeId !== '') {
      if (!isValidObjectId(String(employeeId))) {
        return res.status(400).json({
          success: false,
          message: 'Employee id must be a valid 24-character ObjectId'
        });
      }
      filter.employeeId = String(employeeId);
    }

    const { type } = req.query || {};
    if (type !== undefined && type !== null && type !== '') {
      const normalized = String(type).trim().toUpperCase();
      if (!DOCTOR_ADJUSTMENT_TYPES.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Type must be one of: ${DOCTOR_ADJUSTMENT_TYPES.join(', ')}`
        });
      }
      filter.type = normalized;
    }

    const { status } = req.query || {};
    if (status !== undefined && status !== null && status !== '') {
      const normalized = String(status).trim().toUpperCase();
      if (!DOCTOR_ADJUSTMENT_STATUSES.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${DOCTOR_ADJUSTMENT_STATUSES.join(', ')}`
        });
      }
      filter.status = normalized;
    }

    // `doctorId` in the query is ignored entirely — the scope above is the only
    // one that applies.
    const adjustments = await DoctorEmployeeAdjustment.find(filter)
      .sort({ adjustmentDate: -1, createdAt: -1 })
      .populate('employeeId', '_id fullName jobTitle currency');

    return res.json({
      success: true,
      count: adjustments.length,
      adjustments
    });
  } catch (error) {
    console.error('Error fetching doctor employee adjustments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching adjustments',
      error: error.message
    });
  }
};

/**
 * POST /api/doctor-accounts/adjustments
 * Record one salary adjustment for one of the doctor's own employees.
 *
 * `doctorId` comes exclusively from req.userId. The client cannot supply
 * `deductedAmount`, `status` or `remainingAmount`: they are dropped by the
 * allow-list and the first two are set to their neutral initial values here.
 * An adjustment is NEVER a `DoctorExpense` and never changes the summary.
 */
export const createDoctorEmployeeAdjustment = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    // Only allow-listed, non-settlement fields reach validation.
    const picked = pickWritableAdjustmentFields(body);
    const { error, out } = validateDoctorEmployeeAdjustmentPayload(picked);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // The employee must belong to the authenticated doctor. A foreign employee
    // is reported exactly like a missing one.
    const employee = await verifyEmployeeOwnership(picked.employeeId, doctorId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const currencyCheck = validateAdjustmentCurrency(employee, out.currency);
    if (!currencyCheck.ok) {
      return res.status(400).json({ success: false, message: currencyCheck.error });
    }

    const adjustment = await DoctorEmployeeAdjustment.create({
      ...out,
      employeeId: String(picked.employeeId),
      // Ownership is never a client value.
      doctorId,
      // Settlement state always starts neutral; only the future settlement
      // operation may change these.
      deductedAmount: 0,
      status: 'PENDING'
    });

    return res.status(201).json({ success: true, adjustment });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error creating doctor employee adjustment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating adjustment',
      error: error.message
    });
  }
};

// Financial fields of an advance that already has a recorded recovery. Editing
// any of these would silently rewrite money that has already been settled.
const LOCKED_ADVANCE_FIELDS = Object.freeze(['type', 'amount', 'currency', 'adjustmentDate']);

/**
 * PATCH /api/doctor-accounts/adjustments/:id
 * Update one of the authenticated doctor's adjustments.
 *
 * The lookup is scoped by `{ _id, doctorId: req.userId }`, so an adjustment
 * owned by another doctor behaves exactly like a missing one. `doctorId`,
 * `employeeId`, `deductedAmount`, `status` and `remainingAmount` are never
 * updatable: the adjustment stays attached to its original employee and a
 * PATCH can never forge settlement state.
 */
export const updateDoctorEmployeeAdjustment = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment id must be a valid 24-character ObjectId'
      });
    }

    const existing = await DoctorEmployeeAdjustment.findOne({ _id: id, doctorId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    // Only allow-listed, non-settlement fields are considered. `employeeId` is
    // allow-listed for create but must never move an existing adjustment, so it
    // is stripped here explicitly.
    const picked = pickWritableAdjustmentFields(body);
    delete picked.employeeId;

    const deductedAmount = Number(existing.deductedAmount || 0);
    const hasRecovery = deductedAmount > 0;

    // An advance with a recorded recovery has already been settled against: its
    // financial fields are locked, but the descriptive ones stay editable.
    if (hasRecovery) {
      const attempted = LOCKED_ADVANCE_FIELDS.filter((field) => picked[field] !== undefined);
      if (attempted.length) {
        return res.status(409).json({
          success: false,
          message: `Cannot change ${attempted.join(', ')} on an advance that already has recorded deductions. Only reason and notes may be edited.`
        });
      }
    }

    // A PENALTY referenced by a SETTLED settlement is frozen for the same
    // reason: the snapshot already recorded what was deducted. `deductedAmount`
    // stays 0 for penalties, so the check above cannot cover them.
    if (String(existing.type || '').toUpperCase() === 'PENALTY') {
      const attemptedLocked = LOCKED_ADVANCE_FIELDS.filter(
        (field) => picked[field] !== undefined
      );
      if (attemptedLocked.length && await isAdjustmentSettled(existing._id, doctorId)) {
        return res.status(409).json({
          success: false,
          message: `Cannot change ${attemptedLocked.join(', ')} on a penalty that is referenced by a settled salary period. Only reason and notes may be edited.`
        });
      }
    }

    // Revalidate the MERGED document so a partial PATCH cannot produce a state
    // that would not pass creation (e.g. a PENALTY left without a reason).
    const merged = {
      type: existing.type,
      amount: existing.amount,
      currency: existing.currency,
      adjustmentDate: existing.adjustmentDate,
      reason: existing.reason,
      notes: existing.notes,
      ...picked
    };
    const { error, out } = validateDoctorEmployeeAdjustmentPayload(merged);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // The employee is the ORIGINAL one — never re-pointed by a PATCH.
    const employee = await verifyEmployeeOwnership(existing.employeeId, doctorId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const currencyCheck = validateAdjustmentCurrency(employee, out.currency);
    if (!currencyCheck.ok) {
      return res.status(400).json({ success: false, message: currencyCheck.error });
    }

    // Only the editable set is written. doctorId, employeeId, deductedAmount and
    // status are deliberately absent, so they are preserved untouched.
    const adjustment = await DoctorEmployeeAdjustment.findOneAndUpdate(
      { _id: id, doctorId },
      {
        $set: {
          type: out.type,
          amount: out.amount,
          currency: out.currency,
          adjustmentDate: out.adjustmentDate,
          reason: out.reason,
          notes: out.notes
        }
      },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, adjustment });
  } catch (error) {
    if (error?.name === 'ValidationError' || error?.name === 'MongoServerError' || error?.code === 11000) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error updating doctor employee adjustment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating adjustment',
      error: error.message
    });
  }
};

/**
 * DELETE /api/doctor-accounts/adjustments/:id
 * Delete one of the authenticated doctor's adjustments.
 *
 * An advance that already has a recorded deduction CANNOT be deleted: erasing
 * it would destroy the history of money that was actually recovered. Deleting
 * an untouched advance or a penalty is allowed. Hard delete matches the
 * existing employee/expense delete convention; no soft-delete is introduced.
 */
export const deleteDoctorEmployeeAdjustment = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment id must be a valid 24-character ObjectId'
      });
    }

    const existing = await DoctorEmployeeAdjustment.findOne({ _id: id, doctorId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (Number(existing.deductedAmount || 0) > 0) {
      return res.status(409).json({
        success: false,
        message: 'This advance already has recorded deductions and cannot be deleted.'
      });
    }

    // A penalty already baked into a SETTLED snapshot must not disappear: the
    // settlement history would reference a deleted record.
    if (
      String(existing.type || '').toUpperCase() === 'PENALTY' &&
      await isAdjustmentSettled(existing._id, doctorId)
    ) {
      return res.status(409).json({
        success: false,
        message: 'This penalty is referenced by a settled salary period and cannot be deleted.'
      });
    }

    await DoctorEmployeeAdjustment.deleteOne({ _id: id, doctorId });

    return res.json({ success: true, message: 'Adjustment deleted' });
  } catch (error) {
    console.error('Error deleting doctor employee adjustment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting adjustment',
      error: error.message
    });
  }
};

/**
 * GET /api/doctor-accounts/employees/:employeeId/salary-period
 *
 * READ-ONLY payroll view for ONE employee over the selected period.
 *
 * This is CALCULATION ONLY. It runs computeSalaryPeriod() and returns the
 * result. It never writes: no `deductedAmount` change, no `status` change, no
 * record creation, no settlement, and no payment of any kind. Repeating the
 * request always returns the same figures for the same data.
 *
 * An adjustment that is merely VIEWED here is not "consumed": the advance
 * balance is `amount - deductedAmount`, so this endpoint only *proposes* what
 * could be deducted. A future, separate settle operation is what would record
 * it — deliberately out of scope.
 *
 * Tenant isolation: the employee is looked up by `{ _id, doctorId }` and a
 * foreign employee is reported exactly like a missing one. Adjustments are
 * loaded with the same `doctorId` in ONE query (no N+1). `doctorId` is never
 * read from the query string or body.
 */
export const getDoctorEmployeeSalaryPeriod = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { employeeId } = req.params;

    if (!isValidObjectId(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }

    // Same date-bound convention as the rest of the controller: both bounds
    // optional, `from > to` rejected. `doctorId` in the query is ignored.
    const { error, filter: dateFilter } = buildAdjustmentDateFilter(req.query || {});
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    const fromDate = dateFilter.adjustmentDate?.$gte || null;
    const toDate = dateFilter.adjustmentDate?.$lte || null;
    const reportEnd = toDate || new Date();

    // Scoped by BOTH _id and doctorId: a foreign employee must not leak.
    const employee = await DoctorEmployee.findOne({ _id: employeeId, doctorId })
      .select('salary currency startDate isActive fullName');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // ONE query for every adjustment this calculation could use — tenant-scoped,
    // already effective by the report end, and limited to the two adjustment
    // types. No N+1, and no unrelated fields are loaded.
    const adjustments = await DoctorEmployeeAdjustment.find({
      doctorId,
      employeeId,
      type: { $in: DOCTOR_ADJUSTMENT_TYPES },
      adjustmentDate: { $lte: reportEnd }
    })
      .select('_id type amount currency adjustmentDate deductedAmount createdAt')
      .lean();

    const result = computeSalaryPeriod({ employee, adjustments, fromDate, reportEnd });

    return res.json({
      success: true,
      readOnly: true,
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        isActive: employee.isActive
      },
      period: {
        from: fromDate ? fromDate.toISOString() : null,
        to: reportEnd.toISOString()
      },
      salaryPeriod: result
    });
  } catch (err) {
    console.error('Error computing doctor employee salary period:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error computing salary period',
      error: err.message
    });
  }
};

// ============================================================
// FINANCIAL SUMMARY
// ============================================================
// Internal clinic bookkeeping summary. READ-ONLY: this never creates an
// Income, Expense, salary or appointment record, and never changes one.
//
// CURRENCY ISOLATION (hard rule): every monetary figure is bucketed by
// currency and buckets are NEVER added together. EGP + USD never happens,
// nothing is converted, and there is no exchange rate anywhere here.
//
// DEFAULT PERIOD: mirrors the existing Doctor dashboard — `from`/`to` are
// both optional and a missing bound means "unbounded on that side". With no
// range, salary accrues from each employee's startDate up to the report end,
// where the report end is `to` when supplied and otherwise "now".

/**
 * Count the distinct calendar months a period touches (UTC, so the result never
 * depends on the server's local timezone).
 */
const utcMonthNumber = (date) =>
  (date.getUTCFullYear() * 12) + date.getUTCMonth();

// Half a day. Every real-world UTC offset is smaller than 12 hours, so
// shifting an instant by ±12h before reading its UTC month always lands in
// the calendar month the CALLER intended, whether the caller sent a bare
// 'YYYY-MM-DD' (parsed as UTC midnight) or a browser-local day boundary
// (which in a timezone ahead of UTC falls on the previous UTC day).
const MONTH_SKEW_MS = 12 * 60 * 60 * 1000;

/** UTC month number of `date` after applying a signed day-level skew. */
const calendarMonthNumber = (date, skewMs = 0) => {
  const shifted = new Date(date.getTime() + skewMs);
  return (shifted.getUTCFullYear() * 12) + shifted.getUTCMonth();
};

/**
 * FIXED MONTHLY SALARY — the one and only Doctor Accounts salary rule.
 *
 * A doctor's employee is paid a FIXED salary for every calendar month they are
 * eligible for. `monthlySalary` is never scaled by elapsed or calendar days:
 *
 *   gross = monthlySalary x eligibleMonths
 *
 * ELIGIBILITY (not proration): `startDate` is used only as a MONTH boundary.
 * A month contributes the FULL monthly salary when it is both
 *   (a) touched by [periodStart, periodEnd], and
 *   (b) on or after the employee's START MONTH.
 * Starting mid-month (e.g. the 15th) therefore still earns the whole month's
 * salary; months entirely before the start month contribute nothing.
 *
 * Consequences, all intentional:
 *   Sep 1  -> Sep 29  = 1 month  = salary
 *   Sep 1  -> Sep 30  = 1 month  = salary
 *   Sep 15 -> Oct 15 = 2 months = salary x 2
 *   Sep 29 -> Sep 29 = 1 month  = salary
 *
 * This deliberately REPLACES the old calendar-day proration, which reported a
 * partial month as a fraction (and could exceed one full month across a
 * two-partial-month window). Advances and penalties are applied afterwards and
 * never alter the gross returned here.
 */
const fixedMonthlySalary = (monthlySalary, startDate, periodStart, periodEnd) => {
  const salary = Number(monthlySalary || 0);
  if (!Number.isFinite(salary) || salary <= 0) return 0;

  // NOTE: these are the RAW request instants — deliberately NOT floored to a
  // UTC day. The caller sends browser-LOCAL day boundaries, so a local
  // 00:00 in a timezone ahead of UTC lands on the PREVIOUS UTC day (a local
  // Sep 1 00:00 +02:00 is Aug 31 22:00Z). Flooring that to Aug 31 made
  // September accrue as [August..September] = 2 months, doubling every
  // salary. Month membership is therefore resolved with a half-day skew
  // instead (see `calendarMonthNumber`), which tolerates any real timezone
  // offset (all are < 12h) while still reading the intended local day.
  const start = new Date(startDate);
  const from = new Date(periodStart);
  const to = new Date(periodEnd);
  if (from.getTime() > to.getTime()) return 0;

  // The employee cannot be paid for a month that ends before they started.
  const effectiveFrom = from.getTime() > start.getTime() ? from : start;

  // Inclusive month range: [monthOf(effectiveFrom), monthOf(to)]. The upper
  // bound is skewed backwards and the lower bound forwards, so an end-of-day
  // instant late in a month and a start-of-day instant early in a month both
  // resolve to the month the caller actually selected.
  const firstMonth = calendarMonthNumber(effectiveFrom, MONTH_SKEW_MS);
  const lastMonth = calendarMonthNumber(to, -MONTH_SKEW_MS);
  const eligibleMonths = lastMonth - firstMonth + 1;
  if (eligibleMonths <= 0) return 0;

  return salary * eligibleMonths;
};

/** Add a value into a currency bucket map (never across currencies). */
const addToCurrencyBucket = (buckets, currency, value) => {
  const key = String(currency || 'EGP').toUpperCase();
  buckets[key] = (buckets[key] || 0) + value;
};

/** Turn a { _id: currency, total } aggregation into { CURRENCY: number }. */
const toCurrencyTotals = (rows) => {
  const out = {};
  for (const row of rows || []) {
    out[String(row._id || 'EGP').toUpperCase()] = Number(row.total || 0);
  }
  return out;
};

/**
 * GET /api/doctor-accounts/summary
 * Financial + operational summary for the authenticated doctor only.
 * Optional ?from / ?to (ISO dates). Monetary figures are grouped by
 * currency; no single mixed-currency total is ever returned.
 */
export const getDoctorAccountsSummary = async (req, res) => {
  try {
    // Mongoose does NOT cast aggregation pipelines, so the raw JWT string would
    // never match the ObjectId `doctorId` stored on DoctorIncome/DoctorExpense
    // and both totals silently came back empty. `find`, `countDocuments` and
    // `distinct` cast on their own, which is why salary was unaffected. Cast
    // once here, reusing the existing validation convention.
    const doctorId = isValidObjectId(String(req.userId))
      ? new mongoose.Types.ObjectId(String(req.userId))
      : req.userId;

    // Same date-bound validation as the Income/Expense lists and the
    // Doctor dashboard. Both bounds optional; `from > to` is rejected.
    // `incomeDate` here is the INCOME field; the expense side of this summary
    // uses its own `expenseDate` bound further below, unchanged.
    const { error, filter: rangeFilter } = buildDateRangeFilter(req.query || {}, 'incomeDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const fromDate = rangeFilter.incomeDate?.$gte || null;
    const toDate = rangeFilter.incomeDate?.$lte || null;
    // The report end drives salary accrual and the "already started" check.
    const reportEnd = toDate || new Date();

    const dateBound = (field) => (
      fromDate || toDate
        ? { [field]: { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) } }
        : {}
    );
    const incomeRange = dateBound('incomeDate');
    const expenseRange = dateBound('expenseDate');
    const appointmentRange = dateBound('startsAt');

    // Every aggregation is tenant-scoped INSIDE its $match — never a
    // global aggregate followed by a post-filter.
    const [
      incomeRows,
      incomeCountRows,
      expenseRows,
      expenseCountRows,
      activeEmployees,
      homelyServPatientIds,
      clinicPatientCount,
      clinicPatientLinkedIds,
      confirmedAppointments
    ] = await Promise.all([
      // Income: RECEIVED ONLY. PENDING and REFUNDED are not money received.
      DoctorIncome.aggregate([
        { $match: { doctorId, status: 'RECEIVED', ...incomeRange } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
      ]),
      DoctorIncome.aggregate([
        { $match: { doctorId, status: 'RECEIVED', ...incomeRange } },
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]),
      // Explicit DoctorExpense records only. Salary is added separately.
      DoctorExpense.aggregate([
        { $match: { doctorId, ...expenseRange } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
      ]),
      DoctorExpense.aggregate([
        { $match: { doctorId, ...expenseRange } },
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]),
      // Active employees who had already started by the report end. The model
      // has no endDate, so an active employee is treated as active through
      // the report end.
      DoctorEmployee.find({ doctorId, isActive: true, startDate: { $lte: reportEnd } })
        .select('salary currency startDate'),
      // ---- Canonical patient logic, copied from doctorDashboardController ----
      // distinct HomelyServ users with a CONFIRMED/COMPLETED relationship.
      // `distinct` yields null for clinic-patient appointments; nulls are
      // filtered out below so a null can never count as a patient.
      DoctorAppointment.distinct('patientId', {
        doctorId,
        status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
      }),
      // Every doctor-owned ClinicPatient (no delete endpoint exists).
      ClinicPatient.countDocuments({ doctorId }),
      ClinicPatient.distinct('linkedUserId', { doctorId, linkedUserId: { $ne: null } }),
      // Confirmed only. Uses `startsAt`, matching the Doctor dashboard's
      // appointment activity date semantics.
      DoctorAppointment.countDocuments({
        doctorId,
        status: 'CONFIRMED',
        ...appointmentRange
      })
    ]);

    // ---- Patient de-duplication (identical to the dashboard) ----
    const homelyServPatientSet = new Set(
      homelyServPatientIds.filter(Boolean).map(idStr)
    );
    const homelyServPatients = homelyServPatientSet.size;
    // The ONLY identity bridge the model supports is ClinicPatient.linkedUserId.
    const overlapCount = clinicPatientLinkedIds
      .filter(Boolean)
      .filter((id) => homelyServPatientSet.has(idStr(id)))
      .length;
    const registeredPatients = homelyServPatients + clinicPatientCount - overlapCount;

    // ---- Salary: computed here, NEVER persisted as a DoctorExpense ----
    // FIXED MONTHLY SALARY — the SAME rule the salary-period and settlement use
    // (see `fixedMonthlySalary`). The SELECTED PERIOD IS AUTHORITATIVE: the
    // report counts whole calendar months from the later of (a) the employee's
    // startDate and (b) the report's `from` bound, through `reportEnd`. A
    // month is never prorated, so an employee who joined years ago contributes
    // only the months inside the range the doctor is looking at — a
    // startDate of 2000 under a "This Month" filter reports one month, not 26
    // years. Every eligible month contributes the FULL configured monthly
    // salary. This must stay in step with computeSalaryPeriod.
    const salaryTotals = {};
    for (const employee of activeEmployees) {
      // Compare on the UTC calendar day so no timezone can shift the boundary.
      const employeeStart = new Date(
        Date.UTC(
          employee.startDate.getUTCFullYear(),
          employee.startDate.getUTCMonth(),
          employee.startDate.getUTCDate()
        )
      );
      const salaryPeriodStart = fromDate && fromDate.getTime() > employeeStart.getTime()
        ? fromDate
        : employeeStart;

      const contribution = fixedMonthlySalary(
        Number(employee.salary || 0),
        employee.startDate,
        salaryPeriodStart,
        reportEnd
      );
      addToCurrencyBucket(salaryTotals, employee.currency, contribution);
    }
    // Drop buckets that accrued exactly 0 so a new clinic sees a clean,
    // empty salary map rather than noisy zero entries.
    for (const key of Object.keys(salaryTotals)) {
      if (!salaryTotals[key]) delete salaryTotals[key];
    }

    const income = toCurrencyTotals(incomeRows);
    const expensesOther = toCurrencyTotals(expenseRows);

    const incomeCounts = {};
    for (const row of incomeCountRows || []) {
      incomeCounts[String(row._id || 'EGP').toUpperCase()] = row.count || 0;
    }
    const expenseCounts = {};
    for (const row of expenseCountRows || []) {
      expenseCounts[String(row._id || 'EGP').toUpperCase()] = row.count || 0;
    }

    // Union of every currency seen, so each bucket reports ALL components —
    // a currency with income but no expense must still appear.
    const currencies = new Set([
      ...Object.keys(income),
      ...Object.keys(incomeCounts),
      ...Object.keys(expensesOther),
      ...Object.keys(expenseCounts),
      ...Object.keys(salaryTotals)
    ]);

    const salaryExpense = {};
    const totalExpenses = {};
    const netBalance = {};

    for (const currency of [...currencies].sort()) {
      const other = Number(expensesOther[currency] || 0);
      const salary = Number(salaryTotals[currency] || 0);
      const total = other + salary;              // same currency only
      const received = Number(income[currency] || 0);

      salaryExpense[currency] = salary;
      totalExpenses[currency] = total;
      // Net is per-currency. The currency map is NEVER reduced to one number.
      netBalance[currency] = received - total;
    }

    return res.json({
      success: true,
      summary: {
        dateRange: {
          from: fromDate ? fromDate.toISOString() : null,
          to: toDate ? toDate.toISOString() : null
        },
        currencyNote: 'All amounts are grouped by currency and are never summed across currencies.',
        income,
        incomeCounts,
        expenses: expensesOther,
        expenseCounts,
        salaryExpense,
        totalExpenses,
        netBalance,
        registeredPatients: {
          total: registeredPatients,
          homelyServ: homelyServPatients,
          clinic: clinicPatientCount,
          overlap: overlapCount
        },
        confirmedAppointments,
        activeEmployees: activeEmployees.length
      }
    });
  } catch (error) {
    console.error('Error building doctor accounts summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error building summary',
      error: error.message
    });
  }
};





// ============================================================
// SALARY SETTLEMENT — EXPLICIT, TRANSACTIONAL
// ============================================================
// Settling is an EXPLICIT doctor action confirming a salary period was paid.
// The calculation-only GET /salary-period endpoint NEVER settles anything and
// is deliberately left read-only.
//
// The client sends ONLY `from`, `to` and an optional `notes`. Every monetary
// figure is recalculated here from current database state immediately before
// writing — no amount, deduction or adjustment id is ever taken from the body.
//
// ATOMICITY: a settlement touches the settlement document AND every advance it
// recovers, so it is multi-document and runs inside a real MongoDB transaction
// (this deployment is a replica set, verified). A duplicate key from the
// exact-period unique index is surfaced as 409, never 500.
//
// ADVANCE RECOVERY uses a conditional $expr update so the invariant
// `deductedAmount + appliedAmount <= amount` can never be violated, even if two
// settlements race.

export const createDoctorEmployeeSalarySettlement = async (req, res) => {
  let session;
  try {
    const doctorId = req.userId;
    const { employeeId } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }

    // Only from/to/notes are read. doctorId, salary and deduction values in
    // the body are ignored entirely.
    const { error, filter: dateFilter } = buildAdjustmentDateFilter({
      from: body.from,
      to: body.to
    });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    const periodFrom = dateFilter.adjustmentDate?.$gte || null;
    const periodTo = dateFilter.adjustmentDate?.$lte || null;
    if (!periodFrom || !periodTo) {
      return res.status(400).json({
        success: false,
        message: 'Both a start and an end date are required to settle a salary period'
      });
    }

    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
      return res.status(400).json({ success: false, message: 'Notes must be a string' });
    }
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : '';

    // Scoped by BOTH _id and doctorId: a foreign employee must not leak.
    const employee = await DoctorEmployee.findOne({ _id: employeeId, doctorId })
      .select('salary currency startDate isActive fullName');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    session = await mongoose.startSession();
    let created;

    try {
      await session.withTransaction(async () => {
        // Overlap re-check INSIDE the transaction, immediately before insert.
        const overlap = await DoctorSalarySettlement.exists(
          {
            doctorId,
            employeeId,
            status: 'SETTLED',
            periodFrom: { $lt: periodTo },
            periodTo: { $gt: periodFrom }
          },
          { session }
        );
        if (overlap) {
          const err = new Error(
            'An overlapping salary period has already been settled for this employee.'
          );
          err.statusCode = 409;
          throw err;
        }


        // Recalculate from CURRENT data inside the transaction.
        const adjustments = await DoctorEmployeeAdjustment.find({
          doctorId,
          employeeId,
          type: { $in: DOCTOR_ADJUSTMENT_TYPES },
          adjustmentDate: { $lte: periodTo }
        })
          .select('_id type amount currency adjustmentDate deductedAmount createdAt')
          .session(session)
          .lean();

        const calculation = computeSalaryPeriod({
          employee,
          adjustments,
          fromDate: periodFrom,
          reportEnd: periodTo
        });

        const advanceDetails = calculation.advanceLines
          .filter((line) => line.applied > 0)
          .map((line) => ({
            adjustmentId: line.adjustmentId,
            appliedAmount: round2(line.applied),
            remainingAfter: round2(line.deferred)
          }));

        const penaltyDetails = calculation.penaltyLines
          .filter((line) => line.applied > 0 || line.shortfall > 0)
          .map((line) => ({
            adjustmentId: line.adjustmentId,
            appliedAmount: round2(line.applied),
            shortfall: round2(line.shortfall)
          }));

        // Insert the snapshot FIRST: the exact-period unique index is the final
        // guard against two concurrent settlements of the same period.
        const [settlement] = await DoctorSalarySettlement.create(
          [
            {
              doctorId,
              employeeId: String(employeeId),
              periodFrom,
              periodTo,
              currency: calculation.currency,
              grossSalary: round2(calculation.grossSalary),
              advanceDeduction: round2(calculation.advanceDeduction),
              penaltyDeduction: round2(calculation.penaltyDeduction),
              netSalary: round2(calculation.netSalary),
              advanceDetails,
              penaltyDetails,
              status: 'SETTLED',
              settledAt: new Date(),
              reversalOf: null,
              notes
            }
          ],
          { session }
        );

        // Persist advance recovery. Penalties are NOT incremented: a penalty is
        // a period event and the snapshot already records what was applied.
        for (const detail of advanceDetails) {
          const nextTotal = {
            $add: [{ $ifNull: ['$deductedAmount', 0] }, detail.appliedAmount]
          };
          const updated = await DoctorEmployeeAdjustment.findOneAndUpdate(
            {
              _id: detail.adjustmentId,
              doctorId,
              employeeId: String(employeeId),
              type: 'ADVANCE',
              // The invariant, enforced atomically by the server:
              // deductedAmount + appliedAmount <= amount. If this does not
              // match, the update is a no-op and we abort the whole settlement.
              $expr: { $lte: [nextTotal, '$amount'] }
            },
            [
              {
                $set: {
                  deductedAmount: nextTotal,
                  status: { $cond: [{ $gte: [nextTotal, '$amount'] }, 'SETTLED', 'PARTIALLY_SETTLED'] },
                  updatedAt: new Date()
                }
              }
            ],
            { session, new: true }
          );
          if (!updated) {
            const err = new Error(
              'This advance changed or was already consumed by another settlement. Nothing was settled.'
            );
            err.statusCode = 409;
            throw err;
          }
        }

        created = settlement;
      });
    } catch (txError) {
      // A duplicate key on the exact-period unique index is a normal 409.
      if (txError?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This exact salary period has already been settled.'
        });
      }
      if (txError?.statusCode === 409) {
        return res.status(409).json({ success: false, message: txError.message });
      }
      throw txError;
    }

    return res.status(201).json({ success: true, settlement: created });
  } catch (err) {
    console.error('Error settling doctor employee salary period:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error settling salary period',
      error: err.message
    });
  } finally {
    if (session) await session.endSession();
  }
};

// ============================================================
// SALARY SETTLEMENT — READ-ONLY HISTORY
// ============================================================
// Both endpoints below are STRICTLY READ-ONLY: no session, no transaction, no
// create, no update, no delete. They return the STORED snapshot exactly as it
// was settled and never recompute it — a settlement is a historical financial
// fact, so re-running computeSalaryPeriod here could report a different number
// than the doctor actually paid if the salary or an adjustment has changed
// since. To see live figures, use the calculation-only salary-period endpoint.
//
// Every read is scoped by `{ doctorId: req.userId }` AND by the employee, so a
// doctor can only ever see their own employees' settlements.

export const getDoctorEmployeeSettlements = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { employeeId } = req.params;

    if (!isValidObjectId(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }

    // Same date-bound convention as the rest of the controller. These bounds
    // filter the SETTLED PERIOD (periodFrom/periodTo), not the settlement time.
    const { error, filter: dateFilter } = buildAdjustmentDateFilter(req.query || {});
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // Scoped by BOTH _id and doctorId: a foreign employee is reported exactly
    // like a missing one, and no other employee's data is ever exposed.
    const employee = await DoctorEmployee.findOne({ _id: employeeId, doctorId })
      .select('_id fullName isActive');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // The optional ?from / ?to bounds filter the SETTLED PERIOD, not the
    // adjustment date. `buildAdjustmentDateFilter` returns an
    // `adjustmentDate` key, which does not exist on a settlement, so the bounds
    // are re-applied here to the period itself: a settlement is included when
    // its period lies WITHIN [from, to]. Both bounds are optional, and this
    // shape is served by the existing {doctorId, employeeId, periodFrom, periodTo}
    // index.
    const fromDate = dateFilter.adjustmentDate?.$gte || null;
    const toDate = dateFilter.adjustmentDate?.$lte || null;
    const filter = { doctorId, employeeId: String(employeeId) };
    if (fromDate) filter.periodFrom = { ...(filter.periodFrom || {}), $gte: fromDate };
    if (toDate) filter.periodTo = { ...(filter.periodTo || {}), $lte: toDate };

    const { status } = req.query || {};
    if (status !== undefined && status !== null && status !== '') {
      const normalized = String(status).trim().toUpperCase();
      if (!DOCTOR_SALARY_SETTLEMENT_STATUSES.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${DOCTOR_SALARY_SETTLEMENT_STATUSES.join(', ')}`
        });
      }
      filter.status = normalized;
    }

    // Newest period first; settledAt breaks ties between equal periodTo values.
    // READ-ONLY: find + sort + select only, never a write or a session.
    const settlements = await DoctorSalarySettlement.find(filter)
      .sort({ periodTo: -1, settledAt: -1 })
      .select(
        '_id employeeId periodFrom periodTo currency grossSalary advanceDeduction penaltyDeduction netSalary advanceDetails penaltyDetails status settledAt reversalOf notes createdAt updatedAt'
      )
      .lean();

    return res.json({
      success: true,
      readOnly: true,
      count: settlements.length,
      settlements
    });
  } catch (err) {
    console.error('Error fetching doctor employee settlements:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching settlements',
      error: err.message
    });
  }
};

/**
 * GET /api/doctor-accounts/employees/:employeeId/settlements/:settlementId
 *
 * One complete stored snapshot. Scoped by doctorId AND employeeId AND _id, so
 * a settlement belonging to another doctor, or to another of this doctor's
 * employees, is reported exactly like a missing one.
 */
export const getDoctorEmployeeSettlementById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { employeeId, settlementId } = req.params;

    if (!isValidObjectId(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }
    if (!isValidObjectId(String(settlementId))) {
      return res.status(400).json({
        success: false,
        message: 'Settlement id must be a valid 24-character ObjectId'
      });
    }

    const employee = await DoctorEmployee.findOne({ _id: employeeId, doctorId })
      .select('_id fullName isActive');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // The full snapshot is returned verbatim; nothing is recomputed.
    const settlement = await DoctorSalarySettlement.findOne({
      _id: settlementId,
      doctorId,
      employeeId: String(employeeId)
    })
      .select(
        '_id employeeId periodFrom periodTo currency grossSalary advanceDeduction penaltyDeduction netSalary advanceDetails penaltyDetails status settledAt reversalOf notes createdAt updatedAt'
      )
      .lean();

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    return res.json({
      success: true,
      readOnly: true,
      employee: { _id: employee._id, fullName: employee.fullName, isActive: employee.isActive },
      settlement
    });
  } catch (err) {
    console.error('Error fetching doctor employee settlement:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching settlement',
      error: err.message
    });
  }
};



// ============================================================
// SALARY SETTLEMENT — REVERSAL
// ============================================================
// Reversing a settlement is an EXPLICIT doctor correction. The ORIGINAL
// document IS the reversal record: it is flipped in place from SETTLED to
// REVERSED, and its entire financial snapshot is left exactly as it was paid.
// No second settlement document is ever created, and `reversalOf` stays null
// (it exists for a future different model, not for this direct reversal).
//
// NOTHING IS RECALCULATED. The stored snapshot is authoritative: a period is
// un-settled, not re-priced.
//
// CONCURRENCY: two protections, both required.
//   1. The advance restoration is guarded by `deductedAmount >= appliedAmount`,
//      so the same recovery can never be handed back twice even in principle.
//   2. The final transition is a conditional update on `status: 'SETTLED'`, so
//      only one request can ever move the document out of SETTLED. A loser
//      aborts the whole transaction and gets 409. Together with the
//      transaction's write-conflict detection this is safe under concurrency.
//
// PENALTIES ARE NOT RESTORED: a penalty is a period event and its
// `deductedAmount` was never incremented when the period was settled, so there
// is nothing to give back. Penalty records are never touched here.

export const reverseDoctorEmployeeSettlement = async (req, res) => {
  let session;
  try {
    const doctorId = req.userId;
    const { employeeId, settlementId } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Employee id must be a valid 24-character ObjectId'
      });
    }
    if (!isValidObjectId(String(settlementId))) {
      return res.status(400).json({
        success: false,
        message: 'Settlement id must be a valid 24-character ObjectId'
      });
    }
    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
      return res.status(400).json({ success: false, message: 'Notes must be a string' });
    }
    // NOTE: the model has no dedicated reversal-notes field. `notes` is the
    // settlement's own historical note and must NOT be overwritten, so the
    // optional reversal note is validated but not persisted (see the report).
    // No doctorId, period, currency, amount, adjustmentId or status is read
    // from the body — every value comes from the stored snapshot.

    // Scoped by BOTH _id and doctorId: a foreign employee is reported exactly
    // like a missing one.
    const employee = await DoctorEmployee.findOne({ _id: employeeId, doctorId })
      .select('_id fullName isActive');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    session = await mongoose.startSession();
    let reversed;

    try {
      await session.withTransaction(async () => {
        // Reload inside the transaction, scoped to this doctor AND this
        // employee. The stored snapshot is the source of truth.
        const settlement = await DoctorSalarySettlement.findOne(
          { _id: settlementId, doctorId, employeeId: String(employeeId) },
          { session }
        ).lean();

        if (!settlement) {
          const err = new Error('Settlement not found');
          err.statusCode = 404;
          throw err;
        }
        if (settlement.status !== 'SETTLED') {
          const err = new Error(
            'This salary period has already been reversed and cannot be reversed again.'
          );
          err.statusCode = 409;
          throw err;
        }


        // ---- Restore every advance this settlement consumed ----
        for (const detail of Array.isArray(settlement.advanceDetails)
          ? settlement.advanceDetails
          : []) {
          const applied = round2(detail?.appliedAmount);
          if (!(applied > 0)) continue;

          // newDeducted = deductedAmount - appliedAmount, evaluated against the
          // pre-image so a single pipeline stage stays atomic. It can never go
          // below zero: the guard below requires deductedAmount >= applied.
          const newDeducted = { $subtract: [{ $ifNull: ['$deductedAmount', 0] }, applied] };

          const restored = await DoctorEmployeeAdjustment.findOneAndUpdate(
            {
              _id: detail.adjustmentId,
              doctorId,
              employeeId: String(employeeId),
              type: 'ADVANCE',
              // The guard: never hand back more than was taken. A second
              // reversal finds deductedAmount already reduced, matches nothing,
              // and the whole transaction aborts.
              $expr: { $gte: [{ $ifNull: ['$deductedAmount', 0] }, applied] }
            },
            [
              {
                $set: {
                  deductedAmount: newDeducted,
                  status: {
                    $cond: [
                      { $lte: [newDeducted, 0] },
                      'PENDING',
                      {
                        $cond: [
                          { $gte: [newDeducted, '$amount'] },
                          'SETTLED',
                          'PARTIALLY_SETTLED'
                        ]
                      }
                    ]
                  },
                  updatedAt: new Date()
                }
              }
            ],
            { session, new: true }
          );

          if (!restored) {
            const err = new Error(
              'An advance on this salary period has changed since it was settled. Nothing was reversed.'
            );
            err.statusCode = 409;
            throw err;
          }
        }

        // ---- Guarded SETTLED -> REVERSED transition ----
        // ONLY the status changes. The financial snapshot, period, currency,
        // advance/penalty details, settledAt, reversalOf and timestamps are all
        // preserved exactly as they were when the period was paid.
        const updated = await DoctorSalarySettlement.findOneAndUpdate(
          {
            _id: settlementId,
            doctorId,
            employeeId: String(employeeId),
            status: 'SETTLED'
          },
          { $set: { status: 'REVERSED' } },
          { session, new: true }
        );

        if (!updated) {
          const err = new Error(
            'This salary period was reversed by another request. Nothing was reversed.'
          );
          err.statusCode = 409;
          throw err;
        }

        reversed = updated;
      });
    } catch (txError) {
      if (txError?.statusCode === 404 || txError?.statusCode === 409) {
        return res.status(txError.statusCode).json({
          success: false,
          message: txError.message
        });
      }
      throw txError;
    }

    return res.status(201).json({ success: true, settlement: reversed });
  } catch (err) {
    console.error('Error reversing doctor employee settlement:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error reversing settlement',
      error: err.message
    });
  } finally {
    if (session) await session.endSession();
  }
};

