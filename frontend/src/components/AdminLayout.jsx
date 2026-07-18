import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import NotificationBell from './NotificationBell'; // 👈 ADD THIS

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const menuItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard', path: '/admin' },
    { key: 'users', icon: '👥', label: 'Users', path: '/admin/users' },
    { key: 'hires', icon: '📋', label: 'Hires', path: '/admin/hires' },
    { key: 'payments', icon: '💰', label: 'Payments', path: '/admin/payments' },
    { key: 'settings', icon: '⚙️', label: 'Settings', path: '/admin/settings' },
    { key: 'reports', icon: '📈', label: 'Reports', path: '/admin/reports' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: isMobile ? '0px' : '260px',
        background: '#1a2a1a',
        minHeight: '100vh',
        padding: isMobile ? '0' : '20px 0',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 100,
        transition: 'width 0.3s ease',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        transform: isMobile && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            fontWeight: '700',
            flexShrink: 0,
          }}>
            H
          </div>
          {!isMobile && (
            <div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Homely</div>
              <div style={{ color: '#6a8bb0', fontSize: '12px', fontWeight: '400' }}>Control Panel</div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobile && mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 18px',
                margin: '4px 0',
                borderRadius: '10px',
                cursor: 'pointer',
                color: isActive(item.path) ? '#fff' : '#6a8bb0',
                background: isActive(item.path) ? 'rgba(79, 172, 254, 0.15)' : 'transparent',
                border: isActive(item.path) ? '1px solid rgba(79, 172, 254, 0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6a8bb0';
                }
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: isActive(item.path) ? '600' : '400' }}>
                {item.label}
              </span>
              {isActive(item.path) && (
                <span style={{
                  marginLeft: 'auto',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4facfe',
                }} />
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700',
            fontSize: '16px',
            flexShrink: 0,
          }}>
            {user?.fullName?.charAt(0) || 'A'}
          </div>

          {/* 👈 NOTIFICATION BELL IN ADMIN LAYOUT */}
          <NotificationBell position="right" />

          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{user?.fullName}</div>
            <div style={{ color: '#6a8bb0', fontSize: '11px' }}>{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#6a8bb0',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#6a8bb0';
            }}
          >
            {isMobile ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
            padding: '10px 12px',
            background: '#ffffff',
            border: '1px solid #d4e8d4',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          ☰
        </button>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '24px 32px',
        minHeight: '100vh',
        background: '#f0f7f0',
        marginLeft: isMobile ? '0' : '0',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </main>
    </div>
  );
}export default AdminLayout;