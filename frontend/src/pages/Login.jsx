import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';
import SocialLogin from '../components/SocialLogin';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

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
          <p className="auth-subtitle">{t('sign_in_to_account')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            {loading ? 'Signing in...' : t('login')}
          </button>
        </form>

        <SocialLogin />

        <p className="auth-footer">
          {t('dont_have_account')} <Link to="/register">{t('create_one')}</Link>
        </p>
      </div>
    </div>
  );
}