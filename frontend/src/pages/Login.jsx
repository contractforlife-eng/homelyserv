import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('sara@email.com');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Language */}
        <div className="text-right mb-2">
          <button className="text-sm text-gray-500 hover:text-red-600 transition">
            Language
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">HomelyServ</h1>
        </div>

        {/* Sign In Text */}
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
          Sign in to your account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium text-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account? <Link to="/register" className="text-red-600 font-medium hover:underline">Create one</Link>
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <button className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
            <span className="text-red-500 font-bold text-lg">G</span>
          </button>
          <button className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">f</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;