// src/pages/AdminComplaints.jsx - PRODUCTION COMPLAINT MANAGEMENT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  X,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Paperclip,
  MessageSquare,
  History,
  Flag,
  ArrowUpRight,
  Lock,
  User as UserIcon,
  Shield,
  RefreshCw,
  Eye,
  ArrowLeftRight,
  Undo2
} from 'lucide-react';
import complaintsService from '../services/complaintService';
import { getDisplayName } from '../utils/userDisplay';
import { UserAvatar, UserDisplayName } from '../components/users';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const { t: i18nT, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const complaintIdFromUrl = searchParams.get('id');
  const userIdFilterParam = searchParams.get('userId');
  const autoOpenedRef = useRef(false);
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [supportUsers, setSupportUsers] = useState([]);
  const [reassignSupportId, setReassignSupportId] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [stats, setStats] = useState(null);

  /* Admin complaint copy lives in the central six-language i18n catalogue. */
  const t = i18nT('adminComplaintsPage', { returnObjects: true });
  const statusLabel = (value) => t.status[value] || t.unknown;
  const priorityLabel = (value) => t.priority[String(value || 'Medium').toLowerCase()] || t.unknown;
  const categoryLabel = (value) => t.category[String(value || 'Other').toLowerCase().replace(/\s+/g, '_')] || t.category.other;
  const timelineLabel = (value) => t.timelineActions[value] || statusLabel(value);
  const roleLabel = (value) => t.roles[value] || t.roles.user;
  const isSuspensionReview = selectedComplaint?.reviewType === 'USER_SUSPENSION';
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : t.notAvailable;

  // ============================================================
  // AUTH CHECK
  // ============================================================
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
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // ============================================================
  // LOAD COMPLAINTS
  // ============================================================
  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (searchTerm) filters.search = searchTerm;
      if (userIdFilterParam) filters.userId = userIdFilterParam;

      const data = await complaintsService.getAdminComplaints(filters);
      if (data?.success) {
        setComplaints(data.complaints || []);
        setFilteredComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm, userIdFilterParam]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // ============================================================
  // LOAD STATS
  // ============================================================
  const loadStats = useCallback(async () => {
    try {
      const data = await complaintsService.getAdminComplaintStats();
      if (data?.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ============================================================
  // LOAD SUPPORT USERS
  // ============================================================
  const loadSupportUsers = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/support-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('homelyserv_token')}`
        }
      });
      const data = await response.json();
      if (data?.success) {
        setSupportUsers(data.users || []);
      }
    } catch (error) {
      console.error('❌ Error loading support users:', error);
    }
  }, []);

  useEffect(() => {
    loadSupportUsers();
  }, [loadSupportUsers]);

  // ============================================================
  // CLEAR USER FILTER
  // Removes ?userId= from the URL while preserving ?id= deep-links.
  // ============================================================
  const handleClearUserFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('userId');
    const qs = params.toString();
    navigate(`/admin/complaints${qs ? `?${qs}` : ''}`, { replace: true });
  };

  // ============================================================
  // VIEW COMPLAINT DETAILS
  // ============================================================
  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
    setReplyText('');
    setNoteText('');
    setReassignSupportId('');
    setReturnNote('');
    try {
      const data = await complaintsService.getAdminComplaint(complaint.id);
      if (data?.success) {
        setSelectedComplaint(data.complaint);
        setTimeline(data.timeline || []);
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('❌ Error fetching complaint details:', error);
      setTimeline([]);
      setNotes([]);
    }
  };

  // ============================================================
  // DEEP LINK - Auto-open complaint from ?id= query param
  // (e.g. navigating from Admin Dashboard "Needs Attention" cards)
  // ============================================================
  useEffect(() => {
    if (!complaintIdFromUrl || autoOpenedRef.current) return;
    if (loading || complaints.length === 0) return;
    const found =
      complaints.find((c) => c.id === complaintIdFromUrl) ||
      complaints.find((c) => c.ticketNumber === complaintIdFromUrl);
    if (found) {
      autoOpenedRef.current = true;
      handleViewDetails(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, loading, complaintIdFromUrl]);

  // ============================================================
  // ADMIN REPLY
  // ============================================================
  const handleReply = async () => {
    if (!replyText.trim() || !selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminReplyToComplaint(selectedComplaint.id, replyText);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.replySent });
        setReplyText('');
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setSelectedComplaint(detail.complaint);
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      setNotification({ type: 'error', text: t.notifications.replyFailed });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // ADD INTERNAL NOTE
  // ============================================================
  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.addComplaintNote(selectedComplaint.id, noteText);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.noteAdded });
        setNoteText('');
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setNotes(detail.notes || []);
          setTimeline(detail.timeline || []);
        }
      }
    } catch (error) {
      console.error('❌ Error adding note:', error);
      setNotification({ type: 'error', text: t.notifications.noteFailed });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // REASSIGN
  // ============================================================
  const handleReassign = async () => {
    if (!reassignSupportId || !selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminReassignComplaint(selectedComplaint.id, reassignSupportId);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.reassigned });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error reassigning:', error);
      setNotification({ type: 'error', text: t.notifications.reassignFailed });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // RESOLVE
  // ============================================================
  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminResolveComplaint(selectedComplaint.id);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.resolved });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
        loadStats();
      }
    } catch (error) {
      console.error('❌ Error resolving:', error);
      setNotification({ type: 'error', text: t.notifications.resolveFailed });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // CLOSE
  // ============================================================
  const handleClose = async () => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminCloseComplaint(selectedComplaint.id);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.closed });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
        loadStats();
      }
    } catch (error) {
      console.error('❌ Error closing:', error);
      setNotification({ type: 'error', text: t.notifications.closeFailed });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // RETURN TO SUPPORT
  // ============================================================
  const handleReturn = async () => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminReturnComplaint(selectedComplaint.id, reassignSupportId || undefined, returnNote);
      if (data?.success) {
        setNotification({ type: 'success', text: t.notifications.returned });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error returning:', error);
      setNotification({ type: 'error', text: t.notifications.returnFailed });
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspensionDecision = async (approved) => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      const data = approved
        ? await complaintsService.adminApproveSuspensionRequest(selectedComplaint.id)
        : await complaintsService.adminRejectSuspensionRequest(selectedComplaint.id);
      if (data?.success) {
        setNotification({ type: 'success', text: approved ? 'Suspension approved' : 'Suspension request rejected' });
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        setSelectedComplaint(detail?.complaint || data.complaint);
        if (detail?.success) setTimeline(detail.timeline || []);
        loadComplaints();
      }
    } catch (error) {
      setNotification({ type: 'error', text: error.response?.data?.message || 'Unable to process suspension request' });
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // CONFIRMATION
  // ============================================================
  const handleConfirm = () => {
    if (confirmDialog?.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  // ============================================================
  // RENDER: CONVERSATION THREAD
  // Builds the threaded conversation from the original complaint
  // description + all replies, ordered by createdAt ASC.
  // ============================================================
  const renderThread = () => {
    const messages = [
      {
        id: 'original',
        authorName: selectedComplaint?.User?.fullName || t.roles.user,
        authorRole: selectedComplaint?.User?.role || 'USER',
        authorImage: selectedComplaint?.User?.image || null,
        message: selectedComplaint?.description || '',
        attachments: selectedComplaint?.attachments || [],
        createdAt: selectedComplaint?.createdAt,
        isOriginal: true,
      },
      ...(selectedComplaint?.replies || []).map((reply) => ({
        id: reply.id,
        authorName: reply.authorName || reply.author?.name,
        authorRole: reply.authorRole || reply.author?.role,
        authorImage: reply.author?.image || null,
        authorIsPremium: reply.authorIsPremium || reply.author?.isPremium,
        message: reply.message,
        attachments: reply.attachments || [],
        createdAt: reply.createdAt,
        isOriginal: false,
      })),
    ];

    return (
      <div className="space-y-3">
        {messages.map((msg, index) => {
          const isUser = msg.isOriginal || ['WORKER', 'EMPLOYER'].includes(msg.authorRole);
          const bubbleClass = isUser
            ? 'ml-auto bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
            : 'mr-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600';

          return (
            <div key={msg.id || index} className={`flex flex-col max-w-[85%] ${isUser ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
              <div className={`px-4 py-2.5 rounded-2xl ${bubbleClass}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <UserAvatar
                    name={msg.authorName}
                    image={msg.authorImage}
                    role={msg.authorRole}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <UserDisplayName
                    name={msg.authorName}
                    role={msg.authorRole}
                    isPremium={msg.authorIsPremium || msg.author?.isPremium || (msg.isOriginal && selectedComplaint?.User?.isPremium)}
                    size="sm"
                    className={isUser ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-200'}
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {msg.message}
                </p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:opacity-80 transition"
                      >
                        <img src={url} alt={t.attachmentAlt.replace('{{number}}', i + 1)} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
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

        {/* Page Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">{t.title}</h1>
              <p className="text-black/70 mt-1">{t.subtitle}</p>
            </div>
            <button
              onClick={() => { loadComplaints(); loadStats(); }}
              className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {t.actions.refresh}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: t.stats.total, value: stats?.totalComplaints || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { label: t.stats.escalated, value: stats?.escalatedComplaints || 0, icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-500/20' },
            { label: t.stats.critical, value: stats?.criticalComplaints || 0, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
            { label: t.stats.waiting, value: stats?.waitingComplaints || 0, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/20' },
            { label: t.stats.solvedToday, value: stats?.solvedToday || 0, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
            { label: t.stats.avgResolution, value: stats?.avgResolutionHours ? `${stats.avgResolutionHours} ${t.hours}` : '0', icon: History, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <s.icon size={20} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t.table.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{t.filters.all}</option>
                <option value="NEW">{t.filters.new}</option>
                <option value="OPEN">{t.filters.open}</option>
                <option value="IN_PROGRESS">{t.filters.inProgress}</option>
                <option value="WAITING_FOR_USER">{t.filters.waiting}</option>
                <option value="ESCALATED">{t.filters.escalated}</option>
                <option value="RESOLVED">{t.filters.resolved}</option>
                <option value="CLOSED">{t.filters.closed}</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{t.filters.allPriorities}</option>
                {complaintsService.COMPLAINT_PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{t.filters.allCategories}</option>
                {complaintsService.COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.resultsShowing} <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredComplaints.length}</span> {t.resultsComplaints}
            {userIdFilterParam && (
              <span className="inline-flex items-center gap-2 ml-2">
                <span className="text-yellow-600 dark:text-yellow-400">
                  ({t.filteredByUser})
                </span>
                <button
                  onClick={handleClearUserFilter}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/25 transition text-xs font-medium"
                >
                  {t.viewAllComplaints}
                </button>
              </span>
            )}
          </p>
        </div>

        {/* Complaints List */}
        {loading ? (
          <PageLoader text={t.loading} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t.noComplaints}
            description={t.noComplaintsDescription}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.title}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.from}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.assignedSupport}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.status}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.priority}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.updated}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.table.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className="hover:bg-yellow-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle size={15} className="text-yellow-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                              {complaint.subject}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                              {complaint.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={complaint.User?.fullName}
                            image={complaint.User?.image}
                            role={complaint.User?.role}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div>
                            <div className="text-sm text-gray-700 dark:text-gray-200">
                              <UserDisplayName user={complaint.User} />
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {complaint.User?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {complaint.assignedSupport?.fullName ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={complaint.assignedSupport.fullName}
                              image={complaint.assignedSupport.image}
                              role="SUPPORT"
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {complaint.assignedSupport.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t.table.unassigned}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(complaint.status)}`}>
                          {statusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${complaintsService.getPriorityBadgeClass(complaint.priority)}`}>
                          <Flag size={12} />
                          {priorityLabel(complaint.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(complaint.updatedAt || complaint.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(complaint)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition"
                        >
                          <Eye size={14} />
                          {t.actions.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
              <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t.modal.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.modal.complaintId}: {selectedComplaint.id}
                </p>
                {isSuspensionReview && (
                  <span className="inline-flex items-center mt-2 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-200">
                    User Suspension Review
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Complaint Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.status}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${complaintsService.getStatusBadgeClass(selectedComplaint.status)}`}>
                    {statusLabel(selectedComplaint.status)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.priority}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${complaintsService.getPriorityBadgeClass(selectedComplaint.priority)}`}>
                    <Flag size={12} />
                    {priorityLabel(selectedComplaint.priority)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.category}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{categoryLabel(selectedComplaint.category)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.date}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(selectedComplaint.createdAt)}</p>
                </div>
              </div>

              {isSuspensionReview && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-3">Suspension Request</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-red-900 dark:text-red-100">
                    <p><span className="font-medium">Target:</span> {selectedComplaint.targetUser?.fullName || 'Unavailable'}</p>
                    <p><span className="font-medium">Email:</span> {selectedComplaint.targetUser?.email || 'Unavailable'}</p>
                    <p><span className="font-medium">Role:</span> {selectedComplaint.targetUser?.role || 'Unavailable'}</p>
                    <p><span className="font-medium">Request date:</span> {formatDate(selectedComplaint.createdAt)}</p>
                    <p><span className="font-medium">Requested by:</span> {selectedComplaint.requester?.fullName || selectedComplaint.User?.fullName || 'Unavailable'}</p>
                    <p><span className="font-medium">Requester email:</span> {selectedComplaint.requester?.email || selectedComplaint.User?.email || 'Unavailable'}</p>
                  </div>
                  <p className="mt-3 text-sm text-red-900 dark:text-red-100"><span className="font-medium">Reason:</span> {selectedComplaint.escalationReason || selectedComplaint.description}</p>
                  <p className="mt-2 text-xs font-medium text-red-800 dark:text-red-200">Review status: {statusLabel(selectedComplaint.status)}</p>
                </div>
              )}

              {!isSuspensionReview && (selectedComplaint.reportedUserId || selectedComplaint.conversationId || selectedComplaint.messageId) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <h4 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">{i18nT('messagesReporting.reportMessage')}</h4>
                  <div className="space-y-1 text-xs text-amber-900 dark:text-amber-100">
                    {selectedComplaint.reportedUserId && <p><span className="font-medium">{i18nT('messagesReporting.reportedUser')}:</span> {selectedComplaint.reportedUserId}</p>}
                    {selectedComplaint.conversationId && <p><span className="font-medium">{i18nT('messagesReporting.conversationReference')}:</span> {selectedComplaint.conversationId}</p>}
                    {selectedComplaint.messageId && <p><span className="font-medium">{i18nT('messagesReporting.messageReference')}:</span> {selectedComplaint.messageId}</p>}
                  </div>
                </div>
              )}

              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <UserIcon size={14} />
                  {t.modal.from}
                </h4>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={selectedComplaint.User?.fullName}
                    image={selectedComplaint.User?.image}
                    role={selectedComplaint.User?.role}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div>
                    <UserDisplayName user={selectedComplaint.User} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedComplaint.User?.email} • {roleLabel(selectedComplaint.User?.role)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Support Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <ArrowLeftRight size={14} />
                  {t.modal.assigned}
                </h4>
                {selectedComplaint.assignedSupport?.fullName ? (
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={selectedComplaint.assignedSupport.fullName}
                      image={selectedComplaint.assignedSupport.image}
                      role="SUPPORT"
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedComplaint.assignedSupport.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedComplaint.assignedSupport.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.table.unassigned}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.modal.description}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Paperclip size={14} />
                  {t.modal.attachments}
                </h4>
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.attachments.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                        className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:opacity-80 transition">
                        <img src={url} alt={t.attachmentAlt.replace('{{number}}', index + 1)} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.noAttachments}</p>
                )}
              </div>

              {/* Escalation Info */}
              {selectedComplaint.status === 'ESCALATED' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <ArrowUpRight size={16} />
                    {t.escalated}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedComplaint.escalationReason}</p>
                  {selectedComplaint.escalatedAt && (
                    <p className="text-xs text-red-500 mt-1">
                       {formatDate(selectedComplaint.escalatedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Conversation Thread */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                   {t.conversation}
                </h4>
                {renderThread()}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <History size={14} />
                  {t.modal.timeline}
                </h4>
                {timeline.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.map((event, index) => (
                      <div key={event.id || index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                          {index < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {event.author ? (
                                <UserAvatar
                                  name={event.author.name || event.authorName}
                                  image={event.author.image}
                                  role={event.author.role || event.authorRole}
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                              ) : (
                                <div className="w-2 flex-shrink-0" />
                              )}
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                 {timelineLabel(event.action)}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                               {formatDate(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {timelineLabel(event.action)}
                            {event.authorName && ` — ${event.authorName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTimeline}</p>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Shield size={14} />
                  {t.modal.notes}
                </h4>
                {notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{note.note}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {note.author ? (
                            <UserAvatar
                              name={note.author.name || note.authorName}
                              image={note.author.image}
                              role={note.author.role || note.authorRole}
                              size="sm"
                              className="flex-shrink-0"
                            />
                          ) : null}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {note.authorName || note.author?.name || t.roles.staff} • {formatDate(note.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noNotes}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t.modal.notePlaceholder}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={processing || !noteText.trim()}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Shield size={16} />
                    {t.actions.addNote}
                  </button>
                </div>
              </div>

              {/* Admin Reply */}
              {!isSuspensionReview && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.modal.reply}</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      placeholder={t.modal.replyPlaceholder}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleReply}
                      disabled={processing || !replyText.trim()}
                      className="px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send size={16} />
                      {t.modal.sendReply}
                    </button>
                  </div>
                </div>
              )}

              {/* Reassign */}
              {!isSuspensionReview && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <ArrowLeftRight size={14} />
                    {t.modal.reassignTo}
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={reassignSupportId}
                      onChange={(e) => setReassignSupportId(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                    >
                      <option value="">{t.modal.noSupportUsers}</option>
                      {supportUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleReassign}
                      disabled={processing || !reassignSupportId}
                      className="px-4 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <ArrowLeftRight size={16} />
                      {t.actions.reassign}
                    </button>
                  </div>
                </div>
              )}

              {/* Return to Support */}
              {selectedComplaint.status === 'ESCALATED' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Undo2 size={14} />
                    {t.modal.returnToSupport}
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      placeholder={t.modal.returnNote}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => setConfirmDialog({
                        title: t.modal.returnToSupport,
                        message: t.modal.confirmReturn,
                        onConfirm: handleReturn
                      })}
                      disabled={processing}
                      className="px-4 py-2.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Undo2 size={16} />
                      {t.actions.return}
                    </button>
                  </div>
                </div>
              )}

              {/* Resolved/Closed Notice */}
              {selectedComplaint.status === 'RESOLVED' && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t.resolved} — {formatDate(selectedComplaint.resolvedAt)}
                  </p>
                </div>
              )}
              {selectedComplaint.status === 'CLOSED' && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                  <Lock size={18} className="text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t.closed} — {formatDate(selectedComplaint.closedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 p-6 border-t border-yellow-500/20">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              {isSuspensionReview && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <>
                  <button onClick={() => handleSuspensionDecision(false)} disabled={processing} className="px-4 py-2.5 bg-gray-600 text-white rounded-lg disabled:opacity-50">Reject Suspension</button>
                  <button onClick={() => handleSuspensionDecision(true)} disabled={processing} className="px-4 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-50">Approve Suspension</button>
                </>
              )}
              {!isSuspensionReview && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <>
                  <button
                    onClick={() => setConfirmDialog({
                      title: t.actions.resolve,
                      message: t.modal.confirmResolve,
                      onConfirm: handleResolve
                    })}
                    disabled={processing}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {t.actions.resolve}
                  </button>
                  <button
                    onClick={() => setConfirmDialog({
                      title: t.actions.close,
                      message: t.modal.confirmClose,
                      onConfirm: handleClose
                    })}
                    disabled={processing}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={16} />
                    {t.actions.close}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-yellow-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {t.modal.cancel}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                {t.modal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminComplaints;
