import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureWorkerProfile } from './workerProfileService.js';

const makeDb = ({ existing = null, created = null, createError = null } = {}) => {
  const calls = { find: [], create: [] };
  return {
    calls,
    workerProfile: {
      findUnique: async (args) => {
        calls.find.push(args);
        return existing;
      },
      create: async (args) => {
        calls.create.push(args);
        if (createError) throw createError;
        return created || args.data;
      }
    }
  };
};

test('creates one canonical visible profile with safe defaults', async () => {
  const db = makeDb();
  const profile = await ensureWorkerProfile({
    id: 'worker-1',
    role: 'WORKER',
    desiredJob: 'nanny',
    profileImage: 'https://example.test/profile.png'
  }, { db });

  assert.equal(db.calls.find.length, 1);
  assert.equal(db.calls.create.length, 1);
  assert.equal(profile.userId, 'worker-1');
  assert.equal(profile.category, 'nanny');
  assert.equal(profile.profilePhotoUrl, 'https://example.test/profile.png');
  assert.deepEqual(profile.skills, []);
  assert.equal(profile.experienceYears, 0);
  assert.equal(profile.expectedSalary, 0);
  assert.equal(profile.availability, 'available');
  assert.equal(profile.activelyLooking, false);
  assert.equal(profile.isVisible, true);
});

test('returns an existing profile without creating or overwriting it', async () => {
  const existing = {
    id: 'profile-1',
    userId: 'worker-1',
    category: 'existing-category',
    skills: ['existing-skill'],
    activelyLooking: true,
    isVisible: false
  };
  const db = makeDb({ existing });

  const profile = await ensureWorkerProfile({
    id: 'worker-1',
    role: 'WORKER',
    desiredJob: 'nanny'
  }, { db });

  assert.strictEqual(profile, existing);
  assert.equal(db.calls.create.length, 0);
});

test('returns the concurrent profile after a unique-key race', async () => {
  const concurrent = { id: 'profile-1', userId: 'worker-1' };
  const db = makeDb({ createError: { code: 'P2002' } });
  db.workerProfile.findUnique = async (args) => {
    db.calls.find.push(args);
    return db.calls.find.length > 1 ? concurrent : null;
  };

  const profile = await ensureWorkerProfile({ id: 'worker-1', role: 'WORKER' }, { db });

  assert.strictEqual(profile, concurrent);
  assert.equal(db.calls.create.length, 1);
  assert.equal(db.calls.find.length, 2);
});

test('rejects non-Worker users before database access', async () => {
  const db = makeDb();

  await assert.rejects(
    ensureWorkerProfile({ id: 'employer-1', role: 'EMPLOYER' }, { db }),
    /requires a WORKER user/
  );
  assert.equal(db.calls.find.length, 0);
  assert.equal(db.calls.create.length, 0);
});
