// Bounded legacy chat identity migration.
// SAFE BY DEFAULT: reads and reports only.
// Production apply requires --apply, NODE_ENV=production, and LEGACY_CHAT_CONFIRM=YES.

import 'dotenv/config';
import mongoose from 'mongoose';
import prisma from '../src/lib/prisma.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import {
  LEGACY_CHAT_THREAD,
  applyLegacyChatThreadPlan,
  buildLegacyChatThreadPlan,
} from '../src/services/legacyChatThreadMigration.js';

const APPLY = process.argv.includes('--apply');
const APPLY_GUARD = APPLY
  && process.env.NODE_ENV === 'production'
  && process.env.LEGACY_CHAT_CONFIRM === 'YES';

const readState = async (session = null) => {
  const conversationQuery = Conversation.findOne({
    conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
  });
  const canonicalQuery = Conversation.findOne({
    conversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
  });
  const messagesQuery = Message.find({
    conversationId: LEGACY_CHAT_THREAD.legacyConversationId,
  }).select({
    _id: 1,
    conversationId: 1,
    senderId: 1,
    recipientId: 1,
  });
  const canonicalMessagesQuery = Message.countDocuments({
    conversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
  });

  if (session) {
    conversationQuery.session(session);
    canonicalQuery.session(session);
    messagesQuery.session(session);
    canonicalMessagesQuery.session(session);
  }

  const [conversation, canonicalConversation, messages, canonicalMessageCount, workerProfile] = await Promise.all([
    conversationQuery.lean(),
    canonicalQuery.lean(),
    messagesQuery.lean(),
    canonicalMessagesQuery,
    prisma.workerProfile.findUnique({
      where: { id: LEGACY_CHAT_THREAD.workerProfileId },
      select: { id: true, userId: true },
    }),
  ]);

  return buildLegacyChatThreadPlan({
    conversation,
    canonicalConversation,
    messages,
    canonicalMessageCount,
    workerProfile,
  });
};

const printReport = (report) => {
  console.log(JSON.stringify(report, null, 2));
};

const main = async () => {
  if (APPLY && !APPLY_GUARD) {
    throw new Error('Apply requires --apply, NODE_ENV=production, and LEGACY_CHAT_CONFIRM=YES');
  }

  await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv');
  try {
    const report = await readState();
    printReport({ ...report, mode: APPLY ? 'apply' : 'dry-run' });

    if (!APPLY || report.status === 'already_migrated') return;
    if (!report.preconditionsPassed) throw new Error(`Preconditions failed: ${report.reasons.join(', ')}`);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transactionReport = await readState(session);
        if (!transactionReport.preconditionsPassed) {
          throw new Error(`Preconditions changed before apply: ${transactionReport.reasons.join(', ')}`);
        }

        await applyLegacyChatThreadPlan({
          conversationModel: Conversation,
          messageModel: Message,
          session,
        });

        const finalConversation = await Conversation.findOne({
          conversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
        }).session(session).lean();
        const finalMessageCount = await Message.countDocuments({
          conversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
        }).session(session);
        if (!finalConversation || finalMessageCount !== LEGACY_CHAT_THREAD.expectedMessageCount) {
          throw new Error('Post-write verification failed');
        }
      });
    } finally {
      await session.endSession();
    }

    console.log(JSON.stringify({
      applied: true,
      legacyConversationId: LEGACY_CHAT_THREAD.legacyConversationId,
      canonicalConversationId: LEGACY_CHAT_THREAD.canonicalConversationId,
      messageCount: LEGACY_CHAT_THREAD.expectedMessageCount,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error(`Legacy chat migration refused/failed: ${error.message}`);
  process.exitCode = 1;
});
