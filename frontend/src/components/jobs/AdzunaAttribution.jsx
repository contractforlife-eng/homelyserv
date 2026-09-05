// frontend/src/components/jobs/AdzunaAttribution.jsx
// ============================================================
// EXPERIMENTAL ADZUNA ATTRIBUTION COMPONENT — Phase 1B Final
// Strictly compliant with Adzuna API Terms of Service:
// 1. Labeled with "Jobs by Adzuna"
// 2. Minimum size of at least 116 x 23 pixels
// 3. "Jobs" hyperlinked to relevant Adzuna local market domain
// 4. "Adzuna" represented by official Adzuna Logo Image (from official press source)
// 5. Official Adzuna Logo Image hyperlinked to relevant Adzuna local market domain
// 6. Safe external navigation: target="_blank", rel="noopener noreferrer"
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';

// Official Adzuna market domain mapping
export const ADZUNA_MARKET_DOMAINS = Object.freeze({
  gb: 'https://www.adzuna.co.uk',
  us: 'https://www.adzuna.com',
  at: 'https://www.adzuna.at',
  au: 'https://www.adzuna.com.au',
  be: 'https://www.adzuna.be',
  br: 'https://www.adzuna.com.br',
  ca: 'https://www.adzuna.ca',
  ch: 'https://www.adzuna.ch',
  de: 'https://www.adzuna.de',
  es: 'https://www.adzuna.es',
  fr: 'https://www.adzuna.fr',
  in: 'https://www.adzuna.in',
  it: 'https://www.adzuna.it',
  mx: 'https://www.adzuna.com.mx',
  nl: 'https://www.adzuna.nl',
  nz: 'https://www.adzuna.co.nz',
  pl: 'https://www.adzuna.pl',
  ru: 'https://www.adzuna.ru',
  sg: 'https://www.adzuna.sg',
  za: 'https://www.adzuna.co.za'
});

const DEFAULT_ADZUNA_URL = 'https://www.adzuna.co.uk';

/**
 * Resolves the official Adzuna market website URL for a given country code.
 */
export const getAdzunaMarketUrl = (countryCode) => {
  if (!countryCode) return DEFAULT_ADZUNA_URL;
  const code = String(countryCode).toLowerCase().trim();
  return ADZUNA_MARKET_DOMAINS[code] || DEFAULT_ADZUNA_URL;
};

/**
 * AdzunaAttribution Component
 *
 * Renders "[Jobs] by [Adzuna Logo]" where:
 * - "Jobs" links to the market's specific Adzuna domain
 * - The official Adzuna logo image links to the same domain
 * - Dimensions are >= 116 x 23 px
 *
 * @param {Object} props
 * @param {string} [props.country] - Country code to direct the attribution links
 * @param {string} [props.className] - Optional custom CSS classes
 * @param {'card' | 'banner'} [props.variant='card'] - Display variant
 */
const AdzunaAttribution = ({ country, className = '', variant = 'card' }) => {
  const { t } = useTranslation();
  const targetUrl = getAdzunaMarketUrl(country);

  if (variant === 'banner') {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {t('externalJobs.disclaimerGeneral', 'External opportunities are provided by third parties and availability may vary by region.')}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 rounded-md shadow-sm"
          style={{ minWidth: '124px', minHeight: '26px' }}
        >
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition"
          >
            Jobs
          </a>
          <span className="text-gray-400 dark:text-gray-500 font-normal">by</span>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center"
            title="Adzuna"
          >
            <img
              src="/adzuna_logo.svg"
              alt="Adzuna"
              className="h-4 w-auto object-contain hover:opacity-85 transition-opacity"
              style={{ minHeight: '16px', maxWidth: '68px' }}
            />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm text-xs ${className}`}
      style={{ minWidth: '116px', minHeight: '24px' }}
    >
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 dark:text-gray-200 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition"
      >
        Jobs
      </a>
      <span className="text-gray-400 dark:text-gray-500 font-normal">by</span>
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
        title="Adzuna"
      >
        <img
          src="/adzuna_logo.svg"
          alt="Adzuna"
          className="h-3.5 w-auto object-contain hover:opacity-85 transition-opacity"
          style={{ minHeight: '14px', maxWidth: '60px' }}
        />
      </a>
    </div>
  );
};

export default AdzunaAttribution;
