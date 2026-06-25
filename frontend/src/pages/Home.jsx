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

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#F8F9FA',
    },
    header: {
      background: 'linear-gradient(135deg, #C0392B, #A93226)',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(192, 57, 43, 0.25)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
    },
    logoIcon: {
      fontSize: '28px',
      background: 'linear-gradient(135deg, #C0392B, #A93226)',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      boxShadow: '0 4px 15px rgba(192, 57, 43, 0.3)',
    },
    logoText: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.1,
    },
    logoMain: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-0.5px',
    },
    logoAccent: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#ffcdd2',
      letterSpacing: '-0.5px',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    userBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(255,255,255,0.15)',
      padding: '4px 12px 4px 4px',
      borderRadius: '24px',
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 600,
      fontSize: '14px',
    },
    userName: {
      color: '#fff',
      fontSize: '13px',
      fontWeight: 500,
    },
    btnLogout: {
      background: 'rgba(255,255,255,0.15)',
      color: '#fff',
      border: 'none',
      padding: '6px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 20px',
    },
    container: {
      maxWidth: '600px',
      margin: '0 auto',
    },
    welcomeSection: {
      marginBottom: '32px',
    },
    welcomeTitle: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#1A1A2E',
      marginBottom: '4px',
    },
    welcomeSubtitle: {
      color: '#6C757D',
      fontSize: '16px',
    },
    grid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    card: {
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      cursor: 'pointer',
      border: '1px solid #E9ECEF',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.25s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    cardPrimary: {
      background: 'linear-gradient(135deg, #C0392B, #A93226)',
      border: 'none',
    },
    cardAdmin: {
      background: 'linear-gradient(135deg, #2C3E50, #1A1A2E)',
      border: 'none',
    },
    cardIcon: {
      fontSize: '28px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FDECEA',
      borderRadius: '12px',
      flexShrink: 0,
    },
    cardIconWhite: {
      background: 'rgba(255,255,255,0.2)',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1A1A2E',
      marginBottom: '2px',
    },
    cardTitleWhite: {
      color: '#fff',
    },
    cardDesc: {
      fontSize: '13px',
      color: '#6C757D',
      margin: 0,
    },
    cardDescWhite: {
      color: '#ffcdd2',
    },
    cardDescAdmin: {
      color: '#bdc3c7',
    },
    cardArrow: {
      fontSize: '24px',
      color: '#C0392B',
      flexShrink: 0,
    },
    cardArrowWhite: {
      color: '#fff',
    },
    switchSection: {
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #E9ECEF',
    },
    switchCard: {
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      cursor: 'pointer',
      border: '1px dashed #C0392B',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <div style={styles.logoIcon}>🏠</div>
          <div style={styles.logoText}>
            <span style={styles.logoMain}>Homely</span>
            <span style={styles.logoAccent}>Serv</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <LanguageSwitcher />
          <div style={styles.userBadge}>
            <span style={styles.userAvatar}>{user?.fullName?.charAt(0) || 'U'}</span>
            <span style={styles.userName}>{user?.fullName}</span>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.welcomeSection}>
            <h2 style={styles.welcomeTitle}>
              {t('welcome')}, {user?.fullName}!
            </h2>
            <p style={styles.welcomeSubtitle}>What would you like to do today?</p>
          </div>

          {/* Admin Dashboard */}
          {user?.role === 'ADMIN' && (
            <div style={styles.grid}>
              <div style={{ ...styles.card, ...styles.cardAdmin }} onClick={() => navigate('/admin')}>
                <div style={{ ...styles.cardIcon, ...styles.cardIconWhite }}>📊</div>
                <div style={styles.cardContent}>
                  <h3 style={{ ...styles.cardTitle, ...styles.cardTitleWhite }}>{t('dashboard')}</h3>
                  <p style={{ ...styles.cardDesc, ...styles.cardDescAdmin }}>Manage hires, payments and users</p>
                </div>
                <span style={{ ...styles.cardArrow, ...styles.cardArrowWhite }}>›</span>
              </div>
            </div>
          )}

          {/* Worker Dashboard */}
          {user?.role === 'WORKER' && (
            <div style={styles.grid}>
              <div style={styles.card} onClick={() => navigate('/worker-profile')}>
                <div style={styles.cardIcon}>👤</div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{t('my_profile')}</h3>
                  <p style={styles.cardDesc}>Update your skills, salary and availability</p>
                </div>
                <span style={styles.cardArrow}>›</span>
              </div>

              <div style={styles.card} onClick={() => navigate('/my-hires')}>
                <div style={styles.cardIcon}>📋</div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{t('my_hires')}</h3>
                  <p style={styles.cardDesc}>View offers from employers</p>
                </div>
                <span style={styles.cardArrow}>›</span>
              </div>
            </div>
          )}

          {/* Employer Dashboard */}
          {user?.role === 'EMPLOYER' && (
            <div style={styles.grid}>
              <div style={{ ...styles.card, ...styles.cardPrimary }} onClick={() => navigate('/search')}>
                <div style={{ ...styles.cardIcon, ...styles.cardIconWhite }}>🔍</div>
                <div style={styles.cardContent}>
                  <h3 style={{ ...styles.cardTitle, ...styles.cardTitleWhite }}>{t('find_workers')}</h3>
                  <p style={{ ...styles.cardDesc, ...styles.cardDescWhite }}>Search nannies, drivers, cooks and more</p>
                </div>
                <span style={{ ...styles.cardArrow, ...styles.cardArrowWhite }}>›</span>
              </div>

              <div style={styles.card} onClick={() => navigate('/my-hires')}>
                <div style={styles.cardIcon}>📋</div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{t('my_hires')}</h3>
                  <p style={styles.cardDesc}>View your hiring history and payments</p>
                </div>
                <span style={styles.cardArrow}>›</span>
              </div>
            </div>
          )}

          {/* Switch Role */}
          {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
            <div style={styles.switchSection}>
              <div style={styles.switchCard} onClick={switchRole}>
                <div style={{ ...styles.cardIcon, background: '#F0F0F0' }}>🔄</div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{t('switch_role')}</h3>
                  <p style={styles.cardDesc}>
                    {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                  </p>
                </div>
                <span style={styles.cardArrow}>›</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}