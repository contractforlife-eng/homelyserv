import test from 'node:test';
import assert from 'node:assert/strict';
import { getCanonicalUrl } from './canonicalUrl.js';
import { isTrustedComplaintAttachmentUrl } from './complaintAttachments.js';

test('canonical URL accepts HomelyServ paths and rejects foreign origins', () => {
  assert.equal(getCanonicalUrl('teachers/abc'), 'https://www.homelyserv.com/teachers/abc');
  assert.equal(getCanonicalUrl('/doctors/abc?tab=1'), 'https://www.homelyserv.com/doctors/abc?tab=1');
  assert.equal(getCanonicalUrl('https://evil.example/x'), 'https://www.homelyserv.com/');
  assert.equal(getCanonicalUrl('http://www.homelyserv.com/x'), 'https://www.homelyserv.com/');
});

test('frontend attachment validation matches the trusted Cloudinary path', () => {
  assert.equal(isTrustedComplaintAttachmentUrl('https://res.cloudinary.com/homelyserv/image/upload/v1/homelyserv/complaints/a.jpg'), true);
  assert.equal(isTrustedComplaintAttachmentUrl('https://res.cloudinary.com/evil/image/upload/v1/homelyserv/complaints/a.jpg'), false);
  assert.equal(isTrustedComplaintAttachmentUrl('capacitor://localhost/_capacitor_http_interceptor_/x'), false);
});
