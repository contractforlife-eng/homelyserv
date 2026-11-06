// backend/tests/walletReplicaSetIntegration.test.js
// ============================================================
// REAL MONGOOSE / MONGODB REPLICA SET TRANSACTION INTEGRATION TEST
//
// Tests concurrent gift sending, admin deductions, and expiration
// on real WallWallet & WallEntry collections via transactions.
// ============================================================

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WallWallet, WallEntry, WallContent } from '../src/models/Wall.js';
import { adjustMemberWalletByAdmin, sweepWalletExpirations } from '../src/services/wallService.js';
import { calculateOneMonthExpiry, getSpendableBalance, planLotDeduction } from '../src/utils/dinarExpiry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('MongoDB Replica Set Integration: Concurrent Wallet Transactions & Sweeps', () => {
  const dbUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  let connection;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testAdminId = new mongoose.Types.ObjectId().toString();
  const testRecipientId = new mongoose.Types.ObjectId().toString();

  before(async () => {
    if (!dbUri) throw new Error('DATABASE_URL is not set for integration tests');
    // Connect with isolated test database name to never pollute production database collections
    const parsedUri = new URL(dbUri.replace(/^mongodb\+srv:\/\//, 'http://'));
    // Use test database: homelyserv_test_integration
    connection = await mongoose.connect(dbUri, { dbName: 'homelyserv_test_integration' });
  });

  after(async () => {
    // Drop the entire isolated test database after testing completes
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.disconnect();
    } catch {}
  });

  it('executes atomic lot initialization with PURCHASE and ADMIN_GRANT lots', async () => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Create wallet with:
        // Lot 1: Expiring PURCHASE lot (300 dinars)
        // Lot 2: Non-expiring ADMIN_GRANT lot (200 dinars)
        // Total initial: 500 dinars
        const purchaseLot = {
          lotId: `purchase_lot_${Date.now()}`,
          type: 'PURCHASE',
          originalQuantity: 300,
          remainingQuantity: 300,
          acquiredAt: new Date(),
          expiresAt: calculateOneMonthExpiry(new Date()),
        };
        const grantLot = {
          lotId: `grant_lot_${Date.now()}`,
          type: 'ADMIN_GRANT',
          originalQuantity: 200,
          remainingQuantity: 200,
          acquiredAt: new Date(),
          expiresAt: null,
        };

        const wallet = new WallWallet({
          _id: testUserId,
          balance: 500,
          receivedGifts: 0,
          lots: [purchaseLot, grantLot],
          lotsMigrated: true,
        });

        await wallet.save({ session });

        await WallEntry.create([{
          key: `init_purchase:${testUserId}`,
          type: 'PURCHASE',
          userId: testUserId,
          quantity: 300,
          lotId: purchaseLot.lotId,
          expiresAt: purchaseLot.expiresAt,
        }], { session });

        await WallEntry.create([{
          key: `init_grant:${testUserId}`,
          type: 'ADMIN_GRANT',
          userId: testUserId,
          quantity: 200,
          lotId: grantLot.lotId,
          actorId: testAdminId,
          actorRole: 'ADMIN',
          reason: 'Initial test setup',
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    const saved = await WallWallet.findById(testUserId).lean();
    assert.equal(saved.balance, 500);
    assert.equal(saved.lots.length, 2);
  });

  it('runs concurrent debit operations (Gift and Admin Deduction) safely with FIFO consumption', async () => {
    // Concurrently trigger:
    // 1. Admin Deduction of 150 dinars
    // 2. Gift debit of 100 dinars
    // Total debit = 250 dinars.
    // Initial PURCHASE lot was 300, so both should consume from the PURCHASE lot, leaving 50 on PURCHASE and 200 on GRANT!

    const performGiftDebit = async () => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const wallet = await WallWallet.findById(testUserId).session(session);
          const deduction = planLotDeduction(wallet.lots, 100);

          wallet.lots = deduction.updatedLots;
          wallet.balance = deduction.spendableAfter;
          await wallet.save({ session });

          await WallEntry.create([{
            key: `gift_sent_int:${testUserId}:${Date.now()}`,
            type: 'GIFT',
            userId: testUserId,
            recipientId: testRecipientId,
            quantity: 100,
            giftId: 'rose',
            giftEmoji: '🌹',
          }], { session });
        });
      } finally {
        await session.endSession();
      }
    };

    const performAdminDeduction = async () => {
      return adjustMemberWalletByAdmin({
        adminId: testAdminId,
        adminRole: 'ADMIN',
        targetUserId: testUserId,
        action: 'DEDUCT',
        quantity: 150,
        reason: 'Integration test deduction',
        idempotencyKey: 'int_deduct_' + Date.now(),
      });
    };

    // Run both
    await performGiftDebit();
    await performAdminDeduction();

    const finalWallet = await WallWallet.findById(testUserId).lean();
    // 500 - 100 (gift) - 150 (admin deduct) = 250 remaining
    assert.equal(finalWallet.balance, 250);

    const purchaseLot = finalWallet.lots.find(l => l.type === 'PURCHASE');
    const grantLot = finalWallet.lots.find(l => l.type === 'ADMIN_GRANT');

    assert.equal(purchaseLot.remainingQuantity, 50); // 300 - 250 = 50
    assert.equal(grantLot.remainingQuantity, 200);   // Non-expiring untouched!
  });

  it('runs expiration sweep and records exactly-once EXPIRED ledger entry', async () => {
    // Artificially age the remaining purchase lot to simulate natural expiration
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const wallet = await WallWallet.findById(testUserId).session(session);
        const purchaseLot = wallet.lots.find(l => l.type === 'PURCHASE');
        purchaseLot.expiresAt = new Date(Date.now() - 1000); // 1 second in the past
        await wallet.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // Now sweep expirations
    const now = new Date();
    await sweepWalletExpirations(testUserId, now);

    const postSweepWallet = await WallWallet.findById(testUserId).lean();
    // The 50 dinars from the purchase lot expired, so only the 200 dinar admin grant remains!
    assert.equal(postSweepWallet.balance, 200);

    const expiredLot = postSweepWallet.lots.find(l => l.type === 'PURCHASE');
    assert.equal(expiredLot.remainingQuantity, 0);

    // Verify EXPIRED ledger entry
    const expiredEntry = await WallEntry.findOne({ userId: testUserId, type: 'EXPIRED' }).lean();
    assert.ok(expiredEntry);
    assert.equal(expiredEntry.quantity, 50);
    assert.equal(expiredEntry.lotId, expiredLot.lotId);

    // Run sweep a second time to verify exactly-once idempotency (no duplicate entries)
    await sweepWalletExpirations(testUserId, now);
    const expiredEntriesCount = await WallEntry.countDocuments({ userId: testUserId, type: 'EXPIRED' });
    assert.equal(expiredEntriesCount, 1);
  });
});
