import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailSenderIdentity, getEmailFromName, getEmailFromAddress } from './emailSender.js';

const restore = (key, value) => value === undefined ? delete process.env[key] : process.env[key] = value;

test('maps known HomelyServ sender addresses to their distinct display names', () => {
  const original = { from: process.env.EMAIL_FROM, user: process.env.EMAIL_USER, name: process.env.EMAIL_FROM_NAME };
  delete process.env.EMAIL_FROM_NAME;

  assert.equal(buildEmailSenderIdentity('support@homelyserv.com'), '"HomelyServ Support" <support@homelyserv.com>');
  assert.equal(buildEmailSenderIdentity('noreply@homelyserv.com'), '"HomelyServ Noreply" <noreply@homelyserv.com>');
  assert.equal(buildEmailSenderIdentity('contact@homelyserv.com'), '"HomelyServ Contact" <contact@homelyserv.com>');
  assert.equal(buildEmailSenderIdentity('emad@homelyserv.com'), '"HomelyServ Owner" <emad@homelyserv.com>');
  assert.equal(buildEmailSenderIdentity('info@homelyserv.com'), '"HomelyServ Info" <info@homelyserv.com>');

  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});

test('uses the configured From address from env if none passed to function', () => {
  const original = { from: process.env.EMAIL_FROM, user: process.env.EMAIL_USER, name: process.env.EMAIL_FROM_NAME };
  process.env.EMAIL_USER = 'emad@homelyserv.com';
  process.env.EMAIL_FROM = 'noreply@homelyserv.com';
  delete process.env.EMAIL_FROM_NAME;

  assert.equal(buildEmailSenderIdentity(), '"HomelyServ Noreply" <noreply@homelyserv.com>');

  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});

test('EMAIL_FROM_NAME override takes precedence when explicitly configured', () => {
  const original = { from: process.env.EMAIL_FROM, user: process.env.EMAIL_USER, name: process.env.EMAIL_FROM_NAME };
  process.env.EMAIL_USER = 'emad@homelyserv.com';
  delete process.env.EMAIL_FROM;
  process.env.EMAIL_FROM_NAME = 'Custom Name';

  assert.equal(buildEmailSenderIdentity(), '"Custom Name" <emad@homelyserv.com>');

  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});

test('supports custom display name for verification emails without altering standard noreply sender', () => {
  const original = { from: process.env.EMAIL_FROM, user: process.env.EMAIL_USER, name: process.env.EMAIL_FROM_NAME };
  delete process.env.EMAIL_FROM_NAME;
  process.env.EMAIL_FROM = 'noreply@homelyserv.com';

  // Verification sender
  assert.equal(
    buildEmailSenderIdentity('noreply@homelyserv.com', 'HomelyServ Verified Registration'),
    '"HomelyServ Verified Registration" <noreply@homelyserv.com>'
  );

  // Verification sender when address omitted (resolves from env)
  assert.equal(
    buildEmailSenderIdentity(undefined, 'HomelyServ Verified Registration'),
    '"HomelyServ Verified Registration" <noreply@homelyserv.com>'
  );

  // Normal Noreply sender remains unchanged
  assert.equal(
    buildEmailSenderIdentity('noreply@homelyserv.com'),
    '"HomelyServ Noreply" <noreply@homelyserv.com>'
  );

  assert.equal(
    buildEmailSenderIdentity(),
    '"HomelyServ Noreply" <noreply@homelyserv.com>'
  );

  restore('EMAIL_USER', original.user);
  restore('EMAIL_FROM', original.from);
  restore('EMAIL_FROM_NAME', original.name);
});


