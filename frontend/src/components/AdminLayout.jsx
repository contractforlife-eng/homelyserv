import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

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
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '72px' : '260px',
        background: '#0f1a2e',
        minHeight: '100vh',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 100,
        transition: 'width 0.3s ease',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '16px 0' : '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
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
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Homely</div>
              <div style={{ color: '#6a8bb0', fontSize: '12px', fontWeight: '400' }}>Control Panel</div>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            alignSelf: collapsed ? 'center' : 'flex-end',
            margin: '12px 16px',
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: '#6a8bb0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: collapsed ? '12px 14px' : '12px 18px',
                margin: '4px 0',
                borderRadius: '10px',
                cursor: 'pointer',
                color: isActive(item.path) ? '#fff' : '#6a8bb0',
                background: isActive(item.path) ? 'rgba(79, 172, 254, 0.15)' : 'transparent',
                border: isActive(item.path) ? '1px solid rgba(79, 172, 254, 0.2)' : 'none',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              {!collapsed && (
                <span style={{ fontSize: '14px', fontWeight: isActive(item.path) ? '600' : '400' }}>
                  {item.label}
                </span>
              )}
              {isActive(item.path) && !collapsed && (
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
          padding: collapsed ? '12px' : '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
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
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{user?.fullName}</div>
              <div style={{ color: '#6a8bb0', fontSize: '11px' }}>{user?.role}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: collapsed ? '6px' : '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#6a8bb0',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: collapsed ? 'auto' : '100%',
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
            {collapsed ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: collapsed ? '72px' : '260px',
        flex: 1,
        padding: '24px 32px',
        minHeight: '100vh',
        background: '#f0f4f8',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </main>
    </div>
  );
}