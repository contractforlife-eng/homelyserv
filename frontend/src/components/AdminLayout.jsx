import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/admin' },
    { key: 'users', icon: '👤', label: 'Users', path: '/admin/users' },
    { key: 'hires', icon: '📋', label: 'Hires', path: '/admin/hires' },
    { key: 'payments', icon: '💳', label: 'Payments', path: '/admin/payments' },
    { key: 'settings', icon: '⚙️', label: 'Settings', path: '/admin/settings' },
    { key: 'reports', icon: '📊', label: 'Reports', path: '/admin/reports' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f7' }}>
      {/* Top Navigation Bar */}
      <nav style={{
        background: '#ffffff',
        padding: '0 32px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e8edf4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6C63FF, #3F3D9E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
          }}>
            HS
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>Homely</span>
            <span style={{ fontSize: '18px', fontWeight: '400', color: '#6C63FF' }}>Serv</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: isActive(item.path) ? '#6C63FF' : 'transparent',
                color: isActive(item.path) ? '#fff' : '#4a5568',
                fontSize: '14px',
                fontWeight: isActive(item.path) ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = '#f0f0ff';
                  e.currentTarget.style.color = '#6C63FF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#4a5568';
                }
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px 6px 6px',
            borderRadius: '30px',
            background: '#f7fafc',
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #3F3D9E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
            }}>
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{user?.fullName}</div>
              <div style={{ fontSize: '11px', color: '#6C63FF', fontWeight: '500' }}>{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              border: '1px solid #e8edf4',
              borderRadius: '8px',
              background: '#fff',
              color: '#4a5568',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee';
              e.currentTarget.style.borderColor = '#fc8181';
              e.currentTarget.style.color = '#e53e3e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#e8edf4';
              e.currentTarget.style.color = '#4a5568';
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {children}
      </main>
    </div>
  );
}