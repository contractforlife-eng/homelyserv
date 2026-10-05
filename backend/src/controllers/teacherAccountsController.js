// backend/src/controllers/teacherAccountsController.js
// ============================================================
// TEACHER ACCOUNTS CONTROLLER
// ============================================================
// Internal bookkeeping for Teacher Income and Expenses.
// Strictly Teacher-scoped (req.userId).
// Currency buckets are computed separately; currencies are never summed.
// ============================================================
import mongoose from 'mongoose';
import TeacherIncome, { TEACHER_INCOME_SOURCES, TEACHER_INCOME_STATUSES } from '../models/TeacherIncome.js';
import TeacherExpense, { TEACHER_EXPENSE_CATEGORIES } from '../models/TeacherExpense.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherLesson from '../models/TeacherLesson.js';
import DoctorEmployee from '../models/DoctorEmployee.js';
import { buildOwnerScope } from '../services/employeeService.js';
import { fixedMonthlySalary } from './doctorAccountsController.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const cleanString = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const parseDateBound = (raw, field) => {
  if (raw === undefined || raw === null || raw === '') return { date: null };
  if (typeof raw !== 'string') return { error: `"${field}" must be a date string` };
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return { error: `"${field}" must be a valid ISO date` };
  return { date: new Date(ms) };
};

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

export const toTeacherIncomeDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    amount: Number(d.amount),
    currency: d.currency || 'EGP',
    incomeDate: d.incomeDate ? new Date(d.incomeDate).toISOString() : null,
    status: d.status || 'RECEIVED',
    source: d.source || 'OTHER',
    studentId: d.studentId ? String(d.studentId._id || d.studentId) : null,
    student: d.studentId && typeof d.studentId === 'object' ? {
      id: String(d.studentId._id),
      fullName: d.studentId.fullName || ''
    } : null,
    groupId: d.groupId ? String(d.groupId._id || d.groupId) : null,
    group: d.groupId && typeof d.groupId === 'object' ? {
      id: String(d.groupId._id),
      name: d.groupId.name || '',
      subject: d.groupId.subject || ''
    } : null,
    lessonId: d.lessonId ? String(d.lessonId._id || d.lessonId) : null,
    lesson: d.lessonId && typeof d.lessonId === 'object' ? {
      id: String(d.lessonId._id),
      date: d.lessonId.date ? new Date(d.lessonId.date).toISOString().split('T')[0] : null,
      subject: d.lessonId.subject || ''
    } : null,
    notes: d.notes || '',
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

export const toTeacherExpenseDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    teacherId: String(d.teacherId),
    category: d.category || 'OTHER',
    description: d.description || '',
    amount: Number(d.amount),
    currency: d.currency || 'EGP',
    expenseDate: d.expenseDate ? new Date(d.expenseDate).toISOString() : null,
    notes: d.notes || '',
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

// ============================================================
// INCOME HANDLERS
// ============================================================

export const getTeacherIncome = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { status, studentId, groupId } = req.query || {};

    const { error, filter: dateFilter } = buildDateRangeFilter(req.query || {}, 'incomeDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const filter = {
      teacherId,
      ...dateFilter
    };

    if (status && TEACHER_INCOME_STATUSES.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }
    if (studentId && isValidObjectId(String(studentId))) {
      filter.studentId = studentId;
    }
    if (groupId && isValidObjectId(String(groupId))) {
      filter.groupId = groupId;
    }

    const records = await TeacherIncome.find(filter)
      .sort({ incomeDate: -1, createdAt: -1 })
      .populate('studentId', 'fullName')
      .populate('groupId', 'name subject')
      .populate('lessonId', 'date subject');

    return res.json({
      success: true,
      count: records.length,
      income: records.map(toTeacherIncomeDto)
    });
  } catch (err) {
    console.error('Error fetching teacher income:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching income', error: err.message });
  }
};

export const createTeacherIncome = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { amount, currency, incomeDate, status, source, studentId, groupId, lessonId, notes } = req.body || {};

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount < 0 || numAmount > 1000000) {
      return res.status(400).json({ success: false, message: 'Valid amount between 0 and 1,000,000 is required' });
    }

    if (!incomeDate || Number.isNaN(Date.parse(incomeDate))) {
      return res.status(400).json({ success: false, message: 'Valid income date is required' });
    }

    const cleanSource = String(source || '').toUpperCase();
    if (!TEACHER_INCOME_SOURCES.includes(cleanSource)) {
      return res.status(400).json({ success: false, message: 'Valid income source is required' });
    }

    const cleanStatus = status ? String(status).toUpperCase() : 'RECEIVED';
    if (!TEACHER_INCOME_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'Valid income status (RECEIVED or PENDING) is required' });
    }

    // Ownership validation for studentId, groupId, lessonId
    let validStudentId = null;
    if (studentId) {
      if (!isValidObjectId(String(studentId))) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }
      const student = await TeacherStudent.findOne({ _id: studentId, teacherId, isActive: true });
      if (!student) {
        return res.status(400).json({ success: false, message: 'Selected student does not belong to your account' });
      }
      validStudentId = student._id;
    }

    let validGroupId = null;
    if (groupId) {
      if (!isValidObjectId(String(groupId))) {
        return res.status(400).json({ success: false, message: 'Invalid group ID' });
      }
      const group = await TeacherGroup.findOne({ _id: groupId, teacherId, isActive: true });
      if (!group) {
        return res.status(400).json({ success: false, message: 'Selected group does not belong to your account' });
      }
      validGroupId = group._id;
    }

    let validLessonId = null;
    if (lessonId) {
      if (!isValidObjectId(String(lessonId))) {
        return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
      }
      const lesson = await TeacherLesson.findOne({ _id: lessonId, teacherId, isActive: true });
      if (!lesson) {
        return res.status(400).json({ success: false, message: 'Selected lesson does not belong to your account' });
      }
      validLessonId = lesson._id;
    }

    const doc = await TeacherIncome.create({
      teacherId,
      amount: numAmount,
      currency: cleanString(currency, 10).toUpperCase() || 'EGP',
      incomeDate: new Date(incomeDate),
      status: cleanStatus,
      source: cleanSource,
      studentId: validStudentId,
      groupId: validGroupId,
      lessonId: validLessonId,
      notes: cleanString(notes, 1000)
    });

    const populated = await TeacherIncome.findById(doc._id)
      .populate('studentId', 'fullName')
      .populate('groupId', 'name subject')
      .populate('lessonId', 'date subject');

    return res.status(201).json({
      success: true,
      income: toTeacherIncomeDto(populated)
    });
  } catch (err) {
    console.error('Error creating teacher income:', err);
    return res.status(500).json({ success: false, message: 'Server error creating income', error: err.message });
  }
};

export const updateTeacherIncome = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    const record = await TeacherIncome.findOne({ _id: id, teacherId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    const { amount, currency, incomeDate, status, source, studentId, groupId, lessonId, notes } = req.body || {};

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (Number.isNaN(numAmount) || numAmount < 0 || numAmount > 1000000) {
        return res.status(400).json({ success: false, message: 'Valid amount between 0 and 1,000,000 is required' });
      }
      record.amount = numAmount;
    }

    if (currency !== undefined) {
      record.currency = cleanString(currency, 10).toUpperCase() || 'EGP';
    }

    if (incomeDate !== undefined) {
      if (!incomeDate || Number.isNaN(Date.parse(incomeDate))) {
        return res.status(400).json({ success: false, message: 'Valid income date is required' });
      }
      record.incomeDate = new Date(incomeDate);
    }

    if (status !== undefined) {
      const cleanStatus = String(status).toUpperCase();
      if (!TEACHER_INCOME_STATUSES.includes(cleanStatus)) {
        return res.status(400).json({ success: false, message: 'Valid income status (RECEIVED or PENDING) is required' });
      }
      record.status = cleanStatus;
    }

    if (source !== undefined) {
      const cleanSource = String(source).toUpperCase();
      if (!TEACHER_INCOME_SOURCES.includes(cleanSource)) {
        return res.status(400).json({ success: false, message: 'Valid income source is required' });
      }
      record.source = cleanSource;
    }

    if (studentId !== undefined) {
      if (studentId === null || studentId === '') {
        record.studentId = null;
      } else {
        if (!isValidObjectId(String(studentId))) {
          return res.status(400).json({ success: false, message: 'Invalid student ID' });
        }
        const student = await TeacherStudent.findOne({ _id: studentId, teacherId, isActive: true });
        if (!student) {
          return res.status(400).json({ success: false, message: 'Selected student does not belong to your account' });
        }
        record.studentId = student._id;
      }
    }

    if (groupId !== undefined) {
      if (groupId === null || groupId === '') {
        record.groupId = null;
      } else {
        if (!isValidObjectId(String(groupId))) {
          return res.status(400).json({ success: false, message: 'Invalid group ID' });
        }
        const group = await TeacherGroup.findOne({ _id: groupId, teacherId, isActive: true });
        if (!group) {
          return res.status(400).json({ success: false, message: 'Selected group does not belong to your account' });
        }
        record.groupId = group._id;
      }
    }

    if (lessonId !== undefined) {
      if (lessonId === null || lessonId === '') {
        record.lessonId = null;
      } else {
        if (!isValidObjectId(String(lessonId))) {
          return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
        }
        const lesson = await TeacherLesson.findOne({ _id: lessonId, teacherId, isActive: true });
        if (!lesson) {
          return res.status(400).json({ success: false, message: 'Selected lesson does not belong to your account' });
        }
        record.lessonId = lesson._id;
      }
    }

    if (notes !== undefined) {
      record.notes = cleanString(notes, 1000);
    }

    await record.save();

    const populated = await TeacherIncome.findById(record._id)
      .populate('studentId', 'fullName')
      .populate('groupId', 'name subject')
      .populate('lessonId', 'date subject');

    return res.json({
      success: true,
      income: toTeacherIncomeDto(populated)
    });
  } catch (err) {
    console.error('Error updating teacher income:', err);
    return res.status(500).json({ success: false, message: 'Server error updating income', error: err.message });
  }
};

export const deleteTeacherIncome = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    const deleted = await TeacherIncome.findOneAndDelete({ _id: id, teacherId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    return res.json({ success: true, message: 'Income record deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher income:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting income', error: err.message });
  }
};

// ============================================================
// EXPENSE HANDLERS
// ============================================================

export const getTeacherExpenses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { category } = req.query || {};

    const { error, filter: dateFilter } = buildDateRangeFilter(req.query || {}, 'expenseDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const filter = {
      teacherId,
      ...dateFilter
    };

    if (category && TEACHER_EXPENSE_CATEGORIES.includes(category.toUpperCase())) {
      filter.category = category.toUpperCase();
    }

    const records = await TeacherExpense.find(filter).sort({ expenseDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      expenses: records.map(toTeacherExpenseDto)
    });
  } catch (err) {
    console.error('Error fetching teacher expenses:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching expenses', error: err.message });
  }
};

export const createTeacherExpense = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { category, description, amount, currency, expenseDate, notes } = req.body || {};

    const cleanCat = String(category || '').toUpperCase();
    if (!TEACHER_EXPENSE_CATEGORIES.includes(cleanCat)) {
      return res.status(400).json({ success: false, message: 'Valid expense category is required' });
    }

    const cleanDesc = cleanString(description, 200);
    if (!cleanDesc) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount < 0 || numAmount > 1000000) {
      return res.status(400).json({ success: false, message: 'Valid amount between 0 and 1,000,000 is required' });
    }

    if (!expenseDate || Number.isNaN(Date.parse(expenseDate))) {
      return res.status(400).json({ success: false, message: 'Valid expense date is required' });
    }

    const doc = await TeacherExpense.create({
      teacherId,
      category: cleanCat,
      description: cleanDesc,
      amount: numAmount,
      currency: cleanString(currency, 10).toUpperCase() || 'EGP',
      expenseDate: new Date(expenseDate),
      notes: cleanString(notes, 1000)
    });

    return res.status(201).json({
      success: true,
      expense: toTeacherExpenseDto(doc)
    });
  } catch (err) {
    console.error('Error creating teacher expense:', err);
    return res.status(500).json({ success: false, message: 'Server error creating expense', error: err.message });
  }
};

export const updateTeacherExpense = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const record = await TeacherExpense.findOne({ _id: id, teacherId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const { category, description, amount, currency, expenseDate, notes } = req.body || {};

    if (category !== undefined) {
      const cleanCat = String(category).toUpperCase();
      if (!TEACHER_EXPENSE_CATEGORIES.includes(cleanCat)) {
        return res.status(400).json({ success: false, message: 'Valid expense category is required' });
      }
      record.category = cleanCat;
    }

    if (description !== undefined) {
      const cleanDesc = cleanString(description, 200);
      if (!cleanDesc) {
        return res.status(400).json({ success: false, message: 'Description cannot be empty' });
      }
      record.description = cleanDesc;
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (Number.isNaN(numAmount) || numAmount < 0 || numAmount > 1000000) {
        return res.status(400).json({ success: false, message: 'Valid amount between 0 and 1,000,000 is required' });
      }
      record.amount = numAmount;
    }

    if (currency !== undefined) {
      record.currency = cleanString(currency, 10).toUpperCase() || 'EGP';
    }

    if (expenseDate !== undefined) {
      if (!expenseDate || Number.isNaN(Date.parse(expenseDate))) {
        return res.status(400).json({ success: false, message: 'Valid expense date is required' });
      }
      record.expenseDate = new Date(expenseDate);
    }

    if (notes !== undefined) {
      record.notes = cleanString(notes, 1000);
    }

    await record.save();

    return res.json({
      success: true,
      expense: toTeacherExpenseDto(record)
    });
  } catch (err) {
    console.error('Error updating teacher expense:', err);
    return res.status(500).json({ success: false, message: 'Server error updating expense', error: err.message });
  }
};

export const deleteTeacherExpense = async (req, res) => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const deleted = await TeacherExpense.findOneAndDelete({ _id: id, teacherId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    return res.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher expense:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting expense', error: err.message });
  }
};

// ============================================================
// SUMMARY HANDLER
// ============================================================

export const getTeacherAccountsSummary = async (req, res) => {
  try {
    const teacherId = isValidObjectId(String(req.userId))
      ? new mongoose.Types.ObjectId(String(req.userId))
      : req.userId;

    const { error, filter: rangeFilter } = buildDateRangeFilter(req.query || {}, 'incomeDate');
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const fromDate = rangeFilter.incomeDate?.$gte || null;
    const toDate = rangeFilter.incomeDate?.$lte || null;
    const reportEnd = toDate || new Date();

    const dateBound = (field) => (
      fromDate || toDate
        ? { [field]: { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) } }
        : {}
    );

    const incomeRange = dateBound('incomeDate');
    const expenseRange = dateBound('expenseDate');

    const [
      receivedRows,
      pendingRows,
      expenseRows,
      receivedCountRows,
      pendingCountRows,
      expenseCountRows,
      activeEmployees
    ] = await Promise.all([
      // Received income
      TeacherIncome.aggregate([
        { $match: { teacherId, status: 'RECEIVED', ...incomeRange } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
      ]),
      // Pending / Outstanding income
      TeacherIncome.aggregate([
        { $match: { teacherId, status: 'PENDING', ...incomeRange } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
      ]),
      // Other Expenses (direct TeacherExpense records)
      TeacherExpense.aggregate([
        { $match: { teacherId, ...expenseRange } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
      ]),
      TeacherIncome.aggregate([
        { $match: { teacherId, status: 'RECEIVED', ...incomeRange } },
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]),
      TeacherIncome.aggregate([
        { $match: { teacherId, status: 'PENDING', ...incomeRange } },
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]),
      TeacherExpense.aggregate([
        { $match: { teacherId, ...expenseRange } },
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]),
      // Active employees who had already started by the report end
      DoctorEmployee.find({
        ...buildOwnerScope(req.userId),
        isActive: true,
        startDate: { $lte: reportEnd }
      }).select('salary currency startDate')
    ]);

    const toMap = (rows) => {
      const map = {};
      for (const row of rows || []) {
        const cur = String(row._id || 'EGP').toUpperCase();
        map[cur] = Number(row.total || 0);
      }
      return map;
    };

    const toCountMap = (rows) => {
      const map = {};
      for (const row of rows || []) {
        const cur = String(row._id || 'EGP').toUpperCase();
        map[cur] = Number(row.count || 0);
      }
      return map;
    };

    // Calculate dynamic salary obligations (never persisted as TeacherExpense records)
    const salaryTotals = {};
    for (const employee of activeEmployees || []) {
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
      const cur = String(employee.currency || 'EGP').toUpperCase();
      salaryTotals[cur] = (salaryTotals[cur] || 0) + contribution;
    }
    for (const key of Object.keys(salaryTotals)) {
      if (!salaryTotals[key]) delete salaryTotals[key];
    }

    const receivedIncome = toMap(receivedRows);
    const pendingIncome = toMap(pendingRows);
    const otherExpenses = toMap(expenseRows);

    const receivedCounts = toCountMap(receivedCountRows);
    const pendingCounts = toCountMap(pendingCountRows);
    const expenseCounts = toCountMap(expenseCountRows);

    const currencies = new Set([
      ...Object.keys(receivedIncome),
      ...Object.keys(pendingIncome),
      ...Object.keys(otherExpenses),
      ...Object.keys(salaryTotals)
    ]);

    const salaryExpense = {};
    const totalExpenses = {};
    const netProfit = {};
    for (const cur of [...currencies].sort()) {
      const other = Number(otherExpenses[cur] || 0);
      const salary = Number(salaryTotals[cur] || 0);
      const total = other + salary;
      const rec = Number(receivedIncome[cur] || 0);

      salaryExpense[cur] = salary;
      totalExpenses[cur] = total;
      netProfit[cur] = rec - total;
    }

    return res.json({
      success: true,
      summary: {
        dateRange: {
          from: fromDate ? fromDate.toISOString() : null,
          to: toDate ? toDate.toISOString() : null
        },
        currencyNote: 'All amounts are grouped strictly by currency and are never summed across currencies.',
        receivedIncome,
        pendingIncome,
        expenses: otherExpenses,
        salaryExpense,
        totalExpenses,
        netProfit,
        counts: {
          received: receivedCounts,
          pending: pendingCounts,
          expenses: expenseCounts
        }
      }
    });
  } catch (err) {
    console.error('Error generating teacher accounts summary:', err);
    return res.status(500).json({ success: false, message: 'Server error generating summary', error: err.message });
  }
};
