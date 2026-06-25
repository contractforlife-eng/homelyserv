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

      {/* Navigation Tabs - Only for Admin */}
      {user?.role === 'ADMIN' && (
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <span className="nav-tab-icon">⚙️</span>
            <span className="nav-tab-label">Admin Panel</span>
          </button>
        </div>
      )}

      <main className="page-content">
        {children}
      </main>
    </div>
  );
}