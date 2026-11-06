import { sweepAllExpiredWallets } from './wallService.js';

// Run every 10 minutes by default
export const WALL_EXPIRY_WORKER_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Starts a periodic background worker that sweeps all wallets for expired dinar lots,
 * writes exactly-once EXPIRED ledger entries, and updates wallet spendable balances.
 * Employs an in-process lock (`running`) to prevent overlapping executions and handles errors safely.
 */
export function startWallExpiryWorker(intervalMs = WALL_EXPIRY_WORKER_INTERVAL_MS) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const results = await sweepAllExpiredWallets();
      if (results.length > 0) {
        console.log(`[WALL_EXPIRY_WORKER] Swept ${results.length} wallets for expired lots.`);
      }
    } catch (error) {
      console.error('[WALL_EXPIRY_WORKER] Expiration sweep failed:', error.message);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
