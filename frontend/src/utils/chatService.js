// src/utils/chatService.js - COMPLETE FIXED
export const getConversationId = (user1Id, user2Id) => {
  const ids = [user1Id, user2Id].sort();
  return `conv_${ids.join('_')}`;
};

export const getUserConversations = (userId) => {
  try {
    const data = localStorage.getItem('homelyserv_chat_conversations');
    const allConversations = data ? JSON.parse(data) : {};
    return allConversations[userId] || [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

export const saveUserConversations = (userId, conversations) => {
  try {
    const data = localStorage.getItem('homelyserv_chat_conversations');
    const allConversations = data ? JSON.parse(data) : {};
    allConversations[userId] = conversations;
    localStorage.setItem('homelyserv_chat_conversations', JSON.stringify(allConversations));
    return true;
  } catch (error) {
    console.error('Error saving conversations:', error);
    return false;
  }
};

export const getConversationMessages = (conversationId) => {
  try {
    const data = localStorage.getItem('homelyserv_chat_messages');
    const allMessages = data ? JSON.parse(data) : {};
    return allMessages[conversationId] || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

export const saveConversationMessages = (conversationId, messages) => {
  try {
    const data = localStorage.getItem('homelyserv_chat_messages');
    const allMessages = data ? JSON.parse(data) : {};
    allMessages[conversationId] = messages;
    localStorage.setItem('homelyserv_chat_messages', JSON.stringify(allMessages));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

export const sendMessage = (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  const conversationId = getConversationId(senderId, recipientId);
  const messages = getConversationMessages(conversationId);
  
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
  
  messages.push(newMessage);
  saveConversationMessages(conversationId, messages);
  
  // Update sender's conversation
  updateUserConversation(senderId, {
    id: conversationId,
    otherUserId: recipientId,
    otherUserName: recipientName,
    lastMessage: text,
    time: newMessage.time,
    unread: 0,
    role: senderRole === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER'
  });
  
  // Update recipient's conversation
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

export const markMessagesAsRead = (conversationId, userId) => {
  const messages = getConversationMessages(conversationId);
  const updatedMessages = messages.map(msg => {
    if (msg.recipientId === userId && !msg.read) {
      return { ...msg, read: true };
    }
    return msg;
  });
  saveConversationMessages(conversationId, updatedMessages);
  
  const data = localStorage.getItem('homelyserv_chat_conversations');
  const allConversations = data ? JSON.parse(data) : {};
  Object.keys(allConversations).forEach(key => {
    const userConvs = allConversations[key];
    const convIndex = userConvs.findIndex(c => c.id === conversationId);
    if (convIndex >= 0) {
      userConvs[convIndex].unread = 0;
    }
  });
  localStorage.setItem('homelyserv_chat_conversations', JSON.stringify(allConversations));
};

export const conversationExists = (user1Id, user2Id) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  return messages.length > 0;
};

export const getOrCreateConversation = (user1Id, user2Id) => {
  return getConversationId(user1Id, user2Id);
};

// ===== NEW: Ensure conversation is saved for both users =====
export const ensureConversationExists = (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  
  // If no messages, create a placeholder message
  if (messages.length === 0) {
    const placeholderMessage = {
      id: Date.now(),
      senderId: 'system',
      senderName: 'System',
      senderRole: 'SYSTEM',
      recipientId: user1Id,
      recipientName: user1Name,
      text: 'Start your conversation here',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      read: true
    };
    saveConversationMessages(conversationId, [placeholderMessage]);
  }
  
  // Update both users' conversations
  updateUserConversation(user1Id, {
    id: conversationId,
    otherUserId: user2Id,
    otherUserName: user2Name,
    lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: 0,
    role: user2Role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user2Name)}&background=teal&color=fff&size=100&bold=true`
  });
  
  updateUserConversation(user2Id, {
    id: conversationId,
    otherUserId: user1Id,
    otherUserName: user1Name,
    lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: 0,
    role: user1Role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user1Name)}&background=teal&color=fff&size=100&bold=true`
  });
  
  return conversationId;
};