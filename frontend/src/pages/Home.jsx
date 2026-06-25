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
        { 
          icon: '⚙️', 
          title: 'Admin Panel', 
          desc: 'Manage users, hires and payments', 
          action: 'Open Admin →', 
          path: '/admin',
          primary: true 
        },
      ];
    }

    if (user?.role === 'WORKER') {
      return [
        { icon: '👤', title: 'My Profile', desc: 'Update your skills and availability', action: 'Update Profile →', path: '/worker-profile' },
        { icon: '📋', title: 'My Hires', desc: 'View offers from employers', action: 'View Hires →', path: '/my-hires' },
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

      {/* Stats Cards - Only for Admin */}
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

      {/* Dashboard Cards */}
      <div className={`card-grid card-grid-${dashboardCards.length}`}>
        {dashboardCards.map((card, index) => (
          <div 
            key={index}
            className={`card ${card.primary ? 'primary' : ''}`}
            style={{ 
              cursor: 'pointer',
              ...(card.primary && {
                background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
                borderColor: 'transparent',
              })
            }}
            onClick={() => {
              if (card.onClick) {
                card.onClick();
              } else {
                navigate(card.path);
              }
            }}
          >
            <div className="card-icon" style={card.primary ? { background: 'rgba(255,255,255,0.2)' } : {}}>{card.icon}</div>
            <h3 className="card-title" style={card.primary ? { color: '#fff' } : {}}>{card.title}</h3>
            <p className="card-desc" style={card.primary ? { color: '#a5d6a7' } : {}}>{card.desc}</p>
            <span className="card-action" style={card.primary ? { color: '#fff' } : {}}>{card.action}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
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