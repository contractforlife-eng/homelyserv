// frontend/src/components/users/UserRoleBadge.jsx
// Shared role badge component for user displays (support & admin).
import React from 'react';
import { Shield } from 'lucide-react';

const UserRoleBadge = ({ role = 'USER', size = 'md' }) => {
  const styles = {
    ADMIN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    EMPLOYER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    WORKER: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    SUPPORT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    USER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${styles[role] || styles.USER} ${sizeClasses[size] || sizeClasses.md}`}>
      <Shield size={size === 'sm' ? 10 : 12} />
      {role}
    </span>
  );
};

export default UserRoleBadge;