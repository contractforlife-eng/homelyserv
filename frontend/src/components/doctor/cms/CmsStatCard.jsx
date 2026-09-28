// frontend/src/components/doctor/cms/CmsStatCard.jsx
// ============================================================
// Shared CMS stat card.
// Used by the Clinic Management System pages (Overview, Reports).
// Presentational only — the value always comes from a real backend
// response, never from a hardcoded or invented number.
// Works in light + dark mode and in Arabic RTL (the arrow respects
// the logical direction with rtl:rotate-180).
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CmsStatCard = ({
  icon: Icon,
  label,
  value,
  color = 'text-red-600 bg-red-50 dark:bg-red-950/40',
  path,
  hint
}) => {
  const content = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {Icon ? <Icon size={20} /> : null}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{label}</p>
      {hint ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
          {hint}
          <ArrowRight size={12} className="rtl:rotate-180" />
        </span>
      ) : null}
    </>
  );

  const baseClass = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm text-start w-full';

  if (!path) {
    return <div className={baseClass}>{content}</div>;
  }

  return (
    <Link
      to={path}
      className={`${baseClass} block hover:border-red-300 dark:hover:border-red-700 transition-colors`}
    >
      {content}
    </Link>
  );
};

export default CmsStatCard;
