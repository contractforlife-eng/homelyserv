// src/pages/AdminUsers.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { getRoleLabel, getRoleColor } from '../utils/userDisplay';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';
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
  Search,
  Filter,
  Shield,
  User as UserIcon,
  AlertTriangle,
  BarChart3,
  FileCheck,
  CheckCircle,
  Crown,
  DollarSign,
  RefreshCw,
  Lock,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

// ============================================================
// MAIN ADMIN USERS COMPONENT
// ============================================================
const AdminUsers = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const translations = {
    en: {
      title: 'User Management',
      subtitle: 'Manage all users on the platform',
      stats: {
        total: 'Total Users',
        workers: 'Workers',
        employers: 'Employers',
        admins: 'Admins',
        active: 'Active',
        suspended: 'Suspended',
        paused: 'Paused'
      },
      table: {
        name: 'Name',
        email: 'Email',
        role: 'Role',
        phone: 'Phone',
        location: 'Location',
        status: 'Status',
        actions: 'Actions',
        noResults: 'No users found',
        searchPlaceholder: 'Search users...'
      },
      filters: {
        all: 'All Users',
        worker: 'Workers',
        employer: 'Employers',
        admin: 'Admins',
        allStatus: 'All Statuses',
        active: 'Active',
        suspended: 'Suspended'
      },
      actions: {
        changeRole: 'Change Role',
        suspend: 'Suspend',
        activate: 'Activate',
        pause: 'Pause',
        resetPassword: 'Reset Password',
        generatePassword: 'Generate Password',
        useCustomPassword: 'Use Custom Password',
        password: 'Password',
        passwordStatus: 'Password Status',
        confirmNewPassword: 'Confirm New Password',
        tempPassword: 'Temporary Password',
        copyPassword: 'Copy Password',
        passwordSet: 'Set',
        passwordNotSet: 'Not Set'
      },
      status: {
        active: 'Active',
        suspended: 'Suspended',
        paused: 'Paused'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading users...'
    },
    ar: {
      title: 'إدارة المستخدمين',
      subtitle: 'إدارة جميع المستخدمين على المنصة',
      stats: {
        total: 'إجمالي المستخدمين',
        workers: 'عمال',
        employers: 'أصحاب عمل',
        admins: 'مشرفين',
        active: 'نشط',
        suspended: 'معلق',
        paused: 'موقف مؤقتاً'
      },
      table: {
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        role: 'الدور',
        phone: 'الهاتف',
        location: 'الموقع',
        status: 'الحالة',
        actions: 'الإجراءات',
        noResults: 'لا يوجد مستخدمين',
        searchPlaceholder: 'ابحث عن مستخدمين...'
      },
      filters: {
        all: 'جميع المستخدمين',
        worker: 'عمال',
        employer: 'أصحاب عمل',
        admin: 'مشرفين',
        allStatus: 'جميع الحالات',
        active: 'نشط',
        suspended: 'معلق'
      },
      actions: {
        changeRole: 'تغيير الدور',
        suspend: 'تعليق',
        activate: 'تفعيل',
        pause: 'إيقاف مؤقت',
        resetPassword: 'إعادة تعيين كلمة المرور',
        generatePassword: 'توليد كلمة مرور',
        useCustomPassword: 'استخدام كلمة مرور مخصصة',
        password: 'كلمة المرور',
        passwordStatus: 'حالة كلمة المرور',
        confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
        tempPassword: 'كلمة المرور المؤقتة',
        copyPassword: 'نسخ كلمة المرور',
        passwordSet: 'محددة',
        passwordNotSet: 'غير محددة'
      },
      status: {
        active: 'نشط',
        suspended: 'معلق',
        paused: 'موقف مؤقتاً'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل المستخدمين...'
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
    loadUsers();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      
      if (response.data.success) {
        const fetchedUsers = response.data.users || [];
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        console.log('✅ Loaded users from MongoDB:', fetchedUsers.length);
      }
    } catch (error) {
      console.error('❌ Failed loading users from backend:', error);
    }
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter.toUpperCase());
    }

    if (statusFilter === 'suspended') {
      filtered = filtered.filter(u => u.isSuspended === true || u.status === 'suspended');
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.isSuspended !== true && u.status !== 'suspended');
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.toLowerCase().includes(searchLower) ||
        u.city?.toLowerCase().includes(searchLower) ||
        u.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, statusFilter, searchTerm]);

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

  const updateUserRole = (userId, newRole) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
  };

  const updateUserStatus = (userId, newStatus) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      suspended: 'bg-red-500/20 text-red-400',
      paused: 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getRoleColorClass = (role) => {
    const color = getRoleColor(role);
    const colors = {
      purple: 'text-purple-400',
      green: 'text-green-400',
      blue: 'text-blue-400',
      orange: 'text-orange-400',
      gray: 'text-gray-400 dark:text-gray-500'
    };
    return colors[color] || colors.gray;
  };

  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openPasswordModal = (user) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setGeneratedPassword('');
    setShowGeneratedPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setSelectedUserForReset(null);
    setNewPassword('');
    setGeneratedPassword('');
    setShowGeneratedPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword();
    setGeneratedPassword(pwd);
    setNewPassword(pwd);
    setShowGeneratedPassword(true);
    setPasswordError('');
  };

  const handleResetPassword = async () => {
    if (!selectedUserForReset) return;
    
    const passwordToUse = generatedPassword || newPassword;
    
    if (!passwordToUse || passwordToUse.length < 6) {
      setPasswordError(t('actions.passwordNotSet') + ' - Password must be at least 6 characters');
      return;
    }

    setIsResettingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const response = await api.put(`/api/admin/users/${selectedUserForReset.id}/reset-password`, {
        newPassword: passwordToUse
      });

      if (response.data.success) {
        setPasswordSuccess('Password reset successfully');
        setGeneratedPassword(passwordToUse);
        setShowGeneratedPassword(true);
        setNewPassword('');
        
        const updatedUsers = users.map(u => {
          if (u.id === selectedUserForReset.id) {
            return { ...u, passwordResetAt: new Date(), mustChangePassword: true };
          }
          return u;
        });
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
      } else {
        setPasswordError(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const stats = {
    total: users.length,
    workers: users.filter(u => u.role === 'WORKER').length,
    employers: users.filter(u => u.role === 'EMPLOYER').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    active: users.filter(u => u.isSuspended !== true && u.status !== 'suspended').length,
    suspended: users.filter(u => u.isSuspended === true || u.status === 'suspended').length,
    paused: users.filter(u => u.status === 'paused').length
  };

  if (authLoading) {
    return <PageLoader text={t.loading} fullScreen />;
  }

  if (!user) {
    return null;
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.workers}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <UserCheck size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.workers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.employers}</p>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Briefcase size={20} className="text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.employers}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.admins}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.admins}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.active}</p>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Play size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.suspended}</p>
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Pause size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.suspended}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.paused}</p>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.paused}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t.table.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="worker">{t.filters.worker}</option>
                  <option value="employer">{t.filters.employer}</option>
                  <option value="admin">{t.filters.admin}</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="all">{t.filters.allStatus}</option>
                  <option value="active">{t.filters.active}</option>
                  <option value="suspended">{t.filters.suspended}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Showing <span className="font-semibold text-white">{filteredUsers.length}</span> users
            </p>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t.table.noResults}
              description="No users match the current search or filters"
            />
          ) : (
            <div className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#0a0a0a] border-b border-yellow-500/20">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">User</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Password</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.table.actions}</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-yellow-500/10">
                    {filteredUsers.map((u) => (
                      <tr key={u._id || u.id || u.email} className="hover:bg-yellow-500/5 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                              <UserIcon size={16} className="text-yellow-400" />
                            </div>
                            <span className="text-white font-medium">{u.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${getRoleColorClass(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{u.phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{u.location || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(u.isSuspended === true || u.status === 'suspended' ? 'suspended' : 'active')}`}>
                            {u.isSuspended === true || u.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Lock size={14} className="text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {u.mustChangePassword ? 'Needs reset' : 'Password: ********'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {/* Reset Password */}
                            <button
                              onClick={() => openPasswordModal(u)}
                              className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition flex items-center gap-1"
                            >
                              <Key size={12} />
                              {t.actions.resetPassword}
                            </button>
                            
                            {/* Change Role */}
                            <select
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              value={u.role}
                              className="px-2 py-1 bg-[#0a0a0a] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            >
                              <option value="WORKER">{getRoleLabel('WORKER')}</option>
                              <option value="EMPLOYER">{getRoleLabel('EMPLOYER')}</option>
                              <option value="ADMIN">{getRoleLabel('ADMIN')}</option>
                            </select>
                            
                            {/* Status Buttons */}
                            {u.status !== 'suspended' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'suspended')}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition"
                              >
                                Suspend
                              </button>
                            )}
                            {u.status !== 'active' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'active')}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition"
                              >
                                Activate
                              </button>
                            )}
                            {u.status !== 'paused' && u.status !== 'suspended' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'paused')}
                                className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition"
                              >
                                Pause
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Password Reset Modal */}
        {passwordModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-yellow-500/20 w-full max-w-md">
              <div className="p-6 border-b border-yellow-500/20 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Lock size={20} className="text-yellow-500" />
                  {t.actions.resetPassword}
                </h3>
                <button
                  onClick={closePasswordModal}
                  className="p-1 rounded-lg hover:bg-yellow-500/10 transition text-gray-400 dark:text-gray-500 hover:text-yellow-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {passwordSuccess ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                        <CheckCircle size={16} />
                        {passwordSuccess}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        {t.actions.tempPassword}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/30 px-3 py-2 rounded text-yellow-400 text-sm font-mono break-all">
                          {showGeneratedPassword ? generatedPassword : '********'}
                        </code>
                        <button
                          onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                          className="p-2 rounded-lg hover:bg-yellow-500/10 transition text-gray-400 dark:text-gray-500 hover:text-yellow-500"
                          title={showGeneratedPassword ? 'Hide' : 'Show'}
                        >
                          {showGeneratedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(generatedPassword)}
                          className="p-2 rounded-lg hover:bg-yellow-500/10 transition text-gray-400 dark:text-gray-500 hover:text-yellow-500"
                          title={t.actions.copyPassword}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
                        Share this password with the user securely. They will be required to change it on next login.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-gray-300">
                        Resetting password for: <span className="font-semibold text-white">{selectedUserForReset?.fullName}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{selectedUserForReset?.email}</p>
                    </div>

                    {passwordError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        {t.actions.password}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showGeneratedPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                          className="px-3 py-2.5 rounded-lg border border-gray-700 hover:bg-yellow-500/10 transition text-gray-400 dark:text-gray-500 hover:text-yellow-500"
                          title={showGeneratedPassword ? 'Hide' : 'Show'}
                        >
                          {showGeneratedPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="flex-1 px-4 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Key size={16} />
                          {t.actions.generatePassword}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!passwordSuccess && (
                <div className="p-6 border-t border-yellow-500/20 flex justify-end gap-3">
                  <button
                    onClick={closePasswordModal}
                    disabled={isResettingPassword}
                    className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {isResettingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="p-6 border-t border-yellow-500/20 flex justify-end">
                  <button
                    onClick={closePasswordModal}
                    className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
