// src/pages/AdminDashboard.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  Globe,
  X,
  CreditCard,
  UserPlus,
  UserMinus,
  UserCheck,
  Pause,
  Play,
  Trash2,
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Download,
  FileText,
  MoreVertical,
  Shield,
  Award,
  TrendingUp,
  User as UserIcon,
  AlertTriangle,
  BarChart3,
  FileCheck,
  Crown,
  MessageSquare,
  CheckCheck,
  XCircle,
  RefreshCw
} from 'lucide-react';

// ============================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayments: 0,
    totalMessages: 0,
    pendingActions: 0,
    totalComplaints: 0,
    pendingComplaints: 0
  });

  const translations = {
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Manage your platform',
      stats: {
        users: 'Total Users',
        payments: 'Total Payments',
        messages: 'Messages',
        pending: 'Pending Actions',
        complaints: 'Total Complaints',
        pendingComplaints: 'Pending Complaints'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      manageUsers: 'Manage Users',
      viewMessages: 'View Messages',
      viewPayments: 'View Payments',
      viewComplaints: 'View Complaints',
      settings: 'Settings',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      noActivity: 'No recent activity',
    
    },
    ar: {
      title: 'لوحة تحكم المشرف',
      subtitle: 'إدارة منصتك',
      stats: {
        users: 'إجمالي المستخدمين',
        payments: 'إجمالي المدفوعات',
        messages: 'الرسائل',
        pending: 'إجراءات معلقة',
        complaints: 'إجمالي الشكاوى',
        pendingComplaints: 'شكاوى معلقة'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      manageUsers: 'إدارة المستخدمين',
      viewMessages: 'عرض الرسائل',
      viewPayments: 'عرض المدفوعات',
      viewComplaints: 'عرض الشكاوى',
      settings: 'الإعدادات',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      noActivity: 'لا يوجد نشاط حديث'
    }
  };

  const t = translations[language] || translations.en;

  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setUser(authUser);
    loadStats();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const loadStats = async () => {
    let users = [];

    try {
      const response = await api.get('/api/admin/users');

      if (response.data.success) {
        users = response.data.users || [];
      }

      console.log('✅ Loaded users from MongoDB:', users.length);

    } catch (error) {
      console.error('❌ Failed loading users from backend:', error);
    }

    // Get message stats from backend
    let totalMessages = 0;
    try {
      const msgResponse = await api.get('/api/chat/messages/stats');
      if (msgResponse.data.success) {
        totalMessages = msgResponse.data.totalMessages || 0;
      }
    } catch (error) {
      console.error('Error loading message stats:', error);
    }

    // Load complaints from all sources
    const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
    const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
    const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
    const allComplaints = [...employerComplaints, ...workerComplaints, ...adminComplaints];
    
    setStats({
      totalUsers: users.length,
      totalPayments: 0,
      totalMessages: totalMessages,
      pendingActions: 0,
      totalComplaints: allComplaints.length,
      pendingComplaints: allComplaints.filter(c => c.status === 'pending').length
    });
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={user?.id || user?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.users}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.payments}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalPayments}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.messages}</p>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalMessages}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.complaints}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalComplaints}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.pendingComplaints}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingComplaints}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-orange-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingActions}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-yellow-500/20 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
              >
                <Users size={20} className="text-blue-400" />
                <span className="font-medium text-blue-300">{t.manageUsers}</span>
              </Link>
              <Link
                to="/admin/messages"
                className="flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20"
              >
                <MessageCircle size={20} className="text-purple-400" />
                <span className="font-medium text-purple-300">{t.viewMessages}</span>
              </Link>
              <Link
                to="/admin/payments"
                className="flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
              >
                <CreditCard size={20} className="text-green-400" />
                <span className="font-medium text-green-300">{t.viewPayments}</span>
              </Link>
              <Link
                to="/admin/complaints"
                className="flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
              >
                <AlertTriangle size={20} className="text-red-400" />
                <span className="font-medium text-red-300">{t.viewComplaints}</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center gap-3 p-3 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/20"
              >
                <Settings size={20} className="text-yellow-400" />
                <span className="font-medium text-yellow-300">{t.settings}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.recentActivity}</h3>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.noActivity}</p>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
