import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { authenticate } from '../middleware/auth.js';
import { WallContent, WallWallet, WallEntry, WallLike, WallReport, WallBlock, WallSettings } from '../models/Wall.js';
import { wallGifts, sweepWalletExpirations } from '../services/wallService.js';
import { ensureWalletLotsReconstructed } from '../services/wallLotReconstruction.js';
import { getSpendableBalance, getUpcomingExpiringLots, planLotDeduction, sweepExpiredLots } from '../utils/dinarExpiry.js';
import { buildWallFeedFilter } from '../utils/wallFeed.js';
import { wallCrown, validateWallText, MIN_WALL_GIFT_PRICE, DEFAULT_WALL_GIFTS } from '../config/wall.js';
import { marketplaceImageUpload, detectMarketplaceImageType, deleteMarketplaceImage } from '../utils/marketplaceImageUpload.js';
import { uploadFromBuffer } from '../utils/cloudinary.js';
import { resolveMarketplaceSellerSummaries } from './marketplace.js';
import { getSupportedCountryByCode } from '../utils/supportedCountries.js';
import User from '../models/User.js';
import { deliverWallReport } from '../services/wallReportService.js';
import { emitToUser } from '../lib/socket.js';
import { reconcileWallNotifications } from '../services/wallNotificationService.js';

const router = express.Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (code, status = 400) => { throw Object.assign(new Error(code), { status }); };
const id = value => { if (!/^[a-f\d]{24}$/i.test(String(value))) fail('INVALID_ID'); return String(value); };
const staff = req => ['ADMIN', 'SUPPORT'].includes(req.userRole);
const upload = (req, res, next) => marketplaceImageUpload(req, res, error => error ? res.status(400).json({ code: 'INVALID_IMAGE' }) : next());
router.use(authenticate);
async function blockedIds(userId) {
  const blocks = await WallBlock.find({ $or: [{ userId }, { blockedId: userId }] }).lean();
  return blocks.map(b => b.userId === userId ? b.blockedId : b.userId);
}
async function visible(req, contentId, session = null) {
  const content = await WallContent.findOne({ _id: id(contentId), deleted: false, hidden: false }).session(session);
  if (!content || (await blockedIds(String(req.userId))).includes(content.authorId)) fail('NOT_FOUND', 404);
  if (content.postId) {
    const parent = await WallContent.findOne({ _id: content.postId, deleted: false, hidden: false }).session(session);
    if (!parent || (await blockedIds(String(req.userId))).includes(parent.authorId)) fail('NOT_FOUND', 404);
  }
  return content;
}
async function serialize(rows, userId) {
  if (!rows.length) return [];
  const ids = rows.map(row => row._id);
  const authorIds = [...new Set(rows.map(row => row.authorId))];
  const [authors, wallets, likes, gifts, comments, roles] = await Promise.all([
    resolveMarketplaceSellerSummaries(authorIds), WallWallet.find({ _id: { $in: authorIds } }).lean(),
    WallLike.aggregate([
      { $match: { postId: { $in: ids } } },
      { $group: { _id: '$postId', count: { $sum: 1 }, mine: { $max: { $cond: [{ $eq: ['$userId', userId] }, 1, 0] } } } }
    ]),
    WallEntry.aggregate([{ $match: { postId: { $in: ids }, type: 'GIFT' } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
    WallContent.aggregate([{ $match: { postId: { $in: ids }, hidden: false, deleted: false } }, { $group: { _id: '$postId', count: { $sum: 1 } } }]),
    User.find({ _id: { $in: authorIds.filter(v => /^[a-f\d]{24}$/i.test(v)) } }).select('_id role profileImage').lean(),
  ]);
  return rows.map(row => {
    const author = authors.get(row.authorId);
    const like = likes.find(l => String(l._id) === String(row._id));
    return { id: String(row._id), text: row.text, image: row.image?.url || null, createdAt: row.createdAt,
      author: { ...author, role: roles.find(u => String(u._id) === row.authorId)?.role, profileImage: roles.find(u => String(u._id) === row.authorId)?.profileImage || null, crown: wallCrown(wallets.find(w => w._id === row.authorId)?.receivedGifts || 0) },
      likes: like?.count || 0, liked: !!like?.mine,
      gifts: gifts.find(g => String(g._id) === String(row._id))?.count || 0,
      comments: comments.find(c => String(c._id) === String(row._id))?.count || 0 };
  });
}
router.get('/store', wrap(async (req, res) => {
  const now = new Date();
  const wallet = await WallWallet.findById(String(req.userId)).lean();
  const balance = getSpendableBalance(wallet, now);
  const upcomingExpiring = getUpcomingExpiringLots(wallet, now);
  res.json({
    gifts: await wallGifts(),
    balance,
    upcomingExpiring,
    crown: wallCrown(wallet?.receivedGifts || 0),
    dinarPriceEGP: 0.1,
    validityNotice: 'Purchased dinars are valid for one calendar month from the payment date.',
  });
}));
router.get('/history', wrap(async (req, res) => {
  const userId = String(req.userId);
  const now = new Date();

  // Trigger lazy sweep of any newly expired lots for this user if needed
  const preCheckWallet = await WallWallet.findById(userId).lean();
  if (preCheckWallet?.lots && Array.isArray(preCheckWallet.lots)) {
    const sweep = sweepExpiredLots(preCheckWallet.lots, now);
    if (sweep.hasExpiredLots) {
      await sweepWalletExpirations(userId, now).catch(() => {});
    }
  }

  const filter = { $or: [{ userId }, { recipientId: userId }] };
  if (req.query.before) filter._id = { $lt: new mongoose.Types.ObjectId(id(req.query.before)) };
  const [rows, totals, wallet] = await Promise.all([
    WallEntry.find(filter).sort({ _id: -1 }).limit(21).lean(),
    WallEntry.aggregate([{ $match: { $or: [{ userId }, { recipientId: userId }] } }, { $group: { _id: null,
      purchased: { $sum: { $cond: [{ $eq: ['$type', 'PURCHASE'] }, '$quantity', 0] } },
      granted: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'ADMIN_GRANT'] }, { $eq: ['$userId', userId] }] }, '$quantity', 0] } },
      deducted: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'ADMIN_DEDUCTION'] }, { $eq: ['$userId', userId] }] }, '$quantity', 0] } },
      expired: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'EXPIRED'] }, { $eq: ['$userId', userId] }] }, '$quantity', 0] } },
      spent: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'GIFT'] }, { $eq: ['$userId', userId] }] }, '$quantity', 0] } },
      received: { $sum: { $cond: [{ $eq: ['$recipientId', userId] }, 1, 0] } } } }]),
    WallWallet.findById(userId).lean(),
  ]);
  const peers = await User.find({ _id: { $in: [...new Set(rows.flatMap(e => [e.userId, e.recipientId]).filter(v => /^[a-f\d]{24}$/i.test(v || '')))] } }).select('_id fullName').lean();
  const entries = rows.slice(0, 20).map(e => ({
    _id: e._id,
    type: e.type,
    userId: e.userId,
    recipientId: e.recipientId,
    quantity: e.quantity,
    giftId: e.giftId,
    giftEmoji: e.giftEmoji || DEFAULT_WALL_GIFTS.find(g => g.id === e.giftId)?.emoji,
    peerName: peers.find(p => String(p._id) === (e.recipientId === userId ? e.userId : e.recipientId))?.fullName || '',
    createdAt: e.createdAt,
    postId: e.postId,
    lotId: e.lotId,
    expiresAt: e.expiresAt,
    reason: e.reason,
    actorRole: e.actorRole,
  }));
  const balance = getSpendableBalance(wallet, now);
  const upcomingExpiring = getUpcomingExpiringLots(wallet, now);
  res.json({
    entries,
    lots: (wallet?.lots || []).map(l => ({
      lotId: l.lotId,
      type: l.type,
      originalQuantity: l.originalQuantity,
      remainingQuantity: l.remainingQuantity,
      acquiredAt: l.acquiredAt,
      expiresAt: l.expiresAt,
      isExpired: l.expiresAt ? new Date(l.expiresAt).getTime() <= now.getTime() : false,
    })),
    summary: {
      balance,
      purchased: totals[0]?.purchased || 0,
      granted: totals[0]?.granted || 0,
      deducted: totals[0]?.deducted || 0,
      expired: totals[0]?.expired || 0,
      spent: totals[0]?.spent || 0,
      received: totals[0]?.received || 0,
      upcomingExpiring,
    },
    next: rows.length > 20 ? String(rows[19]._id) : null,
  });
}));
router.get('/gifts/inbox', wrap(async (req, res) => {
  const filter = { recipientId: String(req.userId), type: 'GIFT', animationSeenAt: null };
  const [rows, total] = await Promise.all([WallEntry.find(filter).sort({ _id: 1 }).limit(50).lean(), WallEntry.countDocuments(filter)]);
  const senders = await User.find({ _id: { $in: [...new Set(rows.map(e => e.userId).filter(v => /^[a-f\d]{24}$/i.test(v)))] } }).select('_id fullName').lean();
  res.json({ total, gifts: rows.map(e => ({ eventId: String(e._id), postId: String(e.postId), id: e.giftId,
    emoji: e.giftEmoji || DEFAULT_WALL_GIFTS.find(g => g.id === e.giftId)?.emoji || '🎁',
    senderName: senders.find(u => String(u._id) === e.userId)?.fullName || 'HomelyServ', createdAt: e.createdAt })) });
}));
router.post('/gifts/ack', wrap(async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 50) fail('INVALID_GIFT_IDS');
  ids.forEach(id);
  await WallEntry.updateMany({ _id: { $in: ids }, recipientId: String(req.userId), type: 'GIFT', animationSeenAt: null }, { $set: { animationSeenAt: new Date() } });
  res.json({ success: true });
}));
router.get('/posts/:id', wrap(async (req, res) => {
  const post = await visible(req, req.params.id);
  if (post.postId) fail('INVALID_POST');
  res.json({ post: (await serialize([post.toObject()], String(req.userId)))[0] });
}));
router.get('/posts', wrap(async (req, res) => {
  const filter = buildWallFeedFilter({ userId: req.userId, scope: String(req.query.scope || 'public'), blocked: await blockedIds(String(req.userId)), beforeId: req.query.before ? new mongoose.Types.ObjectId(id(req.query.before)) : null });
  const rows = await WallContent.find(filter).sort({ _id: -1 }).limit(21).lean();
  res.json({ posts: await serialize(rows.slice(0, 20), String(req.userId)), next: rows.length > 20 ? String(rows[19]._id) : null });
}));
router.get('/posts/:id/comments', wrap(async (req, res) => {
  await visible(req, req.params.id);
  const filter = { postId: id(req.params.id), deleted: false, hidden: false, authorId: { $nin: await blockedIds(String(req.userId)) } };
  if (req.query.before) filter._id = { $lt: new mongoose.Types.ObjectId(id(req.query.before)) };
  const rows = await WallContent.find(filter).sort({ _id: -1 }).limit(21).lean();
  res.json({ comments: await serialize(rows.slice(0, 20), String(req.userId)), next: rows.length > 20 ? String(rows[19]._id) : null });
}));
async function createContent(req, res) {
  let uploaded;
  const parent = req.params.id ? await visible(req, req.params.id) : null;
  if (parent?.postId) fail('INVALID_POST');
  const text = validateWallText(req.body.text, !!req.file);
  // A comment is either text OR one image, as specified.
  if (parent && text && req.file) fail('TEXT_OR_IMAGE');

  // Compute canonical payload fingerprint
  const incomingParentId = parent ? String(parent._id) : '';
  const incomingImageHash = req.file ? crypto.createHash('sha256').update(req.file.buffer).digest('hex') : '';
  const canonicalPayload = `${incomingParentId}:${String(text || '').trim()}:${incomingImageHash}`;
  const payloadHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

  // Idempotency support for retries
  const rawMutationId = req.get('Idempotency-Key') || req.body.clientMutationId;
  const clientMutationId = (typeof rawMutationId === 'string' && /^[a-z\d_-]{8,100}$/i.test(rawMutationId))
    ? rawMutationId.trim()
    : null;

  if (clientMutationId) {
    const existing = await WallContent.findOne({ authorId: String(req.userId), clientMutationId }).lean();
    if (existing) {
      // Validate that mutation key reuse matches the canonical payload fingerprint
      const existingParent = existing.postId ? String(existing.postId) : '';
      const existingImageHash = existing.image?.hash || '';
      const existingCanonical = `${existingParent}:${String(existing.text || '').trim()}:${existingImageHash}`;
      const existingPayloadHash = existing.payloadHash || crypto.createHash('sha256').update(existingCanonical).digest('hex');

      if (existingPayloadHash !== payloadHash) {
        fail('MUTATION_KEY_CONFLICT', 409);
      }
      return res.status(200).json({
        reused: true,
        content: (await serialize([existing], String(req.userId)))[0]
      });
    }
  }

  if (req.file) {
    if (detectMarketplaceImageType(req.file.buffer) !== req.file.mimetype) fail('INVALID_IMAGE');
    try { uploaded = await uploadFromBuffer(req.file.buffer, { folder: 'homelyserv/wall', resource_type: 'image', transformation: [{ width: 1600, height: 1600, crop: 'limit' }] }); }
    catch { fail('IMAGE_STORAGE_UNAVAILABLE', 503); }
    if (!uploaded?.secure_url || !uploaded.public_id) fail('IMAGE_STORAGE_UNAVAILABLE', 503);
  }
  try {
    const item = await WallContent.create({ authorId: String(req.userId), postId: parent?._id || null, text,
      clientMutationId,
      payloadHash,
      notificationRecipientId: parent && parent.authorId !== String(req.userId) ? parent.authorId : null,
      ...(uploaded ? { image: { url: uploaded.secure_url, publicId: uploaded.public_id, hash: incomingImageHash } } : {}) });
    if (parent) reconcileWallNotifications().catch(() => {});
    res.status(201).json({ content: (await serialize([item.toObject()], String(req.userId)))[0] });
  } catch (error) {
    if (error.code === 11000 && clientMutationId) {
      if (uploaded) await deleteMarketplaceImage(uploaded.public_id).catch(() => {});
      const existing = await WallContent.findOne({ authorId: String(req.userId), clientMutationId }).lean();
      if (existing) {
        const existingParent = existing.postId ? String(existing.postId) : '';
        const existingImageHash = existing.image?.hash || '';
        const existingCanonical = `${existingParent}:${String(existing.text || '').trim()}:${existingImageHash}`;
        const existingPayloadHash = existing.payloadHash || crypto.createHash('sha256').update(existingCanonical).digest('hex');

        if (existingPayloadHash !== payloadHash) {
          fail('MUTATION_KEY_CONFLICT', 409);
        }
        return res.status(200).json({
          reused: true,
          content: (await serialize([existing], String(req.userId)))[0]
        });
      }
    }
    if (uploaded) await deleteMarketplaceImage(uploaded.public_id).catch(() => {});
    throw error;
  }
}
router.post('/posts', upload, wrap(createContent));
router.post('/posts/:id/comments', upload, wrap(createContent));
router.put('/posts/:id/like', wrap(async (req, res) => {
  const post = await visible(req, req.params.id);
  if (post.postId) fail('INVALID_POST');
  if (typeof req.body.liked !== 'boolean') fail('INVALID_LIKE');
  const userId = String(req.userId);
  const postId = post._id;
  const filter = { postId, userId };

  // Server-managed compare-and-set revision model
  const existing = await WallLike.findOne(filter).lean();
  const currentVersion = existing?.version || 0;
  const targetLiked = req.body.liked;

  if (targetLiked) {
    if (!existing) {
      try {
        await WallLike.create({ userId, postId, version: 1 });
      } catch (err) {
        if (err.code === 11000) {
          // Record was inserted concurrently: update version
          await WallLike.updateOne(filter, { $inc: { version: 1 } });
        } else throw err;
      }
    } else {
      await WallLike.updateOne(filter, { $inc: { version: 1 } });
    }
  } else {
    if (existing) {
      // CAS deletion: delete only if version matches what we observed
      const deleted = await WallLike.deleteOne({ postId, userId, version: currentVersion });
      if (deleted.deletedCount === 0) {
        // Concurrent update occurred in the meantime; re-evaluate
        const latest = await WallLike.findOne(filter).lean();
        if (latest) {
          await WallLike.deleteOne({ postId, userId, version: latest.version });
        }
      }
    }
  }

  const finalRecord = await WallLike.findOne(filter).lean();
  res.json({ success: true, liked: !!finalRecord, version: finalRecord?.version || 0 });
}));
router.post('/posts/:id/gifts', wrap(async (req, res) => {
  const userId = String(req.userId);
  const attempt = req.get('Idempotency-Key');
  if (!/^[a-z\d_-]{16,100}$/i.test(attempt || '')) fail('INVALID_ATTEMPT');
  const key = `gift:${userId}:${attempt}`;
  const gift = (await wallGifts()).find(g => g.id === req.body.giftId);
  if (!gift) fail('INVALID_GIFT');
  const flag = gift.id === 'flag' ? String(req.body.flag || '').toUpperCase() : '';
  if (gift.id === 'flag' && !getSupportedCountryByCode(flag)) fail('INVALID_FLAG');
  const postId = id(req.params.id);
  const session = await mongoose.startSession();
  let reused = true;
  const checkRetry = entry => {
    if (String(entry.postId) !== postId || entry.giftId !== gift.id || entry.flag !== flag) fail('ATTEMPT_CONFLICT', 409);
  };
  try {
    await session.withTransaction(async () => {
      reused = true;
      const previous = await WallEntry.findOne({ key }).session(session);
      if (previous) { checkRetry(previous); return; }
      const post = await visible(req, postId, session);
      if (post.postId) fail('INVALID_POST');
      if (post.authorId === userId) fail('SELF_GIFT');

      const now = new Date();
      // Ensure lots are reconstructed from verified entries before debiting
      let wallet = await ensureWalletLotsReconstructed(userId, session, now);
      if (!wallet) fail('INSUFFICIENT_BALANCE', 409);

      // Deduct lots FIFO (earliest-expiring valid lots first), excluding expired
      if (Array.isArray(wallet.lots) && wallet.lots.length > 0) {
        let deduction;
        try {
          deduction = planLotDeduction(wallet.lots, gift.price, now);
        } catch (planError) {
          if (planError.message === 'INSUFFICIENT_BALANCE') fail('INSUFFICIENT_BALANCE', 409);
          throw planError;
        }

        // Record any lots discovered expired in ledger
        for (const exp of deduction.expiredLots) {
          const expKey = `expired:${userId}:${exp.lotId}`;
          if (!await WallEntry.exists({ key: expKey }).session(session)) {
            await WallEntry.create([{
              key: expKey,
              type: 'EXPIRED',
              userId,
              quantity: exp.quantity,
              lotId: exp.lotId,
              expiresAt: exp.expiresAt,
            }], { session });
          }
        }

        wallet.lots = deduction.updatedLots;
        wallet.balance = deduction.spendableAfter;
        await wallet.save({ session });
      } else {
        // Fallback for unmigrated legacy wallet
        const debit = await WallWallet.updateOne({ _id: userId, balance: { $gte: gift.price } }, { $inc: { balance: -gift.price } }, { session });
        if (!debit.modifiedCount) fail('INSUFFICIENT_BALANCE', 409);
      }

      await WallEntry.create([{ key, type: 'GIFT', userId, recipientId: post.authorId, postId, giftId: gift.id, flag, giftEmoji: gift.id === 'flag' ? [...flag].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : gift.emoji, quantity: gift.price }], { session });
      await WallWallet.updateOne({ _id: post.authorId }, { $inc: { receivedGifts: 1 } }, { upsert: true, session });
      reused = false;
    });
  } catch (error) {
    const previous = error.code === 11000 ? await WallEntry.findOne({ key }).lean() : null;
    if (!previous) throw error;
    reused = true;
    checkRetry(previous);
  } finally { await session.endSession(); }
  const entry = await WallEntry.findOne({ key }).lean();
  const sender = await User.findById(userId).select('fullName').lean().catch(() => null);
  const receipt = { eventId: String(entry._id), postId, id: gift.id, senderName: sender?.fullName || '',
    emoji: gift.id === 'flag' ? [...flag].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : gift.emoji };
  if (!reused) {
    emitToUser(entry.recipientId, 'wall:gift', receipt);
    reconcileWallNotifications().catch(() => {});
  }
  const currentWallet = await WallWallet.findById(userId).lean();
  const spendable = currentWallet ? getSpendableBalance(currentWallet, new Date()) : 0;
  res.json({ success: true, reused, receipt, balance: spendable });
}));
router.delete('/content/:id', wrap(async (req, res) => {
  const content = await WallContent.findById(id(req.params.id));
  if (!content || (content.authorId !== String(req.userId) && !staff(req))) fail('NOT_FOUND', 404);
  await WallContent.updateOne({ _id: content._id }, { $set: { deleted: true } });
  res.json({ success: true });
}));
router.post('/content/:id/report', wrap(async (req, res) => {
  const content = await visible(req, req.params.id);
  const reason = String(req.body.reason || '').trim();
  if (!reason || reason.length > 1000) fail('INVALID_REPORT');
  const filter = { userId: String(req.userId), contentId: content._id };
  const author = await User.findById(content.authorId).select('fullName').lean();
  let report;
  try {
    report = await WallReport.findOneAndUpdate(filter, { $setOnInsert: {
      ...filter, reason, reporterRole: req.userRole,
      postId: content.postId || content._id, contentType: content.postId ? 'COMMENT' : 'POST',
      snapshot: { authorId: content.authorId, authorName: author?.fullName || '', text: content.text || '', image: content.image?.url || null, createdAt: content.createdAt?.toISOString() || null },
    } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  } catch (error) {
    if (error.code !== 11000) throw error;
    report = await WallReport.findOne(filter).lean();
    if (!report) throw error;
  }
  try {
    const complaint = await deliverWallReport(report);
    res.json({ success: true, complaintId: complaint.id, ticketNumber: complaint.ticketNumber });
  } catch (error) {
    console.error('Wall report saved; complaint handoff pending:', error.name);
    res.status(202).json({ success: true, pending: true });
  }
}));
router.put('/blocks/:id', wrap(async (req, res) => {
  const blockedId = id(req.params.id);
  if (blockedId === String(req.userId)) fail('INVALID_BLOCK');
  const filter = { userId: String(req.userId), blockedId };
  if (req.body.blocked === true) await WallBlock.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
  else if (req.body.blocked === false) await WallBlock.deleteOne(filter);
  else fail('INVALID_BLOCK');
  res.json({ success: true });
}));
router.get('/blocks', wrap(async (req, res) => res.json({ blocks: await WallBlock.find({ userId: String(req.userId) }).lean() })));
router.get('/admin/reports', wrap(async (req, res) => {
  if (!staff(req)) fail('FORBIDDEN', 403);
  const reports = await WallReport.find().sort({ _id: -1 }).limit(100).lean();
  const contents = await WallContent.find({ _id: { $in: reports.map(r => r.contentId) } }).lean();
  res.json({ reports: reports.map(report => ({ ...report, content: contents.find(c => String(c._id) === String(report.contentId)) })) });
}));
router.put('/admin/content/:id', wrap(async (req, res) => {
  if (!staff(req)) fail('FORBIDDEN', 403);
  if (typeof req.body.hidden !== 'boolean') fail('INVALID_MODERATION');
  await WallContent.updateOne({ _id: id(req.params.id) }, { $set: { hidden: req.body.hidden } });
  res.json({ success: true });
}));
router.put('/admin/gifts', wrap(async (req, res) => {
  if (!staff(req)) fail('FORBIDDEN', 403);
  const gifts = await wallGifts();
  const prices = req.body.prices;
  if (!prices || Object.keys(prices).length !== gifts.length || gifts.some(g => !Number.isSafeInteger(prices[g.id]) || prices[g.id] < MIN_WALL_GIFT_PRICE || prices[g.id] > 1_000_000)) fail('INVALID_PRICES');
  await WallSettings.updateOne({ _id: 'gifts' }, { $set: { prices, pricingVersion: 3 } }, { upsert: true });
  res.json({ gifts: await wallGifts() });
}));
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (!error.status) console.error('Wall request failed:', error.name);
  res.status(error.status || 500).json({ code: error.status ? error.message : 'WALL_UNAVAILABLE' });
});
export default router;
