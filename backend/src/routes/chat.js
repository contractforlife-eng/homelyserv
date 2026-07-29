// backend/src/routes/chat.js - ES Module Version
import express from 'express';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';
import { canContactWorker } from '../services/paymentAuthService.js';

const router = express.Router();

const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

const checkEmployerPayment = async (req, res, next) => {
  try {
    const employerId = req.userId;
    const employerRole = req.userRole;

    if (!employerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (employerRole !== 'EMPLOYER') {
      return next();
    }

    let recipientId = req.body?.recipientId || req.query?.recipientId;

    if (!recipientId && req.body) {
      if (String(req.body.user1Id) === String(employerId)) {
        recipientId = req.body.user2Id;
      } else if (String(req.body.user2Id) === String(employerId)) {
        recipientId = req.body.user1Id;
      }
    }

    if (!recipientId) {
      return res.status(400).json({ error: 'Missing recipient' });
    }

    const canContact = await canContactWorker(employerId, recipientId);
    if (!canContact) {
      return res.status(403).json({ error: 'Payment required to contact this worker.' });
    }

    next();
  } catch (error) {
    console.error('Payment check error:', error);
    return res.status(500).json({ error: 'Failed to verify payment status' });
  }
};

function resolveRecipientRole(senderRole) {
  if (senderRole === 'ADMIN') return 'USER';
  if (senderRole === 'EMPLOYER') return 'WORKER';
  if (senderRole === 'WORKER') return 'EMPLOYER';
  return 'USER';
}

function buildAvatarUrl(name, role) {
  const bg = role === 'EMPLOYER' ? 'teal' : role === 'WORKER' ? 'red' : role === 'ADMIN' ? 'yellow' : 'gray';
  const color = role === 'ADMIN' ? '000' : 'fff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&size=100&bold=true`;
}

function formatMessage(msg) {
  return {
    id: msg._id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    recipientId: msg.recipientId,
    recipientName: msg.recipientName,
    text: msg.text,
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: msg.createdAt,
    read: msg.read,
    delivered: msg.delivered
  };
}

const requireConversationParticipant = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(req.userId);

    const parts = conversationId.replace('conv_', '').split('_');
    if (parts.length !== 2 || (parts[0] !== userId && parts[1] !== userId)) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }

    next();
  } catch (error) {
    console.error('Conversation auth error:', error);
    return res.status(500).json({ error: 'Failed to verify conversation access' });
  }
};

router.post('/send', authenticate, checkEmployerPayment, async (req, res) => {
  try {
    const { senderName, senderRole, recipientId, recipientName, text } = req.body;
    const senderId = req.userId;

    console.log('📨 [Backend] POST /api/chat/send');
    console.log('  senderId:', senderId);
    console.log('  senderRole:', senderRole);
    console.log('  recipientId:', recipientId);
    console.log('  recipientName:', recipientName);
    console.log('  text:', text);

    if (!senderId || !recipientId || !text || !text.trim()) {
      console.log('❌ [Backend] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversationId = getConversationId(senderId, recipientId);
    console.log('  conversationId:', conversationId);

    const recipientRole = resolveRecipientRole(senderRole);

    const message = await Message.create({
      conversationId,
      senderId: String(senderId),
      senderName,
      senderRole,
      recipientId: String(recipientId),
      recipientName,
      recipientRole,
      text: text.trim(),
      read: false,
      delivered: true
    });

    console.log('✅ [Backend] Message created in MongoDB:', message._id);
    console.log('  conversationId:', message.conversationId);
    console.log('  senderId:', message.senderId);
    console.log('  recipientId:', message.recipientId);

    const formatted = formatMessage(message);
    console.log('📤 [Backend] Returning formatted message:', formatted);

    return res.status(201).json(formatted);
  } catch (error) {
    console.error('❌ [Backend] Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages/:conversationId', authenticate, requireConversationParticipant, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(req.userId);
    
    console.log('📨 [Backend] GET /api/chat/messages/:conversationId');
    console.log('  conversationId:', conversationId);
    console.log('  userId:', userId);

    const messages = await Message.find({ 
      conversationId: conversationId 
    }).sort({ createdAt: 1 });

    console.log('📋 [Backend] Found', messages.length, 'messages for conversation:', conversationId);
    for (const msg of messages) {
      console.log('  -', msg._id, 'sender:', msg.senderId, 'recipient:', msg.recipientId, 'text:', msg.text.substring(0, 50));
    }

    const formatted = messages.map(formatMessage);
    console.log('📤 [Backend] Returning', formatted.length, 'formatted messages');
    
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/conversations/:userId', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    }).sort({ createdAt: 1 });

    const groups = new Map();
    for (const msg of messages) {
      if (!groups.has(msg.conversationId)) groups.set(msg.conversationId, []);
      groups.get(msg.conversationId).push(msg);
    }

    const conversations = [];
    for (const [conversationId, msgs] of groups) {
      const last = msgs[msgs.length - 1];
      const isSender = String(last.senderId) === userId;

      const otherUser = isSender
        ? { id: last.recipientId, name: last.recipientName, role: last.recipientRole || 'USER' }
        : { id: last.senderId, name: last.senderName, role: last.senderRole };

      const unread = msgs.filter(m => String(m.recipientId) === userId && !m.read).length;

      conversations.push({
        id: conversationId,
        otherUserId: String(otherUser.id),
        otherUserName: otherUser.name,
        lastMessage: last.text,
        lastMessageTime: last.createdAt,
        time: new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread,
        role: otherUser.role,
        avatar: buildAvatarUrl(otherUser.name, otherUser.role),
        updatedAt: last.createdAt
      });
    }

    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = String(req.userId);

    if (!conversationId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await Message.updateMany(
      {
        conversationId,
        recipientId: userId,
        read: false
      },
      { read: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

router.get('/unread/:userId', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);

    if (userId !== String(req.params.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const count = await Message.countDocuments({
      recipientId: userId,
      read: false
    });
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.post('/ensure-conversation', authenticate, checkEmployerPayment, async (req, res) => {
  try {
    const { 
      user1Id, 
      user1Name, 
      user1Role,
      user2Id, 
      user2Name,
      user2Role
    } = req.body;

    const authenticatedId = String(req.userId);

    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (authenticatedId !== String(user1Id) && authenticatedId !== String(user2Id)) {
      return res.status(403).json({ error: 'Not authorized to create this conversation' });
    }

    const conversationId = getConversationId(user1Id, user2Id);
    const existing = await Message.findOne({ conversationId });

    if (!existing) {
      await Message.create({
        conversationId,
        senderId: String(user1Id),
        senderName: user1Name || 'User',
        senderRole: user1Role || 'USER',
        recipientId: String(user2Id),
        recipientName: user2Name || 'User',
        recipientRole: user2Role || 'USER',
        text: 'Start your conversation here',
        read: true,
        delivered: true
      });
    }

    return res.json({ conversationId });
  } catch (error) {
    console.error('Error ensuring conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.delete('/conversations/:conversationId', authenticate, requireConversationParticipant, async (req, res) => {
  try {
    await Message.deleteMany({ 
      conversationId: req.params.conversationId 
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
