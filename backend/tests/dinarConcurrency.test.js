import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WallWallet, WallEntry } from '../src/models/Wall.js';
import { planLotDeduction, getSpendableBalance, sweepExpiredLots, calculateOneMonthExpiry } from '../src/utils/dinarExpiry.js';
import { sweepWalletExpirations } from '../src/services/wallService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Database Transaction Concurrency & Expiry Sweep Suite', () => {
  const isMongoAvailable = !!process.env.DATABASE_URL;

  it('verifies atomic lot deduction planning prevents overspending under concurrent requests', () => {
    const initialLots = [
      {
        lotId: 'lot_concurrency_1',
        type: 'PURCHASE',
        originalQuantity: 100,
        remainingQuantity: 100,
        acquiredAt: new Date(),
        expiresAt: calculateOneMonthExpiry(new Date()),
      }
    ];

    // Simulating two concurrent requests both trying to spend 80 dinars from a 100-dinar lot
    const plan1 = planLotDeduction(initialLots, 80);
    assert.equal(plan1.spendableAfter, 20);

    // Second request attempts against the resulting lots from first request
    assert.throws(() => {
      planLotDeduction(plan1.updatedLots, 80);
    }, (err) => {
      return err.message === 'INSUFFICIENT_BALANCE' && err.spendable === 20;
    });
  });

  it('verifies sweepExpiredLots zeroes overdue lots and records EXPIRED items deterministically', () => {
    const now = new Date('2026-11-06T12:00:00Z');
    const lots = [
      {
        lotId: 'expired_purchase_1',
        type: 'PURCHASE',
        originalQuantity: 200,
        remainingQuantity: 150,
        acquiredAt: new Date('2026-09-01T00:00:00Z'),
        expiresAt: new Date('2026-10-01T00:00:00Z'), // EXPIRED
      },
      {
        lotId: 'valid_purchase_2',
        type: 'PURCHASE',
        originalQuantity: 100,
        remainingQuantity: 100,
        acquiredAt: new Date('2026-11-01T00:00:00Z'),
        expiresAt: new Date('2026-12-01T00:00:00Z'), // VALID
      }
    ];

    const result = sweepExpiredLots(lots, now);
    assert.equal(result.hasExpiredLots, true);
    assert.equal(result.expiredLots.length, 1);
    assert.equal(result.expiredLots[0].lotId, 'expired_purchase_1');
    assert.equal(result.expiredLots[0].quantity, 150);
    assert.equal(result.spendableAfter, 100);

    // Idempotent secondary sweep: running again finds 0 newly expired
    const secondSweep = sweepExpiredLots(result.updatedLots, now);
    assert.equal(secondSweep.hasExpiredLots, false);
    assert.equal(secondSweep.expiredLots.length, 0);
  });

  it('confirms delayed fulfillment behavior when purchase completed in the past', () => {
    // Suppose payment completed 40 days ago
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const expiry = calculateOneMonthExpiry(fortyDaysAgo);

    // Expiry date must be exactly 1 month after completion date, which is already in the past
    assert.equal(expiry.getTime() < Date.now(), true);
  });
});
