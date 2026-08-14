import mongoose from 'mongoose';

const publicSupportConversationSchema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true, index: true },
  accessTokenHash: { type: String, required: true, select: false },
  visitorName: { type: String, trim: true, maxlength: 100 },
  visitorEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  language: { type: String, enum: ['en', 'ar', 'fr', 'ru', 'tr', 'de'], default: 'en' },
  status: { type: String, enum: ['BOT', 'WAITING_FOR_SUPPORT', 'ASSIGNED', 'CLOSED'], default: 'BOT', index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedRole: { type: String, enum: ['ADMIN', 'SUPPORT'], default: null },
  escalationReason: { type: String, maxlength: 500 },
  escalatedAt: { type: Date, default: null },
  lastActivityAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  closeReason: { type: String, enum: ['INACTIVITY_TIMEOUT', 'STAFF_CLOSED'], default: null },
  lastMessage: { type: String, maxlength: 2000, default: '' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  guestUnreadCount: { type: Number, default: 0, min: 0 },
  staffUnreadCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

publicSupportConversationSchema.index({ status: 1, lastMessageAt: -1 });
publicSupportConversationSchema.index({ status: 1, lastActivityAt: 1 });

export default mongoose.model('PublicSupportConversation', publicSupportConversationSchema);
