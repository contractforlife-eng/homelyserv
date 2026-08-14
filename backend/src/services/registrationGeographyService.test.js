import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureRegistrationGeography,
  isPrivateOrLocalIp,
  normalizeIpAddress,
  resolveRegistrationIp,
  withRegistrationGeography,
} from './registrationGeographyService.js';

const request = (remoteAddress, headers = {}) => ({
  ip: remoteAddress,
  socket: { remoteAddress },
  headers,
  get: (name) => headers[name],
});

test('registration IP is captured server-side and ignores untrusted forwarding headers', () => {
  const req = request('8.8.8.8', { 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' });
  assert.equal(resolveRegistrationIp(req, { railwayEnvironment: false }), '8.8.8.8');
  assert.equal(captureRegistrationGeography(req, { lookup: () => ({ country: 'US' }), railwayEnvironment: false }).registrationIp, '8.8.8.8');
});

test('Railway X-Real-IP is used only behind a trusted internal peer', () => {
  const railwayHeaders = { 'x-real-ip': '8.8.8.8', 'x-railway-request-id': 'request-1', 'x-railway-edge': 'cai1' };
  assert.equal(resolveRegistrationIp(request('10.1.2.3', railwayHeaders), { railwayEnvironment: true }), '8.8.8.8');
  assert.equal(resolveRegistrationIp(request('9.9.9.9', railwayHeaders), { railwayEnvironment: true }), '9.9.9.9');
  assert.equal(resolveRegistrationIp(request('10.1.2.3', { 'x-real-ip': '8.8.8.8' }), { railwayEnvironment: true }), '10.1.2.3');
});

test('country is captured where the local resolver can resolve it', () => {
  const result = captureRegistrationGeography(request('8.8.8.8'), { lookup: () => ({ country: 'US' }), railwayEnvironment: false });
  assert.equal(result.registrationCountryCode, 'US');
  assert.equal(result.registrationCountryName, 'United States');
});

test('IPv4-mapped IPv6 is normalized', () => {
  assert.equal(normalizeIpAddress('::ffff:8.8.8.8'), '8.8.8.8');
});

test('private and local IPs produce Unknown without invoking country lookup', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '192.168.1.4', '::1', 'fd00::1']) {
    let called = false;
    const result = captureRegistrationGeography(request(ip), { lookup: () => { called = true; return { country: 'US' }; }, railwayEnvironment: false });
    assert.equal(isPrivateOrLocalIp(ip), true, ip);
    assert.equal(result.registrationCountryCode, null, ip);
    assert.equal(result.registrationCountryName, 'Unknown', ip);
    assert.equal(called, false, ip);
  }
});

test('GeoIP lookup failure does not block new-user field creation', () => {
  const fields = withRegistrationGeography(request('8.8.8.8'), { email: 'new@example.com' }, { lookup: () => { throw new Error('database unavailable'); }, railwayEnvironment: false });
  assert.equal(fields.email, 'new@example.com');
  assert.equal(fields.registrationCountryCode, null);
  assert.equal(fields.registrationCountryName, 'Unknown');
});

test('email/password and social new-user field sets both receive immutable registration metadata', () => {
  const options = { lookup: () => ({ country: 'DE' }), railwayEnvironment: false };
  const normal = withRegistrationGeography(request('8.8.8.8'), { email: 'normal@example.com', role: 'EMPLOYER' }, options);
  const social = withRegistrationGeography(request('8.8.8.8'), { email: 'social@example.com', role: 'WORKER', profileImage: 'photo' }, options);
  for (const fields of [normal, social]) {
    assert.equal(fields.registrationIp, '8.8.8.8');
    assert.equal(fields.registrationCountryCode, 'DE');
    assert.ok(fields.registrationLocationCapturedAt instanceof Date);
  }
});
