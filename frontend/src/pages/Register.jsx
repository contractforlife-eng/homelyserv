import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'worker',
    phone: '',
    city: '',
    country: '',
    category: '',
    experience: '',
    expectedSalary: '',
    availability: '',
    workType: 'full-time',
    bio: '',
    idType: 'national',
    idNumber: ''
  });

  const categories = [
    'Babysitter', 'Adult Caregiver', 'Driver', 'Cook', 
    'House Manager', 'Gardener', 'Nurse', 'Bodyguard', 'Security Guard'
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
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
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">♥</span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-red-600 tracking-tight">Homey</span>
              <span className="text-3xl font-bold text-gray-800 tracking-tight">Serv</span>
            </div>
            <p className="text-xs text-gray-500 font-medium tracking-wider mt-1">YOUR HOME, OUR PRIORITY</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">REGISTER</h2>
        <p className="text-gray-500 text-center text-sm mb-6">Join HomelyServ today</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">FULL NAME</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">PASSWORD</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Role */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">ROLE</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
            >
              <option value="worker">Service Provider (Job Seeker)</option>
              <option value="employer">Employer</option>
            </select>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">PHONE NUMBER</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your phone number"
              required
            />
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">COUNTRY</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your country"
            />
          </div>

          {/* City */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">CITY</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder="Enter your city"
            />
          </div>

          {/* Category (for workers) */}
          {formData.role === 'worker' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">CATEGORY</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">YEARS OF EXPERIENCE</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  placeholder="Years of experience"
                />
              </div>

              {/* Expected Salary */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">EXPECTED SALARY (EGP/month)</label>
                <input
                  type="number"
                  value={formData.expectedSalary}
                  onChange={(e) => setFormData({...formData, expectedSalary: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  placeholder="Expected salary"
                />
              </div>

              {/* Availability */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">AVAILABILITY</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="available">Available</option>
                  <option value="part-time">Part-Time</option>
                  <option value="full-time">Full-Time</option>
                  <option value="not-available">Not Available</option>
                </select>
              </div>

              {/* Work Type */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">WORK TYPE</label>
                <select
                  value={formData.workType}
                  onChange={(e) => setFormData({...formData, workType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">BIO / DESCRIPTION</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Tell employers about yourself..."
                />
              </div>
            </>
          )}

          {/* ID Type */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">ID TYPE</label>
            <select
              value={formData.idType}
              onChange={(e) => setFormData({...formData, idType: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
            >
              <option value="national">National ID Card</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          {/* ID Number */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">ID NUMBER</label>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
              placeholder={formData.idType === 'national' ? 'Enter your National ID number' : 'Enter your Passport number'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;