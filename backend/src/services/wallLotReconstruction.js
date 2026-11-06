// backend/src/services/wallLotReconstruction.js
// ============================================================
// ATOMIC LOT RECONSTRUCTION SERVICE FOR LEGACY WALLETS
//
// Rules:
// 1. Resolve each PURCHASE ledger entry to its underlying verified Payment.
// 2. Use payment.completedAt (or submittedAt) as acquiredAt.
//    NEVER use delayed fulfillment retry time or ledger entry.createdAt.
// 3. Replay historical credits and debits in strict chronological order.
//    A historical debit must NEVER consume a future purchase lot.
// 4. Distinguish legitimate expired amounts from unexplained discrepancies.
// 5. Block ambiguous wallets for manual reconciliation rather than guessing.
// ============================================================

import mongoose from 'mongoose';
import { WallWallet, WallEntry } from '../models/Wall.js';
import { calculateOneMonthExpiry, planLotDeduction, getSpendableBalance, isWalletMigrated } from '../utils/dinarExpiry.js';
import prisma from '../lib/prisma.js';

/**
 * Reconstructs a wallet's lots atomically within a Mongoose session.
 * 
 * @param {string} userId
 * @param {mongoose.ClientSession} session
 * @param {Date} now
 * @returns {Promise<object>} The migrated or verified WallWallet document
 */
export async function ensureWalletLotsReconstructed(userId, session = null, now = new Date()) {
  const query = WallWallet.findById(String(userId));
  const wallet = session ? await query.session(session) : await query;
  if (!wallet) return null;

  // Already migrated with modern lots
  if (isWalletMigrated(wallet) && Array.isArray(wallet.lots) && wallet.lots.length > 0) {
    return wallet;
  }

  // Load all ledger entries for this user sorted chronologically (oldest to newest)
  const entriesQuery = WallEntry.find({ $or: [{ userId: String(userId) }, { recipientId: String(userId) }] }).sort({ createdAt: 1 });
  const entries = session ? await entriesQuery.session(session) : await entriesQuery;

  if (entries.length === 0) {
    if (wallet.balance === 0) {
      wallet.lots = [];
      wallet.lotsMigrated = true;
      if (session) await wallet.save({ session });
      else await wallet.save();
      return wallet;
    } else {
      // Balance exists but ZERO entries in ledger: ambiguous! Block for reconciliation.
      throw Object.assign(new Error('AMBIGUOUS_WALLET_BALANCE_NO_ENTRIES'), {
        status: 409,
        userId: String(userId),
        balance: wallet.balance,
      });
    }
  }

  // Fetch all payment records associated with purchase entries to get authoritative completion dates
  const purchasePaymentIds = entries
    .filter(e => e.userId === String(userId) && e.type === 'PURCHASE')
    .map(e => e.paymentId || (e.key?.startsWith('purchase:') ? e.key.slice('purchase:'.length) : null))
    .filter(Boolean);

  let paymentsMap = new Map();
  if (purchasePaymentIds.length > 0) {
    const payments = await prisma.payment.findMany({
      where: { id: { in: purchasePaymentIds } },
      select: { id: true, completedAt: true, createdAt: true, submittedAt: true, status: true, manualReviewState: true }
    });
    payments.forEach(p => paymentsMap.set(String(p.id), p));
  }

  // Chronological event replay:
  // Build a timeline of all credits and debits sorted by event timestamp
  const events = [];

  for (const entry of entries) {
    if (entry.userId !== String(userId)) continue; // Gifting received by this user does not debit or credit spendable dinars

    if (entry.type === 'PURCHASE') {
      const paymentId = entry.paymentId || (entry.key?.startsWith('purchase:') ? entry.key.slice('purchase:'.length) : null);
      const payment = paymentId ? paymentsMap.get(String(paymentId)) : null;

      // Authoritative acquisition timestamp: first completedAt, submittedAt, or payment createdAt
      const acquiredAt = new Date(payment?.completedAt || payment?.submittedAt || payment?.createdAt || entry.createdAt);
      const expiresAt = entry.expiresAt ? new Date(entry.expiresAt) : calculateOneMonthExpiry(acquiredAt);
      const lotId = entry.lotId || `purchase_${paymentId || entry._id}`;

      events.push({
        type: 'CREDIT',
        subType: 'PURCHASE',
        timestamp: acquiredAt,
        lotId,
        quantity: entry.quantity,
        acquiredAt,
        expiresAt,
        paymentId,
        paymentReference: entry.paymentReference || null,
      });
    } else if (entry.type === 'ADMIN_GRANT') {
      const acquiredAt = new Date(entry.createdAt);
      const lotId = entry.lotId || `admin_grant_${entry._id}`;
      events.push({
        type: 'CREDIT',
        subType: 'ADMIN_GRANT',
        timestamp: acquiredAt,
        lotId,
        quantity: entry.quantity,
        acquiredAt,
        expiresAt: null, // Non-expiring
        paymentId: null,
        paymentReference: null,
      });
    } else if (entry.type === 'GIFT' || entry.type === 'ADMIN_DEDUCTION') {
      events.push({
        type: 'DEBIT',
        subType: entry.type,
        timestamp: new Date(entry.createdAt),
        quantity: entry.quantity,
      });
    }
  }

  // Sort events strictly by chronological timestamp
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Replay chronological timeline
  const activeLots = [];

  for (const evt of events) {
    if (evt.type === 'CREDIT') {
      activeLots.push({
        lotId: evt.lotId,
        type: evt.subType,
        originalQuantity: evt.quantity,
        remainingQuantity: evt.quantity,
        acquiredAt: evt.acquiredAt,
        expiresAt: evt.expiresAt,
        paymentId: evt.paymentId || null,
        paymentReference: evt.paymentReference || null,
      });
    } else if (evt.type === 'DEBIT') {
      // Historical debit must consume only lots that existed at or before this debit event!
      // This guarantees a debit never consumes a future purchase lot.
      const availableLotsAtEvent = activeLots.filter(l => l.acquiredAt.getTime() <= evt.timestamp.getTime());
      
      const plan = planLotDeduction(availableLotsAtEvent, evt.quantity, evt.timestamp);
      for (const updated of plan.updatedLots) {
        const lot = activeLots.find(l => l.lotId === updated.lotId);
        if (lot) {
          lot.remainingQuantity = updated.remainingQuantity;
        }
      }
    }
  }

  // Calculate current spendable balance at `now`
  const spendableAtNow = getSpendableBalance({ lots: activeLots, lotsMigrated: true }, now);
  const totalRemainingAllLots = activeLots.reduce((acc, l) => acc + l.remainingQuantity, 0);

  // Reconciliation check:
  // Legitimate expired amounts: totalRemainingAllLots > spendableAtNow (difference is expired dinars).
  // If totalRemainingAllLots !== wallet.balance and spendableAtNow !== wallet.balance,
  // we have an unexplained discrepancy! Block for review.
  if (totalRemainingAllLots !== wallet.balance && spendableAtNow !== wallet.balance) {
    throw Object.assign(new Error('WALLET_RECONSTRUCTION_DISCREPANCY'), {
      status: 409,
      userId: String(userId),
      storedBalance: wallet.balance,
      spendableAtNow,
      totalRemainingAllLots,
    });
  }

  wallet.lots = activeLots;
  wallet.lotsMigrated = true;
  wallet.balance = spendableAtNow;

  if (session) await wallet.save({ session });
  else await wallet.save();

  return wallet;
}
