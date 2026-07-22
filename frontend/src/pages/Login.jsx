// src/pages/Login.jsx - BRIGHT RED, WHITE, AND BLACK THEME
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle, Shield, Home, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import SocialLogin from '../components/SocialLogin';
import useAuthStore from '../store/authStore';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
  ];

  // Check if user is already logged in — redirect based on token only
  useEffect(() => {
    const token = localStorage.getItem('homelyserv_token');
    if (token) {
      // Token exists but user may not be in Zustand store yet;
      // AuthContext.checkAuth() will load it from /api/auth/verify
      // Just redirect to the generic handler; the verify check will route correctly
      navigate('/messages');
    }
  }, []);

  const redirectUser = (user) => {
    const role = user?.role?.toUpperCase();

    if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'EMPLOYER') {
      navigate('/employer-dashboard');
    } else if (role === 'WORKER') {
      navigate('/worker-dashboard');
    } else {
      navigate('/login');
    }
  };

  const loginUser = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      const user = data.user;
      const token = data.token;

      // Normalize role to uppercase to prevent case-mismatch routing loops
      user.role = user.role?.toUpperCase();

      localStorage.setItem('homelyserv_token', token);

      // Update Zustand store — user lives in memory, not localStorage
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true
      });

      console.log('✅ Login successful:', user.fullName);
      console.log('✅ User role:', user.role);

      redirectUser(user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsEmailValid(true);
    setShowPasswordField(true);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    loginUser(email, password);
  };

  const handleBackToEmail = () => {
    setShowPasswordField(false);
    setIsEmailValid(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-red-50 p-4 relative overflow-hidden">
      {/* Radiant decorative background elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-red-400/40 via-red-500/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-gray-900/20 via-red-600/10 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-red-300/10 via-white to-red-400/10 rounded-full blur-3xl"></div>
      
      {/* Floating sparkle elements */}
      <div className="absolute top-10 right-20 w-3 h-3 bg-red-500 rounded-full blur-sm animate-ping"></div>
      <div className="absolute bottom-20 left-10 w-2 h-2 bg-red-400 rounded-full blur-sm animate-ping delay-300"></div>
      <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-red-300 rounded-full blur-md animate-pulse delay-700"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/30 p-8 border border-red-200/50 transition-all duration-300 hover:shadow-red-500/40">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50/80 transition-all text-sm shadow-md hover:shadow-red-200"
              >
                <Globe size={15} className="text-red-600" />
                <span className="text-gray-700 text-xs font-medium">EN</span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-red-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setShowLanguages(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 hover:text-red-600 transition text-sm"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo & Brand - Radiant Red, White, Black */}
          <div className="text-center mb-8 pt-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-gray-800 rounded-full blur-2xl opacity-70 scale-110 animate-pulse"></div>
              
              <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-red-500 via-red-600 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/40 transform transition-transform hover:scale-105 duration-300 hover:shadow-red-500/60">
                <div className="relative">
                  <Shield size={64} className="text-white/20 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={36} className="text-white drop-shadow-lg" strokeWidth={2} />
                    <Sparkles size={16} className="text-red-200 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-red-600 to-gray-800 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                  HomelyServ
                </h1>
                <p className="text-xs text-gray-500 tracking-widest uppercase mt-1 font-medium">Premium Home Services</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50/90 backdrop-blur-sm border-2 border-red-300 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-shake shadow-md shadow-red-200">
              <AlertCircle size={16} className="text-red-500" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field - Always Visible */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !showPasswordField) {
                      e.preventDefault();
                      handleEmailSubmit(e);
                    }
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200 placeholder:text-gray-400 shadow-sm hover:shadow-red-100 ${
                    showPasswordField ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  placeholder="Enter your email"
                  disabled={showPasswordField}
                  required
                />
                {!showPasswordField && (
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg transition-all shadow-md hover:shadow-red-400"
                  >
                    <ArrowRight size={18} />
                  </button>
                )}
                {showPasswordField && (
                  <div className="absolute right-3 top-3.5 text-red-500">
                    <CheckCircle size={18} className="drop-shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-40 opacity-100 mb-2' : 'max-h-0 opacity-0'
            }`}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200 placeholder:text-gray-400 shadow-sm hover:shadow-red-100"
                  placeholder="Enter your password"
                  required
                  autoFocus={showPasswordField}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100 mb-6' : 'max-h-0 opacity-0'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-red-400" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Login Button - Appears After Email - Radiant Red to Black gradient */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 via-red-600 to-gray-800 text-white py-3.5 rounded-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : (
                  <>
                    Sign In
                    <LogIn size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Back to Email Button - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}>
              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full text-center text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                ← Use a different email
              </button>
            </div>
          </form>

          {/* Social Login */}
          <div className="mt-4">
            <SocialLogin onLoginSuccess={(user) => {
              console.log('Social login success:', user);
            }} />
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-bold hover:text-red-700 transition-colors hover:underline hover:underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

export default Login;