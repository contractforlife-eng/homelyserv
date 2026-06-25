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

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#2e7d32';
      case 'pending': return '#f39c12';
      case 'completed': return '#1976d2';
      case 'cancelled': return '#c62828';
      default: return '#5a7a5a';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const filteredHires = activeTab === 'all' 
    ? hires 
    : hires.filter(h => h.status === activeTab);

  const stats = {
    total: hires.length,
    active: hires.filter(h => h.status === 'active').length,
    pending: hires.filter(h => h.paymentStatus === 'pending').length,
    completed: hires.filter(h => h.status === 'completed').length,
  };

  const tabs = ['all', 'active', 'pending', 'completed', 'cancelled'];

  return (
    <Layout activeTab="hires">
      <div className="page-header">
        <h1 className="page-title">My Hires</h1>
        <p className="page-subtitle">View all your hiring activity and job offers</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2e7d32' }}>{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f39c12' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1976d2' }}>{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="nav-tabs" style={{ borderBottom: '2px solid #d4e8d4', marginBottom: '20px', padding: '0 0 12px 0' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Loading hires...</div>
      ) : filteredHires.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: '#1a3a1a', marginBottom: '4px' }}>No hires found</h3>
          <p style={{ color: '#5a7a5a' }}>You don't have any {activeTab !== 'all' ? activeTab : ''} hires yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHires.map((hire) => (
            <div key={hire.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a3a1a' }}>
                    {user?.role === 'WORKER' ? hire.employer?.fullName : hire.worker?.user?.fullName}
                  </span>
                  <span style={{
                    padding: '2px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: getStatusColor(hire.status) + '20',
                    color: getStatusColor(hire.status),
                  }}>
                    {getStatusLabel(hire.status)}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                  {user?.role === 'WORKER' ? 'Employer' : 'Worker'} · 
                  EGP {hire.agreedSalary} · 
                  {hire.worker?.category || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#8aaa8a', marginTop: '4px' }}>
                  Reference: {hire.paymentReference} · 
                  {hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Start date not set'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#5a7a5a' }}>
                  Payment: <span style={{ fontWeight: '600', color: hire.paymentStatus === 'confirmed' ? '#2e7d32' : '#f39c12' }}>
                    {hire.paymentStatus || 'Not started'}
                  </span>
                </div>
                {hire.paymentStatus === 'pending' && hire.paymentProofUrl && (
                  <a href={hire.paymentProofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2e7d32', textDecoration: 'none' }}>
                    View Receipt →
                  </a>
                )}
                {hire.status === 'active' && (
                  <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>✅ Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}