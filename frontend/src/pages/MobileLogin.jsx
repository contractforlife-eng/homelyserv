import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Globe, LogIn } from 'lucide-react';

function MobileLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
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
    <div className="login-container">
      <div className="login-card">
        {/* Language */}
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1 text-sm text-gray-500">
            <Globe size={16} /> Language
          </button>
        </div>

        {/* Logo */}
        <div className="login-logo">
          <div className="icon">
            <span className="text-white text-3xl font-bold">H</span>
          </div>
          <h1>HomeyServ</h1>
          <p>YOUR HOME, OUR PRIORITY</p>
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="pl-12"
              required
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-12"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <hr />
          <span>OR CONTINUE WITH</span>
          <hr />
        </div>

        <div className="social-buttons">
          <button>G</button>
          <button>f</button>
          <button>🐦</button>
          <button>📱</button>
        </div>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default MobileLogin;