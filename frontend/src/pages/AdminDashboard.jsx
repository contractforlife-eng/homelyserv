import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({
    totalHires: 0,
    pendingPayments: 0,
    activeHires: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalWorkers: 0,
    totalEmployers: 0
  });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const hiresRes = await api.get('/hires/all');
      const allHires = hiresRes.data || [];
      setHires(allHires);

      const usersRes = await api.get('/auth/users');
      const allUsers = usersRes.data || [];
      setUsers(allUsers);

      const pending = allHires.filter(h => h.paymentStatus === 'pending').length;
      const active = allHires.filter(h => h.status === 'active').length;
      const revenue = allHires
        .filter(h => h.paymentStatus === 'confirmed')
        .reduce((sum, h) => sum + h.totalDue, 0);

      const workers = allUsers.filter(u => u.role === 'WORKER').length;
      const employers = allUsers.filter(u => u.role === 'EMPLOYER').length;

      setStats({
        totalHires: allHires.length,
        pendingPayments: pending,
        activeHires: active,
        totalRevenue: revenue,
        totalUsers: allUsers.length,
        totalWorkers: workers,
        totalEmployers: employers
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f0f7f0',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    sidebar: {
      width: '240px',
      background: '#1a3a1a',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2a5a2a',
      flexShrink: 0,
    },
    sidebarLogo: {
      padding: '0 20px 24px',
      borderBottom: '1px solid #2a5a2a',
      marginBottom: '16px',
    },
    sidebarMenu: {
      flex: 1,
      padding: '0 12px',
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      borderRadius: '10px',
      color: '#8aaa8a',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '2px',
    },
    sidebarItemActive: {
      background: '#2a5a2a',
      color: '#fff',
    },
    sidebarItemIcon: {
      fontSize: '18px',
      width: '24px',
    },
    sidebarBottom: {
      padding: '16px 20px',
      borderTop: '1px solid #2a5a2a',
      marginTop: 'auto',
    },
    sidebarUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    sidebarAvatar: {
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
    },
    sidebarUserName: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
    },
    sidebarUserRole: {
      color: '#8aaa8a',
      fontSize: '12px',
    },
    sidebarLogout: {
      marginTop: '12px',
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid #2a5a2a',
      borderRadius: '8px',
      color: '#8aaa8a',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'center',
    },
    main: {
      flex: 1,
      padding: '32px 40px',
      overflow: 'auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a3a1a',
      margin: 0,
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#5a7a5a',
      margin: '4px 0 0',
    },
    backBtn: {
      background: 'transparent',
      border: '1px solid #d4e8d4',
      color: '#5a7a5a',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.2s ease',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #d4e8d4',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    statLabel: {
      fontSize: '13px',
      color: '#5a7a5a',
      marginBottom: '6px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a3a1a',
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      borderBottom: '1px solid #d4e8d4',
      paddingBottom: '12px',
    },
    tab: {
      padding: '8px 20px',
      borderRadius: '8px',
      background: 'transparent',
      color: '#5a7a5a',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      background: '#2e7d32',
      color: '#fff',
    },
    tableContainer: {
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #d4e8d4',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      color: '#5a7a5a',
      fontWeight: '600',
      borderBottom: '1px solid #d4e8d4',
      background: '#f8fbf8',
    },
    td: {
      padding: '12px 16px',
      color: '#1a3a1a',
      borderBottom: '1px solid #f0f7f0',
    },
    badge: {
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
    },
    badgeAdmin: {
      background: '#2a3a2a',
      color: '#fff',
    },
    badgeEmployer: {
      background: '#e3f2fd',
      color: '#1565c0',
    },
    badgeWorker: {
      background: '#e8f5e9',
      color: '#2e7d32',
    },
    badgePending: {
      background: '#fff3e0',
      color: '#e65100',
    },
    badgeConfirmed: {
      background: '#e8f5e9',
      color: '#2e7d32',
    },
    badgeActive: {
      background: '#e8f5e9',
      color: '#2e7d32',
    },
    btnConfirm: {
      padding: '4px 12px',
      background: '#2e7d32',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    },
    btnReject: {
      padding: '4px 12px',
      background: '#c62828',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      marginLeft: '6px',
    },
    btnSuspend: {
      padding: '4px 12px',
      background: '#e65100',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    },
    btnUnsuspend: {
      padding: '4px 12px',
      background: '#2e7d32',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
    },
    emptyState: {
      padding: '40px',
      textAlign: 'center',
      color: '#5a7a5a',
      fontSize: '14px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.main}>
          <div style={styles.emptyState}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div style={styles.container}>
        <div style={styles.main}>
          <div style={styles.emptyState}>Access denied. Admin only.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <Logo />
        </div>

        <nav style={styles.sidebarMenu}>
          <div style={{ ...styles.sidebarItem, ...styles.sidebarItemActive }}>
            <span style={styles.sidebarItemIcon}>👥</span>
            Users
          </div>
          <div style={styles.sidebarItem} onClick={() => navigate('/')}>
            <span style={styles.sidebarItemIcon}>📊</span>
            Dashboard
          </div>
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.sidebarUser}>
            <div style={styles.sidebarAvatar}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={styles.sidebarUserName}>{user?.fullName}</div>
              <div style={styles.sidebarUserRole}>{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={styles.sidebarLogout}
            onMouseEnter={(e) => {
              e.target.style.background = '#2a5a2a';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#8aaa8a';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>User Management</h1>
            <p style={styles.headerSubtitle}>Manage all registered users and their activity</p>
          </div>
          <button 
            style={styles.backBtn}
            onClick={() => navigate('/')}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#2e7d32';
              e.target.style.color = '#1a3a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#d4e8d4';
              e.target.style.color = '#5a7a5a';
            }}
          >
            ← Back
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Users</div>
            <div style={styles.statValue}>{stats.totalUsers}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Workers</div>
            <div style={styles.statValue}>{stats.totalWorkers}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Employers</div>
            <div style={styles.statValue}>{stats.totalEmployers}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Hires</div>
            <div style={styles.statValue}>{stats.totalHires}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'hires' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('hires')}
          >
            📋 Hires
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'payments' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('payments')}
          >
            💳 Payments
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={styles.tableContainer}>
            {users.length === 0 ? (
              <div style={styles.emptyState}>No users registered yet.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.fullName}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(u.role === 'ADMIN' ? styles.badgeAdmin : u.role === 'EMPLOYER' ? styles.badgeEmployer : styles.badgeWorker)
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          color: u.isSuspended ? '#c62828' : '#2e7d32',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {u.isSuspended ? '🚫 Suspended' : '✅ Active'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                            style={u.isSuspended ? styles.btnUnsuspend : styles.btnSuspend}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Hires Tab */}
        {activeTab === 'hires' && (
          <div style={styles.tableContainer}>
            {hires.length === 0 ? (
              <div style={styles.emptyState}>No hires yet.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Worker</th>
                    <th style={styles.th}>Employer</th>
                    <th style={styles.th}>Salary</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hires.map(hire => (
                    <tr key={hire.id}>
                      <td style={styles.td}>{hire.worker?.user?.fullName || 'N/A'}</td>
                      <td style={styles.td}>{hire.employer?.fullName || 'N/A'}</td>
                      <td style={styles.td}>EGP {hire.agreedSalary}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(hire.status === 'active' ? styles.badgeActive : styles.badgePending)
                        }}>
                          {hire.status?.replace('_', ' ') || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div style={styles.tableContainer}>
            {hires.filter(h => h.paymentStatus === 'pending').length === 0 ? (
              <div style={styles.emptyState}>No pending payments.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Worker</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hires.filter(h => h.paymentStatus === 'pending').map(hire => (
                    <tr key={hire.id}>
                      <td style={styles.td}>{hire.worker?.user?.fullName || 'N/A'}</td>
                      <td style={styles.td}>EGP {hire.totalDue?.toFixed(0)}</td>
                      <td style={styles.td}>{hire.paymentMethod || 'N/A'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...styles.badgePending
                        }}>
                          ⏳ Pending
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => confirmPayment(hire.id)}
                          style={styles.btnConfirm}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => rejectPayment(hire.id)}
                          style={styles.btnReject}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}