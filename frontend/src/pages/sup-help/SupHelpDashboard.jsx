// Sup-Help Dashboard - Phase 2A shared Support-style presentation
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import {
  Users,
  MessageCircle,
  AlertCircle,
  Shield,
  UserCheck,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  LifeBuoy,
  Flag,
  Timer,
  Inbox,
  AlertTriangle,
  MessageSquare,
  History,
  FileText,
  Loader2,
  ChevronRight,
  Home,
  Headphones
} from 'lucide-react';

const SupHelpDashboard = () => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);

  const t = i18nT('supHelpDashboard', { returnObjects: true });

  const formatTime = (dateString) => {
    if (!dateString) return t.notAvailable;
    const locales = {
      en: 'en-US',
      ar: 'ar-EG',
      fr: 'fr-FR',
      ru: 'ru-RU',
      tr: 'tr-TR',
      de: 'de-DE'
    };
    return new Date(dateString).toLocaleDateString(locales[i18n.resolvedLanguage] || locales.en, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityLabel = (priority) =>
    t.priorityLabels[String(priority || '').toLowerCase()] || t.unknownPriority;

  const getStatusLabel = (status) =>
    t.statusLabels[String(status || '').toUpperCase()] || t.unknownStatus;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const kpiCards = [
    {
      label: t.openTickets,
      value: 0,
      icon: Inbox,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: t.assignedToMe,
      value: 0,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: t.waitingForUser,
      value: 0,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      label: t.criticalTickets,
      value: 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/30',
    },
    {
      label: t.escalatedTickets,
      value: 0,
      icon: ArrowUpRight,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      label: t.resolvedToday,
      value: 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: t.avgFirstResponse,
      value: '0',
      icon: Timer,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    },
    {
      label: t.avgResolution,
      value: '0',
      icon: History,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/30',
    }
  ];

  const emptySection = (text) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );

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
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">
                {t.welcome} {authUser?.fullName || t.supportAgent}
              </h1>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <Loader2 size={32} className="animate-spin mx-auto text-red-600" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition h-full">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${card.bg}`}>
                      <card.icon size={22} className={card.color} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  {t.needsAttention}
                </h2>
              </div>
              {emptySection(t.noTickets)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-green-600" />
                    {t.myAssignedTickets}
                  </h2>
                </div>
                {emptySection(t.noTickets)}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-purple-600" />
                    {t.waitingTickets}
                  </h2>
                </div>
                {emptySection(t.noTickets)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <History size={18} className="text-green-600" />
                    {t.recentActivity}
                  </h2>
                </div>
                <div className="p-4">
                  {emptySection(t.noActivity)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    {t.recentConversations}
                  </h2>
                </div>
                <div className="p-4">
                  {emptySection(t.noConversations)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default SupHelpDashboard;
