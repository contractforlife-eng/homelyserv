import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';

export default function EmployerProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    companyName: '',
    companyLogo: '',
    companyPhotos: [],
    companyWebsite: '',
    companySize: '',
    industry: '',
    description: '',
    address: ''
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/employer/me');
      if (res.data) {
        setForm({
          ...res.data,
          companyPhotos: res.data.companyPhotos || []
        });
        setPhotos(res.data.companyPhotos || []);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

      const res = await api.post('/employer/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const photoUrl = res.data.url;
      const updatedPhotos = [...photos, photoUrl];
      setPhotos(updatedPhotos);
      setForm(prev => ({
        ...prev,
        companyPhotos: updatedPhotos
      }));

      toast.success('Photo uploaded successfully!');
      await fetchProfile();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo');
    }
    setUploading(false);
  };

  const removePhoto = async (index) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    setForm(prev => ({
      ...prev,
      companyPhotos: updatedPhotos
    }));
    await handleSubmit(true);
  };

  const handleSubmit = async (skipNavigate = false) => {
    setLoading(true);
    try {
      await api.post('/employer/profile', {
        ...form,
        companyPhotos: photos
      });
      toast.success('Profile saved successfully!');
      if (!skipNavigate) {
        navigate('/');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save profile');
    }
    setLoading(false);
  };

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  const industries = [
    'Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing',
    'Retail', 'Real Estate', 'Construction', 'Transportation', 'Hospitality',
    'Consulting', 'Non-Profit', 'Government', 'Other'
  ];

  return (
    <Layout activeTab="profile">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
          <h1 style={{
            fontSize: isMobile ? '22px' : '24px',
            fontWeight: '700',
            color: '#1a3a1a',
            marginBottom: '4px'
          }}>
            Company Profile
          </h1>
          <p style={{ color: '#5a7a5a', fontSize: isMobile ? '13px' : '14px' }}>
            Update your company information
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Company Logo */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid #d4e8d4',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Company Logo
            </h3>
            <div style={{
              width: isMobile ? '100px' : '120px',
              height: isMobile ? '100px' : '120px',
              borderRadius: '50%',
              background: '#f0f7f0',
              margin: '0 auto 12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #2e7d32',
            }}>
              {form.companyLogo ? (
                <img
                  src={form.companyLogo}
                  alt="Company Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span style="font-size:48px;color:#8aaa8a;">🏢</span>';
                  }}
                />
              ) : (
                <span style={{ fontSize: '48px', color: '#8aaa8a' }}>🏢</span>
              )}
            </div>
            <label style={{
              display: 'inline-block',
              padding: isMobile ? '8px 18px' : '8px 24px',
              background: '#2e7d32',
              color: '#fff',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '600',
            }}>
              {uploading ? 'Uploading...' : '📸 Upload Logo'}
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

          {/* Company Photos */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Company Photos
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '12px',
              marginBottom: '12px',
            }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={photo}
                    alt={`Company photo ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #d4e8d4',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#c62828',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '80px',
                  border: '2px dashed #d4e8d4',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: '#f8fbf8',
                  color: '#8aaa8a',
                  fontSize: '24px',
                }}>
                  +
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#8aaa8a' }}>
              Upload up to 6 company photos (JPG, PNG · Max 5MB each)
            </p>
          </div>

          {/* Company Details */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              Company Details
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className="form-input"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Company Website
              </label>
              <input
                name="companyWebsite"
                value={form.companyWebsite}
                onChange={handleChange}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Company Size
                </label>
                <select
                  name="companySize"
                  value={form.companySize}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                  Industry
                </label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>
                Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Company address"
                className="form-input"
              />
            </div>
          </div>

          {/* Description */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            border: '1px solid #d4e8d4',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
              About the Company
            </h3>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell workers about your company..."
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-full"
            style={{
              padding: isMobile ? '12px' : '14px',
              fontSize: isMobile ? '15px' : '16px',
              borderRadius: '12px'
            }}
          >
            {loading ? 'Saving...' : '💾 Save Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}