// Support Dashboard Page - Production-ready support workspace
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
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
  ChevronRight
} from 'lucide-react';
import complaintsService from '../../services/complaintService';
import { getDisplayName } from '../../utils/userDisplay';
import { UserAvatar } from '../../components/users';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const dashboard = useDashboard();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await complaintsService.getSupportDashboard();
      if (response?.success) {
        setData(response);
      }
    } catch (error) {
      console.error('❌ Error fetching support dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ============================================================
  // TRANSLATIONS
  // ============================================================
  const translations = {
    en: {
      title: 'Support Dashboard',
      welcome: 'Welcome',
      subtitle: 'Monitor and manage user support',
      loading: 'Loading...',
      noData: 'No data available',
      openTickets: 'Open Tickets',
      assignedToMe: 'Assigned To Me',
      waitingForUser: 'Waiting For User',
      criticalTickets: 'Critical Tickets',
      escalatedTickets: 'Escalated Tickets',
      resolvedToday: 'Resolved Today',
      avgFirstResponse: 'Avg First Response',
      avgResolution: 'Avg Resolution',
      hours: 'hrs',
      needsAttention: 'Needs Attention',
      myAssignedTickets: 'My Assigned Tickets',
      waitingTickets: 'Waiting For User',
      recentActivity: 'Recent Activity',
      recentConversations: 'Recent Conversations',
      quickActions: 'Quick Actions',
      users: 'Users',
      complaints: 'Complaints',
      messages: 'Messages',
      startConversation: 'Start Conversation',
      viewAll: 'View All',
      noTickets: 'No tickets',
      noActivity: 'No recent activity',
      noConversations: 'No conversations',
      ticket: 'Ticket',
      priority: 'Priority',
      status: 'Status',
      time: 'Time',
      activityLabels: {
        CREATED: 'Created',
        ASSIGNED: 'Assigned',
        USER_REPLIED: 'User Replied',
        SUPPORT_REPLIED: 'Support Replied',
        ADMIN_REPLIED: 'Admin Replied',
        ESCALATED: 'Escalated',
        RESOLVED: 'Resolved',
        CLOSED: 'Closed'
      }
    },
    ar: {
      title: 'لوحة تحكم الدعم',
      welcome: 'مرحباً',
      subtitle: 'مراقبة وإدارة دعم المستخدمين',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      openTickets: 'التذاكر المفتوحة',
      assignedToMe: 'المعينة لي',
      waitingForUser: 'بانتظار المستخدم',
      criticalTickets: 'تذاكر حرجة',
      escalatedTickets: 'تذاكر مرفوعة',
      resolvedToday: 'تم حلها اليوم',
      avgFirstResponse: 'متوسط أول استجابة',
      avgResolution: 'متوسط وقت الحل',
      hours: 'ساعة',
      needsAttention: 'يحتاج إلى اهتمام',
      myAssignedTickets: 'تذاكري المعينة',
      waitingTickets: 'بانتظار المستخدم',
      recentActivity: 'النشاط الأخير',
      recentConversations: 'المحادثات الأخيرة',
      quickActions: 'إجراءات سريعة',
      users: 'المستخدمين',
      complaints: 'الشكاوى',
      messages: 'الرسائل',
      startConversation: 'بدء محادثة',
      viewAll: 'عرض الكل',
      noTickets: 'لا توجد تذاكر',
      noActivity: 'لا يوجد نشاط',
      noConversations: 'لا توجد محادثات',
      ticket: 'تذكرة',
      priority: 'الأولوية',
      status: 'الحالة',
      time: 'الوقت',
      activityLabels: {
        CREATED: 'تم الإنشاء',
        ASSIGNED: 'تم التعيين',
        USER_REPLIED: 'رد المستخدم',
        SUPPORT_REPLIED: 'رد الدعم',
        ADMIN_REPLIED: 'رد المشرف',
        ESCALATED: 'تم الرفع',
        RESOLVED: 'تم الحل',
        CLOSED: 'مغلقة'
      }
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(dashboard.language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketNumber = (ticket) => {
    if (ticket?.ticketNumber) return ticket.ticketNumber;
    return `HS-${String(ticket?.id || '').slice(-6) || '000000'}`;
  };

  // ============================================================
  // KPI CARDS (clickable)
  // ============================================================
  const kpiCards = [
    {
      label: t.openTickets,
      value: data?.stats?.openTickets || 0,
      icon: Inbox,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      link: '/support-complaints'
    },
    {
      label: t.assignedToMe,
      value: data?.stats?.assignedToMe || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/30',
      link: '/support-complaints?assignedTo=me'
    },
    {
      label: t.waitingForUser,
      value: data?.stats?.waitingForUser || 0,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      link: '/support-complaints?status=WAITING_FOR_USER'
    },
    {
      label: t.criticalTickets,
      value: data?.stats?.criticalTickets || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/30',
      link: '/support-complaints?priority=Critical'
    },
    {
      label: t.escalatedTickets,
      value: data?.stats?.escalatedTickets || 0,
      icon: ArrowUpRight,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      link: '/support-complaints?status=ESCALATED'
    },
    {
      label: t.resolvedToday,
      value: data?.stats?.resolvedToday || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/30',
      link: '/support-complaints?status=RESOLVED'
    },
    {
      label: t.avgFirstResponse,
      value: data?.stats?.avgFirstResponseHours != null
        ? `${data.stats.avgFirstResponseHours} ${t.hours}`
        : '0',
      icon: Timer,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      link: null
    },
    {
      label: t.avgResolution,
      value: data?.stats?.avgResolutionHours != null
        ? `${data.stats.avgResolutionHours} ${t.hours}`
        : '0',
      icon: History,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      link: null
    }
  ];

  // ============================================================
  // TICKET CARD (shared for Needs Attention / Assigned / Waiting)
  // ============================================================
  const TicketCard = ({ ticket }) => (
    <button
      onClick={() => navigate(`/support/complaints/${ticket.id}`)}
      className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
          {getTicketNumber(ticket)}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getPriorityBadgeClass(ticket.priority)}`}>
          <Flag size={10} />
          {complaintsService.getPriorityLabel(ticket.priority)}
        </span>
      </div>
      <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{ticket.subject}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(ticket.status)}`}>
          {complaintsService.getStatusLabel(ticket.status)}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(ticket.updatedAt || ticket.createdAt)}</span>
      </div>
    </button>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <SupportLayout>
      <div className="p-6 md:p-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">
                {t.welcome} {authUser?.fullName || 'Support Agent'}
              </h1>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <Loader2 size={32} className="animate-spin mx-auto text-green-600" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ============================================
                TOP KPI CARDS
                ============================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, i) => {
                const CardContent = (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition h-full">
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
                );

                return card.link ? (
                  <Link key={i} to={card.link} className="block">
                    {CardContent}
                  </Link>
                ) : (
                  <div key={i}>{CardContent}</div>
                );
              })}
            </div>

            {/* ============================================
                NEEDS ATTENTION
                ============================================ */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  {t.needsAttention}
                </h2>
                <Link
                  to="/support-complaints"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1"
                >
                  {t.viewAll}
                  <ChevronRight size={14} />
                </Link>
              </div>
              {data?.needsAttention?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.needsAttention.slice(0, 6).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">{t.noTickets}</p>
                </div>
              )}
            </div>

            {/* ============================================
                MY ASSIGNED TICKETS + WAITING FOR USER
                ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Assigned Tickets */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-green-600" />
                    {t.myAssignedTickets}
                  </h2>
                  <Link
                    to="/support-complaints?assignedTo=me"
                    className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1"
                  >
                    {t.viewAll}
                    <ChevronRight size={14} />
                  </Link>
                </div>
                {data?.myAssignedTickets?.length > 0 ? (
                  <div className="space-y-3">
                    {data.myAssignedTickets.slice(0, 5).map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">{t.noTickets}</p>
                  </div>
                )}
              </div>

              {/* Waiting For User */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-purple-600" />
                    {t.waitingTickets}
                  </h2>
                  <Link
                    to="/support-complaints?status=WAITING_FOR_USER"
                    className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1"
                  >
                    {t.viewAll}
                    <ChevronRight size={14} />
                  </Link>
                </div>
                {data?.waitingTickets?.length > 0 ? (
                  <div className="space-y-3">
                    {data.waitingTickets.slice(0, 5).map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">{t.noTickets}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================
                RECENT ACTIVITY + RECENT CONVERSATIONS
                ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <History size={18} className="text-green-600" />
                    {t.recentActivity}
                  </h2>
                </div>
                <div className="p-4">
                  {data?.recentActivity?.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentActivity.slice(0, 8).map((event, index) => (
                        <div key={event.id || index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                            {index < Math.min(data.recentActivity.length, 8) - 1 && (
                              <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {t.activityLabels[event.action] || event.action}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTime(event.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              {event.Complaint?.subject || event.description}
                              {event.Complaint?.ticketNumber && ` — ${event.Complaint.ticketNumber}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noActivity}</p>
                  )}
                </div>
              </div>

              {/* Recent Conversations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    {t.recentConversations}
                  </h2>
                </div>
                <div className="p-4">
                  {data?.recentConversations?.length > 0 ? (
                    <div className="space-y-2">
                      {data.recentConversations.slice(0, 6).map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => navigate('/support-messages')}
                          className="w-full p-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition text-left"
                        >
                          <UserAvatar
                            name={conv.user?.fullName || 'User'}
                            image={conv.user?.image || null}
                            role={conv.user?.role || 'USER'}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {getDisplayName(conv.user)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {conv.lastMessage}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noConversations}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================
                QUICK ACTIONS
                ============================================ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <LifeBuoy size={18} className="text-green-600" />
                {t.quickActions}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/support-users"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.users}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage user accounts</p>
                  </div>
                </Link>
                <Link
                  to="/support-complaints"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.complaints}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage complaint workflow</p>
                  </div>
                </Link>
                <Link
                  to="/support-messages"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <MessageCircle size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.messages}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Respond to user inquiries</p>
                  </div>
                </Link>
                <Link
                  to="/support-users"
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500/40 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <MessageSquare size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.startConversation}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open a new support chat</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default SupportDashboard;