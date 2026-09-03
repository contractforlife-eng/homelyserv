import React from 'react';
import { Menu, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../layout/DashboardContext';
import NotificationBell from '../NotificationBell';
import { getDisplayName } from '../../utils/userDisplay';

const MobileHeader = ({ title }) => {
  const { t } = useTranslation();
  const dashboard = useDashboard();
  const { toggleMobileMenu, authUser } = dashboard;

  const role = (authUser?.role || '').toUpperCase();
  const isWorker = role === 'WORKER';
  const isEmployer = role === 'EMPLOYER';
  const isSupportHelper = role === 'SUPPORT_HELPER';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#273449] border-b border-gray-200 dark:border-gray-700 lg:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            aria-label={t('sharedChrome.header.toggleMenu')}
            className={`p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isWorker ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300' :
              isEmployer ? 'hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-300' :
              isSupportHelper ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300' :
              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Menu size={22} />
          </button>
          <h1 className={`text-lg font-bold ${
            isWorker ? 'text-red-600' : isEmployer ? 'text-teal-600' : isSupportHelper ? 'text-red-600' : 'text-gray-800 dark:text-white'
          }`}>
            {title || t('appName')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {authUser?.id && <NotificationBell userId={authUser.id} />}
          <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${
            isWorker ? 'bg-gradient-to-br from-red-500 to-red-600' :
            isEmployer ? 'bg-gradient-to-br from-teal-500 to-teal-600' :
            'bg-gradient-to-br from-gray-500 to-gray-600'
          }`}>
            {authUser?.profileImage ? (
              <img src={authUser.profileImage} alt={getDisplayName(authUser)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <User size={16} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;