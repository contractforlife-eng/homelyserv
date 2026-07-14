// src/components/VerificationBadge.jsx
import React from 'react';
import { Crown, Shield, CheckCircle } from 'lucide-react';
import { isUserPremium } from '../utils/subscriptionService';

const VerificationBadge = ({ userId, userRole, showLabel = true, size = 'sm' }) => {
  const isPremium = isUserPremium(userId);
  
  if (!isPremium) return null;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18
  };
  
  const colorClasses = userRole === 'EMPLOYER' 
    ? 'bg-teal-50 border-teal-200 text-teal-700' 
    : 'bg-amber-50 border-amber-200 text-amber-700';
  
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${sizeClasses[size]} ${colorClasses}`}>
      <Crown size={iconSizes[size]} className="text-yellow-500" />
      {showLabel && 'Verified'}
    </span>
  );
};

export default VerificationBadge;