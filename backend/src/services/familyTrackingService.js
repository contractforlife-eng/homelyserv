import ParentStudent from '../models/ParentStudent.js';
import StudentLocationObservation from '../models/StudentLocationObservation.js';
import StudentTrackingSetting from '../models/StudentTrackingSetting.js';
import { getActivePremiumUserIds, isUserPremium } from './premiumService.js';

export const FREE_RETENTION_DAYS = 3;
export const PREMIUM_RETENTION_DAYS = 90;
export const LAST_KNOWN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const MAX_HISTORY_RECORDS = 2000;
export const MAX_OBSERVATIONS_PER_REQUEST = 20;
export const LOW_ACCURACY_METERS = 100;
export const MAX_ROUTE_ACCURACY_METERS = 250;
export const MAX_ROUTE_GAP_MS = 30 * 60 * 1000;
export const MAX_ROUTE_JUMP_METERS = 20_000;
export const MAX_ROUTE_IMPLIED_SPEED_MPS = 70;
export const CURRENT_CONSENT_VERSION = 'family-tracking-v1';
export const DEFAULT_TRACKING_TIME_ZONE = 'Africa/Cairo';
export const RETENTION_DELETE_BATCH_SIZE = 500;
export const RETENTION_STUDENT_BATCH_SIZE = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
const OBSERVATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const strictFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export const isValidTimeZone = (value) => {
  if (typeof value !== 'string' || value.length < 1 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const normalizeTimeZone = (value) => isValidTimeZone(value) ? value : DEFAULT_TRACKING_TIME_ZONE;

export const getDateStringInTimeZone = (value = new Date(), timeZone = DEFAULT_TRACKING_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone), year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const parseCalendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
};

export const addCalendarDays = (dateString, days) => {
  const parsed = new Date(`${dateString}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

const zonedPartsAsUtc = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day),
    Number(values.hour), Number(values.minute), Number(values.second)
  );
};

export const getUtcDayRange = (dateString, timeZone = DEFAULT_TRACKING_TIME_ZONE) => {
  const validDate = parseCalendarDate(dateString);
  const validTimeZone = normalizeTimeZone(timeZone);
  if (!validDate) return null;
  const toUtcMidnight = (calendarDate) => {
    const [year, month, day] = calendarDate.split('-').map(Number);
    const nominalUtc = Date.UTC(year, month - 1, day);
    let result = new Date(nominalUtc);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const offset = zonedPartsAsUtc(result, validTimeZone) - result.getTime();
      result = new Date(nominalUtc - offset);
    }
    return result;
  };
  return { start: toUtcMidnight(validDate), end: toUtcMidnight(addCalendarDays(validDate, 1)) };
};

export const getRetentionWindow = (premium, now = new Date(), timeZone = DEFAULT_TRACKING_TIME_ZONE) => {
  const retentionDays = premium ? PREMIUM_RETENTION_DAYS : FREE_RETENTION_DAYS;
  const todayDate = getDateStringInTimeZone(now, timeZone);
  const earliestDate = addCalendarDays(todayDate, -(retentionDays - 1));
  return {
    retentionDays,
    todayDate,
    earliestDate,
    earliestInstant: getUtcDayRange(earliestDate, timeZone).start
  };
};

export const isDateWithinRetention = (selectedDate, premium, now = new Date(), timeZone = DEFAULT_TRACKING_TIME_ZONE) => {
  const parsedDate = parseCalendarDate(selectedDate);
  if (!parsedDate) return false;
  const window = getRetentionWindow(premium, now, timeZone);
  return parsedDate >= window.earliestDate && parsedDate <= window.todayDate;
};

export const validateObservation = (input, now = new Date()) => {
  const latitude = input?.latitude;
  const longitude = input?.longitude;
  const accuracy = input?.accuracy;
  const speed = input?.speed == null ? null : input.speed;
  const heading = input?.heading == null ? null : input.heading;
  const observationId = input?.observationId;
  const recordedAt = typeof input?.recordedAt === 'string' || input?.recordedAt instanceof Date
    ? new Date(input.recordedAt)
    : new Date(Number.NaN);
  const errors = [];

  if (typeof observationId !== 'string' || !OBSERVATION_ID_PATTERN.test(observationId)) errors.push('observationId');
  if (!strictFiniteNumber(latitude) || latitude < -90 || latitude > 90) errors.push('latitude');
  if (!strictFiniteNumber(longitude) || longitude < -180 || longitude > 180) errors.push('longitude');
  if (!strictFiniteNumber(accuracy) || accuracy < 0 || accuracy > 10000) errors.push('accuracy');
  if (Number.isNaN(recordedAt.getTime())
    || recordedAt > new Date(now.getTime() + 5 * 60 * 1000)
    || recordedAt < new Date(now.getTime() - 7 * DAY_MS)) errors.push('recordedAt');
  if (speed != null && (!strictFiniteNumber(speed) || speed < 0 || speed > 400)) errors.push('speed');
  if (heading != null && (!strictFiniteNumber(heading) || heading < 0 || heading >= 360)) errors.push('heading');

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, value: { observationId: observationId.toLowerCase(), latitude, longitude, accuracy, recordedAt, speed, heading } };
};

const distanceMeters = (first, second) => {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLatitude = radians(second.latitude - first.latitude);
  const deltaLongitude = radians(second.longitude - first.longitude);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude))
    * Math.sin(deltaLongitude / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const buildRouteSegments = (observations) => {
  const ordered = [...(observations || [])].sort(
    (first, second) => new Date(first.recordedAt) - new Date(second.recordedAt)
  );
  const segments = [];
  let segment = [];
  for (const observation of ordered) {
    if (Number(observation.accuracy) > MAX_ROUTE_ACCURACY_METERS) {
      if (segment.length > 0) segments.push(segment);
      segment = [];
      continue;
    }
    const previous = segment.at(-1);
    const elapsedMs = previous ? new Date(observation.recordedAt) - new Date(previous.recordedAt) : 0;
    const jump = previous ? distanceMeters(previous, observation) : 0;
    const impliedSpeed = elapsedMs > 0 ? jump / (elapsedMs / 1000) : Number.POSITIVE_INFINITY;
    if (previous && (
      elapsedMs <= 0 || elapsedMs > MAX_ROUTE_GAP_MS || jump > MAX_ROUTE_JUMP_METERS
      || impliedSpeed > MAX_ROUTE_IMPLIED_SPEED_MPS
    )) {
      segments.push(segment);
      segment = [];
    }
    segment.push(observation);
  }
  if (segment.length > 0) segments.push(segment);
  return segments;
};

export const serializeObservation = (observation) => ({
  id: String(observation._id || observation.id), observationId: observation.observationId,
  latitude: observation.latitude, longitude: observation.longitude, accuracy: observation.accuracy,
  recordedAt: new Date(observation.recordedAt).toISOString(),
  receivedAt: new Date(observation.receivedAt).toISOString(),
  speed: observation.speed ?? null, heading: observation.heading ?? null,
  lowAccuracy: Number(observation.accuracy) > LOW_ACCURACY_METERS
});

export const getGuardianRetention = async (guardianUserId, now = new Date(), timeZone = DEFAULT_TRACKING_TIME_ZONE) => {
  const premium = await isUserPremium(guardianUserId);
  return { premium, ...getRetentionWindow(premium, now, timeZone) };
};

export const hasActiveGuardian = async (studentUserId) => {
  const relationship = await ParentStudent.findOne({ studentUserId, relationshipStatus: 'ACTIVE' }).select('_id').lean();
  return Boolean(relationship);
};

export const disableTrackingIfNoActiveGuardians = async (studentUserId) => {
  if (await hasActiveGuardian(studentUserId)) return false;
  await StudentTrackingSetting.updateOne(
    { studentUserId },
    { $set: { activationState: 'DISABLED', collectionEnabled: false, disabledReason: 'NO_ACTIVE_GUARDIAN', pausedAt: new Date() } }
  );
  return true;
};

export const cleanupStudentHistory = async (
  studentUserId,
  now = new Date(),
  { resolvePremiumUserIds = getActivePremiumUserIds } = {}
) => {
  const [activeLinks, setting] = await Promise.all([
    ParentStudent.find({ studentUserId, relationshipStatus: 'ACTIVE' }).select('parentUserId').lean(),
    StudentTrackingSetting.findOne({ studentUserId }).select('timeZone').lean()
  ]);
  let cutoff;
  if (activeLinks.length === 0) {
    cutoff = now;
    await disableTrackingIfNoActiveGuardians(studentUserId);
  } else {
    const guardianIds = activeLinks.map((link) => String(link.parentUserId));
    const premiumGuardianIds = await resolvePremiumUserIds(guardianIds);
    cutoff = getRetentionWindow(
      premiumGuardianIds.size > 0, now, normalizeTimeZone(setting?.timeZone)
    ).earliestInstant;
  }
  const expired = await StudentLocationObservation.find({ studentUserId, recordedAt: { $lt: cutoff } })
    .select('_id').sort({ recordedAt: 1 }).limit(RETENTION_DELETE_BATCH_SIZE).lean();
  if (expired.length === 0) return { deletedCount: 0, hasMore: false };
  const result = await StudentLocationObservation.deleteMany({ _id: { $in: expired.map((row) => row._id) } });
  return { deletedCount: result.deletedCount || 0, hasMore: expired.length === RETENTION_DELETE_BATCH_SIZE };
};

let retentionWorkerTimer = null;
let retentionWorkerRunning = false;
let retentionScanCursor = null;

export const runFamilyTrackingRetentionPass = async (now = new Date()) => {
  if (retentionWorkerRunning) return { skipped: true, processedStudents: 0, deletedCount: 0, failures: 0 };
  retentionWorkerRunning = true;
  const summary = { skipped: false, processedStudents: 0, deletedCount: 0, failures: 0 };
  try {
    const freeCutoff = getRetentionWindow(false, now, DEFAULT_TRACKING_TIME_ZONE).earliestInstant;
    const candidateFilter = { recordedAt: { $lt: freeCutoff } };
    if (retentionScanCursor) candidateFilter._id = { $gt: retentionScanCursor };
    let candidates = await StudentLocationObservation.find(candidateFilter)
      .select('studentUserId').sort({ _id: 1 }).limit(RETENTION_STUDENT_BATCH_SIZE * 5).lean();
    if (candidates.length === 0 && retentionScanCursor) {
      retentionScanCursor = null;
      candidates = await StudentLocationObservation.find({ recordedAt: { $lt: freeCutoff } })
        .select('studentUserId').sort({ _id: 1 }).limit(RETENTION_STUDENT_BATCH_SIZE * 5).lean();
    }
    retentionScanCursor = candidates.at(-1)?._id || null;
    const studentIds = [...new Set(candidates.map((row) => String(row.studentUserId)))].slice(0, RETENTION_STUDENT_BATCH_SIZE);
    for (const studentUserId of studentIds) {
      try {
        const result = await cleanupStudentHistory(studentUserId, now);
        summary.processedStudents += 1;
        summary.deletedCount += result.deletedCount;
      } catch (error) {
        summary.failures += 1;
        console.error('[FamilyTrackingRetention] Student cleanup failed', { studentUserId, error: error.message });
      }
    }
    console.info('[FamilyTrackingRetention] Pass complete', summary);
    return summary;
  } finally {
    retentionWorkerRunning = false;
  }
};

export const startFamilyTrackingRetentionWorker = (intervalMs = 60 * 60 * 1000) => {
  if (retentionWorkerTimer || process.env.NODE_ENV === 'test') return retentionWorkerTimer;
  const run = () => runFamilyTrackingRetentionPass().catch((error) => {
    console.error('[FamilyTrackingRetention] Pass failed', { error: error.message });
  });
  retentionWorkerTimer = setInterval(run, intervalMs);
  retentionWorkerTimer.unref?.();
  run();
  return retentionWorkerTimer;
};
