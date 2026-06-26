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

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return { bg: '#f5576c', color: '#fff' };
      case 'EMPLOYER': return { bg: '#43e97b', color: '#1a2a3a' };
      case 'WORKER': return { bg: '#4facfe', color: '#fff' };
      default: return { bg: '#6a8bb0', color: '#fff' };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a2a3a', marginBottom: '4px' }}>
          Users
        </h1>
        <p style={{ color: '#6a8bb0', fontSize: '15px' }}>
          Manage all registered users
        </p>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a2a3a' }}>
            All Users
          </span>
          <span style={{
            fontSize: '12px',
            color: '#fff',
            background: '#4facfe',
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
            padding: '10px 16px',
            border: '1px solid #e0e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            width: '260px',
            background: '#ffffff',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = '#4facfe'}
          onBlur={(e) => e.target.style.borderColor = '#e0e8f0'}
        />
      </div>

      {/* Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.04)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6a8bb0' }}>
            {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e0e8f0' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const roleStyle = getRoleColor(u.role);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '12px 18px', fontWeight: '500', color: '#1a2a3a' }}>{u.fullName}</td>
                      <td style={{ padding: '12px 18px', color: '#6a8bb0' }}>{u.email}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: roleStyle.bg,
                          color: roleStyle.color,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          color: u.isSuspended ? '#f5576c' : '#43e97b',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          {u.isSuspended ? '⛔ Suspended' : '✅ Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                            style={{
                              padding: '6px 16px',
                              background: u.isSuspended ? '#43e97b' : '#f5576c',
                              color: u.isSuspended ? '#1a2a3a' : '#fff',
                              border: 'none',
                              borderRadius: '6px',
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}