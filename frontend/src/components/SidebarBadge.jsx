// src/components/SidebarBadge.jsx
// ============================================================
// SIDEBAR BADGE - Reusable activity counter badge.
//
// Single badge UI shared by ALL sidebar layouts
// (Worker / Employer / Admin / Support).
//
//   - red circular badge
//   - hidden when the count is zero
//   - displays "99+" when the count exceeds 99
// ============================================================
import React from 'react';

const SidebarBadge = ({ count = 0, className = '' }) => {
  const value = Number(count) || 0;
  if (value <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm ${className}`}
      aria-label={`${value} new`}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
};

export default SidebarBadge;
