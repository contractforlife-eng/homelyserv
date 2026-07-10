import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, AlertCircle } from 'lucide-react';

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
      console.log('✅ Found registered user, logging in:', registeredUser.fullName);
      loginUser(registeredUser, registeredUser.role, email);
      return;
    }

    // SECOND: Check demo accounts
    if (email.toLowerCase() === 'worker@homelyserv.com' || email.toLowerCase() === 'worker') {
      loginUser(null, 'WORKER', email);
    } else if (email.toLowerCase() === 'employer@homelyserv.com' || email.toLowerCase() === 'employer') {
      loginUser(null, 'EMPLOYER', email);
    } else if (email.toLowerCase() === 'admin@homelyserv.com' || email.toLowerCase() === 'admin') {
      loginUser(null, 'ADMIN', email);
    } else {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
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
        </div>
      </div>
    </div>
  );
}

export default Login;