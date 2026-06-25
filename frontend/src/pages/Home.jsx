import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

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

  // ============================================
  // ADMIN CONTROL PANEL STYLES
  // ============================================

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: '240px',
      background: '#1a1a2e',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2a2a4a',
      flexShrink: 0,
    },
    sidebarLogo: {
      padding: '0 20px 24px',
      borderBottom: '1px solid #2a2a4a',
      marginBottom: '16px',
    },
    sidebarLogoText: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#fff',
      letterSpacing: '-0.5px',
    },
    sidebarLogoAccent: {
      color: '#e74c3c',
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
      color: '#8892b0',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '2px',
    },
    sidebarItemActive: {
      background: '#2a2a4a',
      color: '#fff',
    },
    sidebarItemIcon: {
      fontSize: '18px',
      width: '24px',
    },
    sidebarBottom: {
      padding: '16px 20px',
      borderTop: '1px solid #2a2a4a',
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
      background: '#e74c3c',
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
      color: '#8892b0',
      fontSize: '12px',
    },
    sidebarLogout: {
      marginTop: '12px',
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid #2a2a4a',
      borderRadius: '8px',
      color: '#8892b0',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'center',
    },
    sidebarLogoutHover: {
      background: '#2a2a4a',
      color: '#fff',
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
      color: '#fff',
      margin: 0,
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#8892b0',
      margin: '4px 0 0',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    dateTime: {
      fontSize: '14px',
      color: '#8892b0',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: {
      background: '#1a1a2e',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #2a2a4a',
    },
    statLabel: {
      fontSize: '13px',
      color: '#8892b0',
      marginBottom: '6px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#fff',
    },
    statChange: {
      fontSize: '12px',
      color: '#4ade80',
      marginTop: '4px',
    },
    menuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '32px',
    },
    menuCard: {
      background: '#1a1a2e',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #2a2a4a',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    menuCardHover: {
      borderColor: '#e74c3c',
      transform: 'translateY(-2px)',
    },
    menuCardIcon: {
      fontSize: '28px',
      marginBottom: '12px',
    },
    menuCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '4px',
    },
    menuCardDesc: {
      fontSize: '13px',
      color: '#8892b0',
      margin: 0,
    },
    menuCardArrow: {
      float: 'right',
      color: '#8892b0',
      fontSize: '18px',
    },
    switchCard: {
      background: 'linear-gradient(135deg, #1a1a2e, #2a1a2e)',
      borderRadius: '12px',
      padding: '20px 24px',
      border: '1px dashed #e74c3c',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchCardText: {
      display: 'flex',
      flexDirection: 'column',
    },
    switchCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#fff',
    },
    switchCardDesc: {
      fontSize: '13px',
      color: '#8892b0',
    },
    switchCardArrow: {
      fontSize: '24px',
      color: '#e74c3c',
    },
  };

  // Get current date/time
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
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.sidebarLogoText}>
            Home<span style={styles.sidebarLogoAccent}>Serv</span>
          </div>
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
              e.target.style.background = '#2a2a4a';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#8892b0';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
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

        {/* Stats */}
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

        {/* Menu Cards */}
        <div style={styles.menuGrid}>
          {user?.role === 'ADMIN' && (
            <div 
              style={styles.menuCard}
              onClick={() => navigate('/admin')}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#e74c3c';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#2a2a4a';
                e.target.style.transform = 'translateY(0)';
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
                  e.target.style.borderColor = '#e74c3c';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2a2a4a';
                  e.target.style.transform = 'translateY(0)';
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
                  e.target.style.borderColor = '#e74c3c';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2a2a4a';
                  e.target.style.transform = 'translateY(0)';
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
                  e.target.style.borderColor = '#e74c3c';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2a2a4a';
                  e.target.style.transform = 'translateY(0)';
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
                  e.target.style.borderColor = '#e74c3c';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2a2a4a';
                  e.target.style.transform = 'translateY(0)';
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

        {/* Switch Role Card */}
        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <div 
            style={styles.switchCard}
            onClick={switchRole}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#e74c3c';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'dashed #e74c3c';
            }}
          >
            <div style={styles.switchCardText}>
              <span style={styles.switchCardTitle}>🔄 Switch to {user?.role === 'WORKER' ? 'Employer' : 'Worker'}</span>
              <span style={styles.switchCardDesc}>
                {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
              </span>
            </div>
            <span style={styles.switchCardArrow}>→</span>
          </div>
        )}
      </main>
    </div>
  );
}