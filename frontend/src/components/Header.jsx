// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import axios from 'axios';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch notifications
  useEffect(() => {
    if (isNotificationsOpen) {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem('homelyserv_token');
          if (!token) return;

          const response = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            setNotifications(response.data.notifications);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo />
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LanguageSwitcher />
          
          {/* ✅ ADDED: Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="text-gray-400 hover:text-gray-600 relative flex items-center p-1"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 font-semibold text-sm text-gray-800">
                  {t('notifications') || 'Notifications'}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">
                      {t('noNotifications') || 'No new notifications'}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user && (
            <>
              <div className="user-badge">
                <span className="user-avatar">
                  {user.profilePhotoUrl ? (
                    <img 
                      src={user.profilePhotoUrl} 
                      alt={user.fullName}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    user.fullName?.charAt(0) || 'U'
                  )}
                </span>
                <span className="user-name hide-mobile">{user.fullName}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}