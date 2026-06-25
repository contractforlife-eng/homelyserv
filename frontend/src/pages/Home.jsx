import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

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

  const getDashboardCards = () => {
    if (user?.role === 'ADMIN') {
      return [
        { icon: '👥', title: 'User Management', desc: 'Manage all registered users', action: 'View Users →', path: '/admin' },
        { icon: '📋', title: 'Hire Management', desc: 'View and manage all hires', action: 'View Hires →', path: '/admin' },
        { icon: '💰', title: 'Payment Tracking', desc: 'Monitor all payments and commissions', action: 'View Payments →', path: '/admin' },
        { icon: '📊', title: 'Revenue Reports', desc: 'View platform revenue and statistics', action: 'View Reports →', path: '/admin' },
      ];
    }

    if (user?.role === 'WORKER') {
      return [
        { icon: '🔄', title: 'Switch Account Type', desc: 'Start hiring workers instead', action: 'View New Jobs →', path: '#', onClick: switchRole },
        { icon: '📝', title: 'Update Skill Profile', desc: 'Keep your skills and experience up to date', action: 'Update Profile →', path: '/worker-profile' },
      ];
    }

    if (user?.role === 'EMPLOYER') {
      return [
        { icon: '🔍', title: 'Find Workers', desc: 'Search for the perfect candidate', action: 'Search Now →', path: '/search' },
        { icon: '📋', title: 'My Hires', desc: 'View your hiring history', action: 'View Hires →', path: '/my-hires' },
      ];
    }

    return [];
  };

  const recentActivity = [
    { text: 'Profile approved by admin', time: '12 minutes ago' },
    { text: 'Payment received from Homely Serv Corp', time: '10 minutes ago' },
    { text: 'New message from hiring manager', time: '3 days ago' },
  ];

  const dashboardCards = getDashboardCards();

  return (
    <Layout activeTab="dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.fullName}!</h1>
        <p className="page-subtitle">
          {user?.role === 'ADMIN' ? 'Manage your platform from here' : 'What would you like to do today?'}
        </p>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">1,284</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change">↑ 12% this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">847</div>
            <div className="stat-label">Active Workers</div>
            <div className="stat-change">↑ 8% this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">43</div>
            <div className="stat-label">Active Hires</div>
            <div className="stat-change">↑ 5% this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">$12,430</div>
            <div className="stat-label">Revenue</div>
            <div className="stat-change">↑ 15% this month</div>
          </div>
        </div>
      )}

      <div className={`card-grid card-grid-${dashboardCards.length === 2 ? '2' : '4'}`}>
        {dashboardCards.map((card, index) => (
          <div 
            key={index}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (card.onClick) {
                card.onClick();
              } else {
                navigate(card.path);
              }
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
            <div className="card-icon">{card.icon}</div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-desc">{card.desc}</p>
            <span className="card-action">{card.action}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Recent Activity</h3>
        {recentActivity.map((activity, index) => (
          <div key={index} style={{ padding: '12px 0', borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f7f0' : 'none' }}>
            <div style={{ fontSize: '14px', color: '#1a3a1a', fontWeight: '500' }}>{activity.text}</div>
            <div style={{ fontSize: '12px', color: '#8aaa8a' }}>{activity.time}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}