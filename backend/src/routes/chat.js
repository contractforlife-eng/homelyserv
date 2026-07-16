// backend/src/routes/chat.js - ES Module Version
import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Same deterministic-ID scheme
const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
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

// ============================================================
// POST /api/chat/send
// ============================================================
router.post('/send', async (req, res) => {
  try {
    const { senderId, senderName, senderRole, recipientId, recipientName, text } = req.body;

    if (!senderId || !recipientId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversationId = getConversationId(senderId, recipientId);
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

    return res.status(201).json(formatMessage(message));
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================================
// GET /api/chat/messages/:conversationId
// ============================================================
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.conversationId 
    }).sort({ createdAt: 1 });

    return res.json(messages.map(formatMessage));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============================================================
// GET /api/chat/conversations/:userId
// ============================================================
router.get('/conversations/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId);

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Group messages by conversation
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

// ============================================================
// POST /api/chat/mark-read
// ============================================================
router.post('/mark-read', async (req, res) => {
  try {
    const { conversationId, userId } = req.body;
    if (!conversationId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await Message.updateMany(
      {
        conversationId,
        recipientId: String(userId),
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

// ============================================================
// GET /api/chat/unread/:userId
// ============================================================
router.get('/unread/:userId', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipientId: String(req.params.userId),
      read: false
    });
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================================
// POST /api/chat/ensure-conversation
// ============================================================
router.post('/ensure-conversation', async (req, res) => {
  try {
    const { user1Id, user1Name, user2Id, user2Name } = req.body;
    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversationId = getConversationId(user1Id, user2Id);
    const existing = await Message.findOne({ conversationId });

    if (!existing) {
      await Message.create({
        conversationId,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'SYSTEM',
        recipientId: String(user1Id),
        recipientName: user1Name || 'User',
        recipientRole: 'USER',
        text: 'Start your conversation here',
        read: true
      });
    }

    return res.json({ conversationId });
  } catch (error) {
    console.error('Error ensuring conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ============================================================
// DELETE /api/chat/conversations/:conversationId
// ============================================================
router.delete('/conversations/:conversationId', async (req, res) => {
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