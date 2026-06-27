import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        const userRole = response.data.user.role;
        if (userRole === 'ADMIN') {
          navigate('/admin');
        } else if (userRole === 'EMPLOYER') {
          navigate('/employer-dashboard');
        } else {
          navigate('/worker-dashboard');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['en', 'ar', 'ru', 'tr', 'fr', 'nl'].map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`px-2 py-1 text-xs rounded transition ${
                  i18n.language === lang
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{t('language')}</span>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">{t('appName')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('signIn')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t('email')}
              required
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t('password')}
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg disabled:opacity-50"
          >
            {loading ? '...' : t('login')}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-400">{t('orSignInWith')}</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-blue-600 font-semibold text-sm">Google</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-blue-600 font-semibold text-sm">Facebook</button>
        </div>

        <p className="text-center text-gray-600 mt-6">
          {t('noAccount')} <Link to="/register" className="text-red-600 font-semibold hover:underline">{t('createOne')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;