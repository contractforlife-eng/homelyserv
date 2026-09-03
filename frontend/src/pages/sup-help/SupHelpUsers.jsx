// Sup-Help Users Page - Safe user directory for Sup-Help
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SupportLayout from '../../layouts/SupportLayout';
import {
  Search,
  Mail,
  Shield,
  Filter,
  Eye,
  Home,
  Users,
  MessageCircle,
  FileText,
  Headphones
} from 'lucide-react';
import api from '../../utils/api';
import { getRoleBadgeClasses } from '../../utils/userDisplay';
import { UserAvatar, UserDisplayName } from '../../components/users';

const SupHelpUsers = () => {
  const { t: i18nT, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalUsers, setTotalUsers] = useState(0);
  const requestIdRef = useRef(0);

  const fetchUsers = async (page, requestId) => {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(pageSize));
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await api.get(`/api/sup-help/users?${params.toString()}`);

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
      console.error('Error fetching users:', error);
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

  const t = i18nT('supHelpUsersPage', { returnObjects: true });

  const getRoleBadgeColor = (role) => getRoleBadgeClasses(role);

  const getRoleLabel = (role) =>
    t.roleLabels[String(role || '').toUpperCase()] || t.roleLabels.USER;

  return (
    <SupportLayout
      allowedRoles={['SUPPORT_HELPER', 'ADMIN']}
      role="SUPPORT_HELPER"
      menuItems={[
        { id: 'dashboard', label: i18nT('supHelpNavigation.dashboard'), icon: Home, path: '/sup-help' },
        { id: 'users', label: i18nT('supportNavigation.users'), icon: Users, path: '/sup-help/users' },
        { id: 'messages', label: i18nT('supportNavigation.messages'), icon: MessageCircle, path: '/sup-help/messages' },
        { id: 'complaints', label: i18nT('supportNavigation.complaints'), icon: FileText, path: '/sup-help/complaints' },
        { id: 'live-support', label: i18nT('publicSupport.liveSupport'), icon: Headphones, path: '/sup-help/live-support' },
      ]}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
        </div>

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
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
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
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">{t.allRoles}</option>
                <option value="WORKER">{t.workers}</option>
                <option value="EMPLOYER">{t.employers}</option>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.actions}
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
                            className="border border-red-500/30"
                          />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <UserDisplayName user={user} />
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
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/sup-help/users/${user.id}`}
                          title="View profile"
                          aria-label={`View profile for ${user.fullName}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Eye size={18} />
                        </Link>
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
    </SupportLayout>
  );
};

export default SupHelpUsers;
