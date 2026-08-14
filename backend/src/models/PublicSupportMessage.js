import mongoose from 'mongoose';

const publicSupportMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicSupportConversation', required: true, index: true },
  clientMessageId: { type: String, maxlength: 100 },
  senderType: { type: String, enum: ['VISITOR', 'BOT', 'STAFF'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  senderRole: { type: String, enum: ['ADMIN', 'SUPPORT'], default: null },
  body: { type: String, required: true, maxlength: 2000 },
}, { timestamps: true });

publicSupportMessageSchema.index({ conversationId: 1, createdAt: 1 });
publicSupportMessageSchema.index(
  { conversationId: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } }
);

export default mongoose.model('PublicSupportMessage', publicSupportMessageSchema);
