// backend/src/routes/externalJobs.js
// ============================================================
// EXPERIMENTAL EXTERNAL JOBS ROUTE — Phase 1 / Phase 1B / Jooble TR
// Authenticated proxy endpoint for Adzuna & Jooble Turkey Jobs.
// Worker only. Read-only. Never modifies database records.
// ============================================================
import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import { searchAdzunaJobs, ADZUNA_SUPPORTED_COUNTRIES } from '../services/adzunaService.js';
import { searchJoobleTurkeyJobs } from '../services/joobleService.js';
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
    let workerProfession = '';

    // If country is not explicitly passed, derive from worker user record
    try {
      const user = await User.findById(req.userId).select('countryCode countryName desiredJob profession');
      if (user?.desiredJob || user?.profession) {
        workerProfession = user.desiredJob || user.profession;
      }

      if (!targetCountry) {
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
      }
    } catch (userErr) {
      console.warn('ExternalJobs: could not resolve user registration country/profession:', userErr.message);
    }

    const normalizedCountry = normalizeCountryCode(targetCountry);
    const countryCodeLower = normalizedCountry ? normalizedCountry.toLowerCase() : null;

    // PROVIDER ROUTE 1: Turkey -> Jooble Turkey
    if (countryCodeLower === 'tr') {
      const joobleResult = await searchJoobleTurkeyJobs({
        what: typeof what === 'string' ? what : '',
        where: typeof where === 'string' ? where : '',
        page: page ? parseInt(page, 10) : 1,
        profession: workerProfession
      });

      return res.json(joobleResult);
    }

    // PROVIDER ROUTE 2: Supported by Adzuna -> Adzuna API
    if (countryCodeLower && ADZUNA_SUPPORTED_COUNTRIES.has(countryCodeLower)) {
      const result = await searchAdzunaJobs({
        country: countryCodeLower,
        what: typeof what === 'string' ? what : '',
        where: typeof where === 'string' ? where : '',
        page: page ? parseInt(page, 10) : 1
      });

      return res.json({
        success: true,
        provider: 'adzuna',
        ...result,
        supportedCountries: Array.from(ADZUNA_SUPPORTED_COUNTRIES)
      });
    }

    // PROVIDER ROUTE 3: Country completely missing or unsupported
    return res.json({
      success: true,
      supported: false,
      country: countryCodeLower || targetCountry || null,
      jobs: [],
      total: 0,
      reason: 'COUNTRY_NOT_SUPPORTED',
      supportedCountries: [...Array.from(ADZUNA_SUPPORTED_COUNTRIES), 'tr']
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
