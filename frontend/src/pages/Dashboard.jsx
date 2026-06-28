import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, Briefcase, Search, MessageCircle, 
  Bell, User, Settings, LogOut, DollarSign, Star,
  Calendar, TrendingUp, Award, Shield, Menu, X
} from 'lucide-react';
import MobileSidebar from '../components/MobileSidebar';

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <MobileSidebar user={user} onLogout={handleLogout} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">{t('appName')}</h1>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.fullName}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Home size={20} /> {t('dashboard')}
          </Link>
          <Link to="/search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> {t('search')}
          </Link>
          <Link to="/my-hires" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> {t('myHires')}
          </Link>
          <Link to="/messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> {t('messages')}
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> {t('profile')}
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> {t('settings')}
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> {t('logout')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 flex-1">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white shadow-sm border-b border-gray-200 px-8 py-4 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h2>
            <p className="text-gray-500">{t('welcomeBack')} {user.fullName}!</p>
          </div>
          <button className="relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500">{t('totalHires')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">24</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500">{t('activeHires')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">12</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500">{t('totalRevenue')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">$48,650</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500">{t('rating')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">4.9 ★</p>
            </div>
          </div>

          {/* Quick Actions - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <Link to="/search" className="bg-red-600 p-4 sm:p-6 rounded-xl shadow-sm hover:bg-red-700 transition text-white">
              <Search size={20} className="mb-2" />
              <h3 className="text-base sm:text-lg font-semibold">{t('search')}</h3>
              <p className="text-red-100 text-xs sm:text-sm mt-1">Find the perfect worker</p>
            </Link>
            <Link to="/my-hires" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <Briefcase size={20} className="text-red-600 mb-2" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">{t('myHires')}</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">View all your hires</p>
            </Link>
            <Link to="/profile" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <User size={20} className="text-red-600 mb-2" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">{t('profile')}</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">View and edit profile</p>
            </Link>
          </div>

          {/* Recent Activity - Mobile Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">{t('recentActivity')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Ahmed Ali</p>
                    <p className="text-xs sm:text-sm text-gray-500">Nanny - Full Time</p>
                  </div>
                  <span className="text-xs sm:text-sm text-green-600">{t('active')}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Mona Hassan</p>
                    <p className="text-xs sm:text-sm text-gray-500">Elderly Caregiver</p>
                  </div>
                  <span className="text-xs sm:text-sm text-yellow-600">{t('pending')}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">{t('notifications')}</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-gray-800 text-sm sm:text-base">Sara Mohamed</p>
                  <p className="text-xs sm:text-sm text-gray-500">When can you start working?</p>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">Khaled Rashed</p>
                  <p className="text-xs sm:text-sm text-gray-500">I'm interested in your profile</p>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;