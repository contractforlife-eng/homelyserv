import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReportValidationError,
  validateMessageReport,
  validateUserReport,
} from './reportValidationService.js';

const reporterId = '507f1f77bcf86cd799439011';
const peerId = '507f1f77bcf86cd799439012';
const thirdPartyId = '507f1f77bcf86cd799439013';
const conversationId = 'conv_507f1f77bcf86cd799439011_507f1f77bcf86cd799439012';
const messageId = '507f1f77bcf86cd799439014';

const makeDependencies = ({ participants = [reporterId, peerId], conversationType = 'PRIVATE', message = null } = {}) => ({
  conversationModel: { findOne: async () => ({ type: conversationType, participantIds: participants }) },
  prismaClient: {
    user: {
      findMany: async () => participants.map((id) => ({ id, role: id === reporterId ? 'WORKER' : 'EMPLOYER' })),
    },
  },
  accessChecker: async () => true,
  messageModel: { findById: () => ({ lean: async () => message }) },
});

test('accepts a Worker report of the actual Employer peer', async () => {
  const result = await validateUserReport({
    reporterId,
    reporterRole: 'WORKER',
    conversationId,
    reportedUserId: peerId,
    ...makeDependencies(),
  });
  assert.equal(result.reportedUserId, peerId);
});

test('rejects self and arbitrary third-party user reports', async () => {
  for (const reportedUserId of [reporterId, thirdPartyId]) {
    await assert.rejects(
      validateUserReport({ reporterId, reporterRole: 'WORKER', conversationId, reportedUserId, ...makeDependencies() }),
      (error) => error instanceof ReportValidationError && error.statusCode === 403,
    );
  }
});

test('rejects a non-participant conversation', async () => {
  await assert.rejects(
    validateUserReport({
      reporterId,
      reporterRole: 'WORKER',
      conversationId,
      reportedUserId: peerId,
      ...makeDependencies({ participants: [peerId, thirdPartyId] }),
    }),
    (error) => error instanceof ReportValidationError && error.statusCode === 403,
  );
});

test('accepts a received peer message and derives the reported user', async () => {
  const result = await validateMessageReport({
    reporterId,
    reporterRole: 'WORKER',
    conversationId,
    messageId,
    ...makeDependencies({ message: { _id: messageId, conversationId, senderId: peerId, recipientId: reporterId } }),
  });
  assert.equal(result.reportedUserId, peerId);
});

test('rejects a cross-conversation or self-authored message', async () => {
  await assert.rejects(
    validateMessageReport({
      reporterId,
      reporterRole: 'WORKER',
      conversationId,
      messageId,
      ...makeDependencies({ message: { _id: messageId, conversationId: 'other-conversation', senderId: peerId, recipientId: reporterId } }),
    }),
    (error) => error instanceof ReportValidationError && error.statusCode === 403,
  );

  await assert.rejects(
    validateMessageReport({
      reporterId,
      reporterRole: 'WORKER',
      conversationId,
      messageId,
      ...makeDependencies({ message: { _id: messageId, conversationId, senderId: reporterId, recipientId: peerId } }),
    }),
    (error) => error instanceof ReportValidationError && error.statusCode === 403,
  );
});
