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
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      
      // Fetch worker profiles for photos
      const usersWithPhotos = await Promise.all(usersData.map(async (u) => {
        if (u.role === 'WORKER') {
          try {
            const profileRes = await api.get('/workers/me').catch(() => ({ data: null }));
            return { ...u, profilePhotoUrl: profileRes.data?.profilePhotoUrl || null };
          } catch {
            return { ...u, profilePhotoUrl: null };
          }
        }
        return { ...u, profilePhotoUrl: null };
      }));
      
      setUsers(usersWithPhotos);
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

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return { bg: '#f5576c', color: '#fff' };
      case 'EMPLOYER': return { bg: '#43e97b', color: '#1a2a3a' };
      case 'WORKER': return { bg: '#4facfe', color: '#fff' };
      default: return { bg: '#6a8bb0', color: '#fff' };
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' ? !u.isSuspended : u.isSuspended);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    workers: users.filter(u => u.role === 'WORKER').length,
    employers: users.filter(u => u.role === 'EMPLOYER').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    active: users.filter(u => !u.isSuspended).length,
    suspended: users.filter(u => u.isSuspended).length,
  };

  const roleOptions = ['all', 'WORKER', 'EMPLOYER', 'ADMIN'];
  const statusOptions = ['all', 'active', 'suspended'];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{ 
          fontSize: isMobile ? '22px' : '28px', 
          fontWeight: '700', 
          color: '#1a2a3a', 
          marginBottom: '4px' 
        }}>
          Users
        </h1>
        <p style={{ color: '#6a8bb0', fontSize: isMobile ? '14px' : '15px' }}>
          Manage all registered users
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(6, 1fr)',
        gap: isMobile ? '8px' : '12px',
        marginBottom: isMobile ? '16px' : '24px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#1a2a3a' }}>{stats.total}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Total</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#4facfe' }}>{stats.workers}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Workers</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#43e97b' }}>{stats.employers}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Employers</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#f5576c' }}>{stats.admins}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Admins</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Active</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#c62828' }}>{stats.suspended}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Suspended</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid #e0e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            background: '#ffffff',
            minWidth: '200px',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = '#4facfe'}
          onBlur={(e) => e.target.style.borderColor = '#e0e8f0'}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid #e0e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              background: '#ffffff',
              color: '#1a2a3a',
            }}
          >
            <option value="all">All Roles</option>
            <option value="WORKER">Workers</option>
            <option value="EMPLOYER">Employers</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid #e0e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              background: '#ffffff',
              color: '#1a2a3a',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #e8edf4',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6a8bb0' }}>
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? 'No users found matching your filters.' 
              : 'No users registered yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: isMobile ? '12px' : '14px' 
            }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf4' }}>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Photo
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Name
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Email
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Role
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Joined
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const roleStyle = getRoleColor(u.role);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px' }}>
                        <div style={{
                          width: isMobile ? '32px' : '40px',
                          height: isMobile ? '32px' : '40px',
                          borderRadius: '50%',
                          background: '#f0f0f0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #e0e8f0',
                        }}>
                          {u.profilePhotoUrl ? (
                            <img
                              src={u.profilePhotoUrl}
                              alt={u.fullName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span style="font-size:18px;">👤</span>';
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: isMobile ? '14px' : '18px', color: '#6a8bb0' }}>👤</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px', fontWeight: '500', color: '#1a2a3a' }}>
                        {u.fullName}
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px', color: '#6a8bb0', fontSize: isMobile ? '11px' : '13px' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '6px',
                          fontSize: isMobile ? '10px' : '12px',
                          fontWeight: '600',
                          background: roleStyle.bg,
                          color: roleStyle.color,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px' }}>
                        <span style={{
                          color: u.isSuspended ? '#c62828' : '#2e7d32',
                          fontWeight: '600',
                          fontSize: isMobile ? '11px' : '13px'
                        }}>
                          {u.isSuspended ? '⛔ Suspended' : '✅ Active'}
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px', color: '#6a8bb0', fontSize: isMobile ? '10px' : '12px' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: isMobile ? '8px 12px' : '10px 18px' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUserSuspend(u.id, u.isSuspended)}
                            style={{
                              padding: isMobile ? '4px 10px' : '6px 16px',
                              background: u.isSuspended ? '#2e7d32' : '#f5576c',
                              color: u.isSuspended ? '#fff' : '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: isMobile ? '10px' : '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap',
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