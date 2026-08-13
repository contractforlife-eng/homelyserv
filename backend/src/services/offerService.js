// backend/src/services/offerService.js
// ============================================================
// SHARED OFFER CREATION — single source of truth for creating an
// Offer record. Used by BOTH:
//   - hireController.sendOffer (direct Employer send-offer)
//   - applicationController.sendOfferFromApplication (Job Marketplace)
//
// This service ONLY creates the Offer (status 'pending'). It does
// NOT create a Hire and does NOT compute commission — Hire creation
// and the 15% commission remain in the existing Worker accept flow
// (hireController.respondToOffer).
//
// contactRevealed / paymentConfirmed / paymentVerified are always
// false on creation; the contact-unlock flow is untouched.
// ============================================================
import prisma from '../lib/prisma.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

const STRICT_DECIMAL = /^\d+(?:\.\d+)?$/;

export class OfferValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OfferValidationError';
    this.statusCode = 400;
  }
}

const parseStrictPositiveDecimal = (value, fieldName) => {
  let numericValue;

  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string' && STRICT_DECIMAL.test(value)) {
    numericValue = Number(value);
  } else {
    throw new OfferValidationError(`${fieldName} must be a strict decimal number`);
  }

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new OfferValidationError(`${fieldName} must be greater than zero`);
  }

  return numericValue;
};

export const validateOfferMonetaryInput = ({ salary, hourlyRate = null, compensationCurrency }) => {
  const normalizedCurrency = normalizeCurrencyCode(compensationCurrency);
  if (!normalizedCurrency || !isSupportedCurrency(normalizedCurrency)) {
    throw new OfferValidationError('compensationCurrency must be a supported ISO currency code');
  }

  const normalizedSalary = parseStrictPositiveDecimal(salary, 'salary');
  const normalizedHourlyRate = hourlyRate === null || hourlyRate === undefined
    ? null
    : parseStrictPositiveDecimal(hourlyRate, 'hourlyRate');

  return {
    salary: normalizedSalary,
    hourlyRate: normalizedHourlyRate,
    amount: normalizedSalary,
    compensationCurrency: normalizedCurrency,
  };
};

/**
 * Create an Offer record.
 *
 * @param {Object} params
 * @param {string} params.employerId        - authenticated Employer User.id (req.userId)
 * @param {string} params.workerProfileId   - WorkerProfile.id (Offer.workerId)
 * @param {string} params.jobTitle          - required
 * @param {number} params.salary            - required, agreed salary
 * @param {string|null} [params.message]    - Employer-side offer message (NOT worker cover text)
 * @param {string|null} [params.workerName]
 * @param {string|null} [params.workerEmail]
 * @param {string|null} [params.workerPhone]
 * @param {string|null} [params.workerLocation]
 * @param {number|null} [params.workerRating]
 * @param {string[]} [params.workerSkills]
 * @param {string|null} [params.workerImage]
 * @param {string|null} [params.employerName]
 * @param {string|null} [params.employerEmail]
 * @param {number|null} [params.hourlyRate]
 * @param {number|null} [params.amount]
 * @param {string|null} [params.description]
 * @param {number|null} [params.workingHoursPerDay]
 * @param {number|null} [params.workingDaysPerWeek]
 * @param {string|null} [params.weeklyDaysOff]
 * @param {string|null} [params.workStartTime]
 * @param {string|null} [params.workEndTime]
 * @param {Date|string|null} [params.employmentStartDate]
 * @param {string|null} [params.additionalNotes]
 * @returns {Promise<Object>} the created Offer
 */
export const createOffer = async ({
  employerId,
  workerProfileId,
  jobTitle,
  salary,
  compensationCurrency,
  jobPostId = null,
  applicationId = null,
  message = null,
  workerName = null,
  workerEmail = null,
  workerPhone = null,
  workerLocation = null,
  workerRating = null,
  workerSkills = [],
  workerImage = null,
  employerName = null,
  employerEmail = null,
  hourlyRate = null,
  amount: _ignoredClientAmount = null,
  description = null,
  workingHoursPerDay = null,
  workingDaysPerWeek = null,
  weeklyDaysOff = null,
  workStartTime = null,
  workEndTime = null,
  employmentStartDate = null,
  additionalNotes = null,
}) => {
  const monetary = validateOfferMonetaryInput({ salary, hourlyRate, compensationCurrency });

  return prisma.offer.create({
    data: {
      workerId: workerProfileId,
      employerId: String(employerId),
      jobPostId,
      applicationId,
      jobTitle,
      message: message || null,
      salary: monetary.salary,
      compensationCurrency: monetary.compensationCurrency,
      status: 'pending',
      workerName: workerName || null,
      workerEmail: workerEmail || null,
      workerPhone: workerPhone || null,
      workerLocation: workerLocation || null,
      workerRating: workerRating ? parseFloat(workerRating) : null,
      workerSkills: workerSkills || [],
      workerImage: workerImage || null,
      employerName: employerName || null,
      employerEmail: employerEmail || null,
      hourlyRate: monetary.hourlyRate,
      amount: monetary.amount,
      description: description || null,
      workingHoursPerDay: workingHoursPerDay ? parseFloat(workingHoursPerDay) : null,
      workingDaysPerWeek: workingDaysPerWeek ? parseFloat(workingDaysPerWeek) : null,
      weeklyDaysOff: weeklyDaysOff ? String(weeklyDaysOff) : null,
      workStartTime: workStartTime || null,
      workEndTime: workEndTime || null,
      employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : null,
      additionalNotes: additionalNotes || null,
      contactRevealed: false,
      paymentConfirmed: false,
      paymentVerified: false,
    },
  });
};

export default { createOffer, validateOfferMonetaryInput };
