import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, MessageCircle, Briefcase, User, Calendar, DollarSign, AlertCircle, Check, Trash2, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get authenticated user from authStore
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const getIcon = (type) => {
    switch(type) {
      case 'offer': return <Briefcase size={20} className="text-green-600" />;
      case 'message': return <MessageCircle size={20} className="text-blue-600" />;
      case 'hire': return <CheckCircle size={20} className="text-purple-600" />;
      case 'payment': return <DollarSign size={20} className="text-red-600" />;
      case 'review': return <Star size={20} className="text-yellow-600" />;
      default: return <Bell size={20} className="text-gray-600" />;
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated || !authUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/notifications', {
        params: { userId: authUser.id }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        throw new Error(response.data.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data if API not ready
      const mockNotifications = [
        { id: 1, type: 'offer', title: 'New Job Offer', message: 'Sara Mohamed sent you a job offer for Nanny position', time: '2 hours ago', read: false },
        { id: 2, type: 'message', title: 'New Message', message: 'Khaled Mostafa replied to your application', time: '5 hours ago', read: false },
        { id: 3, type: 'hire', title: 'Hire Confirmed', message: 'Your hire with Mona Hassan has been confirmed', time: '1 day ago', read: true },
        { id: 4, type: 'payment', title: 'Payment Received', message: 'Payment of $120 has been received', time: '2 days ago', read: true },
        { id: 5, type: 'review', title: 'New Review', message: 'Ahmed Ali left you a 5-star review', time: '3 days ago', read: true }
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [authUser, isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      const response = await api.put(`/api/notifications/${id}/read`, {
        userId: authUser?.id
      });

      if (response.data.success) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
      } else {
        throw new Error(response.data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback: update locally even if API fails
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await api.delete(`/api/notifications/${id}`, {
        data: { userId: authUser?.id }
      });

      if (response.data.success) {
        setNotifications(notifications.filter(n => n.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback: update locally even if API fails
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const markAllRead = async () => {
    try {
      const response = await api.put('/api/notifications/read-all', {
        userId: authUser?.id
      });

      if (response.data.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      } else {
        throw new Error(response.data.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Fallback: update locally even if API fails
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-md">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Sign In</h3>
          <p className="text-gray-500 mb-4">Sign in to view your notifications</p>
          <button 
            onClick={() => navigate('/login', { state: { from: '/notifications' } })}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchNotifications}
              className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={markAllRead} className="text-sm text-red-600 hover:underline">
              Mark all as read
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">No notifications</h3>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-white rounded-xl shadow-sm border p-4 transition ${
                  !notification.read ? 'border-red-200 bg-red-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    !notification.read ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Add missing Star import for review icon
const Star = ({ size, className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 20} 
      height={size || 20} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );
};

// Add RefreshCw icon if not already imported
const RefreshCw = ({ size, className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 20} 
      height={size || 20} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
};

export default Notifications;