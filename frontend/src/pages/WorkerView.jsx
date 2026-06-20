import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const COLORS = ['#C0392B', '#2C3E50', '#8E44AD', '#16A085', '#E67E22', '#2980B9', '#27AE60', '#D35400'];

export default function WorkerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState({ agreedSalary: '', startDate: '' });

  useEffect(() => {
    api.get(`/workers/${id}`).then(res => {
      setWorker(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

  const sendOffer = async () => {
    if (!offer.agreedSalary) return toast.error('Please enter the agreed salary');
    setOffering(true);
    try {
      await api.post('/hires', {
        workerId: id,
        agreedSalary: parseFloat(offer.agreedSalary),
        startDate: offer.startDate
      });
      toast.success('Job offer sent successfully!');
      setShowOffer(false);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    }
    setOffering(false);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>;
  if (!worker) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Worker not found</div>;

  const commission = (parseFloat(offer.agreedSalary) * 0.065) || 0;
  const vat = commission * 0.14;
  const total = commission + vat;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Worker Profile</h1>
      </div>

      {/* Profile header */}
      <div style={{ background: '#C0392B', padding: '0 20px 24px', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '24px', fontWeight: '700', color: getColor(worker.user?.fullName) }}>
          {getInitials(worker.user?.fullName)}
        </div>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{worker.user?.fullName}</div>
        <div style={{ color: '#ffcdd2', fontSize: '13px', margin: '4px 0 10px' }}>{worker.category}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', padding: '3px 12px', borderRadius: '20px' }}>
            ★ {worker.ratingAvg > 0 ? worker.ratingAvg.toFixed(1) : 'New'} · {worker.ratingCount} reviews
          </span>
          <span style={{ background: worker.availability === 'available' ? 'rgba(39,174,96,0.3)' : 'rgba(230,126,34,0.3)', color: '#fff', fontSize: '12px', padding: '3px 12px', borderRadius: '20px' }}>
            ● {worker.availability}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {/* Info cards */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Experience</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{worker.experienceYears} years</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Expected salary</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#C0392B' }}>EGP {worker.expectedSalary?.toLocaleString()}/mo</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Location</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{worker.user?.city || 'Not specified'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Work type</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{worker.workType}</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {worker.skills?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '10px' }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {worker.skills.map(skill => (
                <span key={skill} style={{ background: '#FDECEA', color: '#C0392B', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: '500' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {(worker.bioEn || worker.bioAr) && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>About</div>
            {worker.bioEn && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '8px' }}>{worker.bioEn}</p>}
            {worker.bioAr && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', direction: 'rtl' }}>{worker.bioAr}</p>}
          </div>
        )}

        {/* Reviews */}
        {worker.reviews?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '10px' }}>Reviews</div>
            {worker.reviews.map(review => (
              <div key={review.id} style={{ borderBottom: '1px solid #E0E0E0', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{review.employer?.fullName}</span>
                  <span style={{ color: '#F39C12', fontSize: '12px' }}>{'★'.repeat(review.rating)}</span>
                </div>
                {review.comment && <p style={{ fontSize: '12px', color: '#666' }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons - only for employers */}
        {user?.role === 'EMPLOYER' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={() => setShowOffer(true)}
              style={{ flex: 1, padding: '13px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              Send Job Offer
            </button>
          </div>
        )}
      </div>

      {/* Job Offer Modal */}
      {showOffer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Send Job Offer to {worker.user?.fullName}</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Agreed monthly salary (EGP)</label>
              <input type="number" value={offer.agreedSalary} onChange={e => setOffer({...offer, agreedSalary: e.target.value})}
                placeholder="e.g. 5000"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Start date</label>
              <input type="date" value={offer.startDate} onChange={e => setOffer({...offer, startDate: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            {offer.agreedSalary > 0 && (
              <div style={{ background: '#FDECEA', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Commission breakdown</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                  <span>Commission (6.5%)</span><span>EGP {commission.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                  <span>VAT (14%)</span><span>EGP {vat.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#C0392B', marginTop: '6px', borderTop: '1px solid #f5c6c6', paddingTop: '6px' }}>
                  <span>Total due</span><span>EGP {total.toFixed(0)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowOffer(false)}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E0E0E0', background: '#fff', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={sendOffer} disabled={offering}
                style={{ flex: 1, padding: '12px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {offering ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}