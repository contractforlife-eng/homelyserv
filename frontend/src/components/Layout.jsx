import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function Layout({ children, activeTab }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = async () => {
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

  // Navigation items based on user role
  const getNavItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { icon: '📊', label: 'Dashboard', path: '/', key: 'dashboard' },
        { icon: '👥', label: 'Users', path: '/admin', key: 'users' },
        { icon: '📋', label: 'Hires', path: '/admin', key: 'hires' },
        { icon: '💰', label: 'Payments', path: '/admin', key: 'payments' },
      ];
    }

    if (user?.role === 'WORKER') {
      return [
        { icon: '📊', label: 'Dashboard', path: '/', key: 'dashboard' },
        { icon: '👤', label: 'My Profile', path: '/worker-profile', key: 'profile' },
        { icon: '📋', label: 'My Hires', path: '/my-hires', key: 'hires' },
      ];
    }

    if (user?.role === 'EMPLOYER') {
      return [
        { icon: '📊', label: 'Dashboard', path: '/', key: 'dashboard' },
        { icon: '🔍', label: 'Find Workers', path: '/search', key: 'search' },
        { icon: '📋', label: 'My Hires', path: '/my-hires', key: 'hires' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

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
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Items */}
      <div className="nav-tabs">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-tab ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-tab-icon">{item.icon}</span>
            <span className="nav-tab-label">{item.label}</span>
          </button>
        ))}
        {/* Switch Role Button - Always visible for non-admin */}
        {user?.role !== 'ADMIN' && (
          <button 
            className="nav-tab switch-role" 
            onClick={handleSwitchRole}
          >
            <span className="nav-tab-icon">🔄</span>
            <span className="nav-tab-label">Switch Role</span>
          </button>
        )}
      </div>

      {/* Page Content */}
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}