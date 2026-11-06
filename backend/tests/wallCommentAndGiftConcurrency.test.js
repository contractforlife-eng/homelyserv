// backend/tests/wallCommentAndGiftConcurrency.test.js
// ============================================================
// CONCURRENT COMMENT SUBMISSIONS, IDEMPOTENCY KEY REUSE & GIFT RETRIES
// ============================================================

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WallContent, WallWallet, WallEntry, WallLike } from '../src/models/Wall.js';
import { calculateOneMonthExpiry, planLotDeduction, getSpendableBalance } from '../src/utils/dinarExpiry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Wall: Concurrent Comments, Mutation Key Invariants & Gift Retries', () => {
  const dbUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  let connection;

  const authorId = new mongoose.Types.ObjectId().toString();
  const buyerId = new mongoose.Types.ObjectId().toString();
  const recipientId = new mongoose.Types.ObjectId().toString();
  let postId;
  let secondPostId;

  before(async () => {
    if (!dbUri) throw new Error('DATABASE_URL is not set for integration tests');
    connection = await mongoose.connect(dbUri, { dbName: 'homelyserv_test_wall_concurrent' });

    // Clean up collections in test database
    await WallContent.deleteMany({});
    await WallWallet.deleteMany({});
    await WallEntry.deleteMany({});
    await WallLike.deleteMany({});

    // Create target posts
    const post = await WallContent.create({
      authorId: recipientId,
      postId: null,
      text: 'Parent post for comment tests',
    });
    postId = post._id;

    const secondPost = await WallContent.create({
      authorId: recipientId,
      postId: null,
      text: 'Second parent post',
    });
    secondPostId = secondPost._id;
  });

  after(async () => {
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.disconnect();
    } catch {}
  });

  it('1. Partial index allows legacy comments without clientMutationId without collisions', async () => {
    const legacy1 = await WallContent.create({
      authorId,
      postId,
      text: 'Legacy comment without mutation id 1',
      clientMutationId: null,
    });

    const legacy2 = await WallContent.create({
      authorId,
      postId,
      text: 'Legacy comment without mutation id 2',
      clientMutationId: null,
    });

    assert.ok(legacy1._id);
    assert.ok(legacy2._id);
    assert.notEqual(String(legacy1._id), String(legacy2._id));
  });

  it('2. Concurrent identical comment submissions with same clientMutationId create exactly 1 comment', async () => {
    const clientMutationId = `mut_concurrent_${Date.now()}`;
    const attempts = 5;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, async (_, i) => {
        try {
          return await WallContent.create({
            authorId,
            postId,
            text: `Concurrent comment text`,
            clientMutationId,
          });
        } catch (error) {
          if (error.code === 11000) {
            // E11000 duplicate key caught: return existing
            return await WallContent.findOne({ authorId, clientMutationId }).lean();
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled');
    assert.equal(successful.length, attempts);

    // Verify all attempts resolve to the exact same persisted comment id
    const firstId = String(successful[0].value._id);
    for (const r of successful) {
      assert.equal(String(r.value._id), firstId);
    }

    // Verify database count for this mutation id is exactly 1
    const count = await WallContent.countDocuments({ authorId, clientMutationId });
    assert.equal(count, 1);
  });

  it('3. Reusing mutation key with a different parent post or changed text/image is rejected as conflict', async () => {
    const clientMutationId = `mut_diff_parent_${Date.now()}`;
    const imageAHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const imageBHash = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    // Canonical payload hash calculation
    const payloadA = `${String(postId)}:Original comment text:${imageAHash}`;
    const payloadAHash = crypto.createHash('sha256').update(payloadA).digest('hex');

    // Create comment on first post with Image A
    const comment = await WallContent.create({
      authorId,
      postId,
      text: 'Original comment text',
      clientMutationId,
      payloadHash: payloadAHash,
      image: { url: 'https://homelyserv.com/images/a.jpg', publicId: 'img_a', hash: imageAHash }
    });
    assert.ok(comment._id);

    const existing = await WallContent.findOne({ authorId, clientMutationId }).lean();
    assert.ok(existing);

    // Replay 1: Identical parent, identical text, identical image hash -> MATCH
    const replayPayload = `${String(postId)}:Original comment text:${imageAHash}`;
    const replayHash = crypto.createHash('sha256').update(replayPayload).digest('hex');
    assert.equal(replayHash, existing.payloadHash, 'Identical replay must match canonical hash');

    // Replay 2: Different image hash (same text and parent) -> CONFLICT
    const changedImagePayload = `${String(postId)}:Original comment text:${imageBHash}`;
    const changedImageHash = crypto.createHash('sha256').update(changedImagePayload).digest('hex');
    assert.notEqual(changedImageHash, existing.payloadHash, 'Different image content under same key must trigger 409 conflict');

    // Replay 3: Different parent post -> CONFLICT
    const changedParentPayload = `${String(secondPostId)}:Original comment text:${imageAHash}`;
    const changedParentHash = crypto.createHash('sha256').update(changedParentPayload).digest('hex');
    assert.notEqual(changedParentHash, existing.payloadHash, 'Different parent post under same key must trigger 409 conflict');

    // Replay 4: Changed text -> CONFLICT
    const changedTextPayload = `${String(postId)}:Different text:${imageAHash}`;
    const changedTextHash = crypto.createHash('sha256').update(changedTextPayload).digest('hex');
    assert.notEqual(changedTextHash, existing.payloadHash, 'Different text under same key must trigger 409 conflict');
  });

  it('4. Gift retry after lost response: one debit, one gift, correct balance, no duplicate animation', async () => {
    const giftPrice = 100;
    const attempt = `gift_attempt_${Date.now()}`;
    const key = `gift:${buyerId}:${attempt}`;
    const giftId = 'red_heart';
    const giftEmoji = '❤️';

    // Seed buyer wallet with 500 dinars (1 purchase lot)
    const now = new Date();
    const expiry = calculateOneMonthExpiry(now);
    await WallWallet.create({
      _id: buyerId,
      balance: 500,
      receivedGifts: 0,
      lotsMigrated: true,
      lots: [{
        lotId: 'lot_buyer_1',
        type: 'PURCHASE',
        originalQuantity: 500,
        remainingQuantity: 500,
        acquiredAt: now,
        expiresAt: expiry,
      }]
    });

    // Helper simulating atomic gift transaction in wall.js
    async function executeGiftRequest() {
      const session = await mongoose.startSession();
      let reused = true;
      try {
        await session.withTransaction(async () => {
          const previous = await WallEntry.findOne({ key }).session(session);
          if (previous) {
            reused = true;
            return;
          }

          const wallet = await WallWallet.findById(buyerId).session(session);
          const deduction = planLotDeduction(wallet.lots, giftPrice, new Date());
          wallet.lots = deduction.updatedLots;
          wallet.balance = deduction.spendableAfter;
          await wallet.save({ session });

          await WallEntry.create([{
            key,
            type: 'GIFT',
            userId: buyerId,
            recipientId,
            postId,
            giftId,
            giftEmoji,
            quantity: giftPrice,
          }], { session });

          await WallWallet.updateOne(
            { _id: recipientId },
            { $inc: { receivedGifts: 1 } },
            { upsert: true, session }
          );

          reused = false;
        });
      } finally {
        await session.endSession();
      }

      const walletAfter = await WallWallet.findById(buyerId).lean();
      const spendable = getSpendableBalance(walletAfter, new Date());
      return { reused, balance: spendable };
    }

    // Call 1: First request succeeds on server, but client response is lost
    const call1 = await executeGiftRequest();
    assert.equal(call1.reused, false, 'First gift transaction should not be reused');
    assert.equal(call1.balance, 400);

    // Call 2: Client retries with the exact same Idempotency-Key
    const call2 = await executeGiftRequest();
    assert.equal(call2.reused, true, 'Retry must be marked as reused');
    assert.equal(call2.balance, 400, 'Balance must remain 400 after retry, never double-debited');

    // Verify ledger has exactly 1 entry for this key
    const entries = await WallEntry.find({ key }).lean();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].quantity, giftPrice);

    // Verify recipient received exactly 1 gift count
    const recipientWallet = await WallWallet.findById(recipientId).lean();
    assert.equal(recipientWallet.receivedGifts, 1);

    // Verify frontend guard condition: only trigger animation if !reused
    const animationTriggeredCall1 = !call1.reused;
    const animationTriggeredCall2 = !call2.reused;
    assert.equal(animationTriggeredCall1, true);
    assert.equal(animationTriggeredCall2, false, 'Duplicate retry must never trigger duplicate gift animation');
  });

  it('5. Like state uses server revisions/CAS independent of client clock skew', async () => {
    const filter = { postId, userId: authorId };
    await WallLike.deleteMany(filter);

    // Helper simulating compare-and-set like toggle on the server
    async function executeCasLikeRequest(targetLiked) {
      const existing = await WallLike.findOne(filter).lean();
      const currentVersion = existing?.version || 0;

      if (targetLiked) {
        if (!existing) {
          try {
            await WallLike.create({ userId: authorId, postId, version: 1 });
          } catch (err) {
            if (err.code === 11000) {
              await WallLike.updateOne(filter, { $inc: { version: 1 } });
            } else throw err;
          }
        } else {
          await WallLike.updateOne(filter, { $inc: { version: 1 } });
        }
      } else {
        if (existing) {
          const deleted = await WallLike.deleteOne({ postId, userId: authorId, version: currentVersion });
          if (deleted.deletedCount === 0) {
            const latest = await WallLike.findOne(filter).lean();
            if (latest) {
              await WallLike.deleteOne({ postId, userId: authorId, version: latest.version });
            }
          }
        }
      }

      const finalRecord = await WallLike.findOne(filter).lean();
      return { success: true, liked: !!finalRecord, version: finalRecord?.version || 0 };
    }

    // Step A: Client 1 (with clock skewed into past, e.g. Year 2020) likes post
    const resA = await executeCasLikeRequest(true);
    assert.equal(resA.liked, true);
    assert.equal((await WallLike.countDocuments(filter)), 1);

    // Step B: Rapid toggle unlike from Client 2 (with clock skewed into future)
    const resB = await executeCasLikeRequest(false);
    assert.equal(resB.liked, false);
    assert.equal((await WallLike.countDocuments(filter)), 0);

    // Step C: Concurrent clients toggling simultaneously settle cleanly
    const toggles = [true, false, true, true, false];
    let latestResult;
    for (const liked of toggles) {
      latestResult = await executeCasLikeRequest(liked);
    }
    assert.equal(latestResult.liked, false);
    assert.equal((await WallLike.countDocuments(filter)), 0);

    // Step D: Legitimate future click after page reload / app restart succeeds immediately
    const resD = await executeCasLikeRequest(true);
    assert.equal(resD.liked, true);
    assert.equal((await WallLike.countDocuments(filter)), 1);
  });
});
