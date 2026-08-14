// frontend/src/components/users/UserProfileView.jsx
// ============================================================
// LAYOUT-INDEPENDENT USER PROFILE VIEW
// ============================================================
// Responsibilities:
//   - Fetch a user's profile by id
//   - Display profile information
//
// It is NOT responsible for:
//   - Authentication or session state
//   - Role switching / layout / chrome
//   - The currently logged-in user
//
// The viewed profile is stored ONLY in this component's local state
// (`profileUser`). It NEVER touches authStore.user.
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useDashboard } from '../layout/DashboardContext';
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
  Loader2,
  CheckCircle2,
  X,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../../utils/api';
import { ensureConversationExists } from '../../utils/chatService';
import {
  UserAvatar,
  UserStatsCard
} from './index';

const UserProfileView = ({ userId, backTarget, messageTarget = '/support-messages', variant = 'support' }) => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const dashboard = useDashboard();
  const { t: i18nT } = useTranslation();
  const t = i18nT('userProfileView', { returnObjects: true });

  const isAdmin = variant === 'admin';

  const routes = {
    complaints: isAdmin ? '/admin/complaints' : '/support-complaints',
    messages: isAdmin ? '/admin/messages' : '/support-messages',
  };

  const apiBase = isAdmin ? '/api/admin' : '/api/support';

  // The VIEWED profile — completely separate from the authenticated session.
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // ============================================================
  // LOAD PROFILE + STATS (read-only; never mutates auth state)
  // ============================================================
  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, statsRes] = await Promise.all([
        api.get(`${apiBase}/users/${userId}`),
        api.get(`/api/support/users/${userId}/stats`)
      ]);

      if (userRes.data?.success) {
        setProfileUser(userRes.data.user);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setNotification({ type: 'error', text: t.errors.loadProfile });
    } finally {
      setLoading(false);
    }
  }, [userId, apiBase]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ============================================================
  // SUSPEND / ACTIVATE
  // ============================================================
  const handleSuspend = async (suspend) => {
    if (!profileUser) return;
    setActionLoading(true);
    try {
      if (isAdmin) {
        const endpoint = suspend ? '/suspend' : '/activate';
        const response = await api.post(`${apiBase}/users/${profileUser.id}${endpoint}`, {
          reason: suspend ? 'Violation of terms of service' : 'Account reactivated'
        });

        if (response.data?.success) {
          setProfileUser(prev => ({
            ...prev,
            isSuspended: suspend,
            suspendedAt: suspend ? new Date().toISOString() : null,
            suspensionReason: suspend ? 'Violation of terms of service' : null
          }));
          setNotification({
            type: 'success',
            text: suspend ? t.feedback.suspended : t.feedback.activated
          });
        }
      } else {
        const response = await api.put(`${apiBase}/users/${profileUser.id}/suspend`, {
          suspend,
          reason: suspend ? 'Violation of terms of service' : 'Account reactivated by support'
        });

        if (response.data?.success) {
          setProfileUser(prev => ({
            ...prev,
            isSuspended: suspend,
            suspendedAt: suspend ? new Date().toISOString() : null,
            suspensionReason: suspend ? 'Violation of terms of service' : null
          }));
          setNotification({
            type: 'success',
            text: suspend ? t.feedback.suspended : t.feedback.activated
          });
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setNotification({ type: 'error', text: t.errors.updateStatus });
    } finally {
      setActionLoading(false);
    }
  };
  // ============================================================
  // RESET PASSWORD
  // ============================================================
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGenerateTempPassword = () => {
    const pwd = generateSecurePassword();
    setTempPassword(pwd);
    setNewPasswordInput(pwd);
    setShowPassword(false);
  };

  const handleResetPassword = async () => {
    if (!profileUser) return;
    setActionLoading(true);
    try {
      if (isAdmin) {
        const passwordToUse = tempPassword || newPasswordInput;
        if (!passwordToUse || passwordToUse.length < 6) {
          setNotification({ type: 'error', text: t.errors.passwordRequired });
          setActionLoading(false);
          return;
        }

        const response = await api.put(`${apiBase}/users/${profileUser.id}/reset-password`, {
          newPassword: passwordToUse,
          reason: resetReason || 'Password reset requested by administrator'
        });

        if (response.data?.success) {
          setTempPassword(passwordToUse);
          setShowPassword(false);
          setNewPasswordInput('');
          setResetReason('');
          setNotification({ type: 'success', text: t.feedback.passwordReset });
        } else {
          setNotification({ type: 'error', text: response.data?.message || t.errors.resetPassword });
        }
      } else {
        const response = await api.post(`${apiBase}/users/${profileUser.id}/reset-password`, {
          reason: resetReason || 'Password reset requested by support'
        });

        if (response.data?.success) {
          setNotification({ type: 'success', text: t.resetLinkSent });
          setShowResetModal(false);
          setResetReason('');
        }
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      if (isAdmin) {
        setNotification({ type: 'error', text: error.response?.data?.message || t.errors.resetPassword });
      } else {
        setNotification({ type: 'error', text: t.errors.sendResetLink });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setTempPassword('');
    setNewPasswordInput('');
    setShowPassword(false);
    setResetReason('');
  };

  // ============================================================
  // START CONVERSATION
  // ============================================================
  const handleStartConversation = async () => {
    if (!profileUser || !authUser) return;
    setActionLoading(true);
    try {
      if (isAdmin) {
        const targetUserId = profileUser?.id || profileUser?._id || userId;
        
        if (!targetUserId) {
          console.error('[ADMIN-START-CONVERSATION] Missing target user ID');
          setNotification({ type: 'error', text: t.errors.missingUserId });
          setActionLoading(false);
          return;
        }
        
        navigate('/admin/messages', { state: { targetUserId } });
      } else {
        await ensureConversationExists(
          authUser.id,
          authUser.fullName || 'Support',
          authUser.role || 'SUPPORT',
          profileUser.id,
          profileUser.fullName,
          profileUser.role
        );
        navigate(messageTarget);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setNotification({ type: 'error', text: t.errors.startConversation });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return t.never;
    return new Date(dateString).toLocaleDateString(dashboard?.language || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSuspensionReason = (reason) => t.suspensionReasons[reason] || reason;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setNotification({ type: 'success', text: t.copied });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 md:p-8">
      {/* Back button */}
      <button
        onClick={() => navigate(backTarget)}
        className={`mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition ${
          isAdmin
            ? 'hover:text-yellow-600 dark:hover:text-yellow-400'
            : 'hover:text-green-600 dark:hover:text-green-400'
        }`}
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
      ) : !profileUser ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.notFound}</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PROFILE HEADER */}
          <div className={`rounded-2xl p-6 text-white ${
            isAdmin
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
              : 'bg-gradient-to-r from-green-600 to-green-700'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <UserAvatar
                name={profileUser.fullName}
                image={profileUser.profileImage || null}
                role={profileUser.role}
                size="xl"
                className="border-4 border-white/30"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">{profileUser.fullName}</h1>
                   <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                     <Shield size={12} />
                     {t.roles[profileUser.role] || t.roles.user}
                   </span>
                   <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${profileUser.isSuspended ? 'bg-red-900/30 text-red-100' : profileUser.isVerified ? 'bg-green-900/30 text-green-100' : 'bg-white/20 text-white'}`}>
                     {profileUser.isSuspended ? t.status.suspended : profileUser.isVerified ? t.status.verified : t.status.active}
                   </span>
                </div>
                <p className="text-white/80 mt-1">{profileUser.email}</p>
                {profileUser.isSuspended && profileUser.suspensionReason && (
                  <p className="text-red-200 text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {formatSuspensionReason(profileUser.suspensionReason)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AUTHORITATIVE PREMIUM VISIBILITY (read-only) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={18} className="text-amber-500" />
                 {t.subscription.title}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <p className="text-xs text-gray-500 dark:text-gray-400">{t.subscription.status}</p>
                <p className={`text-sm font-semibold mt-1 ${profileUser.subscription?.isPremium ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>
                   {profileUser.subscription?.isPremium ? t.subscription.active : t.subscription.inactive}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <p className="text-xs text-gray-500 dark:text-gray-400">{t.subscription.expiry}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.subscription?.endDate ? formatDate(profileUser.subscription.endDate) : t.notProvided}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <p className="text-xs text-gray-500 dark:text-gray-400">{t.subscription.latestPlan}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {profileUser.subscription?.latestPlan
                     ? t.subscription.plans[profileUser.subscription.latestPlan] || t.subscription.plans.legacy_unknown
                     : t.subscription.unavailable}
                </p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t.subscription.history}</p>
              {profileUser.subscription?.grants?.length > 0 ? (
                <div className="space-y-2">
                  {profileUser.subscription.grants.map((grant, index) => (
                    <div key={`${grant.createdAt}-${index}`} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2" dir="ltr">
                      {t.subscription.plans[grant.plan] || t.subscription.plans.legacy_unknown} · {grant.durationDays} {t.subscription.days} · {formatDate(grant.startsAt)} → {formatDate(grant.endsAt)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.subscription.noGrants}</p>
              )}
            </div>
          </div>

          {/* ACCOUNT INFO */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-green-600" />
                {t.accountInfo}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail size={12} />{t.email}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 break-all">{profileUser.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone size={12} />{t.phone}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.phone || t.notProvided}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={12} />{t.country}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.city || t.notProvided}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Globe size={12} />{t.language}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{t.languages[profileUser.language] || t.languages.en}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={12} />{t.registered}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(profileUser.createdAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={12} />{t.lastLogin}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(profileUser.lastLogin)}</p>
              </div>
            </div>
          </div>

          {/* WORKER PROFILE */}
          {profileUser.WorkerProfile && (
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.WorkerProfile.category || t.notProvided}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.experience}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                     {profileUser.WorkerProfile.experienceYears != null ? t.experienceYears.replace('{{count}}', profileUser.WorkerProfile.experienceYears) : t.notProvided}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.skills}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profileUser.WorkerProfile.skills && profileUser.WorkerProfile.skills.length > 0 ? (
                      profileUser.WorkerProfile.skills.slice(0, 5).map((skill, i) => (
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

          {/* EMPLOYER PROFILE */}
          {profileUser.EmployerProfile && (
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.EmployerProfile.companyName || t.notProvided}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.industry}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{profileUser.EmployerProfile.industry || t.notProvided}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.registered}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(profileUser.createdAt)}</p>
                </div>
              </div>
            </div>
          )}

          {/* STATISTICS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-green-600" />
              {t.statistics}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <UserStatsCard label={t.complaints} value={stats?.complaintsCount || 0} icon={AlertTriangle} color="text-red-600" bg="bg-red-50 dark:bg-red-900/30" />
              <UserStatsCard label={t.messages} value={stats?.messagesCount || 0} icon={MessageCircle} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/30" />
              <UserStatsCard label={t.hires} value={stats?.hiresCount || 0} icon={Briefcase} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/30" />
              <UserStatsCard label={t.offers} value={stats?.offersCount || 0} icon={FileText} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/30" />
              <UserStatsCard label={t.payments} value={stats?.paymentsCount || 0} icon={CreditCard} color="text-teal-600" bg="bg-teal-50 dark:bg-teal-900/30" />
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-green-600" />
              {t.quickActions}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileUser.role !== 'ADMIN' && (
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                       {isAdmin ? t.setTemporaryPasswordDescription : t.generateTemporaryPasswordDescription}
                    </p>
                  </div>
                </button>
              )}

              {profileUser.role !== 'ADMIN' && (
                profileUser.isSuspended ? (
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.activateAccount}</p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.suspendAccount}</p>
                    </div>
                  </button>
                )
              )}

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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.startConversation}</p>
                </div>
              </button>

              <Link
                to={`${routes.complaints}?userId=${profileUser.id}`}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-500/40 hover:shadow-md transition"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{t.openComplaints}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.openComplaints}</p>
                </div>
              </Link>
            </div>
          </div>

          {profileUser.role === 'ADMIN' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 flex items-center gap-2">
              <Shield size={18} className="text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{t.adminProtected}</p>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showResetModal && profileUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={20} className="text-yellow-500" />
                 {isAdmin ? t.setTemporaryPassword : t.sendResetLink}
              </h3>
              <button
                onClick={closeResetModal}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isAdmin ? (
                <>
                  {tempPassword ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          {t.feedback.passwordReset}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-gray-300">
                          {t.temporaryPasswordFor} <span className="font-semibold text-white">{profileUser.email}</span>:
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={tempPassword}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
                            title={showPassword ? t.hidePassword : t.showPassword}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(tempPassword)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
                            title={t.copyTempPassword}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {t.shareTemporaryPassword}
                      </p>
                      <button
                        onClick={closeResetModal}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg transition"
                      >
                        {t.done}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-gray-300">
                          {t.setTemporaryPasswordFor} <span className="font-semibold text-white">{profileUser.email}</span>.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t.changeOnNextLogin}
                        </p>
                      </div>

                      {notification?.type === 'error' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                          <AlertTriangle size={16} />
                          {notification.text}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.tempPasswordLabel}
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder={t.passwordPlaceholder}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.minPasswordLength}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          {showPassword ? t.hidePassword : t.showPassword}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateTempPassword}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                        >
                          <Key size={16} />
                          {t.generatePassword}
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.resetReason}
                        </label>
                        <input
                          type="text"
                          value={resetReason}
                          onChange={(e) => setResetReason(e.target.value)}
                          placeholder={t.resetReasonPlaceholder}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={closeResetModal}
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
                </>
              ) : (
                <>
                  {notification?.type === 'success' && notification?.text === t.resetLinkSent ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          {t.resetLinkSent}
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        {t.resetLinkInfo} <span className="font-semibold">{profileUser.email}</span>.
                      </p>
                      <button
                        onClick={closeResetModal}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition"
                      >
                        {t.done}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-gray-300">
                          {t.sendSecureResetLinkTo} <span className="font-semibold text-white">{profileUser.email}</span>.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t.userWillChoose}
                        </p>
                      </div>

                      {notification?.type === 'error' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                          <AlertTriangle size={16} />
                          {notification.text}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.resetReason}
                        </label>
                        <input
                          type="text"
                          value={resetReason}
                          onChange={(e) => setResetReason(e.target.value)}
                          placeholder={t.resetReasonPlaceholder}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={closeResetModal}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleResetPassword}
                          disabled={actionLoading}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                          {t.sendResetLink}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileView;
