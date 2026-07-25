// src/components/dashboard/NotificationDropdown.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

const NotificationDropdown = ({
  notifications,
  unreadCount,
  showNotifications,
  onToggle,
  onMarkAllRead,
  onNotificationClick,
  t,
  getNotificationIcon,
  getNotificationBgColor
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell size={16} />
              {t.notifications}
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h4>
            {notifications.length > 0 && (
              <button 
                onClick={onMarkAllRead}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                {t.markAllRead}
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">🔔</div>
                <p className="font-medium">{t.noNotifications}</p>
                <p className="text-sm mt-1">New notifications will appear here</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link || '#'}
                  className={`block p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-red-50/50' : ''}`}
                  onClick={() => onNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.title || 'Notification'}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'} truncate`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.time).toLocaleDateString()} at {new Date(notification.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
            {notifications.length > 10 && (
              <div className="p-2 text-center border-t border-gray-100">
                <Link 
                  to="/notifications" 
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  onClick={onToggle}
                >
                  {t.viewAll} ({notifications.length - 10} more)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;