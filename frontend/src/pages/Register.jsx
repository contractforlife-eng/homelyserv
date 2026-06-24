import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';
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
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-language">
          <LanguageSwitcher />
        </div>

        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <Logo />
          </div>
          <p className="auth-subtitle">{t('create_account')}</p>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'WORKER' })}
            className={`role-btn ${form.role === 'WORKER' ? 'active' : ''}`}
          >
            {t('worker')}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'EMPLOYER' })}
            className={`role-btn ${form.role === 'EMPLOYER' ? 'active' : ''}`}
          >
            {t('employer')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">{t('full_name')}</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              placeholder="Sara Ahmed"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="sara@email.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('phone')}</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+20 100 000 0000"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('country')}</label>
            <select
              name="country"
              value={form.country}
              onChange={handleCountryChange}
              className="form-input"
            >
              <option value="">{t('select_country')}</option>
              {countries.map(country => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCountry && (
            <div className="form-group">
              <label className="form-label">{t('city')}</label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">{t('select_city')}</option>
                {selectedCountry.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-full">
            {loading ? 'Creating account...' : t('register')}
          </button>
        </form>

        <p className="auth-footer">
          {t('already_have_account')} <Link to="/login">{t('sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}