// backend/src/models/Message.js - ES Module Version
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      required: true,
      enum: ['WORKER', 'EMPLOYER', 'ADMIN', 'SYSTEM']
    },
    recipientId: { type: String, required: true, index: true },
    recipientName: { type: String, required: true },
    recipientRole: {
      type: String,
      enum: ['WORKER', 'EMPLOYER', 'ADMIN', 'USER'],
      default: 'USER'
    },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    delivered: { type: Boolean, default: true }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;