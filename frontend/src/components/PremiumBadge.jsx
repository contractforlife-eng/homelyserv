// src/components/PremiumBadge.jsx
// Presentational Premium / Actively Looking badges.
// They are deliberately PURE PRESENTATION: the parent decides whether to
// render them, based on backend-computed flags (worker.isPremium /
// worker.activelyLooking). They never read localStorage or user id.
import React from 'react';
import { Crown, Zap } from 'lucide-react';

export const PremiumBadge = ({ label = 'Premium', size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const crownSizes = {
    sm: 8,
    md: 10,
    lg: 12
  };

  return (
    <span className={`inline-flex items-center gap-0.5 bg-yellow-50 border border-yellow-200 rounded-full font-medium text-yellow-700 whitespace-nowrap ${sizeClasses[size]} ${className}`}>
      <Crown size={crownSizes[size]} className="text-yellow-500 flex-shrink-0" />
      {label}
    </span>
  );
};

// Small crown overlay used on avatars.
export const PremiumCrown = ({ size = 'sm' }) => {
  const sizes = {
    sm: 8,
    md: 10,
    lg: 14
  };

  return (
    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
      <Crown size={sizes[size]} className="text-white block" />
    </div>
  );
};

// "Actively Looking" — a Premium-only signal, kept visually distinct from the
// Premium badge and from any verification/rating indication.
export const ActivelyLookingBadge = ({ label = 'Actively Looking', size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <span className={`inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full font-medium text-emerald-700 whitespace-nowrap ${sizeClasses[size]} ${className}`}>
      <Zap size={iconSizes[size]} className="text-emerald-500 flex-shrink-0" />
      {label}
    </span>
  );
};

export default PremiumBadge;