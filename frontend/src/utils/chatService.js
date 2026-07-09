// src/utils/chatService.js
// Chat Service - Complete rewrite for reliability

// Get or create a conversation ID between two users
export const getConversationId = (user1Id, user2Id) => {
  const ids = [user1Id, user2Id].sort();
  return `conv_${ids.join('_')}`;
};

// Get all conversations for a user
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

// Save conversations for a user
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

// Get messages for a conversation
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

// Save messages for a conversation
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

// Send a message - ensures both users see it
export const sendMessage = (senderId, senderName, senderRole, recipientId, recipientName, text) => {
  console.log('📤 Sending message:', { senderId, senderName, senderRole, recipientId, recipientName, text });
  
  // Get conversation ID
  const conversationId = getConversationId(senderId, recipientId);
  console.log('📨 Conversation ID:', conversationId);
  
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
  
  // Save message
  messages.push(newMessage);
  saveConversationMessages(conversationId, messages);
  console.log('📨 Message saved:', newMessage);
  
  // Update sender's conversation
  updateUserConversation(senderId, {
    id: conversationId,
    otherUserId: recipientId,
    otherUserName: recipientName,
    lastMessage: text,
    time: newMessage.time,
    unread: 0,
    role: senderRole === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientName)}&background=${senderRole === 'EMPLOYER' ? 'teal' : 'red'}&color=fff&size=100&bold=true`
  });
  
  // Update recipient's conversation - CRITICAL
  updateUserConversation(recipientId, {
    id: conversationId,
    otherUserId: senderId,
    otherUserName: senderName,
    lastMessage: text,
    time: newMessage.time,
    unread: 1,
    role: senderRole,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=${senderRole === 'EMPLOYER' ? 'teal' : 'red'}&color=fff&size=100&bold=true`
  });
  
  console.log('✅ Message sent and both users updated');
  return newMessage;
};

// Update a user's conversation list
const updateUserConversation = (userId, conversationData) => {
  console.log('📨 Updating conversation for user:', userId);
  const conversations = getUserConversations(userId);
  const existingIndex = conversations.findIndex(c => c.id === conversationData.id);
  
  if (existingIndex >= 0) {
    // Update existing conversation
    conversations[existingIndex] = { ...conversations[existingIndex], ...conversationData };
    console.log('📨 Updated existing conversation');
  } else {
    // Add new conversation at the top
    conversations.unshift(conversationData);
    console.log('📨 Added new conversation');
  }
  
  saveUserConversations(userId, conversations);
  console.log('📨 Updated conversations for user:', conversations);
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
  
  // Update unread count in all user's conversations
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

// Create a test conversation for debugging
export const createTestConversation = (userId, otherUserId, otherUserName) => {
  const conversationId = getConversationId(userId, otherUserId);
  const existingMessages = getConversationMessages(conversationId);
  
  if (existingMessages.length === 0) {
    const testMessage = {
      id: Date.now(),
      senderId: otherUserId,
      senderName: otherUserName,
      senderRole: 'EMPLOYER',
      recipientId: userId,
      recipientName: 'Worker',
      text: 'Hello! I am interested in your profile.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    saveConversationMessages(conversationId, [testMessage]);
    
    updateUserConversation(userId, {
      id: conversationId,
      otherUserId: otherUserId,
      otherUserName: otherUserName,
      lastMessage: testMessage.text,
      time: testMessage.time,
      unread: 1,
      role: 'EMPLOYER',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=teal&color=fff&size=100&bold=true`
    });
    
    console.log('📨 Created test conversation for user:', userId);
    return true;
  }
  return false;
};