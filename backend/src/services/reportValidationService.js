import prisma from '../lib/prisma.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { canAccessConversation } from '../routes/chat.js';
import { authorizeEmployerProfileView } from './employerProfileAuthorization.js';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const CUSTOMER_ROLES = new Set(['WORKER', 'EMPLOYER']);

export class ReportValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const requireObjectId = (value, label) => {
  if (!value || !OBJECT_ID_PATTERN.test(String(value))) {
    throw new ReportValidationError(`Invalid ${label}`);
  }
  return String(value);
};

const requireText = (value, label, maxLength = 5000) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new ReportValidationError(`${label} is required`);
  if (text.length > maxLength) throw new ReportValidationError(`${label} is too long`);
  return text;
};

const loadCustomerConversation = async ({
  conversationId,
  reporterId,
  reporterRole,
  conversationModel = Conversation,
  prismaClient = prisma,
  accessChecker = canAccessConversation,
}) => {
  const id = requireText(conversationId, 'conversationId', 200);
  const conversation = await conversationModel.findOne({ conversationId: id });
  if (!conversation || conversation.type !== 'PRIVATE') {
    throw new ReportValidationError('Conversation is not reportable', 403);
  }

  const participants = [...new Set((conversation.participantIds || []).map(String))];
  if (participants.length !== 2 || !participants.includes(String(reporterId))) {
    throw new ReportValidationError('You are not a participant in this conversation', 403);
  }

  const allowed = await accessChecker(id, String(reporterId), reporterRole);
  if (!allowed) throw new ReportValidationError('Not authorized to access this conversation', 403);

  const users = await prismaClient.user.findMany({
    where: { id: { in: participants } },
    select: { id: true, role: true },
  });
  const reporter = users.find((user) => String(user.id) === String(reporterId));
  const peerId = participants.find((participant) => participant !== String(reporterId));
  const peer = users.find((user) => String(user.id) === String(peerId));

  if (!reporter || reporter.role !== reporterRole || !peer || !CUSTOMER_ROLES.has(peer.role)) {
    throw new ReportValidationError('Only Employer and Worker conversations are reportable', 400);
  }
  if (reporter.role === peer.role) {
    throw new ReportValidationError('Conversation participants are invalid', 400);
  }

  return { id, conversation, reporter, peer };
};

export const validateUserReport = async ({ reporterId, reporterRole, conversationId, reportedUserId, ...dependencies }) => {
  const context = await loadCustomerConversation({ conversationId, reporterId, reporterRole, ...dependencies });
  const targetId = requireObjectId(reportedUserId, 'reportedUserId');
  if (targetId === String(reporterId) || targetId !== String(context.peer.id)) {
    throw new ReportValidationError('Reported user must be the other conversation participant', 403);
  }
  return { ...context, reportedUserId: targetId };
};

export const validateMessageReport = async ({ reporterId, reporterRole, conversationId, messageId, messageModel = Message, ...dependencies }) => {
  const context = await loadCustomerConversation({ conversationId, reporterId, reporterRole, ...dependencies });
  const id = requireObjectId(messageId, 'messageId');
  const message = await messageModel.findById(id).lean();
  if (!message || String(message.conversationId) !== context.id) {
    throw new ReportValidationError('Message does not belong to this conversation', 403);
  }

  const senderId = String(message.senderId);
  const recipientId = String(message.recipientId);
  if (senderId !== String(context.peer.id) || recipientId !== String(reporterId) || senderId === String(reporterId)) {
    throw new ReportValidationError('Only a received message from the conversation peer can be reported', 403);
  }

  return { ...context, message, messageId: id, reportedUserId: senderId };
};

export const validateProfileReport = async ({
  reporterId,
  reporterRole,
  reportedUserId,
  prismaClient = prisma,
  employerProfileAuthorizer = authorizeEmployerProfileView,
}) => {
  if (!CUSTOMER_ROLES.has(String(reporterRole).toUpperCase())) {
    throw new ReportValidationError('Only workers and employers can report profiles', 403);
  }

  const reporterObjectId = requireObjectId(reporterId, 'reporterId');
  const targetId = requireObjectId(reportedUserId, 'reportedUserId');
  if (reporterObjectId === targetId) {
    throw new ReportValidationError('You cannot report your own profile', 403);
  }

  const target = await prismaClient.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target || !CUSTOMER_ROLES.has(String(target.role).toUpperCase())) {
    throw new ReportValidationError('Profile is not reportable', 403);
  }

  const normalizedReporterRole = String(reporterRole).toUpperCase();
  const expectedTargetRole = normalizedReporterRole === 'WORKER' ? 'EMPLOYER' : 'WORKER';
  if (String(target.role).toUpperCase() !== expectedTargetRole) {
    throw new ReportValidationError('Profile is not reportable', 403);
  }

  if (normalizedReporterRole === 'WORKER') {
    const authorization = await employerProfileAuthorizer({
      requesterId: reporterObjectId,
      requesterRole: normalizedReporterRole,
      targetUserId: targetId,
      targetRole: target.role,
      db: prismaClient,
    });
    if (!authorization.allowed) {
      throw new ReportValidationError('You are not authorized to view this profile', 403);
    }
  }

  return { reportedUserId: String(target.id), target };
};

export const validateReportText = ({ reason, description }) => ({
  reason: requireText(reason, 'reason', 120),
  description: requireText(description, 'description'),
});
