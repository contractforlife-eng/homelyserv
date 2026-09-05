// backend/src/routes/externalJobs.js
// ============================================================
// EXPERIMENTAL EXTERNAL JOBS ROUTE — Phase 1
// Authenticated proxy endpoint for Adzuna Jobs.
// Worker only. Read-only. Never modifies database records.
// ============================================================
import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import { searchAdzunaJobs, ADZUNA_SUPPORTED_COUNTRIES } from '../services/adzunaService.js';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { normalizeCountryCode } from '../utils/currencyMetadata.js';

const router = express.Router();

/**
 * GET /api/external-jobs
 * Query params:
 *   - page: integer (default 1)
 *   - what: string (keyword / job title / category)
 *   - where: string (city or region)
 *   - country: string (2-letter ISO country code)
 */
router.get('/', requireWorker, async (req, res) => {
  try {
    const { page, what, where, country } = req.query;

    let targetCountry = country ? String(country).trim() : null;

    // If country is not explicitly passed, derive from worker user record
    if (!targetCountry) {
      try {
        const user = await User.findById(req.userId).select('countryCode countryName');
        if (user?.countryCode) {
          targetCountry = user.countryCode;
        } else {
          // Fallback to Prisma lookup if needed
          const prismaUser = await prisma.user.findUnique({
            where: { id: String(req.userId) },
            select: { registrationCountryCode: true }
          });
          if (prismaUser?.registrationCountryCode) {
            targetCountry = prismaUser.registrationCountryCode;
          }
        }
      } catch (userErr) {
        console.warn('ExternalJobs: could not resolve user registration country:', userErr.message);
      }
    }

    const normalizedCountry = normalizeCountryCode(targetCountry);
    const countryCodeLower = normalizedCountry ? normalizedCountry.toLowerCase() : null;

    // If country is completely missing or not supported by Adzuna, return structured non-error response
    if (!countryCodeLower || !ADZUNA_SUPPORTED_COUNTRIES.has(countryCodeLower)) {
      return res.json({
        success: true,
        supported: false,
        country: countryCodeLower || targetCountry || null,
        jobs: [],
        total: 0,
        reason: 'COUNTRY_NOT_SUPPORTED',
        supportedCountries: Array.from(ADZUNA_SUPPORTED_COUNTRIES)
      });
    }

    const result = await searchAdzunaJobs({
      country: countryCodeLower,
      what: typeof what === 'string' ? what : '',
      where: typeof where === 'string' ? where : '',
      page: page ? parseInt(page, 10) : 1
    });

    return res.json({
      success: true,
      ...result,
      supportedCountries: Array.from(ADZUNA_SUPPORTED_COUNTRIES)
    });
  } catch (error) {
    console.error('ExternalJobs route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch external jobs',
      jobs: [],
      supported: true
    });
  }
});

export default router;
