import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-redirect admin to admin panel
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Fetch real activity data
  useEffect(() => {
    if (user && user?.role !== 'ADMIN') {
      fetchRecentActivity();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      const [hiresRes] = await Promise.all([
        api.get('/hires/my').catch(() => ({ data: [] })),
      ]);

      const hires = hiresRes.data || [];
      const activities = [];

      hires.slice(0, 5).forEach(hire => {
        const date = new Date(hire.createdAt);
        const timeAgo = getTimeAgo(date);
        
        if (hire.status === 'active') {
          activities.push({
            id: `hire-${hire.id}`,
            text: `Hire confirmed with ${hire.worker?.user?.fullName || 'a worker'}`,
            time: timeAgo,
            type: 'hire',
            date: date,
            icon: '✅',
            color: '#2e7d32'
          });
        } else if (hire.paymentStatus === 'pending') {
          activities.push({
            id: `payment-${hire.id}`,
            text: `Payment pending for ${hire.worker?.user?.fullName || 'hire'}`,
            time: timeAgo,
            type: 'payment',
            date: date,
            icon: '⏳',
            color: '#f39c12'
          });
        } else if (hire.paymentStatus === 'confirmed') {
          activities.push({
            id: `payment-confirmed-${hire.id}`,
            text: `Payment received from ${hire.employer?.fullName || 'employer'}`,
            time: timeAgo,
            type: 'payment_confirmed',
            date: date,
            icon: '💰',
            color: '#2e7d32'
          });
        }
      });

      // Add user profile activities
      if (user?.createdAt) {
        const date = new Date(user.createdAt);
        const timeAgo = getTimeAgo(date);
        activities.push({
          id: 'user-created',
          text: `Account created on HomelyServ`,
          time: timeAgo,
          type: 'user',
          date: date,
          icon: '👤',
          color: '#1976d2'
        });
      }

      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 5));

      if (activities.length === 0) {
        setRecentActivity([
          {
            id: 'empty',
            text: 'No activity yet. Start hiring or apply for jobs!',
            time: 'Now',
            type: 'empty',
            date: new Date(),
            icon: '📋',
            color: '#8aaa8a'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setRecentActivity([
        {
          id: 'default1',
          text: 'Welcome to HomelyServ! Start exploring.',
          time: 'Just now',
          type: 'welcome',
          date: new Date(),
          icon: '👋',
          color: '#2e7d32'
        }
      ]);
    }
    setLoading(false);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const switchRole = async () => {
    const newRole = user?.role === 'WORKER' ? 'EMPLOYER' : 'WORKER';
    const confirm = window.confirm(`Switch your account to ${newRole}?`);
    if (!confirm) return;

    try {
      await api.put('/auth/switch-role', { role: newRole });
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      toast.success(`Switched to ${newRole} successfully!`);
    } catch (err) {
      toast.error('Failed to switch role');
    }
  };

  // If user is admin, return null (will redirect)
  if (user?.role === 'ADMIN') {
    return null;
  }

  const getDashboardCards = () => {
    if (user?.role === 'WORKER') {
      return [
        { icon: '📋', title: 'My Offers', desc: 'View job offers from employers', action: 'View Offers →', path: '/my-hires' },
        { icon: '👤', title: 'My Profile', desc: 'Update your skills and availability', action: 'Update Profile →', path: '/worker-profile' },
        { icon: '🔄', title: 'Switch Account Type', desc: 'Start hiring workers instead', action: 'Switch →', path: '#', onClick: switchRole },
      ];
    }

    if (user?.role === 'EMPLOYER') {
      return [
        { icon: '🔍', title: 'Find Workers', desc: 'Search for the perfect candidate', action: 'Search Now →', path: '/search' },
        { icon: '📋', title: 'My Hires', desc: 'View your hiring history', action: 'View Hires →', path: '/my-hires' },
        { icon: '🔄', title: 'Switch Account Type', desc: 'Start looking for jobs instead', action: 'Switch →', path: '#', onClick: switchRole },
      ];
    }

    return [];
  };

  const dashboardCards = getDashboardCards();

  return (
    <Layout activeTab="dashboard">
      {/* Dashboard Header */}
      <div style={{ 
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e8f5e9',
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1a3a1a',
          marginBottom: '4px',
        }}>
          Dashboard
        </h1>
        <p style={{ 
          color: '#5a7a5a', 
          fontSize: '16px',
        }}>
          Welcome back, {user?.fullName}
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1a3a1a', 
          marginBottom: '16px',
        }}>
          What would you like to do today?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${dashboardCards.length}, 1fr)`,
          gap: '16px',
        }}>
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => {
                if (card.onClick) {
                  card.onClick();
                } else {
                  navigate(card.path);
                }
              }}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e8f5e9',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#2e7d32';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e8f5e9';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{card.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '4px' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '12px', lineHeight: '1.4' }}>
                {card.desc}
              </p>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#2e7d32' }}>
                {card.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e8f5e9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a' }}>Recent Activity</h3>
          {!loading && recentActivity.length > 0 && (
            <span style={{ fontSize: '12px', color: '#8aaa8a', marginLeft: 'auto' }}>
              {recentActivity.length} items
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#5a7a5a' }}>
            Loading activities...
          </div>
        ) : recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#5a7a5a' }}>
            No recent activity found.
          </div>
        ) : (
          recentActivity.map((activity, index) => (
            <div 
              key={activity.id || index} 
              style={{ 
                padding: '12px 0',
                borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f7f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.color || '#8aaa8a',
                  flexShrink: 0,
                }} />
                <div>
                  <span style={{ fontSize: '13px', color: '#1a3a1a', fontWeight: '500' }}>
                    {activity.text}
                  </span>
                  {activity.type && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#8aaa8a', 
                      marginLeft: '6px',
                      background: '#f0f7f0',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'capitalize'
                    }}>
                      {activity.type}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#8aaa8a' }}>{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}