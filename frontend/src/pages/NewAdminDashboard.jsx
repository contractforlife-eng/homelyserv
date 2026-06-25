import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function NewAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout activeSection="overview">
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading admin dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection="overview">
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
              onClick={() => navigate('/admin/users/workers')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Detailed Workers
            </button>
            <button 
              onClick={() => navigate('/admin/users/employers')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Employers
            </button>
            <button 
              onClick={() => navigate('/admin/users/verification')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Verification Queue
            </button>
            <button 
              onClick={() => navigate('/admin/users/conflicts')}
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
              onClick={() => navigate('/admin/hires/contracts')}
              style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Detailed Contract View
            </button>
            <button 
              onClick={() => navigate('/admin/hires/requests')}
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
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Revenue Breakdown
            </button>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
              Expense Tracking
            </button>
            <button style={{ padding: '8px 12px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
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
          <button style={{ padding: '6px 16px', background: '#f0f7f0', border: '1px solid #d4e8d4', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            View All →
          </button>
        </div>
        {hires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#5a7a5a' }}>No hires yet. Create test data or wait for user activity.</div>
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
    </AdminLayout>
  );
}