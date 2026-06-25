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
      toast.error('Failed to fetch payments');
    }
    setLoading(false);
  };

  const confirmPayment = async (hireId) => {
    if (!window.confirm('Confirm this payment?')) return;
    try {
      await api.put(`/hires/${hireId}/confirm-payment`);
      toast.success('Payment confirmed!');
      fetchPayments();
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
      fetchPayments();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
  };

  const pendingPayments = hires.filter(h => h.paymentStatus === 'pending');
  const confirmedPayments = hires.filter(h => h.paymentStatus === 'confirmed');
  const totalRevenue = confirmedPayments.reduce((sum, h) => sum + (h.totalDue || 0), 0);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading payments...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Payments</h1>
        <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Manage and confirm payments</p>
      </div>

      {/* Payment Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2e7d32' }}>EGP {totalRevenue.toFixed(0)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a' }}>Pending Payments</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f39c12' }}>{pendingPayments.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '13px', color: '#5a7a5a' }}>Confirmed Payments</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2e7d32' }}>{confirmedPayments.length}</div>
        </div>
      </div>

      {/* Pending Payments Table */}
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>Pending Payments</h3>
      {pendingPayments.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #d4e8d4' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a' }}>No Pending Payments</h3>
          <p style={{ color: '#5a7a5a' }}>All payments have been processed.</p>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #d4e8d4',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Worker</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Method</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Reference</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(hire => (
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
        </div>
      )}
    </AdminLayout>
  );
}