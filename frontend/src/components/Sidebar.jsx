// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import {
  Home,
  User,
  Briefcase,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  Clock,
  Users,
  BarChart3,
  FileText,
  DollarSign,
  Shield,
  Bell,
  Menu,
  X,
  Crown,
  Search,
  FileCheck
} from 'lucide-react';

const Sidebar = ({ 
  language = 'en',
  collapsed = false,
  toggleCollapse,
  mobileOpen = false,
  toggleMobile,
  user,
  onLogout
}) => {
  const location = useLocation();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      profile: 'Profile',
      offers: 'Offers',
      messages: 'Messages',
      complaints: 'Complaints',
      payment: 'Payment',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview',
      myHires: 'My Hires',
      pending: 'Pending',
      past: 'Past',
      users: 'Users',
      reports: 'Reports',
      hires: 'Hires',
      search: 'Search',
      notifications: 'Notifications',
      premium: 'Premium'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      profile: 'الملف الشخصي',
      offers: 'العروض',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      payment: 'الدفع',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة',
      myHires: 'تعاقداتي',
      pending: 'قيد الانتظار',
      past: 'السابقة',
      users: 'المستخدمين',
      reports: 'التقارير',
      hires: 'التعاقدات',
      search: 'بحث',
      notifications: 'الإشعارات',
      premium: 'مميز'
    }
  };

  const t = translations[language || 'en'];

  // Check if user has premium subscription
  const isPremium = () => {
    if (!user) return false;
    const userId = user.id || user.email;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'WORKER':
        return [
          { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
          { id: 'profile', label: t.profile, icon: User, path: '/worker-profile' },
          { id: 'offers', label: t.offers, icon: Briefcase, path: '/worker/offers' },
          { id: 'my-hires', label: t.myHires, icon: FileText, path: '/my-hires' },
          { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
          { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
          { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
          { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
          { id: 'notifications', label: t.notifications, icon: Bell, path: '/notifications' },
        ];

      case 'EMPLOYER':
        return [
          { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
          { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
          { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
          { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
          { id: 'payments', label: t.payment, icon: DollarSign, path: '/employer-payments' },
          { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
          { id: 'profile', label: t.profile, icon: User, path: '/employer-profile' },
          { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
        ];

      case 'ADMIN':
        return [
          { id: 'dashboard', label: t.dashboard, icon: Home, path: '/admin' },
          { id: 'users', label: t.users, icon: Users, path: '/admin/users' },
          { id: 'hires', label: t.hires, icon: FileText, path: '/admin/hires' },
          { id: 'payments', label: t.payment, icon: DollarSign, path: '/admin/payments' },
          { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/admin/complaints' },
          { id: 'reports', label: t.reports, icon: BarChart3, path: '/admin/reports' },
          { id: 'messages', label: t.messages, icon: MessageCircle, path: '/admin/messages' },
          { id: 'settings', label: t.settings, icon: Settings, path: '/admin/settings' },
        ];

      default:
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/home' },
          { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        ];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  // Get role-specific styling
  const getRoleStyles = () => {
    if (!user) return { bg: 'bg-red-600', hover: 'hover:bg-red-700', active: 'bg-red-50 text-red-600' };
    switch (user.role) {
      case 'WORKER':
        return { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', active: 'bg-amber-50 text-amber-600' };
      case 'EMPLOYER':
        return { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', active: 'bg-teal-50 text-teal-600' };
      case 'ADMIN':
        return { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', active: 'bg-purple-50 text-purple-600' };
      default:
        return { bg: 'bg-red-600', hover: 'hover:bg-red-700', active: 'bg-red-50 text-red-600' };
    }
  };

  const styles = getRoleStyles();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && (
            <Link to={user?.role === 'WORKER' ? '/worker-dashboard' : user?.role === 'EMPLOYER' ? '/employer-dashboard' : '/home'} className="flex items-center gap-2">
              <div className={`w-8 h-8 ${styles.bg} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {collapsed && (
            <Link to={user?.role === 'WORKER' ? '/worker-dashboard' : user?.role === 'EMPLOYER' ? '/employer-dashboard' : '/home'} className={`w-8 h-8 ${styles.bg} rounded-lg flex items-center justify-center mx-auto`}>
              <span className="text-white font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobile}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Profile - WITH PREMIUM BADGE */}
        <div className={`p-4 border-b border-gray-200 ${collapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${styles.bg} flex items-center justify-center flex-shrink-0 overflow-hidden relative`}>
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.fullName || user.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
              {userIsPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || user.name || 'User'}</p>
                  {userIsPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email || 'user@homelyserv.com'}</p>
                <span className="text-xs text-red-600 font-medium">
                  {user.role?.toLowerCase() || 'user'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!collapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {collapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? styles.active
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? (user?.role === 'WORKER' ? 'text-amber-600' : user?.role === 'EMPLOYER' ? 'text-teal-600' : 'text-purple-600') : ''} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !collapsed && (
                <div className={`ml-auto w-1.5 h-8 ${styles.bg} rounded-full`}></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          {/* Settings & Help */}
          {user?.role !== 'ADMIN' && (
            <>
              <Link
                to={user?.role === 'WORKER' ? '/worker-settings' : '/employer-settings'}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Settings size={20} />
                {!collapsed && <span className="text-sm font-medium">{t.settings}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {t.settings}
                  </div>
                )}
              </Link>
              <Link
                to="/help"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <HelpCircle size={20} />
                {!collapsed && <span className="text-sm font-medium">{t.help}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {t.help}
                  </div>
                )}
              </Link>
            </>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 group ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;