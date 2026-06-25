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

  const navItems = user?.role === 'ADMIN' ? [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '👥', label: 'Users', path: '/admin' },
  ] : user?.role === 'WORKER' ? [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '👤', label: 'My Profile', path: '/worker-profile' },
    { icon: '📋', label: 'My Hires', path: '/my-hires' },
  ] : user?.role === 'EMPLOYER' ? [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '🔍', label: 'Find Workers', path: '/search' },
    { icon: '📋', label: 'My Hires', path: '/my-hires' },
  ] : [];

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
            key={item.path}
            className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </button>
        ))}
        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <button className="nav-item" onClick={switchRole}>
            <span className="nav-item-icon">🔄</span>
            <span className="nav-item-text">Switch Role</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a', marginBottom: '4px' }}>
              {t('welcome')}, {user?.fullName}!
            </h1>
            <p style={{ color: '#5a7a5a', fontSize: '16px' }}>What would you like to do today?</p>
          </div>

          {/* Stats Cards - Only for Admin */}
          {user?.role === 'ADMIN' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '6px' }}>Total Users</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>1,284</div>
                <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>↑ 12% this month</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '6px' }}>Active Workers</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>847</div>
                <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>↑ 8% this month</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '6px' }}>Active Hires</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>43</div>
                <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>↑ 5% this month</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '6px' }}>Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>$12,430</div>
                <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>↑ 15% this month</div>
              </div>
            </div>
          )}

          {/* Menu Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user?.role === 'ADMIN' && (
              <div 
                style={{ background: '#fff', borderRadius: '16px', padding: '20px', cursor: 'pointer', border: '1px solid #d4e8d4', display: 'flex', alignItems: 'center', gap: '16px' }}
                onClick={() => navigate('/admin')}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5e9', borderRadius: '12px', flexShrink: 0 }}>👥</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '2px' }}>User Management</h3>
                  <p style={{ fontSize: '13px', color: '#5a7a5a', margin: 0 }}>Manage all registered users</p>
                </div>
                <span style={{ fontSize: '24px', color: '#2e7d32' }}>›</span>
              </div>
            )}
          </div>

          {/* Switch Role Card */}
          {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
            <div 
              style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #d4e8d4', background: '#fff', borderRadius: '16px', padding: '20px', cursor: 'pointer', border: '1px dashed #2e7d32', display: 'flex', alignItems: 'center', gap: '16px' }}
              onClick={switchRole}
            >
              <div style={{ fontSize: '28px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7f0', borderRadius: '12px', flexShrink: 0 }}>🔄</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '2px' }}>{t('switch_role')}</h3>
                <p style={{ fontSize: '13px', color: '#5a7a5a', margin: 0 }}>
                  {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                </p>
              </div>
              <span style={{ fontSize: '24px', color: '#2e7d32' }}>›</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}