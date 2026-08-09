import React from 'react';
import useAuthStore from '../../store/authStore';

const ROLE_THEMES = {
  employer: {
    gradient: 'bg-gradient-to-r from-teal-600 to-teal-700',
    subtitle: 'text-teal-100',
    iconBg: 'bg-white/15 dark:bg-gray-800/20'
  },
  admin: {
    gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    subtitle: 'text-yellow-100',
    iconBg: 'bg-white/20'
  },
  support: {
    gradient: 'bg-gradient-to-r from-green-600 to-green-700',
    subtitle: 'text-green-100',
    iconBg: 'bg-white/20'
  },
  worker: {
    gradient: 'bg-gradient-to-r from-red-600 via-red-700 to-red-800',
    subtitle: 'text-red-100',
    iconBg: 'bg-white/15 dark:bg-gray-800/20'
  }
};

const DEFAULT_THEME = ROLE_THEMES.worker;

const RolePageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = ''
}) => {
  const authUser = useAuthStore((state) => state.user);
  const role = ((authUser?.role) || 'worker').toUpperCase();
  const theme = role === 'EMPLOYER'
    ? ROLE_THEMES.employer
    : role === 'ADMIN'
      ? ROLE_THEMES.admin
      : role === 'SUPPORT'
        ? ROLE_THEMES.support
        : DEFAULT_THEME;

  return (
    <div className={`${theme.gradient} rounded-2xl p-6 md:p-8 mb-6 text-white ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`w-12 h-12 ${theme.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={26} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold break-words">{title}</h1>
            {subtitle && <p className={`${theme.subtitle} mt-1`}>{subtitle}</p>}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3 flex-shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
};

export default RolePageHeader;