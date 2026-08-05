import api from '../utils/api';
import { getDisplayName } from './userDisplay';

export const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

export const getUserConversations = async (userId) => {
  if (!userId) return [];
  const response = await api.get(`/api/chat/conversations/${encodeURIComponent(userId)}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const getConversations = (userId) => getUserConversations(userId);

// Helper to build avatar URL (duplicated here to avoid circular imports)
const buildAvatarUrl = (name, role) => {
  const bg = role === 'EMPLOYER' ? 'teal' : role === 'WORKER' ? 'red' : role === 'ADMIN' ? 'yellow' : 'purple';
  const color = role === 'ADMIN' ? '000' : 'fff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bg}&color=${color}&size=100&bold=true`;
};

export const getConversationMessages = async (conversationId) => {
  if (!conversationId) return [];
  const response = await api.get(`/api/chat/messages/${encodeURIComponent(conversationId)}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const getMessages = (conversationId) => getConversationMessages(conversationId);

export const sendMessage = async (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  if (!senderId || !recipientId || !text || !text.trim()) {
    console.log('Missing required fields');
    return null;
  }

  // Ensure we're using User ObjectId (24 hex characters)
  const validSenderId = String(senderId);
  const validRecipientId = String(recipientId);

  const requestBody = {
    senderId: validSenderId,
    senderName,
    senderRole,
    recipientId: validRecipientId,
    recipientName,
    text: text.trim()
  };

  const response = await api.post('/api/chat/send', requestBody);

  return response.data;
};

export const markMessagesAsRead = async (conversationId, userId) => {
  if (!conversationId || !userId) return false;

  const result = await api.post('/api/chat/mark-read', {
    conversationId,
    userId
  });

  return !!result.data?.success;
};

export const getUnreadCount = async (conversationId, userId) => {
  const messages = await getConversationMessages(conversationId);
  return messages.filter((msg) => String(msg.recipientId) === String(userId) && !msg.read).length;
};

export const getTotalUnreadCount = async (userId) => {
  if (!userId) return 0;
  const response = await api.get(`/api/chat/unread/${encodeURIComponent(userId)}`);
  return response.data?.count || 0;
};

export const ensureConversationExists = async (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  // Ensure we're using User ObjectId (24 hex characters)
  const validUser1Id = String(user1Id);
  const validUser2Id = String(user2Id);

  const response = await api.post('/api/chat/ensure-conversation', {
    user1Id: validUser1Id,
    user1Name,
    user1Role,
    user2Id: validUser2Id,
    user2Name,
    user2Role
  });
  return response.data?.conversationId || getConversationId(validUser1Id, validUser2Id);
};

export const createConversation = (userId1, userName1, userRole1, userId2, userName2, userRole2) =>
  ensureConversationExists(userId1, userName1, userRole1, userId2, userName2, userRole2);

export const conversationExists = async (user1Id, user2Id) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = await getConversationMessages(conversationId);
  return messages.length > 0;
};

export const getOrCreateConversation = (user1Id, user2Id) => getConversationId(user1Id, user2Id);

export const sendWelcomeMessage = async (
  employerId,
  employerName,
  employerRole,
  workerId,
  workerName,
  workerRole,
  jobTitle
) => {
  return sendMessage(employerId, employerName, employerRole || 'EMPLOYER', workerId, workerName, `Hello! I'm ${employerName}, the employer for the job "${jobTitle || 'Service'}". I'd like to discuss the next steps.`);
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/api/chat/conversations/${encodeURIComponent(conversationId)}`);
  return !!response.data?.success;
};

export const getSupportUsers = async () => {
  const response = await api.get('/api/chat/support-users');
  return response.data?.users || [];
};

// ============================================================
// SECURE ADMIN MESSAGING APIS
// ============================================================
// Admin does NOT have automatic access to private user chats.
// These endpoints only return conversations Admin is authorized to view:
//   1. Escalated conversations (after support escalates)
//   2. Support conversations (supervision)
//   3. Internal staff messages (Support <-> Admin)
// ============================================================

// GET /api/admin/escalated-conversations
// List conversations escalated to Admin by Support.
export const getEscalatedConversations = async () => {
  const response = await api.get('/api/admin/escalated-conversations');
  return response.data?.conversations || [];
};

// GET /api/admin/support-conversations
// List all support conversations for supervision.
export const getAdminSupportConversations = async () => {
  const response = await api.get('/api/admin/support-conversations');
  return response.data?.conversations || [];
};

// GET /api/admin/internal-messages
// List internal staff conversations (Support <-> Admin).
export const getInternalMessages = async () => {
  const response = await api.get('/api/admin/internal-messages');
  return response.data?.conversations || [];
};

// GET /api/admin/conversations/:conversationId/messages
// Get messages for an admin-accessible conversation.
// Access is verified server-side: only ESCALATED, SUPPORT, or INTERNAL.
export const getAdminConversationMessages = async (conversationId) => {
  if (!conversationId) return { conversation: null, messages: [] };
  const response = await api.get(`/api/admin/conversations/${encodeURIComponent(conversationId)}/messages`);
  return {
    conversation: response.data?.conversation || null,
    messages: response.data?.messages || []
  };
};

// ============================================================
// SECURE SUPPORT MESSAGING APIS
// ============================================================

// GET /api/support/conversations
// List support conversations assigned to this support agent.
export const getSupportConversations = async () => {
  const response = await api.get('/api/support/conversations');
  return response.data?.conversations || [];
};

// GET /api/support/conversations/:id
// Get a single support conversation with messages.
export const getSupportConversationMessages = async (conversationId) => {
  if (!conversationId) return { conversation: null, messages: [] };
  const response = await api.get(`/api/support/conversations/${encodeURIComponent(conversationId)}`);
  return {
    conversation: response.data?.conversation || null,
    messages: response.data?.messages || []
  };
};

// POST /api/support/conversations/:id/escalate
// Escalate a support conversation to Admin.
// Saves: complaintId, conversationId, escalatedBy, escalatedAt, reason.
export const escalateConversation = async (conversationId, reason, complaintId = null) => {
  if (!conversationId || !reason) return null;
  const response = await api.post(`/api/support/conversations/${encodeURIComponent(conversationId)}/escalate`, {
    reason,
    complaintId
  });
  return response.data;
};

// POST /api/admin/start-conversation
// Start an official HomelyServ administrative conversation with a user.
// Conversation type is SUPPORT (for WORKER/EMPLOYER/USER) or INTERNAL (for SUPPORT).
// Never PRIVATE. Private user chats remain completely isolated.
export const startAdminConversation = async (userId) => {
  if (!userId) return null;
  const response = await api.post('/api/admin/start-conversation', { userId });
  return response.data;
};

export const debugChatData = async (userId) => {
  console.log('=== CHAT DATA DEBUG ===');
  if (!userId) {
    console.log('Pass a userId to inspect their conversations, e.g. debugChatData("123")');
    return;
  }
  const conversations = await getUserConversations(userId);
  console.log(`User ${userId}: ${conversations.length} conversations`);
  conversations.forEach((c) => {
    console.log(`  ${c.otherUserName}: "${c.lastMessage}" (unread: ${c.unread})`);
  });
  console.log('=== END DEBUG ===');
};

export const getAllConversations = () => {
  console.warn('getAllConversations is no longer available client-side.');
  return [];
};

/**
 * Shared display name formatter for all chat UI.
 * Delegates to the centralized userDisplay utility.
 * 
 * @param {string} name - The user's raw name
 * @param {string} role - The user's role (ADMIN, EMPLOYER, WORKER, SUPPORT, USER)
 * @returns {string} The formatted display name
 */
export const formatDisplayName = (name, role) => {
  return getDisplayName({ fullName: name, role });
};

export default {
  getConversationId,
  getUserConversations,
  getConversations,
  getConversationMessages,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  getTotalUnreadCount,
  ensureConversationExists,
  createConversation,
  conversationExists,
  getOrCreateConversation,
  sendWelcomeMessage,
  deleteConversation,
  getSupportUsers,
  getEscalatedConversations,
  getAdminSupportConversations,
  getInternalMessages,
  getAdminConversationMessages,
  getSupportConversations,
  getSupportConversationMessages,
  escalateConversation,
  startAdminConversation,
  debugChatData,
  getAllConversations,
  formatDisplayName
};
