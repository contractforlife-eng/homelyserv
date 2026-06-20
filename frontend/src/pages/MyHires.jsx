import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

export default function MyHires() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHires();
  }, []);

  const fetchHires = async () => {
    try {
      const res = await api.get('/hires/my');
      setHires(res.data);
    } catch (err) {
      console.error('Failed to fetch hires:', err);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'offer_sent': return '#F39C12';
      case 'payment_pending': return '#E67E22';
      case 'active': return '#27AE60';
      case 'completed': return '#2C3E50';
      case 'cancelled': return '#E74C3C';
      default: return '#888';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'offer_sent': return 'Offer Sent';
      case 'payment_pending': return 'Payment Pending';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#E67E22';
      case 'confirmed': return '#27AE60';
      case 'rejected': return '#E74C3C';
      default: return '#888';
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading your hires...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>My Hires</h1>
        <span style={{ marginLeft: 'auto', color: '#ffcdd2', fontSize: '13px' }}>{hires.length} hires</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {hires.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ color: '#1A1A1A', marginBottom: '8px' }}>No hires yet</h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              {user?.role === 'EMPLOYER' 
                ? 'Search for workers and send job offers to get started.' 
                : 'You haven\'t received any job offers yet.'}
            </p>
            {user?.role === 'EMPLOYER' && (
              <button onClick={() => navigate('/search')}
                style={{ marginTop: '16px', padding: '10px 24px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Find Workers
              </button>
            )}
          </div>
        ) : (
          hires.map((hire) => (
            <div key={hire.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #E0E0E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1A1A1A', fontSize: '15px' }}>
                    {hire.worker?.user?.fullName || hire.employer?.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {hire.worker?.category || 'Worker'} · {hire.worker?.user?.city || 'Location not set'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: getStatusColor(hire.status),
                    background: `${getStatusColor(hire.status)}15`,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    ● {getStatusLabel(hire.status)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Agreed Salary</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>EGP {hire.agreedSalary?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#888' }}>Commission</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#C0392B' }}>EGP {hire.totalDue?.toFixed(0)}</div>
                </div>
              </div>

              {hire.paymentStatus && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F5F5F5' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#888' }}>Payment</div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500',
                      color: getPaymentStatusColor(hire.paymentStatus)
                    }}>
                      {hire.paymentStatus === 'pending' ? '⏳ Awaiting verification' :
                       hire.paymentStatus === 'confirmed' ? '✅ Verified' :
                       hire.paymentStatus === 'rejected' ? '❌ Rejected' : 'Not started'}
                    </div>
                  </div>
                  {hire.paymentReference && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#888' }}>Reference</div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1A1A1A' }}>{hire.paymentReference}</div>
                    </div>
                  )}
                </div>
              )}

              {hire.status === 'offer_sent' && user?.role === 'EMPLOYER' && (
                <button 
                  onClick={() => navigate(`/payment/${hire.id}`)}
                  style={{ 
                    width: '100%', 
                    marginTop: '12px', 
                    padding: '10px', 
                    background: '#C0392B', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                  Pay Commission (EGP {hire.totalDue?.toFixed(0)})
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}