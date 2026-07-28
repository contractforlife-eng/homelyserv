import api from '../utils/api';

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

  const response = await api.post('/api/chat/send', {
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    text: text.trim()
  });

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
  const response = await api.post('/api/chat/ensure-conversation', {
    user1Id,
    user1Name,
    user1Role,
    user2Id,
    user2Name,
    user2Role
  });
  return response.data?.conversationId || getConversationId(user1Id, user2Id);
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
  debugChatData,
  getAllConversations
};
