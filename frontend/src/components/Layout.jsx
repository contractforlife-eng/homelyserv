import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function Layout({ children, activeTab }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const getNavItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { icon: '⚙️', label: 'Admin Panel', path: '/admin', key: 'admin' },
      ];
    }

    if (user?.role === 'WORKER') {
      return [
        { icon: '📊', label: 'Dashboard', path: '/', key: 'dashboard' },
        { icon: '👤', label: 'My Profile', path: '/worker-profile', key: 'profile' },
        { icon: '📋', label: 'My Offers', path: '/my-hires', key: 'hires' },
      ];
    }

    if (user?.role === 'EMPLOYER') {
      return [
        { icon: '📊', label: 'Dashboard', path: '/', key: 'dashboard' },
        { icon: '🔍', label: 'Find Workers', path: '/search', key: 'search' },
        { icon: '🏢', label: 'Company Profile', path: '/employer-profile', key: 'profile' },
        { icon: '📋', label: 'My Hires', path: '/my-hires', key: 'hires' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  // If admin, render only the page content without top navigation
  if (user?.role === 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f7f0' }}>
        <main className="page-content">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0' }}>
      <nav className="top-nav" style={{
        background: '#ffffff',
        padding: isMobile ? '0 16px' : '0 20px',
        height: isMobile ? '56px' : '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #d4e8d4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="top-nav-content" style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div className="top-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Logo />
          </div>
          <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <LanguageSwitcher />
            {!isMobile && (
              <div className="nav-user" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 4px',
                borderRadius: '24px',
                background: '#f0f7f0',
              }}>
                <div className="nav-avatar" style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                }}>
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="nav-username" style={{ fontSize: '13px', fontWeight: '500', color: '#1a3a1a' }}>
                    {user?.fullName}
                  </div>
                  <div className="nav-user-role" style={{ fontSize: '10px', color: '#8aaa8a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {user?.role}
                  </div>
                </div>
              </div>
            )}
            {!isMobile && (
              <button onClick={handleLogout} className="btn-logout" style={{
                background: 'rgba(46, 125, 50, 0.1)',
                color: '#2e7d32',
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}>
                Logout
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#1a3a1a',
                }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {!isMobile && (
        <div className="nav-tabs" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '8px 24px',
          display: 'flex',
          gap: '4px',
          borderBottom: '2px solid #d4e8d4',
          background: '#ffffff',
          flexWrap: 'wrap',
        }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-tab ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: 'none',
                background: activeTab === item.key ? '#2e7d32' : 'transparent',
                color: activeTab === item.key ? '#fff' : '#5a7a5a',
                fontSize: '14px',
                fontWeight: activeTab === item.key ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '8px',
                position: 'relative',
              }}
            >
              <span className="nav-tab-icon" style={{ fontSize: '18px' }}>{item.icon}</span>
              <span className="nav-tab-label" style={{ fontSize: '14px', fontWeight: activeTab === item.key ? '600' : '500' }}>{item.label}</span>
              {activeTab === item.key && (
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '20%',
                  right: '20%',
                  height: '3px',
                  background: '#2e7d32',
                  borderRadius: '3px',
                }} />
              )}
            </button>
          ))}
          {user?.role !== 'ADMIN' && (
            <button
              className="nav-tab switch-role"
              onClick={handleSwitchRole}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: '1px dashed #2e7d32',
                background: 'transparent',
                color: '#2e7d32',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '8px',
                marginLeft: 'auto',
              }}
            >
              <span style={{ fontSize: '18px' }}>🔄</span>
              <span>Switch Role</span>
            </button>
          )}
        </div>
      )}

      {isMobile && mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderBottom: '1px solid #d4e8d4',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: isMobile ? '56px' : '64px',
          zIndex: 99,
        }}>
          {user?.role === 'WORKER' && (
            <>
              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'dashboard' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'dashboard' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'dashboard' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>📊</span> Dashboard
              </button>
              <button
                onClick={() => { navigate('/worker-profile'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'profile' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'profile' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'profile' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>👤</span> My Profile
              </button>
              <button
                onClick={() => { navigate('/my-hires'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'hires' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'hires' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'hires' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>📋</span> My Offers
              </button>
              <button
                onClick={() => { handleSwitchRole(); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px dashed #2e7d32',
                  background: 'transparent',
                  color: '#2e7d32',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: '8px',
                }}
              >
                <span>🔄</span> Switch Role
              </button>
            </>
          )}
          {user?.role === 'EMPLOYER' && (
            <>
              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'dashboard' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'dashboard' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'dashboard' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>📊</span> Dashboard
              </button>
              <button
                onClick={() => { navigate('/search'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'search' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'search' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'search' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>🔍</span> Find Workers
              </button>
              <button
                onClick={() => { navigate('/employer-profile'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'profile' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'profile' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'profile' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>🏢</span> Company Profile
              </button>
              <button
                onClick={() => { navigate('/my-hires'); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'hires' ? '#2e7d32' : 'transparent',
                  color: activeTab === 'hires' ? '#fff' : '#1a3a1a',
                  fontSize: '15px',
                  fontWeight: activeTab === 'hires' ? '600' : '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span>📋</span> My Hires
              </button>
              <button
                onClick={() => { handleSwitchRole(); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px dashed #2e7d32',
                  background: 'transparent',
                  color: '#2e7d32',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: '8px',
                }}
              >
                <span>🔄</span> Switch Role
              </button>
            </>
          )}

          <button
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #c62828',
              background: 'transparent',
              color: '#c62828',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              marginTop: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      )}

      <main className="page-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '32px 24px',
      }}>
        {children}
      </main>
    </div>
  );
}