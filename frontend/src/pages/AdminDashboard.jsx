import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHires: 0,
    activeHires: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    workers: 0,
    employers: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hiresRes, usersRes] = await Promise.all([
        api.get('/hires/all').catch(() => ({ data: [] })),
        api.get('/auth/users').catch(() => ({ data: [] }))
      ]);

      const allHires = hiresRes.data || [];
      const allUsers = usersRes.data || [];

      const pending = allHires.filter(h => h.paymentStatus === 'pending').length;
      const active = allHires.filter(h => h.status === 'active').length;
      const revenue = allHires
        .filter(h => h.paymentStatus === 'confirmed')
        .reduce((sum, h) => sum + (h.totalDue || 0), 0);

      const workers = allUsers.filter(u => u.role === 'WORKER').length;
      const employers = allUsers.filter(u => u.role === 'EMPLOYER').length;
      const admins = allUsers.filter(u => u.role === 'ADMIN').length;

      setStats({
        totalUsers: allUsers.length,
        totalHires: allHires.length,
        activeHires: active,
        pendingPayments: pending,
        totalRevenue: revenue,
        workers,
        employers,
        admins
      });

      // Build recent activity
      const activities = [];
      allUsers.slice(0, 3).forEach(u => {
        const date = new Date(u.createdAt);
        activities.push({
          id: `user-${u.id}`,
          text: `${u.fullName} joined as ${u.role}`,
          time: getTimeAgo(date),
          date: date,
          color: u.role === 'WORKER' ? '#4facfe' : u.role === 'EMPLOYER' ? '#43e97b' : '#f5576c'
        });
      });

      allHires.slice(0, 3).forEach(h => {
        const date = new Date(h.createdAt);
        if (h.status === 'active') {
          activities.push({
            id: `hire-${h.id}`,
            text: `Hire confirmed: ${h.worker?.user?.fullName} hired by ${h.employer?.fullName}`,
            time: getTimeAgo(date),
            date: date,
            color: '#43e97b'
          });
        } else if (h.paymentStatus === 'pending') {
          activities.push({
            id: `payment-${h.id}`,
            text: `Payment pending for ${h.worker?.user?.fullName}`,
            time: getTimeAgo(date),
            date: date,
            color: '#f093fb'
          });
        }
      });

      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 5));

    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#4facfe', bg: 'rgba(79, 172, 254, 0.1)' },
    { label: 'Total Hires', value: stats.totalHires, icon: '📋', color: '#43e97b', bg: 'rgba(67, 233, 123, 0.1)' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: '⏳', color: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)' },
    { label: 'Revenue', value: `EGP ${stats.totalRevenue.toFixed(0)}`, icon: '💰', color: '#f5576c', bg: 'rgba(245, 87, 108, 0.1)' },
  ];

  const quickActions = [
    { icon: '👥', label: 'Users', path: '/admin/users', color: '#4facfe' },
    { icon: '📋', label: 'Hires', path: '/admin/hires', color: '#43e97b' },
    { icon: '💰', label: 'Payments', path: '/admin/payments', color: '#f093fb' },
    { icon: '⚙️', label: 'Settings', path: '/admin/settings', color: '#4facfe' },
    { icon: '📈', label: 'Reports', path: '/admin/reports', color: '#f5576c' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Loading...</div>
      </AdminLayout>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '22px' : '28px', 
          fontWeight: '700', 
          color: '#1a2a3a', 
          marginBottom: '4px' 
        }}>
          Good {greeting}, {user?.fullName} 👋
        </h1>
        <p style={{ color: '#6a8bb0', fontSize: isMobile ? '14px' : '15px' }}>
          Here's what's happening with your platform today
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '20px',
        marginBottom: isMobile ? '24px' : '32px',
      }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: '#ffffff',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#6a8bb0', fontWeight: '500' }}>{card.label}</span>
              <span style={{ fontSize: isMobile ? '20px' : '22px' }}>{card.icon}</span>
            </div>
            <div style={{ 
              fontSize: isMobile ? '22px' : '28px', 
              fontWeight: '700', 
              color: '#1a2a3a' 
            }}>
              {card.value}
            </div>
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              color: card.color, 
              marginTop: '6px' 
            }}>
              {card.label === 'Revenue' ? 'Commissions collected' : 'Updated'}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ 
        fontSize: isMobile ? '15px' : '16px', 
        fontWeight: '600', 
        color: '#1a2a3a', 
        marginBottom: isMobile ? '12px' : '16px' 
      }}>
        Quick Actions
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
        gap: isMobile ? '10px' : '16px',
        marginBottom: isMobile ? '24px' : '32px',
      }}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={() => navigate(action.path)}
            style={{
              background: '#ffffff',
              borderRadius: isMobile ? '10px' : '12px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = action.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '8px' }}>{action.icon}</div>
            <h4 style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1a2a3a' }}>{action.label}</h4>
            <span style={{ fontSize: isMobile ? '11px' : '12px', color: action.color, fontWeight: '500' }}>Go →</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📋</span>
          <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1a2a3a' }}>
            Recent Activity
          </h3>
          {recentActivity.length > 0 && (
            <span style={{ fontSize: '12px', color: '#6a8bb0', marginLeft: 'auto' }}>
              {recentActivity.length} items
            </span>
          )}
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6a8bb0' }}>
            No recent activity found.
          </div>
        ) : (
          recentActivity.map((activity, index) => (
            <div
              key={activity.id || index}
              style={{
                padding: isMobile ? '10px 0' : '12px 0',
                borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f4f8' : 'none',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '4px' : '0',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.color || '#4facfe',
                }} />
                <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#1a2a3a' }}>
                  {activity.text}
                </span>
              </div>
              <span style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                color: '#6a8bb0',
                marginLeft: isMobile ? '18px' : '0',
              }}>
                {activity.time}
              </span>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}