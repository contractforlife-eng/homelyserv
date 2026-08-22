import prisma from '../lib/prisma.js';
import Conversation from '../models/Conversation.js';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const CUSTOMER_ROLES = new Set(['WORKER', 'EMPLOYER']);

export class UserBlockValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const requireCanonicalId = (value, label) => {
  const id = String(value || '');
  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new UserBlockValidationError(`Invalid canonical ${label}`);
  }
  return id;
};

export const resolveCustomerPeer = async ({
  conversationId,
  userId,
  userRole,
  conversationModel = Conversation,
  prismaClient = prisma,
}) => {
  const id = String(conversationId || '').trim();
  if (!id || id.length > 200) throw new UserBlockValidationError('conversationId is required');

  const blockerId = requireCanonicalId(userId, 'user ID');
  const conversation = await conversationModel.findOne({ conversationId: id });
  if (!conversation || conversation.type !== 'PRIVATE') {
    throw new UserBlockValidationError('Only private customer conversations can be blocked', 403);
  }

  const participants = [...new Set((conversation.participantIds || []).map(String))];
  if (participants.length !== 2 || !participants.includes(blockerId)) {
    throw new UserBlockValidationError('You are not a participant in this conversation', 403);
  }

  const users = await prismaClient.user.findMany({
    where: { id: { in: participants } },
    select: { id: true, role: true },
  });
  const blocker = users.find((user) => String(user.id) === blockerId);
  const peerId = participants.find((participant) => participant !== blockerId);
  const peer = users.find((user) => String(user.id) === String(peerId));
  const canonicalPeerId = requireCanonicalId(peerId, 'peer ID');

  if (!blocker || blocker.role !== userRole || !CUSTOMER_ROLES.has(userRole) || !peer || !CUSTOMER_ROLES.has(peer.role)) {
    throw new UserBlockValidationError('Only Employer and Worker peers can be blocked', 403);
  }
  if (blocker.role === peer.role) {
    throw new UserBlockValidationError('Conversation participants are invalid', 400);
  }

  return { conversationId: id, blockerId, blockedUserId: canonicalPeerId, blocker, peer };
};

const pairSelector = (blockerId, blockedUserId) => ({
  blockerId_blockedUserId: { blockerId, blockedUserId },
});

export const blockPeer = async ({ context, prismaClient = prisma }) => prismaClient.userBlock.upsert({
  where: pairSelector(context.blockerId, context.blockedUserId),
  update: { updatedAt: new Date() },
  create: { blockerId: context.blockerId, blockedUserId: context.blockedUserId },
});

export const unblockPeer = async ({ context, prismaClient = prisma }) => {
  await prismaClient.userBlock.deleteMany({
    where: { blockerId: context.blockerId, blockedUserId: context.blockedUserId },
  });
};

export const getPeerBlockStatus = async ({ context, prismaClient = prisma }) => {
  const [blockedByMe, blockedMe] = await Promise.all([
    prismaClient.userBlock.findUnique({ where: pairSelector(context.blockerId, context.blockedUserId), select: { id: true } }),
    prismaClient.userBlock.findUnique({ where: pairSelector(context.blockedUserId, context.blockerId), select: { id: true } }),
  ]);
  return { blockedByMe: Boolean(blockedByMe), blockedMe: Boolean(blockedMe) };
};
