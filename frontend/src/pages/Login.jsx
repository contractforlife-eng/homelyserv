import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle, User, Briefcase } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
  ];

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('homelyserv_token');
    const userData = localStorage.getItem('homelyserv_user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔄 User already logged in:', user.fullName);
        redirectUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Redirect function
  const redirectUser = (user) => {
    console.log('🔀 Redirecting user with role:', user.role);
    
    // Clear any existing state
    setLoading(false);
    
    // Redirect based on role
    if (user.role === 'ADMIN') {
      navigate('/admin');
    } else if (user.role === 'EMPLOYER') {
      navigate('/employer-dashboard');
    } else if (user.role === 'WORKER') {
      navigate('/worker-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Quick login function
  const quickLogin = (role) => {
    console.log('🔄 Quick login clicked for role:', role);
    setError('');
    setLoading(true);

    // Create user data based on role
    let user = {};
    let token = '';

    if (role === 'WORKER') {
      user = {
        id: 'worker_001',
        fullName: 'Ahmed Ali',
        email: 'worker@homelyserv.com',
        role: 'WORKER',
        profileComplete: true,
        phone: '+201234567890',
        location: 'Cairo, Egypt'
      };
      token = 'demo_worker_token_12345';
    } else if (role === 'EMPLOYER') {
      user = {
        id: 'employer_001',
        fullName: 'Sara Mohamed',
        email: 'employer@homelyserv.com',
        role: 'EMPLOYER',
        companyName: 'Elite Family Services',
        phone: '+201234567891',
        location: 'Cairo, Egypt'
      };
      token = 'demo_employer_token_12345';
    } else if (role === 'ADMIN') {
      user = {
        id: 'admin_001',
        fullName: 'Admin User',
        email: 'admin@homelyserv.com',
        role: 'ADMIN',
        phone: '+201234567892'
      };
      token = 'demo_admin_token_12345';
    }

    // Store in localStorage
    localStorage.setItem('homelyserv_token', token);
    localStorage.setItem('homelyserv_user', JSON.stringify(user));
    
    console.log('✅ Quick login successful:', user.fullName);
    console.log('✅ User role:', user.role);
    
    // Redirect after a small delay to ensure state updates
    setTimeout(() => {
      redirectUser(user);
    }, 300);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔄 Form submitted with email:', email);
    
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Use quick login based on email
    if (email.toLowerCase() === 'worker@homelyserv.com' || email.toLowerCase() === 'worker') {
      quickLogin('WORKER');
    } else if (email.toLowerCase() === 'employer@homelyserv.com' || email.toLowerCase() === 'employer') {
      quickLogin('EMPLOYER');
    } else if (email.toLowerCase() === 'admin@homelyserv.com' || email.toLowerCase() === 'admin') {
      quickLogin('ADMIN');
    } else {
      // Default to worker if email doesn't match any demo account
      setError('No account found with this email. Using demo login...');
      setTimeout(() => {
        quickLogin('WORKER');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <div className="w-full max-w-md">
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
            <h1 className="text-2xl font-bold text-gray-800 mt-4">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* QUICK LOGIN BUTTONS */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <p className="text-xs text-gray-600 text-center mb-3 font-bold">🚀 Quick Login (Click to Login)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin('WORKER')}
                disabled={loading}
                className="px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? '...' : '👤 Worker'}
              </button>
              <button
                onClick={() => quickLogin('EMPLOYER')}
                disabled={loading}
                className="px-3 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? '...' : '🏢 Employer'}
              </button>
              <button
                onClick={() => quickLogin('ADMIN')}
                disabled={loading}
                className="px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? '...' : '🔐 Admin'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click any button to instantly login
            </p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">Or login with email</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-red-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Loading...' : 'Sign In'}
              <LogIn size={20} />
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">Or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center text-blue-600 font-bold">
              f
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center text-black font-bold">
              𝕏
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center text-green-600 font-bold">
              💬
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-400 text-center">💡 Quick login credentials:</p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-500">
              <div className="text-center">
                <span className="font-medium text-blue-600">Worker:</span>
                <br />worker@homelyserv.com
              </div>
              <div className="text-center">
                <span className="font-medium text-green-600">Employer:</span>
                <br />employer@homelyserv.com
              </div>
              <div className="text-center">
                <span className="font-medium text-purple-600">Admin:</span>
                <br />admin@homelyserv.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;