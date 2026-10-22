const buckets = new Map();
let nextSweepAt = 0;

const sweepExpiredBuckets = (now) => {
  if (now < nextSweepAt) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  nextSweepAt = now + 60_000;
};

export const createFamilyTrackingRateLimit = ({ windowMs, maximum, cost = () => 1 }) => (req, res, next) => {
  const now = Date.now();
  sweepExpiredBuckets(now);
  const key = `${req.userId || req.ip}:${req.method}:${req.baseUrl}${req.route?.path || req.path}`;
  const requestCost = Math.max(1, Number(cost(req)) || 1);
  let current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    current = { count: 0, resetAt: now + windowMs };
    buckets.set(key, current);
  }
  if (current.count + requestCost > maximum) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    return res.status(429).json({ success: false, message: 'Too many tracking requests. Please try again shortly.' });
  }
  current.count += requestCost;
  return next();
};

export const resetFamilyTrackingRateLimitsForTests = () => {
  buckets.clear();
  nextSweepAt = 0;
};
