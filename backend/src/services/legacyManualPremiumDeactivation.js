import prisma from '../lib/prisma.js';

export const LEGACY_MANUAL_PLAN = 'manual';

const LEGACY_SELECT = {
  id: true,
  userId: true,
  plan: true,
  amount: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
};

const GRANT_SELECT = {
  id: true,
  userId: true,
  status: true,
  startDate: true,
  endDate: true,
  adminId: true,
  createdAt: true,
  updatedAt: true,
};

const toDate = (value, label) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Malformed ${label}`);
  return date;
};

const safeDate = (value) => {
  try {
    return toDate(value, 'date');
  } catch {
    return null;
  }
};

const describeGrant = (grant) => grant ? {
  grantId: grant.id,
  grantStatus: grant.status,
  grantEndDate: grant.endDate,
} : {
  grantId: null,
  grantStatus: null,
  grantEndDate: null,
};

export const classifyLegacyManualDeactivation = (legacy, matchingGrants, now = new Date()) => {
  const base = {
    userId: legacy?.userId ? String(legacy.userId) : null,
    legacyId: legacy?.id || null,
    legacyStatus: legacy?.status || null,
    legacyEndDate: legacy?.endDate || null,
    action: 'SKIP_UNSAFE',
    reason: null,
    ...describeGrant(matchingGrants?.length === 1 ? matchingGrants[0] : null),
  };

  if (!legacy || legacy.plan !== LEGACY_MANUAL_PLAN || !legacy.userId || !legacy.id) {
    return { ...base, reason: 'MALFORMED_OR_NON_MANUAL_LEGACY_ROW' };
  }
  if (!['active', 'inactive'].includes(legacy.status)) {
    return { ...base, reason: 'UNSUPPORTED_LEGACY_STATUS' };
  }

  const legacyEndDate = safeDate(legacy.endDate);
  if (!legacyEndDate) return { ...base, reason: 'MALFORMED_LEGACY_END_DATE' };
  base.legacyEndDate = legacyEndDate;

  if (legacy.status === 'inactive') {
    return { ...base, action: 'ALREADY_INACTIVE' };
  }

  if (!Array.isArray(matchingGrants) || matchingGrants.length === 0) {
    return { ...base, reason: 'MISSING_GRANT', action: 'SKIP_MISSING_GRANT' };
  }
  if (matchingGrants.length !== 1) {
    return { ...base, reason: 'DUPLICATE_GRANTS', action: 'SKIP_UNSAFE' };
  }

  const grant = matchingGrants[0];
  const grantEndDate = safeDate(grant.endDate);
  if (!grant.userId || String(grant.userId) !== String(legacy.userId)
    || !['active', 'inactive'].includes(grant.status) || !grantEndDate) {
    return { ...base, ...describeGrant(grant), reason: 'MALFORMED_GRANT', action: 'SKIP_GRANT_MISMATCH' };
  }
  base.grantId = grant.id;
  base.grantStatus = grant.status;
  base.grantEndDate = grantEndDate;

  if (grantEndDate < legacyEndDate) {
    return { ...base, reason: 'GRANT_END_DATE_EARLIER_THAN_LEGACY', action: 'SKIP_GRANT_MISMATCH' };
  }

  const referenceNow = toDate(now, 'migration time');
  const legacyCurrentlyValid = legacyEndDate > referenceNow;
  if (legacyCurrentlyValid && (grant.status !== 'active' || grantEndDate <= referenceNow)) {
    return { ...base, reason: 'GRANT_DOES_NOT_PRESERVE_ACTIVE_ENTITLEMENT', action: 'SKIP_GRANT_MISMATCH' };
  }

  return {
    ...base,
    action: 'WOULD_DEACTIVATE',
    reason: legacyCurrentlyValid ? 'VALID_ACTIVE_LEGACY' : 'EXPIRED_ACTIVE_LEGACY',
  };
};

const readInputs = async (db) => {
  const legacyRows = await db.subscription.findMany({
    where: { plan: LEGACY_MANUAL_PLAN },
    select: LEGACY_SELECT,
    orderBy: { createdAt: 'asc' },
  });
  const userIds = [...new Set(legacyRows.map((row) => String(row.userId)).filter(Boolean))];
  const grants = userIds.length === 0 ? [] : await db.manualPremiumGrant.findMany({
    where: { userId: { in: userIds } },
    select: GRANT_SELECT,
  });
  const grantsByUser = new Map();
  for (const grant of grants) {
    const id = String(grant.userId);
    const existing = grantsByUser.get(id) || [];
    existing.push(grant);
    grantsByUser.set(id, existing);
  }
  return { legacyRows, grantsByUser };
};

export const inspectLegacyManualDeactivation = async ({ db = prisma, now = new Date() } = {}) => {
  const { legacyRows, grantsByUser } = await readInputs(db);
  const evaluations = legacyRows.map((legacy) => classifyLegacyManualDeactivation(
    legacy,
    grantsByUser.get(String(legacy.userId)) || [],
    now,
  ));
  return { legacyRows, evaluations };
};

export const deactivateLegacyManualPremium = async ({
  db = prisma,
  dryRun = true,
  now = new Date(),
  log = () => {},
} = {}) => {
  const { evaluations } = await inspectLegacyManualDeactivation({ db, now });
  const summary = {
    dryRun,
    legacyRows: evaluations.length,
    activeLegacyRows: evaluations.filter((row) => row.legacyStatus === 'active').length,
    alreadyInactive: evaluations.filter((row) => row.action === 'ALREADY_INACTIVE').length,
    wouldDeactivate: evaluations.filter((row) => row.action === 'WOULD_DEACTIVATE').length,
    skipped: evaluations.filter((row) => row.action.startsWith('SKIP_')).length,
    errors: 0,
  };

  for (const evaluation of evaluations) {
    log(evaluation);
    if (dryRun || evaluation.action !== 'WOULD_DEACTIVATE') continue;

    try {
      const result = await db.subscription.updateMany({
        where: {
          id: evaluation.legacyId,
          plan: LEGACY_MANUAL_PLAN,
          status: 'active',
        },
        data: { status: 'inactive' },
      });
      if (result.count !== 1) {
        summary.errors += 1;
        log({ ...evaluation, action: 'SKIP_UNSAFE', reason: 'LEGACY_ROW_CHANGED_BEFORE_UPDATE' });
      }
    } catch (error) {
      summary.errors += 1;
      log({ ...evaluation, action: 'SKIP_UNSAFE', reason: 'UPDATE_FAILED', error: error.message });
    }
  }

  return summary;
};

