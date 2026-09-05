// backend/src/services/publicSupportAiService.js
// ============================================================
// HOMELYSERV PUBLIC LIVE SUPPORT — AI SERVICE (GEMINI BACKEND ONLY)
// Asynchronous AI-powered support assistant for public visitors.
// Enforces strict double-check gates, in-memory concurrency locks,
// structured JSON output, safe handoff boundaries, and FAQ fallback.
// ============================================================

import axios from 'axios';
import PublicSupportConversation from '../models/PublicSupportConversation.js';
import PublicSupportMessage from '../models/PublicSupportMessage.js';
import { getIo } from '../lib/socket.js';
import { answerFaq, transferredFaq } from './publicSupportFaqService.js';
import { HOMELYSERV_PUBLIC_KNOWLEDGE } from './publicSupportAiKnowledge.js';

// Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const AI_TIMEOUT_MS = 6000;
const MAX_CONTEXT_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 500;
const STALE_LOCK_TIMEOUT_MS = 15000;
const COOLDOWN_DEBOUNCE_MS = 1500;

// Centralized In-Memory Concurrency & Burst Lock Map
// Key: String(conversationId) -> { inFlight: boolean, startedAt: number, pendingRecheck: boolean }
const activeAiLocks = new Map();

/**
 * Message DTO helper matching publicSupport.js
 */
const messageDto = (message) => ({
  id: String(message._id),
  clientMessageId: message.clientMessageId || null,
  senderType: message.senderType,
  senderRole: message.senderRole || null,
  body: message.body,
  createdAt: message.createdAt
});

/**
 * Conversation DTO helper matching publicSupport.js
 */
const conversationDto = (conversation, assignedHelper = null) => ({
  id: String(conversation._id),
  publicId: conversation.publicId,
  visitorName: conversation.visitorName || '',
  visitorEmail: conversation.visitorEmail || '',
  language: conversation.language,
  status: conversation.status,
  assignedTo: conversation.assignedTo ? String(conversation.assignedTo) : null,
  assignedRole: conversation.assignedRole || null,
  assignedHelper: assignedHelper || conversation.assignedHelper || null,
  escalationReason: conversation.escalationReason || '',
  escalatedAt: conversation.escalatedAt || null,
  lastMessage: conversation.lastMessage,
  lastMessageAt: conversation.lastMessageAt,
  lastActivityAt: conversation.lastActivityAt,
  guestUnreadCount: conversation.guestUnreadCount,
  staffUnreadCount: conversation.staffUnreadCount,
  closeReason: conversation.closeReason || null,
  closedAt: conversation.closedAt || null,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt
});

/**
 * Realtime socket emission helpers
 */
function emitGuest(conversation, event, payload) {
  getIo()?.to(`public-support:${conversation.publicId}`).emit(event, payload);
}

function emitStaff(event, payload) {
  const io = getIo();
  if (!io) return;
  const assignedTo = payload?.assignedTo;
  if (assignedTo) io.to(`public-support:staff:${assignedTo}`).emit(event, payload);
  else io.to('public-support:queue').emit(event, payload);
  io.to('public-support:staff:admins').emit(event, payload);
}

/**
 * Sanitizes plain text for storage.
 */
const clean = (value, max) =>
  String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim()
    .slice(0, max);

/**
 * Builds system prompt instructing structured output and strict boundaries.
 */
function buildSystemInstruction(language = 'en') {
  return `You are the official automated assistant for HomelyServ Public Live Support.
Your role is to answer public visitor questions accurately, concisely, and politely using ONLY the provided knowledge base.

LANGUAGE INSTRUCTION:
- You MUST write your entire reply in the conversation's designated language: "${language}".
- Do NOT reply in any other language.

STRICT BOUNDARIES:
- You may REPLY ONLY for safe informational topics (e.g. how to register, Worker vs Employer differences, profile setup, finding workers/jobs, HomelyServ Jobs, External Opportunities, Remote Opportunities, Premium overview, basic messaging, navigation, supported languages).
- You MUST issue a HANDOFF for ANY of the following:
  1. Payment disputes, refund requests, or payment error claims ("PAYMENT_OR_DISPUTE").
  2. Account security, password reset assistance requiring manual action, ban/suspension questions ("ACCOUNT_SECURITY").
  3. Legal threats, physical safety, harassment, scam/fraud allegations, or abuse reports ("LEGAL_OR_SAFETY").
  4. Visitor explicitly asks for a human, support agent, staff, or admin ("HUMAN_REQUESTED").
  5. Questions requiring database changes, user role changes, discounts, hire creation, or out-of-scope topics ("OUT_OF_SCOPE").

NEVER ATTEMPT TO:
- Take actions on accounts, payments, passwords, or job offers.
- Reveal private platform data, internal secrets, or staff identities.

OUTPUT FORMAT:
You MUST respond with valid JSON matching this exact schema:
{
  "action": "REPLY" | "HANDOFF",
  "reason": "INFORMATIONAL" | "PAYMENT_OR_DISPUTE" | "ACCOUNT_SECURITY" | "LEGAL_OR_SAFETY" | "HUMAN_REQUESTED" | "OUT_OF_SCOPE",
  "reply": "plain text response to the visitor in ${language}"
}

KNOWLEDGE BASE:
${HOMELYSERV_PUBLIC_KNOWLEDGE}
`;
}

/**
 * Calls Gemini API with structured JSON output enforcement.
 */
async function callGeminiApi({ contextMessages, language }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  // Format context history for Gemini
  const contents = contextMessages.map((msg) => ({
    role: msg.senderType === 'VISITOR' ? 'user' : 'model',
    parts: [{ text: msg.body }]
  }));

  // Ensure first turn is 'user'
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (contents.length === 0) {
    throw new Error('NO_VALID_USER_TURNS');
  }

  const systemInstructionText = buildSystemInstruction(language);

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstructionText }]
    },
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json'
    }
  };

  const response = await axios.post(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, requestBody, {
    timeout: AI_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const rawCandidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawCandidateText) {
    throw new Error('EMPTY_GEMINI_RESPONSE');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawCandidateText);
  } catch {
    throw new Error('MALFORMED_JSON_RESPONSE');
  }

  const validActions = ['REPLY', 'HANDOFF'];
  const validReasons = [
    'INFORMATIONAL',
    'PAYMENT_OR_DISPUTE',
    'ACCOUNT_SECURITY',
    'LEGAL_OR_SAFETY',
    'HUMAN_REQUESTED',
    'OUT_OF_SCOPE'
  ];

  if (!parsed || typeof parsed !== 'object' || !validActions.includes(parsed.action)) {
    throw new Error('INVALID_ACTION_SCHEMA');
  }

  const action = parsed.action;
  const reason = validReasons.includes(parsed.reason) ? parsed.reason : 'INFORMATIONAL';
  const reply = typeof parsed.reply === 'string' ? clean(parsed.reply, 2000) : '';

  return { action, reason, reply };
}

/**
 * Handles atomic handoff to human support queue (WAITING_FOR_SUPPORT).
 */
async function performHandoff(conversationId, reasonText, customNotice = null) {
  const normalizedReason = clean(reasonText || 'Transferred to live support queue', 500);

  // 1. ATOMIC TRANSITION: BOT -> WAITING_FOR_SUPPORT
  const updatedConversation = await PublicSupportConversation.findOneAndUpdate(
    {
      _id: conversationId,
      status: 'BOT',
      assignedTo: null,
      assignedRole: null
    },
    {
      $set: {
        status: 'WAITING_FOR_SUPPORT',
        escalatedAt: new Date(),
        escalationReason: normalizedReason,
        lastActivityAt: new Date()
      },
      $inc: { staffUnreadCount: 1 }
    },
    { new: true }
  );

  if (!updatedConversation) {
    // Already claimed, escalated, or closed
    return null;
  }

  // 2. Persist BOT notice message
  const noticeBody = customNotice || transferredFaq(updatedConversation.language);
  let botNotice;
  try {
    botNotice = await PublicSupportMessage.create({
      conversationId: updatedConversation._id,
      senderType: 'BOT',
      body: noticeBody
    });

    updatedConversation.lastMessage = botNotice.body;
    updatedConversation.lastMessageAt = botNotice.createdAt;
    await updatedConversation.save();
  } catch (err) {
    console.error(`[PublicSupportAI] Notice persistence error: ${err.message}`);
  }

  // 3. Emit realtime socket events
  const dto = conversationDto(updatedConversation);
  if (botNotice) {
    emitGuest(updatedConversation, 'public-support:message', messageDto(botNotice));
  }
  emitGuest(updatedConversation, 'public-support:conversation', dto);
  emitStaff('public-support:queue', dto);

  return updatedConversation;
}

/**
 * Core async AI processor for public support conversations.
 *
 * @param {string|ObjectId} conversationId
 */
export async function processPublicSupportAiReply(conversationId) {
  const convIdStr = String(conversationId);
  const now = Date.now();

  // 1. Concurrency / Burst Gate
  const existingLock = activeAiLocks.get(convIdStr);
  if (existingLock && existingLock.inFlight) {
    // Stale lock recovery check (> 15 seconds)
    if (now - existingLock.startedAt < STALE_LOCK_TIMEOUT_MS) {
      existingLock.pendingRecheck = true;
      return;
    }
  }

  // Acquire in-memory lock
  activeAiLocks.set(convIdStr, {
    inFlight: true,
    startedAt: now,
    pendingRecheck: false
  });

  try {
    // Debounce cooldown
    await new Promise((resolve) => setTimeout(resolve, COOLDOWN_DEBOUNCE_MS));

    // 2. PRE-CALL GATE: Re-read fresh conversation state from MongoDB
    const conversation = await PublicSupportConversation.findById(conversationId);
    if (!conversation) {
      return;
    }

    if (conversation.status !== 'BOT' || conversation.assignedTo || conversation.assignedRole) {
      return;
    }

    // 3. Gather minimal context (last N messages, max chars)
    const rawMessages = await PublicSupportMessage.find({
      conversationId: conversation._id,
      senderType: { $in: ['VISITOR', 'BOT'] }
    })
      .sort({ createdAt: -1 })
      .limit(MAX_CONTEXT_MESSAGES)
      .lean();

    const chronological = rawMessages.reverse();

    // Cap total context length
    let totalChars = 0;
    const boundedMessages = [];
    for (let i = chronological.length - 1; i >= 0; i--) {
      const msg = chronological[i];
      if (totalChars + msg.body.length > MAX_CONTEXT_CHARS && boundedMessages.length > 0) {
        break;
      }
      totalChars += msg.body.length;
      boundedMessages.unshift(msg);
    }

    if (boundedMessages.length === 0) {
      return;
    }

    const latestVisitorMessage = boundedMessages
      .slice()
      .reverse()
      .find((m) => m.senderType === 'VISITOR');

    let aiResult;
    try {
      aiResult = await callGeminiApi({
        contextMessages: boundedMessages,
        language: conversation.language || 'en'
      });
    } catch (apiError) {
      console.error(`[PublicSupportAI] Gemini error (${apiError.message}), evaluating FAQ fallback`);

      // FAQ Fallback
      if (latestVisitorMessage?.body) {
        const faqResult = answerFaq(latestVisitorMessage.body, conversation.language);
        if (faqResult.escalate) {
          aiResult = {
            action: 'HANDOFF',
            reason: 'HUMAN_REQUESTED',
            reply: faqResult.answer
          };
        } else if (faqResult.matched) {
          aiResult = {
            action: 'REPLY',
            reason: 'INFORMATIONAL',
            reply: faqResult.answer
          };
        } else {
          // If no confident FAQ match, safely handoff
          aiResult = {
            action: 'HANDOFF',
            reason: 'OUT_OF_SCOPE',
            reply: transferredFaq(conversation.language)
          };
        }
      } else {
        return;
      }
    }

    // 4. ACTION DISPATCH
    if (aiResult.action === 'HANDOFF') {
      await performHandoff(conversation._id, aiResult.reason, aiResult.reply);
    } else if (aiResult.action === 'REPLY' && aiResult.reply) {
      // 5. PRE-COMMIT GATE: Verify conversation is STILL in BOT state
      const preCheck = await PublicSupportConversation.findById(conversation._id);
      if (!preCheck || preCheck.status !== 'BOT' || preCheck.assignedTo || preCheck.assignedRole) {
        return;
      }

      // Persist PublicSupportMessage (senderType: 'BOT', senderId: null)
      const botMessage = await PublicSupportMessage.create({
        conversationId: conversation._id,
        senderType: 'BOT',
        body: aiResult.reply
      });

      // Atomically update conversation metadata
      const updatedConv = await PublicSupportConversation.findOneAndUpdate(
        {
          _id: conversation._id,
          status: 'BOT',
          assignedTo: null,
          assignedRole: null
        },
        {
          $set: {
            lastMessage: botMessage.body,
            lastMessageAt: botMessage.createdAt,
            lastActivityAt: botMessage.createdAt
          }
        },
        { new: true }
      );

      if (updatedConv) {
        emitGuest(updatedConv, 'public-support:message', messageDto(botMessage));
      }
    }
  } catch (err) {
    console.error(`[PublicSupportAI] Unexpected error for conversation ${convIdStr}: ${err.message}`);
  } finally {
    // Release in-flight lock and inspect pendingRecheck
    const currentLock = activeAiLocks.get(convIdStr);
    const shouldRecheck = currentLock?.pendingRecheck;
    activeAiLocks.delete(convIdStr);

    if (shouldRecheck) {
      // Execute one consolidated follow-up
      setImmediate(() => {
        processPublicSupportAiReply(conversationId).catch(() => {});
      });
    }
  }
}

export default {
  processPublicSupportAiReply,
  buildSystemInstruction,
  callGeminiApi
};
