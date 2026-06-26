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

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0' }}>
      {/* Top Navigation Bar */}
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
            <button onClick={handleLogout} className="btn-logout" style={{
              background: 'rgba(46, 125, 50, 0.1)',
              color: '#2e7d32',
              padding: isMobile ? '6px 12px' : '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}>
              {isMobile ? '🚪' : 'Logout'}
            </button>
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

      {/* Mobile Menu */}
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
        </div>
      )}

      {/* Main Content */}
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