import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, MessageCircle, Briefcase, User, Calendar, DollarSign, AlertCircle, Check, Trash2 } from 'lucide-react';

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'offer', title: 'New Job Offer', message: 'Sara Mohamed sent you a job offer for Nanny position', time: '2 hours ago', read: false },
    { id: 2, type: 'message', title: 'New Message', message: 'Khaled Mostafa replied to your application', time: '5 hours ago', read: false },
    { id: 3, type: 'hire', title: 'Hire Confirmed', message: 'Your hire with Mona Hassan has been confirmed', time: '1 day ago', read: true },
    { id: 4, type: 'payment', title: 'Payment Received', message: 'Payment of $120 has been received', time: '2 days ago', read: true },
    { id: 5, type: 'review', title: 'New Review', message: 'Ahmed Ali left you a 5-star review', time: '3 days ago', read: true }
  ]);

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <button onClick={markAllRead} className="text-sm text-red-600 hover:underline">
            Mark all as read
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
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

export default Notifications;
