// frontend/src/services/complaintService.js
// ============================================================
// COMPLAINT SERVICE - Frontend API client for the complaint system
// ============================================================
import api from '../utils/api';

// ============================================================
// CONSTANTS
// ============================================================
export const COMPLAINT_STATUSES = [
  'NEW',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'ESCALATED',
  'RESOLVED',
  'CLOSED'
];

export const COMPLAINT_CATEGORIES = [
  'Payments',
  'Account',
  'Hiring',
  'Messages',
  'Technical Issue',
  'Abuse',
  'Fraud',
  'Other'
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// ============================================================
// USER COMPLAINT API
// ============================================================

/**
 * Upload a complaint attachment image to Cloudinary.
 * Returns the permanent URL to store in the complaint.
 */
export const uploadComplaintAttachment = async (file) => {
  const formData = new FormData();
  formData.append('attachment', file);
  // IMPORTANT: Do NOT set Content-Type manually. Axios must generate the
  // multipart boundary itself, otherwise multer cannot parse the body and
  // req.file is undefined, causing the upload to fail silently.
  const response = await api.post('/api/complaints/upload', formData);
  return response.data;
};

/**
 * Create a new complaint (WORKER or EMPLOYER).
 */
export const createComplaint = async (data) => {
  const response = await api.post('/api/complaints', data);
  return response.data;
};

export const reportUser = async (data) => {
  const response = await api.post('/api/complaints/report-user', data);
  return response.data;
};

export const reportMessage = async (data) => {
  const response = await api.post('/api/complaints/report-message', data);
  return response.data;
};

export const reportProfile = async (data) => {
  const response = await api.post('/api/complaints/report-profile', data);
  return response.data;
};

/**
 * Get the authenticated user's own complaints.
 */
export const getMyComplaints = async () => {
  const response = await api.get('/api/complaints/my');
  return response.data;
};

/**
 * Get a single complaint (owner only).
 */
export const getComplaintById = async (complaintId) => {
  const response = await api.get(`/api/complaints/${complaintId}`);
  return response.data;
};

/**
 * User replies to their complaint.
 */
export const userReplyToComplaint = async (complaintId, message) => {
  const response = await api.post(`/api/complaints/${complaintId}/reply`, { message });
  return response.data;
};

// ============================================================
// SUPPORT COMPLAINT API
// ============================================================

/**
 * List complaints for support (with filters).
 */
export const getSupportComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const response = await api.get(`/api/support/complaints?${params.toString()}`);
  return response.data;
};

/**
 * Get a single complaint for support/admin.
 */
export const getSupportComplaint = async (complaintId) => {
  const response = await api.get(`/api/support/complaints/${complaintId}`);
  return response.data;
};

/**
 * Assign a complaint to the current support agent.
 */
export const assignComplaint = async (complaintId) => {
  const response = await api.post(`/api/support/complaints/${complaintId}/assign`);
  return response.data;
};

/**
 * Support replies to a complaint.
 */
export const supportReplyToComplaint = async (complaintId, message) => {
  const response = await api.post(`/api/support/complaints/${complaintId}/reply`, { message });
  return response.data;
};

/**
 * Add an internal note to a complaint.
 */
export const addComplaintNote = async (complaintId, note) => {
  const response = await api.post(`/api/support/complaints/${complaintId}/notes`, { note });
  return response.data;
};

/**
 * Change complaint status.
 */
export const changeComplaintStatus = async (complaintId, status) => {
  const response = await api.put(`/api/support/complaints/${complaintId}/status`, { status });
  return response.data;
};

/**
 * Escalate a complaint to admin.
 */
export const escalateComplaint = async (complaintId, reason) => {
  const response = await api.post(`/api/support/complaints/${complaintId}/escalate`, { reason });
  return response.data;
};

/**
 * Close a complaint.
 */
export const closeComplaint = async (complaintId) => {
  const response = await api.post(`/api/support/complaints/${complaintId}/close`);
  return response.data;
};

/**
 * Get support dashboard statistics.
 */
export const getSupportStats = async () => {
  const response = await api.get('/api/support/stats');
  return response.data;
};

/**
 * Get support workspace dashboard data (KPIs, needs attention,
 * assigned tickets, waiting tickets, recent activity, conversations).
 */
export const getSupportDashboard = async () => {
  const response = await api.get('/api/support/dashboard');
  return response.data;
};

// ============================================================
// ADMIN COMPLAINT API
// ============================================================

/**
 * List all complaints for admin (with filters).
 */
export const getAdminComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const response = await api.get(`/api/admin/complaints?${params.toString()}`);
  return response.data;
};

/**
 * Get a single complaint for admin.
 */
export const getAdminComplaint = async (complaintId) => {
  const response = await api.get(`/api/admin/complaints/${complaintId}`);
  return response.data;
};

/**
 * Admin replies to a complaint.
 */
export const adminReplyToComplaint = async (complaintId, message) => {
  const response = await api.post(`/api/admin/complaints/${complaintId}/reply`, { message });
  return response.data;
};

/**
 * Admin reassigns a complaint to a support agent.
 */
export const adminReassignComplaint = async (complaintId, supportId) => {
  const response = await api.post(`/api/admin/complaints/${complaintId}/reassign`, { supportId });
  return response.data;
};

/**
 * Admin resolves a complaint.
 */
export const adminResolveComplaint = async (complaintId) => {
  const response = await api.put(`/api/admin/complaints/${complaintId}/resolve`);
  return response.data;
};

/**
 * Admin closes a complaint.
 */
export const adminCloseComplaint = async (complaintId) => {
  const response = await api.put(`/api/admin/complaints/${complaintId}/close`);
  return response.data;
};

/**
 * Admin returns a complaint to support.
 */
export const adminReturnComplaint = async (complaintId, supportId, note) => {
  const response = await api.post(`/api/admin/complaints/${complaintId}/return`, { supportId, note });
  return response.data;
};

export const adminApproveSuspensionRequest = async (complaintId) => {
  const response = await api.post(`/api/admin/complaints/${complaintId}/suspension/approve`);
  return response.data;
};

export const adminRejectSuspensionRequest = async (complaintId) => {
  const response = await api.post(`/api/admin/complaints/${complaintId}/suspension/reject`);
  return response.data;
};

/**
 * Get escalated complaints (backward-compatible).
 */
export const getEscalatedComplaints = async () => {
  const response = await api.get('/api/admin/complaints/escalated');
  return response.data;
};

/**
 * Get admin complaint statistics.
 */
export const getAdminComplaintStats = async () => {
  const response = await api.get('/api/admin/complaints/stats');
  return response.data;
};

// ============================================================
// UI HELPERS
// ============================================================

export const getStatusBadgeClass = (status) => {
  const styles = {
    NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    OPEN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    WAITING_FOR_USER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ESCALATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  };
  return styles[status] || styles.NEW;
};

export const getPriorityBadgeClass = (priority) => {
  const styles = {
    Low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };
  return styles[priority] || styles.Medium;
};

export const getStatusLabel = (status) => {
  const labels = {
    NEW: 'New',
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_USER: 'Waiting for User',
    ESCALATED: 'Escalated',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority) => {
  return priority || 'Medium';
};

export const formatComplaintDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============================================================
// SUP-HELP COMPLAINT API
// ============================================================

export const getSupHelpComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const response = await api.get(`/api/sup-help/complaints?${params.toString()}`);
  return response.data;
};

export const getSupHelpComplaint = async (complaintId) => {
  const response = await api.get(`/api/sup-help/complaints/${complaintId}`);
  return response.data;
};

export const assignSupHelpComplaint = async (complaintId) => {
  const response = await api.post(`/api/sup-help/complaints/${complaintId}/assign`);
  return response.data;
};

export const supHelpReplyToComplaint = async (complaintId, message) => {
  const response = await api.post(`/api/sup-help/complaints/${complaintId}/reply`, { message });
  return response.data;
};

export const addSupHelpComplaintNote = async (complaintId, note) => {
  const response = await api.post(`/api/sup-help/complaints/${complaintId}/notes`, { note });
  return response.data;
};

export const changeSupHelpComplaintStatus = async (complaintId, status) => {
  const response = await api.put(`/api/sup-help/complaints/${complaintId}/status`, { status });
  return response.data;
};

export const escalateSupHelpComplaint = async (complaintId, reason, targetRole) => {
  const response = await api.post(`/api/sup-help/complaints/${complaintId}/escalate`, { reason, targetRole });
  return response.data;
};

export const closeSupHelpComplaint = async (complaintId) => {
  const response = await api.post(`/api/sup-help/complaints/${complaintId}/close`);
  return response.data;
};

export const getSupHelpComplaintStats = async () => {
  const response = await api.get('/api/sup-help/complaints/stats');
  return response.data;
};

const complaintService = {
  uploadComplaintAttachment,
  createComplaint,
  reportUser,
  reportMessage,
  reportProfile,
  getMyComplaints,
  getComplaintById,
  userReplyToComplaint,
  getSupportComplaints,
  getSupportComplaint,
  assignComplaint,
  supportReplyToComplaint,
  addComplaintNote,
  changeComplaintStatus,
  escalateComplaint,
  closeComplaint,
  getSupportStats,
  getSupportDashboard,
  getAdminComplaints,
  getAdminComplaint,
  adminReplyToComplaint,
  adminReassignComplaint,
  adminResolveComplaint,
  adminCloseComplaint,
  adminReturnComplaint,
  adminApproveSuspensionRequest,
  adminRejectSuspensionRequest,
  getEscalatedComplaints,
  getAdminComplaintStats,
  getSupHelpComplaints,
  getSupHelpComplaint,
  assignSupHelpComplaint,
  supHelpReplyToComplaint,
  addSupHelpComplaintNote,
  changeSupHelpComplaintStatus,
  escalateSupHelpComplaint,
  closeSupHelpComplaint,
  getSupHelpComplaintStats,
  COMPLAINT_STATUSES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getStatusLabel,
  getPriorityLabel,
  formatComplaintDate
};

export default complaintService;
