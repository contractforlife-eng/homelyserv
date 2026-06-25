import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { countries } from '../utils/countries';
import Layout from '../components/Layout';

const CATEGORIES = [
  'Nanny', 'Baby-Sitter', 'Elderly Caregiver',
  'Driver', 'Cook', 'House Manager', 'Gardener', 'Nurse',
  'Security Guard', 'Bodyguard'
];

const SKILLS = [
  'First Aid', 'Newborn Care', 'Cooking', 'Driving License',
  'Medical Training', 'Bilingual (AR/EN)', 'Educational Games',
  'Meal Prep', 'Elderly Care', 'Sleep Training', 'Gardening', 'Housekeeping',
  'Security Training', 'Surveillance', 'Self Defense', 'Risk Assessment',
  'Firearms Training', 'First Responder', 'Crowd Control', 'Close Protection',
  'Child Care', 'Pet Care', 'Swimming', 'CPR Certified'
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/workers/me');
      if (res.data) {
        setForm(f => ({
          ...f,
          ...res.data,
          country: res.data.user?.city || '',
          city: res.data.user?.city || ''
        }));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

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

      const photoUrl = res.data.url;
      setForm({ ...form, profilePhotoUrl: photoUrl });
      
      // Save the profile to persist the photo URL
      await api.post('/workers/profile', {
        ...form,
        profilePhotoUrl: photoUrl,
        city: form.city || form.country
      });
      
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
    <Layout activeTab="profile">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a', marginBottom: '4px' }}>
            My Profile
          </h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>
            Update your profile information
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Profile Photo
            </h3>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#f0f7f0',
              margin: '0 auto 12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #2e7d32',
            }}>
              {form.profilePhotoUrl ? (
                <img
                  src={form.profilePhotoUrl}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '48px', color: '#8aaa8a' }}>📷</span>
              )}
            </div>
            <label style={{
              display: 'inline-block',
              padding: '8px 24px',
              background: '#2e7d32',
              color: '#fff',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {uploading ? 'Uploading...' : '📸 Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: '11px', color: '#8aaa8a', marginTop: '8px' }}>
              JPG, PNG · Max 5MB
            </p>
          </div>

          {/* Service & Experience */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Service & Experience
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Service category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Years of experience
                </label>
                <input
                  name="experienceYears"
                  type="number"
                  value={form.experienceYears}
                  onChange={handleChange}
                  placeholder="0"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Expected salary (EGP/mo)
                </label>
                <input
                  name="expectedSalary"
                  type="number"
                  value={form.expectedSalary}
                  onChange={handleChange}
                  placeholder="5000"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Availability & Work Type */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Availability & Work Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Availability
                </label>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Not available</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Work Type
                </label>
                <select
                  name="workType"
                  value={form.workType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="live-in">Live-in</option>
                  <option value="live-out">Live-out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Bio */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Location & Bio
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Country
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleCountryChange}
                className="form-input"
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
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  City
                </label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select your city</option>
                  {countries.find(c => c.name === form.country)?.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Bio in English
              </label>
              <textarea
                name="bioEn"
                value={form.bioEn}
                onChange={handleChange}
                rows={3}
                placeholder="Tell employers about yourself..."
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Bio in Arabic
              </label>
              <textarea
                name="bioAr"
                value={form.bioAr}
                onChange={handleChange}
                rows={3}
                placeholder="اكتب نبذة عن نفسك..."
                dir="rtl"
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Skills */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background: form.skills.includes(skill) ? '#2e7d32' : '#f0f7f0',
                    color: form.skills.includes(skill) ? '#fff' : '#5a7a5a',
                    border: form.skills.includes(skill) ? '1px solid #2e7d32' : '1px solid #d4e8d4',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-full"
            style={{ padding: '14px', fontSize: '16px', borderRadius: '12px' }}
          >
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}