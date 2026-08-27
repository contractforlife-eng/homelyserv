import PublicSupportConversation from '../models/PublicSupportConversation.js';
import { getIo } from '../lib/socket.js';
import { PUBLIC_SUPPORT_CLEANUP_INTERVAL_MS, PUBLIC_SUPPORT_EXPIRY_BATCH_SIZE, PUBLIC_SUPPORT_INACTIVITY_MS } from '../config/publicSupport.js';

export const EXPIRABLE_PUBLIC_SUPPORT_STATUSES = ['BOT', 'WAITING_FOR_SUPPORT', 'ASSIGNED'];
export const canSendToPublicSupportConversation = (conversation) => conversation?.status !== 'CLOSED';

export const isInactiveConversation = (conversation, now = new Date(), timeoutMs = PUBLIC_SUPPORT_INACTIVITY_MS) => (
  EXPIRABLE_PUBLIC_SUPPORT_STATUSES.includes(conversation?.status)
  && new Date(conversation.lastActivityAt || conversation.updatedAt || conversation.createdAt).getTime() <= now.getTime() - timeoutMs
);

const closureDto = (conversation) => ({
  id:String(conversation._id), publicId:conversation.publicId, visitorName:conversation.visitorName || '', visitorEmail:conversation.visitorEmail || '',
  language:conversation.language, status:'CLOSED', assignedTo:conversation.assignedTo ? String(conversation.assignedTo) : null,
  assignedRole:conversation.assignedRole || null, escalationReason:conversation.escalationReason || '', escalatedAt:conversation.escalatedAt || null,
  lastMessage:conversation.lastMessage || '', lastMessageAt:conversation.lastMessageAt, lastActivityAt:conversation.lastActivityAt,
  guestUnreadCount:conversation.guestUnreadCount || 0, staffUnreadCount:0, closeReason:'INACTIVITY_TIMEOUT', closedAt:conversation.closedAt,
  createdAt:conversation.createdAt, updatedAt:conversation.updatedAt,
});

function emitClosed(conversation, io = getIo()) {
  if (!io) return;
  const dto = closureDto(conversation);
  io.to(`public-support:${conversation.publicId}`).emit('public-support:conversation', dto);
  if (dto.assignedTo) io.to(`public-support:staff:${dto.assignedTo}`).emit('public-support:queue', dto);
  else io.to('public-support:queue').emit('public-support:queue', dto);
  io.to('public-support:staff:admins').emit('public-support:queue', dto);
}

const inactivityFilter = (cutoff) => ({
  $or:[
    { lastActivityAt:{ $lte:cutoff } },
    { lastActivityAt:{ $exists:false }, updatedAt:{ $lte:cutoff } },
  ],
});

export async function expireConversationIfInactive(conversation, { now = new Date(), timeoutMs = PUBLIC_SUPPORT_INACTIVITY_MS, ConversationModel = PublicSupportConversation, io = getIo() } = {}) {
  if (!isInactiveConversation(conversation, now, timeoutMs)) return conversation;
  const closed = await ConversationModel.findOneAndUpdate(
    { _id:conversation._id, status:{ $in:EXPIRABLE_PUBLIC_SUPPORT_STATUSES }, ...inactivityFilter(new Date(now.getTime() - timeoutMs)) },
    { $set:{ status:'CLOSED', closeReason:'INACTIVITY_TIMEOUT', closedAt:now, staffUnreadCount:0 } },
    { new:true }
  );
  if (closed) emitClosed(closed, io);
  return closed || conversation;
}

export async function expireInactiveConversations({ now = new Date(), timeoutMs = PUBLIC_SUPPORT_INACTIVITY_MS, ConversationModel = PublicSupportConversation, io = getIo(), batchSize = PUBLIC_SUPPORT_EXPIRY_BATCH_SIZE } = {}) {
  const cutoff = new Date(now.getTime() - timeoutMs);
  const candidates = await ConversationModel.find({ status:{ $in:EXPIRABLE_PUBLIC_SUPPORT_STATUSES }, ...inactivityFilter(cutoff) }).sort({ lastActivityAt:1 }).limit(batchSize).lean();
  if (!candidates.length) return 0;
  const ids = candidates.map((item) => item._id);
  await ConversationModel.updateMany(
    { _id:{ $in:ids }, status:{ $in:EXPIRABLE_PUBLIC_SUPPORT_STATUSES }, ...inactivityFilter(cutoff) },
    { $set:{ status:'CLOSED', closeReason:'INACTIVITY_TIMEOUT', closedAt:now, staffUnreadCount:0 } }
  );
  const closed = await ConversationModel.find({ _id:{ $in:ids }, status:'CLOSED', closeReason:'INACTIVITY_TIMEOUT', closedAt:now }).lean();
  closed.forEach((conversation) => emitClosed(conversation, io));
  return closed.length;
}

export function startPublicSupportExpiryWorker() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await expireInactiveConversations(); }
    catch (error) { console.error('Public support inactivity cleanup failed:', error.message); }
    finally { running = false; }
  };
  void run();
  const timer = setInterval(run, PUBLIC_SUPPORT_CLEANUP_INTERVAL_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
