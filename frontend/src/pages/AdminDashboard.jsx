// src/pages/AdminDashboard.jsx - ADMIN COMMAND CENTER
// Rebuilt to consume the aggregated GET /api/admin/command-center
// endpoint (single request). No localStorage, no fake data.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import StatCard from '../components/admin/StatCard';
import { UserAvatar, UserDisplayName } from '../components/users';
import { getDisplayName, getRoleLabel, getRoleBadgeClasses } from '../utils/userDisplay';
import complaintsService from '../services/complaintService';
import {
  Users,
  Briefcase,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  UserX,
  UserPlus,
  CheckCircle,
  Shield,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Wallet,
  DollarSign,
  History,
  RefreshCw,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Activity,
  XCircle,
  ArrowLeftRight,
  StickyNote,
  Undo2,
  ChevronRight,
  Loader2,
  Flag,
  User as UserIcon,
} from 'lucide-react';

// ============================================================
// ACTIVITY META - Icons & labels for recent activity timeline
// ============================================================
const ACTIVITY_META = {
  CREATED: { icon: FileText, label: 'Created', color: 'bg-blue-500' },
  ASSIGNED: { icon: UserCheck, label: 'Assigned', color: 'bg-green-500' },
  USER_REPLIED: { icon: MessageSquare, label: 'User Replied', color: 'bg-purple-500' },
  SUPPORT_REPLIED: { icon: MessageSquare, label: 'Support Replied', color: 'bg-teal-500' },
  ADMIN_REPLIED: { icon: MessageSquare, label: 'Admin Replied', color: 'bg-yellow-500' },
  ESCALATED: { icon: ArrowUpRight, label: 'Escalated', color: 'bg-red-500' },
  RESOLVED: { icon: CheckCircle, label: 'Resolved', color: 'bg-green-500' },
  CLOSED: { icon: XCircle, label: 'Closed', color: 'bg-gray-500' },
  NOTE_ADDED: { icon: StickyNote, label: 'Note Added', color: 'bg-slate-500' },
  STATUS_CHANGED: { icon: RefreshCw, label: 'Status Changed', color: 'bg-cyan-500' },
  REASSIGNED: { icon: ArrowLeftRight, label: 'Reassigned', color: 'bg-indigo-500' },
  RETURNED_TO_SUPPORT: { icon: Undo2, label: 'Returned to Support', color: 'bg-orange-500' },
};

// ============================================================
// FORMAT HELPERS
// ============================================================
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString()} EGP`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // SINGLE DATA FETCH - GET /api/admin/command-center
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/command-center');
      if (response.data?.success) {
        setData(response.data);
      } else {
        setError(response.data?.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('❌ Error loading command center:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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
    fetchData();
  }, [authUser, isAuthenticated, authLoading, navigate, fetchData]);

  // ============================================================
  // DERIVED STATS (useMemo to avoid re-renders)
  // ============================================================
  const stats = data?.stats || null;

  const kpiCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Total Users',
        value: stats.totalUsers ?? 0,
        icon: Users,
        color: 'blue',
        link: '/admin/users',
        sub: `${stats.totalWorkers ?? 0} workers · ${stats.totalEmployers ?? 0} employers`,
      },
      {
        label: 'Workers',
        value: stats.totalWorkers ?? 0,
        icon: UserCheck,
        color: 'orange',
        link: '/admin/users',
      },
      {
        label: 'Employers',
        value: stats.totalEmployers ?? 0,
        icon: Briefcase,
        color: 'purple',
        link: '/admin/users',
      },
      {
        label: 'Support Team',
        value: stats.totalSupport ?? 0,
        icon: Shield,
        color: 'green',
        link: '/admin/users',
      },
      {
        label: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue ?? 0),
        icon: DollarSign,
        color: 'yellow',
        link: '/admin/payments',
      },
      {
        label: 'Payments',
        value: stats.totalPayments ?? 0,
        icon: CreditCard,
        color: 'green',
        link: '/admin/payments',
        sub: `${stats.verifiedPayments ?? 0} verified · ${stats.pendingPayments ?? 0} pending`,
      },
      {
        label: 'Active Hires',
        value: stats.activeHires ?? 0,
        icon: Briefcase,
        color: 'teal',
        link: '/admin/hires',
        sub: `${stats.completedHires ?? 0} completed`,
      },
      {
        label: 'Open Complaints',
        value: stats.openComplaints ?? 0,
        icon: AlertCircle,
        color: 'red',
        link: '/admin/complaints',
      },
      {
        label: 'Escalated Complaints',
        value: stats.escalatedComplaints ?? 0,
        icon: ArrowUpRight,
        color: 'orange',
        link: '/admin/complaints',
      },
      {
        label: 'Suspended Users',
        value: stats.suspendedUsers ?? 0,
        icon: UserX,
        color: 'red',
        link: '/admin/users',
      },
      {
        label: 'New Users (7 days)',
        value: stats.newUsers7d ?? 0,
        icon: UserPlus,
        color: 'blue',
        link: '/admin/users',
      },
      {
        label: 'Resolved Today',
        value: stats.resolvedToday ?? 0,
        icon: CheckCircle,
        color: 'green',
        link: '/admin/complaints',
      },
    ];
  }, [stats]);

  // ============================================================
  // QUICK ACTIONS
  // ============================================================
  const quickActions = useMemo(
    () => [
      { label: 'Users', icon: Users, path: '/admin/users', color: 'blue' },
      { label: 'Payments', icon: CreditCard, path: '/admin/payments', color: 'green' },
      { label: 'Complaints', icon: AlertTriangle, path: '/admin/complaints', color: 'red' },
      { label: 'Messages', icon: MessageSquare, path: '/admin/messages', color: 'purple' },
      { label: 'Reports', icon: BarChart3, path: '/admin/reports', color: 'orange' },
      { label: 'Settings', icon: Settings, path: '/admin/settings', color: 'yellow' },
    ],
    []
  );

  const quickActionColors = {
    blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20',
    red: 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20',
  };

  // ============================================================
  // RENDER: LOADING / ERROR / EMPTY STATES
  // ============================================================
  const renderLoading = () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-2">
        <h1 className="text-2xl font-bold text-black">Admin Command Center</h1>
        <p className="text-black/70 mt-1">Loading platform overview...</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-yellow-500/20">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={28} className="animate-spin text-yellow-500" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-red-500/20">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load dashboard</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition inline-flex items-center gap-2 font-medium"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: NEEDS ATTENTION
  // ============================================================
  const renderNeedsAttention = () => {
    const items = data?.needsAttention || [];
    if (items.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-yellow-500/20">
          <CheckCircle size={28} className="mx-auto text-green-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No complaints need attention</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((complaint) => (
          <button
            key={complaint.id}
            onClick={() => navigate(`/admin/complaints?id=${complaint.id}`)}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                {complaint.ticketNumber || `HS-${String(complaint.id).slice(-6)}`}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getPriorityBadgeClass(complaint.priority)}`}>
                <Flag size={10} />
                {complaintsService.getPriorityLabel(complaint.priority)}
              </span>
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{complaint.subject}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(complaint.status)}`}>
                {complaintsService.getStatusLabel(complaint.status)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {complaintsService.formatComplaintDate(complaint.createdAt)}
              </span>
            </div>
            {complaint.assignedSupport && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <UserIcon size={12} />
                <UserDisplayName user={complaint.assignedSupport} size="sm" />
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER: RECENT ACTIVITY TIMELINE
  // ============================================================
  const renderRecentActivity = () => {
    const items = data?.recentActivity || [];
    if (items.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-yellow-500/20">
          <History size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.slice(0, 8).map((event, index) => {
          const meta = ACTIVITY_META[event.action] || { icon: Activity, label: event.action, color: 'bg-gray-500' };
          const Icon = meta.icon;
          return (
            <div key={event.id || index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${meta.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className="text-white" />
                </div>
                {index < Math.min(items.length, 8) - 1 && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                )}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{meta.label}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(event.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {event.Complaint?.subject || event.description || 'Activity'}
                  {event.Complaint?.ticketNumber && ` — ${event.Complaint.ticketNumber}`}
                </p>
                {event.authorName && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">by {event.authorName}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER: RECENT USERS
  // ============================================================
  const renderRecentUsers = () => {
    const users = data?.recentUsers || [];
    if (users.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-yellow-500/20">
          <Users size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No recent users</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition">
            <UserAvatar name={user.fullName} image={user.image} role={user.role} size="md" />
            <div className="flex-1 min-w-0">
              <UserDisplayName user={user} size="sm" />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{formatDate(user.createdAt)}</span>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER: RECENT PAYMENTS
  // ============================================================
  const renderRecentPayments = () => {
    const payments = data?.recentPayments || [];
    if (payments.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-yellow-500/20">
          <Wallet size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No recent payments</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CreditCard size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {payment.User?.fullName || payment.employerName || payment.userEmail || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {payment.metadata?.jobTitle || payment.workerName || payment.jobTitle || ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(payment.amount)}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                payment.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : payment.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {payment.status || 'pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER: RECENT HIRES
  // ============================================================
  const renderRecentHires = () => {
    const hires = data?.recentHires || [];
    if (hires.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-yellow-500/20">
          <Briefcase size={28} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No recent hires</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {hires.map((hire) => (
          <div key={hire.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
              <Briefcase size={18} className="text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {hire.WorkerProfile?.User?.fullName || 'Worker'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Employer: {hire.User?.fullName || 'Unknown'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatCurrency(hire.agreedSalary ?? hire.totalDue)}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                hire.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : hire.status === 'completed'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : hire.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {hire.status || 'pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER: MAIN
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title="Admin Command Center"
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <div className="p-4 md:p-6 space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-black">Admin Command Center</h1>
                <p className="text-black/70 mt-1">Platform overview and management</p>
              </div>
              <button
                onClick={fetchData}
                className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* ============================================
              TOP KPI CARDS
              ============================================ */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-yellow-500" />
              Platform Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {kpiCards.map((card, i) => (
                <StatCard
                  key={i}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  sub={card.sub}
                  link={card.link}
                />
              ))}
            </div>
          </section>

          {/* ============================================
              NEEDS ATTENTION + RECENT ACTIVITY
              ============================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  Needs Attention
                </h2>
                <Link
                  to="/admin/complaints"
                  className="text-sm text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                >
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>
              {renderNeedsAttention()}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-blue-600" />
                  Recent Activity
                </h2>
              </div>
              {renderRecentActivity()}
            </div>
          </section>

          {/* ============================================
              RECENT USERS + RECENT PAYMENTS + RECENT HIRES
              ============================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  Recent Users
                </h2>
                <Link to="/admin/users" className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-0.5">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4">{renderRecentUsers()}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-green-600" />
                  Recent Payments
                </h2>
                <Link to="/admin/payments" className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-0.5">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4">{renderRecentPayments()}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={16} className="text-teal-600" />
                  Recent Hires
                </h2>
                <Link to="/admin/hires" className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-0.5">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4">{renderRecentHires()}</div>
            </div>
          </section>

          {/* ============================================
              QUICK ACTIONS
              ============================================ */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={18} className="text-yellow-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${quickActionColors[action.color]} transition`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;