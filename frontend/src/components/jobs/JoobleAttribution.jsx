// frontend/src/components/jobs/JoobleAttribution.jsx
// ============================================================
// EXPERIMENTAL JOOBLE ATTRIBUTION COMPONENT — Phase 1
// Clear text and link attribution for Jooble Turkey partner results.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';

const JOOBLE_TR_URL = 'https://tr.jooble.org';

const JoobleAttribution = ({ className = '', variant = 'card' }) => {
  const { t } = useTranslation();

  if (variant === 'banner') {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            {t('externalJobs.disclaimerGeneral', 'External opportunities are provided by third parties and availability may vary by region.')}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 rounded-md shadow-sm"
          style={{ minWidth: '124px', minHeight: '26px' }}
        >
          <a
            href={JOOBLE_TR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition"
          >
            Jobs
          </a>
          <span className="text-gray-400 dark:text-gray-500 font-normal">by</span>
          <a
            href={JOOBLE_TR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition"
          >
            Jooble
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
        href={JOOBLE_TR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-700 dark:text-gray-200 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition"
      >
        Jobs
      </a>
      <span className="text-gray-400 dark:text-gray-500 font-normal">by</span>
      <a
        href={JOOBLE_TR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition"
      >
        Jooble
      </a>
    </div>
  );
};

export default JoobleAttribution;
