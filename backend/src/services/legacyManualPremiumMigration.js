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

const asDate = (value, label) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Malformed ${label}`);
  return date;
};

const validateLegacyRow = (row) => {
  if (!row || !row.userId || row.plan !== LEGACY_MANUAL_PLAN) {
    throw new Error(`Malformed legacy manual Subscription row: ${row?.id || 'unknown'}`);
  }
  if (!['active', 'inactive'].includes(row.status)) {
    throw new Error(`Unsupported legacy manual status for ${row.id}: ${row.status}`);
  }
  return {
    ...row,
    userId: String(row.userId),
    startDate: asDate(row.startDate, `startDate for ${row.id}`),
    endDate: asDate(row.endDate, `endDate for ${row.id}`),
  };
};

const validateGrant = (grant) => {
  if (!grant || !grant.userId) throw new Error('Malformed ManualPremiumGrant row');
  if (!['active', 'inactive'].includes(grant.status)) {
    throw new Error(`Unsupported ManualPremiumGrant status for ${grant.id}: ${grant.status}`);
  }
  return {
    ...grant,
    userId: String(grant.userId),
    startDate: asDate(grant.startDate, `grant startDate for ${grant.id}`),
    endDate: asDate(grant.endDate, `grant endDate for ${grant.id}`),
  };
};

const laterDate = (left, right) => (left > right ? left : right);

/**
 * Derive one canonical grant state without mutating either source row.
 * Existing grant identity and known admin ownership are preserved.
 */
export const mergeLegacyManualGrant = (legacyRow, existingGrant, now = new Date()) => {
  const legacy = validateLegacyRow(legacyRow);
  const grant = existingGrant ? validateGrant(existingGrant) : null;
  const referenceNow = asDate(now, 'migration time');

  const legacyIsActive = legacy.status === 'active' && legacy.endDate > referenceNow;
  const grantIsActive = !!grant && grant.status === 'active' && grant.endDate > referenceNow;
  const status = legacyIsActive || grantIsActive ? 'active' : 'inactive';

  return {
    userId: legacy.userId,
    status,
    startDate: grant?.startDate || legacy.startDate,
    endDate: laterDate(legacy.endDate, grant?.endDate || legacy.endDate),
    // Legacy Subscription rows do not contain actor identity. Never invent it
    // and never replace an existing known grant owner with null.
    adminId: grant?.adminId ?? null,
    legacyId: legacy.id,
    existingGrantId: grant?.id || null,
  };
};

export const buildLegacyManualMigrationPlan = (legacyRows, grants, now = new Date()) => {
  const normalizedLegacy = legacyRows.map(validateLegacyRow);
  const seenUsers = new Set();
  for (const row of normalizedLegacy) {
    if (seenUsers.has(row.userId)) {
      throw new Error(`Duplicate legacy manual rows for user ${row.userId}; migration stopped`);
    }
    seenUsers.add(row.userId);
  }

  const grantsByUser = new Map();
  for (const grant of grants) {
    const normalized = validateGrant(grant);
    if (grantsByUser.has(normalized.userId)) {
      throw new Error(`Duplicate ManualPremiumGrant rows for user ${normalized.userId}; migration stopped`);
    }
    grantsByUser.set(normalized.userId, normalized);
  }

  return normalizedLegacy.map((legacy) => mergeLegacyManualGrant(
    legacy,
    grantsByUser.get(legacy.userId) || null,
    now,
  ));
};

const readMigrationInputs = async (db) => {
  const legacyRows = await db.subscription.findMany({
    where: { plan: LEGACY_MANUAL_PLAN },
    select: LEGACY_SELECT,
    orderBy: { createdAt: 'asc' },
  });
  const userIds = [...new Set(legacyRows.map((row) => String(row.userId)))];
  const grants = userIds.length === 0
    ? []
    : await db.manualPremiumGrant.findMany({
      where: { userId: { in: userIds } },
      select: GRANT_SELECT,
    });
  return { legacyRows, grants };
};

/**
 * B5A COPY/UPSERT migration. It never writes Subscription rows and is never
 * invoked automatically by application startup/build.
 */
export const migrateLegacyManualPremium = async ({
  db = prisma,
  dryRun = true,
  now = new Date(),
  log = () => {},
} = {}) => {
  const inputs = await readMigrationInputs(db);
  const plan = buildLegacyManualMigrationPlan(inputs.legacyRows, inputs.grants, now);

  const summary = {
    dryRun,
    legacyRows: plan.length,
    created: 0,
    merged: 0,
    active: plan.filter((row) => row.status === 'active').length,
    inactive: plan.filter((row) => row.status !== 'active').length,
  };

  for (const candidate of plan) {
    log({ type: 'candidate', ...candidate });
  }
  if (dryRun) return summary;

  for (const candidate of plan) {
    let grant;
    try {
      // The unique userId selector is the cross-instance duplicate boundary.
      grant = await db.manualPremiumGrant.upsert({
        where: { userId: candidate.userId },
        create: {
          userId: candidate.userId,
          status: candidate.status,
          startDate: candidate.startDate,
          endDate: candidate.endDate,
          adminId: candidate.adminId,
        },
        update: { updatedAt: new Date() },
      });
      if (!candidate.existingGrantId) summary.created += 1;
      else summary.merged += 1;
    } catch (error) {
      if (error?.code !== 'P2002') throw error;
      grant = await db.manualPremiumGrant.findUnique({ where: { userId: candidate.userId } });
      if (!grant) throw error;
      summary.merged += 1;
    }

    // Re-read before merging so retrying or overlapping runs use the latest
    // known admin/date state. Existing active grants are never downgraded by
    // an inactive/expired legacy row.
    const current = validateGrant(await db.manualPremiumGrant.findUnique({
      where: { userId: candidate.userId },
    }) || grant);
    const merged = mergeLegacyManualGrant(
      inputs.legacyRows.find((row) => String(row.userId) === candidate.userId),
      current,
      now,
    );

    await db.manualPremiumGrant.updateMany({
      where: { userId: candidate.userId, endDate: { lt: merged.endDate } },
      data: { endDate: merged.endDate },
    });

    const currentIsActive = current.status === 'active' && current.endDate > new Date(now);
    if (merged.status === 'active' || !currentIsActive) {
      await db.manualPremiumGrant.updateMany({
        where: { userId: candidate.userId },
        data: { status: merged.status },
      });
    }
  }

  return summary;
};
