import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
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
      // Fetch real data from the backend
      const [hiresRes, usersRes] = await Promise.all([
        api.get('/hires/all').catch(() => ({ data: [] })),
        api.get('/auth/users').catch(() => ({ data: [] }))
      ]);

      const allHires = hiresRes.data || [];
      const allUsers = usersRes.data || [];

      // Calculate real stats
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
        workers: workers,
        employers: employers,
        admins: admins
      });

      // Build recent activity from real data
      const activities = [];

      // Add user activities
      allUsers.slice(0, 3).forEach(u => {
        const date = new Date(u.createdAt);
        activities.push({
          id: `user-${u.id}`,
          text: `${u.fullName} joined as ${u.role}`,
          time: getTimeAgo(date),
          date: date,
          icon: '👤',
          color: u.role === 'WORKER' ? '#2e7d32' : u.role === 'EMPLOYER' ? '#0d47a1' : '#f39c12'
        });
      });

      // Add hire activities
      allHires.slice(0, 3).forEach(h => {
        const date = new Date(h.createdAt);
        const workerName = h.worker?.user?.fullName || 'a worker';
        const employerName = h.employer?.fullName || 'an employer';
        
        if (h.status === 'active') {
          activities.push({
            id: `hire-${h.id}`,
            text: `Hire confirmed: ${workerName} hired by ${employerName}`,
            time: getTimeAgo(date),
            date: date,
            icon: '✅',
            color: '#2e7d32'
          });
        } else if (h.paymentStatus === 'pending') {
          activities.push({
            id: `payment-${h.id}`,
            text: `Payment pending for ${workerName}`,
            time: getTimeAgo(date),
            date: date,
            icon: '⏳',
            color: '#f39c12'
          });
        } else if (h.paymentStatus === 'confirmed') {
          activities.push({
            id: `payment-confirmed-${h.id}`,
            text: `Payment received from ${employerName} for ${workerName}`,
            time: getTimeAgo(date),
            date: date,
            icon: '💰',
            color: '#2e7d32'
          });
        }
      });

      // Sort by date (newest first) and take top 5
      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 5));

    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load admin data');
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

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      sub: `${stats.workers} Workers · ${stats.employers} Employers`, 
      icon: '👥',
      color: '#1b5e20', 
      bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' 
    },
    { 
      label: 'Total Hires', 
      value: stats.totalHires, 
      sub: `${stats.activeHires} Active`, 
      icon: '📋',
      color: '#0d47a1', 
      bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' 
    },
    { 
      label: 'Pending Payments', 
      value: stats.pendingPayments, 
      sub: 'Awaiting confirmation', 
      icon: '⏳',
      color: '#bf360c', 
      bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' 
    },
    { 
      label: 'Revenue', 
      value: `EGP ${stats.totalRevenue.toFixed(0)}`, 
      sub: 'Commissions collected', 
      icon: '💰',
      color: '#1b5e20', 
      bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' 
    },
  ];

  const quickActions = [
    { icon: '👥', label: 'Users', desc: 'Manage all registered users', path: '/admin/users', color: '#2e7d32' },
    { icon: '📋', label: 'Hires', desc: 'View and manage all hires', path: '/admin/hires', color: '#0d47a1' },
    { icon: '💰', label: 'Payments', desc: 'Monitor all payments', path: '/admin/payments', color: '#e65100' },
    { icon: '⚙️', label: 'Settings', desc: 'Configure platform settings', path: '/admin/settings', color: '#4a148c' },
    { icon: '📈', label: 'Reports', desc: 'View platform statistics', path: '/admin/reports', color: '#00695c' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px' }}></div>
          Loading dashboard...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#5a7a5a', fontSize: '16px' }}>
          Welcome back, {user?.fullName}
        </p>
      </div>

      {/* Stats Cards - Real Data */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: card.bg,
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#5a7a5a', fontWeight: '500' }}>{card.label}</span>
              <span style={{ fontSize: '24px' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#8aaa8a', marginTop: '4px' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
        Quick Actions
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={() => navigate(action.path)}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #d4e8d4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 30px ${action.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d4e8d4';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{action.icon}</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>{action.label}</h4>
            <p style={{ fontSize: '12px', color: '#5a7a5a', marginBottom: '8px' }}>{action.desc}</p>
            <span style={{ fontSize: '12px', color: action.color, fontWeight: '600' }}>Go →</span>
          </div>
        ))}
      </div>

      {/* Recent Activity - Real Data */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #d4e8d4',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a' }}>Recent Activity</h3>
          {recentActivity.length > 0 && (
            <span style={{ fontSize: '12px', color: '#8aaa8a', marginLeft: 'auto' }}>
              {recentActivity.length} items
            </span>
          )}
        </div>

        {recentActivity.length === 0 ? (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.color || '#8aaa8a',
                }} />
                <span style={{ fontSize: '14px', color: '#1a3a1a', fontWeight: '500' }}>
                  {activity.text}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#8aaa8a' }}>{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}