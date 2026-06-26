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
  });
  const [loading, setLoading] = useState(true);

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

      setStats({
        totalUsers: allUsers.length,
        totalHires: allHires.length,
        activeHires: active,
        pendingPayments: pending,
        totalRevenue: revenue,
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const statItems = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', change: '+12%', color: '#6C63FF' },
    { label: 'Total Hires', value: stats.totalHires, icon: '📋', change: '+8%', color: '#48BB78' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: '⏳', change: '-3%', color: '#ED8936' },
    { label: 'Revenue', value: `EGP ${stats.totalRevenue.toFixed(0)}`, icon: '💰', change: '+15%', color: '#FC8181' },
  ];

  const quickActions = [
    { icon: '👤', label: 'Users', desc: 'Manage all users', path: '/admin/users', color: '#6C63FF' },
    { icon: '📋', label: 'Hires', desc: 'View all hires', path: '/admin/hires', color: '#48BB78' },
    { icon: '💳', label: 'Payments', desc: 'Process payments', path: '/admin/payments', color: '#ED8936' },
    { icon: '⚙️', label: 'Settings', desc: 'Configure platform', path: '/admin/settings', color: '#4A5568' },
  ];

  const recentActivity = [
    { text: 'New user registered: Sara Samir', time: '2 hours ago', type: 'user' },
    { text: 'Payment confirmed: EGP 370.50', time: '4 hours ago', type: 'payment' },
    { text: 'New hire: Ahmed joined as Driver', time: '6 hours ago', type: 'hire' },
    { text: 'Profile updated: Emad Admin', time: '8 hours ago', type: 'profile' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#4a5568' }}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', marginBottom: '4px' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.fullName} 👋
        </h1>
        <p style={{ color: '#718096', fontSize: '15px' }}>
          Here's what's happening with your platform today
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {statItems.map((item, index) => (
          <div key={index} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #edf2f7',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>{item.label}</span>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748' }}>{item.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              <span style={{
                fontSize: '12px',
                color: item.change.startsWith('+') ? '#48BB78' : '#FC8181',
                fontWeight: '600',
              }}>
                {item.change}
              </span>
              <span style={{ fontSize: '12px', color: '#a0aec0' }}>from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => navigate(action.path)}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #edf2f7',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#edf2f7';
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{action.icon}</div>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>{action.label}</h4>
              <p style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>{action.desc}</p>
              <span style={{ fontSize: '13px', color: action.color, fontWeight: '500' }}>Go →</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #edf2f7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '16px' }}>
          Recent Activity
        </h3>
        {recentActivity.map((activity, index) => (
          <div
            key={index}
            style={{
              padding: '12px 0',
              borderBottom: index < recentActivity.length - 1 ? '1px solid #edf2f7' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activity.type === 'user' ? '#6C63FF' : activity.type === 'payment' ? '#48BB78' : '#ED8936',
              }} />
              <span style={{ fontSize: '14px', color: '#2d3748' }}>{activity.text}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>{activity.time}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}