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

  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Logo />
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-badge">
              <span className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</span>
              <span className="user-name hide-mobile">{user?.fullName}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        <div className="home-container">
          <div className="welcome-section">
            <h2 className="welcome-title">
              {t('welcome')}, {user?.fullName}!
            </h2>
            <p className="welcome-subtitle">What would you like to do today?</p>
          </div>

          {/* Worker Dashboard */}
          {user?.role === 'WORKER' && (
            <div className="dashboard-grid">
              <div className="dashboard-card" onClick={() => navigate('/worker-profile')}>
                <div className="card-icon">👤</div>
                <div className="card-content">
                  <h3 className="card-title">{t('my_profile')}</h3>
                  <p className="card-desc">Update your skills, salary and availability</p>
                </div>
                <span className="card-arrow">›</span>
              </div>

              <div className="dashboard-card" onClick={() => navigate('/my-hires')}>
                <div className="card-icon">📋</div>
                <div className="card-content">
                  <h3 className="card-title">{t('my_hires')}</h3>
                  <p className="card-desc">View offers from employers</p>
                </div>
                <span className="card-arrow">›</span>
              </div>
            </div>
          )}

          {/* Employer Dashboard */}
          {user?.role === 'EMPLOYER' && (
            <div className="dashboard-grid">
              <div className="dashboard-card primary" onClick={() => navigate('/search')}>
                <div className="card-icon">🔍</div>
                <div className="card-content">
                  <h3 className="card-title">{t('find_workers')}</h3>
                  <p className="card-desc">Search nannies, drivers, cooks and more</p>
                </div>
                <span className="card-arrow">›</span>
              </div>

              <div className="dashboard-card" onClick={() => navigate('/my-hires')}>
                <div className="card-icon">📋</div>
                <div className="card-content">
                  <h3 className="card-title">{t('my_hires')}</h3>
                  <p className="card-desc">View your hiring history and payments</p>
                </div>
                <span className="card-arrow">›</span>
              </div>
            </div>
          )}

          {/* Admin Dashboard */}
          {user?.role === 'ADMIN' && (
            <div className="dashboard-grid">
              <div className="dashboard-card admin" onClick={() => navigate('/admin')}>
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3 className="card-title">{t('dashboard')}</h3>
                  <p className="card-desc">Manage hires, payments and users</p>
                </div>
                <span className="card-arrow">›</span>
              </div>
            </div>
          )}

          {/* Switch Role */}
          {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
            <div className="switch-role-section">
              <div className="switch-role-card" onClick={switchRole}>
                <div className="card-icon">🔄</div>
                <div className="card-content">
                  <h3 className="card-title">{t('switch_role')}</h3>
                  <p className="card-desc">
                    {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                  </p>
                </div>
                <span className="card-arrow">›</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}