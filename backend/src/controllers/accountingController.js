// backend/src/controllers/accountingController.js
// ============================================================
// ACCOUNTING — Root-admin-only manual bookkeeping ledger.
//
// Endpoints (mounted on the admin router which already applies
// requireAdmin at the router level):
//   GET    /api/admin/accounting           list + filters + pagination
//   GET    /api/admin/accounting/summary   server-calculated totals by currency
//   POST   /api/admin/accounting           create entry
//   PATCH  /api/admin/accounting/:id       update entry
//   DELETE /api/admin/accounting/:id       delete entry
//
// Authorization: every handler enforces BOTH requireAdmin (router-level)
// AND isRootAdminRequest(server identity). Normal ADMINs, SUPPORT,
// WORKER, EMPLOYER, and unauthenticated callers are all rejected.
// ============================================================
import prisma from '../lib/prisma.js';
import User from '../models/User.js';
import { isRootAdminRequest } from '../security/rootAdmin.js';
import { addMoney, roundMoney } from '../utils/money.js';
import { normalizeCurrencyCode, isSupportedCurrency } from '../utils/currencyMetadata.js';

const TYPE_VALUES = new Set(['EXPENSE', 'INCOME']);
const STATUS_VALUES = new Set(['PAID', 'PENDING', 'CANCELLED']);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const ROOT_ONLY_MESSAGE = 'Root Admin access required';

// Single source of truth for the root-admin gate used by every handler.
// Returns true when the caller is an authorized Root Admin, otherwise
// sends a 403 and returns false so the handler can short-circuit.
const assertRootAdmin = async (req, res) => {
  const actingRoot = await isRootAdminRequest(req, User);
  if (!actingRoot) {
    res.status(403).json({ success: false, message: ROOT_ONLY_MESSAGE });
    return false;
  }
  return true;
};

// ---- Input validation helpers ---------------------------------
const normalizeText = (value) => (value === null || value === undefined ? undefined : String(value).trim());

const parseAmount = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    const err = new TypeError('amount must be a finite number');
    err.field = 'amount';
    throw err;
  }
  if (numeric <= 0) {
    const err = new RangeError('amount must be greater than 0');
    err.field = 'amount';
    throw err;
  }
  return numeric;
};

const parseDate = (value, field) => {
  if (value === null || value === undefined || value === '') {
    const err = new TypeError(`${field} is required`);
    err.field = field;
    throw err;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new TypeError(`Invalid ${field}`);
    err.field = field;
    throw err;
  }
  return date;
};

const validateCurrency = (value) => {
  const currency = normalizeCurrencyCode(value);
  if (!currency || !isSupportedCurrency(currency)) {
    const err = new TypeError('Invalid or unsupported currency');
    err.field = 'currency';
    throw err;
  }
  return currency;
};

const validateEnum = (value, valid, field) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!valid.has(normalized)) {
    const err = new TypeError(`Invalid ${field}: ${String(value)}`);
    err.field = field;
    throw err;
  }
  return normalized;
};

// Validate a partial entry body. When `partial=true` (PATCH), missing
// optional fields are allowed and immutable fields are forbidden.
const validateEntryBody = (body, { partial = false } = {}) => {
  const data = {};
  const errors = [];

  if (!partial) {
    if (body?.type === undefined || body?.type === '') {
      errors.push('type is required');
    } else {
      try { data.type = validateEnum(body.type, TYPE_VALUES, 'type'); } catch (e) { errors.push(e.message); }
    }

    if (body?.amount === undefined || body?.amount === '' || body?.amount === null) {
      errors.push('amount is required');
    } else {
      try { data.amount = parseAmount(body.amount); } catch (e) { errors.push(e.message); }
    }

    if (body?.currency === undefined || body?.currency === '') {
      errors.push('currency is required');
    } else {
      try { data.currency = validateCurrency(body.currency); } catch (e) { errors.push(e.message); }
    }

    if (body?.paymentDate === undefined || body?.paymentDate === '') {
      errors.push('paymentDate is required');
    } else {
      try { data.paymentDate = parseDate(body.paymentDate, 'paymentDate'); } catch (e) { errors.push(e.message); }
    }

    if (body?.category === undefined || body?.category === '') {
      errors.push('category is required');
    } else {
      data.category = normalizeText(body.category);
      if (!data.category) errors.push('category is required');
    }
  } else {
    // PATCH: only validate fields that are present.
    if (Object.prototype.hasOwnProperty.call(body, 'type')) {
      try { data.type = validateEnum(body.type, TYPE_VALUES, 'type'); } catch (e) { errors.push(e.message); }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      try { data.amount = parseAmount(body.amount); } catch (e) { errors.push(e.message); }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'currency')) {
      try { data.currency = validateCurrency(body.currency); } catch (e) { errors.push(e.message); }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'paymentDate')) {
      try { data.paymentDate = parseDate(body.paymentDate, 'paymentDate'); } catch (e) { errors.push(e.message); }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      data.category = normalizeText(body.category);
      if (!data.category) errors.push('category must not be empty');
    }
  }

  // Optional string fields (same for create + patch). Only assign a field
  // when the caller actually provided it, so a PATCH that omits an optional
  // field cannot blank an already-stored value. (Prisma ignores `undefined`,
  // but we make the intent explicit and robust against any version drift.)
  const OPTIONAL_STRINGS = ['provider', 'description', 'billingPeriod', 'invoiceNumber', 'receiptNumber', 'notes'];
  for (const key of OPTIONAL_STRINGS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const normalized = normalizeText(body[key]);
      if (normalized !== undefined) data[key] = normalized;
    }
  }

  if (body?.paymentStatus !== undefined && body?.paymentStatus !== '') {
    try { data.paymentStatus = validateEnum(body.paymentStatus, STATUS_VALUES, 'paymentStatus'); } catch (e) { errors.push(e.message); }
  }

  // Round amount to the correct minor unit for its currency so stored
  // values are always properly scaled (e.g. 9.999 USD -> 10.00).
  if (data.amount !== undefined && data.currency) {
    data.amount = roundMoney(data.amount, data.currency);
  }

  // For PATCH, forbid mutation of immutable fields.
  if (partial) {
    for (const forbidden of ['id', 'createdBy', 'createdAt']) {
      if (Object.prototype.hasOwnProperty.call(body, forbidden)) {
        errors.push(`Field '${forbidden}' cannot be modified`);
      }
    }
  }

  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  return data;
};

const buildWhereClause = (query) => {
  const where = {};

  if (query.type) {
    const normalized = String(query.type).trim().toUpperCase();
    if (TYPE_VALUES.has(normalized)) where.type = normalized;
  }

  if (query.currency) {
    const currency = normalizeCurrencyCode(query.currency);
    if (currency && isSupportedCurrency(currency)) where.currency = currency;
  }

  if (query.provider) {
    where.provider = { equals: String(query.provider) };
  }

  if (query.category) {
    where.category = { equals: String(query.category) };
  }

  if (query.paymentStatus) {
    const normalized = String(query.paymentStatus).trim().toUpperCase();
    if (STATUS_VALUES.has(normalized)) where.paymentStatus = normalized;
  }

  if (query.startDate) {
    const start = new Date(query.startDate);
    if (!Number.isNaN(start.getTime())) where.paymentDate = { ...where.paymentDate, gte: start };
  }

  if (query.endDate) {
    const end = new Date(query.endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setUTCHours(23, 59, 59, 999);
      where.paymentDate = { ...where.paymentDate, lte: end };
    }
  }

  return where;
};

// ---- Handlers -----------------------------------------------
export const listAccountingEntries = async (req, res) => {
  try {
    if (!(await assertRootAdmin(req, res))) return;

    const where = buildWhereClause(req.query);

    const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.accountingEntry.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountingEntry.count({ where }),
    ]);

    const serialized = entries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      provider: entry.provider,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      currency: entry.currency,
      paymentDate: entry.paymentDate,
      billingPeriod: entry.billingPeriod,
      paymentStatus: entry.paymentStatus,
      invoiceNumber: entry.invoiceNumber,
      receiptNumber: entry.receiptNumber,
      notes: entry.notes,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return res.json({
      success: true,
      entries: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get accounting entries error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load accounting entries' });
  }
};

// Safely sum a list of amounts for a currency. Returns 0 for an empty list.
const sumByCurrency = (amounts, currency) => {
  if (!amounts.length) return 0;
  try {
    return addMoney(amounts, currency);
  } catch {
    return 0;
  }
};

// Net = income summed minus expense amounts summed, kept within the
// same currency's minor-unit arithmetic (no cross-currency mixing).
const netByCurrency = (incomes, expenses, currency) => {
  const negatives = expenses.map((amount) => -Number(amount));
  const combined = [...incomes, ...negatives];
  if (!combined.length) return 0;
  try {
    return addMoney(combined, currency);
  } catch {
    return 0;
  }
};

const currentMonthRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

export const getAccountingSummary = async (req, res) => {
  try {
    if (!(await assertRootAdmin(req, res))) return;

    // Canonical realized totals count ONLY settled (PAID) entries.
    // PENDING and CANCELLED entries remain stored and listable in the
    // entries table (see listAccountingEntries), but they do NOT contribute
    // to income/expense/net totals because they are not realized cash flows.
    const [entries, monthEntries] = await Promise.all([
      prisma.accountingEntry.findMany({
        where: { paymentStatus: 'PAID' },
        select: { type: true, amount: true, currency: true, paymentDate: true },
      }),
      (async () => {
        const { start, end } = currentMonthRange();
        return prisma.accountingEntry.findMany({
          where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'PAID' },
          select: { type: true, amount: true, currency: true },
        });
      })(),
    ]);

    const groupByCurrency = (records) => {
      const map = {};
      for (const record of records) {
        const currency = normalizeCurrencyCode(record.currency);
        if (!currency || !isSupportedCurrency(currency)) continue;
        if (!map[currency]) map[currency] = { income: [], expense: [] };
        (record.type === 'INCOME' ? map[currency].income : map[currency].expense).push(record.amount);
      }
      return map;
    };

    const totalByCurrency = groupByCurrency(entries);
    const monthByCurrency = groupByCurrency(monthEntries);

    const orderedCurrencies = [...new Set([...Object.keys(totalByCurrency), ...Object.keys(monthByCurrency)])];
    orderedCurrencies.sort((a, b) => {
      const order = ['USD', 'EGP', 'EUR', 'GBP'];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      const ri = ai < 0 ? order.length : ai;
      const rbi = bi < 0 ? order.length : bi;
      return ri - rbi || a.localeCompare(b);
    });

    const byCurrency = orderedCurrencies.map((currency) => {
      const incomes = totalByCurrency[currency]?.income || [];
      const expenses = totalByCurrency[currency]?.expense || [];
      return {
        currency,
        totalIncome: sumByCurrency(incomes, currency),
        totalExpenses: sumByCurrency(expenses, currency),
        net: netByCurrency(incomes, expenses, currency),
      };
    });

    const currentMonthByCurrency = orderedCurrencies.map((currency) => {
      const incomes = monthByCurrency[currency]?.income || [];
      const expenses = monthByCurrency[currency]?.expense || [];
      return {
        currency,
        currentMonthIncome: sumByCurrency(incomes, currency),
        currentMonthExpenses: sumByCurrency(expenses, currency),
        currentMonthNet: netByCurrency(incomes, expenses, currency),
      };
    });

    return res.json({
      success: true,
      summary: {
        byCurrency,
        currentMonthByCurrency,
        semantic: 'groupby_currency_no_fx_conversion_paid_only',
      },
    });
  } catch (error) {
    console.error('Get accounting summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load accounting summary' });
  }
};

export const createAccountingEntry = async (req, res) => {
  try {
    if (!(await assertRootAdmin(req, res))) return;

    let data;
    try {
      data = validateEntryBody(req.body, { partial: false });
    } catch (error) {
      return res.status(error instanceof TypeError || error.status ? 400 : 500).json({
        success: false,
        message: error.message,
      });
    }

    data.createdBy = String(req.userId);

    const created = await prisma.accountingEntry.create({ data });

    return res.status(201).json({
      success: true,
      entry: created,
    });
  } catch (error) {
    console.error('Create accounting entry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create accounting entry' });
  }
};

export const updateAccountingEntry = async (req, res) => {
  try {
    if (!(await assertRootAdmin(req, res))) return;

    const { id } = req.params;

    let data;
    try {
      data = validateEntryBody(req.body, { partial: true });
    } catch (error) {
      return res.status(error instanceof TypeError || error.status ? 400 : 500).json({
        success: false,
        message: error.message,
      });
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ success: false, message: 'No editable fields provided' });
    }

    const existing = await prisma.accountingEntry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Accounting entry not found' });
    }

    // Re-validate amount against the resolved currency if only one changed.
    const resolvedCurrency = data.currency || existing.currency;
    if (data.amount !== undefined) {
      data.amount = roundMoney(data.amount, resolvedCurrency);
    }

    const updated = await prisma.accountingEntry.update({ where: { id }, data });

    return res.json({ success: true, entry: updated });
  } catch (error) {
    console.error('Update accounting entry error:', error);
    if (error.name === 'NotFoundError' || /NotFound|not found/i.test(error.message || '')) {
      return res.status(404).json({ success: false, message: 'Accounting entry not found' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update accounting entry' });
  }
};

export const deleteAccountingEntry = async (req, res) => {
  try {
    if (!(await assertRootAdmin(req, res))) return;

    const { id } = req.params;

    const existing = await prisma.accountingEntry.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Accounting entry not found' });
    }

    await prisma.accountingEntry.delete({ where: { id } });

    return res.json({ success: true, message: 'Accounting entry deleted' });
  } catch (error) {
    console.error('Delete accounting entry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete accounting entry' });
  }
};

export default {
  listAccountingEntries,
  getAccountingSummary,
  createAccountingEntry,
  updateAccountingEntry,
  deleteAccountingEntry,
};
