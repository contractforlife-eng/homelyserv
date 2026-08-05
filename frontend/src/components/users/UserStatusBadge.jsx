// frontend/src/components/users/UserStatusBadge.jsx
// Shared status badge component for user displays (support & admin).
import React from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';

const UserStatusBadge = ({ isVerified = false, isSuspended = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  if (isSuspended) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ${sizeClasses[size] || sizeClasses.md}`}>
        <UserX size={size === 'sm' ? 10 : 12} />
        Suspended
      </span>
    );
  }

  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 ${sizeClasses[size] || sizeClasses.md}`}>
        <UserCheck size={size === 'sm' ? 10 : 12} />
        Verified
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 ${sizeClasses[size] || sizeClasses.md}`}>
      <Clock size={size === 'sm' ? 10 : 12} />
      Active
    </span>
  );
};

export default UserStatusBadge;