import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hires');
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
      // Fetch hires
      const hiresRes = await api.get('/hires/all');
      const allHires = hiresRes.data || [];
      setHires(allHires);

      // Fetch users
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading dashboard...</div>;

  if (user?.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Access denied. Admin only.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#2C3E50', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Admin Dashboard</h1>
        <span style={{ marginLeft: 'auto', color: '#bdc3c7', fontSize: '13px' }}>HomelyServ Admin</span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#C0392B' }}>{stats.totalHires}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Total Hires</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#E67E22' }}>{stats.pendingPayments}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Pending Payments</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#27AE60' }}>{stats.activeHires}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Active Hires</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#C0392B' }}>EGP {stats.totalRevenue.toFixed(0)}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Revenue</div>
          </div>
        </div>

        {/* User Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#2C3E50' }}>{stats.totalUsers}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Total Users</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#2980B9' }}>{stats.totalWorkers}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Workers</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#27AE60' }}>{stats.totalEmployers}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Employers</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '2px solid #E0E0E0', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('hires')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'hires' ? '#C0392B' : 'transparent',
              color: activeTab === 'hires' ? '#fff' : '#444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            📋 Hires
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'users' ? '#C0392B' : 'transparent',
              color: activeTab === 'users' ? '#fff' : '#444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            👥 Users
          </button>
        </div>

        {/* Hires Tab */}
        {activeTab === 'hires' && (
          <>
            {/* Pending Payments */}
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>Pending Payments</h2>

            {hires.filter(h => h.paymentStatus === 'pending').length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#888', marginBottom: '20px' }}>
                ✅ No pending payments
              </div>
            ) : (
              hires.filter(h => h.paymentStatus === 'pending').map(hire => (
                <div key={hire.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '10px', border: '1px solid #E0E0E0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1A1A1A' }}>{hire.worker?.user?.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{hire.worker?.category} · {hire.worker?.user?.city}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        Employer: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.employer?.fullName}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        Method: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.paymentMethod}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        Reference: <span style={{ fontWeight: '500', color: '#1A1A1A' }}>{hire.paymentReference}</span>
                      </div>
                      {hire.paymentProofUrl && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={hire.paymentProofUrl} target="_blank" rel="noreferrer"
                            style={{ color: '#C0392B', fontSize: '12px', fontWeight: '600', textDecoration: 'none', background: '#FDECEA', padding: '4px 12px', borderRadius: '20px' }}>
                            📎 View payment screenshot
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#C0392B' }}>EGP {hire.totalDue?.toFixed(0)}</div>
                      <div style={{ fontSize: '11px', color: '#E67E22', fontWeight: '500' }}>⏳ Pending</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => confirmPayment(hire.id)}
                      style={{ flex: 1, padding: '8px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                      ✅ Confirm Payment
                    </button>
                    <button onClick={() => rejectPayment(hire.id)}
                      style={{ flex: 1, padding: '8px', background: '#E74C3C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* All Hires */}
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', margin: '20px 0 12px' }}>All Hires ({hires.length})</h2>

            {hires.map(hire => (
              <div key={hire.id} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', border: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>{hire.worker?.user?.fullName}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{hire.employer?.fullName} · EGP {hire.agreedSalary} · {hire.paymentReference}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '500',
                    color: hire.paymentStatus === 'confirmed' ? '#27AE60' :
                      hire.paymentStatus === 'pending' ? '#E67E22' : '#888'
                  }}>
                    {hire.paymentStatus === 'confirmed' ? '✅' :
                      hire.paymentStatus === 'pending' ? '⏳' : '⚪'} {hire.paymentStatus || 'Not started'}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '500',
                    color: hire.status === 'active' ? '#27AE60' :
                      hire.status === 'offer_sent' ? '#F39C12' : '#888'
                  }}>
                    ● {hire.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
              Registered Users ({users.length})
            </h2>

            {users.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#888' }}>
                No users registered yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', background: '#fff', borderRadius: '10px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #E0E0E0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Role</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Category</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#444' }}>Joined</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: '#444' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '500' }}>{u.fullName}</td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>{u.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: u.role === 'ADMIN' ? '#2C3E50' : u.role === 'EMPLOYER' ? '#2980B9' : '#27AE60',
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#666' }}>
                          {u.workerProfile?.category || '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            color: u.isSuspended ? '#E74C3C' : '#27AE60',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>
                            {u.isSuspended ? '🚫 Suspended' : u.isVerified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#666', fontSize: '12px' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                              style={{
                                padding: '4px 12px',
                                background: u.isSuspended ? '#27AE60' : '#E67E22',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
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
        )}
      </div>
    </div>
  );
}