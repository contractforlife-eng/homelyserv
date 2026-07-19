// src/utils/chatService.js - WORKING VERSION
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/chat`
  : 'http://localhost:5000/api/chat';

const authHeaders = () => {
  const token = localStorage.getItem('homelyserv_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      console.error(`❌ Chat API error (${response.status}) on ${path}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Chat API request failed for ${path}:`, error);
    return null;
  }
}

export const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

export const getUserConversations = async (userId) => {
  if (!userId) return [];
  const data = await apiRequest(`/conversations/${encodeURIComponent(userId)}`);
  return Array.isArray(data) ? data : [];
};

export const getConversations = (userId) => getUserConversations(userId);

export const getConversationMessages = async (conversationId) => {
  if (!conversationId) return [];
  const data = await apiRequest(`/messages/${encodeURIComponent(conversationId)}`);
  return Array.isArray(data) ? data : [];
};

export const getMessages = (conversationId) => getConversationMessages(conversationId);

export const sendMessage = async (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  if (!senderId || !recipientId || !text || !text.trim()) {
    console.log('❌ Missing required fields');
    return null;
  }

  console.log('📤 Sending message:', { senderId, senderName, senderRole, recipientId, recipientName, text });

  const message = await apiRequest('/send', {
    method: 'POST',
    body: JSON.stringify({
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      text: text.trim()
    })
  });

  if (message) {
    console.log('✅ Message sent successfully');
  } else {
    console.log('❌ Failed to send message');
  }

  return message;
};

export const markMessagesAsRead = async (conversationId, userId) => {
  if (!conversationId || !userId) return false;

  console.log(`📖 Marking messages as read for user ${userId} in conversation ${conversationId}`);

  const result = await apiRequest('/mark-read', {
    method: 'POST',
    body: JSON.stringify({ conversationId, userId })
  });

  return !!result?.success;
};

export const getUnreadCount = async (conversationId, userId) => {
  const messages = await getConversationMessages(conversationId);
  return messages.filter((msg) => String(msg.recipientId) === String(userId) && !msg.read).length;
};

export const getTotalUnreadCount = async (userId) => {
  if (!userId) return 0;
  const data = await apiRequest(`/unread/${encodeURIComponent(userId)}`);
  return data?.count || 0;
};

export const ensureConversationExists = async (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  const data = await apiRequest('/ensure-conversation', {
    method: 'POST',
    body: JSON.stringify({ user1Id, user1Name, user1Role, user2Id, user2Name, user2Role })
  });
  return data?.conversationId || getConversationId(user1Id, user2Id);
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
  const welcomeMessage = `Hello! I'm ${employerName}, the employer for the job "${jobTitle || 'Service'}". I'd like to discuss the next steps.`;
  return sendMessage(employerId, employerName, employerRole || 'EMPLOYER', workerId, workerName, welcomeMessage);
};

export const deleteConversation = async (conversationId) => {
  const data = await apiRequest(`/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE'
  });
  return !!data?.success;
};

export const debugChatData = async (userId) => {
  console.log('🔍 === CHAT DATA DEBUG ===');
  if (!userId) {
    console.log('Pass a userId to inspect their conversations, e.g. debugChatData("123")');
    return;
  }
  const conversations = await getUserConversations(userId);
  console.log(`👤 User ${userId}: ${conversations.length} conversations`);
  conversations.forEach((c) => {
    console.log(`  💬 ${c.otherUserName}: "${c.lastMessage}" (unread: ${c.unread})`);
  });
  console.log('🔍 === END DEBUG ===');
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