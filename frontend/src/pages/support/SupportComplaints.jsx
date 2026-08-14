// Support Complaints Page - Production complaint workflow management
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import {
  Search,
  Filter,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  X,
  Clock,
  FileText,
  Send,
  StickyNote,
  ShieldAlert,
  UserCheck,
  History,
  Lock,
  Flag,
  Paperclip
} from 'lucide-react';
import complaintsService from '../../services/complaintService';
import { UserAvatar, UserDisplayName } from '../../components/users';

const SupportComplaints = () => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore(state => state.user);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState(searchParams.get('userId') || '');
  const [assignedToFilter, setAssignedToFilter] = useState(searchParams.get('assignedTo') || '');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const t = i18nT('supportComplaintsPage', { returnObjects: true });

  const getStatusLabel = (status) =>
    t.statusLabels[String(status || '').toUpperCase()] || t.unknownStatus;

  const getPriorityLabel = (priority) =>
    t.priorityLabels[String(priority || '').toLowerCase()] || t.unknownPriority;

  const getCategoryLabel = (category) =>
    t.categoryLabels[String(category || '').toLowerCase().replaceAll(' ', '_')] || t.unknownCategory;

  const getTimelineActionLabel = (action) =>
    t.timelineActions[String(action || '').toUpperCase()] || t.unknownActivity;

  const getTimelineDescription = (event) => {
    if (event?.action === 'STATUS_CHANGED') {
      return i18nT('supportComplaintsPage.statusChangeDescription', {
        oldStatus: getStatusLabel(event.oldValue),
        newStatus: getStatusLabel(event.newValue)
      });
    }
    return getTimelineActionLabel(event?.action);
  };

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (categoryFilter) filters.category = categoryFilter;
      if (userIdFilter) filters.userId = userIdFilter;
      if (assignedToFilter === 'me') filters.assignedTo = authUser?.id;

      const response = await complaintsService.getSupportComplaints(filters);
      if (response?.success) {
        setComplaints(response.complaints || []);
      }
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, userIdFilter, assignedToFilter, authUser?.id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // ============================================================
  // VIEW COMPLAINT DETAILS
  // ============================================================
  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setReplyText('');
    setNoteText('');
    setEscalationReason('');
    try {
      const data = await complaintsService.getSupportComplaint(complaint.id);
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
  // ASSIGN TO SELF
  // ============================================================
  const handleAssign = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.assignComplaint(selectedComplaint.id);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.assigned });
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error assigning:', error);
      setNotification({ type: 'error', text: t.notifications.assignFailed });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // REPLY
  // ============================================================
  const handleReply = async () => {
    if (!replyText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.supportReplyToComplaint(selectedComplaint.id, replyText);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.replySent });
        setReplyText('');
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setSelectedComplaint(detail.complaint);
          setTimeline(detail.timeline || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error replying:', error);
      setNotification({ type: 'error', text: t.notifications.replyFailed });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // ADD INTERNAL NOTE
  // ============================================================
  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.addComplaintNote(selectedComplaint.id, noteText);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.noteAdded });
        setNoteText('');
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setNotes(detail.notes || []);
          setTimeline(detail.timeline || []);
        }
      }
    } catch (error) {
      console.error('❌ Error adding note:', error);
      setNotification({ type: 'error', text: t.notifications.noteFailed });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // CHANGE STATUS
  // ============================================================
  const handleStatusChange = async (status) => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.changeComplaintStatus(selectedComplaint.id, status);
      if (response?.success) {
        setNotification({ type: 'success', text: i18nT('supportComplaintsPage.notifications.statusChanged', { status: getStatusLabel(status) }) });
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error changing status:', error);
      setNotification({ type: 'error', text: t.notifications.statusFailed });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // ESCALATE
  // ============================================================
  const handleEscalate = async () => {
    if (!escalationReason.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.escalateComplaint(selectedComplaint.id, escalationReason);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.escalated });
        setShowEscalateModal(false);
        setEscalationReason('');
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error escalating:', error);
      setNotification({ type: 'error', text: t.notifications.escalateFailed });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // CLOSE
  // ============================================================
  const handleClose = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.closeComplaint(selectedComplaint.id);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.closed });
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error closing:', error);
      setNotification({ type: 'error', text: t.notifications.closeFailed });
    } finally {
      setActionLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return t.notAvailable;
    const locales = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', ru: 'ru-RU', tr: 'tr-TR', de: 'de-DE' };
    return new Date(dateString).toLocaleDateString(locales[i18n.resolvedLanguage] || locales.en, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        authorName: selectedComplaint?.User?.fullName || t.user,
        authorRole: selectedComplaint?.User?.role || 'USER',
        message: selectedComplaint?.description || '',
        attachments: selectedComplaint?.attachments || [],
        createdAt: selectedComplaint?.createdAt,
        isOriginal: true,
      },
      ...(selectedComplaint?.replies || []).map((reply) => ({
        id: reply.id,
        authorName: reply.authorName,
        authorRole: reply.authorRole,
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
            ? 'ml-auto bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'mr-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600';

          return (
            <div key={msg.id || index} className={`flex flex-col max-w-[85%] ${isUser ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
              <div className={`px-4 py-2.5 rounded-2xl ${bubbleClass}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-semibold ${isUser ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    <UserDisplayName
                      name={msg.authorName}
                      role={msg.authorRole}
                      size="sm"
                      className={isUser ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}
                    />
                  </span>
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
                        <img src={url} alt={i18nT('supportComplaintsPage.attachmentAlt', { number: i + 1 })} className="w-full h-full object-cover" />
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
            <AlertTriangle size={18} />
            {notification.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">{t.allStatuses}</option>
                <option value="NEW">{t.new}</option>
                <option value="OPEN">{t.open}</option>
                <option value="IN_PROGRESS">{t.inProgress}</option>
                <option value="WAITING_FOR_USER">{t.waitingForUser}</option>
                <option value="ESCALATED">{t.escalated}</option>
                <option value="RESOLVED">{t.resolved}</option>
                <option value="CLOSED">{t.closed}</option>
              </select>
            </div>
            <div className="relative">
              <Flag size={18} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">{t.allPriorities}</option>
                {complaintsService.COMPLAINT_PRIORITIES.map(p => <option key={p} value={p}>{getPriorityLabel(p)}</option>)}
              </select>
            </div>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">{t.allCategories}</option>
                {complaintsService.COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t.loading}</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t.noComplaints}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.subject}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.user}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.priority}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.date}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(complaint)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {complaint.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={complaint.User?.fullName || t.unknownUser}
                            image={complaint.User?.profileImage || complaint.User?.image || null}
                            role={complaint.User?.role}
                            size="sm"
                            className="border border-green-500/30"
                          />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {complaint.User?.fullName || t.unknownUser}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {complaint.User?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${complaintsService.getPriorityBadgeClass(complaint.priority)}`}>
                          <Flag size={12} />
                          {getPriorityLabel(complaint.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(complaint.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(complaint);
                          }}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                          title={t.reply}
                        >
                          <MessageSquare size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={selectedComplaint.User?.fullName || t.unknownUser}
                  image={selectedComplaint.User?.profileImage || selectedComplaint.User?.image || null}
                  role={selectedComplaint.User?.role}
                  size="md"
                  className="border border-green-500/30 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-green-500 flex-shrink-0" />
                    <span className="truncate">{selectedComplaint.subject}</span>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {selectedComplaint.User?.fullName} ({selectedComplaint.User?.email})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${complaintsService.getStatusBadgeClass(selectedComplaint.status)}`}>
                  {getStatusLabel(selectedComplaint.status)}
                </span>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Complaint Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.priority}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${complaintsService.getPriorityBadgeClass(selectedComplaint.priority)}`}>
                    <Flag size={12} />
                    {getPriorityLabel(selectedComplaint.priority)}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{getCategoryLabel(selectedComplaint.category)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatDate(selectedComplaint.createdAt)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.assigned}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedComplaint.assignedSupport ? t.yes : t.no}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.description}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Paperclip size={14} />
                  {t.attachments}
                </h4>
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.attachments.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                        className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:opacity-80 transition">
                        <img src={url} alt={i18nT('supportComplaintsPage.attachmentAlt', { number: index + 1 })} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noAttachments}</p>
                )}
              </div>

              {/* Assign Button */}
              {!selectedComplaint.assignedSupport && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div>
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition flex items-center gap-2"
                  >
                    <UserCheck size={16} />
                    {t.assign}
                  </button>
                </div>
              )}

              {/* Status Change */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.changeStatus}</h4>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        selectedComplaint.status === status
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-500/10 hover:text-green-600'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Thread */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                  {t.conversation}
                </h4>
                {renderThread()}
              </div>

              {/* Reply */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.reply}</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    placeholder={t.replyPlaceholder}
                    className="flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleReply}
                    disabled={actionLoading || !replyText.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={16} />
                    {t.send}
                  </button>
                </div>
              </div>

              {/* Internal Note */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.addNote}</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t.notePlaceholder}
                    className="flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={actionLoading || !noteText.trim()}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <StickyNote size={16} />
                    {t.addNote}
                  </button>
                </div>
              </div>

              {/* Internal Notes Display */}
              {notes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.internalNotes}</h4>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{note.note}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {note.authorName} • {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <History size={14} />
                  {t.timeline}
                </h4>
                {timeline.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.map((event, index) => (
                      <div key={event.id || index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                          {index < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600"></div>}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTimelineActionLabel(event.action)}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {getTimelineDescription(event)}
                            {event.authorName && ` — ${event.authorName}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTimelineEvents}</p>
                )}
              </div>

              {/* Escalation Info */}
              {selectedComplaint.status === 'ESCALATED' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <ShieldAlert size={16} />
                    {t.escalated}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {selectedComplaint.escalationReason}
                  </p>
                  {selectedComplaint.escalatedAt && (
                    <p className="text-xs text-red-500 mt-1">
                      {t.escalatedAt}: {formatDate(selectedComplaint.escalatedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Escalate Button */}
              {!['ESCALATED', 'RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="px-4 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition flex items-center gap-2"
                  >
                    <ArrowUpRight size={16} />
                    {t.escalate}
                  </button>
                </div>
              )}

              {/* Close Button */}
              {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setConfirmDialog({
                      title: t.close,
                      message: t.confirmClose,
                      onConfirm: handleClose
                    })}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                  >
                    <Lock size={16} />
                    {t.close}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight size={20} className="text-red-500" />
                {t.escalate}
              </h3>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.escalateReason} *
                </label>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows="3"
                  placeholder={t.escalationPlaceholder}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={actionLoading || !escalationReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {t.confirmEscalate}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </SupportLayout>
  );
};

export default SupportComplaints;
