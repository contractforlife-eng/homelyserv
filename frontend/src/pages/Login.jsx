<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';
=======
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

export default function Login() {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [language, setLanguage] = useState('en');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'worker' // 'worker' or 'employer'
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Translations
  const translations = {
    en: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your account to continue',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      loginAs: 'Login as',
      worker: 'Job Seeker',
      employer: 'Employer',
      loginButton: 'Sign In',
      loading: 'Signing in...',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      register: 'Register Now',
      errors: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        passwordRequired: 'Password is required',
        passwordMin: 'Password must be at least 6 characters',
        invalidCredentials: 'Invalid email or password',
        accountSuspended: 'Your account has been suspended. Please contact support.',
        notVerified: 'Please verify your email address first.'
      },
      success: {
        loginSuccess: 'Login successful! Redirecting...'
      }
    },
    ar: {
      title: 'مرحباً بعودتك',
      subtitle: 'سجل الدخول إلى حسابك للمتابعة',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'example@you.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      loginAs: 'تسجيل الدخول كـ',
      worker: 'باحث عن عمل',
      employer: 'صاحب عمل',
      loginButton: 'تسجيل الدخول',
      loading: 'جاري التسجيل...',
      forgotPassword: 'نسيت كلمة المرور؟',
      noAccount: 'ليس لديك حساب؟',
      register: 'إنشاء حساب',
      errors: {
        emailRequired: 'البريد الإلكتروني مطلوب',
        emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح',
        passwordRequired: 'كلمة المرور مطلوبة',
        passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        accountSuspended: 'تم تعليق حسابك. يرجى الاتصال بالدعم.',
        notVerified: 'يرجى تأكيد بريدك الإلكتروني أولاً.'
      },
      success: {
        loginSuccess: 'تم تسجيل الدخول بنجاح! جاري التحويل...'
      }
    }
=======
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
  };

  const t = translations[language];

  // Check for language preference in localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

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
    
    if (!formData.email) {
      newErrors.email = t.errors.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.errors.emailInvalid;
    }
    
    if (!formData.password) {
      newErrors.password = t.errors.passwordRequired;
    } else if (formData.password.length < 6) {
      newErrors.password = t.errors.passwordMin;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setSuccessMessage('');
    setErrors({});
    
    try {
      // In production, this would be an API call to your backend
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: formData.email,
      //     password: formData.password,
      //     role: formData.role
      //   })
      // });
      
      // const data = await response.json();
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo: Simulate different responses
      if (formData.email === 'admin@homelyserv.com') {
        // Admin login
        localStorage.setItem('homelyserv_token', 'demo_admin_token');
        localStorage.setItem('homelyserv_user', JSON.stringify({
          id: 'admin_001',
          email: formData.email,
          role: 'admin',
          fullName: 'Admin User'
        }));
        setSuccessMessage(t.success.loginSuccess);
        setTimeout(() => navigate('/admin'), 1500);
      } else if (formData.email === 'worker@homelyserv.com') {
        // Worker login
        localStorage.setItem('homelyserv_token', 'demo_worker_token');
        localStorage.setItem('homelyserv_user', JSON.stringify({
          id: 'worker_001',
          email: formData.email,
          role: 'worker',
          fullName: 'Ahmed Ali',
          profileComplete: true
        }));
        setSuccessMessage(t.success.loginSuccess);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else if (formData.email === 'employer@homelyserv.com') {
        // Employer login
        localStorage.setItem('homelyserv_token', 'demo_employer_token');
        localStorage.setItem('homelyserv_user', JSON.stringify({
          id: 'employer_001',
          email: formData.email,
          role: 'employer',
          fullName: 'Sara Mohamed'
        }));
        setSuccessMessage(t.success.loginSuccess);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Simulate invalid credentials
        throw new Error(t.errors.invalidCredentials);
      }
      
    } catch (error) {
      setErrors({
        general: error.message || t.errors.invalidCredentials
      });
    } finally {
      setLoading(false);
=======
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message || 'Login failed');
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
    }
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const isRTL = language === 'ar';

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-300 transition-colors text-sm"
          >
            <Globe size={16} className="text-gray-600" />
            <span className="font-medium">{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-gray-500 mt-1">{t.subtitle}</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{successMessage}</span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.loginAs}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleSelect('worker')}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.role === 'worker'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Briefcase size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">{t.worker}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('employer')}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.role === 'employer'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <User size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">{t.employer}</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t.passwordPlaceholder}
                className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {t.forgotPassword}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.loading}
              </>
            ) : (
              t.loginButton
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {t.noAccount}{' '}
          <Link
            to="/register"
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            {t.register}
          </Link>
        </div>

        {/* Demo Credentials (Development Only) */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">Demo Accounts (for testing):</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Worker: worker@homelyserv.com</span>
              <span className="font-mono">password123</span>
            </div>
            <div className="flex justify-between">
              <span>Employer: employer@homelyserv.com</span>
              <span className="font-mono">password123</span>
            </div>
            <div className="flex justify-between">
              <span>Admin: admin@homelyserv.com</span>
              <span className="font-mono">password123</span>
=======
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F0FE 0%, #D4E4FD 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '32px',
        boxShadow: '0 25px 80px rgba(37, 99, 235, 0.15)',
        overflow: 'hidden',
        minHeight: '620px'
      }}>
        
        {/* Left Panel - Form */}
        <div style={{
          flex: 1,
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '22px',
                fontWeight: '700'
              }}>
                H
              </div>
              <h1 style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#1E293B',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                HomelyServ
              </h1>
            </div>
            <p style={{
              color: '#94A3B8',
              fontSize: '14px',
              marginTop: '6px',
              marginLeft: '56px'
            }}>
              Your Home, Our Priority
            </p>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#0F172A',
            marginBottom: '6px',
            letterSpacing: '-0.3px'
          }}>
            Welcome Back 👋
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            Sign in to access your HomelyServ account
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                display: 'block',
                marginBottom: '6px',
                letterSpacing: '0.3px'
              }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="emad@homelyserv.com"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: '#F8FAFC'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.background = '#F8FAFC';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  letterSpacing: '0.3px'
                }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{
                  fontSize: '12px',
                  color: '#2563EB',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: '#F8FAFC'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.background = '#F8FAFC';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '26px'
            }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#2563EB',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              <label htmlFor="remember" style={{
                fontSize: '13px',
                color: '#64748B',
                cursor: 'pointer'
              }}>
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OR divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{
              fontSize: '12px',
              color: '#94A3B8',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {/* Social Login */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#2563EB';
              e.target.style.background = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.background = '#fff';
            }}
            >
              <span style={{ fontSize: '18px' }}>🔵</span> Google
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#1877F2';
              e.target.style.background = '#F0F4FF';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.background = '#fff';
            }}
            >
              <span style={{ fontSize: '18px' }}>🔷</span> Facebook
            </button>
          </div>

          {/* Sign up link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#94A3B8',
            marginTop: '26px'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#2563EB',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Right Panel - Branding (Blue Theme) */}
        <div style={{
          flex: '0 0 42%',
          background: 'linear-gradient(145deg, #1E3A5F 0%, #0F172A 100%)',
          padding: '52px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.12)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.08)'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.04)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '72px',
              marginBottom: '24px',
              display: 'block'
            }}>
              🏡
            </div>
            <h3 style={{
              fontSize: '26px',
              fontWeight: '700',
              marginBottom: '14px',
              letterSpacing: '-0.5px'
            }}>
              Your Home, Our Priority
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.7',
              maxWidth: '280px',
              margin: '0 auto'
            }}>
              Find trusted domestic workers and caregivers for your home, all in one secure platform.
            </p>

            <div style={{
              marginTop: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> Verified professionals
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> Secure & confidential
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> 24/7 support
              </div>
            </div>

            <div style={{
              marginTop: '36px',
              fontSize: '12px',
              opacity: 0.5,
              letterSpacing: '0.5px'
            }}>
              Secure. Reliable. Always here for your home.
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}