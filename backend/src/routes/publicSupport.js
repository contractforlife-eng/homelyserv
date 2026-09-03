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

const router = express.Router();
const LANGUAGES = new Set(['en', 'ar', 'fr', 'ru', 'tr', 'de']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateBuckets = new Map();

const clean = (value, max) => String(value || '').replace(/[<>]/g, '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const safeLanguage = (value) => LANGUAGES.has(value) ? value : 'en';
const tokenFrom = (req) => req.get('X-Guest-Token') || '';
const messageDto = (message) => ({ id:String(message._id), clientMessageId:message.clientMessageId || null, senderType:message.senderType, senderRole:message.senderRole || null, body:message.body, createdAt:message.createdAt });
const conversationDto = (conversation) => ({ id:String(conversation._id), publicId:conversation.publicId, visitorName:conversation.visitorName || '', visitorEmail:conversation.visitorEmail || '', language:conversation.language, status:conversation.status, assignedTo:conversation.assignedTo ? String(conversation.assignedTo) : null, assignedRole:conversation.assignedRole || null, escalationReason:conversation.escalationReason || '', escalatedAt:conversation.escalatedAt || null, lastMessage:conversation.lastMessage, lastMessageAt:conversation.lastMessageAt, lastActivityAt:conversation.lastActivityAt, guestUnreadCount:conversation.guestUnreadCount, staffUnreadCount:conversation.staffUnreadCount, closeReason:conversation.closeReason || null, closedAt:conversation.closedAt || null, createdAt:conversation.createdAt, updatedAt:conversation.updatedAt });

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

    let botMessage = null;
    let requiresContact = false;
    if (conversation.status === 'BOT') {
      const faqResult = answerFaq(body, conversation.language);
      requiresContact = faqResult.escalate;
      botMessage = await PublicSupportMessage.create({ conversationId:conversation._id, senderType:'BOT', body:faqResult.answer });
      conversation.lastMessage = botMessage.body;
      conversation.lastMessageAt = botMessage.createdAt;
      conversation.lastActivityAt = botMessage.createdAt;
      if (requiresContact) conversation.escalationReason = clean(body, 500);
      await conversation.save();
      emitGuest(conversation, 'public-support:message', messageDto(botMessage));
    }
    res.status(201).json({ success:true, message:messageDto(visitorMessage), botMessage:botMessage ? messageDto(botMessage) : null, requiresContact, conversation:conversationDto(conversation) });
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
  const ownershipFilter = req.userRole === 'ADMIN'
    ? {}
    : { $or:[{ assignedTo:String(req.userId) }, { assignedTo:null }, { assignedTo:{ $exists:false } }] };
  const filter = req.userRole === 'ADMIN' ? statusFilter : { $and:[statusFilter, ownershipFilter] };
  const conversations = await PublicSupportConversation.find(filter).sort({ lastMessageAt:-1 }).limit(100).lean();
  res.json({ success:true, conversations:conversations.map(conversationDto) });
});

router.get('/staff/conversations/:id', requireLiveSupportStaff, async (req, res) => {
  let [conversation, messages] = await Promise.all([
    PublicSupportConversation.findById(req.params.id),
    PublicSupportMessage.find({ conversationId:req.params.id }).sort({ createdAt:1 }).limit(500).lean(),
  ]);
  if (!conversation) return res.status(404).json({ success:false, message:'Conversation not found.' });
  if (req.userRole !== 'ADMIN' && conversation.assignedTo && String(conversation.assignedTo) !== String(req.userId)) {
    return res.status(403).json({ success:false, message:'Conversation is assigned to another staff member.' });
  }
  conversation = await expireConversationIfInactive(conversation);
  conversation.staffUnreadCount = 0;
  await conversation.save();
  res.json({ success:true, conversation:conversationDto(conversation), messages:messages.map(messageDto) });
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

export default router;
