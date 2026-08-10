// backend/src/models/Conversation.js
// Architectural permission model for conversations.
//
// Access rules:
//   PRIVATE  - Worker <-> Employer chat. Visible ONLY to participants.
//   SUPPORT  - User <-> Support chat. Visible to user + assigned support.
//   INTERNAL - Support <-> Admin chat. Visible to internal staff only.
//   ESCALATED - A conversation escalated to Admin. Visible to user,
//               assigned support, and Admin (after escalation).
//
// Admins and Support NEVER automatically see PRIVATE user chats.
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['PRIVATE', 'SUPPORT', 'INTERNAL', 'ESCALATED'],
      default: 'PRIVATE',
      index: true
    },
    // Participants (user ids) who can access this conversation.
    participantIds: { type: [String], default: [], index: true },
    // Support agent assigned to handle this conversation (SUPPORT type).
    supportAgentId: { type: String, default: null, index: true },
    // Internal staff members (SUPPORT/ADMIN) participating in INTERNAL chats.
    staffIds: { type: [String], default: [] },
    // Escalation metadata (ESCALATED type).
    complaintId: { type: String, default: null },
    escalatedBy: { type: String, default: null },
    escalatedAt: { type: Date, default: null },
    escalationReason: { type: String, default: null },
    // Lifecycle: soft-close for admin conversations.
    // Existing documents without status are treated as 'ACTIVE'.
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
      index: true
    },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
    // Last activity for sorting.
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' }
  },
  { timestamps: true }
);

conversationSchema.index({ type: 1, lastMessageAt: -1 });
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
conversationSchema.index({ supportAgentId: 1, lastMessageAt: -1 });
conversationSchema.index({ staffIds: 1, lastMessageAt: -1 });
conversationSchema.index({ complaintId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;