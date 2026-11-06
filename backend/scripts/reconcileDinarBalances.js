// backend/scripts/reconcileDinarBalances.js
// ============================================================
// READ-ONLY DRY-RUN RECONCILIATION REPORT FOR DINAR BALANCES
//
// Reconstructs legacy lots from verified purchase ledger entries ('PURCHASE')
// and completed payments, subtracting historical spending deterministically.
// Reports exact balances, lots, remaining quantities, and expiry dates without
// mutating production records.
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WallWallet, WallEntry } from '../src/models/Wall.js';
import { calculateOneMonthExpiry, planLotDeduction, getSpendableBalance } from '../src/utils/dinarExpiry.js';
import prisma from '../src/lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function dryRunReconciliation() {
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI/DATABASE_URL is not set.');
    process.exit(1);
  }

  console.log('Connecting to database in READ-ONLY mode...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const now = new Date();
  console.log(`\n============================================================`);
  console.log(`HOMELYSERV DINAR RECONCILIATION & DRY-RUN REPORT`);
  console.log(`Timestamp (UTC): ${now.toISOString()}`);
  console.log(`Mode: DRY-RUN (Zero mutations performed)`);
  console.log(`============================================================\n`);

  const db = mongoose.connection.db;
  const [wallets, entries, payments] = await Promise.all([
    WallWallet.find({}).lean(),
    WallEntry.find({}).lean(),
    db.collection('payments').find({ purpose: 'DINAR_PURCHASE' }).toArray(),
  ]);

  console.log(`Total Wall Wallets: ${wallets.length}`);
  console.log(`Total Wall Entries: ${entries.length}`);
  console.log(`Total DINAR_PURCHASE Payments: ${payments.length}`);

  const paymentsMap = new Map();
  payments.forEach(p => paymentsMap.set(String(p._id), p));

  console.log(`\n--- PAYMENT EVIDENCE BREAKDOWN ---`);
  payments.forEach(p => {
    const isCompleted = p.status === 'completed';
    const isVerifiedManual = p.manualReviewState === 'verified';
    const isCapturedPaypal = p.paymentMethod === 'paypal' && isCompleted;
    const isEligible = isCompleted && (isVerifiedManual || isCapturedPaypal || p.paymentMethod === 'vodafone_cash' || p.paymentMethod === 'instapay');
    console.log(`Payment ${p._id}: method=${p.paymentMethod}, status=${p.status}, manualReview=${p.manualReviewState || 'n/a'}, fulfillment=${p.fulfillmentStatus}, completedAt=${p.completedAt ? new Date(p.completedAt).toISOString() : 'n/a'}, eligibleForLot=${isEligible}`);
  });

  console.log(`\n--- WALLET RECONSTRUCTION REPORT ---`);
  let unmigratedCount = 0;
  let healthyLotCount = 0;
  let ambiguousCount = 0;

  for (const w of wallets) {
    const userId = String(w._id);
    const storedBalance = Number(w.balance) || 0;
    const userEntries = entries.filter(e => e.userId === userId || e.recipientId === userId);

    console.log(`\nUser: ${userId}`);
    console.log(`  Stored Balance: ${storedBalance} dinars | Received Gifts: ${w.receivedGifts || 0}`);
    console.log(`  Existing lots in document: ${Array.isArray(w.lots) && w.lots.length > 0 ? `${w.lots.length} lots` : 'None (Legacy)'}`);

    if (Array.isArray(w.lots) && w.lots.length > 0) {
      healthyLotCount++;
      const spendable = getSpendableBalance(w, now);
      console.log(`  Status: Modern lots active`);
      console.log(`  Active Spendable Balance: ${spendable} dinars`);
      w.lots.forEach(l => {
        console.log(`    - Lot ${l.lotId} [${l.type}]: remaining ${l.remainingQuantity}/${l.originalQuantity}, acquired: ${l.acquiredAt ? new Date(l.acquiredAt).toISOString() : 'n/a'}, expires: ${l.expiresAt ? new Date(l.expiresAt).toISOString() : 'Non-expiring'}`);
      });
      continue;
    }

    // Legacy Wallet Chronological Reconstruction
    unmigratedCount++;
    const events = [];

    for (const entry of userEntries) {
      if (entry.userId !== userId) continue;

      if (entry.type === 'PURCHASE') {
        const paymentId = entry.paymentId || (entry.key?.startsWith('purchase:') ? entry.key.slice('purchase:'.length) : null);
        const payment = paymentId ? paymentsMap.get(String(paymentId)) : null;

        // Authoritative timestamp: first completedAt, submittedAt, or payment createdAt, NEVER fulfillment retry entry.createdAt
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
          expiresAt: null,
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

    // Sort chronologically
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const activeLots = [];
    let hasDebitError = false;

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
        const availableLotsAtEvent = activeLots.filter(l => l.acquiredAt.getTime() <= evt.timestamp.getTime());
        try {
          const plan = planLotDeduction(availableLotsAtEvent, evt.quantity, evt.timestamp);
          for (const updated of plan.updatedLots) {
            const lot = activeLots.find(l => l.lotId === updated.lotId);
            if (lot) lot.remainingQuantity = updated.remainingQuantity;
          }
        } catch (err) {
          console.error(`  ERROR during historical debit application at ${evt.timestamp.toISOString()}: ${err.message}`);
          hasDebitError = true;
          break;
        }
      }
    }

    if (hasDebitError) {
      ambiguousCount++;
      continue;
    }

    const reconstructedSpendable = getSpendableBalance({ lots: activeLots, lotsMigrated: true }, now);
    const totalRemainingAllLots = activeLots.reduce((acc, l) => acc + l.remainingQuantity, 0);

    console.log(`  Reconstructed Lots:`);
    activeLots.forEach(l => {
      console.log(`    - Lot ${l.lotId} [${l.type}]: original ${l.originalQuantity}, remaining ${l.remainingQuantity}, acquired: ${l.acquiredAt.toISOString()}, expires: ${l.expiresAt ? l.expiresAt.toISOString() : 'Non-expiring'}`);
    });
    console.log(`  Spendable Balance at now: ${reconstructedSpendable} dinars | Total Remaining Across All Lots: ${totalRemainingAllLots} dinars`);

    const matchesStored = reconstructedSpendable === storedBalance || totalRemainingAllLots === storedBalance;
    console.log(`  Reconciliation outcome: ${matchesStored ? 'MATCH' : 'DISCREPANCY'}`);

    if (!matchesStored) {
      console.warn(`  ⚠️ AMBIGUITY WARNING: Reconstructed balance does not equal stored balance ${storedBalance}!`);
      ambiguousCount++;
    }
  }

  console.log(`\n============================================================`);
  console.log(`RECONCILIATION SUMMARY:`);
  console.log(`- Wallets with modern lots: ${healthyLotCount}`);
  console.log(`- Wallets cleanly reconstructible: ${unmigratedCount}`);
  console.log(`- Ambiguous / unresolvable wallets: ${ambiguousCount}`);
  console.log(`============================================================\n`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}

dryRunReconciliation().catch(err => {
  console.error('Reconciliation error:', err);
  process.exit(1);
});
