import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminHires() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchHires();
  }, []);

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hires/all');
      setHires(res.data || []);
    } catch (err) {
      console.error('Failed to fetch hires:', err);
      toast.error('Failed to fetch hires');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return { bg: '#e8f5e9', color: '#1b5e20' };
      case 'accepted': return { bg: '#e3f2fd', color: '#0d47a1' };
      case 'pending': return { bg: '#fff3e0', color: '#bf360c' };
      case 'rejected': return { bg: '#fce4ec', color: '#c62828' };
      case 'completed': return { bg: '#f3e5f5', color: '#4a148c' };
      default: return { bg: '#f5f5f5', color: '#5a7a5a' };
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'accepted': return 'Accepted';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status || 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return '✅';
      case 'accepted': return '📌';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      case 'completed': return '📋';
      default: return '📌';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#2e7d32';
      case 'pending': return '#f39c12';
      case 'rejected': return '#c62828';
      default: return '#5a7a5a';
    }
  };

  const filteredHires = hires.filter(hire => {
    const matchesSearch = 
      hire.worker?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.employer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || hire.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active').length,
    pending: hires.filter(h => h.status === 'pending' || h.paymentStatus === 'pending').length,
    completed: hires.filter(h => h.status === 'completed').length,
    rejected: hires.filter(h => h.status === 'rejected').length,
  };

  const statusOptions = ['all', 'pending', 'accepted', 'active', 'rejected', 'completed'];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Loading hires...</div>
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
          Hires
        </h1>
        <p style={{ color: '#6a8bb0', fontSize: isMobile ? '14px' : '15px' }}>
          View and manage all hiring activity
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(5, 1fr)',
        gap: isMobile ? '8px' : '16px',
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
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#43e97b' }}>{stats.active}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Active</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#f093fb' }}>{stats.pending}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Pending</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#4facfe' }}>{stats.completed}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Completed</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          border: '1px solid #e8edf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#f5576c' }}>{stats.rejected}</div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6a8bb0' }}>Rejected</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search by worker, employer, or reference..."
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
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: filterStatus === status ? '2px solid #4facfe' : '1px solid #e0e8f0',
                background: filterStatus === status ? '#e3f2fd' : '#ffffff',
                color: filterStatus === status ? '#0d47a1' : '#6a8bb0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: filterStatus === status ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hires Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #e8edf4',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {filteredHires.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6a8bb0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '18px', color: '#1a2a3a', marginBottom: '4px' }}>No hires found</h3>
            <p>{searchTerm ? 'Try adjusting your search or filters.' : 'No hiring activity recorded yet.'}</p>
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
                    Worker
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Employer
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Salary
                  </th>
                  {!isMobile && (
                    <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Commission
                    </th>
                  )}
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Payment
                  </th>
                  {!isMobile && (
                    <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Date
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredHires.map(hire => {
                  const statusStyle = getStatusColor(hire.status);
                  const paymentColor = getPaymentStatusColor(hire.paymentStatus);
                  return (
                    <tr key={hire.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', fontWeight: '500', color: '#1a2a3a' }}>
                        {hire.worker?.user?.fullName || 'N/A'}
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', color: '#6a8bb0' }}>
                        {hire.employer?.fullName || 'N/A'}
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', fontWeight: '600', color: '#1a2a3a' }}>
                        EGP {hire.agreedSalary}
                      </td>
                      {!isMobile && (
                        <td style={{ padding: '12px 18px', color: '#6a8bb0', fontSize: '12px' }}>
                          EGP {hire.commissionAmount?.toFixed(2)}
                        </td>
                      )}
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: '600',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}>
                          {getStatusIcon(hire.status)} {getStatusLabel(hire.status)}
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px' }}>
                        <span style={{
                          color: paymentColor,
                          fontWeight: '600',
                          fontSize: isMobile ? '11px' : '13px'
                        }}>
                          {hire.paymentStatus || 'N/A'}
                        </span>
                      </td>
                      {!isMobile && (
                        <td style={{ padding: '12px 18px', color: '#6a8bb0', fontSize: '12px' }}>
                          {new Date(hire.createdAt).toLocaleDateString()}
                        </td>
                      )}
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
