import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeReturnPath, sanitizeMarketplaceListReturnPath } from './safeReturnPath.js';

test('allows internal marketplace listing return paths', () => {
  assert.equal(sanitizeReturnPath('/marketplace/507f1f77bcf86cd799439011?shared=1'), '/marketplace/507f1f77bcf86cd799439011?shared=1');
});

test('allows internal wall post return paths with query and hash', () => {
  assert.equal(sanitizeReturnPath('/wall?post=507f1f77bcf86cd799439011'), '/wall?post=507f1f77bcf86cd799439011');
  assert.equal(sanitizeReturnPath('/wall?post=507f1f77bcf86cd799439011&lang=ar#wall-post-507f1f77bcf86cd799439011'), '/wall?post=507f1f77bcf86cd799439011&lang=ar#wall-post-507f1f77bcf86cd799439011');
});

test('rejects open redirects and unrelated internal routes', () => {
  for (const value of ['https://evil.test/x', '//evil.test/x', '/\\evil.test', '/admin', 'javascript:alert(1)']) {
    assert.equal(sanitizeReturnPath(value), null);
  }
});

test('sanitizeMarketplaceListReturnPath validates internal marketplace list routes with query params', () => {
  assert.equal(
    sanitizeMarketplaceListReturnPath('/marketplace?page=2&search=chair&country=EG'),
    '/marketplace?page=2&search=chair&country=EG'
  );
  assert.equal(
    sanitizeMarketplaceListReturnPath('/marketplace/mine?page=3'),
    '/marketplace/mine?page=3'
  );
  assert.equal(
    sanitizeMarketplaceListReturnPath('/marketplace?moderation=true'),
    '/marketplace?moderation=true'
  );
  assert.equal(sanitizeMarketplaceListReturnPath('/marketplace'), '/marketplace');
  assert.equal(sanitizeMarketplaceListReturnPath('/marketplace/mine'), '/marketplace/mine');

  // Rejects listing detail routes, external URLs, non-marketplace routes, protocol-relative, etc.
  assert.equal(sanitizeMarketplaceListReturnPath('/marketplace/6aec86b66f1ce48779f932b4'), null);
  assert.equal(sanitizeMarketplaceListReturnPath('/marketplace/new'), null);
  assert.equal(sanitizeMarketplaceListReturnPath('https://evil.com/marketplace'), null);
  assert.equal(sanitizeMarketplaceListReturnPath('//evil.com/marketplace'), null);
  assert.equal(sanitizeMarketplaceListReturnPath('/admin/messages'), null);
  assert.equal(sanitizeMarketplaceListReturnPath(null), null);
  assert.equal(sanitizeMarketplaceListReturnPath(undefined), null);
});
