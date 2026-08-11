// frontend/src/components/users/UserAvatar.jsx
// Shared avatar component for user displays (support & admin).
import React from 'react';
import { getRoleColor } from '../../utils/userDisplay';

const UserAvatar = ({ name = 'User', image = null, role = 'USER', size = 'md', className = '', isPremium = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const bgColor = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    gray: 'from-gray-500 to-gray-600'
  };

  const gradient = bgColor[getRoleColor(role)] || bgColor.gray;

  const premiumGlowClass = isPremium
    ? 'ring-2 ring-[#F5C542] shadow-[0_0_8px_rgba(245,197,66,0.55),0_0_16px_rgba(245,197,66,0.25)]'
    : '';

  if (image) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${premiumGlowClass} ${className}`}>
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
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold flex-shrink-0 ${premiumGlowClass} ${className}`}>
      {initials || 'U'}
    </div>
  );
};

export default UserAvatar;
