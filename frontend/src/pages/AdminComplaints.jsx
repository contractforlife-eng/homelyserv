// src/pages/AdminComplaints.jsx - PRODUCTION COMPLAINT MANAGEMENT
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AdminComplaints = () => {
  const navigate = useNavigate();
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

  const translations = {
    en: {
      title: 'Complaints Management',
      subtitle: 'View and manage all complaints from workers and employers',
      stats: {
        total: 'Total Complaints',
        escalated: 'Escalated',
        critical: 'Critical',
        waiting: 'Waiting',
        solvedToday: 'Solved Today',
        avgResolution: 'Avg Resolution'
      },
      filters: {
        all: 'All Complaints',
        new: 'New',
        open: 'Open',
        inProgress: 'In Progress',
        waiting: 'Waiting for User',
        escalated: 'Escalated',
        resolved: 'Resolved',
        closed: 'Closed',
        allPriorities: 'All Priorities',
        allCategories: 'All Categories'
      },
      table: {
        title: 'Title',
        from: 'From',
        category: 'Category',
        status: 'Status',
        priority: 'Priority',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No complaints found',
        searchPlaceholder: 'Search complaints...'
      },
      actions: {
        view: 'View Details',
        refresh: 'Refresh',
        resolve: 'Resolve',
        close: 'Close',
        reassign: 'Reassign',
        return: 'Return to Support',
        reply: 'Reply',
        addNote: 'Add Note'
      },
      modal: {
        title: 'Complaint Details',
        complaintId: 'Complaint ID',
        from: 'Submitted By',
        status: 'Status',
        priority: 'Priority',
        category: 'Category',
        date: 'Submitted',
        description: 'Description',
        timeline: 'Timeline',
        reply: 'Admin Reply',
        replyPlaceholder: 'Type your reply...',
        notes: 'Internal Notes',
        notePlaceholder: 'Add internal note...',
        attachments: 'Attachments',
        noAttachments: 'No attachments',
        close: 'Close',
        sendReply: 'Send Reply',
        reassignTo: 'Reassign To',
        reassignBtn: 'Reassign',
        returnToSupport: 'Return to Support',
        returnNote: 'Note for support (optional)',
        confirmResolve: 'Are you sure you want to resolve this complaint?',
        confirmClose: 'Are you sure you want to close this complaint?',
        confirmReturn: 'Are you sure you want to return this complaint to support?',
        confirm: 'Confirm',
        cancel: 'Cancel',
        noSupportUsers: 'No support agents available'
      },
      loading: 'Loading complaints...',
      noComplaints: 'No complaints found',
      resolved: 'Resolved',
      closed: 'Closed',
      escalated: 'Escalated',
      hours: 'hrs'
    },
    ar: {
      title: 'إدارة الشكاوى',
      subtitle: 'عرض وإدارة جميع الشكاوى من العمال وأصحاب العمل',
      stats: {
        total: 'إجمالي الشكاوى',
        escalated: 'مرفوعة',
        critical: 'حرجة',
        waiting: 'بانتظار',
        solvedToday: 'تم حلها اليوم',
        avgResolution: 'متوسط الحل'
      },
      filters: {
        all: 'جميع الشكاوى',
        new: 'جديدة',
        open: 'مفتوحة',
        inProgress: 'قيد المعالجة',
        waiting: 'بانتظار المستخدم',
        escalated: 'مرفوعة',
        resolved: 'تم الحل',
        closed: 'مغلقة',
        allPriorities: 'جميع الأولويات',
        allCategories: 'جميع الفئات'
      },
      table: {
        title: 'العنوان',
        from: 'من',
        category: 'الفئة',
        status: 'الحالة',
        priority: 'الأولوية',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد شكاوى',
        searchPlaceholder: 'ابحث عن شكاوى...'
      },
      actions: {
        view: 'عرض التفاصيل',
        refresh: 'تحديث',
        resolve: 'حل',
        close: 'إغلاق',
        reassign: 'إعادة تعيين',
        return: 'إعادة للدعم',
        reply: 'رد',
        addNote: 'إضافة ملاحظة'
      },
      modal: {
        title: 'تفاصيل الشكوى',
        complaintId: 'رقم الشكوى',
        from: 'مقدم من',
        status: 'الحالة',
        priority: 'الأولوية',
        category: 'الفئة',
        date: 'تاريخ التقديم',
        description: 'الوصف',
        timeline: 'الخط الزمني',
        reply: 'رد المشرف',
        replyPlaceholder: 'اكتب ردك...',
        notes: 'ملاحظات داخلية',
        notePlaceholder: 'أضف ملاحظة داخلية...',
        attachments: 'المرفقات',
        noAttachments: 'لا توجد مرفقات',
        close: 'إغلاق',
        sendReply: 'إرسال الرد',
        reassignTo: 'إعادة تعيين إلى',
        reassignBtn: 'إعادة تعيين',
        returnToSupport: 'إعادة للدعم',
        returnNote: 'ملاحظة للدعم (اختياري)',
        confirmResolve: 'هل أنت متأكد من حل هذه الشكوى؟',
        confirmClose: 'هل أنت متأكد من إغلاق هذه الشكوى؟',
        confirmReturn: 'هل أنت متأكد من إعادة هذه الشكوى للدعم؟',
        confirm: 'تأكيد',
        cancel: 'إلغاء',
        noSupportUsers: 'لا يوجد وكلاء دعم متاحون'
      },
      loading: 'جاري تحميل الشكاوى...',
      noComplaints: 'لا توجد شكاوى',
      resolved: 'تم الحل',
      closed: 'مغلقة',
      escalated: 'مرفوعة',
      hours: 'ساعة'
    }
  };

  const t = translations[localStorage.getItem('homelyserv_language') === 'ar' ? 'ar' : 'en'];

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

      const data = await complaintsService.getAdminComplaints(filters);
      if (data?.success) {
        setComplaints(data.complaints || []);
        setFilteredComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('❌ Error loading complaints:', error);
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm]);

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
  // ADMIN REPLY
  // ============================================================
  const handleReply = async () => {
    if (!replyText.trim() || !selectedComplaint) return;
    setProcessing(true);
    try {
      const data = await complaintsService.adminReplyToComplaint(selectedComplaint.id, replyText);
      if (data?.success) {
        setNotification({ type: 'success', text: 'Reply sent' });
        setReplyText('');
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      setNotification({ type: 'error', text: 'Failed to send reply' });
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
        setNotification({ type: 'success', text: 'Note added' });
        setNoteText('');
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setNotes(detail.notes || []);
          setTimeline(detail.timeline || []);
        }
      }
    } catch (error) {
      console.error('❌ Error adding note:', error);
      setNotification({ type: 'error', text: 'Failed to add note' });
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
        setNotification({ type: 'success', text: 'Complaint reassigned' });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error reassigning:', error);
      setNotification({ type: 'error', text: 'Failed to reassign' });
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
        setNotification({ type: 'success', text: 'Complaint resolved' });
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
      setNotification({ type: 'error', text: 'Failed to resolve' });
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
        setNotification({ type: 'success', text: 'Complaint closed' });
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
      setNotification({ type: 'error', text: 'Failed to close' });
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
        setNotification({ type: 'success', text: 'Complaint returned to support' });
        setSelectedComplaint(data.complaint);
        const detail = await complaintsService.getAdminComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        loadComplaints();
      }
    } catch (error) {
      console.error('❌ Error returning:', error);
      setNotification({ type: 'error', text: 'Failed to return' });
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
                {complaintsService.COMPLAINT_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{t.filters.allCategories}</option>
                {complaintsService.COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredComplaints.length}</span> complaints
          </p>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.noComplaints}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition"
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-yellow-500" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{complaint.subject}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {complaint.User?.fullName || 'Unknown'} ({complaint.User?.role || 'USER'})
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{complaint.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{complaint.category}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getPriorityBadgeClass(complaint.priority)}`}>
                          <Flag size={12} className="inline mr-1" />
                          {complaintsService.getPriorityLabel(complaint.priority)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-gray-500 dark:text-gray-400">{complaintsService.formatComplaintDate(complaint.createdAt)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(complaint.status)}`}>
                          {complaintsService.getStatusLabel(complaint.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition flex items-center gap-1"
                      >
                        <Eye size={14} />
                        {t.actions.view}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                    {complaintsService.getStatusLabel(selectedComplaint.status)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.priority}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${complaintsService.getPriorityBadgeClass(selectedComplaint.priority)}`}>
                    <Flag size={12} />
                    {complaintsService.getPriorityLabel(selectedComplaint.priority)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.category}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedComplaint.category}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.modal.date}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{complaintsService.formatComplaintDate(selectedComplaint.createdAt)}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <UserIcon size={14} />
                  {t.modal.from}
                </h4>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedComplaint.User?.fullName || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedComplaint.User?.email} • {selectedComplaint.User?.role || 'USER'}
                </p>
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
                        <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
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
                      {complaintsService.formatComplaintDate(selectedComplaint.escalatedAt)}
                    </p>
                  )}
                </div>
              )}

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
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {complaintsService.getStatusLabel(event.action) || event.action}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {complaintsService.formatComplaintDate(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {event.description}
                            {event.authorName && ` — ${event.authorName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No timeline events</p>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {note.authorName} • {complaintsService.formatComplaintDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No internal notes</p>
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
              {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
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
              {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
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
                    {t.resolved} — {complaintsService.formatComplaintDate(selectedComplaint.resolvedAt)}
                  </p>
                </div>
              )}
              {selectedComplaint.status === 'CLOSED' && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                  <Lock size={18} className="text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t.closed} — {complaintsService.formatComplaintDate(selectedComplaint.closedAt)}
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
              {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
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