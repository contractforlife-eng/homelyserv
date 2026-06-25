import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalHires: 0,
    pendingPayments: 0,
    activeHires: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalWorkers: 0,
    totalEmployers: 0,
    totalAdmins: 0
  });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch hires
      let allHires = [];
      try {
        const hiresRes = await api.get('/hires/all');
        allHires = hiresRes.data || [];
        setHires(allHires);
      } catch (err) {
        console.error('Failed to fetch hires:', err);
        // Don't set error here, just show empty hires
      }

      // Try to fetch users
      let allUsers = [];
      try {
        const usersRes = await api.get('/auth/users');
        allUsers = usersRes.data || [];
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        // Don't set error here, just show empty users
      }

      const pending = allHires.filter(h => h.paymentStatus === 'pending').length;
      const active = allHires.filter(h => h.status === 'active').length;
      const revenue = allHires
        .filter(h => h.paymentStatus === 'confirmed')
        .reduce((sum, h) => sum + (h.totalDue || 0), 0);

      const workers = allUsers.filter(u => u.role === 'WORKER').length;
      const employers = allUsers.filter(u => u.role === 'EMPLOYER').length;
      const admins = allUsers.filter(u => u.role === 'ADMIN').length;

      setStats({
        totalHires: allHires.length,
        pendingPayments: pending,
        activeHires: active,
        totalRevenue: revenue,
        totalUsers: allUsers.length,
        totalWorkers: workers,
        totalEmployers: employers,
        totalAdmins: admins
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load admin data. Please try again.');
    }
    setLoading(false);
  };

  const confirmPayment = async (hireId) => {
    if (!window.confirm('Confirm this payment?')) return;
    try {
      await api.put(`/hires/${hireId}/confirm-payment`);
      toast.success('Payment confirmed!');
      fetchData();
    } catch (err) {
      toast.error('Failed to confirm payment');
    }
  };

  const rejectPayment = async (hireId) => {
    if (!window.confirm('Reject this payment?')) return;
    try {
      await api.put(`/hires/${hireId}/payment`, {
        paymentMethod: 'rejected',
        paymentProofUrl: 'rejected'
      });
      toast.success('Payment rejected');
      fetchData();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
  };

  const toggleUserSuspend = async (userId, currentStatus) => {
    const action = currentStatus ? 'unsuspend' : 'suspend';
    if (!window.confirm(`${action} this user?`)) return;
    try {
      await api.put(`/auth/users/${userId}/suspend`, { 
        suspended: !currentStatus 
      });
      toast.success(`User ${action}ed successfully!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'users', label: '👥 Users' },
    { key: 'hires', label: '📋 Hires' },
    { key: 'payments', label: '💰 Payments' },
  ];

  if (loading) {
    return (
      <Layout activeTab="admin">
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px' }}></div>
          Loading admin dashboard...
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <Layout activeTab="admin">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>Access Denied</h3>
          <p style={{ color: '#5a7a5a' }}>Admin access required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab="admin">
      <div className="page-header">
        <h1 className="page-title">Admin Control Panel</h1>
        <p className="page-subtitle">Manage all aspects of the HomelyServ platform</p>
      </div>

      {error && (
        <div className="card" style={{ background: '#fff3e0', borderColor: '#e65100', marginBottom: '20px' }}>
          <p style={{ color: '#e65100' }}>{error}</p>
          <button 
            onClick={fetchData}
            style={{ marginTop: '8px', padding: '6px 16px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-change">👥 {stats.totalWorkers} Workers · {stats.totalEmployers} Employers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalHires}</div>
          <div className="stat-label">Total Hires</div>
          <div className="stat-change">📋 {stats.activeHires} Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f39c12' }}>{stats.pendingPayments}</div>
          <div className="stat-label">Pending Payments</div>
          <div className="stat-change">⏳ Awaiting confirmation</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2e7d32' }}>EGP {stats.totalRevenue.toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-change">💰 Commissions collected</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-grid card-grid-4" style={{ marginBottom: '32px' }}>
        <div 
          className="card" 
          style={{ cursor: 'pointer', textAlign: 'center' }}
          onClick={() => setActiveTab('users')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>Manage Users</h4>
          <p style={{ fontSize: '12px', color: '#5a7a5a' }}>View and manage all users</p>
        </div>
        <div 
          className="card" 
          style={{ cursor: 'pointer', textAlign: 'center' }}
          onClick={() => setActiveTab('hires')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>View Hires</h4>
          <p style={{ fontSize: '12px', color: '#5a7a5a' }}>Monitor all hiring activity</p>
        </div>
        <div 
          className="card" 
          style={{ cursor: 'pointer', textAlign: 'center' }}
          onClick={() => setActiveTab('payments')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>Payments</h4>
          <p style={{ fontSize: '12px', color: '#5a7a5a' }}>Confirm and manage payments</p>
        </div>
        <div 
          className="card" 
          style={{ cursor: 'pointer', textAlign: 'center' }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e7d32'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d4e8d4'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>Dashboard</h4>
          <p style={{ fontSize: '12px', color: '#5a7a5a' }}>Return to main dashboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs" style={{ borderBottom: '2px solid #d4e8d4', marginBottom: '24px', padding: '0 0 12px 0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="card-grid card-grid-2">
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>📈 Platform Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><span style={{ color: '#5a7a5a' }}>Total Users:</span> <strong>{stats.totalUsers}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Workers:</span> <strong>{stats.totalWorkers}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Employers:</span> <strong>{stats.totalEmployers}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Admins:</span> <strong>{stats.totalAdmins}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Total Hires:</span> <strong>{stats.totalHires}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Active Hires:</span> <strong>{stats.activeHires}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Pending Payments:</span> <strong style={{ color: '#f39c12' }}>{stats.pendingPayments}</strong></div>
                <div><span style={{ color: '#5a7a5a' }}>Revenue:</span> <strong style={{ color: '#2e7d32' }}>EGP {stats.totalRevenue.toFixed(0)}</strong></div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>⚡ Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '10px', fontSize: '14px' }}
                  onClick={() => setActiveTab('users')}
                >
                  👥 Manage Users
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '10px', fontSize: '14px', background: '#f39c12' }}
                  onClick={() => setActiveTab('payments')}
                >
                  💳 Review Payments
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '10px', fontSize: '14px', background: '#1976d2' }}
                  onClick={() => setActiveTab('hires')}
                >
                  📋 View All Hires
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#5a7a5a' }}>No users registered yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Name</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Email</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Role</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                        <td style={{ padding: '12px 18px', fontWeight: '500', color: '#1a3a1a' }}>{u.fullName}</td>
                        <td style={{ padding: '12px 18px', color: '#5a7a5a' }}>{u.email}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            padding: '3px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: u.role === 'ADMIN' ? '#2a3a2a' : u.role === 'EMPLOYER' ? '#e3f2fd' : '#e8f5e9',
                            color: u.role === 'ADMIN' ? '#fff' : u.role === 'EMPLOYER' ? '#0d47a1' : '#1b5e20',
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            color: u.isSuspended ? '#c62828' : '#2e7d32',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            {u.isSuspended ? '🚫 Suspended' : '✅ Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                              style={{
                                padding: '5px 16px',
                                background: u.isSuspended ? '#2e7d32' : '#e65100',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            >
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hires Tab */}
      {activeTab === 'hires' && (
        <div>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {hires.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#5a7a5a' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No Hires Yet</h3>
                <p style={{ color: '#5a7a5a' }}>No hiring activity has been recorded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Worker</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Employer</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Salary</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hires.map(hire => (
                      <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                        <td style={{ padding: '12px 18px', fontWeight: '500', color: '#1a3a1a' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                        <td style={{ padding: '12px 18px', color: '#5a7a5a' }}>{hire.employer?.fullName || 'N/A'}</td>
                        <td style={{ padding: '12px 18px', fontWeight: '500', color: '#1a3a1a' }}>EGP {hire.agreedSalary}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            padding: '3px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: hire.status === 'active' ? '#e8f5e9' : hire.status === 'offer_sent' ? '#fff3e0' : '#fce4ec',
                            color: hire.status === 'active' ? '#1b5e20' : hire.status === 'offer_sent' ? '#bf360c' : '#c62828',
                          }}>
                            {hire.status?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            color: hire.paymentStatus === 'confirmed' ? '#2e7d32' : hire.paymentStatus === 'pending' ? '#f39c12' : '#5a7a5a',
                            fontWeight: '600',
                            fontSize: '13px'
                          }}>
                            {hire.paymentStatus || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          {hires.filter(h => h.paymentStatus === 'pending').length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No Pending Payments</h3>
              <p style={{ color: '#5a7a5a' }}>All payments have been processed.</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Worker</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Amount</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Method</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Reference</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '13px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hires.filter(h => h.paymentStatus === 'pending').map(hire => (
                      <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                        <td style={{ padding: '12px 18px', fontWeight: '500', color: '#1a3a1a' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                        <td style={{ padding: '12px 18px', fontWeight: '600', color: '#1a3a1a' }}>EGP {hire.totalDue?.toFixed(0)}</td>
                        <td style={{ padding: '12px 18px', color: '#5a7a5a' }}>{hire.paymentMethod || 'N/A'}</td>
                        <td style={{ padding: '12px 18px', color: '#5a7a5a', fontSize: '12px' }}>{hire.paymentReference}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => confirmPayment(hire.id)}
                              style={{
                                padding: '5px 16px',
                                background: '#2e7d32',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => rejectPayment(hire.id)}
                              style={{
                                padding: '5px 16px',
                                background: '#c62828',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}