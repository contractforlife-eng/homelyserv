import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { countries } from '../utils/countries';

const CATEGORIES = [
  'All', 'Nanny', 'Baby-Sitter', 'Elderly Caregiver',
  'Driver', 'Cook', 'House Manager', 'Gardener', 'Nurse',
  'Security Guard', 'Bodyguard'
];

const COLORS = ['#C0392B', '#2C3E50', '#8E44AD', '#16A085', '#E67E22', '#2980B9', '#27AE60', '#D35400'];

export default function Search() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, [category, availability]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (city) params.city = city;
      if (availability) params.availability = availability;
      const res = await api.get('/workers/search', { params });
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    setCountry(countryName);
    setCity('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
          <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Find Workers</h1>
        </div>
        <span style={{ color: '#ffcdd2', fontSize: '13px' }}>{user?.fullName}</span>
      </div>

      {/* Search bar */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #E0E0E0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={country}
          onChange={handleCountryChange}
          style={{ flex: 2, padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '120px' }}
        >
          <option value="">All Countries</option>
          {countries.map(country => (
            <option key={country.code} value={country.name}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>

        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', minWidth: '120px' }}
          disabled={!country}
        >
          <option value="">All Cities</option>
          {country && countries.find(c => c.name === country)?.cities.map(city => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <button onClick={fetchWorkers}
          style={{ padding: '9px 18px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          Search
        </button>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              background: category === cat ? '#C0392B' : '#fff',
              color: category === cat ? '#fff' : '#444',
              border: category === cat ? '1px solid #C0392B' : '1px solid #E0E0E0'
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Availability filter */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>Availability:</span>
        {['', 'available', 'busy'].map(a => (
          <button key={a} onClick={() => setAvailability(a)}
            style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              background: availability === a ? '#1A1A1A' : '#fff',
              color: availability === a ? '#fff' : '#444',
              border: availability === a ? '1px solid #1A1A1A' : '1px solid #E0E0E0'
            }}>
            {a === '' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading workers...</div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No workers found. Try different filters.</div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{workers.length} workers found</div>
            {workers.map(worker => (
              <div key={worker.id} onClick={() => navigate(`/worker/${worker.id}`)}
                style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '10px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: getColor(worker.user?.fullName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                  {getInitials(worker.user?.fullName)}
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1A1A1A', fontSize: '15px' }}>{worker.user?.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#888', margin: '2px 0 6px' }}>
                    {worker.category} · {worker.experienceYears} yrs exp · {worker.user?.city}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {worker.skills?.slice(0, 3).map(skill => (
                      <span key={skill} style={{ background: '#F5F5F5', color: '#444', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{skill}</span>
                    ))}
                  </div>
                </div>
                {/* Right */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: '700', color: '#C0392B', fontSize: '14px' }}>EGP {worker.expectedSalary?.toLocaleString()}/mo</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: worker.availability === 'available' ? '#27AE60' : '#E67E22', fontWeight: '500' }}>
                    ● {worker.availability}
                  </div>
                  {worker.ratingAvg > 0 && (
                    <div style={{ fontSize: '11px', color: '#F39C12', marginTop: '2px' }}>★ {worker.ratingAvg.toFixed(1)}</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}