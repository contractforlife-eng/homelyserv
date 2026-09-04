// frontend/src/components/users/UserDisplayName.jsx
// Shared component for displaying a user's name with official
// staff styling. ADMIN and SUPPORT names are always red and
// rendered as "{FirstName} ({FriendlyRole})" — e.g. "Emad (Co-Admin)".
// Staff names use font-semibold with a subtle lighter role suffix.
// Other roles use default styling.
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getFirstDisplayName,
  getStaffIdentityTitle,
  isActivePremiumCustomer,
  isStaffRole,
} from '../../utils/userDisplay';

const UserDisplayName = ({
  user = null,
  name = null,
  role = 'USER',
  size = 'md',
  className = '',
  isPremium = undefined,
  defaultNameClassName = 'font-medium text-gray-900 dark:text-white',
}) => {
  const { t } = useTranslation();
  const roleValue = user?.role || role;
  const staff = isStaffRole(roleValue);
  const premiumCustomer = isActivePremiumCustomer(user || { role: roleValue }, isPremium);

  // Base name (without role suffix)
  const rawBaseName = user ? (user.fullName || user.name || t('sharedUserDisplay.fallbacks.user')) : (name || t('sharedUserDisplay.fallbacks.user'));
  const displayNameText = staff
    ? getFirstDisplayName(rawBaseName, t('sharedUserDisplay.fallbacks.user'))
    : rawBaseName;
  const staffIdentityTitle = getStaffIdentityTitle(roleValue);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <span className={`inline-flex items-baseline min-w-0 ${className}`}>
      <span
        className={`truncate ${sizeClasses[size] || sizeClasses.md} ${
          staff
            ? 'font-semibold tracking-normal leading-tight text-red-600 dark:text-red-400'
            : premiumCustomer
              ? 'font-bold text-purple-600 dark:text-purple-400'
            : defaultNameClassName
        }`}
      >
        {displayNameText}
        {staff && (
          <span className="text-red-500 dark:text-red-300">
            {' '}({staffIdentityTitle})
          </span>
        )}
      </span>
    </span>
  );
};

export default UserDisplayName;
