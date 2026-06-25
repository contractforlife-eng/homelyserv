import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function AdminLayout({ children, activeSection }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState({
    users: true,
    hires: true,
    financials: true,
    settings: true,
    content: true,
    reports: true
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menu) => {
    setExpandedMenus({
      ...expandedMenus,
      [menu]: !expandedMenus[menu]
    });
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: '📊',
      label: 'Dashboard',
      path: '/admin',
      section: 'overview'
    },
    {
      key: 'users',
      icon: '👥',
      label: 'User Management',
      section: 'users',
      children: [
        { key: 'workers', label: 'Detailed Workers', path: '/admin/users/workers' },
        { key: 'employers', label: 'Employers', path: '/admin/users/employers' },
        { key: 'verification', label: 'Verification Queue', path: '/admin/users/verification' },
        { key: 'conflicts', label: 'Conflict Resolution', path: '/admin/users/conflicts' },
      ]
    },
    {
      key: 'hires',
      icon: '📋',
      label: 'Hire Management',
      section: 'hires',
      children: [
        { key: 'contracts', label: 'Detailed Contract View', path: '/admin/hires/contracts' },
        { key: 'requests', label: 'Service Request Tracking', path: '/admin/hires/requests' },
      ]
    },
    {
      key: 'financials',
      icon: '💰',
      label: 'Financials',
      section: 'financials',
      children: [
        { key: 'revenue', label: 'Revenue Breakdown', path: '/admin/financials/revenue' },
        { key: 'expenses', label: 'Expense Tracking', path: '/admin/financials/expenses' },
        { key: 'payouts', label: 'Payout Processing', path: '/admin/financials/payouts' },
      ]
    },
    {
      key: 'settings',
      icon: '⚙️',
      label: 'Application Settings',
      section: 'settings',
      children: [
        { key: 'general', label: 'General Settings', path: '/admin/settings/general' },
        { key: 'payment', label: 'Payment Gateway Config', path: '/admin/settings/payment' },
      ]
    },
    {
      key: 'content',
      icon: '📝',
      label: 'Content Management',
      section: 'content',
      children: [
        { key: 'faqs', label: 'FAQs', path: '/admin/content/faqs' },
        { key: 'blog', label: 'Blog Posts', path: '/admin/content/blog' },
        { key: 'pages', label: 'Static Pages', path: '/admin/content/pages' },
      ]
    },
    {
      key: 'reports',
      icon: '📈',
      label: 'Advanced Reports',
      section: 'reports',
      children: [
        { key: 'analytics', label: 'Analytics', path: '/admin/reports/analytics' },
        { key: 'custom', label: 'Custom Reports', path: '/admin/reports/custom' },
      ]
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isSectionActive = (section) => {
    return activeSection === section;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
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
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #2a4a2a' }}>
          <Logo />
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <div key={item.key}>
              {item.children ? (
                <>
                  <div
                    onClick={() => toggleMenu(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      color: isSectionActive(item.section) ? '#a5d6a7' : '#8aaa8a',
                      fontWeight: isSectionActive(item.section) ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a2a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>{item.icon}</span>
                      <span style={{ fontSize: '14px' }}>{item.label}</span>
                    </span>
                    <span style={{ fontSize: '12px', transform: expandedMenus[item.key] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </div>
                  {expandedMenus[item.key] && (
                    <div style={{ paddingLeft: '20px' }}>
                      {item.children.map((child) => (
                        <div
                          key={child.key}
                          onClick={() => navigate(child.path)}
                          style={{
                            padding: '8px 20px 8px 44px',
                            cursor: 'pointer',
                            color: isActive(child.path) ? '#a5d6a7' : '#7a9a7a',
                            fontSize: '13px',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease',
                            background: isActive(child.path) ? '#2a4a2a' : 'transparent',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a2a'; }}
                          onMouseLeave={(e) => { if (!isActive(child.path)) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {child.label}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: isActive(item.path) ? '#a5d6a7' : '#8aaa8a',
                    fontWeight: isActive(item.path) ? '600' : '400',
                    background: isActive(item.path) ? '#2a4a2a' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a2a'; }}
                  onMouseLeave={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{item.icon}</span>
                  <span style={{ fontSize: '14px' }}>{item.label}</span>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a4a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
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
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{user?.fullName}</div>
              <div style={{ color: '#8aaa8a', fontSize: '11px' }}>{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '1px solid #2a4a2a',
              borderRadius: '6px',
              color: '#8aaa8a',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a4a2a'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8aaa8a'; }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '280px',
        flex: 1,
        padding: '24px 32px',
        minHeight: '100vh',
        background: '#f0f7f0',
      }}>
        {/* Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '12px 0',
          borderBottom: '1px solid #d4e8d4',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>
              Advanced Admin Control Panel
            </h1>
            <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Manage every facet of the HomelyServ ecosystem with precision</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSwitcher />
            <span style={{ color: '#5a7a5a', fontSize: '12px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}