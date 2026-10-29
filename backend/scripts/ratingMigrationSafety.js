import crypto from 'node:crypto';

const FORBIDDEN_DATABASES = new Set(['admin', 'config', 'local', 'homelyserv', 'production', 'prod']);
export const ISOLATION_GUARD_COLLECTION = '_homelyservDestructiveTestGuard';
export const ISOLATION_GUARD_PURPOSE = 'rating-migration-destructive-test';

export function validateDestructiveTestConfig(env = process.env) {
  if (env.ALLOW_DESTRUCTIVE_RATING_MIGRATION_TEST !== 'yes-delete-dedicated-test-db') throw new Error('Explicit destructive-test opt-in is required');
  let parsed;
  try { parsed = new URL(env.DATABASE_URL); } catch { throw new Error('DATABASE_URL must be a valid MongoDB URL'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) throw new Error('DATABASE_URL must use MongoDB');
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, '')).split('/')[0];
  if (!databaseName || FORBIDDEN_DATABASES.has(databaseName.toLowerCase()) || !/^[a-z0-9_-]+_rating_migration_test$/i.test(databaseName)) throw new Error('DATABASE_URL must identify a dedicated *_rating_migration_test database');
  if (env.RATING_MIGRATION_TEST_DATABASE !== databaseName) throw new Error('RATING_MIGRATION_TEST_DATABASE must exactly match the URL database');
  if (typeof env.RATING_MIGRATION_TEST_ISOLATION_TOKEN !== 'string' || env.RATING_MIGRATION_TEST_ISOLATION_TOKEN.length < 32) throw new Error('A strong database isolation token is required');
  return { connectionString: env.DATABASE_URL, databaseName, isolationToken: env.RATING_MIGRATION_TEST_ISOLATION_TOKEN };
}

export async function assertDatabaseIsolation(db, isolationToken) {
  const marker = await db.collection(ISOLATION_GUARD_COLLECTION).findOne({ purpose: ISOLATION_GUARD_PURPOSE });
  const expected = crypto.createHash('sha256').update(isolationToken).digest('hex');
  const actual = typeof marker?.tokenHash === 'string' ? marker.tokenHash : '';
  if (actual.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    throw new Error('Database isolation marker is missing or does not match');
  }
  return true;
}

export async function recreateDatabaseIsolationMarker(db, isolationToken) {
  return db.collection(ISOLATION_GUARD_COLLECTION).insertOne({
    purpose: ISOLATION_GUARD_PURPOSE,
    tokenHash: crypto.createHash('sha256').update(isolationToken).digest('hex'),
  });
}

export function getPrismaPushInvocation(backendDirectory, platform = process.platform) {
  return {
    file: new URL(`./node_modules/.bin/prisma${platform === 'win32' ? '.cmd' : ''}`, `file:///${backendDirectory.replace(/\\/g, '/')}/`).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1)),
    args: ['db', 'push', '--skip-generate', '--accept-data-loss'],
    options: { shell: false },
  };
}
