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
import { searchUsajobsJobs } from '../services/usajobsService.js';
import { searchJobicyJobs } from '../services/jobicyService.js';
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
 * Normalizes string for conservative deduplication comparison.
 */
const normalizeKeyPart = (str) => (typeof str === 'string' ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

/**
 * Deduplicates external jobs conservatively by title + company + location.
 */
const dedupeExternalJobs = (jobList) => {
  const seen = new Set();
  const deduped = [];
  for (const job of jobList) {
    if (!job) continue;
    const titleKey = normalizeKeyPart(job.title);
    const compKey = normalizeKeyPart(job.company);
    const locKey = normalizeKeyPart(job.location);
    if (titleKey && compKey && locKey) {
      const compositeKey = `${titleKey}|${compKey}|${locKey}`;
      if (seen.has(compositeKey)) {
        continue;
      }
      seen.add(compositeKey);
    }
    deduped.push(job);
  }
  return deduped;
};

/**
 * GET /api/external-jobs
 * Query params:
 *   - page: integer (default 1)
 *   - what: string (keyword / job title / category)
 *   - where: string (city or region)
 *   - country: string (2-letter ISO country code)
 *   - remote: boolean (if true, proxies to Jobicy remote jobs)
 *   - count: integer (for remote results)
 */
router.get('/', requireWorker, async (req, res) => {
  try {
    const { page, what, where, country, remote, count } = req.query;

    // REMOTE MODE: Isolated Jobicy Remote Jobs query
    if (String(remote).toLowerCase() === 'true') {
      const jobicyResult = await searchJobicyJobs({
        what: typeof what === 'string' ? what : '',
        geo: typeof where === 'string' ? where : '',
        count: count ? parseInt(count, 10) : 20
      });
      return res.json(jobicyResult);
    }

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

    // PROVIDER ROUTE 2: United States -> Parallel Aggregation (Adzuna US + USAJOBS)
    if (countryCodeLower === 'us') {
      const pageNum = page ? parseInt(page, 10) : 1;
      const safeWhat = typeof what === 'string' ? what : '';
      const safeWhere = typeof where === 'string' ? where : '';

      const [adzunaSettled, usajobsSettled] = await Promise.allSettled([
        searchAdzunaJobs({
          country: 'us',
          what: safeWhat,
          where: safeWhere,
          page: pageNum
        }),
        searchUsajobsJobs({
          what: safeWhat,
          where: safeWhere,
          page: pageNum,
          profession: workerProfession
        })
      ]);

      const adzunaRes = adzunaSettled.status === 'fulfilled' ? adzunaSettled.value : null;
      const usajobsRes = usajobsSettled.status === 'fulfilled' ? usajobsSettled.value : null;

      const adzunaJobs = Array.isArray(adzunaRes?.jobs) ? adzunaRes.jobs : [];
      const usajobsJobs = Array.isArray(usajobsRes?.jobs) ? usajobsRes.jobs : [];

      // If both providers succeeded or at least one returned jobs
      if (adzunaJobs.length > 0 || usajobsJobs.length > 0) {
        const combined = [];
        const maxLen = Math.max(adzunaJobs.length, usajobsJobs.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < adzunaJobs.length) combined.push(adzunaJobs[i]);
          if (i < usajobsJobs.length) combined.push(usajobsJobs[i]);
        }
        const dedupedJobs = dedupeExternalJobs(combined);
        const total = (typeof adzunaRes?.total === 'number' ? adzunaRes.total : adzunaJobs.length) +
                      (typeof usajobsRes?.total === 'number' ? usajobsRes.total : usajobsJobs.length);

        const providerLabel = 'multi';

        return res.json({
          success: true,
          supported: true,
          configured: true,
          provider: providerLabel,
          country: 'us',
          page: pageNum,
          total,
          jobs: dedupedJobs,
          providers: {
            adzuna: { count: adzunaJobs.length, total: adzunaRes?.total || adzunaJobs.length },
            usajobs: { count: usajobsJobs.length, total: usajobsRes?.total || usajobsJobs.length }
          },
          supportedCountries: Array.from(ADZUNA_SUPPORTED_COUNTRIES)
        });
      }

      // Check if query was required
      if (adzunaRes?.reason === 'SEARCH_TERM_REQUIRED' && usajobsRes?.reason === 'SEARCH_TERM_REQUIRED') {
        return res.json({
          success: true,
          supported: true,
          provider: 'multi',
          country: 'us',
          configured: true,
          jobs: [],
          total: 0,
          reason: 'SEARCH_TERM_REQUIRED'
        });
      }

      // If either provider is configured and returned 0 jobs without error
      if (adzunaRes?.success && usajobsRes?.success) {
        return res.json({
          success: true,
          supported: true,
          provider: 'multi',
          country: 'us',
          configured: true,
          jobs: [],
          total: 0,
          page: pageNum
        });
      }

      // If one succeeded with 0 jobs and the other errored
      if (adzunaRes?.success) {
        return res.json({
          success: true,
          supported: true,
          provider: 'multi',
          country: 'us',
          configured: adzunaRes.configured !== false,
          jobs: [],
          total: 0,
          reason: adzunaRes.reason
        });
      }
      if (usajobsRes?.success) {
        return res.json({
          success: true,
          supported: true,
          provider: 'multi',
          country: 'us',
          configured: usajobsRes.configured !== false,
          jobs: [],
          total: 0,
          reason: usajobsRes.reason
        });
      }

      // If both errored / failed
      return res.json({
        success: true,
        supported: true,
        provider: 'multi',
        country: 'us',
        configured: true,
        jobs: [],
        total: 0,
        error: adzunaRes?.error || usajobsRes?.error || 'UPSTREAM_ERROR'
      });
    }

    // PROVIDER ROUTE 3: Other Countries Supported by Adzuna -> Adzuna API
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
