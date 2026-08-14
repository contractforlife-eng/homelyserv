import net from 'node:net';
import geoip from 'geoip-lite';

const UNKNOWN_COUNTRY = 'Unknown';
const IPV4_MAPPED_PREFIX = '::ffff:';

const normalizeIpv4 = (value) => value.split('.').map((part) => String(Number(part))).join('.');

export const normalizeIpAddress = (value) => {
  if (typeof value !== 'string') return null;
  let candidate = value.trim();
  if (!candidate || candidate.includes(',')) return null;

  if (candidate.startsWith('[')) {
    const closingBracket = candidate.indexOf(']');
    if (closingBracket === -1) return null;
    candidate = candidate.slice(1, closingBracket);
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.slice(0, candidate.lastIndexOf(':'));
  }

  const zoneIndex = candidate.indexOf('%');
  if (zoneIndex !== -1) candidate = candidate.slice(0, zoneIndex);
  if (candidate.toLowerCase().startsWith(IPV4_MAPPED_PREFIX)) {
    candidate = candidate.slice(IPV4_MAPPED_PREFIX.length);
  }

  const version = net.isIP(candidate);
  if (!version) return null;
  return version === 4 ? normalizeIpv4(candidate) : candidate.toLowerCase();
};

const ipv4Number = (ip) => ip.split('.').reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0);
const inIpv4Range = (ip, base, bits) => {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4Number(ip) & mask) === (ipv4Number(base) & mask);
};

export const isPrivateOrLocalIp = (value) => {
  const ip = normalizeIpAddress(value);
  if (!ip) return true;
  if (net.isIP(ip) === 4) {
    return [
      ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
      ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16],
      ['192.0.0.0', 24], ['192.0.2.0', 24], ['198.18.0.0', 15],
      ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4],
    ].some(([base, bits]) => inIpv4Range(ip, base, bits));
  }
  return ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || /^fe[89ab]/.test(ip);
};

const isTrustedRailwayPeer = (value) => {
  const ip = normalizeIpAddress(value);
  return ip !== null && isPrivateOrLocalIp(ip);
};

export const resolveRegistrationIp = (req, { railwayEnvironment = Boolean(process.env.RAILWAY_ENVIRONMENT_ID) } = {}) => {
  const socketIp = normalizeIpAddress(req?.socket?.remoteAddress);
  const header = (name) => req?.get?.(name) ?? req?.headers?.[name];
  const hasRailwayProxyHeaders = Boolean(header('x-railway-request-id') && header('x-railway-edge'));
  if (railwayEnvironment && hasRailwayProxyHeaders && isTrustedRailwayPeer(socketIp)) {
    const railwayIp = normalizeIpAddress(header('x-real-ip'));
    if (railwayIp) return railwayIp;
  }
  return normalizeIpAddress(req?.ip) || socketIp;
};

const countryNameForCode = (countryCode) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || UNKNOWN_COUNTRY;
  } catch {
    return UNKNOWN_COUNTRY;
  }
};

export const captureRegistrationGeography = (
  req,
  { lookup = (ip) => geoip.lookup(ip), now = () => new Date(), railwayEnvironment } = {}
) => {
  const registrationIp = resolveRegistrationIp(req, { railwayEnvironment });
  const unknown = {
    registrationIp,
    registrationCountryCode: null,
    registrationCountryName: UNKNOWN_COUNTRY,
    registrationLocationCapturedAt: now(),
  };

  if (!registrationIp || isPrivateOrLocalIp(registrationIp)) return unknown;

  try {
    const countryCode = lookup(registrationIp)?.country?.toUpperCase();
    if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return unknown;
    return {
      ...unknown,
      registrationCountryCode: countryCode,
      registrationCountryName: countryNameForCode(countryCode),
    };
  } catch {
    return unknown;
  }
};

export const withRegistrationGeography = (req, userFields, options) => ({
  ...userFields,
  ...captureRegistrationGeography(req, options),
});

export { UNKNOWN_COUNTRY };
