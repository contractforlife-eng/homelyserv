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
      setUsers(res.data || []);
    } catch (err) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Users</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Manage all registered users</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid #d4e8d4',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              width: '200px',
            }}
          />
          <span style={{ fontSize: '13px', color: '#5a7a5a', alignSelf: 'center' }}>
            {filteredUsers.length} users
          </span>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #d4e8d4',
        overflow: 'hidden',
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#5a7a5a' }}>No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Joined</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Action</th>
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
    </AdminLayout>
  );
}