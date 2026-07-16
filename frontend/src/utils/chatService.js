// src/utils/chatService.js - Complete Chat Service
// Get a unique conversation ID
export const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

// ============================================================
// CONVERSATION MANAGEMENT
// ============================================================

// Get all conversations for a user
export const getUserConversations = (userId) => {
  try {
    const key = `homelyserv_chat_conversations_${String(userId)}`;
    const data = localStorage.getItem(key);
    if (data) {
      const conversations = JSON.parse(data);
      return conversations;
    }
    return [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

// Save conversations for a user
export const saveUserConversations = (userId, conversations) => {
  try {
    const key = `homelyserv_chat_conversations_${String(userId)}`;
    localStorage.setItem(key, JSON.stringify(conversations));
    return true;
  } catch (error) {
    console.error('Error saving conversations:', error);
    return false;
  }
};

// Get all conversations (for admin)
export const getAllConversations = () => {
  try {
    const allConversations = [];
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('homelyserv_chat_conversations_')) {
        const conversations = JSON.parse(localStorage.getItem(key) || '[]');
        allConversations.push(...conversations);
      }
    }
    return allConversations;
  } catch (error) {
    console.error('Error getting all conversations:', error);
    return [];
  }
};

// Get conversations for a specific user with proper structure
export const getConversations = (userId) => {
  return getUserConversations(userId);
};

// Get a single conversation by ID
export const getConversation = (conversationId) => {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('homelyserv_chat_conversations_')) {
        const conversations = JSON.parse(localStorage.getItem(key) || '[]');
        const found = conversations.find(c => c.id === conversationId);
        if (found) return found;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
};

// ============================================================
// MESSAGE MANAGEMENT
// ============================================================

// Get messages for a conversation
export const getConversationMessages = (conversationId) => {
  try {
    const key = `homelyserv_chat_messages_${conversationId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const messages = JSON.parse(data);
      return messages;
    }
    return [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

// Save messages for a conversation
export const saveConversationMessages = (conversationId, messages) => {
  try {
    const key = `homelyserv_chat_messages_${conversationId}`;
    localStorage.setItem(key, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

// Get messages for a conversation (alias)
export const getMessages = (conversationId) => {
  return getConversationMessages(conversationId);
};

// Send a message - CREATES CONVERSATIONS FOR BOTH PARTIES
export const sendMessage = (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  console.log('📤 Sending message:', { senderId, senderName, senderRole, recipientId, recipientName, text });
  
  if (!senderId || !recipientId || !text.trim()) {
    console.log('❌ Missing required fields');
    return null;
  }

  const conversationId = getConversationId(senderId, recipientId);
  console.log('📨 Conversation ID:', conversationId);
  
  // Get existing messages
  const messages = getConversationMessages(conversationId);
  
  // Create new message
  const newMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    conversationId: conversationId,
    senderId: String(senderId),
    senderName: senderName,
    senderRole: senderRole,
    recipientId: String(recipientId),
    recipientName: recipientName,
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    read: false,
    delivered: true
  };
  
  // Add message to conversation
  messages.push(newMessage);
  saveConversationMessages(conversationId, messages);
  
  // Determine recipient role (opposite of sender)
  const recipientRole = senderRole === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER';
  
  // Get avatar background based on role
  const getAvatarBg = (role) => {
    if (role === 'EMPLOYER') return 'gray';
    if (role === 'WORKER') return 'red';
    return 'gray';
  };
  
  const getAvatarColor = (role) => {
    if (role === 'EMPLOYER') return 'fff';
    if (role === 'WORKER') return 'fff';
    return 'fff';
  };
  
  // Update sender's conversation
  const senderConversations = getUserConversations(senderId);
  const senderIndex = senderConversations.findIndex(c => c.id === conversationId);
  
  const senderConv = {
    id: conversationId,
    otherUserId: String(recipientId),
    otherUserName: recipientName,
    lastMessage: text.trim(),
    lastMessageTime: newMessage.timestamp,
    time: newMessage.time,
    unread: 0,
    role: recipientRole,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientName)}&background=${getAvatarBg(recipientRole)}&color=${getAvatarColor(recipientRole)}&size=100&bold=true`
  };
  
  if (senderIndex >= 0) {
    senderConversations[senderIndex] = { ...senderConversations[senderIndex], ...senderConv };
  } else {
    senderConversations.unshift(senderConv);
  }
  saveUserConversations(senderId, senderConversations);
  
  // Update recipient's conversation (with unread count)
  const recipientConversations = getUserConversations(recipientId);
  const recipientIndex = recipientConversations.findIndex(c => c.id === conversationId);
  
  const recipientConv = {
    id: conversationId,
    otherUserId: String(senderId),
    otherUserName: senderName,
    lastMessage: text.trim(),
    lastMessageTime: newMessage.timestamp,
    time: newMessage.time,
    unread: (recipientIndex >= 0 ? (recipientConversations[recipientIndex].unread || 0) : 0) + 1,
    role: senderRole,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=${getAvatarBg(senderRole)}&color=${getAvatarColor(senderRole)}&size=100&bold=true`
  };
  
  if (recipientIndex >= 0) {
    recipientConversations[recipientIndex] = { ...recipientConversations[recipientIndex], ...recipientConv };
  } else {
    recipientConversations.unshift(recipientConv);
  }
  saveUserConversations(recipientId, recipientConversations);
  
  console.log('✅ Message sent successfully - both parties updated');
  
  return newMessage;
};

// Mark messages as read
export const markMessagesAsRead = (conversationId, userId) => {
  if (!conversationId || !userId) return;
  
  console.log(`📖 Marking messages as read for user ${userId} in conversation ${conversationId}`);
  
  const messages = getConversationMessages(conversationId);
  let updated = false;
  
  const updatedMessages = messages.map(msg => {
    if (String(msg.recipientId) === String(userId) && !msg.read) {
      updated = true;
      return { ...msg, read: true };
    }
    return msg;
  });
  
  if (updated) {
    saveConversationMessages(conversationId, updatedMessages);
  }
  
  // Reset unread count for this user
  const conversations = getUserConversations(userId);
  const convIndex = conversations.findIndex(c => c.id === conversationId);
  if (convIndex !== -1 && conversations[convIndex].unread > 0) {
    conversations[convIndex].unread = 0;
    saveUserConversations(userId, conversations);
  }
};

// Get unread count for a conversation
export const getUnreadCount = (conversationId, userId) => {
  try {
    const messages = getConversationMessages(conversationId);
    return messages.filter(msg => 
      String(msg.recipientId) === String(userId) && !msg.read
    ).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Get total unread count for a user
export const getTotalUnreadCount = (userId) => {
  try {
    const conversations = getUserConversations(userId);
    let total = 0;
    conversations.forEach(conv => {
      total += conv.unread || 0;
    });
    return total;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

// ============================================================
// CONVERSATION CREATION
// ============================================================

// Ensure conversation exists for both users
export const ensureConversationExists = (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  
  // If no messages, create a placeholder
  if (messages.length === 0) {
    const placeholderMessage = {
      id: 'sys_' + Date.now(),
      conversationId: conversationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'SYSTEM',
      recipientId: user1Id,
      recipientName: user1Name,
      text: 'Start your conversation here',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      read: true,
      delivered: true
    };
    saveConversationMessages(conversationId, [placeholderMessage]);
  }
  
  // Get avatar background based on role
  const getAvatarBg = (role) => {
    if (role === 'EMPLOYER') return 'gray';
    if (role === 'WORKER') return 'red';
    return 'gray';
  };
  
  const getAvatarColor = (role) => {
    if (role === 'EMPLOYER') return 'fff';
    if (role === 'WORKER') return 'fff';
    return 'fff';
  };
  
  // Update user1's conversations
  const user1Convs = getUserConversations(user1Id);
  const user1Index = user1Convs.findIndex(c => c.id === conversationId);
  if (user1Index === -1) {
    user1Convs.unshift({
      id: conversationId,
      otherUserId: String(user2Id),
      otherUserName: user2Name,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
      lastMessageTime: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      role: user2Role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user2Name)}&background=${getAvatarBg(user2Role)}&color=${getAvatarColor(user2Role)}&size=100&bold=true`
    });
    saveUserConversations(user1Id, user1Convs);
  }
  
  // Update user2's conversations
  const user2Convs = getUserConversations(user2Id);
  const user2Index = user2Convs.findIndex(c => c.id === conversationId);
  if (user2Index === -1) {
    user2Convs.unshift({
      id: conversationId,
      otherUserId: String(user1Id),
      otherUserName: user1Name,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
      lastMessageTime: messages.length > 0 ? messages[messages.length - 1].timestamp : new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      role: user1Role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user1Name)}&background=${getAvatarBg(user1Role)}&color=${getAvatarColor(user1Role)}&size=100&bold=true`
    });
    saveUserConversations(user2Id, user2Convs);
  }
  
  return conversationId;
};

// Create a conversation (alias for ensureConversationExists)
export const createConversation = (
  userId1, userName1, userRole1,
  userId2, userName2, userRole2
) => {
  return ensureConversationExists(
    userId1, userName1, userRole1,
    userId2, userName2, userRole2
  );
};

// Check if a conversation exists
export const conversationExists = (user1Id, user2Id) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  return messages.length > 0;
};

// Get or create a conversation
export const getOrCreateConversation = (user1Id, user2Id) => {
  return getConversationId(user1Id, user2Id);
};

// ============================================================
// SEND WELCOME MESSAGE
// ============================================================

// Send a welcome message from employer to worker
export const sendWelcomeMessage = (employerId, employerName, employerRole, workerId, workerName, workerRole, jobTitle) => {
  const welcomeMessage = `Hello! I'm ${employerName}, the employer for the job "${jobTitle || 'Service'}". I'd like to discuss the next steps.`;
  
  return sendMessage(
    employerId,
    employerName,
    employerRole || 'EMPLOYER',
    workerId,
    workerName,
    welcomeMessage
  );
};

// ============================================================
// CONVERSATION DELETION
// ============================================================

// Delete a conversation
export const deleteConversation = (conversationId) => {
  try {
    // Find and delete from all users' conversations
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('homelyserv_chat_conversations_')) {
        const conversations = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = conversations.filter(c => c.id !== conversationId);
        if (filtered.length !== conversations.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
    
    // Delete messages
    const messageKey = `homelyserv_chat_messages_${conversationId}`;
    localStorage.removeItem(messageKey);
    
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// ============================================================
// DEBUG FUNCTIONS
// ============================================================

// Debug function to see all chat data
export const debugChatData = () => {
  console.log('🔍 === CHAT DATA DEBUG ===');
  
  // Find all conversation keys
  const convKeys = Object.keys(localStorage).filter(key => key.startsWith('homelyserv_chat_conversations_'));
  console.log('📋 Conversation keys found:', convKeys);
  
  convKeys.forEach(key => {
    const userId = key.replace('homelyserv_chat_conversations_', '');
    const data = localStorage.getItem(key);
    try {
      const conversations = JSON.parse(data);
      console.log(`👤 User ${userId}: ${conversations.length} conversations`);
      conversations.forEach(c => {
        console.log(`  💬 ${c.otherUserName}: "${c.lastMessage}" (unread: ${c.unread})`);
      });
    } catch (e) {
      console.log(`❌ Error parsing ${key}`);
    }
  });
  
  // Find all message keys
  const msgKeys = Object.keys(localStorage).filter(key => key.startsWith('homelyserv_chat_messages_'));
  console.log('📨 Message keys found:', msgKeys);
  
  msgKeys.forEach(key => {
    const convId = key.replace('homelyserv_chat_messages_', '');
    const data = localStorage.getItem(key);
    try {
      const messages = JSON.parse(data);
      console.log(`💬 Conversation ${convId}: ${messages.length} messages`);
      messages.forEach((msg, idx) => {
        console.log(`  ${idx+1}. ${msg.senderName} (${msg.senderRole}) -> ${msg.recipientName}: "${msg.text}" (${msg.read ? 'read' : 'unread'})`);
      });
    } catch (e) {
      console.log(`❌ Error parsing ${key}`);
    }
  });
  
  console.log('🔍 === END DEBUG ===');
};

// ============================================================
// EXPORT DEFAULTS
// ============================================================

export default {
  getConversationId,
  getUserConversations,
  saveUserConversations,
  getAllConversations,
  getConversations,
  getConversation,
  getConversationMessages,
  saveConversationMessages,
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
  debugChatData
};