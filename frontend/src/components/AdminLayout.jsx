import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

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
        width: collapsed ? '70px' : '260px',
        background: '#1a2a1a',
        minHeight: '100vh',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 100,
        transition: 'width 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '0 12px' : '0 20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #2a4a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '28px',
              background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              🏠
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Homely</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#a5d6a7' }}>Serv</span>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            alignSelf: 'flex-end',
            margin: '8px 12px',
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid #2a4a2a',
            borderRadius: '4px',
            color: '#8aaa8a',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px 16px' : '12px 20px',
                margin: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: isActive(item.path) ? '#fff' : '#8aaa8a',
                background: isActive(item.path) ? '#2a4a2a' : 'transparent',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = '#2a4a2a'; }}
              onMouseLeave={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ fontSize: '14px', fontWeight: isActive(item.path) ? '600' : '400' }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div style={{
          padding: collapsed ? '12px' : '16px 20px',
          borderTop: '1px solid #2a4a2a',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
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
            flexShrink: 0,
          }}>
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{user?.fullName}</div>
              <div style={{ color: '#8aaa8a', fontSize: '11px' }}>{user?.role}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: collapsed ? '6px' : '6px 16px',
              background: 'transparent',
              border: '1px solid #2a4a2a',
              borderRadius: '6px',
              color: '#8aaa8a',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: collapsed ? 'auto' : '100%',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a2a'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8aaa8a'; }}
          >
            {collapsed ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: collapsed ? '70px' : '260px',
        flex: 1,
        padding: '24px 32px',
        minHeight: '100vh',
        background: '#f0f7f0',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </main>
    </div>
  );
}