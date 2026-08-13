// backend/src/routes/jobs.js
// ============================================================
// JOB MARKETPLACE PHASE 1 — JobPost CRUD (no applications yet).
// employerId is ALWAYS derived from the authenticated token
// (req.userId) and never trusted from the request body.
// Workers can browse `open` jobs only; the owning employer can
// manage their own posts in any status.
// ============================================================
import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireEmployer } from '../middleware/auth.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

const router = express.Router();

const JOB_STATUSES = ['open', 'paused', 'closed'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'freelance'];

const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ARRAY_ITEMS = 20;
const MAX_ITEM_LENGTH = 200;

// ============================================================
// VALIDATION HELPERS
// ============================================================
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const cleanString = (value, maxLength) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (str.length === 0) return null;
  if (maxLength && str.length > maxLength) return undefined;
  return str;
};

const STRICT_DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;
const COMPENSATION_FIELDS = ['salaryMin', 'salaryMax', 'compensationCurrency'];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parseCompensationAmount = (value, field, errors) => {
  if (value === null) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${field} must be a finite non-negative number`);
      return undefined;
    }
    return value;
  }

  if (typeof value === 'string' && STRICT_DECIMAL_PATTERN.test(value)) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  errors.push(`${field} must be a strict finite non-negative decimal`);
  return undefined;
};

const parseCompensationFilterAmount = (value, field) => {
  if (typeof value !== 'string' || !STRICT_DECIMAL_PATTERN.test(value)) {
    return { error: `${field} must be a strict non-negative decimal` };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { error: `${field} must be a finite non-negative number` };
  }

  return { value: parsed };
};

export const buildCompensationFilter = ({ salaryMin, salaryMax, compensationCurrency }) => {
  const hasSalaryMin = salaryMin !== undefined;
  const hasSalaryMax = salaryMax !== undefined;
  const hasNumericFilter = hasSalaryMin || hasSalaryMax;
  const hasCurrencyFilter = compensationCurrency !== undefined;

  if (!hasNumericFilter) {
    if (hasCurrencyFilter) {
      return { error: 'compensationCurrency is only supported with salaryMin or salaryMax' };
    }
    return { conditions: [] };
  }

  const normalizedCurrency = normalizeCurrencyCode(compensationCurrency);
  if (!normalizedCurrency || !isSupportedCurrency(normalizedCurrency)) {
    return { error: 'A supported compensationCurrency is required for salary filtering' };
  }

  const parsedMin = hasSalaryMin
    ? parseCompensationFilterAmount(salaryMin, 'salaryMin')
    : { value: null };
  if (parsedMin.error) return parsedMin;

  const parsedMax = hasSalaryMax
    ? parseCompensationFilterAmount(salaryMax, 'salaryMax')
    : { value: null };
  if (parsedMax.error) return parsedMax;

  if (parsedMin.value !== null && parsedMax.value !== null && parsedMin.value > parsedMax.value) {
    return { error: 'salaryMin must be less than or equal to salaryMax' };
  }

  const currencyCondition = normalizedCurrency === 'EGP'
    ? {
        OR: [
          { compensationCurrency: 'EGP' },
          { compensationCurrency: null },
          { compensationCurrency: { isSet: false } },
        ],
      }
    : { compensationCurrency: normalizedCurrency };

  const conditions = [
    currencyCondition,
    {
      OR: [
        { salaryMin: { not: null, isSet: true } },
        { salaryMax: { not: null, isSet: true } },
      ],
    },
  ];

  if (parsedMin.value !== null) {
    conditions.push({
      OR: [
        { salaryMax: { gte: parsedMin.value } },
        { salaryMax: null },
        { salaryMax: { isSet: false } },
      ],
    });
  }

  if (parsedMax.value !== null) {
    conditions.push({
      OR: [
        { salaryMin: { lte: parsedMax.value } },
        { salaryMin: null },
        { salaryMin: { isSet: false } },
      ],
    });
  }

  return { conditions, normalizedCurrency };
};

const validateCompensation = (body, data, errors, { partial, existingJob }) => {
  const touched = COMPENSATION_FIELDS.some((field) => hasOwn(body, field));
  if (partial && !touched) return;

  for (const field of ['salaryMin', 'salaryMax']) {
    if (hasOwn(body, field)) {
      const parsed = parseCompensationAmount(body[field], field, errors);
      if (parsed !== undefined) data[field] = parsed;
    }
  }

  if (hasOwn(body, 'compensationCurrency')) {
    if (body.compensationCurrency === null) {
      data.compensationCurrency = null;
    } else {
      const normalized = normalizeCurrencyCode(body.compensationCurrency);
      if (!normalized || !isSupportedCurrency(normalized)) {
        errors.push('compensationCurrency must be a supported ISO currency code');
      } else {
        data.compensationCurrency = normalized;
      }
    }
  }

  if (errors.length > 0) return;

  const existingSalaryMin = existingJob?.salaryMin ?? null;
  const existingSalaryMax = existingJob?.salaryMax ?? null;
  const existingCurrency = existingJob?.compensationCurrency ?? null;
  const resultingSalaryMin = hasOwn(body, 'salaryMin') ? data.salaryMin : existingSalaryMin;
  const resultingSalaryMax = hasOwn(body, 'salaryMax') ? data.salaryMax : existingSalaryMax;
  const resultingCurrency = hasOwn(body, 'compensationCurrency')
    ? data.compensationCurrency
    : existingCurrency;
  const hasCompensation = resultingSalaryMin !== null || resultingSalaryMax !== null;

  if (hasCompensation && resultingCurrency === null) {
    errors.push('compensationCurrency is required when salaryMin or salaryMax is provided');
  }

  if (!hasCompensation && resultingCurrency !== null) {
    errors.push('compensationCurrency must be null when no compensation amount is provided');
  }

  if (
    resultingSalaryMin !== null &&
    resultingSalaryMax !== null &&
    resultingSalaryMax < resultingSalaryMin
  ) {
    errors.push('salaryMax must be greater than or equal to salaryMin');
  }

  const currencyChanged = partial && resultingCurrency !== existingCurrency;
  if (currencyChanged && hasCompensation) {
    const retainedMinWasReentered = resultingSalaryMin === null ||
      (hasOwn(body, 'salaryMin') && data.salaryMin !== null);
    const retainedMaxWasReentered = resultingSalaryMax === null ||
      (hasOwn(body, 'salaryMax') && data.salaryMax !== null);

    if (!retainedMinWasReentered || !retainedMaxWasReentered) {
      errors.push('Changing compensationCurrency requires re-entering every retained salary bound');
    }
  }
};

const validateJobPayload = (body, { partial = false, existingJob = null } = {}) => {
  const errors = [];
  const data = {};

  const isProvided = (key) => body[key] !== undefined && body[key] !== null && body[key] !== '';

  // jobTitle — required on create, optional on partial edit
  if (isProvided('jobTitle')) {
    const title = cleanString(body.jobTitle, MAX_TITLE_LENGTH);
    if (title === undefined) errors.push('jobTitle is too long');
    else if (!title) errors.push('jobTitle is required');
    else data.jobTitle = title;
  } else if (!partial) {
    errors.push('jobTitle is required');
  }

  if (isProvided('description')) {
    const description = cleanString(body.description, MAX_DESCRIPTION_LENGTH);
    if (description === undefined) errors.push('description is too long');
    else data.description = description;
  }

  if (isProvided('location')) {
    const location = cleanString(body.location, 200);
    if (location === undefined) errors.push('location is too long');
    else data.location = location;
  }

  // Salary — must be >= 0; salaryMax >= salaryMin when both present
  validateCompensation(body, data, errors, { partial, existingJob });

  if (isProvided('employmentType')) {
    const type = cleanString(body.employmentType, 30);
    if (type === undefined || !EMPLOYMENT_TYPES.includes(type)) {
      errors.push(`employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`);
    } else {
      data.employmentType = type;
    }
  }

  if (isProvided('contractType')) {
    const contractType = cleanString(body.contractType, 50);
    if (contractType === undefined) errors.push('contractType is too long');
    else data.contractType = contractType;
  }

  if (isProvided('workingHoursPerDay')) {
    const hours = Number(body.workingHoursPerDay);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      errors.push('workingHoursPerDay must be a number between 0 and 24');
    } else {
      data.workingHoursPerDay = hours;
    }
  }

  if (isProvided('workingDaysPerWeek')) {
    const days = Number(body.workingDaysPerWeek);
    if (!Number.isFinite(days) || days < 0 || days > 7) {
      errors.push('workingDaysPerWeek must be a number between 0 and 7');
    } else {
      data.workingDaysPerWeek = days;
    }
  }

  for (const field of ['weeklyDaysOff', 'workStartTime', 'workEndTime']) {
    if (isProvided(field)) {
      const value = cleanString(body[field], 100);
      if (value === undefined) errors.push(`${field} is too long`);
      else data[field] = value;
    }
  }

  for (const field of ['employmentStartDate', 'deadline']) {
    if (isProvided(field)) {
      const date = new Date(body[field]);
      if (Number.isNaN(date.getTime())) {
        errors.push(`${field} must be a valid date`);
      } else {
        data[field] = date;
      }
    }
  }

  for (const field of ['requirements', 'benefits']) {
    if (isProvided(field)) {
      if (!Array.isArray(body[field])) {
        errors.push(`${field} must be an array of strings`);
        continue;
      }
      if (body[field].length > MAX_ARRAY_ITEMS) {
        errors.push(`${field} cannot have more than ${MAX_ARRAY_ITEMS} items`);
        continue;
      }
      const items = body[field]
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
      if (items.some((item) => item.length > MAX_ITEM_LENGTH)) {
        errors.push(`${field} items cannot exceed ${MAX_ITEM_LENGTH} characters`);
        continue;
      }
      data[field] = items;
    }
  }

  for (const field of ['isUrgent', 'isFeatured']) {
    if (isProvided(field)) {
      data[field] = Boolean(body[field]);
    }
  }

  return { errors, data };
};

// ============================================================
// SAFE EMPLOYER DISPLAY DATA
// Batched lookup of EmployerProfile + User. Never exposes
// email / phone / security / payment / internal fields.
// ============================================================
const safeEmployerInfo = async (employerId) => {
  try {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: String(employerId) },
        select: { id: true, fullName: true, city: true },
      }),
      prisma.employerProfile.findUnique({
        where: { userId: String(employerId) },
        select: { companyName: true, industry: true },
      }),
    ]);

    return {
      id: String(employerId),
      fullName: user?.fullName || null,
      city: user?.city || null,
      companyName: profile?.companyName || null,
      industry: profile?.industry || null,
    };
  } catch (error) {
    console.error('Jobs: employer info lookup failed:', error.message);
    return { id: String(employerId), fullName: null, city: null, companyName: null, industry: null };
  }
};

// ============================================================
// POST /api/jobs — Employer only, create as req.userId
// ============================================================
router.post('/', requireEmployer, async (req, res) => {
  try {
    const { errors, data } = validateJobPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const job = await prisma.jobPost.create({
      data: {
        ...data,
        employerId: String(req.userId),
        status: req.body.status === 'closed' || req.body.status === 'paused'
          ? req.body.status
          : 'open',
      },
    });

    res.status(201).json({ success: true, message: 'Job posted successfully', job });
  } catch (error) {
    console.error('Jobs: create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
});

// ============================================================
// GET /api/jobs/mine — Employer only, own posts any status
// (defined before /:id so 'mine' is not captured as an id)
// ============================================================
router.get('/mine', requireEmployer, async (req, res) => {
  try {
    const jobs = await prisma.jobPost.findMany({
      where: { employerId: String(req.userId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Jobs: my jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load your jobs' });
  }
});

// ============================================================
// GET /api/jobs — Worker browse, OPEN only, newest first
// ============================================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, location, employmentType, salaryMin, salaryMax, compensationCurrency } = req.query;

    const where = { status: 'open' };

    if (query && String(query).trim()) {
      const q = String(query).trim();
      where.OR = [
        { jobTitle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (location && String(location).trim()) {
      where.location = { contains: String(location).trim(), mode: 'insensitive' };
    }

    if (employmentType && String(employmentType).trim()) {
      where.employmentType = String(employmentType).trim();
    }

    const compensationFilter = buildCompensationFilter({
      salaryMin,
      salaryMax,
      compensationCurrency,
    });
    if (compensationFilter.error) {
      return res.status(400).json({ success: false, message: compensationFilter.error });
    }
    if (compensationFilter.conditions.length > 0) {
      where.AND = compensationFilter.conditions;
    }

    const jobs = await prisma.jobPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Attach safe employer display data (no private contact info).
    const employerIds = [...new Set(jobs.map((job) => String(job.employerId)))];
    const employersMap = new Map();
    for (const employerId of employerIds) {
      employersMap.set(employerId, await safeEmployerInfo(employerId));
    }

    const enriched = jobs.map((job) => ({
      ...job,
      employer: employersMap.get(String(job.employerId)) || null,
    }));

    res.json({ success: true, jobs: enriched });
  } catch (error) {
    console.error('Jobs: browse error:', error);
    res.status(500).json({ success: false, message: 'Failed to load jobs' });
  }
});

// ============================================================
// GET /api/jobs/:id — authenticated worker or employer.
// Workers only see OPEN jobs; the owning employer sees any status.
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = await prisma.jobPost.findUnique({ where: { id: String(req.params.id) } });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isOwner = req.userRole === 'EMPLOYER' && String(job.employerId) === String(req.userId);

    if (job.status !== 'open' && !isOwner) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const employer = await safeEmployerInfo(job.employerId);

    res.json({ success: true, job: { ...job, employer } });
  } catch (error) {
    console.error('Jobs: detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load job' });
  }
});

// ============================================================
// PATCH /api/jobs/:id — Employer owner only, safe edit of fields
// ============================================================
router.patch('/:id', requireEmployer, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = await prisma.jobPost.findUnique({ where: { id: String(req.params.id) } });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (String(job.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Allow owners to also update status via the same edit endpoint.
    const { errors, data } = validateJobPayload(req.body, { partial: true, existingJob: job });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    if (req.body.status && JOB_STATUSES.includes(String(req.body.status))) {
      data.status = String(req.body.status);
    }

    const updated = await prisma.jobPost.update({
      where: { id: job.id },
      data,
    });

    res.json({ success: true, message: 'Job updated successfully', job: updated });
  } catch (error) {
    console.error('Jobs: update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
});

// ============================================================
// PATCH /api/jobs/:id/status — Employer owner only
// Allowed: open | paused | closed
// ============================================================
router.patch('/:id/status', requireEmployer, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !JOB_STATUSES.includes(String(status))) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${JOB_STATUSES.join(', ')}`,
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const job = await prisma.jobPost.findUnique({ where: { id: String(req.params.id) } });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (String(job.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.jobPost.update({
      where: { id: job.id },
      data: { status: String(status) },
    });

    res.json({ success: true, message: `Job status updated to ${status}`, job: updated });
  } catch (error) {
    console.error('Jobs: status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status' });
  }
});

export default router;
