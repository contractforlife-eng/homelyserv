// src/utils/chatService.js
/**
 * Chat Service - Handles all chat operations with shared storage
 * All messages are stored under conversation IDs that both parties can access
 */

// Get or create a conversation between two users
export const getConversation = (user1Id, user2Id) => {
  // Create a unique conversation ID (sort IDs to ensure consistency)
  const ids = [user1Id, user2Id].sort();
  const conversationId = `conv_${ids.join('_')}`;
  return conversationId;
};

// Get all conversations for a user
export const getUserConversations = (userId) => {
  try {
    const allConversations = JSON.parse(localStorage.getItem('homelyserv_chat_conversations') || '{}');
    return allConversations[userId] || [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

// Get messages for a specific conversation
export const getConversationMessages = (conversationId) => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
    return allMessages[conversationId] || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

// Save messages for a conversation
export const saveConversationMessages = (conversationId, messages) => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
    allMessages[conversationId] = messages;
    localStorage.setItem('homelyserv_chat_messages', JSON.stringify(allMessages));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

// Save user conversations
export const saveUserConversations = (userId, conversations) => {
  try {
    const allConversations = JSON.parse(localStorage.getItem('homelyserv_chat_conversations') || '{}');
    allConversations[userId] = conversations;
    localStorage.setItem('homelyserv_chat_conversations', JSON.stringify(allConversations));
    return true;
  } catch (error) {
    console.error('Error saving conversations:', error);
    return false;
  }
};

// Send a message - FIXED to ensure both users see it
export const sendMessage = (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  // Get or create conversation ID
  const conversationId = getConversation(senderId, recipientId);
  
  // Get existing messages
  const messages = getConversationMessages(conversationId);
  
  // Create new message
  const newMessage = {
    id: Date.now(),
    senderId: senderId,
    senderName: senderName,
    senderRole: senderRole,
    recipientId: recipientId,
    recipientName: recipientName,
    text: text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    read: false
  };
  
  // Add to messages
  messages.push(newMessage);
  saveConversationMessages(conversationId, messages);
  
  // Update conversations for BOTH users
  // For the sender
  updateUserConversation(senderId, {
    id: conversationId,
    otherUserId: recipientId,
    otherUserName: recipientName,
    lastMessage: text,
    time: newMessage.time,
    unread: 0,
    role: senderRole === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER'
  });
  
  // For the recipient - IMPORTANT: This ensures the worker sees the message
  updateUserConversation(recipientId, {
    id: conversationId,
    otherUserId: senderId,
    otherUserName: senderName,
    lastMessage: text,
    time: newMessage.time,
    unread: 1,
    role: senderRole
  });
  
  return newMessage;
};

// Update a user's conversation list
const updateUserConversation = (userId, conversationData) => {
  const conversations = getUserConversations(userId);
  const existingIndex = conversations.findIndex(c => c.id === conversationData.id);
  
  if (existingIndex >= 0) {
    conversations[existingIndex] = { ...conversations[existingIndex], ...conversationData };
  } else {
    conversations.unshift(conversationData);
  }
  
  saveUserConversations(userId, conversations);
};

// Mark messages as read
export const markMessagesAsRead = (conversationId, userId) => {
  const messages = getConversationMessages(conversationId);
  const updatedMessages = messages.map(msg => {
    if (msg.recipientId === userId && !msg.read) {
      return { ...msg, read: true };
    }
    return msg;
  });
  saveConversationMessages(conversationId, updatedMessages);
  
  // Update unread count in conversation
  const allConversations = JSON.parse(localStorage.getItem('homelyserv_chat_conversations') || '{}');
  Object.keys(allConversations).forEach(key => {
    const userConvs = allConversations[key];
    const convIndex = userConvs.findIndex(c => c.id === conversationId);
    if (convIndex >= 0) {
      userConvs[convIndex].unread = 0;
    }
  });
  localStorage.setItem('homelyserv_chat_conversations', JSON.stringify(allConversations));
};

// Check if a conversation exists between two users
export const conversationExists = (user1Id, user2Id) => {
  const conversationId = getConversation(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  return messages.length > 0;
};

// Get conversation ID between two users (creates if doesn't exist)
export const getOrCreateConversation = (user1Id, user2Id) => {
  return getConversation(user1Id, user2Id);
};