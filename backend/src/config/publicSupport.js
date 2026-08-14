import '../config.js';

const DEFAULT_INACTIVITY_MINUTES = 30;
const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;

const positiveNumber = (value, fallback, minimum) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
};

export const PUBLIC_SUPPORT_INACTIVITY_MINUTES = positiveNumber(
  process.env.PUBLIC_SUPPORT_INACTIVITY_MINUTES,
  DEFAULT_INACTIVITY_MINUTES,
  0.1
);
export const PUBLIC_SUPPORT_INACTIVITY_MS = PUBLIC_SUPPORT_INACTIVITY_MINUTES * 60_000;
export const PUBLIC_SUPPORT_CLEANUP_INTERVAL_MS = positiveNumber(
  process.env.PUBLIC_SUPPORT_CLEANUP_INTERVAL_MS,
  DEFAULT_CLEANUP_INTERVAL_MS,
  5_000
);
export const PUBLIC_SUPPORT_EXPIRY_BATCH_SIZE = 200;

export default {
  inactivityMinutes:PUBLIC_SUPPORT_INACTIVITY_MINUTES,
  inactivityMs:PUBLIC_SUPPORT_INACTIVITY_MS,
  cleanupIntervalMs:PUBLIC_SUPPORT_CLEANUP_INTERVAL_MS,
  batchSize:PUBLIC_SUPPORT_EXPIRY_BATCH_SIZE,
};
