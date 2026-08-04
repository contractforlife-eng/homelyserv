// Support Complaints Page - Complaint workflow management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SupportLayout from '../../layouts/SupportLayout';
import { useDashboard } from '../../components/layout/DashboardContext';
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
  ShieldAlert
} from 'lucide-react';
import api from '../../utils/api';

const SupportComplaints = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const dashboard = useDashboard();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/api/support/complaints?${params.toString()}`);

      if (response.data?.success) {
        setComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchComplaints();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/api/support/complaints/${selectedComplaint.id}/reply`, {
        message: replyText
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: 'Reply sent successfully' });
        setReplyText('');
        setSelectedComplaint(response.data.complaint);
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error replying:', error);
      setNotification({ type: 'error', text: 'Failed to send reply' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/api/support/complaints/${selectedComplaint.id}/notes`, {
        note: noteText
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: 'Internal note added' });
        setNoteText('');
        setSelectedComplaint(response.data.complaint);
      }
    } catch (error) {
      console.error('❌ Error adding note:', error);
      setNotification({ type: 'error', text: 'Failed to add note' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await api.put(`/api/support/complaints/${selectedComplaint.id}/status`, {
        status
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: `Status changed to ${status}` });
        setSelectedComplaint(response.data.complaint);
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error changing status:', error);
      setNotification({ type: 'error', text: 'Failed to change status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim() || !selectedComplaint) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/api/support/complaints/${selectedComplaint.id}/escalate`, {
        reason: escalationReason
      });

      if (response.data?.success) {
        setNotification({ type: 'success', text: 'Complaint escalated to admin' });
        setShowEscalateModal(false);
        setEscalationReason('');
        setSelectedComplaint(response.data.complaint);
        fetchComplaints();
      }
    } catch (error) {
      console.error('❌ Error escalating:', error);
      setNotification({ type: 'error', text: 'Failed to escalate complaint' });
    } finally {
      setActionLoading(false);
    }
  };

  const translations = {
    en: {
      title: 'Complaints',
      subtitle: 'Manage complaint workflow',
      searchPlaceholder: 'Search complaints...',
      filterByStatus: 'Filter by status',
      allStatuses: 'All Statuses',
      new: 'New',
      inProgress: 'In Progress',
      waitingForUser: 'Waiting for User',
      escalated: 'Escalated',
      resolved: 'Resolved',
      closed: 'Closed',
      subject: 'Subject',
      user: 'User',
      status: 'Status',
      date: 'Date',
      noComplaints: 'No complaints found',
      loading: 'Loading...',
      reply: 'Reply',
      addNote: 'Add Internal Note',
      escalate: 'Escalate to Admin',
      escalateReason: 'Escalation Reason',
      confirmEscalate: 'Confirm Escalation',
      cancel: 'Cancel',
      send: 'Send',
      internalNotes: 'Internal Notes',
      adminNotes: 'Admin Notes',
      description: 'Description',
      priority: 'Priority',
      category: 'Category',
      escalatedBy: 'Escalated By',
      escalatedAt: 'Escalated At',
      changeStatus: 'Change Status',
      actions: 'Actions'
    },
    ar: {
      title: 'الشكاوى',
      subtitle: 'إدارة سير عمل الشكاوى',
      searchPlaceholder: 'البحث في الشكاوى...',
      filterByStatus: 'تصفية حسب الحالة',
      allStatuses: 'جميع الحالات',
      new: 'جديدة',
      inProgress: 'قيد المعالجة',
      waitingForUser: 'بانتظار المستخدم',
      escalated: 'مرفوعة للمشرف',
      resolved: 'تم الحل',
      closed: 'مغلقة',
      subject: 'الموضوع',
      user: 'المستخدم',
      status: 'الحالة',
      date: 'التاريخ',
      noComplaints: 'لا توجد شكاوى',
      loading: 'جاري التحميل...',
      reply: 'رد',
      addNote: 'إضافة ملاحظة داخلية',
      escalate: 'رفع للمشرف',
      escalateReason: 'سبب الرفع',
      confirmEscalate: 'تأكيد الرفع',
      cancel: 'إلغاء',
      send: 'إرسال',
      internalNotes: 'ملاحظات داخلية',
      adminNotes: 'ملاحظات المشرف',
      description: 'الوصف',
      priority: 'الأولوية',
      category: 'الفئة',
      escalatedBy: 'رفع بواسطة',
      escalatedAt: 'وقت الرفع',
      changeStatus: 'تغيير الحالة',
      actions: 'إجراءات'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  const getStatusBadge = (status) => {
    const styles = {
      NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      WAITING_FOR_USER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ESCALATED_TO_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return styles[status] || styles.NEW;
  };

  const getStatusLabel = (status) => {
    const labels = {
      NEW: t.new,
      IN_PROGRESS: t.inProgress,
      WAITING_FOR_USER: t.waitingForUser,
      ESCALATED_TO_ADMIN: t.escalated,
      RESOLVED: t.resolved,
      CLOSED: t.closed
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(dashboard.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="IN_PROGRESS">{t.inProgress}</option>
                <option value="WAITING_FOR_USER">{t.waitingForUser}</option>
                <option value="ESCALATED_TO_ADMIN">{t.escalated}</option>
                <option value="RESOLVED">{t.resolved}</option>
                <option value="CLOSED">{t.closed}</option>
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
                      onClick={() => setSelectedComplaint(complaint)}
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
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {complaint.User?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {complaint.User?.email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(complaint.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaint(complaint);
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-green-500" />
                  {selectedComplaint.subject}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedComplaint.User?.fullName} ({selectedComplaint.User?.email})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedComplaint.status)}`}>
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
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.description}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Status Change */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.changeStatus}</h4>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'].map((status) => (
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

              {/* Reply */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.reply}</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add internal note..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
              {selectedComplaint.internalNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.internalNotes}</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedComplaint.internalNotes}
                  </div>
                </div>
              )}

              {/* Admin Notes Display */}
              {selectedComplaint.adminNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.adminNotes}</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedComplaint.adminNotes}
                  </div>
                </div>
              )}

              {/* Escalation Info */}
              {selectedComplaint.status === 'ESCALATED_TO_ADMIN' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <ShieldAlert size={16} />
                    {t.escalated}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t.escalationReason}: {selectedComplaint.escalationReason}
                  </p>
                  {selectedComplaint.escalatedAt && (
                    <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                      {t.escalatedAt}: {formatDate(selectedComplaint.escalatedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Escalate Button */}
              {selectedComplaint.status !== 'ESCALATED_TO_ADMIN' && selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
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
                  placeholder="Explain why this complaint needs admin attention..."
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
    </SupportLayout>
  );
};

export default SupportComplaints;
