import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';

export default function MyHires() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchHires();
  }, []);

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hires/my');
      setHires(res.data || []);
    } catch (err) {
      console.error('Failed to fetch hires:', err);
      toast.error('Failed to load hires');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#2e7d32';
      case 'pending': return '#f39c12';
      case 'completed': return '#1976d2';
      case 'cancelled': return '#c62828';
      default: return '#5a7a5a';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const filteredHires = activeTab === 'all' 
    ? hires 
    : hires.filter(h => h.status === activeTab);

  const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '👤', label: 'My Profile', path: '/worker-profile' },
    { icon: '📋', label: 'My Hires', path: '/my-hires', active: true },
    { icon: '🔄', label: 'Switch Role', path: '#' },
  ];

  // Stats
  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active').length,
    pending: hires.filter(h => h.paymentStatus === 'pending').length,
    completed: hires.filter(h => h.status === 'completed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0' }}>
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="top-nav-content">
          <div className="top-nav-left">
            <Logo />
          </div>
          <div className="top-nav-right">
            <LanguageSwitcher />
            <div className="nav-user">
              <div className="nav-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
              <div>
                <div className="nav-username">{user?.fullName}</div>
                <div className="nav-user-role">{user?.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" style={{ background: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Items */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', gap: '8px', borderBottom: '1px solid #d4e8d4', background: '#fff' }}>
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a', marginBottom: '4px' }}>
              My Hires
            </h1>
            <p style={{ color: '#5a7a5a', fontSize: '16px' }}>View all your hiring activity and job offers</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
              <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12' }}>{stats.pending}</div>
              <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1976d2' }}>{stats.completed}</div>
              <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Completed</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #d4e8d4', paddingBottom: '12px' }}>
            {['all', 'active', 'pending', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: activeTab === tab ? '#2e7d32' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#5a7a5a',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Hires List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Loading hires...</div>
          ) : filteredHires.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #d4e8d4' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No hires found</h3>
              <p style={{ color: '#5a7a5a' }}>You don't have any {activeTab !== 'all' ? activeTab : ''} hires yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredHires.map((hire) => (
                <div 
                  key={hire.id} 
                  style={{ 
                    background: '#fff', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    border: '1px solid #d4e8d4',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a3a1a' }}>
                        {user?.role === 'WORKER' ? hire.employer?.fullName : hire.worker?.user?.fullName}
                      </span>
                      <span style={{
                        padding: '2px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: getStatusColor(hire.status) + '20',
                        color: getStatusColor(hire.status),
                      }}>
                        {getStatusLabel(hire.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                      {user?.role === 'WORKER' ? 'Employer' : 'Worker'} · 
                      EGP {hire.agreedSalary} · 
                      {hire.worker?.category || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8aaa8a', marginTop: '4px' }}>
                      Reference: {hire.paymentReference} · 
                      {hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Start date not set'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                      Payment: <span style={{ fontWeight: '600', color: hire.paymentStatus === 'confirmed' ? '#2e7d32' : '#f39c12' }}>
                        {hire.paymentStatus || 'Not started'}
                      </span>
                    </div>
                    {hire.paymentStatus === 'pending' && hire.paymentProofUrl && (
                      <a 
                        href={hire.paymentProofUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: '#2e7d32', textDecoration: 'none' }}
                      >
                        View Receipt →
                      </a>
                    )}
                    {hire.status === 'active' && (
                      <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>✅ Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}