import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOneMonthExpiry, planLotDeduction, getSpendableBalance, isLotValid, getUpcomingExpiringLots } from '../src/utils/dinarExpiry.js';
import { dinarPurchase, wallCrown } from '../src/config/wall.js';

describe('Dinar Wallet Policy & Expiry Suite', () => {

  describe('Calendar-Month Expiry Calculation', () => {
    it('adds exactly 1 calendar month in UTC across regular months', () => {
      const date = new Date(Date.UTC(2026, 4, 15, 12, 0, 0)); // May 15
      const expiry = calculateOneMonthExpiry(date);
      assert.equal(expiry.toISOString(), '2026-06-15T12:00:00.000Z');
    });

    it('clamps Jan 31 to Feb 28 in a non-leap year (2025)', () => {
      const jan31 = new Date(Date.UTC(2025, 0, 31, 10, 15, 30));
      const expiry = calculateOneMonthExpiry(jan31);
      assert.equal(expiry.toISOString(), '2025-02-28T10:15:30.000Z');
    });

    it('clamps Jan 31 to Feb 29 in a leap year (2024)', () => {
      const jan31 = new Date(Date.UTC(2024, 0, 31, 8, 0, 0));
      const expiry = calculateOneMonthExpiry(jan31);
      assert.equal(expiry.toISOString(), '2024-02-29T08:00:00.000Z');
    });

    it('clamps August 31 to September 30', () => {
      const aug31 = new Date(Date.UTC(2026, 7, 31, 23, 59, 59));
      const expiry = calculateOneMonthExpiry(aug31);
      assert.equal(expiry.toISOString(), '2026-09-30T23:59:59.000Z');
    });

    it('handles year rollover on December 31', () => {
      const dec31 = new Date(Date.UTC(2026, 11, 31, 14, 0, 0));
      const expiry = calculateOneMonthExpiry(dec31);
      assert.equal(expiry.toISOString(), '2027-01-31T14:00:00.000Z');
    });

    it('rejects invalid dates', () => {
      assert.throws(() => calculateOneMonthExpiry('invalid-date'), /INVALID_DATE/);
    });
  });

  describe('Spendable Balance & Expiry Exclusion', () => {
    const now = new Date('2026-11-06T12:00:00.000Z');

    it('immediately excludes expired lots from spendable balance', () => {
      const wallet = {
        balance: 200,
        lots: [
          {
            lotId: 'lot1',
            type: 'PURCHASE',
            originalQuantity: 100,
            remainingQuantity: 100,
            acquiredAt: new Date('2026-09-01T00:00:00.000Z'),
            expiresAt: new Date('2026-10-01T00:00:00.000Z'), // expired over a month ago
          },
          {
            lotId: 'lot2',
            type: 'PURCHASE',
            originalQuantity: 100,
            remainingQuantity: 100,
            acquiredAt: new Date('2026-10-15T00:00:00.000Z'),
            expiresAt: new Date('2026-11-15T00:00:00.000Z'), // valid for 9 more days
          }
        ]
      };

      const spendable = getSpendableBalance(wallet, now);
      assert.equal(spendable, 100);
    });

    it('treats admin grants as non-expiring (expiresAt: null)', () => {
      const wallet = {
        balance: 500,
        lots: [
          {
            lotId: 'grant1',
            type: 'ADMIN_GRANT',
            originalQuantity: 500,
            remainingQuantity: 500,
            acquiredAt: new Date('2025-01-01T00:00:00.000Z'),
            expiresAt: null,
          }
        ]
      };

      const spendable = getSpendableBalance(wallet, now);
      assert.equal(spendable, 500);
      assert.equal(isLotValid(wallet.lots[0], now), true);
    });

    it('reports upcoming expiring lots correctly sorted by earliest expiry', () => {
      const wallet = {
        lots: [
          { lotId: 'p2', remainingQuantity: 80, expiresAt: new Date('2026-11-20T00:00:00.000Z') },
          { lotId: 'p1', remainingQuantity: 50, expiresAt: new Date('2026-11-10T00:00:00.000Z') },
          { lotId: 'g1', remainingQuantity: 100, expiresAt: null },
        ]
      };

      const upcoming = getUpcomingExpiringLots(wallet, now);
      assert.equal(upcoming.length, 2);
      assert.equal(upcoming[0].lotId, 'p1');
      assert.equal(upcoming[1].lotId, 'p2');
    });
  });

  describe('FIFO Lot Consumption Policy', () => {
    const now = new Date('2026-11-06T12:00:00.000Z');

    it('consumes earliest-expiring purchase lots first, and leaves admin grants for last', () => {
      const lots = [
        {
          lotId: 'purchase_later',
          type: 'PURCHASE',
          originalQuantity: 100,
          remainingQuantity: 100,
          acquiredAt: new Date('2026-10-25T00:00:00.000Z'),
          expiresAt: new Date('2026-11-25T00:00:00.000Z'), // expires in 19 days
        },
        {
          lotId: 'purchase_earlier',
          type: 'PURCHASE',
          originalQuantity: 100,
          remainingQuantity: 100,
          acquiredAt: new Date('2026-10-10T00:00:00.000Z'),
          expiresAt: new Date('2026-11-10T00:00:00.000Z'), // expires in 4 days (EARLIEST)
        },
        {
          lotId: 'admin_grant',
          type: 'ADMIN_GRANT',
          originalQuantity: 300,
          remainingQuantity: 300,
          acquiredAt: new Date('2026-10-01T00:00:00.000Z'),
          expiresAt: null, // Non-expiring
        }
      ];

      // Spend 150 dinars: should take 100 from purchase_earlier, 50 from purchase_later, 0 from admin_grant
      const plan = planLotDeduction(lots, 150, now);

      assert.equal(plan.consumedLots.length, 2);
      assert.equal(plan.consumedLots[0].lotId, 'purchase_earlier');
      assert.equal(plan.consumedLots[0].quantity, 100);
      assert.equal(plan.consumedLots[1].lotId, 'purchase_later');
      assert.equal(plan.consumedLots[1].quantity, 50);

      const grantLot = plan.updatedLots.find(l => l.lotId === 'admin_grant');
      assert.equal(grantLot.remainingQuantity, 300);

      const laterLot = plan.updatedLots.find(l => l.lotId === 'purchase_later');
      assert.equal(laterLot.remainingQuantity, 50);

      assert.equal(plan.spendableBefore, 500);
      assert.equal(plan.spendableAfter, 350);
    });

    it('rejects deduction when spendable balance is insufficient (never allows negative)', () => {
      const lots = [
        {
          lotId: 'p1',
          type: 'PURCHASE',
          originalQuantity: 50,
          remainingQuantity: 50,
          acquiredAt: new Date('2026-10-10T00:00:00.000Z'),
          expiresAt: new Date('2026-11-10T00:00:00.000Z'),
        }
      ];

      assert.throws(() => planLotDeduction(lots, 100, now), (err) => {
        return err.message === 'INSUFFICIENT_BALANCE' && err.spendable === 50 && err.requested === 100;
      });
    });

    it('detects and zeros out expired lots during planning and records them in expiredLots', () => {
      const lots = [
        {
          lotId: 'overdue',
          type: 'PURCHASE',
          originalQuantity: 100,
          remainingQuantity: 70,
          acquiredAt: new Date('2026-09-01T00:00:00.000Z'),
          expiresAt: new Date('2026-10-01T00:00:00.000Z'), // EXPIRED
        },
        {
          lotId: 'valid_p',
          type: 'PURCHASE',
          originalQuantity: 100,
          remainingQuantity: 100,
          acquiredAt: new Date('2026-10-20T00:00:00.000Z'),
          expiresAt: new Date('2026-11-20T00:00:00.000Z'),
        }
      ];

      const plan = planLotDeduction(lots, 20, now);
      assert.equal(plan.expiredLots.length, 1);
      assert.equal(plan.expiredLots[0].lotId, 'overdue');
      assert.equal(plan.expiredLots[0].quantity, 70);

      const overdueUpdated = plan.updatedLots.find(l => l.lotId === 'overdue');
      assert.equal(overdueUpdated.remainingQuantity, 0);
    });
  });

  describe('Crown and Gift Invariance', () => {
    it('confirms wall crown calculation is strictly based on receivedGifts, not balance or manual adjustments', () => {
      // 0 gifts
      assert.equal(wallCrown(0).level, 0);
      // 50 gifts = level 1
      assert.equal(wallCrown(50).level, 1);
      // 100 gifts = level 2
      assert.equal(wallCrown(100).level, 2);
      // 250 gifts = level 3
      assert.equal(wallCrown(250).level, 3);
      // 500 gifts = level 4
      assert.equal(wallCrown(500).level, 4);
    });
  });

  describe('Dinar Purchase Conversion Safety', () => {
    it('enforces 1 dinar = 0.10 EGP and safe integer quantity limits (1 - 1,000,000)', () => {
      const p1 = dinarPurchase(100);
      assert.equal(p1.quantity, 100);
      assert.equal(p1.amount, 10);
      assert.equal(p1.currency, 'EGP');

      const p2 = dinarPurchase(1000);
      assert.equal(p2.quantity, 1000);
      assert.equal(p2.amount, 100);

      assert.throws(() => dinarPurchase(0), /INVALID_QUANTITY/);
      assert.throws(() => dinarPurchase(-50), /INVALID_QUANTITY/);
      assert.throws(() => dinarPurchase(1.5), /INVALID_QUANTITY/);
      assert.throws(() => dinarPurchase(1_000_001), /INVALID_QUANTITY/);
    });
  });
});
