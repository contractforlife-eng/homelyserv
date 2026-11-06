import mongoose from 'mongoose';
const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const content = new Schema({
  authorId: { type: String, required: true, index: true },
  postId: { type: Schema.Types.ObjectId, default: null },
  clientMutationId: { type: String, default: null },
  payloadHash: { type: String, default: null },
  text: { type: String, maxlength: 15000, default: '' },
  image: { url: String, publicId: String, hash: String },
  hidden: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  notificationRecipientId: { type: String, default: null },
  notificationHandedOff: { type: Boolean, default: false },
}, { timestamps: true, collection: 'wall_content' });
content.index({ postId: 1, hidden: 1, deleted: 1, _id: -1 });
content.index({ notificationRecipientId: 1, notificationHandedOff: 1 });
content.index(
  { authorId: 1, clientMutationId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientMutationId: { $type: 'string', $gt: '' }
    }
  }
);
export const WallContent = model('WallContent', content);
const lotSchema = new Schema({
  lotId: { type: String, required: true },
  type: { type: String, enum: ['PURCHASE', 'ADMIN_GRANT'], required: true },
  originalQuantity: { type: Number, required: true },
  remainingQuantity: { type: Number, required: true, min: 0 },
  acquiredAt: { type: Date, required: true },
  expiresAt: { type: Date, default: null }, // null for non-expiring ADMIN_GRANT
  paymentId: { type: String, default: null },
  paymentReference: { type: String, default: null },
}, { _id: false });

const wallet = new Schema({
  _id: String,
  balance: { type: Number, default: 0, min: 0 },
  receivedGifts: { type: Number, default: 0, min: 0 },
  lots: { type: [lotSchema], default: [] },
  lotsMigrated: { type: Boolean, default: false },
}, { collection: 'wall_wallets', timestamps: true });
export const WallWallet = model('WallWallet', wallet);
const entry = new Schema({
  key: { type: String, required: true, unique: true },
  type: { type: String, enum: ['PURCHASE', 'GIFT', 'ADMIN_GRANT', 'ADMIN_DEDUCTION', 'EXPIRED'], required: true },
  userId: { type: String, required: true, index: true },
  recipientId: String,
  postId: Schema.Types.ObjectId,
  giftId: String,
  flag: String,
  quantity: { type: Number, required: true },
  paymentId: String,
  paymentReference: String,
  giftEmoji: String,
  animationSeenAt: { type: Date, default: null },
  notificationHandedOff: { type: Boolean, default: false },
  // Co-Admin and expiry audit fields:
  actorId: { type: String, default: null },
  actorRole: { type: String, default: null },
  reason: { type: String, default: null },
  lotId: { type: String, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true, collection: 'wall_entries' });
entry.index({ postId: 1, type: 1 });
entry.index({ recipientId: 1, type: 1, animationSeenAt: 1, _id: 1 });
entry.index({ type: 1, notificationHandedOff: 1, _id: 1 });
export const WallEntry = model('WallEntry', entry);
const like = new Schema(
  {
    userId: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, required: true },
    version: { type: Number, default: 0 }
  },
  { collection: 'wall_likes' }
);
like.index({ userId: 1, postId: 1 }, { unique: true });
export const WallLike = model('WallLike', like);
const report = new Schema({ userId: String, contentId: Schema.Types.ObjectId, reason: String,
  reporterRole: String, postId: Schema.Types.ObjectId, contentType: { type: String, enum: ['POST', 'COMMENT'] },
  snapshot: Schema.Types.Mixed, complaintHandedOff: { type: Boolean, default: false },
}, { timestamps: true, collection: 'wall_reports' });
report.index({ userId: 1, contentId: 1 }, { unique: true });
report.index({ complaintHandedOff: 1, _id: 1 });
export const WallReport = model('WallReport', report);
const block = new Schema({ userId: String, blockedId: String }, { collection: 'wall_blocks' });
block.index({ userId: 1, blockedId: 1 }, { unique: true });
export const WallBlock = model('WallBlock', block);
export const WallSettings = model('WallSettings', new Schema({ _id: String, pricingVersion: Number, prices: { type: Map, of: Number } }, { collection: 'wall_settings' }));
