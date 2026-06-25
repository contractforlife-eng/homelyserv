import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    container: {
      minHeight: '100vh',
      background: '#f0f7f0',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: '240px',
      background: '#1a3a1a',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2a5a2a',
      flexShrink: 0,
    },
    sidebarLogo: {
      padding: '0 20px 24px',
      borderBottom: '1px solid #2a5a2a',
      marginBottom: '16px',
    },
    sidebarMenu: {
      flex: 1,
      padding: '0 12px',
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      borderRadius: '10px',
      color: '#8aaa8a',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '2px',
    },
    sidebarItemActive: {
      background: '#2a5a2a',
      color: '#fff',
    },
    sidebarItemIcon: {
      fontSize: '18px',
      width: '24px',
    },
    sidebarBottom: {
      padding: '16px 20px',
      borderTop: '1px solid #2a5a2a',
      marginTop: 'auto',
    },
    sidebarUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    sidebarAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#2e7d32',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: '700',
      fontSize: '14px',
    },
    sidebarUserName: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
    },
    sidebarUserRole: {
      color: '#8aaa8a',
      fontSize: '12px',
    },
    sidebarLogout: {
      marginTop: '12px',
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid #2a5a2a',
      borderRadius: '8px',
      color: '#8aaa8a',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'center',
    },
    main: {
      flex: 1,
      padding: '32px 40px',
      overflow: 'auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a3a1a',
      margin: 0,
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#5a7a5a',
      margin: '4px 0 0',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    dateTime: {
      fontSize: '14px',
      color: '#5a7a5a',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #d4e8d4',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    statLabel: {
      fontSize: '13px',
      color: '#5a7a5a',
      marginBottom: '6px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a3a1a',
    },
    statChange: {
      fontSize: '12px',
      color: '#2e7d32',
      marginTop: '4px',
    },
    menuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '32px',
    },
    menuCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #d4e8d4',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    menuCardIcon: {
      fontSize: '28px',
      marginBottom: '12px',
    },
    menuCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a3a1a',
      marginBottom: '4px',
    },
    menuCardDesc: {
      fontSize: '13px',
      color: '#5a7a5a',
      margin: 0,
    },
    menuCardArrow: {
      float: 'right',
      color: '#5a7a5a',
      fontSize: '18px',
    },
    switchCard: {
      background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
      borderRadius: '12px',
      padding: '20px 24px',
      border: '1px dashed #2e7d32',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a3a1a',
    },
    switchCardDesc: {
      fontSize: '13px',
      color: '#5a7a5a',
    },
    switchCardArrow: {
      fontSize: '24px',
      color: '#2e7d32',
    },
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <Logo />
        </div>

        <nav style={styles.sidebarMenu}>
          <div style={{ ...styles.sidebarItem, ...styles.sidebarItemActive }}>
            <span style={styles.sidebarItemIcon}>📊</span>
            Dashboard
          </div>
          {user?.role === 'ADMIN' && (
            <div style={styles.sidebarItem} onClick={() => navigate('/admin')}>
              <span style={styles.sidebarItemIcon}>👥</span>
              Users
            </div>
          )}
          {user?.role === 'WORKER' && (
            <>
              <div style={styles.sidebarItem} onClick={() => navigate('/worker-profile')}>
                <span style={styles.sidebarItemIcon}>👤</span>
                My Profile
              </div>
              <div style={styles.sidebarItem} onClick={() => navigate('/my-hires')}>
                <span style={styles.sidebarItemIcon}>📋</span>
                My Hires
              </div>
            </>
          )}
          {user?.role === 'EMPLOYER' && (
            <>
              <div style={styles.sidebarItem} onClick={() => navigate('/search')}>
                <span style={styles.sidebarItemIcon}>🔍</span>
                Find Workers
              </div>
              <div style={styles.sidebarItem} onClick={() => navigate('/my-hires')}>
                <span style={styles.sidebarItemIcon}>📋</span>
                My Hires
              </div>
            </>
          )}
          {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
            <div style={styles.sidebarItem} onClick={switchRole}>
              <span style={styles.sidebarItemIcon}>🔄</span>
              Switch Role
            </div>
          )}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.sidebarUser}>
            <div style={styles.sidebarAvatar}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={styles.sidebarUserName}>{user?.fullName}</div>
              <div style={styles.sidebarUserRole}>{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={styles.sidebarLogout}
            onMouseEnter={(e) => {
              e.target.style.background = '#2a5a2a';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#8aaa8a';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Dashboard</h1>
            <p style={styles.headerSubtitle}>Welcome back, {user?.fullName}</p>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.dateTime}>{dateStr} · {timeStr}</span>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Users</div>
            <div style={styles.statValue}>1,284</div>
            <div style={styles.statChange}>↑ 12% this month</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active Workers</div>
            <div style={styles.statValue}>847</div>
            <div style={styles.statChange}>↑ 8% this month</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active Hires</div>
            <div style={styles.statValue}>43</div>
            <div style={styles.statChange}>↑ 5% this month</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Revenue</div>
            <div style={styles.statValue}>$12,430</div>
            <div style={styles.statChange}>↑ 15% this month</div>
          </div>
        </div>

        <div style={styles.menuGrid}>
          {user?.role === 'ADMIN' && (
            <div 
              style={styles.menuCard}
              onClick={() => navigate('/admin')}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2e7d32';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#d4e8d4';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              <div style={styles.menuCardIcon}>👥</div>
              <h3 style={styles.menuCardTitle}>User Management</h3>
              <p style={styles.menuCardDesc}>Manage all registered users</p>
              <span style={styles.menuCardArrow}>→</span>
            </div>
          )}
          {user?.role === 'WORKER' && (
            <>
              <div 
                style={styles.menuCard}
                onClick={() => navigate('/worker-profile')}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#2e7d32';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d4e8d4';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={styles.menuCardIcon}>👤</div>
                <h3 style={styles.menuCardTitle}>My Profile</h3>
                <p style={styles.menuCardDesc}>Update your skills and availability</p>
                <span style={styles.menuCardArrow}>→</span>
              </div>
              <div 
                style={styles.menuCard}
                onClick={() => navigate('/my-hires')}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#2e7d32';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d4e8d4';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={styles.menuCardIcon}>📋</div>
                <h3 style={styles.menuCardTitle}>My Hires</h3>
                <p style={styles.menuCardDesc}>View offers from employers</p>
                <span style={styles.menuCardArrow}>→</span>
              </div>
            </>
          )}
          {user?.role === 'EMPLOYER' && (
            <>
              <div 
                style={styles.menuCard}
                onClick={() => navigate('/search')}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#2e7d32';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d4e8d4';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={styles.menuCardIcon}>🔍</div>
                <h3 style={styles.menuCardTitle}>Find Workers</h3>
                <p style={styles.menuCardDesc}>Search for the perfect candidate</p>
                <span style={styles.menuCardArrow}>→</span>
              </div>
              <div 
                style={styles.menuCard}
                onClick={() => navigate('/my-hires')}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#2e7d32';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d4e8d4';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={styles.menuCardIcon}>📋</div>
                <h3 style={styles.menuCardTitle}>My Hires</h3>
                <p style={styles.menuCardDesc}>View your hiring history</p>
                <span style={styles.menuCardArrow}>→</span>
              </div>
            </>
          )}
        </div>

        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <div 
            style={styles.switchCard}
            onClick={switchRole}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#1b5e20';
              e.target.style.boxShadow = '0 4px 20px rgba(46, 125, 50, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#2e7d32';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div>
              <span style={styles.switchCardTitle}>🔄 Switch to {user?.role === 'WORKER' ? 'Employer' : 'Worker'}</span>
              <div style={styles.switchCardDesc}>
                {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
              </div>
            </div>
            <span style={styles.switchCardArrow}>→</span>
          </div>
        )}
      </main>
    </div>
  );
}