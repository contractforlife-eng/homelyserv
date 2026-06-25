import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, setUser, setToken } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [creatingTest, setCreatingTest] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHires: 0,
    activeHires: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    workers: 0,
    employers: 0,
    admins: 0
  });

  // Auto-login for development
  useEffect(() => {
    const autoLogin = async () => {
      if (!user) {
        try {
          const res = await api.post('/auth/login', {
            email: 'emad@homelyserv.com',
            password: 'killuemad'
          });
          if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            setToken(res.data.token);
            window.location.reload();
          }
        } catch (err) {
          console.error('Auto-login failed:', err);
          navigate('/login');
        }
      }
    };
    autoLogin();
  }, []);


  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let allHires = [];
      try {
        const hiresRes = await api.get('/hires/all');
        allHires = hiresRes.data || [];
        setHires(allHires);
      } catch (err) {
        console.error('Failed to fetch hires:', err);
      }

      let allUsers = [];
      try {
        const usersRes = await api.get('/auth/users');
        allUsers = usersRes.data || [];
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
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
        totalUsers: allUsers.length,
        totalHires: allHires.length,
        activeHires: active,
        pendingPayments: pending,
        totalRevenue: revenue,
        workers: workers,
        employers: employers,
        admins: admins
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load admin data');
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

  const createTestData = async () => {
    setCreatingTest(true);
    try {
      const res = await api.post('/hires/test');
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create test data');
    }
    setCreatingTest(false);
  };

  const renderOverview = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>Total Users</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a3a1a' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '12px', color: '#8aaa8a' }}>👥 {stats.workers} Workers · {stats.employers} Employers</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>Total Hires</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a3a1a' }}>{stats.totalHires}</div>
          <div style={{ fontSize: '12px', color: '#8aaa8a' }}>📋 {stats.activeHires} Active</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>Pending Payments</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f39c12' }}>{stats.pendingPayments}</div>
          <div style={{ fontSize: '12px', color: '#8aaa8a' }}>⏳ Awaiting confirmation</div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>EGP {stats.totalRevenue.toFixed(0)}</div>
          <div style={{ fontSize: '12px', color: '#8aaa8a' }}>💰 Commissions collected</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>👥 User Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Detailed Workers
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Employers
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Verification Queue
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Conflict Resolution
            </button>
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>📋 Hire Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('hires')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Detailed Contract View
            </button>
            <button 
              onClick={() => setActiveTab('hires')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Service Request Tracking
            </button>
          </div>
        </div>
      </div>

      {/* Additional Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>💰 Financials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => setActiveTab('payments')} style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Revenue Breakdown
            </button>
            <button onClick={() => setActiveTab('payments')} style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Expense Tracking
            </button>
            <button onClick={() => setActiveTab('payments')} style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Payout Processing
            </button>
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>⚙️ Application Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              General Settings
            </button>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Payment Gateway Config
            </button>
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #d4e8d4',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>📝 Content Management</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              FAQs
            </button>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Blog Posts
            </button>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Static Pages
            </button>
          </div>
        </div>
      </div>

      {/* Recent Hires Table */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #d4e8d4',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a' }}>📋 Real-Time Hiring Contracts</h3>
          <button 
            onClick={createTestData}
            disabled={creatingTest}
            style={{ padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {creatingTest ? 'Creating...' : '📊 Create Test Data'}
          </button>
        </div>
        {hires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#5a7a5a' }}>No hires yet. Click "Create Test Data" to generate sample data.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Worker</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Employer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Salary</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {hires.slice(0, 5).map((hire) => (
                  <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '500' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                    <td style={{ padding: '10px 14px', color: '#5a7a5a' }}>{hire.employer?.fullName || 'N/A'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500' }}>EGP {hire.agreedSalary}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: hire.status === 'active' ? '#e8f5e9' : '#fff3e0',
                        color: hire.status === 'active' ? '#1b5e20' : '#bf360c',
                      }}>
                        {hire.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#8aaa8a', fontSize: '12px' }}>
                      {hire.updatedAt ? new Date(hire.updatedAt).toLocaleDateString() : new Date(hire.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a' }}>👥 All Users ({users.length})</h3>
        <span style={{ fontSize: '13px', color: '#5a7a5a' }}>Click Suspend to block user access</span>
      </div>
      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>No users registered yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #d4e8d4' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>{u.fullName}</td>
                  <td style={{ padding: '10px 16px', color: '#5a7a5a' }}>{u.email}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: u.role === 'ADMIN' ? '#2a3a2a' : u.role === 'EMPLOYER' ? '#e3f2fd' : '#e8f5e9',
                      color: u.role === 'ADMIN' ? '#fff' : u.role === 'EMPLOYER' ? '#0d47a1' : '#1b5e20',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      color: u.isSuspended ? '#c62828' : '#2e7d32',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {u.isSuspended ? '🚫 Suspended' : '✅ Active'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                        style={{
                          padding: '4px 14px',
                          background: u.isSuspended ? '#2e7d32' : '#e65100',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
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
  );

  const renderHires = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>📋 All Hires ({hires.length})</h3>
      {hires.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No Hires Yet</h3>
          <p style={{ color: '#5a7a5a' }}>Click "Create Test Data" in the overview tab.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #d4e8d4' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Worker</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Employer</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Salary</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {hires.map(hire => (
                <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                  <td style={{ padding: '10px 16px', color: '#5a7a5a' }}>{hire.employer?.fullName || 'N/A'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>EGP {hire.agreedSalary}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: hire.status === 'active' ? '#e8f5e9' : hire.status === 'offer_sent' ? '#fff3e0' : '#fce4ec',
                      color: hire.status === 'active' ? '#1b5e20' : hire.status === 'offer_sent' ? '#bf360c' : '#c62828',
                    }}>
                      {hire.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
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
  );

  const renderPayments = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>💰 Pending Payments</h3>
      {hires.filter(h => h.paymentStatus === 'pending').length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No Pending Payments</h3>
          <p style={{ color: '#5a7a5a' }}>All payments have been processed.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #d4e8d4' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Worker</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Method</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Reference</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {hires.filter(h => h.paymentStatus === 'pending').map(hire => (
                <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: '600', color: '#1a3a1a' }}>EGP {hire.totalDue?.toFixed(0)}</td>
                  <td style={{ padding: '10px 16px', color: '#5a7a5a' }}>{hire.paymentMethod || 'N/A'}</td>
                  <td style={{ padding: '10px 16px', color: '#5a7a5a', fontSize: '12px' }}>{hire.paymentReference}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => confirmPayment(hire.id)}
                        style={{
                          padding: '4px 14px',
                          background: '#2e7d32',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        ✅ Confirm
                      </button>
                      <button
                        onClick={() => rejectPayment(hire.id)}
                        style={{
                          padding: '4px 14px',
                          background: '#c62828',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout activeSection="overview">
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading admin dashboard...</div>
      </AdminLayout>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <AdminLayout activeSection="overview">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>Access Denied</h3>
          <p style={{ color: '#5a7a5a' }}>Admin access required.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection="overview">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Advanced Admin Control Panel</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Manage every facet of the HomelyServ ecosystem with precision</p>
        </div>
        <button
          onClick={createTestData}
          disabled={creatingTest}
          style={{
            padding: '8px 20px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {creatingTest ? 'Creating...' : '📊 Create Test Data'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid #d4e8d4',
        marginBottom: '24px',
        paddingBottom: '12px',
      }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'users', label: '👥 Users' },
          { key: 'hires', label: '📋 Hires' },
          { key: 'payments', label: '💰 Payments' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: activeTab === tab.key ? '#2e7d32' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#5a7a5a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'hires' && renderHires()}
      {activeTab === 'payments' && renderPayments()}
    </AdminLayout>
  );
}