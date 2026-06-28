import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, Briefcase, Search, MessageCircle, User, Settings, LogOut,
  Menu, X, Bell, Users, DollarSign, Star
} from 'lucide-react';

function MobileSidebar({ user, onLogout }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: t('dashboard') },
    { to: '/search', icon: <Search size={20} />, label: t('search') },
    { to: '/my-hires', icon: <Briefcase size={20} />, label: t('myHires') },
    { to: '/messages', icon: <MessageCircle size={20} />, label: t('messages') },
    { to: '/profile', icon: <User size={20} />, label: t('profile') },
    { to: '/settings', icon: <Settings size={20} />, label: t('settings') },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 touch-button"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-red-600">{t('appName')}</h1>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 touch-button">
          <Bell size={22} className="text-gray-700" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
            </div>
          </div>
          <button 
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 touch-button"
          >
            <X size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              {item.icon}
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              closeSidebar();
              onLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            <span className="text-base font-medium">{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default MobileSidebar;