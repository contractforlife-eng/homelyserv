import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { countries } from '../utils/countries';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    city: '',
    role: 'WORKER'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register({
      ...form,
      city: form.city
    });
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  const selectedCountry = countries.find(c => c.name === form.country);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <LanguageSwitcher />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#C0392B' }}>{t('app_name')}</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>{t('create_account')}</p>
        </div>

        <div style={{ display: 'flex', border: '1.5px solid #C0392B', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'WORKER' })}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: '500', background: form.role === 'WORKER' ? '#C0392B' : '#fff', color: form.role === 'WORKER' ? '#fff' : '#C0392B' }}
          >
            {t('worker')}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'EMPLOYER' })}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: '500', background: form.role === 'EMPLOYER' ? '#C0392B' : '#fff', color: form.role === 'EMPLOYER' ? '#fff' : '#C0392B' }}
          >
            {t('employer')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('full_name')}</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Sara Ahmed"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('email')}</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="sara@email.com"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('phone')}</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+20 100 000 0000"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('country')}</label>
            <select 
              name="country" 
              value={form.country} 
              onChange={handleCountryChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="">{t('select_country')}</option>
              {countries.map(country => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCountry && selectedCountry.cities && selectedCountry.cities.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('city')}</label>
              <select 
                name="city" 
                value={form.city} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">{t('select_city')}</option>
                {selectedCountry.cities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '5px' }}>{t('password')}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Create a strong password"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? 'Creating account...' : t('create_account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '16px' }}>
          {t('already_have_account')} <Link to="/login" style={{ color: '#C0392B', fontWeight: '500' }}>{t('sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}