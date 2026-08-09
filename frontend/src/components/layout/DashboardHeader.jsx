// Dashboard Header Component - Reusable header for all dashboard pages
import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { isUserPremium } from '../../utils/subscriptionService';
import { getDisplayName } from '../../utils/userDisplay';
import NotificationBell from '../NotificationBell';
import { useDashboard } from './DashboardContext';
import {
  Menu,
  Globe,
  Bell,
  User,
  Crown,
  X
} from 'lucide-react';

const DashboardHeader = ({
  title,
  language: languageProp,
  onToggleMenu,
  onToggleLanguage,
  showNotifications = true,
  showLanguageToggle = true,
  rightContent,
  userProfileImage,
  isPremium: isPremiumProp,
  premiumBadgeText = 'Premium',
  notificationUserId,
  onToggleNotifications,
  isNotificationsOpen,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  getNotificationIcon,
  getNotificationBgColor,
  noNotificationsText = 'No notifications',
  viewAllText = 'View All',
  markAllReadText = 'Mark All Read',
  notificationsText = 'Notifications',
  customNotificationComponent,
  variant = 'default'
}) => {
  // Consume layout state from DashboardLayout context
  const dashboard = useDashboard();
  const authUser = useAuthStore(state => state.user);

  // Use prop or fall back to context value
  const language = languageProp !== undefined ? languageProp : dashboard.language;
  const handleToggleMenu = onToggleMenu || dashboard.toggleMobileMenu;
  const handleToggleLanguage = onToggleLanguage || dashboard.toggleLanguage;

  // Use prop or calculate from authUser
  const isPremium = isPremiumProp !== undefined ? isPremiumProp : (() => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  })();

  const profileImage = userProfileImage || authUser?.profileImage;
  const fullName = authUser?.fullName || 'User';
  // Role-aware variant: 'admin' is explicit (dark), otherwise derive from the
  // authenticated role so Worker gets the red identity and Employer the teal one.
  const effectiveVariant =
    variant === 'admin'
      ? 'admin'
      : authUser?.role === 'EMPLOYER'
        ? 'employer'
        : authUser?.role === 'ADMIN'
          ? 'admin'
          : 'worker';
  const isAdmin = effectiveVariant === 'admin';
  const isEmployer = effectiveVariant === 'employer';
  const isWorker = effectiveVariant === 'worker';
  
  // Use centralized display name formatter
  const displayName = getDisplayName(authUser);

  return (
    <header className={`sticky top-0 z-30 ${
      isAdmin
        ? 'bg-[#1a1a1a] border-b border-yellow-500/20'
        : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-3">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleToggleMenu}
            aria-label="Toggle menu"
            className={`p-2 rounded-lg transition-colors lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isAdmin
                ? 'hover:bg-yellow-500/10 text-gray-400 hover:text-yellow-500'
                : isWorker
                  ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300'
                  : 'hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className={`text-base sm:text-lg font-semibold ${
              isAdmin ? 'text-white' : 'text-gray-800 dark:text-white'
            }`}>{title}</h2>
          </div>
        </div>

        {/* Right side - User info, notifications, language, and custom content */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User profile section */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full overflow-hidden border-2 relative flex-shrink-0 ${
              isAdmin
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-200'
                : isWorker
                  ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-200 dark:border-red-800'
                  : 'bg-gradient-to-br from-teal-500 to-teal-600 border-teal-200 dark:border-teal-800'
            }`}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-white m-1" />
              )}
              {isPremium && (
                <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 border-2 ${
                  isAdmin ? 'bg-yellow-500 border-[#1a1a1a]' : 'bg-yellow-500 border-white'
                }`}>
                  <Crown size={8} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 hidden sm:flex">
              <span className={`text-sm font-medium ${
                isAdmin ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'
              }`}>
                {displayName}
              </span>
              {isPremium && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                  isAdmin
                    ? 'bg-yellow-900/30 border border-yellow-500/30 text-yellow-400'
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                }`}>
                  <Crown size={10} className={isAdmin ? 'text-yellow-400' : 'text-yellow-500'} />
                  {premiumBadgeText}
                </span>
              )}
            </div>
          </div>

          {/* Notifications */}
          {showNotifications && !customNotificationComponent && notificationUserId && (
            <NotificationBell userId={notificationUserId} />
          )}

          {/* Custom notification component */}
          {customNotificationComponent}

          {/* Language toggle */}
          {showLanguageToggle && handleToggleLanguage && (
            <button
              onClick={handleToggleLanguage}
              className={`px-2 sm:px-3 py-1.5 border rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 min-h-[40px] ${
                isAdmin
                  ? 'border-yellow-500/20 text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-500'
                  : isWorker
                    ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600'
              }`}
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          )}

          {/* Additional right content */}
          {rightContent}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;