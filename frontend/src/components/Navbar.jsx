// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Settings,
  Search,
  MessageCircle,
  ChevronDown,
  Globe
} from 'lucide-react';

const Navbar = ({ user, onLogout, language, toggleLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const translations = {
    en: {
      home: 'Home',
      offers: 'Offers',
      messages: 'Messages',
      notifications: 'Notifications',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      dashboard: 'Dashboard',
      myHires: 'My Hires',
      search: 'Search'
    },
    ar: {
      home: 'الرئيسية',
      offers: 'العروض',
      messages: 'الرسائل',
      notifications: 'الإشعارات',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      dashboard: 'لوحة التحكم',
      myHires: 'تعاقداتي',
      search: 'بحث'
    }
  };

  const t = translations[language || 'en'];

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'WORKER': return '/worker-dashboard';
      case 'EMPLOYER': return '/employer-dashboard';
      case 'ADMIN': return '/admin';
      default: return '/home';
    }
  };

  const getOffersPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'WORKER': return '/worker/offers';
      case 'EMPLOYER': return '/employer-search';
      default: return '/search';
    }
  };

  const getMessagesPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'WORKER': return '/worker-messages';
      case 'EMPLOYER': return '/employer-messages';
      case 'ADMIN': return '/admin/messages';
      default: return '/messages';
    }
  };

  const getProfilePath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'WORKER': return '/worker-profile';
      case 'EMPLOYER': return '/employer-profile';
      default: return '/profile';
    }
  };

  const getSettingsPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'WORKER': return '/worker-settings';
      case 'EMPLOYER': return '/employer-settings';
      case 'ADMIN': return '/admin/settings';
      default: return '/settings';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={getDashboardPath()} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-red-600 hidden sm:block">HomelyServ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to={getDashboardPath()} 
              className={`flex items-center gap-1 transition-colors ${
                isActive(getDashboardPath()) 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Home size={18} />
              {t.dashboard}
            </Link>
            
            <Link 
              to={getOffersPath()} 
              className={`flex items-center gap-1 transition-colors ${
                isActive(getOffersPath()) 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Briefcase size={18} />
              {t.offers}
            </Link>

            {user?.role === 'WORKER' && (
              <Link 
                to="/my-hires" 
                className={`flex items-center gap-1 transition-colors ${
                  isActive('/my-hires') 
                    ? 'text-red-600 font-medium' 
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                <Briefcase size={18} />
                {t.myHires}
              </Link>
            )}

            {user?.role === 'EMPLOYER' && (
              <Link 
                to="/employer-pending" 
                className={`flex items-center gap-1 transition-colors ${
                  isActive('/employer-pending') 
                    ? 'text-red-600 font-medium' 
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                <Clock size={18} />
                Pending
              </Link>
            )}

            <Link 
              to={getMessagesPath()} 
              className={`flex items-center gap-1 transition-colors ${
                isActive(getMessagesPath()) 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <MessageCircle size={18} />
              {t.messages}
            </Link>

            {/* Notifications */}
            <button className="text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Globe size={16} />
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                  {user?.fullName?.[0] || user?.name?.[0] || 'U'}
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <Link 
                    to={getProfilePath()} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} />
                    {t.profile}
                  </Link>
                  <Link 
                    to={getSettingsPath()} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings size={16} />
                    {t.settings}
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4">
          <div className="space-y-3 px-4">
            <Link 
              to={getDashboardPath()} 
              className="block text-gray-700 hover:text-red-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.dashboard}
            </Link>
            <Link 
              to={getOffersPath()} 
              className="block text-gray-700 hover:text-red-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.offers}
            </Link>
            <Link 
              to={getMessagesPath()} 
              className="block text-gray-700 hover:text-red-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.messages}
            </Link>
            <Link 
              to={getProfilePath()} 
              className="block text-gray-700 hover:text-red-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.profile}
            </Link>
            <Link 
              to={getSettingsPath()} 
              className="block text-gray-700 hover:text-red-600"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.settings}
            </Link>
            <button
              onClick={toggleLanguage}
              className="block w-full text-left text-gray-700 hover:text-red-600"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left text-red-600 hover:text-red-700"
            >
              {t.logout}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;