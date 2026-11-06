import mongoose from 'mongoose';
import { WallWallet, WallEntry, WallSettings } from '../models/Wall.js';
import { DEFAULT_WALL_GIFTS, MIN_WALL_GIFT_PRICE, dinarPurchase } from '../config/wall.js';
import { calculateOneMonthExpiry, planLotDeduction, getSpendableBalance, getUpcomingExpiringLots, sweepExpiredLots } from '../utils/dinarExpiry.js';
import { createNotification, NOTIFICATION_TYPES } from './notificationService.js';
import { ensureWalletLotsReconstructed } from './wallLotReconstruction.js';

export async function wallGifts() {
  const settings = await WallSettings.findById('gifts').lean();
  return DEFAULT_WALL_GIFTS.map(gift => ({ ...gift, price: Math.max(MIN_WALL_GIFT_PRICE, (settings?.pricingVersion === 3 ? settings?.prices?.[gift.id] : null) ?? gift.price) }));
}

/**
 * Fulfills a completed DINAR_PURCHASE payment.
 * Creates an expiring lot with 1-calendar-month validity calculated from payment completion date in UTC.
 * Retries of delayed fulfillment use payment.completedAt (or createdAt) and NEVER extend the expiry window.
 */
export async function fulfillDinarPayment(payment) {
  if (payment?.purpose !== 'DINAR_PURCHASE' || payment.status !== 'completed' || !payment.userId) throw new Error('INVALID_DINAR_PAYMENT');
  const { quantity, amount } = dinarPurchase(payment.metadata?.dinarQuantity);
  const currency = payment.paymentMethod === 'bank_transfer' ? payment.metadata?.canonicalCurrency : payment.currency;
  const paidAmount = payment.paymentMethod === 'bank_transfer' ? payment.metadata?.canonicalAmount : payment.amount;
  if (currency !== 'EGP' || Number(paidAmount) !== amount) throw new Error('INVALID_DINAR_AMOUNT');

  const key = `purchase:${payment.id}`;
  // Anchor validity start to when payment first completed (or submitted/created)
  const acquiredAt = new Date(payment.completedAt || payment.updatedAt || payment.createdAt || Date.now());
  const expiresAt = calculateOneMonthExpiry(acquiredAt);
  const lotId = `purchase_${payment.id}`;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await WallEntry.exists({ key }).session(session)) return;

      // Ensure any legacy unmigrated wallet is reconstructed from verified history atomically
      await ensureWalletLotsReconstructed(payment.userId, session, acquiredAt);

      const query = WallWallet.findById(String(payment.userId));
      const wallet = typeof query.session === 'function' ? await query.session(session) : await query;
      const existingLots = wallet?.lots || [];

      // Create new PURCHASE lot
      // If purchase has already expired (acquiredAt + 1 month <= now),
      // the lot is created with remainingQuantity = 0 and recorded as EXPIRED immediately.
      const isExpiredOnArrival = expiresAt.getTime() <= Date.now();
      const newLot = {
        lotId,
        type: 'PURCHASE',
        originalQuantity: quantity,
        remainingQuantity: isExpiredOnArrival ? 0 : quantity,
        acquiredAt,
        expiresAt,
        paymentId: payment.id,
        paymentReference: payment.metadata?.reference || payment.transactionId || null,
      };

      const updatedLots = [...existingLots, newLot];
      const spendable = getSpendableBalance({ lots: updatedLots, lotsMigrated: true });

      await WallEntry.create([{
        key,
        type: 'PURCHASE',
        userId: String(payment.userId),
        quantity,
        paymentId: payment.id,
        paymentReference: newLot.paymentReference,
        lotId,
        expiresAt,
      }], { session });

      if (isExpiredOnArrival) {
        const expKey = `expired:${payment.userId}:${lotId}`;
        if (!await WallEntry.exists({ key: expKey }).session(session)) {
          await WallEntry.create([{
            key: expKey,
            type: 'EXPIRED',
            userId: String(payment.userId),
            quantity,
            lotId,
            expiresAt,
          }], { session });
        }
      }

      await WallWallet.updateOne(
        { _id: String(payment.userId) },
        {
          $set: {
            lots: updatedLots,
            lotsMigrated: true,
            balance: spendable,
          },
        },
        { session, upsert: true }
      );
    });
  } catch (error) {
    if (error.code !== 11000 || !await WallEntry.exists({ key, userId: String(payment.userId) })) throw error;
  } finally { await session.endSession(); }
}

/**
 * Returns wallet information with current spendable balance and lot details.
 * Also cleans up expired lots lazily in the background if expired remainder is found.
 */
export async function getMemberWallWallet(userId, now = new Date()) {
  const wallet = await WallWallet.findById(String(userId)).lean();
  const spendable = getSpendableBalance(wallet, now);
  const upcomingExpiring = getUpcomingExpiringLots(wallet, now);

  // If wallet has expired lots that haven't been zeroed/recorded yet, trigger background sweep
  if (wallet?.lots && Array.isArray(wallet.lots)) {
    const sweep = sweepExpiredLots(wallet.lots, now);
    if (sweep.hasExpiredLots) {
      sweepWalletExpirations(userId, now).catch(err => console.error('[SWEEP_EXPIRY_ERROR]', err));
    }
  }

  return {
    userId: String(userId),
    balance: spendable,
    rawBalance: wallet?.balance || 0,
    receivedGifts: wallet?.receivedGifts || 0,
    lots: wallet?.lots || [],
    upcomingExpiring,
  };
}

/**
 * Sweeps a specific wallet for expired lots, zeroing them out and logging exactly-once EXPIRED ledger entries.
 */
export async function sweepWalletExpirations(userId, now = new Date()) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const wallet = await WallWallet.findById(String(userId)).session(session);
      if (!wallet || !Array.isArray(wallet.lots) || wallet.lots.length === 0) return;

      const sweep = sweepExpiredLots(wallet.lots, now);
      if (!sweep.hasExpiredLots) return;

      for (const exp of sweep.expiredLots) {
        const expKey = `expired:${userId}:${exp.lotId}`;
        if (!await WallEntry.exists({ key: expKey }).session(session)) {
          await WallEntry.create([{
            key: expKey,
            type: 'EXPIRED',
            userId: String(userId),
            quantity: exp.quantity,
            lotId: exp.lotId,
            expiresAt: exp.expiresAt,
          }], { session });
        }
      }

      wallet.lots = sweep.updatedLots;
      wallet.balance = sweep.spendableAfter;
      wallet.lotsMigrated = true;
      await wallet.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Sweeps all wallets across the entire system for expired lots.
 * Includes both modern lot wallets AND legacy unmigrated wallets by reconstructing them first.
 * Safe for cron/scheduled jobs or ad-hoc runs.
 */
export async function sweepAllExpiredWallets(now = new Date()) {
  // 1. Find all unmigrated wallets (lotsMigrated: false or lots missing)
  const legacyWallets = await WallWallet.find({
    $or: [{ lotsMigrated: false }, { lots: { $size: 0 } }]
  }).select('_id').lean();

  for (const lw of legacyWallets) {
    try {
      await ensureWalletLotsReconstructed(lw._id, null, now);
    } catch (err) {
      console.warn(`[WALL_SWEEP_LEGACY_SKIP] Wallet ${lw._id} flagged for review: ${err.message}`);
    }
  }

  // 2. Find all wallets containing expired positive lots
  const wallets = await WallWallet.find({
    lots: { $elemMatch: { remainingQuantity: { $gt: 0 }, expiresAt: { $lte: now } } }
  }).select('_id').lean();

  const results = [];
  for (const w of wallets) {
    try {
      await sweepWalletExpirations(w._id, now);
      results.push({ userId: w._id, status: 'swept' });
    } catch (err) {
      results.push({ userId: w._id, status: 'error', error: err.message });
    }
  }
  return results;
}

/**
 * Co-Admin Wallet Adjustment (GRANT or DEDUCT).
 * 
 * Requirements:
 * - Acting user must have Co-Admin authorization (role ADMIN).
 * - Target member can be any registered account role.
 * - Quantity must be a safe positive integer.
 * - Reason is mandatory (3 - 500 characters).
 * - Idempotency key required.
 * - Atomic transaction recording WallWallet lots and immutable WallEntry ledger.
 * - Manual grants are non-expiring (expiresAt: null).
 * - Deductions consume lots FIFO: earliest expiring PURCHASE lots first, then non-expiring ADMIN_GRANT lots.
 * - Deduction can NEVER make spendable balance negative.
 * - Manual adjustments are NOT payments or revenue: they must NEVER modify gift counts, crowns, or Premium.
 * - Sends localized member notification.
 */
export async function adjustMemberWalletByAdmin({
  adminId,
  adminRole,
  targetUserId,
  action, // 'GRANT' | 'DEDUCT'
  quantity,
  reason,
  idempotencyKey,
  now = new Date(),
}) {
  if (adminRole !== 'ADMIN') {
    throw Object.assign(new Error('FORBIDDEN_CO_ADMIN_REQUIRED'), { status: 403 });
  }

  const cleanQuantity = Number(quantity);
  if (!/^\d+$/.test(String(quantity ?? '')) || !Number.isSafeInteger(cleanQuantity) || cleanQuantity <= 0 || cleanQuantity > 1_000_000) {
    throw Object.assign(new Error('INVALID_QUANTITY'), { status: 400 });
  }

  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 3 || cleanReason.length > 500) {
    throw Object.assign(new Error('INVALID_REASON'), { status: 400 });
  }

  const cleanAction = String(action || '').toUpperCase();
  if (!['GRANT', 'DEDUCT'].includes(cleanAction)) {
    throw Object.assign(new Error('INVALID_ACTION'), { status: 400 });
  }

  const cleanKey = String(idempotencyKey || '').trim();
  if (!/^[a-z\d_-]{8,100}$/i.test(cleanKey)) {
    throw Object.assign(new Error('INVALID_IDEMPOTENCY_KEY'), { status: 400 });
  }

  const entryKey = `admin_adj:${adminId}:${cleanKey}`;
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const existingEntry = await WallEntry.findOne({ key: entryKey }).session(session);
      if (existingEntry) {
        // Idempotent replay: return recorded state
        const query = WallWallet.findById(String(targetUserId));
        const currentWallet = typeof query.session === 'function' ? await query.session(session) : await query;
        result = {
          reused: true,
          action: existingEntry.type === 'ADMIN_GRANT' ? 'GRANT' : 'DEDUCT',
          quantity: existingEntry.quantity,
          reason: existingEntry.reason,
          balance: getSpendableBalance(currentWallet, now),
        };
        return;
      }

      // Atomically ensure any legacy lots are reconstructed from verified entries
      let wallet = await ensureWalletLotsReconstructed(targetUserId, session, now);
      if (!wallet) {
        wallet = new WallWallet({ _id: String(targetUserId), balance: 0, receivedGifts: 0, lots: [], lotsMigrated: true });
      }

      if (cleanAction === 'GRANT') {
        const lotId = `admin_grant_${Date.now()}_${cleanKey.slice(0, 8)}`;
        const newLot = {
          lotId,
          type: 'ADMIN_GRANT',
          originalQuantity: cleanQuantity,
          remainingQuantity: cleanQuantity,
          acquiredAt: now,
          expiresAt: null, // Non-expiring
        };

        const updatedLots = [...(wallet.lots || []), newLot];
        const newSpendable = getSpendableBalance({ lots: updatedLots }, now);

        await WallEntry.create([{
          key: entryKey,
          type: 'ADMIN_GRANT',
          userId: String(targetUserId),
          quantity: cleanQuantity,
          actorId: String(adminId),
          actorRole: adminRole,
          reason: cleanReason,
          lotId,
          expiresAt: null,
        }], { session });

        wallet.lots = updatedLots;
        wallet.balance = newSpendable;
        await wallet.save({ session });

        result = {
          reused: false,
          action: 'GRANT',
          quantity: cleanQuantity,
          reason: cleanReason,
          balance: newSpendable,
        };
      } else {
        // DEDUCT
        // Plan deduction FIFO with immediate expiration of overdue lots
        const deduction = planLotDeduction(wallet.lots || [], cleanQuantity, now);

        // Record any expired lots in ledger so they are permanently logged
        for (const expired of deduction.expiredLots) {
          const expireKey = `expired:${targetUserId}:${expired.lotId}`;
          if (!await WallEntry.exists({ key: expireKey }).session(session)) {
            await WallEntry.create([{
              key: expireKey,
              type: 'EXPIRED',
              userId: String(targetUserId),
              quantity: expired.quantity,
              lotId: expired.lotId,
              expiresAt: expired.expiresAt,
            }], { session });
          }
        }

        await WallEntry.create([{
          key: entryKey,
          type: 'ADMIN_DEDUCTION',
          userId: String(targetUserId),
          quantity: cleanQuantity,
          actorId: String(adminId),
          actorRole: adminRole,
          reason: cleanReason,
        }], { session });

        wallet.lots = deduction.updatedLots;
        wallet.balance = deduction.spendableAfter;
        await wallet.save({ session });

        result = {
          reused: false,
          action: 'DEDUCT',
          quantity: cleanQuantity,
          reason: cleanReason,
          balance: deduction.spendableAfter,
        };
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const existingEntry = await WallEntry.findOne({ key: entryKey }).lean();
      if (existingEntry) {
        const currentWallet = await WallWallet.findById(String(targetUserId)).lean();
        return {
          reused: true,
          action: existingEntry.type === 'ADMIN_GRANT' ? 'GRANT' : 'DEDUCT',
          quantity: existingEntry.quantity,
          reason: existingEntry.reason,
          balance: getSpendableBalance(currentWallet, now),
        };
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }

  // If not reused, notify member asynchronously
  if (!result.reused) {
    const isGrant = cleanAction === 'GRANT';
    createNotification(String(targetUserId), {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: isGrant ? 'Dinar balance updated' : 'Dinar balance adjusted',
      message: isGrant
        ? `Co-Admin added ${cleanQuantity.toLocaleString()} dinars to your wallet. Reason: ${cleanReason}`
        : `Co-Admin deducted ${cleanQuantity.toLocaleString()} dinars from your wallet. Reason: ${cleanReason}`,
      icon: isGrant ? '🎁' : '⚖️',
      link: '/wall',
    }).catch(err => console.error('[WALL_WALLET_NOTIFICATION_ERROR]', err));
  }

  return result;
}

