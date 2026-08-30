import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { login } from './authController.js';

process.env.JWT_SECRET = 'auth-suspension-test-secret-value-2026';

const responseFor = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const requestFor = (email = 'member@example.com') => ({
  body: { email, password: 'correct-password' }
});

test('active user can log in and receives a JWT', async () => {
  const originalFindOne = User.findOne;
  const password = await bcrypt.hash('correct-password', 4);
  const user = {
    _id: '507f1f77bcf86cd799439011',
    email: 'member@example.com',
    password,
    role: 'WORKER',
    isSuspended: false,
    tokenVersion: 0,
    save: async () => {},
    toObject() { return { ...this }; }
  };
  User.findOne = async () => user;

  try {
    const response = responseFor();
    await login(requestFor(), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.token);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('suspended user receives 403 ACCOUNT_SUSPENDED without a JWT', async () => {
  const originalFindOne = User.findOne;
  const password = await bcrypt.hash('correct-password', 4);
  const user = {
    _id: '507f1f77bcf86cd799439011',
    email: 'member@example.com',
    password,
    role: 'WORKER',
    isSuspended: true,
    tokenVersion: 0,
    save: async () => {},
    toObject() { return { ...this }; }
  };
  User.findOne = async () => user;

  try {
    const response = responseFor();
    await login(requestFor(), response);
    assert.equal(response.statusCode, 403);
    assert.equal(response.body.code, 'ACCOUNT_SUSPENDED');
    assert.equal(response.body.token, undefined);
  } finally {
    User.findOne = originalFindOne;
  }
});
