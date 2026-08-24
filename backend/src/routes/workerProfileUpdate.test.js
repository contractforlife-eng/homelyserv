import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import workersRouter from './workers.js';

const secret = 'worker-profile-update-test-secret-value-2026';
process.env.JWT_SECRET = secret;

const originalUserMethods = {
  findById: User.findById,
  findByIdAndUpdate: User.findByIdAndUpdate,
};
const originalPrismaMethods = {
  findUnique: prisma.workerProfile.findUnique,
  create: prisma.workerProfile.create,
};

const makeHarness = ({
  id = 'legacy-worker-profile-test',
  role = 'WORKER',
  desiredJob = '',
  existingProfile = null,
  createError = null,
} = {}) => {
  const state = {
    id,
    role,
    desiredJob,
    existingProfile,
    createdProfiles: [],
    capturedUpdates: [],
  };

  User.findById = () => ({
    select: async () => ({
      desiredJob: state.desiredJob,
      tutorSpecialization: '',
    }),
  });
  User.findByIdAndUpdate = (userId, update, options) => {
    state.capturedUpdates.push({ userId, update, options });
    return {
      select: async () => ({
        role: state.role,
        desiredJob: Object.prototype.hasOwnProperty.call(update.$set, 'desiredJob')
          ? update.$set.desiredJob
          : state.desiredJob,
        profileImage: '',
        _id: userId,
        toObject: () => ({
          _id: userId,
          role: state.role,
          desiredJob: Object.prototype.hasOwnProperty.call(update.$set, 'desiredJob')
            ? update.$set.desiredJob
            : state.desiredJob,
          profileImage: '',
        }),
      }),
    };
  };

  prisma.workerProfile.findUnique = async () => state.existingProfile;
  prisma.workerProfile.create = async ({ data }) => {
    if (createError) throw createError;
    state.createdProfiles.push(data);
    state.existingProfile = data;
    return data;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/workers', workersRouter);
  const server = app.listen(0);
  const listening = new Promise((resolve) => server.once('listening', resolve));

  const restore = () => {
    User.findById = originalUserMethods.findById;
    User.findByIdAndUpdate = originalUserMethods.findByIdAndUpdate;
    prisma.workerProfile.findUnique = originalPrismaMethods.findUnique;
    prisma.workerProfile.create = originalPrismaMethods.create;
  };

  const request = async (body = {}) => {
    await listening;
    const token = jwt.sign({ userId: id, role, tokenVersion: 0 }, secret);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/workers/profile/${id}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { response, body: await response.json() };
  };

  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    restore();
  };

  return { state, request, close };
};

test('valid canonical Worker job creates exactly one WorkerProfile and preserves response shape', async () => {
  const harness = makeHarness();
  try {
    const { response, body } = await harness.request({
      fullName: 'Saved Worker',
      location: 'Giza',
      desiredJob: 'nanny',
      registrationIp: '8.8.8.8',
      registrationCountryCode: 'US',
      registrationCountryName: 'Fake',
      registrationLocationCapturedAt: '2000-01-01T00:00:00.000Z',
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.user);
    assert.deepEqual(harness.state.capturedUpdates[0].update, {
      $set: { fullName: 'Saved Worker', location: 'Giza', desiredJob: 'nanny' },
    });
    assert.equal(harness.state.capturedUpdates[0].options.runValidators, true);
    assert.equal(harness.state.createdProfiles.length, 1);
    assert.equal(harness.state.createdProfiles[0].userId, harness.state.id);
    assert.equal(harness.state.createdProfiles[0].category, 'nanny');
  } finally {
    await harness.close();
  }
});

test('saving the same Worker profile again does not create a duplicate', async () => {
  const harness = makeHarness();
  try {
    await harness.request({ desiredJob: 'nanny' });
    const second = await harness.request({ desiredJob: 'nanny' });

    assert.equal(second.response.status, 200);
    assert.equal(harness.state.createdProfiles.length, 1);
  } finally {
    await harness.close();
  }
});

test('existing WorkerProfile is untouched', async () => {
  const existingProfile = {
    id: 'existing-profile',
    userId: 'legacy-worker-profile-test',
    category: 'cook',
    availability: 'unavailable',
    activelyLooking: true,
    isVisible: false,
    skills: ['existing-skill'],
  };
  const harness = makeHarness({ desiredJob: 'nanny', existingProfile });
  try {
    const { response } = await harness.request({ desiredJob: 'nanny' });

    assert.equal(response.status, 200);
    assert.equal(harness.state.createdProfiles.length, 0);
    assert.deepEqual(harness.state.existingProfile, existingProfile);
  } finally {
    await harness.close();
  }
});

test('missing desiredJob saves User fields but does not create WorkerProfile', async () => {
  const harness = makeHarness();
  try {
    const { response } = await harness.request({ fullName: 'Saved Worker' });

    assert.equal(response.status, 200);
    assert.equal(harness.state.createdProfiles.length, 0);
  } finally {
    await harness.close();
  }
});

test('invalid desiredJob saves User fields but does not create WorkerProfile', async () => {
  const harness = makeHarness();
  try {
    const { response } = await harness.request({ desiredJob: 'unsupported-job' });

    assert.equal(response.status, 200);
    assert.equal(harness.state.createdProfiles.length, 0);
  } finally {
    await harness.close();
  }
});

test('EMPLOYER profile update does not create WorkerProfile', async () => {
  const harness = makeHarness({ role: 'EMPLOYER' });
  try {
    const { response } = await harness.request({ desiredJob: 'nanny' });

    assert.equal(response.status, 200);
    assert.equal(harness.state.createdProfiles.length, 0);
  } finally {
    await harness.close();
  }
});

test('self-heal defaults activelyLooking to false and availability to available', async () => {
  const harness = makeHarness();
  try {
    await harness.request({ desiredJob: 'nurse' });

    const created = harness.state.createdProfiles[0];
    assert.equal(created.activelyLooking, false);
    assert.equal(created.availability, 'available');
    assert.equal(created.isVisible, true);
  } finally {
    await harness.close();
  }
});

test('self-heal does not introduce Premium behavior or request-controlled flags', async () => {
  const harness = makeHarness();
  try {
    await harness.request({ desiredJob: 'cook', activelyLooking: true, availability: 'unavailable' });

    const created = harness.state.createdProfiles[0];
    assert.equal(Object.hasOwn(created, 'premium'), false);
    assert.equal(created.activelyLooking, false);
    assert.equal(created.availability, 'available');
  } finally {
    await harness.close();
  }
});

test('self-heal failure surfaces through existing error handling after User save', async () => {
  const harness = makeHarness({ createError: new Error('profile create failed') });
  try {
    const { response, body } = await harness.request({ desiredJob: 'nanny' });

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(harness.state.capturedUpdates.length, 1);
  } finally {
    await harness.close();
  }
});
