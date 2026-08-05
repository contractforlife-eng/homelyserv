// frontend/src/pages/support/SupportUserProfile.jsx
// ============================================================
// DEDICATED USER PROFILE PAGE FOR SUPPORT
// Route: /support/users/:id
//
// Permissions (SUPPORT):
//   Allowed:    View users, Reset password, Suspend/Activate,
//               Start conversation, View complaints
//   Not allowed: Delete users, Change roles, Promote to admin,
//               Access system settings
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Key,
  Pause,
  Play,
  MessageSquare,
  FileText,
  AlertTriangle,
  Briefcase,
  CreditCard,
  MessageCircle,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { ensureConversationExists } from '../../utils/chatService';
import {
  UserAvatar,
  UserRoleBadge,
  UserStatusBadge,
  UserStatsCard
} from '../../components/users';

const SupportUserProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const dashboard = useDashboard();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [tempPassword, setTempPassword] = useState(null);

  // ============================================================
  // AUTH CHECK
  // ============================================================
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'SUPPORT' && authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // ============================================================
  // LOAD USER + STATS
  // ============================================================
  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userRes, statsRes] = await Promise.all([
        api.get(`/api/support/users/${id}`),
        api.get(`/api/support/users/${id}/stats`)
      ]);

      if (userRes.data?.success) {
        setUser(userRes.data.user);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      setNotification({ type: 'error', text: 'Failed to load user profile' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ============================================================
  // SUSPEND / ACTIVATE
  // ============================================================
  const handleSuspend = async (suspend) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const response = await api.put(`/api/support/users/${user.id}/suspend`, {
        suspend,
        reason: suspend ? 'Violation of terms of service' : 'Account reactivated by support'
      });

      if (response.data?.success) {
        setUser(prev => ({
          ...prev,
          isSuspended: suspend,
          suspendedAt: suspend ? new Date().toISOString() : null,
          suspensionReason: suspend ? 'Violation of terms of service' : null
        }));
        setNotification({
          type: 'success',
          text: suspend ? 'User suspended successfully' : 'User activated successfully'
        });
      }
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      setNotification({ type: 'error', text: 'Failed to update user status' });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // RESET PASSWORD
  // ============================================================
  const handleResetPassword = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/api/support/users/${user.id}/reset-password`, {
        reason: resetReason || 'Password reset by support'
      });

      if (response.data?.success) {
        setTempPassword(response.data.tempPassword);
        setNotification({ type: 'success', text: 'Password reset successfully' });
      }
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      setNotification({ type: 'error', text: 'Failed to reset password' });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // START CONVERSATION
  // ============================================================
  const handleStartConversation = async () => {
    if (!user || !authUser) return;
    setActionLoading(true);
    try {
      const conversationId = await ensureConversationExists(
        authUser.id,
        authUser.fullName || 'Support',
        'SUPPORT',
        user.id,
        user.fullName,
        user.role
      );
      navigate('/support-messages');
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      setNotification({ type: 'error', text: 'Failed to start conversation' });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    en: {
      back: 'Back to Users',
      notFound: 'User not found',
      loading: 'Loading user profile...',
      accountInfo: 'Account Information',
      contactInfo: 'Contact Information',
      statistics: 'Statistics',
      quickActions: 'Quick Actions',
      email: 'Email',
      phone: 'Phone',
      country: 'Country',
      language: 'Preferred Language',
      registered: 'Registration Date',
      lastLogin: 'Last Login',
      never: 'Never',
      notProvided: 'Not provided',
      complaints: 'Complaints',
      messages: 'Messages',
      hires: 'Hires',
      offers: 'Offers',
      payments: 'Payments',
      resetPassword: 'Reset Password',
      suspendAccount: 'Suspend Account',
      activateAccount: 'Activate Account',
      startConversation: 'Start Conversation',
      openComplaints: 'Open User Complaints',
      resetReason: 'Reason (optional)',
      cancel: 'Cancel',
      confirmReset: 'Reset Password',
      tempPasswordLabel: 'Temporary Password',
      copyTempPassword: 'Copy temporary password',
      copied: 'Copied!',
      done: 'Done',
      adminProtected: 'Admin accounts cannot be modified by support',
      workerProfile: 'Worker Profile',
      employerProfile: 'Employer Profile',
      category: 'Category',
      experience: 'Experience',
      skills: 'Skills',
      company: 'Company',
      industry: 'Industry',
      noSkills: 'No skills listed'
    },
    ar: {
      back: 'العودة إلى المستخدمين',
      notFound: 'المستخدم غير موجود',
      loading: 'جاري تحميل ملف المستخدم...',
      accountInfo: 'معلومات الحساب',
      contactInfo: 'معلومات الاتصال',
      statistics: 'الإحصائيات',
      quickActions: 'إجراءات سريعة',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      country: 'البلد',
      language: 'اللغة المفضلة',
      registered: 'تاريخ التسجيل',
      lastLogin: 'آخر تسجيل دخول',
      never: 'أبداً',
      notProvided: 'غير متوفر',
      complaints: 'الشكاوى',
      messages: 'الرسائل',
      hires: 'التوظيفات',
      offers: 'العروض',
      payments: 'المدفوعات',
      resetPassword: 'إعادة تعيين كلمة المرور',
      suspendAccount: 'إيقاف الحساب',
      activateAccount: 'تفعيل الحساب',
      startConversation: 'بدء محادثة',
      openComplaints: 'عرض شكاوى المستخدم',
      resetReason: 'السبب (اختياري)',
      cancel: 'إلغاء',
      confirmReset: 'إعادة تعيين',
      tempPasswordLabel: 'كلمة المرور المؤقتة',
      copyTempPassword: 'نسخ كلمة المرور المؤقتة',
      copied: 'تم النسخ!',
      done: 'تم',
      adminProtected: 'لا يمكن تعديل حسابات المديرين بواسطة الدعم',
      workerProfile: 'ملف العامل',
      employerProfile: 'ملف صاحب العمل',
      category: 'الفئة',
      experience: 'الخبرة',
      skills: 'المهارات',
      company: 'الشركة',
      industry: 'المجال',
      noSkills: 'لا توجد مهارات'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const formatDate = (dateString) => {
    if (!dateString) return t.never;
    return new Date(dateString).toLocaleDateString(dashboard.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setNotification({ type: 'success', text: t.copied });
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/support-users')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
        >
          <ArrowLeft size={16} />
          {t.back}
        </button>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            <AlertTriangle size={18} />
            {notification.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <Loader2 size={32} className="animate-spin mx-auto text-green-600" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
          </div>
        ) : !user ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.notFound}</h3>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ============================================
                PROFILE HEADER
                ============================================ */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <UserAvatar
                  name={user.fullName}
                  image={user.image || null}
                  role={user.role}
                  size="xl"
                  className="border-4 border-white/30"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold">{user.fullName}</h1>
                    <UserRoleBadge role={user.role} />
                    <UserStatusBadge isVerified={user.isVerified} isSuspended={user.isSuspended} />
                  </div>
                  <p className="text-white/80 mt-1">{user.email}</p>
                  {user.isSuspended && user.suspensionReason && (
                    <p className="text-red-200 text-sm mt-2 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {user.suspensionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================
                ACCOUNT INFO
                ============================================ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield size={18} className="text-green-600" />
                  {t.accountInfo}
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail size={12} />
                    {t.email}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 break-all">{user.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Phone size={12} />
                    {t.phone}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{user.phone || t.notProvided}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={12} />
                    {t.country}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{user.city || t.notProvided}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Globe size={12} />
                    {t.language}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 uppercase">{user.language || 'en'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {t.registered}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(user.createdAt)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {t.lastLogin}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>

            {/* ============================================
                WORKER / EMPLOYER PROFILE (if available)
                ============================================ */}
            {user.WorkerProfile && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-green-600" />
                    {t.workerProfile}
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{user.WorkerProfile.category || t.notProvided}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.experience}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {user.WorkerProfile.experienceYears != null ? `${user.WorkerProfile.experienceYears} years` : t.notProvided}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.skills}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.WorkerProfile.skills && user.WorkerProfile.skills.length > 0 ? (
                        user.WorkerProfile.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.noSkills}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user.EmployerProfile && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-teal-600" />
                    {t.employerProfile}
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.company}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{user.EmployerProfile.companyName || t.notProvided}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.industry}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{user.EmployerProfile.industry || t.notProvided}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.registered}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================
                STATISTICS
                ============================================ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-green-600" />
                {t.statistics}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <UserStatsCard
                  label={t.complaints}
                  value={stats?.complaintsCount || 0}
                  icon={AlertTriangle}
                  color="text-red-600"
                  bg="bg-red-50 dark:bg-red-900/30"
                />
                <UserStatsCard
                  label={t.messages}
                  value={stats?.messagesCount || 0}
                  icon={MessageCircle}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/30"
                />
                <UserStatsCard
                  label={t.hires}
                  value={stats?.hiresCount || 0}
                  icon={Briefcase}
                  color="text-purple-600"
                  bg="bg-purple-50 dark:bg-purple-900/30"
                />
                <UserStatsCard
                  label={t.offers}
                  value={stats?.offersCount || 0}
                  icon={FileText}
                  color="text-orange-600"
                  bg="bg-orange-50 dark:bg-orange-900/30"
                />
                <UserStatsCard
                  label={t.payments}
                  value={stats?.paymentsCount || 0}
                  icon={CreditCard}
                  color="text-teal-600"
                  bg="bg-teal-50 dark:bg-teal-900/30"
                />
              </div>
            </div>

            {/* ============================================
                QUICK ACTIONS
                ============================================ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-green-600" />
                {t.quickActions}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Reset Password */}
                {user.role !== 'ADMIN' && (
                  <button
                    onClick={() => setShowResetModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-yellow-500/40 hover:shadow-md transition disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Key size={20} className="text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t.resetPassword}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Generate a temporary password</p>
                    </div>
                  </button>
                )}

                {/* Suspend / Activate */}
                {user.role !== 'ADMIN' && (
                  user.isSuspended ? (
                    <button
                      onClick={() => handleSuspend(false)}
                      disabled={actionLoading}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Play size={20} className="text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{t.activateAccount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reactivate this user's account</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(true)}
                      disabled={actionLoading}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-500/40 hover:shadow-md transition disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <Pause size={20} className="text-red-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{t.suspendAccount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Temporarily suspend this account</p>
                      </div>
                    </button>
                  )
                )}

                {/* Start Conversation */}
                <button
                  onClick={handleStartConversation}
                  disabled={actionLoading}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-500/40 hover:shadow-md transition disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{t.startConversation}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open a support chat with this user</p>
                  </div>
                </button>

                {/* Open User Complaints */}
                <Link
                  to={`/support-complaints?userId=${user.id}`}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-500/40 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{t.openComplaints}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View this user's complaints</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Admin protection notice */}
            {user.role === 'ADMIN' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 flex items-center gap-2">
                <Shield size={18} className="text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{t.adminProtected}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================
          PASSWORD RESET MODAL
          ============================================ */}
      {showResetModal && user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={20} className="text-yellow-500" />
                {t.resetPassword}
              </h3>
              <button
                onClick={() => { setShowResetModal(false); setTempPassword(null); setResetReason(''); }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {tempPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      {t.tempPasswordLabel}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/5 dark:bg-black/30 px-3 py-2 rounded text-yellow-600 dark:text-yellow-400 text-sm font-mono break-all">
                        {tempPassword}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tempPassword)}
                        className="p-2 rounded-lg hover:bg-yellow-500/10 transition text-gray-500 dark:text-gray-400 hover:text-yellow-600"
                        title={t.copyTempPassword}
                      >
                        <Key size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Share this password with the user securely. They will be required to change it on next login.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowResetModal(false); setTempPassword(null); setResetReason(''); }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition"
                  >
                    {t.done}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Resetting password for: <span className="font-semibold text-gray-900 dark:text-white">{user.fullName}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.resetReason}</label>
                    <input
                      type="text"
                      value={resetReason}
                      onChange={(e) => setResetReason(e.target.value)}
                      placeholder="Enter reason for password reset..."
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setShowResetModal(false); setTempPassword(null); setResetReason(''); }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                      {t.confirmReset}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SupportLayout>
  );
};

export default SupportUserProfile;