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
      toast.error('Failed to fetch hires');
    }
    setLoading(false);
  };

  const filteredHires = hires.filter(h =>
    h.worker?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.employer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#5a7a5a' }}>Loading hires...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Hires</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>View and manage all hiring activity</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search hires..."
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
            {filteredHires.length} hires
          </span>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #d4e8d4',
        overflow: 'hidden',
      }}>
        {filteredHires.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#5a7a5a' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '18px', color: '#1a3a1a' }}>No Hires Yet</h3>
            <p style={{ color: '#5a7a5a' }}>No hiring activity has been recorded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fbf8', borderBottom: '2px solid #d4e8d4' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Worker</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Employer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Salary</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Payment</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a5a', fontWeight: '600' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHires.map(hire => (
                  <tr key={hire.id} style={{ borderBottom: '1px solid #f0f7f0' }}>
                    <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>{hire.worker?.user?.fullName || 'N/A'}</td>
                    <td style={{ padding: '10px 16px', color: '#5a7a5a' }}>{hire.employer?.fullName || 'N/A'}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '500', color: '#1a3a1a' }}>EGP {hire.agreedSalary}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: hire.status === 'active' ? '#e8f5e9' : hire.status === 'offer_sent' ? '#fff3e0' : '#fce4ec',
                        color: hire.status === 'active' ? '#1b5e20' : hire.status === 'offer_sent' ? '#bf360c' : '#c62828',
                      }}>
                        {hire.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        color: hire.paymentStatus === 'confirmed' ? '#2e7d32' : hire.paymentStatus === 'pending' ? '#f39c12' : '#5a7a5a',
                        fontWeight: '600',
                      }}>
                        {hire.paymentStatus || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#5a7a5a', fontSize: '12px' }}>
                      {new Date(hire.createdAt).toLocaleDateString()}
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