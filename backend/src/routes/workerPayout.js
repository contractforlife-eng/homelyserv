// backend/src/routes/workerPayout.js
// Private worker payout details — persistence only, no payouts.
// Workers may read/update ONLY their own record. Ownership always comes
// from the authenticated token; userId is never accepted from the body.
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireWorker } from '../middleware/auth.js';

const router = express.Router();

// Allowed payout fields (must match the WorkerPayment form exactly).
const ALLOWED_FIELDS = [
  'walletNumber',
  'instapayNumber',
  'bankAccountNumber',
  'bankName',
  'accountHolderName'
];

const MAX_FIELD_LENGTH = 120;

// Lightweight validation:
//  - trims all strings
//  - rejects non-string values (objects/arrays/numbers) where strings expected
//  - caps input length
//  - requires account holder name when a bank account is entered
const sanitizePayoutDetails = (body) => {
  const errors = [];
  const data = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      continue;
    }

    if (typeof body[field] !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }

    const value = body[field].trim();

    if (!value) {
      continue;
    }

    if (value.length > MAX_FIELD_LENGTH) {
      errors.push(`${field} is too long (max ${MAX_FIELD_LENGTH} characters)`);
      continue;
    }

    data[field] = value;
  }

  if (data.bankAccountNumber && !data.accountHolderName) {
    errors.push('accountHolderName is required when a bank account is provided');
  }

  return { data, errors };
};

// ============================================================
// GET /api/worker/payout-details
// Returns the authenticated worker's payout details (or null).
// ============================================================
router.get('/payout-details', requireWorker, async (req, res) => {
  try {
    const userId = req.userId;

    const record = await prisma.workerPayoutDetails.findUnique({
      where: { userId }
    });

    // Never log full financial values.
    console.log(`[WorkerPayout] GET details for worker ${userId}: ${record ? 'found' : 'none'}`);

    res.json({
      success: true,
      payoutDetails: record || null
    });
  } catch (error) {
    console.error('[WorkerPayout] Error reading payout details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load payout details'
    });
  }
});

// ============================================================
// PUT /api/worker/payout-details
// Creates the record if missing, otherwise updates it.
// ============================================================
router.put('/payout-details', requireWorker, async (req, res) => {
  try {
    const userId = req.userId;
    const { data, errors } = sanitizePayoutDetails(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout details',
        errors
      });
    }

    const fieldsProvided = Object.keys(data);
    if (fieldsProvided.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payout details provided'
      });
    }

    const record = await prisma.workerPayoutDetails.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });

    // Log only what was saved, never the values.
    console.log(`[WorkerPayout] Saved payout details for ${userId} (${fieldsProvided.join(', ')})`);

    res.json({
      success: true,
      payoutDetails: record
    });
  } catch (error) {
    console.error('[WorkerPayout] Error saving payout details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save payout details'
    });
  }
});

export default router;