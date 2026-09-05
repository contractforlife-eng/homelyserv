// backend/src/routes/externalJobs.js
// ============================================================
// EXPERIMENTAL EXTERNAL JOBS ROUTE — Phase 1 / Phase 1B / Jooble TR
// Authenticated proxy endpoint for Adzuna & Jooble Turkey Jobs.
// Worker only. Read-only. Never modifies database records.
// ============================================================
import express from 'express';
import { requireWorker } from '../middleware/auth.js';
import { searchAdzunaJobs, ADZUNA_SUPPORTED_COUNTRIES } from '../services/adzunaService.js';
import { searchJoobleJobs } from '../services/joobleService.js';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { normalizeCountryCode } from '../utils/currencyMetadata.js';
import { supportedCountries } from '../utils/supportedCountries.js';

const router = express.Router();

// Supported Jooble country codes
const JOOBLE_SUPPORTED_COUNTRIES = new Set(['tr', 'eg']);

// Name-to-code lookup map built from canonical supportedCountries list
const countriesByName = new Map(
  supportedCountries.map(({ code, name }) => [name.trim().toLowerCase(), code])
);

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
      const user = await User.findById(req.userId).select(
        'countryCode countryName desiredJob profession +registrationCountryCode +registrationCountryName'
      );
      if (user?.desiredJob || user?.profession) {
        workerProfession = user.desiredJob || user.profession;
      }

      if (!targetCountry) {
        // Priority 1: user.countryCode
        if (user?.countryCode && String(user.countryCode).trim()) {
          targetCountry = user.countryCode;
        // Priority 2: user.registrationCountryCode
        } else if (user?.registrationCountryCode && String(user.registrationCountryCode).trim()) {
          targetCountry = user.registrationCountryCode;
        // Priority 3: derive from user.countryName using existing supported country metadata
        } else if (user?.countryName && typeof user.countryName === 'string') {
          const matchedCode = countriesByName.get(user.countryName.trim().toLowerCase());
          if (matchedCode) targetCountry = matchedCode;
        // Priority 4: derive from user.registrationCountryName using existing supported country metadata
        } else if (user?.registrationCountryName && typeof user.registrationCountryName === 'string') {
          const matchedCode = countriesByName.get(user.registrationCountryName.trim().toLowerCase());
          if (matchedCode) targetCountry = matchedCode;
        } else {
          // Priority 5: Fallback to Prisma lookup if needed
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

    // PROVIDER ROUTE 1: Turkey / Egypt -> Jooble Service
    if (countryCodeLower && JOOBLE_SUPPORTED_COUNTRIES.has(countryCodeLower)) {
      const joobleResult = await searchJoobleJobs({
        country: countryCodeLower,
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
      supportedCountries: [...Array.from(ADZUNA_SUPPORTED_COUNTRIES), ...Array.from(JOOBLE_SUPPORTED_COUNTRIES)]
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
