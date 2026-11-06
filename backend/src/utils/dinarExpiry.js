// backend/src/utils/dinarExpiry.js
// ============================================================
// DINAR LOT EXPIRY & ALLOCATION LOGIC
//
// Rules:
// 1. Purchased dinars expire exactly 1 calendar month after successful payment.
// 2. Computed in UTC: year, month + 1, clamped to the last day of the target month.
//    (e.g., Jan 31 -> Feb 28 in non-leap year, Feb 29 in leap year, Aug 31 -> Sep 30).
// 3. Admin grants are non-expiring (expiresAt: null).
// 4. Earliest-expiring valid dinars are consumed first (FIFO on expiresAt).
//    Non-expiring dinars are consumed after all expiring dinars.
// 5. Expired dinars (expiresAt <= now) are excluded immediately from spendable balance.
// 6. Wallets with lots have lotsMigrated: true. Legacy funds are preserved explicitly
//    in a transitional lot during migration so they cannot be lost or bypass expiry.
// ============================================================

/**
 * Calculates exactly one calendar month from date in UTC, clamping to last valid day of target month.
 * @param {Date|string|number} date
 * @returns {Date}
 */
export function calculateOneMonthExpiry(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error('INVALID_DATE');
  }

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const day = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  const milliseconds = d.getUTCMilliseconds();

  // Target month is month + 1
  const targetYear = month === 11 ? year + 1 : year;
  const targetMonth = month === 11 ? 0 : month + 1;

  // Day 0 of (targetMonth + 1) in targetYear gives the last day of targetMonth
  const maxDayInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, maxDayInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, clampedDay, hours, minutes, seconds, milliseconds));
}

/**
 * Check if a lot is currently valid (non-expired and has remaining quantity).
 * @param {object} lot
 * @param {Date} now
 * @returns {boolean}
 */
export function isLotValid(lot, now = new Date()) {
  if (!lot || typeof lot.remainingQuantity !== 'number' || lot.remainingQuantity <= 0) {
    return false;
  }
  if (lot.expiresAt == null) {
    return true; // Non-expiring (e.g. ADMIN_GRANT or non-expiring legacy grant)
  }
  return new Date(lot.expiresAt).getTime() > now.getTime();
}

/**
 * Returns true if wallet is already operating under the modern lots model.
 * @param {object} wallet
 * @returns {boolean}
 */
export function isWalletMigrated(wallet) {
  if (!wallet) return false;
  return wallet.lotsMigrated === true || (Array.isArray(wallet.lots) && wallet.lots.length > 0);
}

/**
 * Computes spendable balance from a wallet's lots, strictly excluding expired quantities.
 * If wallet is migrated (or has lots), spendable balance is strictly the sum of valid lots.
 * Legacy unmigrated wallets fallback to stored balance.
 * @param {object} wallet
 * @param {Date} now
 * @returns {number}
 */
export function getSpendableBalance(wallet, now = new Date()) {
  if (!wallet) return 0;
  if (isWalletMigrated(wallet)) {
    return (wallet.lots || []).reduce((acc, lot) => {
      return isLotValid(lot, now) ? acc + lot.remainingQuantity : acc;
    }, 0);
  }
  return Math.max(0, Number(wallet.balance) || 0);
}

/**
 * Computes upcoming expiring summary for member's information.
 * Returns array of upcoming expiring lots sorted by expiresAt ascending.
 * @param {object} wallet
 * @param {Date} now
 * @returns {Array<{ lotId: string, remainingQuantity: number, expiresAt: Date }>}
 */
export function getUpcomingExpiringLots(wallet, now = new Date()) {
  if (!wallet || !Array.isArray(wallet.lots)) return [];
  return wallet.lots
    .filter(lot => lot.remainingQuantity > 0 && lot.expiresAt && new Date(lot.expiresAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))
    .map(lot => ({
      lotId: lot.lotId,
      remainingQuantity: lot.remainingQuantity,
      expiresAt: lot.expiresAt,
    }));
}

/**
 * Plans FIFO deduction across lots:
 * Earliest-expiring valid PURCHASE lots first, then non-expiring ADMIN_GRANT lots.
 * 
 * Also identifies any lots that have newly expired (had remainingQuantity > 0 but expiresAt <= now)
 * so the caller can record EXPIRED ledger entries and clean them up atomically.
 *
 * @param {Array<object>} lots
 * @param {number} quantityToDeduct
 * @param {Date} now
 * @returns {{
 *   updatedLots: Array<object>,
 *   consumedLots: Array<{ lotId: string, quantity: number, type: string, expiresAt: Date|null }>,
 *   expiredLots: Array<{ lotId: string, quantity: number, type: string, expiresAt: Date }>,
 *   spendableBefore: number,
 *   spendableAfter: number
 * }}
 */
export function planLotDeduction(lots = [], quantityToDeduct = 0, now = new Date()) {
  if (!Number.isSafeInteger(quantityToDeduct) || quantityToDeduct <= 0) {
    throw new Error('INVALID_DEDUCT_QUANTITY');
  }

  // Clone lots
  const workingLots = lots.map(l => ({
    lotId: l.lotId,
    type: l.type,
    originalQuantity: l.originalQuantity,
    remainingQuantity: l.remainingQuantity,
    acquiredAt: l.acquiredAt,
    expiresAt: l.expiresAt ? new Date(l.expiresAt) : null,
    paymentId: l.paymentId || null,
    paymentReference: l.paymentReference || null,
  }));

  const expiredLots = [];
  // 1. Identify and zero out expired lots that still hold positive remainingQuantity
  for (const lot of workingLots) {
    if (lot.remainingQuantity > 0 && lot.expiresAt && lot.expiresAt.getTime() <= now.getTime()) {
      expiredLots.push({
        lotId: lot.lotId,
        quantity: lot.remainingQuantity,
        type: lot.type,
        expiresAt: lot.expiresAt,
      });
      lot.remainingQuantity = 0;
    }
  }

  // Spendable balance among non-expired lots
  const validLots = workingLots.filter(l => l.remainingQuantity > 0);
  const spendableBefore = validLots.reduce((acc, l) => acc + l.remainingQuantity, 0);

  if (spendableBefore < quantityToDeduct) {
    throw Object.assign(new Error('INSUFFICIENT_BALANCE'), {
      status: 409,
      spendable: spendableBefore,
      requested: quantityToDeduct,
    });
  }

  // Sort valid lots for consumption:
  // Expiring lots first sorted by expiresAt ASC, then non-expiring lots (expiresAt === null)
  validLots.sort((a, b) => {
    if (a.expiresAt && b.expiresAt) {
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    }
    if (a.expiresAt && !b.expiresAt) return -1;
    if (!a.expiresAt && b.expiresAt) return 1;
    return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
  });

  let remainingToDeduct = quantityToDeduct;
  const consumedLots = [];

  for (const lot of validLots) {
    if (remainingToDeduct <= 0) break;
    const take = Math.min(lot.remainingQuantity, remainingToDeduct);
    lot.remainingQuantity -= take;
    remainingToDeduct -= take;
    consumedLots.push({
      lotId: lot.lotId,
      quantity: take,
      type: lot.type,
      expiresAt: lot.expiresAt,
    });
  }

  const spendableAfter = workingLots.reduce((acc, l) => (isLotValid(l, now) ? acc + l.remainingQuantity : acc), 0);

  return {
    updatedLots: workingLots,
    consumedLots,
    expiredLots,
    spendableBefore,
    spendableAfter,
  };
}

/**
 * Sweeps a wallet's lots for expired lots that still have remainingQuantity > 0.
 * Modifies nothing; returns lots to be zeroed out and ledger entries to create.
 *
 * @param {Array<object>} lots
 * @param {Date} now
 * @returns {{
 *   hasExpiredLots: boolean,
 *   updatedLots: Array<object>,
 *   expiredLots: Array<{ lotId: string, quantity: number, type: string, expiresAt: Date }>,
 *   spendableAfter: number
 * }}
 */
export function sweepExpiredLots(lots = [], now = new Date()) {
  const workingLots = lots.map(l => ({
    lotId: l.lotId,
    type: l.type,
    originalQuantity: l.originalQuantity,
    remainingQuantity: l.remainingQuantity,
    acquiredAt: l.acquiredAt,
    expiresAt: l.expiresAt ? new Date(l.expiresAt) : null,
    paymentId: l.paymentId || null,
    paymentReference: l.paymentReference || null,
  }));

  const expiredLots = [];
  for (const lot of workingLots) {
    if (lot.remainingQuantity > 0 && lot.expiresAt && lot.expiresAt.getTime() <= now.getTime()) {
      expiredLots.push({
        lotId: lot.lotId,
        quantity: lot.remainingQuantity,
        type: lot.type,
        expiresAt: lot.expiresAt,
      });
      lot.remainingQuantity = 0;
    }
  }

  return {
    hasExpiredLots: expiredLots.length > 0,
    updatedLots: workingLots,
    expiredLots,
    spendableAfter: workingLots.reduce((acc, l) => (isLotValid(l, now) ? acc + l.remainingQuantity : acc), 0),
  };
}
