// Support Users Page - Safe user discovery for support communication
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SupportLayout from '../../layouts/SupportLayout';
import {
  Search,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Filter,
  Key,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { getRoleBadgeClasses } from '../../utils/userDisplay';
import { UserAvatar, UserDisplayName } from '../../components/users';

const SupportUsers = () => {
  const { t: i18nT, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [resetReason, setResetReason] = useState('');
  const requestIdRef = useRef(0);

  const fetchUsers = async (page, requestId) => {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(pageSize));
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await api.get(`/api/support/users?${params.toString()}`);

      if (requestId !== requestIdRef.current) return;

      if (response.data?.success) {
        setUsers(response.data.users);
        setTotalUsers(Number(response.data.total) || 0);
        const responsePage = Number(response.data.page) || 1;
        const responseLimit = Number(response.data.limit) || pageSize;
        const responseTotal = Number(response.data.total) || 0;
        const responseTotalPages = responseTotal > 0
          ? Math.ceil(responseTotal / responseLimit)
          : 1;
        setCurrentPage(Math.min(Math.max(responsePage, 1), responseTotalPages));
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const debounceTimer = setTimeout(() => {
      setLoading(true);
      fetchUsers(currentPage, requestId);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, roleFilter, currentPage]);

  const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / pageSize) : 0;

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
          text: suspend ? t.userSuspendedSuccess : t.userReactivatedSuccess
        });
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setNotification({
        type: 'error',
        text: t.updateStatusError
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
          text: t.resetLinkSuccess
        });
        setShowResetModal(null);
        setResetReason('');
      }
    } catch (error) {
      console.error('❌ Error sending reset link:', error);
      setNotification({
        type: 'error',
        text: t.resetLinkError
      });
    } finally {
      setActionLoading(null);
    }
  };

  const t = i18nT('supportUsersPage', { returnObjects: true });

  const getRoleBadgeColor = (role) => getRoleBadgeClasses(role);

  const getRoleLabel = (role) =>
    t.roleLabels[String(role || '').toUpperCase()] || t.roleLabels.USER;

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
    if (!dateString) return t.notAvailable;
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return new Date(dateString).toLocaleDateString(locales[i18n.resolvedLanguage] || locales.en, {
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
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
            {t.totalUsers}: <span className="font-semibold">{totalUsers}</span>
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
                            <UserDisplayName user={user} />
                            {user.subscription?.isPremium && (
                              <div className="text-xs font-semibold text-amber-600 mt-0.5">
                                {t.premium} · {formatDate(user.subscription.endDate)}
                              </div>
                            )}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 0 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={loading || currentPage <= 1}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={loading || currentPage >= totalPages}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
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
                  placeholder={t.resetReasonPlaceholder}
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
