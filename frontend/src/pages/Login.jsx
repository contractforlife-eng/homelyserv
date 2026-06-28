import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveUser, clearUser } from '../utils/userHelpers';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Clear old data
        clearUser();
        
        // Save user with image
        localStorage.setItem('token', response.data.token);
        saveUser(response.data.user);
        
        // Redirect based on role
        const userRole = response.data.user.role;
        if (userRole === 'ADMIN') {
          window.location.href = '/admin';
        } else if (userRole === 'EMPLOYER') {
          window.location.href = '/employer-dashboard';
        } else {
          window.location.href = '/worker-dashboard';
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Language Button */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowLanguages(!showLanguages)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <span>🌐</span>
            <span>Language</span>
            <span className={`transform transition-transform ${showLanguages ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {/* Language Dropdown */}
          {showLanguages && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm"
                  onClick={() => {
                    // Handle language change here
                    setShowLanguages(false);
                  }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-gray-700">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-14 h-14"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">♥</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-bold text-red-600 tracking-tight">Homey</span>
              <span className="text-4xl font-bold text-gray-800 tracking-tight">Serv</span>
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="w-10 h-0.5 bg-red-600"></div>
              <p className="text-xs text-gray-500 font-medium tracking-wider">YOUR HOME, OUR PRIORITY</p>
              <div className="w-10 h-0.5 bg-red-600"></div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">SIGN IN</h2>
        <p className="text-gray-500 text-center text-sm mb-6">Access your HomelyServ account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-400">OR CONTINUE WITH</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <button className="w-full border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-gray-700 font-medium">Google</span>
        </button>

        <div className="flex justify-center gap-4 mt-6">
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-blue-600 font-semibold text-sm">Facebook</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-blue-400 font-semibold text-sm">Twitter</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-blue-500 font-semibold text-sm">Telegram</button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-green-600 font-semibold text-sm">Signal</button>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account? <Link to="/register" className="text-red-600 font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;