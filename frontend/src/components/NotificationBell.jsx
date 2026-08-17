// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAllNotifications,
  getEntityRoute,
  getTypeIcon
} from '../utils/notificationService';
import { onSocketEvent } from '../utils/socket';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';

const NotificationBell = ({ userId: userIdProp, className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // Use the userId prop if provided, otherwise fall back to the authenticated user's id
  const userId = userIdProp || user?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getNotifications({ limit: 20 });
      const unread = await getUnreadCount();
      
      setNotifications(result.notifications || []);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and when userId changes
  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Listen for new notification events
  useEffect(() => {
    const handleNewNotification = (event) => {
      if (event.detail && event.detail.userId === userId) {
        loadNotifications();
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    return () => window.removeEventListener('newNotification', handleNewNotification);
  }, [userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        bellRef.current && 
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Realtime: listen for new notification events via Socket.IO
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSocketEvent(userId, 'notification:new', (payload) => {
      console.log('🔔 Realtime notification received:', payload);
      loadNotifications();
    });
    return unsubscribe;
  }, [userId]);

  // Fallback: auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle marking as read
  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
    loadNotifications();
  };

  // Handle marking all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  // Handle deleting a notification
  const handleDelete = (notificationId, e) => {
    e.stopPropagation();
    deleteNotification(notificationId);
    loadNotifications();
  };

  // Handle clearing all
  const handleClearAll = () => {
    if (window.confirm(t('sharedChrome.notifications.clearConfirm'))) {
      clearAllNotifications();
      loadNotifications();
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the related entity
    const route = getEntityRoute(notification);
    navigate(route);
    setIsOpen(false);
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return t('sharedChrome.notifications.justNow');
    if (diff < 3600000) return t('sharedChrome.notifications.minutesAgo', { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('sharedChrome.notifications.hoursAgo', { count: Math.floor(diff / 3600000) });
    if (diff < 604800000) return t('sharedChrome.notifications.daysAgo', { count: Math.floor(diff / 86400000) });
    return date.toLocaleDateString();
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    return getTypeIcon(type);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={t('sharedChrome.notifications.title')}
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed left-3 right-3 top-14 z-50 w-auto max-w-none max-h-[calc(100dvh-8rem)] sm:absolute sm:left-auto sm:right-0 sm:mt-2 sm:w-96 sm:max-w-96 sm:max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{t('sharedChrome.notifications.title')}</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {t('sharedChrome.notifications.unreadCount', { count: unreadCount })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-xs text-gray-600 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  <span>{t('sharedChrome.notifications.markAllRead')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-xs text-red-600 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>{t('sharedChrome.notifications.clearAll')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Bell size={40} className="text-gray-300 mb-2" />
                <p className="text-sm">{t('sharedChrome.notifications.empty')}</p>
                <p className="text-xs mt-1">{t('sharedChrome.notifications.emptyDescription')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {notification.icon || getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <span className="text-[10px] text-teal-600 flex items-center gap-0.5">
                          <ExternalLink size={10} />
                          {t('sharedChrome.notifications.view')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
                        title={t('sharedChrome.notifications.markAsRead')}
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1 hover:bg-red-100 rounded transition-colors text-red-500"
                      title={t('sharedChrome.notifications.delete')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
              >
                {t('sharedChrome.notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
