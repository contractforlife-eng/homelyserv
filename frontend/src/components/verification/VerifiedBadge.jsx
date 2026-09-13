// frontend/src/components/verification/VerifiedBadge.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CheckCircle2, Phone, Mail, FileCheck } from 'lucide-react';

const VerifiedBadge = ({
  verification,
  isVerified,
  type = 'profile',
  size = 'sm',
  showLabel = true,
  className = ''
}) => {
  const { t } = useTranslation();

  const v = verification || {};
  const effectiveIsVerified = isVerified !== undefined
    ? Boolean(isVerified)
    : Boolean(v.isVerified || v.verifiedProfileStatus === 'VERIFIED');
  const phoneVerified = Boolean(v.phoneVerified || v.phone?.verified);
  const emailVerified = Boolean(v.emailVerified || v.email?.verified);
  const identityVerified = Boolean(v.identityVerified || v.identity?.verified || v.identityVerificationStatus === 'VERIFIED');

  // Determine if this badge type is active
  let active = false;
  let label = t('verification.badge.verified', 'Verified');
  let Icon = ShieldCheck;
  let colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300';

  if (type === 'phone') {
    active = phoneVerified;
    label = t('verification.badge.phoneVerified', 'Phone Verified');
    Icon = Phone;
  } else if (type === 'email') {
    active = emailVerified;
    label = t('verification.badge.emailVerified', 'Email Verified');
    Icon = Mail;
  } else if (type === 'identity') {
    active = identityVerified;
    label = t('verification.badge.identityVerified', 'ID Verified');
    Icon = FileCheck;
  } else {
    // Authoritative profile badge: active ONLY if overall profile is explicitly verified
    active = effectiveIsVerified;
    label = t('verification.badge.verified', 'Verified');
    Icon = ShieldCheck;
  }

  if (!active) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full shrink-0 shadow-sm ${sizeClasses[size] || sizeClasses.sm} ${colorClasses} ${className}`}
      title={label}
    >
      <Icon size={iconSizes[size] || 13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
      {showLabel && <span>{label}</span>}
    </span>
  );
};

export default VerifiedBadge;
