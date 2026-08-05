// frontend/src/components/users/UserAvatar.jsx
// Shared avatar component for user displays (support & admin).
import React from 'react';

const UserAvatar = ({ name = 'User', image = null, role = 'USER', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const bgColor = {
    ADMIN: 'from-yellow-500 to-yellow-600',
    EMPLOYER: 'from-teal-500 to-teal-600',
    WORKER: 'from-red-500 to-red-600',
    SUPPORT: 'from-green-500 to-green-600',
    USER: 'from-gray-500 to-gray-600'
  };

  const gradient = bgColor[role] || bgColor.USER;

  if (image) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const initials = (name || 'User')
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}>
      {initials || 'U'}
    </div>
  );
};

export default UserAvatar;