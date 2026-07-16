// src/utils/chatService.js - EMPLOYER gray, WORKER red theme
// Get a unique conversation ID
export const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

// Get all conversations for a user
export const getUserConversations = (userId) => {
  try {
    const key = `homelyserv_chat_conversations_${String(userId)}`;
    const data = localStorage.getItem(key);
    if (data) {
      const conversations = JSON.parse(data);
      console.log(`📋 [${userId}] Loaded ${conversations.length} conversations`);
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
    console.log(`💾 [${userId}] Saved ${conversations.length} conversations`);
    return true;
  } catch (error) {
    console.error('Error saving conversations:', error);
    return false;
  }
};

// Get messages for a conversation
export const getConversationMessages = (conversationId) => {
  try {
    const key = `homelyserv_chat_messages_${conversationId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const messages = JSON.parse(data);
      console.log(`📨 [${conversationId}] Loaded ${messages.length} messages`);
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
    console.log(`💾 [${conversationId}] Saved ${messages.length} messages`);
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

// Get avatar background color based on role
const getAvatarBg = (role) => {
  if (role === 'EMPLOYER') return 'gray';
  if (role === 'WORKER') return 'red';
  return 'gray';
};

// Get avatar text color based on role
const getAvatarColor = (role) => {
  if (role === 'EMPLOYER') return 'fff';
  if (role === 'WORKER') return 'fff';
  return 'fff';
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
    id: Date.now(),
    senderId: String(senderId),
    senderName: senderName,
    senderRole: senderRole,
    recipientId: String(recipientId),
    recipientName: recipientName,
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
    read: false
  };
  
  // Add message to conversation
  messages.push(newMessage);
  saveConversationMessages(conversationId, messages);
  
  // Determine recipient role (opposite of sender)
  const recipientRole = senderRole === 'EMPLOYER' ? 'WORKER' : 'EMPLOYER';
  
  // Update sender's conversation
  const senderConversations = getUserConversations(senderId);
  const senderIndex = senderConversations.findIndex(c => c.id === conversationId);
  
  const senderConv = {
    id: conversationId,
    otherUserId: String(recipientId),
    otherUserName: recipientName,
    lastMessage: text.trim(),
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
  console.log(`📊 Sender (${senderId}) has ${senderConversations.length} conversations`);
  console.log(`📊 Recipient (${recipientId}) has ${recipientConversations.length} conversations`);
  
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
    console.log(`📖 Reset unread count for conversation ${conversationId}`);
  }
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

// Get a conversation by ID
export const getConversation = (conversationId) => {
  // Find conversation in any user's list
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith('homelyserv_chat_conversations_')) {
      const conversations = JSON.parse(localStorage.getItem(key) || '[]');
      const found = conversations.find(c => c.id === conversationId);
      if (found) return found;
    }
  }
  return null;
};

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
        console.log(`  ${idx+1}. ${msg.senderName} (${msg.senderRole}) -> ${msg.recipientName} (${msg.recipientRole || 'unknown'}): "${msg.text}" (${msg.read ? 'read' : 'unread'})`);
      });
    } catch (e) {
      console.log(`❌ Error parsing ${key}`);
    }
  });
  
  console.log('🔍 === END DEBUG ===');
};

// Ensure conversation exists for both users
export const ensureConversationExists = (user1Id, user1Name, user1Role, user2Id, user2Name, user2Role) => {
  const conversationId = getConversationId(user1Id, user2Id);
  const messages = getConversationMessages(conversationId);
  
  // If no messages, create a placeholder
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
  
  // Update user1's conversations
  const user1Convs = getUserConversations(user1Id);
  const user1Index = user1Convs.findIndex(c => c.id === conversationId);
  if (user1Index === -1) {
    user1Convs.unshift({
      id: conversationId,
      otherUserId: String(user2Id),
      otherUserName: user2Name,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Start your conversation here',
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      role: user1Role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user1Name)}&background=${getAvatarBg(user1Role)}&color=${getAvatarColor(user1Role)}&size=100&bold=true`
    });
    saveUserConversations(user2Id, user2Convs);
  }
  
  return conversationId;
};

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