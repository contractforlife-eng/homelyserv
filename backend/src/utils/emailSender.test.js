import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailSenderIdentity } from './emailSender.js';

const restore = (key, value) => value === undefined ? delete process.env[key] : process.env[key] = value;

test('uses the configured From address with the HomelyServ display name', () => {
  const original = { from:process.env.EMAIL_FROM, user:process.env.EMAIL_USER, name:process.env.EMAIL_FROM_NAME };
  process.env.EMAIL_USER = 'emad@homelyserv.com';
  process.env.EMAIL_FROM = 'noreply@homelyserv.com';
  delete process.env.EMAIL_FROM_NAME;
  assert.equal(buildEmailSenderIdentity(), '"HomelyServ" <noreply@homelyserv.com>');
  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});

test('supports a configured display name and falls back to the auth address', () => {
  const original = { from:process.env.EMAIL_FROM, user:process.env.EMAIL_USER, name:process.env.EMAIL_FROM_NAME };
  process.env.EMAIL_USER = 'emad@homelyserv.com';
  delete process.env.EMAIL_FROM;
  process.env.EMAIL_FROM_NAME = 'HomelyServ Mail';
  assert.equal(buildEmailSenderIdentity(), '"HomelyServ Mail" <emad@homelyserv.com>');
  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});
