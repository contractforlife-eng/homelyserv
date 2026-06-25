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

  const containerStyle = {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const cardStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  };

  const logoutBtnStyle = {
    background: 'transparent',
    border: '1px solid #C0392B',
    color: '#C0392B',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  const welcomeStyle = {
    marginBottom: '24px',
  };

  const welcomeTextStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  };

  const roleStyle = {
    fontSize: '14px',
    color: '#888',
    margin: 0,
  };

  const gridStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const menuItemStyle = (isPrimary = false, isAdmin = false) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    background: isPrimary ? 'linear-gradient(135deg, #C0392B, #A93226)' : isAdmin ? 'linear-gradient(135deg, #2C3E50, #1A1A2E)' : '#fff',
    borderRadius: '12px',
    cursor: 'pointer',
    border: isPrimary || isAdmin ? 'none' : '1px solid #e9ecef',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  });

  const iconStyle = (isPrimary = false) => ({
    fontSize: '24px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isPrimary ? 'rgba(255,255,255,0.2)' : '#fdecea',
    borderRadius: '10px',
    flexShrink: 0,
  });

  const textStyle = {
    flex: 1,
  };

  const titleTextStyle = (isPrimary = false) => ({
    fontSize: '16px',
    fontWeight: '600',
    color: isPrimary ? '#fff' : '#1a1a2e',
    margin: 0,
  });

  const descTextStyle = (isPrimary = false) => ({
    fontSize: '13px',
    color: isPrimary ? '#ffcdd2' : '#888',
    margin: 0,
  });

  const arrowStyle = (isPrimary = false) => ({
    fontSize: '20px',
    color: isPrimary ? '#fff' : '#C0392B',
  });

  const switchStyle = {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  };

  const switchBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1px dashed #C0392B',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>HomelyServ</h1>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            Logout
          </button>
        </div>

        {/* Welcome */}
        <div style={welcomeStyle}>
          <p style={welcomeTextStyle}>Welcome, {user?.fullName || 'User'}!</p>
          <p style={roleStyle}>Role: {user?.role}</p>
        </div>

        {/* Menu Items */}
        <div style={gridStyle}>
          {/* Admin */}
          {user?.role === 'ADMIN' && (
            <div style={menuItemStyle(false, true)} onClick={() => navigate('/admin')}>
              <div style={iconStyle(false)}>📊</div>
              <div style={textStyle}>
                <p style={titleTextStyle(false)}>Dashboard</p>
                <p style={descTextStyle(false)}>Manage hires, payments and users</p>
              </div>
              <span style={arrowStyle(false)}>›</span>
            </div>
          )}

          {/* Worker */}
          {user?.role === 'WORKER' && (
            <>
              <div style={menuItemStyle(false)} onClick={() => navigate('/worker-profile')}>
                <div style={iconStyle(false)}>👤</div>
                <div style={textStyle}>
                  <p style={titleTextStyle(false)}>My Profile</p>
                  <p style={descTextStyle(false)}>Update your skills, salary and availability</p>
                </div>
                <span style={arrowStyle(false)}>›</span>
              </div>

              <div style={menuItemStyle(false)} onClick={() => navigate('/my-hires')}>
                <div style={iconStyle(false)}>📋</div>
                <div style={textStyle}>
                  <p style={titleTextStyle(false)}>My Hires</p>
                  <p style={descTextStyle(false)}>View offers from employers</p>
                </div>
                <span style={arrowStyle(false)}>›</span>
              </div>
            </>
          )}

          {/* Employer */}
          {user?.role === 'EMPLOYER' && (
            <>
              <div style={menuItemStyle(true)} onClick={() => navigate('/search')}>
                <div style={iconStyle(true)}>🔍</div>
                <div style={textStyle}>
                  <p style={titleTextStyle(true)}>Find Workers</p>
                  <p style={descTextStyle(true)}>Search nannies, drivers, cooks and more</p>
                </div>
                <span style={arrowStyle(true)}>›</span>
              </div>

              <div style={menuItemStyle(false)} onClick={() => navigate('/my-hires')}>
                <div style={iconStyle(false)}>📋</div>
                <div style={textStyle}>
                  <p style={titleTextStyle(false)}>My Hires</p>
                  <p style={descTextStyle(false)}>View your hiring history and payments</p>
                </div>
                <span style={arrowStyle(false)}>›</span>
              </div>
            </>
          )}
        </div>

        {/* Switch Role */}
        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <div style={switchStyle}>
            <button style={switchBtnStyle} onClick={switchRole}>
              <span style={{ fontSize: '24px' }}>🔄</span>
              <div style={textStyle}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>
                  Switch to {user?.role === 'WORKER' ? 'Employer' : 'Worker'}
                </p>
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                  {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                </p>
              </div>
              <span style={{ fontSize: '20px', color: '#888' }}>›</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}