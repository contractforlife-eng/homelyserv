// Dashboard Header Component - Reusable header for all dashboard pages
import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { isUserPremium } from '../../utils/subscriptionService';
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
  customNotificationComponent
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

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMenu}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden text-gray-600 dark:text-gray-300"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">{title}</h2>
          </div>
        </div>

        {/* Right side - User info, notifications, language, and custom content */}
        <div className="flex items-center gap-3">
          {/* User profile section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 overflow-hidden border-2 border-teal-200 dark:border-teal-800 relative">
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
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={8} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                {fullName}
              </span>
              {isPremium && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap hidden sm:inline-flex">
                  <Crown size={10} className="text-yellow-500" />
                  {premiumBadgeText}
                </span>
              )}
            </div>
          </div>

          {/* Notifications */}
          {showNotifications && !customNotificationComponent && notificationUserId && (
            <NotificationBell userId={notificationUserId} />
          )}

          {/* Custom notification component (for WorkerDashboard) */}
          {customNotificationComponent}

          {/* Language toggle */}
          {handleToggleLanguage && (
            <button
              onClick={handleToggleLanguage}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Globe size={16} />
              {language === 'en' ? 'العربية' : 'English'}
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