import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { countries } from '../utils/countries';

const CATEGORIES = [
  'Nanny', 
  'Baby-Sitter', 
  'Elderly Caregiver',
  'Driver', 
  'Cook', 
  'House Manager', 
  'Gardener', 
  'Nurse',
  'Security Guard', 
  'Bodyguard'
];

const SKILLS = [
  'First Aid', 'Newborn Care', 'Cooking', 'Driving License',
  'Medical Training', 'Bilingual (AR/EN)', 'Educational Games',
  'Meal Prep', 'Elderly Care', 'Sleep Training', 'Gardening', 'Housekeeping',
  'Security Training', 'Surveillance', 'Self Defense', 'Risk Assessment',
  'Firearms Training', 'First Responder', 'Crowd Control', 'Close Protection'
];

export default function WorkerProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category: 'Nanny',
    experienceYears: '',
    expectedSalary: '',
    availability: 'available',
    workType: 'full-time',
    country: '',
    city: '',
    bioEn: '',
    bioAr: '',
    skills: [],
    profilePhotoUrl: ''
  });

  useEffect(() => {
    api.get('/workers/me').then(res => {
      if (res.data) {
        setForm(f => ({
          ...f,
          ...res.data,
          country: res.data.user?.city || '',
          city: res.data.user?.city || ''
        }));
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    setForm({
      ...form,
      country: countryName,
      city: ''
    });
  };

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill]
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/workers/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm({ ...form, profilePhotoUrl: res.data.url });
      toast.success('Photo uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload photo');
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/workers/profile', {
        ...form,
        city: form.city || form.country
      });
      toast.success('Profile saved!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to save profile');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>My Worker Profile</h1>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <form onSubmit={handleSubmit}>

          {/* Profile Photo */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Profile Photo</h3>
            
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#F5F5F5', margin: '0 auto 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #C0392B' }}>
              {form.profilePhotoUrl ? (
                <img src={form.profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px', color: '#888' }}>📷</span>
              )}
            </div>

            <label style={{ display: 'inline-block', padding: '8px 20px', background: '#C0392B', color: '#fff', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
              {uploading ? 'Uploading...' : '📸 Upload Photo'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>JPG, PNG · Max 5MB</p>
          </div>

          {/* Category */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Service category</h3>
            <select name="category" value={form.category} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Experience & Salary */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Experience & salary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Years of experience</label>
                <input name="experienceYears" type="number" value={form.experienceYears} onChange={handleChange} placeholder="5"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Expected salary (EGP/mo)</label>
                <input name="expectedSalary" type="number" value={form.expectedSalary} onChange={handleChange} placeholder="5000"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Availability & work type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Availability</label>
                <select name="availability" value={form.availability} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Not available</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Work type</label>
                <select name="workType" value={form.workType} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="live-in">Live-in</option>
                  <option value="live-out">Live-out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Location</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Country</label>
              <select 
                name="country" 
                value={form.country} 
                onChange={handleCountryChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {form.country && (
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>City</label>
                <select 
                  name="city" 
                  value={form.city} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="">Select your city</option>
                  {countries.find(c => c.name === form.country)?.cities.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Skills */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SKILLS.map(skill => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    background: form.skills.includes(skill) ? '#C0392B' : '#F5F5F5',
                    color: form.skills.includes(skill) ? '#fff' : '#444',
                    border: form.skills.includes(skill) ? '1px solid #C0392B' : '1px solid #E0E0E0'
                  }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444', marginBottom: '12px' }}>About you</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Bio in English</label>
              <textarea name="bioEn" value={form.bioEn} onChange={handleChange} rows={3} placeholder="Tell employers about yourself..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Bio in Arabic</label>
              <textarea name="bioAr" value={form.bioAr} onChange={handleChange} rows={3} placeholder="اكتب نبذة عن نفسك..." dir="rtl"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}