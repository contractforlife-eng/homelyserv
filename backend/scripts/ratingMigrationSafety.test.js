import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { assertDatabaseIsolation, getPrismaPushInvocation, recreateDatabaseIsolationMarker, validateDestructiveTestConfig } from './ratingMigrationSafety.js';

const valid = { DATABASE_URL: 'mongodb://127.0.0.1:27017/homelyserv_rating_migration_test', RATING_MIGRATION_TEST_DATABASE: 'homelyserv_rating_migration_test', RATING_MIGRATION_TEST_ISOLATION_TOKEN: 'a'.repeat(32), ALLOW_DESTRUCTIVE_RATING_MIGRATION_TEST: 'yes-delete-dedicated-test-db' };
test('requires explicit opt-in and exact isolated database identity', () => {
  assert.throws(() => validateDestructiveTestConfig({ ...valid, ALLOW_DESTRUCTIVE_RATING_MIGRATION_TEST: '' }), /opt-in/);
  assert.throws(() => validateDestructiveTestConfig({ ...valid, DATABASE_URL: 'mongodb://localhost/homelyserv', RATING_MIGRATION_TEST_DATABASE: 'homelyserv' }), /dedicated/);
  assert.throws(() => validateDestructiveTestConfig({ ...valid, RATING_MIGRATION_TEST_DATABASE: 'different_rating_migration_test' }), /exactly match/);
  assert.deepEqual(validateDestructiveTestConfig(valid), { connectionString: valid.DATABASE_URL, databaseName: 'homelyserv_rating_migration_test', isolationToken: valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN });
});

test('requires a matching database-side isolation marker', async () => {
  const tokenHash = crypto.createHash('sha256').update(valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN).digest('hex');
  const db = { collection: () => ({ findOne: async () => ({ purpose: 'rating-migration-destructive-test', tokenHash }) }) };
  assert.equal(await assertDatabaseIsolation(db, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN), true);
  await assert.rejects(() => assertDatabaseIsolation({ collection: () => ({ findOne: async () => null }) }, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN), /marker/);
  await assert.rejects(() => assertDatabaseIsolation(db, 'b'.repeat(32)), /marker/);
});

test('drop lifecycle requires explicit marker recreation before later destructive steps', async () => {
  let marker = { purpose: 'rating-migration-destructive-test', tokenHash: crypto.createHash('sha256').update(valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN).digest('hex') };
  const db = { collection: () => ({ findOne: async () => marker, insertOne: async (document) => { marker = document; } }) };
  await assertDatabaseIsolation(db, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN);
  marker = null; // dropDatabase removes the guard collection
  await assert.rejects(() => assertDatabaseIsolation(db, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN), /marker/);
  await recreateDatabaseIsolationMarker(db, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN);
  assert.equal(await assertDatabaseIsolation(db, valid.RATING_MIGRATION_TEST_ISOLATION_TOKEN), true);
});

test('uses the installed Prisma executable with argument arrays and no shell', () => {
  const invocation = getPrismaPushInvocation('D:/repo/backend', 'win32');
  assert.match(invocation.file, /node_modules\/\.bin\/prisma\.cmd$/);
  assert.deepEqual(invocation.args, ['db', 'push', '--skip-generate', '--accept-data-loss']);
  assert.equal(invocation.options.shell, false);
});
