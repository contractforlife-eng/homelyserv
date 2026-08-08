// Support Users Page - View users, suspend/reactivate, reset passwords
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
import {
  Search,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Filter,
  Pause,
  Play,
  Key,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { getRoleLabel, getRoleBadgeClasses } from '../../utils/userDisplay';
import { UserAvatar } from '../../components/users';

const SupportUsers = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const dashboard = useDashboard();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [resetReason, setResetReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await api.get(`/api/support/users?${params.toString()}`);

      if (response.data?.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, roleFilter]);

  const handleSuspend = async (userId, suspend) => {
    setActionLoading(userId);
    try {
      const response = await api.put(`/api/support/users/${userId}/suspend`, {
        suspend,
        reason: suspend ? 'Violation of terms of service' : 'Account reactivated by support'
      });

      if (response.data?.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isSuspended: suspend, suspendedAt: suspend ? new Date().toISOString() : null } : u
        ));
        setNotification({
          type: 'success',
          text: suspend ? 'User suspended successfully' : 'User reactivated successfully'
        });
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setNotification({
        type: 'error',
        text: 'Failed to update user status'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = 'Temp@';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPassword = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await api.post(`/api/support/users/${userId}/reset-password`, {
        reason: resetReason || 'Password reset requested by support'
      });

      if (response.data?.success) {
        setNotification({
          type: 'success',
          text: 'Password reset link sent successfully'
        });
        setShowResetModal(null);
        setResetReason('');
      }
    } catch (error) {
      console.error('❌ Error sending reset link:', error);
      setNotification({
        type: 'error',
        text: 'Failed to send reset link'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const translations = {
    en: {
      title: 'Users',
      subtitle: 'View and search users',
      searchPlaceholder: 'Search users...',
      filterByRole: 'Filter by role',
      allRoles: 'All Roles',
      workers: 'Workers',
      employers: 'Employers',
      support: 'Support',
      admin: 'Admin',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      joined: 'Joined',
      verified: 'Verified',
      suspended: 'Suspended',
      active: 'Active',
      loading: 'Loading...',
      noUsers: 'No users found',
      totalUsers: 'Total Users',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      resetPassword: 'Reset Password',
      viewProfile: 'View Profile',
      resetReason: 'Reason (optional)',
      confirmReset: 'Reset Password',
      cancel: 'Cancel',
      adminOnly: 'Admin accounts cannot be modified by support'
    },
    ar: {
      title: 'المستخدمين',
      subtitle: 'عرض والبحث عن المستخدمين',
      searchPlaceholder: 'البحث عن المستخدمين...',
      filterByRole: 'تصفية حسب الدور',
      allRoles: 'جميع الأدوار',
      workers: 'العمال',
      employers: 'أصحاب العمل',
      support: 'الدعم',
      admin: 'المديرين',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      joined: 'تاريخ الانضمام',
      verified: 'موثق',
      suspended: 'موقوف',
      active: 'نشط',
      loading: 'جاري التحميل...',
      noUsers: 'لم يتم العثور على مستخدمين',
      totalUsers: 'إجمالي المستخدمين',
      suspend: 'إيقاف',
      reactivate: 'إعادة تفعيل',
      resetPassword: 'إعادة تعيين كلمة المرور',
      viewProfile: 'عرض الملف',
      resetReason: 'السبب (اختياري)',
      confirmReset: 'إعادة تعيين',
      cancel: 'إلغاء',
      adminOnly: 'لا يمكن تعديل حسابات المديرين بواسطة الدعم'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const getRoleBadgeColor = (role) => getRoleBadgeClasses(role);

  const getStatusBadge = (isVerified, isSuspended) => {
    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <UserX size={12} />
          {t.suspended}
        </span>
      );
    }
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <UserCheck size={12} />
          {t.verified}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        {t.active}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(dashboard.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            <AlertCircle size={18} />
            {notification.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">{t.allRoles}</option>
                <option value="WORKER">{t.workers}</option>
                <option value="EMPLOYER">{t.employers}</option>
                <option value="SUPPORT">{t.support}</option>
                <option value="ADMIN">{t.admin}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t.totalUsers}: <span className="font-semibold">{users.length}</span>
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t.loading}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t.noUsers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.name}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.email}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.role}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.joined}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.actions || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.fullName}
                            image={user.profileImage || null}
                            role={user.role}
                            size="md"
                            className="border border-green-500/30"
                          />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail size={14} />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          <Shield size={12} />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.isVerified, user.isSuspended)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== 'ADMIN' && (
                            <>
                              {user.isSuspended ? (
                                <button
                                  onClick={() => handleSuspend(user.id, false)}
                                  disabled={actionLoading === user.id}
                                  className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                                  title={t.reactivate}
                                >
                                  <Play size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspend(user.id, true)}
                                  disabled={actionLoading === user.id}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                  title={t.suspend}
                                >
                                  <Pause size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => setShowResetModal(user.id)}
                                disabled={actionLoading === user.id}
                                className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors"
                                title={t.resetPassword}
                              >
                                <Key size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/support/users/${user.id}`)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={t.viewProfile}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={20} className="text-green-500" />
                {t.resetPassword}
              </h3>
              <button
                onClick={() => setShowResetModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.resetReason}</label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Enter reason for password reset..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowResetModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleResetPassword(showResetModal)}
                  disabled={actionLoading === showResetModal}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {t.confirmReset}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupportLayout>
  );
};

export default SupportUsers;
