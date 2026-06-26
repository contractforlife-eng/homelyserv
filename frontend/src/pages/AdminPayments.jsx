import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminPayments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hires/all');
      setHires(res.data || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      toast.error('Failed to fetch payments');
    }
    setLoading(false);
  };

  const confirmPayment = async (hireId) => {
    if (!window.confirm('Confirm this payment?')) return;
    setProcessingId(hireId);
    try {
      await api.put(`/hires/${hireId}/confirm-payment`);
      toast.success('Payment confirmed successfully! Contact details are now shared.');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to confirm payment');
    }
    setProcessingId(null);
  };

  const rejectPayment = async (hireId) => {
    if (!window.confirm('Reject this payment?')) return;
    setProcessingId(hireId);
    try {
      await api.put(`/hires/${hireId}/payment`, {
        paymentMethod: 'rejected',
        paymentProofUrl: 'rejected'
      });
      toast.success('Payment rejected');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
    setProcessingId(null);
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return { bg: '#e8f5e9', color: '#1b5e20' };
      case 'pending': return { bg: '#fff3e0', color: '#bf360c' };
      case 'rejected': return { bg: '#fce4ec', color: '#c62828' };
      default: return { bg: '#f5f5f5', color: '#5a7a5a' };
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch(status) {
      case 'confirmed': return 'Confirmed ✅';
      case 'pending': return 'Pending ⏳';
      case 'rejected': return 'Rejected ❌';
      default: return status || 'N/A';
    }
  };

  const getMethodLabel = (method) => {
    switch(method) {
      case 'instapay': return 'InstaPay';
      case 'vodafone': return 'Vodafone Cash';
      case 'bank': return 'Bank Transfer';
      case 'btc': return 'Bitcoin';
      case 'usdc': return 'USDC';
      default: return method || 'N/A';
    }
  };

  const pendingPayments = hires.filter(h => h.paymentStatus === 'pending');
  const confirmedPayments = hires.filter(h => h.paymentStatus === 'confirmed');
  const rejectedPayments = hires.filter(h => h.paymentStatus === 'rejected');
  const totalRevenue = confirmedPayments.reduce((sum, h) => sum + (h.totalDue || 0), 0);

  const filteredHires = hires.filter(hire => {
    const matchesSearch = 
      hire.worker?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.employer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hire.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || hire.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['all', 'pending', 'confirmed', 'rejected'];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Loading payments...</div>
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
          Payments
        </h1>
        <p style={{ color: '#6a8bb0', fontSize: isMobile ? '14px' : '15px' }}>
          Manage and confirm payments
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '20px' : '24px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          border: '1px solid #e8edf4',
        }}>
          <div style={{ fontSize: '12px', color: '#6a8bb0', marginBottom: '4px' }}>Total Revenue</div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#2e7d32' }}>
            EGP {totalRevenue.toFixed(0)}
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          border: '1px solid #e8edf4',
        }}>
          <div style={{ fontSize: '12px', color: '#6a8bb0', marginBottom: '4px' }}>Pending Payments</div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#f093fb' }}>
            {pendingPayments.length}
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          border: '1px solid #e8edf4',
        }}>
          <div style={{ fontSize: '12px', color: '#6a8bb0', marginBottom: '4px' }}>Confirmed Payments</div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#43e97b' }}>
            {confirmedPayments.length}
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          border: '1px solid #e8edf4',
        }}>
          <div style={{ fontSize: '12px', color: '#6a8bb0', marginBottom: '4px' }}>Rejected Payments</div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#f5576c' }}>
            {rejectedPayments.length}
          </div>
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

      {/* Pending Payments Section */}
      {filterStatus === 'all' || filterStatus === 'pending' ? (
        <>
          <h2 style={{ 
            fontSize: isMobile ? '15px' : '16px', 
            fontWeight: '600', 
            color: '#1a2a3a', 
            marginBottom: '12px',
            marginTop: '16px',
          }}>
            ⏳ Pending Payments
          </h2>

          {pendingPayments.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '30px',
              textAlign: 'center',
              border: '1px solid #e8edf4',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
              <h3 style={{ fontSize: '16px', color: '#1a2a3a' }}>No pending payments</h3>
              <p style={{ color: '#6a8bb0', fontSize: '13px' }}>All payments have been processed.</p>
            </div>
          ) : (
            pendingPayments.map(hire => (
              <div key={hire.id} style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                border: '1px solid #e8edf4',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a2a3a' }}>
                        {hire.worker?.user?.fullName || 'N/A'}
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#fff3e0',
                        color: '#bf360c',
                      }}>
                        ⏳ Pending
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6a8bb0', marginBottom: '4px' }}>
                      👤 Employer: {hire.employer?.fullName || 'N/A'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6a8bb0', marginBottom: '4px' }}>
                      💰 Amount: <strong style={{ color: '#1a2a3a' }}>EGP {hire.totalDue?.toFixed(0)}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6a8bb0', marginBottom: '4px' }}>
                      🏷️ Method: <span style={{ color: '#1a2a3a', fontWeight: '500' }}>
                        {getMethodLabel(hire.paymentMethod)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6a8bb0', marginBottom: '4px' }}>
                      📋 Reference: <span style={{ color: '#1a2a3a', fontWeight: '500' }}>
                        {hire.paymentReference}
                      </span>
                    </div>
                    {hire.paymentProofUrl && (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href={hire.paymentProofUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            color: '#4facfe',
                            fontSize: '13px',
                            fontWeight: '500',
                            textDecoration: 'none',
                            background: '#e3f2fd',
                            padding: '4px 12px',
                            borderRadius: '6px',
                          }}
                        >
                          📎 View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    gap: '8px',
                    alignItems: isMobile ? 'center' : 'flex-end',
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    width: isMobile ? '100%' : 'auto',
                  }}>
                    <button
                      onClick={() => confirmPayment(hire.id)}
                      disabled={processingId === hire.id}
                      style={{
                        padding: isMobile ? '8px 20px' : '8px 24px',
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        width: isMobile ? '48%' : '100%',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      {processingId === hire.id ? 'Processing...' : '✅ Confirm'}
                    </button>
                    <button
                      onClick={() => rejectPayment(hire.id)}
                      disabled={processingId === hire.id}
                      style={{
                        padding: isMobile ? '8px 20px' : '8px 24px',
                        background: '#c62828',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        width: isMobile ? '48%' : '100%',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      ) : null}

      {/* All Payments Table */}
      <h2 style={{ 
        fontSize: isMobile ? '15px' : '16px', 
        fontWeight: '600', 
        color: '#1a2a3a', 
        marginBottom: '12px',
        marginTop: '24px',
      }}>
        All Payments ({filteredHires.length})
      </h2>

      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #e8edf4',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {filteredHires.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6a8bb0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
            <h3 style={{ fontSize: '18px', color: '#1a2a3a', marginBottom: '4px' }}>No payments found</h3>
            <p>{searchTerm ? 'Try adjusting your search or filters.' : 'No payment records yet.'}</p>
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
                    Amount
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Method
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </th>
                  <th style={{ padding: isMobile ? '10px 12px' : '14px 18px', textAlign: 'left', color: '#6a8bb0', fontWeight: '600', fontSize: isMobile ? '10px' : '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHires.map(hire => {
                  const statusStyle = getPaymentStatusColor(hire.paymentStatus);
                  return (
                    <tr key={hire.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', fontWeight: '500', color: '#1a2a3a' }}>
                        {hire.worker?.user?.fullName || 'N/A'}
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', fontWeight: '600', color: '#1a2a3a' }}>
                        EGP {hire.totalDue?.toFixed(0)}
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', color: '#6a8bb0' }}>
                        {getMethodLabel(hire.paymentMethod)}
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: '600',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}>
                          {getPaymentStatusLabel(hire.paymentStatus)}
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '10px 12px' : '12px 18px', color: '#6a8bb0', fontSize: isMobile ? '10px' : '12px' }}>
                        {hire.paymentReference}
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