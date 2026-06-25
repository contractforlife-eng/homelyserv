import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/', active: true },
    { icon: '👤', label: 'My Profile', path: '/worker-profile' },
    { icon: '📋', label: 'My Hires', path: '/my-hires' },
    { icon: '🔄', label: 'Switch Role', path: '#', onClick: switchRole },
  ];

  // Mock recent activity data
  const recentActivity = [
    { text: 'Profile approved by admin', time: '12 minutes ago' },
    { text: 'Payment received from Homely Serv Corp', time: '10 minutes ago' },
    { text: 'New message from hiring manager', time: '3 days ago' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0' }}>
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="top-nav-left">
            <Logo />
          </div>
          <div className="top-nav-right">
            <LanguageSwitcher />
            <div className="nav-user">
              <div className="nav-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
              <div>
                <div className="nav-username">{user?.fullName}</div>
                <div className="nav-user-role">{user?.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" style={{ background: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Items */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', gap: '8px', borderBottom: '1px solid #d4e8d4', background: '#fff' }}>
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                navigate(item.path);
              }
            }}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a', marginBottom: '4px' }}>
              Welcome, {user?.fullName}!
            </h1>
            <p style={{ color: '#5a7a5a', fontSize: '16px' }}>What would you like to do today?</p>
          </div>

          {/* Quick Actions Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div 
              style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #d4e8d4', cursor: 'pointer' }}
              onClick={switchRole}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '4px' }}>Switch Account Type</h3>
              <p style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '12px' }}>
                {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
              </p>
              <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: '600' }}>View New Jobs →</span>
            </div>

            <div 
              style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #d4e8d4', cursor: 'pointer' }}
              onClick={() => navigate('/worker-profile')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '4px' }}>Update Skill Profile</h3>
              <p style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '12px' }}>Keep your skills and experience up to date</p>
              <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: '600' }}>Update Profile →</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #d4e8d4' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Recent Activity</h3>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{ padding: '12px 0', borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f7f0' : 'none' }}>
                <div style={{ fontSize: '14px', color: '#1a3a1a', fontWeight: '500' }}>{activity.text}</div>
                <div style={{ fontSize: '12px', color: '#8aaa8a' }}>{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}