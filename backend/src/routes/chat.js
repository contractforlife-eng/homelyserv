// backend/src/routes/chat.js - ES Module Version
import express from 'express';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';
import { canContactWorker } from '../services/paymentAuthService.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

const checkEmployerPayment = async (req, res, next) => {
  try {
    const employerId = req.userId;
    const employerRole = req.userRole;

    console.log('[DEBUG checkEmployerPayment] req.userId:', req.userId);
    console.log('[DEBUG checkEmployerPayment] req.userRole:', req.userRole);

    if (!employerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Skip payment check for ADMIN, WORKER, and SUPPORT roles
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

    console.log('[DEBUG checkEmployerPayment] recipientId:', recipientId);
    console.log('[DEBUG checkEmployerPayment] employerId:', employerId);

    // Convert User._id to WorkerProfile._id for payment check
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: String(recipientId) }
    });

    const workerProfileId = workerProfile?.id || recipientId;

    console.log('[DEBUG checkEmployerPayment] workerProfile:', workerProfile);
    console.log('[DEBUG checkEmployerPayment] workerProfile.id:', workerProfile?.id);
    console.log('[DEBUG checkEmployerPayment] workerProfile.userId:', workerProfile?.userId);
    console.log('[DEBUG checkEmployerPayment] workerProfileId:', workerProfileId);

    const canContact = await canContactWorker(employerId, workerProfileId);

    console.log('[DEBUG checkEmployerPayment] canContactWorker result:', canContact);

    // TEMPORARY: Allow employers to contact workers without payment check
    // TODO: Re-enable payment check when payment system is fully operational
    // if (!canContact) {
    //   return res.status(403).json({ error: 'Payment required to contact this worker.' });
    // }

    console.log('[DEBUG checkEmployerPayment] next() is reached');
    next();
  } catch (error) {
    console.log('[DEBUG checkEmployerPayment] catch() is reached');
    console.error('Payment check error:', error);
    console.log('[DEBUG checkEmployerPayment] error.stack:', error.stack);
    return res.status(500).json({ error: 'Failed to verify payment status' });
  }
};

function resolveRecipientRole(senderRole) {
  if (senderRole === 'ADMIN') return 'USER';
  if (senderRole === 'EMPLOYER') return 'WORKER';
  if (senderRole === 'WORKER') return 'EMPLOYER';
  if (senderRole === 'SUPPORT') return 'USER';
  return 'USER';
}

function buildAvatarUrl(name, role) {
  const bg = role === 'EMPLOYER' ? 'teal' : role === 'WORKER' ? 'red' : role === 'ADMIN' ? 'yellow' : role === 'SUPPORT' ? 'purple' : 'gray';
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
    console.log('=== DEBUG POST /send START ===');
    console.log('req.body:', req.body);
    console.log('req.body.recipientId:', req.body.recipientId);
    console.log('typeof req.body.recipientId:', typeof req.body.recipientId);
    console.log('=== END DEBUG ===');

    const { senderName, senderRole, recipientId, recipientName, text } = req.body;
    const senderId = req.userId;

    if (!senderId || !recipientId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conversationId = getConversationId(senderId, recipientId);

    const recipientRole = resolveRecipientRole(senderRole);

    console.log('=== DEBUG BEFORE Message.create ===');
    console.log('senderId:', senderId);
    console.log('recipientId:', recipientId);
    console.log('senderRole:', senderRole);
    console.log('recipientRole:', recipientRole);
    console.log('conversationId:', conversationId);
    console.log('=== END DEBUG ===');

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

    console.log('=== DEBUG AFTER Message.create ===');
    console.log('success: true');
    console.log('message._id:', message._id);
    console.log('conversationId:', message.conversationId);
    console.log('savedMessage.recipientId:', message.recipientId);
    console.log('savedMessage.conversationId:', message.conversationId);
    console.log('=== END DEBUG ===');

    const formatted = formatMessage(message);

    return res.status(201).json(formatted);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages/:conversationId', authenticate, requireConversationParticipant, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = String(req.userId);

    const messages = await Message.find({
      conversationId: conversationId
    }).sort({ createdAt: 1 });

    const formatted = messages.map(formatMessage);

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/conversations/:userId', authenticate, async (req, res) => {
  try {
    const userId = String(req.userId);
    const userRole = req.userRole;

    // ADMIN and SUPPORT see ALL conversations
    // Other users only see conversations they're part of
    const isAdminOrSupport = userRole === 'ADMIN' || userRole === 'SUPPORT';
    
    let messages;
    if (isAdminOrSupport) {
      // Get all messages, sorted by creation time
      messages = await Message.find({}).sort({ createdAt: 1 });
    } else {
      // Get only messages where user is sender or recipient
      messages = await Message.find({
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      }).sort({ createdAt: 1 });
    }

    const groups = new Map();
    for (const msg of messages) {
      if (!groups.has(msg.conversationId)) groups.set(msg.conversationId, []);
      groups.get(msg.conversationId).push(msg);
    }

    const conversations = [];
    for (const [conversationId, msgs] of groups) {
      const last = msgs[msgs.length - 1];
      
      // For admin/support, determine the "other user" (non-admin/support participant)
      let otherUser;
      if (isAdminOrSupport) {
        // Find the participant who is not ADMIN or SUPPORT
        const nonAdminParticipant = msgs.find(m => {
          const senderRole = m.senderRole;
          const recipientRole = m.recipientRole;
          return senderRole !== 'ADMIN' && senderRole !== 'SUPPORT' &&
                 recipientRole !== 'ADMIN' && recipientRole !== 'SUPPORT';
        });
        
        if (nonAdminParticipant) {
          const isSender = String(last.senderId) === userId;
          otherUser = isSender
            ? { id: last.recipientId, name: last.recipientName, role: last.recipientRole || 'USER' }
            : { id: last.senderId, name: last.senderName, role: last.senderRole };
        } else {
          // Fallback to last message participants
          const isSender = String(last.senderId) === userId;
          otherUser = isSender
            ? { id: last.recipientId, name: last.recipientName, role: last.recipientRole || 'USER' }
            : { id: last.senderId, name: last.senderName, role: last.senderRole };
        }
      } else {
        const isSender = String(last.senderId) === userId;
        otherUser = isSender
          ? { id: last.recipientId, name: last.recipientName, role: last.recipientRole || 'USER' }
          : { id: last.senderId, name: last.senderName, role: last.senderRole };
      }

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

// Get all support users
router.get('/support-users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'SUPPORT'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        createdAt: true
      }
    });

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching support users:', error);
    return res.status(500).json({ error: 'Failed to fetch support users' });
  }
});

export default router;
