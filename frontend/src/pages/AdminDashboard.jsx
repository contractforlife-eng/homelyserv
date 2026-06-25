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
      let allHires = [];
      let allUsers = [];
      try {
        const hiresRes = await api.get('/hires/all');
        allHires = hiresRes.data || [];
      } catch (err) {}
      try {
        const usersRes = await api.get('/auth/users');
        allUsers = usersRes.data || [];
      } catch (err) {}

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
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.workers} Workers · ${stats.employers} Employers`, color: '#1b5e20', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
    { label: 'Total Hires', value: stats.totalHires, sub: `${stats.activeHires} Active`, color: '#0d47a1', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
    { label: 'Pending Payments', value: stats.pendingPayments, sub: 'Awaiting confirmation', color: '#bf360c', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' },
    { label: 'Revenue', value: `EGP ${stats.totalRevenue.toFixed(0)}`, sub: 'Commissions collected', color: '#1b5e20', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
  ];

  const quickActions = [
    { icon: '👥', label: 'User Management', desc: 'Manage all registered users', path: '/admin/users' },
    { icon: '📋', label: 'Hire Management', desc: 'View and manage all hires', path: '/admin/hires' },
    { icon: '💰', label: 'Payment Tracking', desc: 'Monitor all payments and commissions', path: '/admin/payments' },
    { icon: '📈', label: 'Reports', desc: 'View platform statistics', path: '/admin/reports' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Dashboard</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Welcome back, {user?.fullName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: card.bg,
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #d4e8d4',
          }}>
            <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '12px', color: '#8aaa8a' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
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
              e.currentTarget.style.borderColor = '#2e7d32';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d4e8d4';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{action.icon}</div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>{action.label}</h4>
            <p style={{ fontSize: '12px', color: '#5a7a5a' }}>{action.desc}</p>
            <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>View →</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}