import AnalyticsEvent, { EVENT_TYPES, SOURCES, ensureAnalyticsIndexes } from '../models/AnalyticsEvent.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_OPERATION_TIMEOUT_MS = 1500;

const emptyMetrics = () => ({
  apkDownloads: { today: 0, last7Days: 0, last30Days: 0, allTime: 0 },
  loginPageVisits: { today: 0, last7Days: 0, last30Days: 0, allTime: 0, bySource: { web: 0, android: 0 } },
});

const withTimeout = (promise, timeoutMs = ANALYTICS_OPERATION_TIMEOUT_MS) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Analytics operation timed out')), timeoutMs)),
]);

const utcDayStart = (date = new Date()) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const utcDayKey = (date = new Date()) => utcDayStart(date).toISOString().slice(0, 10);

const isValidDedupeKey = (value) => (
  typeof value === 'string'
  && value.length >= 16
  && value.length <= 160
  && /^[A-Za-z0-9:_-]+$/.test(value)
);

let indexPromise;
const ensureIndexes = () => {
  indexPromise ||= ensureAnalyticsIndexes();
  return indexPromise;
};

const requestTimes = [];
const allowAnalyticsRequest = () => {
  const now = Date.now();
  while (requestTimes[0] && requestTimes[0] <= now - 1000) requestTimes.shift();
  if (requestTimes.length >= 100) return false;
  requestTimes.push(now);
  return true;
};

export const recordAnalyticsEvent = async (req, res) => {
  if (!allowAnalyticsRequest()) return res.status(429).json({ success: false, message: 'Analytics rate limit exceeded' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const keys = Object.keys(body);
  const allowedKeys = new Set(['eventType', 'source', 'dedupeKey']);

  if (keys.some((key) => !allowedKeys.has(key))) {
    return res.status(400).json({ success: false, message: 'Unknown analytics field' });
  }

  const { eventType, source, dedupeKey } = body;
  if (!EVENT_TYPES.includes(eventType) || !SOURCES.includes(source) || !isValidDedupeKey(dedupeKey)) {
    return res.status(400).json({ success: false, message: 'Invalid analytics event' });
  }

  try {
    await withTimeout(ensureIndexes());
    await withTimeout(AnalyticsEvent.create({
      eventType,
      source,
      dayKey: utcDayKey(),
      dedupeKey,
    }));
    return res.status(201).json({ success: true, recorded: true });
  } catch (error) {
    // A duplicate is the expected result of refreshes, retries, and StrictMode.
    if (error?.code === 11000) {
      return res.status(200).json({ success: true, recorded: false, deduplicated: true });
    }

    // Analytics must never break the calling page or authentication flow.
    console.error('Analytics event recording failed:', error.message);
    return res.status(202).json({ success: true, recorded: false });
  }
};

export const redirectToApk = async (req, res) => {
  const source = req.query?.source === 'android' ? 'android' : 'web';
  const dedupeKey = req.query?.dedupeKey;
  const target = 'https://github.com/contractforlife-eng/homelyserv/releases/download/android-v1.0.8/HomelyServ-1.0.8-9.apk';

  if (isValidDedupeKey(dedupeKey)) {
    try {
      await withTimeout(ensureIndexes());
      await withTimeout(AnalyticsEvent.create({
        eventType: 'APK_DOWNLOAD',
        source,
        dayKey: utcDayKey(),
        dedupeKey,
      }));
    } catch (error) {
      if (error?.code !== 11000) console.error('APK analytics recording failed:', error.message);
    }
  }

  return res.redirect(302, target);
};

const countSince = (eventType, start, source) => AnalyticsEvent.countDocuments({
  eventType,
  ...(source ? { source } : {}),
  createdAt: { $gte: start },
});

export const getAnalyticsMetrics = async (now = new Date()) => {
  const today = utcDayStart(now);
  const last7Days = new Date(today.getTime() - (6 * DAY_MS));
  const last30Days = new Date(today.getTime() - (29 * DAY_MS));

  try {
    await withTimeout(ensureIndexes());
  } catch (error) {
    console.error('Analytics index initialization failed:', error.message);
    return emptyMetrics();
  }

  try {
    const [apkToday, apk7, apk30, apkAll, loginToday, login7, login30, loginAll, loginWeb, loginAndroid] = await withTimeout(Promise.all([
      countSince('APK_DOWNLOAD', today),
      countSince('APK_DOWNLOAD', last7Days),
      countSince('APK_DOWNLOAD', last30Days),
      AnalyticsEvent.countDocuments({ eventType: 'APK_DOWNLOAD' }),
      countSince('LOGIN_PAGE_VIEW', today),
      countSince('LOGIN_PAGE_VIEW', last7Days),
      countSince('LOGIN_PAGE_VIEW', last30Days),
      AnalyticsEvent.countDocuments({ eventType: 'LOGIN_PAGE_VIEW' }),
      countSince('LOGIN_PAGE_VIEW', new Date(0), 'web'),
      countSince('LOGIN_PAGE_VIEW', new Date(0), 'android'),
    ]));

    return {
      apkDownloads: { today: apkToday, last7Days: apk7, last30Days: apk30, allTime: apkAll },
      loginPageVisits: {
        today: loginToday,
        last7Days: login7,
        last30Days: login30,
        allTime: loginAll,
        bySource: { web: loginWeb, android: loginAndroid },
      },
    };
  } catch (error) {
    console.error('Analytics metrics query failed:', error.message);
    return emptyMetrics();
  }
};
