// frontend/src/components/users/UserRoleBadge.jsx
// Shared role badge component for user displays (support & admin).
import React from 'react';
import { Shield } from 'lucide-react';
import { getRoleLabel, getRoleBadgeClasses } from '../../utils/userDisplay';

const UserRoleBadge = ({ role = 'USER', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${getRoleBadgeClasses(role)} ${sizeClasses[size] || sizeClasses.md}`}>
      <Shield size={size === 'sm' ? 10 : 12} />
      {getRoleLabel(role)}
    </span>
  );
};

export default UserRoleBadge;