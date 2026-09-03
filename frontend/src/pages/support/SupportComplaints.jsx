// Support Complaints Page - Production complaint workflow management
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  Shield,
  ShieldAlert,
  UserCheck,
  History,
  Lock,
  Flag,
  Paperclip,
  Home,
  Users,
  MessageCircle,
  Headphones,
  RotateCcw
} from 'lucide-react';
import complaintsService from '../../services/complaintService';
import { UserAvatar, UserDisplayName } from '../../components/users';

const SupportComplaints = ({ isSupHelp: propIsSupHelp }) => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore(state => state.user);
  const isSupHelp = Boolean(propIsSupHelp || location.pathname.startsWith('/sup-help') || authUser?.role === 'SUPPORT_HELPER');
  const [escalationTarget, setEscalationTarget] = useState('SUPPORT');
  const [viewTab, setViewTab] = useState(searchParams.get('view') || 'all');
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
  const [supervisorNoteText, setSupervisorNoteText] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [supHelpTeam, setSupHelpTeam] = useState([]);
  const [selectedTargetHelperId, setSelectedTargetHelperId] = useState('');
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

  const selectedAssignedSupportId = selectedComplaint?.assignedSupport?.id
    || selectedComplaint?.assignedSupport;
  const isHelperAssigned = selectedComplaint?.assignedSupport?.role === 'SUPPORT_HELPER';
  const isEscalatedToSupport = selectedComplaint?.escalatedTo === 'SUPPORT';
  const isMonitoringComplaint = !isSupHelp && authUser?.role === 'SUPPORT' && isHelperAssigned && !isEscalatedToSupport;

  const canWorkSelectedComplaint = authUser?.role === 'ADMIN'
    || String(selectedAssignedSupportId || '') === String(authUser?.id || '')
    || (!isSupHelp && authUser?.role === 'SUPPORT' && isEscalatedToSupport);

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
      if (!isSupHelp && viewTab && viewTab !== 'all') filters.view = viewTab;

      const response = isSupHelp
        ? await complaintsService.getSupHelpComplaints(filters)
        : await complaintsService.getSupportComplaints(filters);
      if (response?.success) {
        setComplaints(response.complaints || []);
      }
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, userIdFilter, assignedToFilter, authUser?.id, isSupHelp, viewTab]);

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
    setEscalationTarget('SUPPORT');
    try {
      const data = isSupHelp
        ? await complaintsService.getSupHelpComplaint(complaint.id)
        : await complaintsService.getSupportComplaint(complaint.id);
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
      const response = isSupHelp
        ? await complaintsService.assignSupHelpComplaint(selectedComplaint.id)
        : await complaintsService.assignComplaint(selectedComplaint.id);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.assigned });
        setSelectedComplaint(response.complaint);
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setSelectedComplaint(detail.complaint);
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
      const response = isSupHelp
        ? await complaintsService.supHelpReplyToComplaint(selectedComplaint.id, replyText)
        : await complaintsService.supportReplyToComplaint(selectedComplaint.id, replyText);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.replySent });
        setReplyText('');
        setSelectedComplaint(response.complaint);
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
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
      const response = isSupHelp
        ? await complaintsService.addSupHelpComplaintNote(selectedComplaint.id, noteText)
        : await complaintsService.addComplaintNote(selectedComplaint.id, noteText);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.noteAdded });
        setNoteText('');
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
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
  // SUPERVISOR ACTIONS (PHASE B1)
  // ============================================================
  const handleTakeover = () => {
    if (!selectedComplaint) return;
    const helperName = selectedComplaint.assignedSupport?.fullName || selectedComplaint.assignedSupport?.name || 'Sup-Help';
    setConfirmDialog({
      title: t.takeOverComplaint || 'Take Over Complaint',
      message: i18nT('supportComplaintsPage.confirmTakeover', { name: helperName }),
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const expectedAssignee = selectedAssignedSupportId;
          const response = await complaintsService.supportTakeoverComplaint(selectedComplaint.id, expectedAssignee);
          if (response?.success) {
            setNotification({ type: 'success', text: t.complaintTakenOver || 'Complaint taken over successfully' });
            setSelectedComplaint(response.complaint);
            const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
            if (detail?.success) {
              setTimeline(detail.timeline || []);
              setNotes(detail.notes || []);
            }
            fetchComplaints();
          }
        } catch (error) {
          console.error('❌ Error taking over complaint:', error);
          setNotification({
            type: 'error',
            text: error.response?.data?.message || t.staleAssignmentError || 'Failed to take over complaint',
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const openReassignModal = async () => {
    setSelectedTargetHelperId('');
    setShowReassignModal(true);
    try {
      const teamData = await complaintsService.getSupHelpTeam();
      if (teamData?.success) {
        const helpersList = Array.isArray(teamData.helpers)
          ? teamData.helpers
          : Array.isArray(teamData.team)
            ? teamData.team
            : [];
        setSupHelpTeam(helpersList);
      }
    } catch (error) {
      console.error('❌ Error loading Sup-Help team:', error);
    }
  };

  const handleReassign = async () => {
    if (!selectedTargetHelperId || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const expectedAssignee = selectedAssignedSupportId;
      const response = await complaintsService.supportReassignComplaint(
        selectedComplaint.id,
        selectedTargetHelperId,
        expectedAssignee
      );
      if (response?.success) {
        setNotification({ type: 'success', text: t.complaintReassigned || 'Complaint reassigned successfully' });
        setShowReassignModal(false);
        setSelectedTargetHelperId('');
        setSelectedComplaint(response.complaint);
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
          setNotes(detail.notes || []);
        }
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error reassigning complaint:', error);
      setNotification({
        type: 'error',
        text: error.response?.data?.message || t.staleAssignmentError || 'Failed to reassign complaint',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToQueue = () => {
    if (!selectedComplaint) return;
    setConfirmDialog({
      title: t.returnToQueue || 'Return to Queue',
      message: t.confirmReturnToQueue || 'Are you sure you want to return this complaint to the frontline queue? It will become claimable by all helpers.',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const expectedAssignee = selectedAssignedSupportId;
          const response = await complaintsService.supportReturnComplaintToQueue(selectedComplaint.id, expectedAssignee);
          if (response?.success) {
            setNotification({ type: 'success', text: t.returnedToQueue || 'Complaint returned to queue successfully' });
            setSelectedComplaint(response.complaint);
            const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
            if (detail?.success) {
              setTimeline(detail.timeline || []);
              setNotes(detail.notes || []);
            }
            fetchComplaints();
          }
        } catch (error) {
          console.error('❌ Error returning complaint to queue:', error);
          setNotification({
            type: 'error',
            text: error.response?.data?.message || t.staleAssignmentError || 'Failed to return complaint to queue',
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleAddSupervisorNote = async () => {
    if (!supervisorNoteText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await complaintsService.addComplaintNote(selectedComplaint.id, supervisorNoteText.trim());
      if (response?.success) {
        setNotification({ type: 'success', text: t.supervisorNoteAdded || 'Supervisor note added successfully' });
        setSupervisorNoteText('');
        const detail = await complaintsService.getSupportComplaint(selectedComplaint.id);
        if (detail?.success) {
          setTimeline(detail.timeline || []);
          setNotes(detail.notes || []);
        }
      }
    } catch (error) {
      console.error('❌ Error adding supervisor note:', error);
      setNotification({ type: 'error', text: error.response?.data?.message || 'Failed to add supervisor note' });
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
      const response = isSupHelp
        ? await complaintsService.changeSupHelpComplaintStatus(selectedComplaint.id, status)
        : await complaintsService.changeComplaintStatus(selectedComplaint.id, status);
      if (response?.success) {
        setNotification({ type: 'success', text: i18nT('supportComplaintsPage.notifications.statusChanged', { status: getStatusLabel(status) }) });
        setSelectedComplaint(response.complaint);
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
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
      const response = isSupHelp
        ? await complaintsService.escalateSupHelpComplaint(selectedComplaint.id, escalationReason, escalationTarget)
        : await complaintsService.escalateComplaint(selectedComplaint.id, escalationReason);
      if (response?.success) {
        const notifText = isSupHelp && escalationTarget === 'SUPPORT'
          ? (t.notifications?.escalatedToSupAdmin || 'Complaint escalated to Sup-Admin')
          : (t.notifications?.escalatedToCoAdmin || t.notifications?.escalated || 'Complaint escalated to admin');
        setNotification({ type: 'success', text: notifText });
        setShowEscalateModal(false);
        setEscalationReason('');
        setSelectedComplaint(response.complaint);
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
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
      const response = isSupHelp
        ? await complaintsService.closeSupHelpComplaint(selectedComplaint.id)
        : await complaintsService.closeComplaint(selectedComplaint.id);
      if (response?.success) {
        setNotification({ type: 'success', text: t.notifications.closed });
        setSelectedComplaint(response.complaint);
        const detail = isSupHelp
          ? await complaintsService.getSupHelpComplaint(selectedComplaint.id)
          : await complaintsService.getSupportComplaint(selectedComplaint.id);
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
                      isPremium={msg.authorIsPremium || msg.author?.isPremium || (msg.isOriginal && selectedComplaint?.User?.isPremium)}
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
    <SupportLayout
      allowedRoles={isSupHelp ? ['SUPPORT_HELPER', 'ADMIN'] : ['SUPPORT', 'ADMIN']}
      role={isSupHelp ? 'SUPPORT_HELPER' : undefined}
      headerTitle={isSupHelp ? 'supportNavigation.complaints' : undefined}
    >
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 space-y-4">
          {!isSupHelp && (authUser?.role === 'SUPPORT' || authUser?.role === 'ADMIN') && (
            <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
              {[
                { id: 'all', label: t.views?.all || 'All Complaints' },
                { id: 'my', label: t.views?.my || 'My Complaints' },
                { id: 'unassigned', label: t.views?.unassigned || 'Unassigned Queue' },
                { id: 'escalated', label: t.views?.escalated || 'Escalated from Sup-Help' },
                { id: 'sup_help', label: t.views?.sup_help || 'Sup-Help Queue' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewTab === tab.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

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
                            <UserDisplayName user={complaint.User} name={t.unknownUser} />
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate flex items-center gap-1">
                    <UserDisplayName user={selectedComplaint.User} name={t.unknownUser} />
                    <span>({selectedComplaint.User?.email})</span>
                  </div>
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
              {/* Supervisory Monitoring Banner & Control Area (Phase B1) */}
              {isMonitoringComplaint && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-5 dark:border-blue-900/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <Shield size={22} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                          <span>{t.monitoringMode || 'Monitoring Mode'}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {selectedComplaint.assignedSupport?.fullName || selectedComplaint.assignedSupport?.name || 'Sup-Help'}
                          </span>
                        </h4>
                        <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                          {i18nT('supportComplaintsPage.monitoringNotice', {
                            defaultValue: 'This complaint is currently assigned to Sup-Help. You can take over, reassign, return to queue, or add a supervisor note.'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Supervisor Action Buttons */}
                  {!['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-200 mb-2">
                        {t.supervisorActions || 'Supervisor Actions'}
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={handleTakeover}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <UserCheck size={15} />
                          {t.takeOver || 'Take Over'}
                        </button>
                        <button
                          onClick={openReassignModal}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <Users size={15} />
                          {t.reassignToSupHelp || 'Reassign to Sup-Help'}
                        </button>
                        <button
                          onClick={handleReturnToQueue}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <RotateCcw size={15} />
                          {t.returnToQueue || 'Return to Queue'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Supervisor Internal Note Composer */}
                  <div className="pt-3 border-t border-blue-200/80 dark:border-blue-900/60">
                    <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1.5">
                      <StickyNote size={14} className="text-blue-600 dark:text-blue-400" />
                      {t.supervisorInternalNote || 'Supervisor Internal Note'}
                    </h5>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={supervisorNoteText}
                        onChange={(e) => setSupervisorNoteText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddSupervisorNote(); } }}
                        placeholder={t.supervisorNotePlaceholder || 'Write an internal supervisor note (visible only to staff)...'}
                        className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleAddSupervisorNote}
                        disabled={actionLoading || !supervisorNoteText.trim()}
                        className="px-3.5 py-2 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-1.5 flex-shrink-0"
                      >
                        <StickyNote size={14} />
                        {t.addSupervisorNote || 'Add Supervisor Note'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                    {selectedComplaint.assignedSupport ? (
                      selectedComplaint.assignedSupport?.fullName || selectedComplaint.assignedSupport?.name || t.yes
                    ) : t.no}
                  </p>
                </div>
              </div>

              {(selectedComplaint.reportedUserId || selectedComplaint.conversationId || selectedComplaint.messageId) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <h4 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">{i18nT('messagesReporting.reportMessage')}</h4>
                  <div className="space-y-1 text-xs text-amber-900 dark:text-amber-100">
                    {selectedComplaint.reportedUserId && <p><span className="font-medium">{i18nT('messagesReporting.reportedUser')}:</span> {selectedComplaint.reportedUserId}</p>}
                    {selectedComplaint.conversationId && <p><span className="font-medium">{i18nT('messagesReporting.conversationReference')}:</span> {selectedComplaint.conversationId}</p>}
                    {selectedComplaint.messageId && <p><span className="font-medium">{i18nT('messagesReporting.messageReference')}:</span> {selectedComplaint.messageId}</p>}
                  </div>
                </div>
              )}

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

              {/* Assign Button (Unassigned) */}
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

              {/* Claim Escalated Button */}
              {isEscalatedToSupport && String(selectedAssignedSupportId || '') !== String(authUser?.id || '') && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
                <div>
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 rounded-lg transition flex items-center gap-2"
                  >
                    <UserCheck size={16} />
                    {t.claimEscalated || 'Claim Escalated Complaint'}
                  </button>
                </div>
              )}

              {/* Status Change */}
              {canWorkSelectedComplaint && <div>
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
              </div>}

              {/* Conversation Thread */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                  {t.conversation}
                </h4>
                {renderThread()}
              </div>

              {/* Reply */}
              {canWorkSelectedComplaint && <div>
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
              </div>}

              {/* Internal Note */}
              {canWorkSelectedComplaint && <div>
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
              </div>}

              {/* Internal Notes Display */}
              {(canWorkSelectedComplaint || isMonitoringComplaint) && notes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.internalNotes}</h4>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600/50">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{note.note}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{note.authorName}</span>
                          {note.authorRole && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                              {note.authorRole === 'ADMIN' ? 'Co-Admin' : note.authorRole === 'SUPPORT' ? 'Sup-Admin' : 'Sup-Help'}
                            </span>
                          )}
                          <span>• {formatDate(note.createdAt)}</span>
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
              {canWorkSelectedComplaint && !['ESCALATED', 'RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
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
              {canWorkSelectedComplaint && !['RESOLVED', 'CLOSED'].includes(selectedComplaint.status) && (
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

      {/* Reassign Modal (Phase B1) */}
      {showReassignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                {t.reassignToSupHelp || 'Reassign to Sup-Help'}
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.currentAssignee || 'Current Assignee'}
                </p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <UserAvatar
                    name={selectedComplaint.assignedSupport?.fullName || 'Sup-Help'}
                    image={selectedComplaint.assignedSupport?.profileImage || selectedComplaint.assignedSupport?.image}
                    role="SUPPORT_HELPER"
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {selectedComplaint.assignedSupport?.fullName || 'Sup-Help'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedComplaint.assignedSupport?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.selectHelper || 'Select Support Helper'}
                </p>
                {(() => {
                  const currentAssigneeId = String(
                    selectedComplaint?.assignedSupport?.id
                    || selectedComplaint?.assignedSupport?._id
                    || (typeof selectedComplaint?.assignedSupport === 'string' ? selectedComplaint.assignedSupport : '')
                    || selectedComplaint?.assignedTo
                    || ''
                  );
                  const eligibleHelpers = (supHelpTeam || []).filter((helper) => {
                    const helperId = String(helper?.id || helper?._id || '');
                    return helperId && helperId !== currentAssigneeId && (!helper.role || helper.role === 'SUPPORT_HELPER');
                  });

                  if (eligibleHelpers.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                        {t.noOtherHelpers || 'No other support helpers available'}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {eligibleHelpers.map((helper) => {
                        const helperId = String(helper.id || helper._id);
                        const isSelected = String(selectedTargetHelperId) === helperId;
                        const openCount = helper.activeComplaints ?? helper.workload?.openComplaints ?? helper.openTickets ?? 0;
                        return (
                          <div
                            key={helperId}
                            onClick={() => setSelectedTargetHelperId(helperId)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar
                                name={helper.fullName || 'Helper'}
                                image={helper.profileImage || helper.image}
                                role="SUPPORT_HELPER"
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {helper.fullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {helper.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                {openCount} {t.open || 'open'}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => setShowReassignModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleReassign}
                disabled={actionLoading || !selectedTargetHelperId}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
              >
                {t.reassignToSupHelp || 'Reassign'}
              </button>
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
                {isSupHelp
                  ? (escalationTarget === 'SUPPORT' ? (t.escalateToSupAdmin || 'Escalate to Sup-Admin') : (t.escalateToCoAdmin || 'Escalate to Co-Admin'))
                  : t.escalate}
              </h3>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isSupHelp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.escalateTarget || 'Escalation Target'} *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEscalationTarget('SUPPORT')}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition flex flex-col items-center gap-1 ${
                        escalationTarget === 'SUPPORT'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-500/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="font-semibold text-xs md:text-sm">{t.escalateToSupAdmin || 'Escalate to Sup-Admin'}</span>
                      <span className="text-[11px] opacity-75">{t.supAdmin || 'Sup-Admin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscalationTarget('ADMIN')}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition flex flex-col items-center gap-1 ${
                        escalationTarget === 'ADMIN'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="font-semibold text-xs md:text-sm">{t.escalateToCoAdmin || 'Escalate to Co-Admin'}</span>
                      <span className="text-[11px] opacity-75">{t.coAdmin || 'Co-Admin'}</span>
                    </button>
                  </div>
                </div>
              )}
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
