import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { fulfillDinarPayment } from '../src/services/wallService.js';
import { WallWallet, WallEntry } from '../src/models/Wall.js';
import { completePaymentTransaction } from '../src/routes/payment.js';
import prisma from '../src/lib/prisma.js';

// Test suite for DINAR_PURCHASE fulfillment:
// 1. A verified 100-dinar purchase credits exactly 100 dinars.
// 2. Retrying fulfillment does not credit twice.
// 3. Unverified / incomplete payments cannot credit a wallet.
// 4. Failed fulfillment can be retried successfully after the cause is resolved.

test('DINAR_PURCHASE fulfillment and retry verification', async (t) => {
  const userId = '507f1f77bcf86cd799439088';
  const paymentId = '507f1f77bcf86cd7994390aa';

  // In-memory data store for WallWallet and WallEntry
  const wallets = new Map();
  const entries = new Map();

  const origStartSession = mongoose.startSession;
  const origWalletUpdateOne = WallWallet.updateOne;
  const origWalletFindById = WallWallet.findById;
  const origEntryExists = WallEntry.exists;
  const origEntryCreate = WallEntry.create;
  const origPrismaPaymentUpdate = prisma.payment.update;
  const origPrismaPaymentUpdateMany = prisma.payment.updateMany;
  const origPrismaPaymentFindUnique = prisma.payment.findUnique;

  // Mock mock session with withTransaction
  mongoose.startSession = async () => ({
    withTransaction: async (fn) => fn(),
    endSession: async () => {}
  });

  WallWallet.updateOne = async (filter, update) => {
    const id = String(filter._id);
    const current = wallets.get(id) || { _id: id, balance: 0, receivedGifts: 0 };
    if (update.$inc?.balance) {
      current.balance += update.$inc.balance;
    }
    wallets.set(id, current);
    return { acknowledged: true, modifiedCount: 1 };
  };

  WallWallet.findById = (id) => ({
    lean: async () => wallets.get(String(id)) || null,
    then: (resolve) => resolve(wallets.get(String(id)) || null)
  });

  WallEntry.exists = (query) => ({
    session: () => Promise.resolve(entries.has(query.key) ? { _id: entries.get(query.key)._id } : null),
    then: (resolve) => resolve(entries.has(query.key) ? { _id: entries.get(query.key)._id } : null)
  });

  WallEntry.create = async (docs) => {
    for (const doc of docs) {
      if (entries.has(doc.key)) {
        const err = new Error('E11000 duplicate key');
        err.code = 11000;
        throw err;
      }
      entries.set(doc.key, { ...doc, _id: 'entry-' + Math.random() });
    }
    return docs;
  };

  let lastPrismaUpdate = null;
  prisma.payment.update = async ({ where, data }) => {
    lastPrismaUpdate = { where, data };
    return { id: where.id, ...data };
  };

  prisma.payment.updateMany = async () => ({ count: 1 });
  prisma.payment.findUnique = async ({ where }) => ({
    id: where.id,
    fulfillmentStatus: 'failed',
    status: 'completed',
    manualReviewState: 'verified',
    purpose: 'DINAR_PURCHASE',
    userId,
    amount: 10,
    currency: 'EGP',
    paymentMethod: 'instapay',
    metadata: { dinarQuantity: 100 }
  });

  t.after(() => {
    mongoose.startSession = origStartSession;
    WallWallet.updateOne = origWalletUpdateOne;
    WallWallet.findById = origWalletFindById;
    WallEntry.exists = origEntryExists;
    WallEntry.create = origEntryCreate;
    prisma.payment.update = origPrismaPaymentUpdate;
    prisma.payment.updateMany = origPrismaPaymentUpdateMany;
    prisma.payment.findUnique = origPrismaPaymentFindUnique;
  });

  await t.test('1. A verified 100-dinar purchase credits exactly 100 dinars and creates unique ledger entry', async () => {
    const payment = {
      id: paymentId,
      transactionId: 'TX-100',
      purpose: 'DINAR_PURCHASE',
      status: 'completed',
      userId,
      amount: 10,
      currency: 'EGP',
      metadata: { dinarQuantity: 100 }
    };

    await fulfillDinarPayment(payment);

    const wallet = await WallWallet.findById(userId);
    assert.equal(wallet.balance, 100, 'Wallet balance must be exactly 100 dinars');
    assert.equal(entries.size, 1, 'Exactly one ledger entry must be created');
    assert.ok(entries.has(`purchase:${paymentId}`), 'Ledger key must match purchase ID');
    const entry = entries.get(`purchase:${paymentId}`);
    assert.equal(entry.quantity, 100);
    assert.equal(entry.userId, userId);
    assert.equal(entry.type, 'PURCHASE');
  });

  await t.test('2. Retrying fulfillment does not credit twice (idempotency)', async () => {
    const payment = {
      id: paymentId,
      transactionId: 'TX-100',
      purpose: 'DINAR_PURCHASE',
      status: 'completed',
      userId,
      amount: 10,
      currency: 'EGP',
      metadata: { dinarQuantity: 100 }
    };

    // Retry 5 times
    await Promise.all(Array.from({ length: 5 }, () => fulfillDinarPayment(payment)));

    const wallet = await WallWallet.findById(userId);
    assert.equal(wallet.balance, 100, 'Wallet balance must still be exactly 100 dinars after retries');
    assert.equal(entries.size, 1, 'Only one ledger entry must exist');
  });

  await t.test('3. Unverified / pending payments cannot credit a wallet', async () => {
    const unverifiedPayment = {
      id: '507f1f77bcf86cd7994390bb',
      transactionId: 'TX-UNVERIFIED',
      purpose: 'DINAR_PURCHASE',
      status: 'pending', // NOT completed/verified
      userId: 'other-user',
      amount: 10,
      currency: 'EGP',
      metadata: { dinarQuantity: 100 }
    };

    await assert.rejects(
      () => fulfillDinarPayment(unverifiedPayment),
      /INVALID_DINAR_PAYMENT/,
      'Unverified / non-completed payments must be rejected'
    );
    assert.equal(wallets.get('other-user'), undefined, 'No wallet balance should be granted');
    assert.equal(entries.has('purchase:507f1f77bcf86cd7994390bb'), false, 'No ledger entry should be created');
  });

  await t.test('4. Failed fulfillment can be retried successfully after the cause is resolved', async () => {
    const retryPaymentId = '507f1f77bcf86cd7994390cc';
    const retryUserId = '507f1f77bcf86cd799439099';

    // Simulated payment object in DB as passed to completePaymentTransaction
    const payment = {
      id: retryPaymentId,
      transactionId: 'TX-RETRY-456',
      purpose: 'DINAR_PURCHASE',
      status: 'completed',
      manualReviewState: 'verified',
      userId: retryUserId,
      amount: 10,
      currency: 'EGP',
      paymentMethod: 'instapay',
      metadata: { dinarQuantity: 100 }
    };

    // Execute completePaymentTransaction
    const result = await completePaymentTransaction(payment, 'INSTAPAY-REF-123');

    assert.equal(result.fulfilled, true, 'completePaymentTransaction must succeed for DINAR_PURCHASE');
    assert.equal(result.error, null);

    const wallet = await WallWallet.findById(retryUserId);
    assert.equal(wallet.balance, 100, 'Wallet balance must be credited 100 dinars upon fulfillment retry');
    assert.equal(entries.has(`purchase:${retryPaymentId}`), true, 'Ledger entry must be present');

    assert.equal(lastPrismaUpdate.where.id, retryPaymentId);
    assert.equal(lastPrismaUpdate.data.fulfillmentStatus, 'fulfilled');
    assert.equal(lastPrismaUpdate.data.fulfillmentError, null);
  });
});

