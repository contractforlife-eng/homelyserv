import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle, Shield, Home, Sparkles } from 'lucide-react';

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

  // Create admin user on component mount
  useEffect(() => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    // Create admin user if it doesn't exist
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
  profileComplete: true
      };

      // Get existing users
      let existingUsers = [];
      try {
        const storedUsers = localStorage.getItem('homelyserv_users');
        existingUsers = storedUsers ? JSON.parse(storedUsers) : [];
      } catch (error) {
        console.error('Error parsing existing users:', error);
        existingUsers = [];
      }

      // Check if admin already exists
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
        console.log('🔄 User already logged in:', user.fullName);
        redirectUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Redirect function
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

  // Check if user is registered in localStorage
  const checkRegisteredUser = (email) => {
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      console.log('📦 Checking registered users for email:', email);
      
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log('✅ Found registered user:', user.fullName);
        return user;
      }
    } catch (error) {
      console.error('Error checking registered users:', error);
    }
    return null;
  };

  // Get saved profile data for a user
  const getSavedProfileData = (email) => {
    try {
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      if (profiles[email]) {
        console.log('📥 Found saved profile data for:', email);
        return profiles[email];
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
    return null;
  };

  // Login function - loads the correct user
  const loginUser = (userData, role, email) => {
    console.log('🔄 Logging in user:', email, 'role:', role);
    setError('');
    setLoading(true);

    let user = {};
    let token = '';

    // If we have existing user data, use it
    if (userData) {
      user = { ...userData };
      token = `user_token_${Date.now()}`;
      console.log('✅ Using existing user data:', user.fullName);
    } else {
      // Create new user based on role
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
          hourlyRate: '35'
        };
        token = `worker_token_${Date.now()}`;
      } else if (role === 'EMPLOYER') {
        user = {
          id: `employer_${Date.now()}`,
          fullName: email === 'employer@homelyserv.com' ? 'Sara Mohamed' : 'Employer',
          email: email || 'employer@homelyserv.com',
          role: 'EMPLOYER',
          companyName: 'Company Name',
          phone: '+201234567891',
          location: 'Cairo, Egypt',
          bio: 'Looking for professional home service providers.'
        };
        token = `employer_token_${Date.now()}`;
      } else if (role === 'ADMIN') {
        user = {
          id: `admin_${Date.now()}`,
          fullName: 'Admin User',
          email: email || 'admin@homelyserv.com',
          role: 'ADMIN',
          phone: '+201234567892'
        };
        token = `admin_token_${Date.now()}`;
      } else {
        setError('Invalid role selected');
        setLoading(false);
        return;
      }
      console.log('🆕 Created new user:', user.fullName);
    }

    // Check for saved profile data and merge
    const savedProfile = getSavedProfileData(user.email);
    if (savedProfile) {
      user = { ...user, ...savedProfile };
      console.log('📥 Merged saved profile data');
    }

    // Store in localStorage
    localStorage.setItem('homelyserv_token', token);
    localStorage.setItem('homelyserv_user', JSON.stringify(user));
    
    console.log('✅ Login successful:', user.fullName);
    console.log('✅ User role:', user.role);
    console.log('✅ User email:', user.email);
    
    // Redirect after a small delay
    setTimeout(() => {
      redirectUser(user);
    }, 500);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔄 Form submitted with email:', email);
    
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    // FIRST: Check if user is registered in homelyserv_users
        const registeredUser = checkRegisteredUser(email);

if (registeredUser) {
  if (registeredUser.password !== password) {
    setError('Invalid email or password');
    setLoading(false);
    return;
  }

  console.log('✅ Found registered user, logging in:', registeredUser.fullName);
  loginUser(registeredUser, registeredUser.role, email);
  return;
    }

    // SECOND: Check demo accounts
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/50 transition text-sm shadow-sm"
              >
                <Globe size={15} className="text-amber-600" />
                <span className="text-gray-600 text-xs font-medium">EN</span>
              </button>
              {showLanguages && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-amber-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setShowLanguages(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition text-sm"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom Logo */}
          <div className="text-center mb-8 pt-2">
            <div className="relative inline-block">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full blur-xl opacity-60 scale-110"></div>
              
              {/* Main logo container */}
              <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40 transform transition-transform hover:scale-105 duration-300">
                {/* Shield icon with home element */}
                <div className="relative">
                  <Shield size={64} className="text-white/30 absolute -inset-1" strokeWidth={1.5} />
                  <div className="relative z-10 flex items-center justify-center">
                    <Home size={36} className="text-white" strokeWidth={2} />
                    <Sparkles size={16} className="text-yellow-200 absolute -top-1 -right-1" />
                  </div>
                </div>
                
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-200 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-200 rounded-full"></div>
              </div>
              
              {/* Brand name with gradient */}
              <div className="mt-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent tracking-tight">
                  HomelyServ
                </h1>
                <p className="text-xs text-gray-400 tracking-widest uppercase mt-1 font-light">Premium Home Services</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl text-rose-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                  placeholder="Enter your password"
                  required
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

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-3.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
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
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-sm text-gray-400">Or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="flex justify-center gap-3">
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-amber-200 transition-all duration-200 flex items-center justify-center group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-amber-200 transition-all duration-200 flex items-center justify-center text-blue-600 font-bold group">
              <span className="group-hover:scale-110 transition-transform">f</span>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-amber-200 transition-all duration-200 flex items-center justify-center text-black font-bold group">
              <span className="group-hover:scale-110 transition-transform">𝕏</span>
            </button>
            <button className="w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-amber-200 transition-all duration-200 flex items-center justify-center text-green-600 font-bold group">
              <span className="group-hover:scale-110 transition-transform">💬</span>
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;