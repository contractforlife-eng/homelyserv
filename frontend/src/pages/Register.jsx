import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Globe, 
  AlertCircle, 
  CheckCircle,
  Briefcase,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    role: 'WORKER'
  });
  
  const [errors, setErrors] = useState({});

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      // Simulate API call - DEMO REGISTRATION
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create user data
      const newUser = {
        id: `user_${Date.now()}`,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || '',
        location: formData.location || '',
        createdAt: new Date().toISOString(),
        profileComplete: false
      };

      // Store in localStorage for demo purposes
      const existingUsers = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const userExists = existingUsers.find(u => u.email === formData.email);
      
      if (userExists) {
        setErrors({ general: 'User with this email already exists' });
        setLoading(false);
        return;
      }

      existingUsers.push(newUser);
      localStorage.setItem('homelyserv_users', JSON.stringify(existingUsers));

      setSuccess(true);
      
      // Clear form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: '',
        role: 'WORKER'
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        general: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Demo quick registration (for testing)
  const quickRegister = (role) => {
    setLoading(true);
    setErrors({});
    
    const user = {
      id: `user_${Date.now()}`,
      fullName: role === 'WORKER' ? 'John Worker' : 'Jane Employer',
      email: role === 'WORKER' ? 'worker@demo.com' : 'employer@demo.com',
      role: role,
      phone: '+20123456789',
      location: 'Cairo, Egypt',
      createdAt: new Date().toISOString(),
      profileComplete: false
    };

    const existingUsers = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
    const userExists = existingUsers.find(u => u.email === user.email);
    
    if (!userExists) {
      existingUsers.push(user);
      localStorage.setItem('homelyserv_users', JSON.stringify(existingUsers));
    }

    setSuccess(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-gray-100 transition text-sm"
              >
                <Globe size={15} className="text-gray-500" />
                <span className="text-gray-600 text-xs font-medium">EN</span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setShowLanguages(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="text-center mb-6 pt-2">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
              <span className="text-white text-3xl font-bold">H</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">Create Account</h1>
            <p className="text-gray-500 text-sm">Join HomelyServ today</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Account created successfully! Redirecting to login...
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {errors.general}
            </div>
          )}

          {/* Quick Register Buttons - For testing */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">Quick Test Registration</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickRegister('WORKER')}
                disabled={loading}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition border border-blue-200"
              >
                👤 Create Worker
              </button>
              <button
                onClick={() => quickRegister('EMPLOYER')}
                disabled={loading}
                className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium rounded-lg transition border border-green-200"
              >
                🏢 Create Employer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${
                    errors.fullName ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Enter your location"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Register as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'WORKER' }))}
                  className={`p-3 rounded-xl border-2 transition ${
                    formData.role === 'WORKER'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Briefcase size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'EMPLOYER' }))}
                  className={`p-3 rounded-xl border-2 transition ${
                    formData.role === 'EMPLOYER'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <User size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Employer</span>
                </button>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition`}
                  placeholder="Create a password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <UserPlus size={20} />
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-red-500 hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;