// src/pages/Register.jsx - RED AND WHITE THEME ONLY
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../utils/api";
import useAuthStore from "../store/authStore";
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
  Shield,
  Home,
  Sparkles
} from 'lucide-react';
import SocialLogin from '../components/SocialLogin';
import LegalFooter from '../components/common/LegalFooter';
import CountrySelect from '../components/CountrySelect';
import { getCountryByCode } from '../utils/countries';

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
    countryCode: '',
    countryName: '',
    role: 'WORKER'
  });
  
  const [errors, setErrors] = useState({});

  // Preselect the detected country from the browser locale when
  // available (e.g. "en-EG" -> Egypt). The user can always change
  // it. If no region can be detected, the selector stays empty.
  useEffect(() => {
    try {
      const locales = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

      for (const locale of locales) {
        if (!locale) continue;
        const region = String(locale).split('-')[1]?.trim().toUpperCase();
        if (!region) continue;
        // The standardized list uses "UK" (exceptionally reserved ISO code)
        const match = getCountryByCode(region === 'GB' ? 'UK' : region);
        if (match) {
          setFormData(prev => (
            prev.countryCode
              ? prev
              : { ...prev, countryCode: match.code, countryName: match.name }
          ));
          break;
        }
      }
    } catch {
      // Detection unavailable - leave the selector empty.
    }
  }, []);

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
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle country selection (standardized ISO country only)
  const handleCountryChange = ({ countryCode, countryName }) => {
    setFormData(prev => ({
      ...prev,
      countryCode,
      countryName
    }));
    if (errors.country) {
      setErrors(prev => ({
        ...prev,
        country: ''
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

    if (!formData.countryCode) {
      newErrors.country = 'Please select your country';
    } else if (!getCountryByCode(formData.countryCode)) {
      newErrors.country = 'Please select a valid country';
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
    
    console.log('🔄 Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed:', errors);
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      const response = await api.post("/api/auth/register", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone || "",
        countryCode: formData.countryCode,
        countryName: formData.countryName
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Registration failed");
      }

      console.log("✅ User registered in MongoDB:", response.data.user);

      setSuccess(true);

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        countryCode: "",
        countryName: "",
        role: "WORKER"
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrors({ 
        general: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/30 p-3 sm:p-4 relative overflow-hidden">
      {/* Decorative background elements - Red only */}
      <div className="absolute top-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-red-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-red-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-red-100/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/10 p-6 sm:p-8 border border-red-100/50 transition-all duration-300">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 dark:bg-red-900/30/50 transition text-sm shadow-sm"
              >
                <Globe size={15} className="text-red-600" />
                <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">EN</span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-red-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setShowLanguages(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:bg-red-900/30 transition text-sm"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700 dark:text-gray-300">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo & Brand - Red only */}
          <div className="text-center mb-6 sm:mb-8 pt-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>

              <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30 transform transition-transform hover:scale-105 duration-300">
                <div className="relative">
                  <Shield size={48} sm:size={64} className="text-white/20 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={28} sm:size={36} className="text-white" strokeWidth={2} />
                    <Sparkles size={12} sm:size={16} className="text-red-200 absolute -top-1 -right-1" />
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  <span className="text-red-600">Homely</span><span className="text-emerald-600">Serv</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-1 font-light">Create Your Account</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30/80 backdrop-blur-sm border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Account created successfully! Redirecting to login...
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <div className="relative group">
                <User size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/80 border ${
                    errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <div className="relative group">
                <Mail size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/80 border ${
                    errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number (Optional)</label>
              <div className="relative group">
                <Phone size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Country */}
            <div className="mb-3 sm:mb-4">
              <label htmlFor="country" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
              <CountrySelect
                id="country"
                name="country"
                value={formData.countryCode}
                onChange={handleCountryChange}
                error={!!errors.country}
              />
              {errors.country && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.country}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Register as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'WORKER' }))}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'WORKER'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50 dark:bg-red-900/30/50 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Briefcase size={18} sm:size={20} className="mx-auto mb-1" />
                  <span className="text-xs sm:text-sm font-medium">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'EMPLOYER' }))}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === 'EMPLOYER'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-200 hover:bg-red-50 dark:bg-red-900/30/50 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <User size={18} sm:size={20} className="mx-auto mb-1" />
                  <span className="text-xs sm:text-sm font-medium">Employer</span>
                </button>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative group">
                <Lock size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/80 border ${
                    errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500`}
                  placeholder="Create a password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} sm:size={18} /> : <Eye size={16} sm:size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative group">
                <Lock size={16} sm:size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900/80 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 dark:text-gray-500`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} sm:size={18} /> : <Eye size={16} sm:size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button - Red only */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 sm:py-3.5 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-base sm:text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  Create Account
                  <UserPlus size={18} sm:size={20} />
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <SocialLogin onLoginSuccess={(user) => {
            console.log('Social login success:', user);
            const role = user.role?.toUpperCase();
            if (role === 'EMPLOYER') {
              navigate('/employer-dashboard');
            } else if (role === 'WORKER') {
              navigate('/worker-dashboard');
            } else if (role === 'ADMIN') {
              navigate('/admin');
            } else {
              navigate('/employer-dashboard');
            }
          }} />

          {/* Login Link */}
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 text-xs sm:text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:text-red-700 transition-colors hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-red-500 hover:text-red-600 transition-colors hover:underline">
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-red-500 hover:text-red-600 transition-colors hover:underline">
                Privacy Policy
              </Link>
              {', and you acknowledge the '}
              <Link to="/refund-policy" className="text-red-500 hover:text-red-600 transition-colors hover:underline">
                Refund Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <LegalFooter className="relative z-10 mt-6" />
    </div>
  );
}

export default Register;