// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ position = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('homelyserv_token');
      console.log('🔔 Fetching notifications...');
      
      if (!token) {
        console.warn('No token found');
        setNotifications([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📨 Notifications:', data);
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          background: isOpen ? 'rgba(0,0,0,0.05)' : 'transparent',
          color: '#1a3a1a',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <Bell size={20} />
        {notifications && notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '10px',
            height: '10px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '2px solid #ffffff',
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          [position === 'right' ? 'right' : 'left']: 0,
          top: 'calc(100% + 8px)',
          width: '320px',
          maxHeight: '400px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '14px',
            color: '#1a3a1a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Notifications</span>
            {loading && (
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</span>
            )}
          </div>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {loading ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#6b7280',
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #2e7d32',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((n, index) => (
                <div key={n.id || index} style={{
                  padding: '12px 16px',
                  borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1a3a1a',
                    margin: '0 0 4px 0',
                  }}>{n.title || 'Notification'}</p>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0,
                  }}>{n.message || n.body || 'No message'}</p>
                </div>
              ))
            ) : (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#6b7280',
              }}>
                <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;