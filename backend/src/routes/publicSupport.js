import crypto from 'crypto';
import express from 'express';
import PublicSupportConversation from '../models/PublicSupportConversation.js';
import PublicSupportMessage from '../models/PublicSupportMessage.js';
import { requireLiveSupportStaff } from '../middleware/liveSupportAuth.js';
import { getIo } from '../lib/socket.js';
import { answerFaq, welcomeFaq, transferredFaq } from '../services/publicSupportFaqService.js';
import { createGuestToken, hashGuestToken, verifyGuestConversation } from '../services/publicSupportAccessService.js';
import { canSendToPublicSupportConversation, expireConversationIfInactive } from '../services/publicSupportExpiryService.js';
import { applyDetectedConversationLanguage } from '../services/publicSupportLanguageService.js';
import { processPublicSupportAiReply } from '../services/publicSupportAiService.js';

const router = express.Router();
const LANGUAGES = new Set(['en', 'ar', 'fr', 'ru', 'tr', 'de']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateBuckets = new Map();

const clean = (value, max) => String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const safeLanguage = (value) => LANGUAGES.has(value) ? value : 'en';
const tokenFrom = (req) => req.get('X-Guest-Token') || '';
const messageDto = (message) => ({ id:String(message._id), clientMessageId:message.clientMessageId || null, senderType:message.senderType, senderRole:message.senderRole || null, body:message.body, createdAt:message.createdAt });
const conversationDto = (conversation, assignedHelper = null) => ({ id:String(conversation._id), publicId:conversation.publicId, visitorName:conversation.visitorName || '', visitorEmail:conversation.visitorEmail || '', language:conversation.language, status:conversation.status, assignedTo:conversation.assignedTo ? String(conversation.assignedTo) : null, assignedRole:conversation.assignedRole || null, assignedHelper:assignedHelper || conversation.assignedHelper || null, escalationReason:conversation.escalationReason || '', escalatedAt:conversation.escalatedAt || null, lastMessage:conversation.lastMessage, lastMessageAt:conversation.lastMessageAt, lastActivityAt:conversation.lastActivityAt, guestUnreadCount:conversation.guestUnreadCount, staffUnreadCount:conversation.staffUnreadCount, closeReason:conversation.closeReason || null, closedAt:conversation.closedAt || null, createdAt:conversation.createdAt, updatedAt:conversation.updatedAt });

function limit(windowMs, maximum) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) rateBuckets.set(key, { count:1, resetAt:now + windowMs });
    else if (++current.count > maximum) return res.status(429).json({ success:false, message:'Too many requests. Please try again shortly.' });
    if (rateBuckets.size > 5000) for (const [bucketKey, bucket] of rateBuckets) if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    next();
  };
}

async function requireGuest(req, res, next) {
  const conversation = await verifyGuestConversation(req.params.publicId, tokenFrom(req));
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  req.publicSupportConversation = conversation;
  next();
}

function emitGuest(conversation, event, payload) { getIo()?.to(`public-support:${conversation.publicId}`).emit(event, payload); }
function emitStaff(event, payload) {
  const io = getIo();
  if (!io) return;
  const assignedTo = payload?.assignedTo;
  if (assignedTo) io.to(`public-support:staff:${assignedTo}`).emit(event, payload);
  else io.to('public-support:queue').emit(event, payload);
  io.to('public-support:staff:admins').emit(event, payload);
}

router.post('/session', limit(60_000, 10), async (req, res) => {
  try {
    const token = createGuestToken();
    const language = safeLanguage(req.body?.language);
    const conversation = await PublicSupportConversation.create({ publicId:crypto.randomUUID(), accessTokenHash:hashGuestToken(token), language });
    const welcome = await PublicSupportMessage.create({ conversationId:conversation._id, senderType:'BOT', body:welcomeFaq(language) });
    conversation.lastMessage = welcome.body;
    conversation.lastMessageAt = welcome.createdAt;
    conversation.lastActivityAt = welcome.createdAt;
    await conversation.save();
    res.status(201).json({ success:true, token, conversation:conversationDto(conversation), messages:[messageDto(welcome)] });
  } catch (error) {
    console.error('Public support session error:', error.message);
    res.status(500).json({ success:false, message:'Unable to start support chat.' });
  }
});

router.get('/session/:publicId', limit(60_000, 60), requireGuest, async (req, res) => {
  const conversation = await expireConversationIfInactive(req.publicSupportConversation);
  const messages = await PublicSupportMessage.find({ conversationId:conversation._id }).sort({ createdAt:1 }).limit(200).lean();
  if (conversation.guestUnreadCount) { conversation.guestUnreadCount = 0; await conversation.save(); }
  res.json({ success:true, conversation:conversationDto(conversation), messages:messages.map(messageDto) });
});

router.post('/session/:publicId/messages', limit(60_000, 30), requireGuest, async (req, res) => {
  try {
    const conversation = await expireConversationIfInactive(req.publicSupportConversation);
    if (!canSendToPublicSupportConversation(conversation)) return res.status(409).json({ success:false, message:'This conversation is closed.' });
    const body = clean(req.body?.body, 2000);
    const clientMessageId = clean(req.body?.clientMessageId, 100);
    if (!body) return res.status(400).json({ success:false, message:'Message is required.' });
    let visitorMessage;
    let duplicateMessage = false;
    try { visitorMessage = await PublicSupportMessage.create({ conversationId:conversation._id, clientMessageId:clientMessageId || undefined, senderType:'VISITOR', body }); }
    catch (error) {
      if (error.code !== 11000) throw error;
      visitorMessage = await PublicSupportMessage.findOne({ conversationId:conversation._id, clientMessageId });
      duplicateMessage = true;
    }
    if (duplicateMessage) return res.json({ success:true, message:messageDto(visitorMessage), botMessage:null, requiresContact:false, conversation:conversationDto(conversation), duplicate:true });
    applyDetectedConversationLanguage(conversation, body);
    conversation.lastMessage = body;
    conversation.lastMessageAt = visitorMessage.createdAt;
    conversation.lastActivityAt = visitorMessage.createdAt;
    conversation.staffUnreadCount += conversation.status === 'BOT' ? 0 : 1;
    await conversation.save();
    emitGuest(conversation, 'public-support:message', messageDto(visitorMessage));
    if (conversation.status !== 'BOT') {
      emitStaff('public-support:staff-message', { conversationId:String(conversation._id), assignedTo:conversation.assignedTo ? String(conversation.assignedTo) : null, message:messageDto(visitorMessage) });
      emitStaff('public-support:queue', conversationDto(conversation));
    }

    if (conversation.status === 'BOT') {
      // Async fire-and-forget Gemini AI processor (never blocks HTTP response)
      setImmediate(() => {
        processPublicSupportAiReply(conversation._id).catch((err) => {
          console.error('[PublicSupportAI] Dispatch error:', err.message);
        });
      });
    }

    res.status(201).json({
      success: true,
      message: messageDto(visitorMessage),
      botMessage: null,
      requiresContact: false,
      conversation: conversationDto(conversation)
    });
  } catch (error) {
    console.error('Public support message error:', error.message);
    res.status(500).json({ success:false, message:'Unable to send message.' });
  }
});

router.post('/session/:publicId/escalate', limit(60_000, 10), requireGuest, async (req, res) => {
  const conversation = await expireConversationIfInactive(req.publicSupportConversation);
  const visitorName = clean(req.body?.name, 100);
  const visitorEmail = clean(req.body?.email, 254).toLowerCase();
  if (visitorName.length < 2 || !EMAIL.test(visitorEmail)) return res.status(400).json({ success:false, message:'A valid name and email are required.' });
  if (!canSendToPublicSupportConversation(conversation)) return res.status(409).json({ success:false, message:'This conversation is closed.' });
  conversation.visitorName = visitorName;
  conversation.visitorEmail = visitorEmail;
  conversation.status = 'WAITING_FOR_SUPPORT';
  conversation.escalatedAt ||= new Date();
  conversation.staffUnreadCount += 1;
  conversation.escalationReason = clean(req.body?.reason || conversation.escalationReason || 'Visitor requested support', 500);
  const transfer = await PublicSupportMessage.create({ conversationId:conversation._id, senderType:'BOT', body:transferredFaq(conversation.language) });
  conversation.lastMessage = transfer.body;
  conversation.lastMessageAt = transfer.createdAt;
  conversation.lastActivityAt = transfer.createdAt;
  await conversation.save();
  const dto = conversationDto(conversation);
  emitGuest(conversation, 'public-support:message', messageDto(transfer));
  emitGuest(conversation, 'public-support:conversation', dto);
  emitStaff('public-support:queue', dto);
  res.json({ success:true, conversation:dto, message:messageDto(transfer) });
});

router.get('/staff/conversations', requireLiveSupportStaff, async (req, res) => {
  const statuses = clean(req.query.status, 50).split(',').filter((status) => ['WAITING_FOR_SUPPORT','ASSIGNED','CLOSED'].includes(status));
  const statusFilter = statuses.length ? { status:{ $in:statuses } } : { status:{ $ne:'BOT' } };
  let ownershipFilter;
  if (req.userRole === 'ADMIN') {
    ownershipFilter = {};
  } else if (req.userRole === 'SUPPORT') {
    ownershipFilter = { $or:[{ assignedTo:String(req.userId) }, { assignedTo:null }, { assignedTo:{ $exists:false } }, { assignedRole:'SUPPORT_HELPER' }] };
  } else {
    ownershipFilter = { $or:[{ assignedTo:String(req.userId) }, { assignedTo:null }, { assignedTo:{ $exists:false } }] };
  }
  const filter = req.userRole === 'ADMIN' ? statusFilter : { $and:[statusFilter, ownershipFilter] };
  const conversations = await PublicSupportConversation.find(filter).sort({ lastMessageAt:-1 }).limit(100).lean();
  const helperIds = [...new Set(conversations.map((c) => c.assignedTo).filter(Boolean))];
  let helperMap = new Map();
  if (helperIds.length > 0) {
    const prisma = (await import('../lib/prisma.js')).default;
    const helpers = await prisma.user.findMany({ where:{ id:{ in:helperIds } }, select:{ id:true, fullName:true, email:true, profileImage:true, role:true } });
    helperMap = new Map(helpers.map((h) => [String(h.id), h]));
  }
  const dtos = conversations.map((c) => {
    const helper = c.assignedTo ? helperMap.get(String(c.assignedTo)) : null;
    return conversationDto(c, helper);
  });
  res.json({ success:true, conversations:dtos });
});

router.get('/staff/conversations/:id', requireLiveSupportStaff, async (req, res) => {
  let [conversation, messages] = await Promise.all([
    PublicSupportConversation.findById(req.params.id),
    PublicSupportMessage.find({ conversationId:req.params.id }).sort({ createdAt:1 }).limit(500).lean(),
  ]);
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  const isAssignedToMe = conversation.assignedTo && String(conversation.assignedTo) === String(req.userId);
  const isSupHelpAssigned = conversation.assignedRole === 'SUPPORT_HELPER';
  const isSupportSupervisor = req.userRole === 'SUPPORT' && isSupHelpAssigned;
  if (req.userRole !== 'ADMIN' && !isAssignedToMe && !isSupportSupervisor && conversation.assignedTo) {
    return res.status(403).json({ success:false, message:'Conversation is assigned to another staff member.' });
  }
  conversation = await expireConversationIfInactive(conversation);
  if (isAssignedToMe || req.userRole === 'ADMIN') {
    conversation.staffUnreadCount = 0;
    await conversation.save();
  }
  let assignedHelper = null;
  if (conversation.assignedTo) {
    const prisma = (await import('../lib/prisma.js')).default;
    assignedHelper = await prisma.user.findUnique({ where:{ id:String(conversation.assignedTo) }, select:{ id:true, fullName:true, email:true, profileImage:true, role:true } });
  }
  res.json({ success:true, conversation:conversationDto(conversation, assignedHelper), messages:messages.map(messageDto) });
});

router.post('/staff/conversations/:id/claim', requireLiveSupportStaff, async (req, res) => {
  let conversation = await PublicSupportConversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  conversation = await expireConversationIfInactive(conversation);
  if (!canSendToPublicSupportConversation(conversation)) return res.status(409).json({ success:false, message:'Conversation is closed.' });
  if (conversation.assignedTo && String(conversation.assignedTo) !== String(req.userId) && req.userRole !== 'ADMIN') return res.status(409).json({ success:false, message:'Conversation is already assigned.' });
  conversation.assignedTo = req.userId;
  conversation.assignedRole = req.userRole;
  conversation.status = 'ASSIGNED';
  conversation.lastActivityAt = new Date();
  await conversation.save();
  const dto = conversationDto(conversation);
  emitGuest(conversation, 'public-support:conversation', dto);
  emitStaff('public-support:queue', dto);
  res.json({ success:true, conversation:dto });
});

router.post('/staff/conversations/:id/messages', requireLiveSupportStaff, async (req, res) => {
  let conversation = await PublicSupportConversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  conversation = await expireConversationIfInactive(conversation);
  if (!canSendToPublicSupportConversation(conversation)) return res.status(409).json({ success:false, message:'Conversation is closed.' });
  if (conversation.assignedTo && String(conversation.assignedTo) !== String(req.userId) && req.userRole !== 'ADMIN') return res.status(403).json({ success:false, message:'Conversation is assigned to another staff member.' });
  const body = clean(req.body?.body, 2000);
  const clientMessageId = clean(req.body?.clientMessageId, 100);
  if (!body) return res.status(400).json({ success:false, message:'Message is required.' });
  if (!conversation.assignedTo) { conversation.assignedTo = req.userId; conversation.assignedRole = req.userRole; conversation.status = 'ASSIGNED'; }
  let message;
  try { message = await PublicSupportMessage.create({ conversationId:conversation._id, clientMessageId:clientMessageId || undefined, senderType:'STAFF', senderId:req.userId, senderRole:req.userRole, body }); }
  catch (error) { if (error.code !== 11000) throw error; message = await PublicSupportMessage.findOne({ conversationId:conversation._id, clientMessageId }); }
  conversation.lastMessage = body;
  conversation.lastMessageAt = message.createdAt;
  conversation.lastActivityAt = message.createdAt;
  conversation.guestUnreadCount += 1;
  await conversation.save();
  emitGuest(conversation, 'public-support:message', messageDto(message));
  emitStaff('public-support:staff-message', { conversationId:String(conversation._id), assignedTo:conversation.assignedTo ? String(conversation.assignedTo) : null, message:messageDto(message) });
  emitGuest(conversation, 'public-support:conversation', conversationDto(conversation));
  emitStaff('public-support:queue', conversationDto(conversation));
  res.status(201).json({ success:true, message:messageDto(message), conversation:conversationDto(conversation) });
});

router.post('/staff/conversations/:id/close', requireLiveSupportStaff, async (req, res) => {
  const existing = await PublicSupportConversation.findById(req.params.id);
  if (!existing) return res.status(404).json({ success:false, message:'Conversation not found.' });
  if (req.userRole !== 'ADMIN' && String(existing.assignedTo || '') !== String(req.userId)) {
    return res.status(403).json({ success:false, message:'Conversation is not assigned to you.' });
  }
  const conversation = await PublicSupportConversation.findByIdAndUpdate(req.params.id, { status:'CLOSED', closeReason:'STAFF_CLOSED', closedAt:new Date(), staffUnreadCount:0 }, { new:true });
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  const dto = conversationDto(conversation);
  emitGuest(conversation, 'public-support:conversation', dto);
  emitStaff('public-support:queue', dto);
  res.json({ success:true, conversation:dto });
});

// ============================================================
// PHASE B3 — SUPERVISOR LIVE SUPPORT TAKEOVER & TRANSFER
// ============================================================

// POST /api/public-support/staff/conversations/:id/takeover
router.post('/staff/conversations/:id/takeover', requireLiveSupportStaff, async (req, res) => {
  try {
    if (req.userRole !== 'SUPPORT' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Support supervision authorization required' });
    }

    const { id } = req.params;
    const { expectedAssignee } = req.body || {};
    const supportId = String(req.userId);

    const existing = await PublicSupportConversation.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (existing.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot take over a closed conversation.' });
    }

    // Role Hierarchy Guards
    if (req.userRole !== 'ADMIN') {
      if (existing.assignedRole === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Cannot take over a conversation assigned to an Administrator' });
      }
      if (existing.assignedRole === 'SUPPORT' && String(existing.assignedTo || '') !== supportId) {
        return res.status(403).json({ success: false, message: 'Cannot take over a conversation assigned to another Support Agent' });
      }
      if (existing.assignedRole && existing.assignedRole !== 'SUPPORT_HELPER' && String(existing.assignedTo || '') !== supportId) {
        return res.status(403).json({ success: false, message: 'Only conversations assigned to Support Helpers can be supervised' });
      }
    }

    // Concurrency / Stale expectation check
    const currentAssigneeStr = existing.assignedTo ? String(existing.assignedTo) : null;
    if (expectedAssignee && currentAssigneeStr && currentAssigneeStr !== String(expectedAssignee)) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    // Atomic Mongoose findOneAndUpdate with expected state condition
    const atomicFilter = {
      _id: existing._id,
      status: 'ASSIGNED',
    };
    if (currentAssigneeStr) {
      atomicFilter.assignedTo = existing.assignedTo;
    }

    const updated = await PublicSupportConversation.findOneAndUpdate(
      atomicFilter,
      {
        $set: {
          assignedTo: req.userId,
          assignedRole: req.userRole,
          status: 'ASSIGNED',
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    const prisma = (await import('../lib/prisma.js')).default;
    const actorUser = await prisma.user.findUnique({
      where: { id: supportId },
      select: { fullName: true, role: true, email: true, profileImage: true },
    });

    let oldHelper = null;
    if (currentAssigneeStr && currentAssigneeStr !== supportId) {
      oldHelper = await prisma.user.findUnique({
        where: { id: currentAssigneeStr },
        select: { id: true, fullName: true, role: true },
      });
    }

    // Audit Log
    try {
      await prisma.supportActivity.create({
        data: {
          supportId,
          action: 'LIVE_SUPPORT_TAKEOVER',
          description: oldHelper
            ? `Live support taken over from ${oldHelper.fullName || 'support helper'}`
            : 'Live support taken over by supervisor',
          targetUserId: oldHelper?.id || undefined,
        },
      });
    } catch (auditErr) {
      console.error('Failed to log live support takeover activity:', auditErr.message);
    }

    // Notification to old helper
    if (oldHelper && oldHelper.role === 'SUPPORT_HELPER') {
      try {
        const { createNotification, NOTIFICATION_TYPES, PRIORITIES } = await import('../services/notificationService.js');
        await createNotification(oldHelper.id, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Live Support Taken Over',
          message: `Live support conversation with ${existing.visitorName || 'visitor'} was taken over by supervisor ${actorUser?.fullName || 'Support Agent'}`,
          entityType: 'LIVE_SUPPORT',
          entityId: String(updated._id),
          priority: PRIORITIES.NORMAL,
          link: '/sup-help/live-support',
        });
      } catch (notifErr) {
        console.error('Failed to create takeover notification:', notifErr.message);
      }
    }

    const dto = conversationDto(updated, actorUser ? { id: supportId, ...actorUser } : null);
    emitGuest(updated, 'public-support:conversation', dto);
    emitStaff('public-support:queue', dto);

    return res.json({
      success: true,
      message: 'Conversation taken over successfully',
      conversation: dto,
    });
  } catch (error) {
    console.error('❌ Error taking over live support conversation:', error);
    return res.status(500).json({ success: false, message: 'Failed to take over conversation' });
  }
});

// POST /api/public-support/staff/conversations/:id/reassign
router.post('/staff/conversations/:id/reassign', requireLiveSupportStaff, async (req, res) => {
  try {
    if (req.userRole !== 'SUPPORT' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Support supervision authorization required' });
    }

    const { id } = req.params;
    const { targetHelperId, expectedAssignee } = req.body || {};
    const supportId = String(req.userId);

    if (!targetHelperId) {
      return res.status(400).json({ success: false, message: 'Target support helper ID is required' });
    }

    const prisma = (await import('../lib/prisma.js')).default;
    const targetHelper = await prisma.user.findUnique({
      where: { id: String(targetHelperId) },
      select: { id: true, fullName: true, role: true, email: true, profileImage: true, isSuspended: true },
    });

    if (!targetHelper || targetHelper.role !== 'SUPPORT_HELPER' || targetHelper.isSuspended) {
      return res.status(400).json({ success: false, message: 'Target user must be an active Support Helper' });
    }

    const existing = await PublicSupportConversation.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (existing.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot reassign a closed conversation.' });
    }

    const currentAssigneeStr = existing.assignedTo ? String(existing.assignedTo) : null;

    // Reject transfer to the same current assignee
    if (currentAssigneeStr && String(targetHelper.id) === currentAssigneeStr) {
      return res.status(400).json({ success: false, message: 'Conversation is already assigned to this Support Helper' });
    }

    // Role Hierarchy Guards
    if (req.userRole !== 'ADMIN') {
      if (existing.assignedRole === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Cannot reassign a conversation assigned to an Administrator' });
      }
      if (existing.assignedRole === 'SUPPORT' && currentAssigneeStr !== supportId) {
        return res.status(403).json({ success: false, message: 'Cannot reassign a conversation assigned to another Support Agent' });
      }
      if (existing.assignedRole && existing.assignedRole !== 'SUPPORT_HELPER' && currentAssigneeStr !== supportId) {
        return res.status(403).json({ success: false, message: 'Only conversations assigned to Support Helpers can be supervised' });
      }
    }

    // Concurrency / Stale expectation check
    if (expectedAssignee && currentAssigneeStr && currentAssigneeStr !== String(expectedAssignee)) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    // Atomic Mongoose findOneAndUpdate with expected state condition
    const atomicFilter = {
      _id: existing._id,
      status: 'ASSIGNED',
    };
    if (currentAssigneeStr) {
      atomicFilter.assignedTo = existing.assignedTo;
    }

    const updated = await PublicSupportConversation.findOneAndUpdate(
      atomicFilter,
      {
        $set: {
          assignedTo: targetHelper.id,
          assignedRole: 'SUPPORT_HELPER',
          status: 'ASSIGNED',
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    const actorUser = await prisma.user.findUnique({
      where: { id: supportId },
      select: { fullName: true, role: true },
    });

    let oldHelper = null;
    if (currentAssigneeStr && currentAssigneeStr !== String(targetHelper.id)) {
      oldHelper = await prisma.user.findUnique({
        where: { id: currentAssigneeStr },
        select: { id: true, fullName: true, role: true },
      });
    }

    // Audit Log
    try {
      await prisma.supportActivity.create({
        data: {
          supportId,
          action: 'LIVE_SUPPORT_TRANSFER',
          description: `Live support reassigned to ${targetHelper.fullName || 'support helper'}`,
          targetUserId: targetHelper.id,
        },
      });
    } catch (auditErr) {
      console.error('Failed to log live support transfer activity:', auditErr.message);
    }

    // In-app notifications
    try {
      const { createNotification, NOTIFICATION_TYPES, PRIORITIES } = await import('../services/notificationService.js');
      // Notify displaced helper
      if (oldHelper && oldHelper.role === 'SUPPORT_HELPER') {
        await createNotification(oldHelper.id, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Live Support Reassigned',
          message: `Live support conversation with ${existing.visitorName || 'visitor'} was reassigned by supervisor ${actorUser?.fullName || 'Support Agent'}`,
          entityType: 'LIVE_SUPPORT',
          entityId: String(updated._id),
          priority: PRIORITIES.NORMAL,
          link: '/sup-help/live-support',
        });
      }
      // Notify new helper
      await createNotification(targetHelper.id, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Live Support Assigned',
        message: `New live support conversation with ${existing.visitorName || 'visitor'} was assigned to you by supervisor ${actorUser?.fullName || 'Support Agent'}`,
        entityType: 'LIVE_SUPPORT',
        entityId: String(updated._id),
        priority: PRIORITIES.NORMAL,
        link: '/sup-help/live-support',
      });
    } catch (notifErr) {
      console.error('Failed to create transfer notifications:', notifErr.message);
    }

    const dto = conversationDto(updated, targetHelper);
    emitGuest(updated, 'public-support:conversation', dto);
    emitStaff('public-support:queue', dto);

    return res.json({
      success: true,
      message: 'Conversation reassigned successfully',
      conversation: dto,
    });
  } catch (error) {
    console.error('❌ Error reassigning live support conversation:', error);
    return res.status(500).json({ success: false, message: 'Failed to reassign conversation' });
  }
});

// POST /api/public-support/staff/conversations/:id/return-to-queue
router.post('/staff/conversations/:id/return-to-queue', requireLiveSupportStaff, async (req, res) => {
  try {
    if (req.userRole !== 'SUPPORT' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Support supervision authorization required' });
    }

    const { id } = req.params;
    const { expectedAssignee } = req.body || {};
    const supportId = String(req.userId);

    const existing = await PublicSupportConversation.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (existing.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot return a closed conversation to queue.' });
    }

    const currentAssigneeStr = existing.assignedTo ? String(existing.assignedTo) : null;

    // Role Hierarchy Guards
    if (req.userRole !== 'ADMIN') {
      if (existing.assignedRole === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Cannot return an Administrator conversation to queue' });
      }
      if (existing.assignedRole === 'SUPPORT' && currentAssigneeStr !== supportId) {
        return res.status(403).json({ success: false, message: 'Cannot return another Support Agent conversation to queue' });
      }
      if (existing.assignedRole && existing.assignedRole !== 'SUPPORT_HELPER' && currentAssigneeStr !== supportId) {
        return res.status(403).json({ success: false, message: 'Only conversations assigned to Support Helpers can be supervised' });
      }
    }

    // Concurrency / Stale expectation check
    if (expectedAssignee && currentAssigneeStr && currentAssigneeStr !== String(expectedAssignee)) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    // Atomic Mongoose findOneAndUpdate with expected state condition
    const atomicFilter = {
      _id: existing._id,
      status: 'ASSIGNED',
    };
    if (currentAssigneeStr) {
      atomicFilter.assignedTo = existing.assignedTo;
    }

    const updated = await PublicSupportConversation.findOneAndUpdate(
      atomicFilter,
      {
        $set: {
          assignedTo: null,
          assignedRole: null,
          status: 'WAITING_FOR_SUPPORT',
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Conversation assignment has changed. Please refresh and try again.',
      });
    }

    const prisma = (await import('../lib/prisma.js')).default;
    const actorUser = await prisma.user.findUnique({
      where: { id: supportId },
      select: { fullName: true, role: true },
    });

    let oldHelper = null;
    if (currentAssigneeStr) {
      oldHelper = await prisma.user.findUnique({
        where: { id: currentAssigneeStr },
        select: { id: true, fullName: true, role: true },
      });
    }

    // Audit Log
    try {
      await prisma.supportActivity.create({
        data: {
          supportId,
          action: 'LIVE_SUPPORT_RETURNED_TO_QUEUE',
          description: 'Live support conversation returned to waiting queue by supervisor',
          targetUserId: oldHelper?.id || undefined,
        },
      });
    } catch (auditErr) {
      console.error('Failed to log live support return-to-queue activity:', auditErr.message);
    }

    // Notification to displaced helper
    if (oldHelper && oldHelper.role === 'SUPPORT_HELPER') {
      try {
        const { createNotification, NOTIFICATION_TYPES, PRIORITIES } = await import('../services/notificationService.js');
        await createNotification(oldHelper.id, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Live Support Returned to Queue',
          message: `Live support conversation with ${existing.visitorName || 'visitor'} was returned to the waiting queue by supervisor ${actorUser?.fullName || 'Support Agent'}`,
          entityType: 'LIVE_SUPPORT',
          entityId: String(updated._id),
          priority: PRIORITIES.NORMAL,
          link: '/sup-help/live-support',
        });
      } catch (notifErr) {
        console.error('Failed to create return notification:', notifErr.message);
      }
    }

    const dto = conversationDto(updated, null);
    emitGuest(updated, 'public-support:conversation', dto);
    emitStaff('public-support:queue', dto);

    return res.json({
      success: true,
      message: 'Conversation returned to queue successfully',
      conversation: dto,
    });
  } catch (error) {
    console.error('❌ Error returning live support conversation to queue:', error);
    return res.status(500).json({ success: false, message: 'Failed to return conversation to queue' });
  }
});

export default router;
