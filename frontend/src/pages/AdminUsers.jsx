import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    workers: 0,
    employers: 0,
    admins: 0,
    active: 0,
    suspended: 0
  });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      const usersData = res.data || [];
      setUsers(usersData);

      // Calculate stats
      const workers = usersData.filter(u => u.role === 'WORKER').length;
      const employers = usersData.filter(u => u.role === 'EMPLOYER').length;
      const admins = usersData.filter(u => u.role === 'ADMIN').length;
      const active = usersData.filter(u => !u.isSuspended).length;
      const suspended = usersData.filter(u => u.isSuspended).length;

      setStats({
        total: usersData.length,
        workers,
        employers,
        admins,
        active,
        suspended
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to fetch users');
    }
    setLoading(false);
  };

  const toggleUserSuspend = async (userId, currentStatus) => {
    const action = currentStatus ? 'unsuspend' : 'suspend';
    if (!window.confirm(`${action} this user?`)) return;
    try {
      await api.put(`/auth/users/${userId}/suspend`, { suspended: !currentStatus });
      toast.success(`User ${action}ed successfully!`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Users</h1>
        <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Manage all registered users</p>
      </div>

      {/* User Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a1a' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Total</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>{stats.workers}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Workers</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d47a1' }}>{stats.employers}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Employers</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#4a148c' }}>{stats.admins}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Admins</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Active</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '1px solid #d4e8d4', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#c62828' }}>{stats.suspended}</div>
          <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Suspended</div>
        </div>
      </div>

      {/* Search and Table */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #d4e8d4',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f7f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a' }}>
              All Users
            </span>
            <span style={{
              fontSize: '12px',
              color: '#fff',
              background: '#2e7d32',
              padding: '2px 10px',
              borderRadius: '12px',
            }}>
              {filteredUsers.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d4e8d4',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              width: '250px',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
            onBlur={(e) => e.target.style.borderColor = '#d4e8d4'}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#5a7a5a' }}>
            {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Joined</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600', fontSize: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
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
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {u.isSuspended ? '🚫 Suspended' : '✅ Active'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#5a7a5a', fontSize: '12px' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
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
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
    </AdminLayout>
  );
}