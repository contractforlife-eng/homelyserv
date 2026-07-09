// src/utils/chatService.js
export const getConversation = (user1Id, user2Id) => {
  const ids = [user1Id, user2Id].sort();
  return `conv_${ids.join('_')}`;
};

export const getUserConversations = (userId) => {
  try {
    const allConversations = JSON.parse(localStorage.getItem('homelyserv_chat_conversations') || '{}');
    return allConversations[userId] || [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

export const getConversationMessages = (conversationId) => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
    return allMessages[conversationId] || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

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

export const sendMessage = (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  const conversationId = getConversation(senderId, recipientId);
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

export const conversationExists = (user1Id, user2Id) => {
  const conversationId = getConversation(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  return messages.length > 0;
};

export const getOrCreateConversation = (user1Id, user2Id) => {
  return getConversation(user1Id, user2Id);
};