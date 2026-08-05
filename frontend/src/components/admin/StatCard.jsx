// frontend/src/components/admin/StatCard.jsx
// Reusable KPI stat card for admin dashboards.
// Supports dark/light mode, responsive layout, loading skeleton,
// icons, and optional navigation link.
import React from 'react';
import { Link } from 'react-router-dom';

const COLOR_MAP = {
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'hover:border-yellow-500/40' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'hover:border-blue-500/40' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'hover:border-green-500/40' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'hover:border-red-500/40' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'hover:border-purple-500/40' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'hover:border-orange-500/40' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'hover:border-teal-500/40' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'hover:border-gray-500/40' },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = 'yellow',
  loading = false,
  link = null,
  sub = null,
}) => {
  const c = COLOR_MAP[color] || COLOR_MAP.yellow;

  const content = (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 ${c.border} transition h-full`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{sub}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
};

export default StatCard;