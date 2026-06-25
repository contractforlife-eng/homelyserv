import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function MyHires() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchHires();
  }, []);

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hires/my');
      setHires(res.data || []);
    } catch (err) {
      console.error('Failed to fetch hires:', err);
      toast.error('Failed to load hires');
    }
    setLoading(false);
  };

  const handleAccept = async (hireId) => {
    setProcessingId(hireId);
    try {
      await api.put(`/hires/${hireId}/accept`);
      toast.success('Offer accepted! Please complete payment to reveal contact details.');
      fetchHires();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept offer');
    }
    setProcessingId(null);
  };

  const handleDecline = async (hireId) => {
    setProcessingId(hireId);
    if (!window.confirm('Are you sure you want to decline this offer?')) {
      setProcessingId(null);
      return;
    }
    try {
      await api.put(`/hires/${hireId}/decline`);
      toast.success('Offer declined');
      fetchHires();
    } catch (err) {
      toast.error('Failed to decline offer');
    }
    setProcessingId(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#2e7d32';
      case 'accepted': return '#1976d2';
      case 'pending': return '#f39c12';
      case 'rejected': return '#c62828';
      case 'completed': return '#6c757d';
      default: return '#5a7a5a';
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

  const filteredHires = activeTab === 'all' 
    ? hires 
    : hires.filter(h => h.status === activeTab);

  const stats = {
    total: hires.length,
    pending: hires.filter(h => h.status === 'pending').length,
    accepted: hires.filter(h => h.status === 'accepted').length,
    active: hires.filter(h => h.status === 'active').length,
    rejected: hires.filter(h => h.status === 'rejected').length,
  };

  const tabs = ['all', 'pending', 'accepted', 'active', 'rejected'];

  // Worker view - My Offers
  const renderWorkerView = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1a3a1a',
          marginBottom: '4px',
        }}>
          My Offers
        </h1>
        <p style={{ 
          color: '#5a7a5a', 
          fontSize: '14px',
        }}>
          Job offers from employers
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Offers</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f39c12' }}>{stats.pending}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976d2' }}>{stats.accepted}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Accepted</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #d4e8d4',
        marginBottom: '20px',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: activeTab === tab ? '#2e7d32' : 'transparent',
              color: activeTab === tab ? '#fff' : '#5a7a5a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Loading offers...</div>
      ) : filteredHires.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No offers found</h3>
          <p style={{ color: '#5a7a5a' }}>You don't have any {activeTab !== 'all' ? activeTab : ''} offers yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHires.map((hire) => (
            <div
              key={hire.id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #d4e8d4',
                borderLeft: `4px solid ${getStatusColor(hire.status)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {/* Left - Offer Details */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a3a1a' }}>
                    {hire.employer?.fullName}
                  </span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: getStatusColor(hire.status) + '20',
                    color: getStatusColor(hire.status),
                  }}>
                    {getStatusIcon(hire.status)} {getStatusLabel(hire.status)}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>
                  📍 {hire.employer?.city || 'Location not specified'}
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                  💰 EGP {hire.agreedSalary} · 📅 {hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Start date not set'}
                </div>

                {hire.paymentStatus === 'confirmed' && hire.contactShared && (
                  <div style={{ fontSize: '13px', color: '#2e7d32', marginTop: '4px' }}>
                    📞 {hire.employer?.phone || 'Phone not available'}
                  </div>
                )}
              </div>

              {/* Right - Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hire.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(hire.id)}
                      disabled={processingId === hire.id}
                      style={{
                        padding: '8px 20px',
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      {processingId === hire.id ? 'Processing...' : '✅ Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(hire.id)}
                      disabled={processingId === hire.id}
                      style={{
                        padding: '8px 20px',
                        background: '#c62828',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      ❌ Decline
                    </button>
                  </>
                )}

                {hire.status === 'accepted' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#1976d2',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ⏳ Waiting for payment
                  </span>
                )}

                {hire.status === 'active' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#2e7d32',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ✅ Active - Contact shared
                  </span>
                )}

                {hire.status === 'rejected' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#c62828',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ❌ Declined
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Employer view - My Hires
  const renderEmployerView = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1a3a1a',
          marginBottom: '4px',
        }}>
          My Hires
        </h1>
        <p style={{ 
          color: '#5a7a5a', 
          fontSize: '14px',
        }}>
          Applications you've sent to workers
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Applications</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f39c12' }}>{stats.pending}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending Response</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976d2' }}>{stats.accepted}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Accepted</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #d4e8d4',
        marginBottom: '20px',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: activeTab === tab ? '#2e7d32' : 'transparent',
              color: activeTab === tab ? '#fff' : '#5a7a5a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Hires List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Loading hires...</div>
      ) : filteredHires.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No applications found</h3>
          <p style={{ color: '#5a7a5a' }}>You haven't sent any {activeTab !== 'all' ? activeTab : ''} applications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHires.map((hire) => (
            <div
              key={hire.id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #d4e8d4',
                borderLeft: `4px solid ${getStatusColor(hire.status)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a3a1a' }}>
                    {hire.worker?.user?.fullName}
                  </span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: getStatusColor(hire.status) + '20',
                    color: getStatusColor(hire.status),
                  }}>
                    {getStatusIcon(hire.status)} {getStatusLabel(hire.status)}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>
                  📍 {hire.worker?.user?.city || 'Location not specified'}
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                  💰 EGP {hire.agreedSalary} · 📅 {hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Start date not set'}
                </div>

                {hire.paymentStatus === 'confirmed' && hire.contactShared && (
                  <div style={{ fontSize: '13px', color: '#2e7d32', marginTop: '4px' }}>
                    📞 {hire.worker?.user?.phone || 'Phone not available'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hire.status === 'pending' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#f39c12',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ⏳ Waiting for worker
                  </span>
                )}

                {hire.status === 'accepted' && (
                  <>
                    <span style={{
                      padding: '6px 16px',
                      background: '#1976d2',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      ✅ Accepted - Pay commission
                    </span>
                    <button
                      onClick={() => navigate(`/payment/${hire.id}`)}
                      style={{
                        padding: '8px 20px',
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      💳 Pay Commission
                    </button>
                  </>
                )}

                {hire.status === 'active' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#2e7d32',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ✅ Active - Contact shared
                  </span>
                )}

                {hire.status === 'rejected' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#c62828',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ❌ Declined by worker
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Admin view - All Hires
  const renderAdminView = () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#1a3a1a',
          marginBottom: '4px',
        }}>
          All Hires
        </h1>
        <p style={{ 
          color: '#5a7a5a', 
          fontSize: '14px',
        }}>
          Overview of all hiring activity
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a3a1a' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Hires</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f39c12' }}>{stats.pending}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1976d2' }}>{stats.accepted}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Accepted</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2e7d32' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #d4e8d4',
        marginBottom: '20px',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: activeTab === tab ? '#2e7d32' : 'transparent',
              color: activeTab === tab ? '#fff' : '#5a7a5a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* All Hires List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Loading hires...</div>
      ) : filteredHires.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #d4e8d4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No hires found</h3>
          <p style={{ color: '#5a7a5a' }}>No hiring activity recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHires.map((hire) => (
            <div
              key={hire.id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #d4e8d4',
                borderLeft: `4px solid ${getStatusColor(hire.status)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a3a1a' }}>
                    {hire.worker?.user?.fullName}
                  </span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: getStatusColor(hire.status) + '20',
                    color: getStatusColor(hire.status),
                  }}>
                    {getStatusIcon(hire.status)} {getStatusLabel(hire.status)}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a', marginBottom: '4px' }}>
                  👤 Employer: {hire.employer?.fullName}
                </div>

                <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                  💰 Salary: EGP {hire.agreedSalary} · 📅 Start: {hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Not set'}
                </div>

                <div style={{ fontSize: '13px', color: '#f39c12', marginTop: '4px' }}>
                  📊 Commission: EGP {hire.commissionAmount?.toFixed(2)} + VAT: EGP {hire.vatAmount?.toFixed(2)} = Total: EGP {hire.totalDue?.toFixed(2)}
                </div>

                {hire.paymentStatus === 'pending' && (
                  <div style={{ fontSize: '13px', color: '#c62828', marginTop: '4px' }}>
                    ⏳ Payment pending
                  </div>
                )}

                {hire.paymentStatus === 'confirmed' && (
                  <div style={{ fontSize: '13px', color: '#2e7d32', marginTop: '4px' }}>
                    ✅ Payment confirmed
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hire.status === 'pending' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#f39c12',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    ⏳ Pending
                  </span>
                )}

                {hire.status === 'accepted' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#1976d2',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    ✅ Accepted
                  </span>
                )}

                {hire.status === 'active' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#2e7d32',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    ✅ Active
                  </span>
                )}

                {hire.status === 'rejected' && (
                  <span style={{
                    padding: '6px 16px',
                    background: '#c62828',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    ❌ Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout activeTab="hires">
      {user?.role === 'WORKER' && renderWorkerView()}
      {user?.role === 'EMPLOYER' && renderEmployerView()}
      {user?.role === 'ADMIN' && renderAdminView()}
    </Layout>
  );
}