// src/pages/Login.jsx - RED AND WHITE THEME ONLY
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle, Shield, Home, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import SocialLogin from '../components/SocialLogin';
import { isUserPremium, getUserSubscription, syncPremiumStatus } from '../utils/subscriptionService';

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

  // Generate a simple JWT-like token
  const generateToken = (user) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId: user.id || user.email,
      email: user.email,
      role: user.role,
      id: user.id,
      fullName: user.fullName,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa('homelyserv_secret_key_2026');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  // Create admin user on component mount
  useEffect(() => {
    const createAdminUser = () => {
      const adminUser = {
        id: 'admin_emad',
        fullName: 'Emad',
        email: 'emad@homelyserv.com',
        password: 'killuemad',
        role: 'ADMIN',
        phone: '+201009189851',
        location: 'Cairo, Egypt',
        bio: 'System Administrator',
        skills: ['Management', 'Administration'],
        experience: '5 years',
        hourlyRate: '0',
        createdAt: new Date().toISOString(),
        profileComplete: true,
        isPremium: false,
        subscriptionActive: false
      };

      let existingUsers = [];
      try {
        const storedUsers = localStorage.getItem('homelyserv_users');
        existingUsers = storedUsers ? JSON.parse(storedUsers) : [];
      } catch (error) {
        console.error('Error parsing existing users:', error);
        existingUsers = [];
      }

      const adminExists = existingUsers.find(u => u.email.toLowerCase() === 'emad@homelyserv.com');
      if (!adminExists) {
        existingUsers.push(adminUser);
        localStorage.setItem('homelyserv_users', JSON.stringify(existingUsers));
        console.log('✅ Admin user created: emad@homelyserv.com');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    };

    createAdminUser();
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('homelyserv_token');
    const userData = localStorage.getItem('homelyserv_user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        const userId = user.id || user.email;
        const isPremium = isUserPremium(userId);
        const subscription = getUserSubscription(userId);
        
        const updatedUser = {
          ...user,
          isPremium: isPremium,
          subscriptionActive: isPremium,
          subscription: subscription
        };
        
        localStorage.setItem('homelyserv_user', JSON.stringify(updatedUser));
        syncPremiumStatus(userId, user.email);
        redirectUser(updatedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
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

  const checkRegisteredUser = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        return user;
      }
    } catch (error) {
      console.error('Error checking registered users:', error);
    }
    return null;
  };

  const getSavedProfileData = (email) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      if (profiles[email]) {
        return profiles[email];
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
    return null;
  };

  const loginUser = (userData, role, email) => {
    console.log('🔄 Logging in user:', email, 'role:', role);
    setError('');
    setLoading(true);

    let user = {};
    let token = '';

    if (userData) {
      user = { ...userData };
      token = generateToken(user);
    } else {
      if (role === 'WORKER') {
        user = {
          id: `worker_${Date.now()}`,
          fullName: email === 'worker@homelyserv.com' ? 'Ahmed Ali' : 'Worker',
          email: email || 'worker@homelyserv.com',
          role: 'WORKER',
          profileComplete: true,
          phone: '+201234567890',
          location: 'Cairo, Egypt',
          bio: 'Experienced professional in home services.',
          skills: ['Child Care', 'First Aid', 'Communication'],
          experience: '3 years',
          hourlyRate: '35',
          isPremium: false,
          subscriptionActive: false
        };
        token = generateToken(user);
      } else if (role === 'EMPLOYER') {
        user = {
          id: `employer_${Date.now()}`,
          fullName: email === 'employer@homelyserv.com' ? 'Sara Mohamed' : 'Employer',
          email: email || 'employer@homelyserv.com',
          role: 'EMPLOYER',
          companyName: 'Company Name',
          phone: '+201234567891',
          location: 'Cairo, Egypt',
          bio: 'Looking for professional home service providers.',
          isPremium: false,
          subscriptionActive: false
        };
        token = generateToken(user);
      } else if (role === 'ADMIN') {
        user = {
          id: `admin_${Date.now()}`,
          fullName: 'Admin User',
          email: email || 'admin@homelyserv.com',
          role: 'ADMIN',
          phone: '+201234567892',
          isPremium: false,
          subscriptionActive: false
        };
        token = generateToken(user);
      } else {
        setError('Invalid role selected');
        setLoading(false);
        return;
      }
    }

    const savedProfile = getSavedProfileData(user.email);
    if (savedProfile) {
      user = { ...user, ...savedProfile };
    }

    const userId = user.id || user.email;
    const isPremium = isUserPremium(userId);
    const subscription = getUserSubscription(userId);
    
    user.isPremium = isPremium;
    user.subscriptionActive = isPremium;
    user.subscription = subscription;

    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          isPremium: isPremium,
          subscriptionActive: isPremium,
          subscription: subscription
        };
        localStorage.setItem('homelyserv_users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('Error updating users list:', error);
    }

    try {
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      if (profiles[user.email]) {
        profiles[user.email] = {
          ...profiles[user.email],
          isPremium: isPremium,
          subscriptionActive: isPremium
        };
        localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
      }
    } catch (error) {
      console.error('Error updating profiles:', error);
    }

    try {
      const subscriptions = JSON.parse(localStorage.getItem('homelyserv_subscriptions') || '{}');
      if (subscriptions[userId]) {
        subscriptions[userId] = {
          ...subscriptions[userId],
          userEmail: user.email,
          userRole: user.role,
          userFullName: user.fullName
        };
        localStorage.setItem('homelyserv_subscriptions', JSON.stringify(subscriptions));
      }
    } catch (error) {
      console.error('Error updating subscriptions:', error);
    }

    localStorage.setItem('homelyserv_token', token);
    localStorage.setItem('homelyserv_user', JSON.stringify(user));
    
    console.log('✅ Login successful:', user.fullName);
    console.log('✅ User role:', user.role);
    
    setTimeout(() => {
      redirectUser(user);
    }, 500);
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

    const registeredUser = checkRegisteredUser(email);

    if (registeredUser) {
      if (registeredUser.password !== password) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      loginUser(registeredUser, registeredUser.role, email);
      return;
    }

    // Demo accounts
    if (
      (email.toLowerCase() === 'contractforlife@gmail.com' ||
        email.toLowerCase() === 'worker') &&
      password === 'test1234'
    ) {
      loginUser(null, 'WORKER', email);
    }
    else if (
      (email.toLowerCase() === 'max@cargotrust.us' ||
        email.toLowerCase() === 'employer') &&
      password === 'test1234'
    ) {
      loginUser(null, 'EMPLOYER', email);
    }
    else if (
      (email.toLowerCase() === 'admin@homelyserv.com' ||
        email.toLowerCase() === 'admin') &&
      password === 'test1234'
    ) {
      loginUser(null, 'ADMIN', email);
    }
    else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setShowPasswordField(false);
    setIsEmailValid(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/30 p-4 relative overflow-hidden">
      {/* Decorative background elements - Red only */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-100/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/10 p-8 border border-red-100/50 transition-all duration-300">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50/50 transition text-sm shadow-sm"
              >
                <Globe size={15} className="text-red-600" />
                <span className="text-gray-600 text-xs font-medium">EN</span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-red-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setShowLanguages(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-sm"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo & Brand - Red only */}
          <div className="text-center mb-8 pt-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl opacity-60 scale-110"></div>
              
              <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30 transform transition-transform hover:scale-105 duration-300">
                <div className="relative">
                  <Shield size={64} className="text-white/20 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={36} className="text-white" strokeWidth={2} />
                    <Sparkles size={16} className="text-red-200 absolute -top-1 -right-1" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-tight">
                  HomelyServ
                </h1>
                <p className="text-xs text-gray-400 tracking-widest uppercase mt-1 font-light">Premium Home Services</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-shake">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field - Always Visible */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
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
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400 ${
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
                    className="absolute right-2 top-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight size={18} />
                  </button>
                )}
                {showPasswordField && (
                  <div className="absolute right-3 top-3.5 text-red-600">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field - Appears After Email */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-40 opacity-100 mb-2' : 'max-h-0 opacity-0'
            }`}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder:text-gray-400"
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
                  <input type="checkbox" className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Login Button - Appears After Email - Red only */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showPasswordField ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
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
                className="w-full text-center text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                ← Use a different email
              </button>
            </div>
          </form>

          {/* Social Login */}
          <SocialLogin onLoginSuccess={(user) => {
            console.log('Social login success:', user);
          }} />

          {/* Register Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-semibold hover:text-red-700 transition-colors hover:underline">
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
      `}</style>
    </div>
  );
}

export default Login;