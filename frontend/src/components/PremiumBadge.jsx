// src/components/PremiumBadge.jsx
import React from 'react';
import { Crown } from 'lucide-react';
import { isUserPremium } from '../utils/subscriptionService';

const PremiumBadge = ({ userId, showLabel = true, size = 'sm', className = '' }) => {
  const isPremium = isUserPremium(userId);
  
  if (!isPremium) return null;
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16
  };
  
  const crownSizes = {
    sm: 8,
    md: 10,
    lg: 12
  };
  
  return (
    <span className={`inline-flex items-center gap-0.5 bg-yellow-50 border border-yellow-200 rounded-full font-medium text-yellow-700 whitespace-nowrap ${sizeClasses[size]} ${className}`}>
      <Crown size={crownSizes[size]} className="text-yellow-500" />
      {showLabel && 'Premium'}
    </span>
  );
};

// Small badge for avatar (just the crown)
export const PremiumCrown = ({ userId, size = 'sm' }) => {
  const isPremium = isUserPremium(userId);
  
  if (!isPremium) return null;
  
  const sizes = {
    sm: 8,
    md: 10,
    lg: 14
  };
  
  return (
    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
      <Crown size={sizes[size]} className="text-white" />
    </div>
  );
};

export default PremiumBadge;