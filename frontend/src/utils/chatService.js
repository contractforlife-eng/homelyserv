// src/utils/chatService.js - BACKEND-CONNECTED VERSION (Express + MongoDB)
//
// This replaces the old localStorage-only version. Every function here now
// talks to your Express API (see backend/routes/chatRoutes.js), so messages
// are shared across devices/browsers instead of being trapped in one
// browser's local storage.
//
// All functions that touch the network are now ASYNC and return Promises.
// Every call site must use `await` (the three Messages pages have already
// been updated for this).

// Adjust this if your API isn't served from the same origin as the frontend,
// e.g. 'https://api.yourapp.com/api/chat'
const API_BASE = '/api/chat';

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

// Deterministic conversation id for two users. Pure/local — no network call.
// Kept for anything in the app that wants to build/compare a conversation id
// without a round trip (the server computes its own copy independently).
export const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

// ============================================================
// CONVERSATION MANAGEMENT
// ============================================================

// Get all conversations for a user
export const getUserConversations = async (userId) => {
  if (!userId) return [];
  const data = await apiRequest(`/conversations/${encodeURIComponent(userId)}`);
  return Array.isArray(data) ? data : [];
};

// Get conversations for a specific user (alias)
export const getConversations = (userId) => getUserConversations(userId);

// ============================================================
// MESSAGE MANAGEMENT
// ============================================================

// Get messages for a conversation
export const getConversationMessages = async (conversationId) => {
  if (!conversationId) return [];
  const data = await apiRequest(`/messages/${encodeURIComponent(conversationId)}`);
  return Array.isArray(data) ? data : [];
};

// Get messages for a conversation (alias)
export const getMessages = (conversationId) => getConversationMessages(conversationId);

// ============================================================
// SEND MESSAGE
// ============================================================
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

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
  if (!conversationId || !userId) return false;

  console.log(`📖 Marking messages as read for user ${userId} in conversation ${conversationId}`);

  const result = await apiRequest('/mark-read', {
    method: 'POST',
    body: JSON.stringify({ conversationId, userId })
  });

  return !!result?.success;
};

// Get unread count for a single conversation (derived from the message list)
export const getUnreadCount = async (conversationId, userId) => {
  const messages = await getConversationMessages(conversationId);
  return messages.filter((msg) => String(msg.recipientId) === String(userId) && !msg.read).length;
};

// Get total unread count for a user across all conversations
export const getTotalUnreadCount = async (userId) => {
  if (!userId) return 0;
  const data = await apiRequest(`/unread/${encodeURIComponent(userId)}`);
  return data?.count || 0;
};

// ============================================================
// CONVERSATION CREATION
// ============================================================

// Ensure conversation exists for both users (creates a placeholder message
// server-side so the conversation shows up before either side has typed
// anything, e.g. right after a job offer/application).
export const ensureConversationExists = async (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  const data = await apiRequest('/ensure-conversation', {
    method: 'POST',
    body: JSON.stringify({ user1Id, user1Name, user1Role, user2Id, user2Name, user2Role })
  });
  return data?.conversationId || getConversationId(user1Id, user2Id);
};

// Create a conversation (alias)
export const createConversation = (userId1, userName1, userRole1, userId2, userName2, userRole2) =>
  ensureConversationExists(userId1, userName1, userRole1, userId2, userName2, userRole2);

// Check if a conversation exists
export const conversationExists = async (user1Id, user2Id) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = await getConversationMessages(conversationId);
  return messages.length > 0;
};

// Get or create a conversation id (id only — doesn't hit the network)
export const getOrCreateConversation = (user1Id, user2Id) => getConversationId(user1Id, user2Id);

// ============================================================
// SEND WELCOME MESSAGE
// ============================================================

// Send a welcome message from employer to worker
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

// ============================================================
// CONVERSATION DELETION
// ============================================================

export const deleteConversation = async (conversationId) => {
  const data = await apiRequest(`/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE'
  });
  return !!data?.success;
};

// ============================================================
// DEBUG
// ============================================================

// Debug helper — pass the current user's id to inspect their conversations.
// (There's no more single "look at everything" view client-side, since the
// data no longer lives in this browser's localStorage — see getAllConversations.)
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

// Listing every conversation across every user is an admin/moderation
// feature, not something the browser can safely aggregate from local data
// anymore. If you need this for the admin dashboard, add an authenticated
// admin-only endpoint (e.g. GET /api/chat/admin/conversations) and call it
// here instead.
export const getAllConversations = () => {
  console.warn(
    'getAllConversations is no longer available client-side. Add an authenticated admin endpoint if you need a global conversation list.'
  );
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
