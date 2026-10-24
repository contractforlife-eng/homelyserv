// src/pages/AdminUsers.jsx - MODERNIZED ADMIN USER MANAGEMENT
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';
import ActionMenuPortal from '../components/common/ActionMenuPortal';
import { UserDisplayName, UserAvatar } from '../components/users';
import VerifiedBadge from '../components/verification/VerifiedBadge';
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Briefcase,
  HardHat,
  X,
  Mail,
  Phone,
  MapPin,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Copy,
  RefreshCw,
  Lock,
  User as UserIcon,
  Users,
  Pause,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Globe,
  Smartphone,
  Apple,
  HelpCircle,
  Activity,
  Clock,
  Stethoscope,
  GraduationCap,
  School
} from 'lucide-react';

// ============================================================
// REUSABLE UI COMPONENTS
// ============================================================

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  </div>
);

const RoleBadge = ({ role, label }) => {
  const colors = {
    ADMIN: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    SUPPORT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    SUPPORT_HELPER: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    EMPLOYER: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    WORKER: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    DOCTOR: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
    TEACHER: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    STUDENT: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  };

  const icons = {
    ADMIN: Shield,
    SUPPORT: UserCheck,
    SUPPORT_HELPER: Shield,
    EMPLOYER: Briefcase,
    WORKER: HardHat,
    DOCTOR: Stethoscope,
    TEACHER: GraduationCap,
    STUDENT: School,
  };

  const Icon = icons[role] || UserIcon;
  const colorClass = colors[role] || colors.WORKER;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorClass}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

const StatusBadge = ({ isSuspended, isVerified, labels }) => {
  const suspended = isSuspended === true || String(isSuspended || '').toUpperCase() === 'SUSPENDED';

  if (suspended) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
        <UserX size={12} />
        {labels.suspended}
      </span>
    );
  }

  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
        <CheckCircle size={12} />
        {labels.verified}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
      {labels.active}
    </span>
  );
};

const formatLastActive = (dateString, lang = 'en') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return 'Just now';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Active just now';
  if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays === 1) return 'Last active yesterday';
  if (diffDays < 30) return `Last active ${diffDays}d ago`;

  return `Last active ${date.toLocaleDateString(lang)}`;
};

const PlatformIcon = ({ platform, lastActiveAt, appVersion, lang = 'en' }) => {
  const norm = String(platform || '').trim().toLowerCase();
  const activeLabel = formatLastActive(lastActiveAt, lang);

  const configs = {
    web: {
      label: 'Web',
      fullName: 'Web',
      icon: Globe,
      color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    },
    android: {
      label: 'Android',
      fullName: appVersion ? `Android App · v${appVersion}` : 'Android App',
      icon: Smartphone,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    },
    ios: {
      label: 'iOS',
      fullName: appVersion ? `iOS App · v${appVersion}` : 'iOS App',
      icon: Apple,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
    },
    unknown: {
      label: 'Unknown',
      fullName: 'Platform unknown',
      icon: HelpCircle,
      color: 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
  };

  const current = configs[norm] || configs.unknown;
  const Icon = current.icon;
  const tooltipText = activeLabel ? `${current.fullName} (Last active: ${activeLabel.toLowerCase()})` : current.fullName;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-help shrink-0 whitespace-nowrap ${current.color} transition-colors`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      <Icon size={12} className="shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};

const isSuspendedAccount = (user) => (
  user?.isSuspended === true || String(user?.status || '').toUpperCase() === 'SUSPENDED'
);

const isVerificationPending = (user) => (
  user?.verifiedProfileStatus === 'PENDING' ||
  user?.identityVerificationStatus === 'PENDING' ||
  user?.experienceVerificationStatus === 'PENDING' ||
  user?.certificatesVerificationStatus === 'PENDING'
);

const UserActionsMenu = ({ user, currentAdminId, isRootAdmin, onViewProfile, onChangeRole, onResetPassword, onSuspend, onActivate, labels }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const userId = user.id || user._id;
  const isSelf = String(userId) === String(currentAdminId);
  const isProtectedRoot = String(user.email || '').trim().toLowerCase() === 'emad@homelyserv.com';
  const normalizedUserRole = String(user.role || '').trim().toUpperCase();
  const canChangeRole = !isSelf && !isProtectedRoot && (normalizedUserRole !== 'ADMIN' || isRootAdmin);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={labels.actions}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* Rendered via portal so it can never be clipped by the table's
          overflow-x-auto / cards / sticky headers, and stays in viewport. */}
      <ActionMenuPortal
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={closeMenu}
        align="end"
        className="w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
      >
        <button
          onClick={() => { onViewProfile(user); closeMenu(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          role="menuitem"
        >
          <Eye size={14} />
          {labels.viewProfile}
        </button>
        {canChangeRole && (
          <button
            onClick={() => { onChangeRole(user); closeMenu(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <UserCog size={14} />
            {labels.changeRole}
          </button>
        )}
        {!isSelf && !isProtectedRoot && <button
          onClick={() => { onResetPassword(user); closeMenu(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          role="menuitem"
        >
          <Key size={14} />
          {labels.resetPassword}
        </button>}
        {!isSelf && !isProtectedRoot && (isSuspendedAccount(user) ? (
          <button
            onClick={() => { onActivate(user.id || user._id); closeMenu(); }}
            className="w-full text-left px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Play size={14} />
            {labels.activateAccount}
          </button>
        ) : (
          <button
            onClick={() => { onSuspend(user.id || user._id, true); closeMenu(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Pause size={14} />
            {labels.suspendAccount}
          </button>
        ))}
      </ActionMenuPortal>
    </>
  );
};

// ============================================================
// MAIN ADMIN USERS COMPONENT
// ============================================================
const AdminUsers = () => {
  const navigate = useNavigate();
  const { t: i18nT, i18n } = useTranslation();
  const t = i18nT('adminUsersPage', { returnObjects: true });
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState('');
  const [roleChangeSuccess, setRoleChangeSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);


  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const isRootAdmin = authUser?.authContext === 'ROOT_RECOVERY' || String(authUser?.email || '').trim().toLowerCase() === 'emad@homelyserv.com';

  useEffect(() => {
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
        console.log('✅ Loaded users from MongoDB:', fetchedUsers.length);
      }
    } catch (error) {
      console.error('❌ Failed loading users from backend:', error);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter.toUpperCase());
    }

    if (statusFilter === 'suspended') {
      filtered = filtered.filter(isSuspendedAccount);
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(u => !isSuspendedAccount(u));
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(u => {
        const p = String(u.lastPlatform || 'unknown').toLowerCase();
        return p === platformFilter.toLowerCase();
      });
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
    setCurrentPage(1);
  }, [users, roleFilter, statusFilter, platformFilter, searchTerm, pageSize]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    navigate('/login', { replace: true });
  };

  const updateUserRole = (userId, newRole) => {
    const targetId = String(userId);
    setUsers(prevUsers => prevUsers.map(u => {
      if (String(u.id || u._id) === targetId) {
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const updateUserStatus = (userId, suspended, reason = null) => {
    const updatedUsers = users.map(u => {
      if (String(u.id || u._id) === String(userId)) {
        return {
          ...u,
          isSuspended: suspended,
          status: suspended ? 'SUSPENDED' : 'ACTIVE',
          suspendedAt: suspended ? new Date().toISOString() : null,
          suspensionReason: suspended ? reason : null
        };
      }
      return u;
    });
    setUsers(updatedUsers);
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

  const openRoleChangeModal = (user) => {
    setSelectedUserForRole(user);
    const initialRole = String(user?.role || '').trim().toUpperCase();
    setSelectedRole(initialRole);
    setRoleChangeError('');
    setRoleModalOpen(true);
  };

  const closeRoleChangeModal = () => {
    setRoleModalOpen(false);
    setSelectedUserForRole(null);
    setSelectedRole('');
    setRoleChangeError('');
  };

  const handleChangeRole = async () => {
    if (!selectedUserForRole) return;

    const userId = selectedUserForRole._id || selectedUserForRole.id;
    const currentRole = String(selectedUserForRole?.role || '').trim().toUpperCase();
    const nextRole = String(selectedRole || '').trim().toUpperCase();

    if (!nextRole) {
      setRoleChangeError(t.changeRole.selectRoleError);
      return;
    }

    if (nextRole === currentRole) {
      return;
    }

    setIsChangingRole(true);
    setRoleChangeError('');
    try {
      const response = await api.put(`/api/admin/users/${userId}/role`, { newRole: nextRole });
      if (response.data.success) {
        const newRole = String(response.data.newRole || nextRole).toUpperCase();
        const changedName = selectedUserForRole.fullName || 'User';
        updateUserRole(userId, newRole);
        closeRoleChangeModal();
        setRoleChangeSuccess(`${t.changeRole.success} ${t.roles[newRole] || newRole} (${changedName})`);
        setTimeout(() => setRoleChangeSuccess(''), 5000);
      } else {
        setRoleChangeError(response.data.message || t.changeRole.error);
      }
    } catch (error) {
      const message = error.response?.data?.message || t.changeRole.error;
      setRoleChangeError(message);
      console.error('❌ Failed to change role:', error);
    } finally {
      setIsChangingRole(false);
    }
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
    const userId = selectedUserForReset._id || selectedUserForReset.id;
    
    if (!passwordToUse || passwordToUse.length < 6) {
      setPasswordError(t.actions.passwordRequired);
      return;
    }

    setIsResettingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const response = await api.put(`/api/admin/users/${userId}/reset-password`, {
        newPassword: passwordToUse,
        reason: resetReason || 'Password reset requested by administrator'
      });

      if (response.data.success) {
        setPasswordSuccess('Password reset successfully');
        setGeneratedPassword(passwordToUse);
        setShowGeneratedPassword(true);
        setNewPassword('');
        setResetReason('');
      } else {
        setPasswordError(response.data.message || t.actions.resetError);
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || t.actions.resetError);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleViewProfile = (user) => {
    const userId = user._id || user.id;
    navigate(`/admin/users/${userId}`);
  };

  const handleSuspend = async (userId, suspend) => {
    try {
      const reason = suspend ? 'Violation of terms of service' : 'Account reactivated';
      await api.post(`/api/admin/users/${userId}/suspend`, {
        reason
      });
      updateUserStatus(userId, suspend, reason);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.post(`/api/admin/users/${userId}/activate`);
      updateUserStatus(userId, false);
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPlatformFilter('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || platformFilter !== 'all';

  // Calculate stats
  const stats = {
    total: users.length,
    workers: users.filter(u => u.role === 'WORKER').length,
    employers: users.filter(u => u.role === 'EMPLOYER').length,
    doctors: users.filter(u => u.role === 'DOCTOR').length,
    teachers: users.filter(u => u.role === 'TEACHER').length,
    students: users.filter(u => u.role === 'STUDENT').length,
    support: users.filter(u => u.role === 'SUPPORT').length,
    supportHelper: users.filter(u => u.role === 'SUPPORT_HELPER').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    active: users.filter(u => !isSuspendedAccount(u)).length,
    suspended: users.filter(isSuspendedAccount).length,
  };

  if (authLoading) {
    return <PageLoader text={t.loading} fullScreen />;
  }

  if (!user) {
    return null;
  }

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  // Generate responsive page number range with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  };
  const pageNumbers = getPageNumbers();

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={user?.id || user?.email}
        variant="admin"
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Success Toast */}
        {roleChangeSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {roleChangeSuccess}
            <button
              onClick={() => setRoleChangeSuccess('')}
              className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={Users}
            label={t.stats.total}
            value={stats.total}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={HardHat}
            label={t.stats.workers}
            value={stats.workers}
            color="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
          <StatCard
            icon={Briefcase}
            label={t.stats.employers}
            value={stats.employers}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <StatCard
            icon={Stethoscope}
            label={t.stats.doctors}
            value={stats.doctors}
            color="text-cyan-600"
            bgColor="bg-cyan-50 dark:bg-cyan-900/20"
          />
          <StatCard
            icon={GraduationCap}
            label={t.stats.teachers}
            value={stats.teachers}
            color="text-violet-600"
            bgColor="bg-violet-50 dark:bg-violet-900/20"
          />
          <StatCard
            icon={School}
            label={t.stats.students}
            value={stats.students}
            color="text-indigo-600"
            bgColor="bg-indigo-50 dark:bg-indigo-900/20"
          />
          <StatCard
            icon={UserCheck}
            label={t.stats.support}
            value={stats.support}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={Shield}
            label={t.stats.supportHelper}
            value={stats.supportHelper}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-900/20"
          />
          <StatCard
            icon={Shield}
            label={t.stats.admins}
            value={stats.admins}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatCard
            icon={CheckCircle}
            label={t.stats.active}
            value={stats.active}
            color="text-emerald-600"
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatCard
            icon={UserX}
            label={t.stats.suspended}
            value={stats.suspended}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-900/20"
          />
        </div>

        {/* Search and Filters Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.table.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{t.filters.all}</option>
                <option value="worker">{t.filters.worker}</option>
                <option value="employer">{t.filters.employer}</option>
                <option value="doctor">{t.filters.doctor}</option>
                <option value="teacher">{t.filters.teacher}</option>
                <option value="student">{t.filters.student}</option>
                <option value="support">{t.filters.support}</option>
                <option value="support_helper">{t.filters.supportHelper}</option>
                <option value="admin">{t.filters.admin}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">{t.filters.allStatus}</option>
                <option value="active">{t.filters.active}</option>
                <option value="suspended">{t.filters.suspended}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Platform Filter */}
            <div className="relative">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="web">🌐 Web</option>
                <option value="android">📱 Android App</option>
                <option value="ios">🍎 iOS App</option>
                <option value="unknown">⚪ Unknown</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t.table.clearFilters}
              </button>
            )}
          </div>
        </div>

        {/* Users Section: Desktop Compact Table + Mobile Cards + Pagination */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t.table.noResults}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {hasActiveFilters ? t.table.adjustSearch : t.table.emptySystem}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block w-full max-w-full overflow-hidden border-t border-gray-200 dark:border-gray-700">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <tr>
                      <th className="text-left rtl:text-right px-4 py-2.5 whitespace-nowrap">
                        {t.table.user}
                      </th>
                      <th className="text-left rtl:text-right px-4 py-2.5 whitespace-nowrap">
                        {t.table.email}
                      </th>
                      <th className="text-left rtl:text-right px-4 py-2.5 whitespace-nowrap">
                        {t.table.role}
                      </th>
                      <th className="text-left rtl:text-right px-4 py-2.5 whitespace-nowrap">
                        {t.table.status}
                      </th>
                      <th className="text-left rtl:text-right px-4 py-2.5 whitespace-nowrap">
                        {t.table.joined}
                      </th>
                      <th className="text-right rtl:text-left px-4 py-2.5 whitespace-nowrap">
                        {t.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedUsers.map((u) => (
                      <tr key={u._id || u.id || u.email} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0">
                              <UserAvatar
                                name={u.fullName}
                                image={u.profileImage}
                                role={u.role}
                                size="md"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={u.fullName}>
                                  <UserDisplayName user={u} size="sm" />
                                </div>
                                {u.verifiedProfileStatus === 'VERIFIED' && (
                                  <VerifiedBadge isVerified={true} size="xs" />
                                )}
                                <PlatformIcon
                                  platform={u.lastPlatform}
                                  lastActiveAt={u.lastActiveAt}
                                  appVersion={u.lastAppVersion}
                                  lang={i18n.resolvedLanguage || 'en'}
                                />
                              </div>
                              {isVerificationPending(u) && (
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    <Clock size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span className="truncate">{i18nT('adminUsersPage.verificationRequested', 'Verified Profile review requested')}</span>
                                  </span>
                                </div>
                              )}
                              {String(u.email || '').trim().toLowerCase() === 'emad@homelyserv.com' && (
                                <p className="text-[11px] font-semibold text-purple-600 mt-0.5">Root Admin</p>
                              )}
                              {u.subscription?.isPremium && (
                                <p className="text-[11px] font-semibold text-amber-600 mt-0.5 truncate">
                                  {t.premiumActive} · {new Date(u.subscription.endDate).toLocaleDateString(i18n.resolvedLanguage || 'en')}
                                </p>
                              )}
                              {u.phone && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate" title={u.phone}>
                                  <Phone size={10} className="shrink-0" />
                                  <span className="truncate">{u.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 min-w-0" title={u.email}>
                            <Mail size={13} className="shrink-0 text-gray-400" />
                            <span className="truncate font-mono">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <RoleBadge role={u.role} label={t.roles[u.role] || t.roles.USER} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge isSuspended={isSuspendedAccount(u)} isVerified={u.emailVerified === true} labels={t.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString(i18n.resolvedLanguage || 'en') : t.notAvailable}
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left whitespace-nowrap">
                          <UserActionsMenu
                            user={u}
                            currentAdminId={user?.id || user?._id || authUser?.id || authUser?._id}
                            isRootAdmin={isRootAdmin}
                            onViewProfile={handleViewProfile}
                            onChangeRole={openRoleChangeModal}
                            onResetPassword={openPasswordModal}
                            onSuspend={handleSuspend}
                            onActivate={handleActivate}
                            labels={t.menu}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md) */}
              <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                {paginatedUsers.map((u) => (
                  <div key={u._id || u.id || u.email} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <UserAvatar
                          name={u.fullName}
                          image={u.profileImage}
                          role={u.role}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={u.fullName}>
                              <UserDisplayName user={u} size="sm" />
                            </div>
                            {u.verifiedProfileStatus === 'VERIFIED' && (
                              <VerifiedBadge isVerified={true} size="xs" />
                            )}
                            <PlatformIcon
                              platform={u.lastPlatform}
                              lastActiveAt={u.lastActiveAt}
                              appVersion={u.lastAppVersion}
                              lang={i18n.resolvedLanguage || 'en'}
                            />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={u.email}>
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate font-mono">{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={u.phone}>
                              <Phone size={12} className="shrink-0" />
                              <span className="truncate">{u.phone}</span>
                            </div>
                          )}
                          {String(u.email || '').trim().toLowerCase() === 'emad@homelyserv.com' && (
                            <p className="text-xs font-semibold text-purple-600 mt-0.5">Root Admin</p>
                          )}
                        </div>
                      </div>

                      {/* Actions Menu Trigger */}
                      <div className="shrink-0">
                        <UserActionsMenu
                          user={u}
                          currentAdminId={user?.id || user?._id || authUser?.id || authUser?._id}
                          isRootAdmin={isRootAdmin}
                          onViewProfile={handleViewProfile}
                          onChangeRole={openRoleChangeModal}
                          onResetPassword={openPasswordModal}
                          onSuspend={handleSuspend}
                          onActivate={handleActivate}
                          labels={t.menu}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} label={t.roles[u.role] || t.roles.USER} />
                        <StatusBadge isSuspended={isSuspendedAccount(u)} isVerified={u.emailVerified === true} labels={t.status} />
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t.table.joined}: </span>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(i18n.resolvedLanguage || 'en') : t.notAvailable}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 text-sm">
                {/* Page Size & Summary Count */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {i18nT('registrationGeography.pageOf', {
                      page: currentPage,
                      totalPages,
                      total: totalItems,
                      defaultValue: `Page ${currentPage} of ${totalPages} · ${totalItems} users`
                    })}
                  </span>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={i18nT('registrationGeography.previous', 'Previous')}
                  >
                    <ChevronLeft size={14} className="rtl:rotate-180" />
                    <span className="hidden sm:inline">{i18nT('registrationGeography.previous', 'Previous')}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 select-none">
                            …
                          </span>
                        );
                      }
                      const isCurrent = p === currentPage;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-yellow-500 text-black shadow-xs font-bold'
                              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={i18nT('registrationGeography.next', 'Next')}
                  >
                    <span className="hidden sm:inline">{i18nT('registrationGeography.next', 'Next')}</span>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={20} className="text-yellow-500" />
                {t.modal.resetPassword}
              </h3>
              <button
                onClick={closePasswordModal}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {passwordSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium flex items-center gap-2">
                      <CheckCircle size={16} />
                      {passwordSuccess}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                      {t.actions.tempPassword}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded text-yellow-700 dark:text-yellow-300 text-sm font-mono break-all border border-yellow-200 dark:border-yellow-700">
                        {showGeneratedPassword ? generatedPassword : '********'}
                      </code>
                      <button
                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                        className="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-gray-600 dark:text-gray-400"
                        title={showGeneratedPassword ? t.actions.hidePassword : t.actions.showPassword}
                      >
                        {showGeneratedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(generatedPassword)}
                        className="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-gray-600 dark:text-gray-400"
                        title={t.actions.copyPassword}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t.modal.sharePassword}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t.modal.resettingFor}: <span className="font-semibold text-gray-900 dark:text-white">{selectedUserForReset?.fullName}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Mail size={12} />
                      {selectedUserForReset?.email}
                    </p>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.modal.password}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={showGeneratedPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t.modal.passwordPlaceholder}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                        title={showGeneratedPassword ? t.actions.hidePassword : t.actions.showPassword}
                      >
                        {showGeneratedPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="w-full px-4 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} />
                      {t.modal.generatePassword}
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <Lock size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{t.modal.securityNote}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!passwordSuccess && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={closePasswordModal}
                  disabled={isResettingPassword}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {t.modal.cancel}
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t.modal.resetting}
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {t.modal.resetPasswordBtn}
                    </>
                  )}
                </button>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                >
                  {t.modal.done}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalOpen && selectedUserForRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCog size={20} className="text-yellow-500" />
                {t.changeRole.title}
              </h3>
              <button
                onClick={closeRoleChangeModal}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={selectedUserForRole.fullName}
                  image={selectedUserForRole.profileImage}
                  role={selectedUserForRole.role}
                  size="md"
                />
                <div className="min-w-0">
                  <UserDisplayName user={selectedUserForRole} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 break-all">
                    <Mail size={10} />
                    {selectedUserForRole.email}
                  </p>
                </div>
              </div>

              {/* Current role */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                  {t.changeRole.currentRole}
                </p>
                <RoleBadge role={selectedUserForRole.role} label={t.roles[selectedUserForRole.role] || t.roles.USER} />
              </div>

              {/* New role selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.changeRole.newRole}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    const currentRole = String(selectedUserForRole?.role || '').trim().toUpperCase();
                    const normalizedSelectedRole = String(selectedRole || '').trim().toUpperCase();
                    const roleOptions = isRootAdmin
                      ? ['ADMIN', 'SUPPORT_HELPER', 'WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT', 'SUPPORT']
                      : ['SUPPORT_HELPER', 'WORKER', 'EMPLOYER', 'DOCTOR', 'TEACHER', 'STUDENT', 'SUPPORT'];

                    return roleOptions.map((roleOption) => {
                      const isSelected = roleOption === normalizedSelectedRole;
                      return (
                        <button
                          key={roleOption}
                          type="button"
                          disabled={isChangingRole}
                          onClick={() => {
                            setSelectedRole(roleOption);
                            setRoleChangeError('');
                          }}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-400/20'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          }`}
                        >
                          {t.roles[roleOption] || roleOption}
                        </button>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  {t.changeRole.changingFor} {selectedUserForRole.fullName}
                </p>
              </div>

              {roleChangeError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {roleChangeError}
                </div>
              )}

              {/* Warning */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{t.changeRole.warning}</span>
                </p>
              </div>

              {/* Worker note */}
              {String(selectedRole || '').trim().toUpperCase() === 'WORKER' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <UserCog size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{t.changeRole.workerNote}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRoleChangeModal}
                disabled={isChangingRole}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {t.modal.cancel}
              </button>
              <button
                type="button"
                onClick={handleChangeRole}
                disabled={
                  isChangingRole ||
                  !selectedRole ||
                  String(selectedRole).trim().toUpperCase() === String(selectedUserForRole?.role || '').trim().toUpperCase()
                }
                className="px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isChangingRole ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t.changeRole.changing}
                  </>
                ) : (
                  <>
                    <UserCog size={16} />
                    {t.changeRole.confirm}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
