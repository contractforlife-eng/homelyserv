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

const Login = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'WORKER' // 'WORKER' or 'EMPLOYER'
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
        notVerified: 'Please verify your email address first.',
        roleRequired: 'Please select a role'
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
        notVerified: 'يرجى تأكيد بريدك الإلكتروني أولاً.',
        roleRequired: 'يرجى اختيار دور'
      },
      success: {
        loginSuccess: 'تم تسجيل الدخول بنجاح! جاري التحويل...'
      }
    }
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

    if (!formData.role) {
      newErrors.role = t.errors.roleRequired;
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
    setSuccessMessage('');
    setErrors({});

    try {
      // Simulate API call with demo accounts
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Demo accounts with proper role names matching the backend
      const demoAccounts = {
        'worker@homelyserv.com': {
          password: 'password123',
          user: {
            id: 'worker_001',
            fullName: 'Ahmed Ali',
            email: 'worker@homelyserv.com',
            role: 'WORKER',
            profileComplete: true,
            phone: '+201234567890',
            location: 'Cairo, Egypt'
          },
          token: 'demo_worker_token_12345'
        },
        'employer@homelyserv.com': {
          password: 'password123',
          user: {
            id: 'employer_001',
            fullName: 'Sara Mohamed',
            email: 'employer@homelyserv.com',
            role: 'EMPLOYER',
            companyName: 'Elite Family Services',
            phone: '+201234567891',
            location: 'Cairo, Egypt'
          },
          token: 'demo_employer_token_12345'
        },
        'admin@homelyserv.com': {
          password: 'password123',
          user: {
            id: 'admin_001',
            fullName: 'Admin User',
            email: 'admin@homelyserv.com',
            role: 'ADMIN',
            phone: '+201234567892'
          },
          token: 'demo_admin_token_12345'
        }
      };

      // Check if the email exists in demo accounts
      const demoUser = demoAccounts[formData.email];
      
      if (demoUser && demoUser.password === formData.password) {
        // Check if the role matches
        if (demoUser.user.role !== formData.role) {
          setErrors({
            general: `This account is registered as ${demoUser.user.role}. Please select the correct role.`
          });
          setLoading(false);
          return;
        }

        // Store user data and token with correct keys
        localStorage.setItem('homelyserv_token', demoUser.token);
        localStorage.setItem('homelyserv_user', JSON.stringify(demoUser.user));
        
        setSuccessMessage(t.success.loginSuccess);
        
        // Redirect based on role
        setTimeout(() => {
          if (demoUser.user.role === 'WORKER') {
            navigate('/worker/offers');
          } else if (demoUser.user.role === 'EMPLOYER') {
            navigate('/employer-dashboard');
          } else if (demoUser.user.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        // Check if email exists but password is wrong
        if (demoAccounts[formData.email]) {
          setErrors({ general: 'Invalid password. Please try again.' });
        } else {
          setErrors({ general: t.errors.invalidCredentials });
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || t.errors.invalidCredentials
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    if (errors.role) {
      setErrors(prev => ({
        ...prev,
        role: ''
      }));
    }
  };

  const isRTL = language === 'ar';

  return (
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
              onClick={() => handleRoleSelect('WORKER')}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.role === 'WORKER'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Briefcase size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">{t.worker}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('EMPLOYER')}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.role === 'EMPLOYER'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <User size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">{t.employer}</span>
            </button>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role}</p>
          )}
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

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">Demo Accounts (for testing):</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="font-medium text-red-600">Worker:</span>
              <span>worker@homelyserv.com</span>
              <span className="font-mono">password123</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-red-600">Employer:</span>
              <span>employer@homelyserv.com</span>
              <span className="font-mono">password123</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-red-600">Admin:</span>
              <span>admin@homelyserv.com</span>
              <span className="font-mono">password123</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Make sure to select the correct role before logging in
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;