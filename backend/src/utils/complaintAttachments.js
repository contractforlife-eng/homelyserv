import crypto from 'node:crypto';
import { getJwtSecret } from '../config/jwtSecret.js';
import ComplaintAttachmentGrant from '../models/ComplaintAttachmentGrant.js';

export const COMPLAINT_ATTACHMENT_FOLDER = 'homelyserv/complaints';
export const COMPLAINT_ATTACHMENT_PURPOSE = 'complaint-attachment';
const RECEIPT_TTL_MS = 30 * 60 * 1000;
export const GRANT_TTL_MS = 60 * 60 * 1000;
const VALIDATED_ATTACHMENTS = Symbol('validatedComplaintAttachments');
const cloudName = () => String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();

export const isTrustedComplaintAttachmentUrl = (value) => {
  if (typeof value !== 'string' || !cloudName()) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== 'res.cloudinary.com') return false;
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (segments[0] !== cloudName() || segments[1] !== 'image' || segments[2] !== 'upload') return false;
    const folderIndex = /^v\d+$/.test(segments[3] || '') ? 4 : 3;
    return segments.slice(folderIndex, folderIndex + 2).join('/') === COMPLAINT_ATTACHMENT_FOLDER;
  } catch { return false; }
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url');

export const createComplaintAttachmentReceipt = ({ url, publicId, userId, now = Date.now() }) => {
  if (!isTrustedComplaintAttachmentUrl(url) || !String(publicId).startsWith(`${COMPLAINT_ATTACHMENT_FOLDER}/`)) {
    throw new Error('Upload provider returned an invalid complaint attachment');
  }
  const payload = encode({ url, publicId, userId: String(userId), purpose: COMPLAINT_ATTACHMENT_PURPOSE, exp: now + RECEIPT_TTL_MS });
  return `${payload}.${sign(payload)}`;
};

export const persistComplaintAttachmentGrant = async ({ url, publicId, userId, now = Date.now(), grantModel = ComplaintAttachmentGrant }) => {
  if (!isTrustedComplaintAttachmentUrl(url) || !String(publicId).startsWith(`${COMPLAINT_ATTACHMENT_FOLDER}/`)) throw new TypeError('Invalid complaint attachment upload result');
  return grantModel.create({
    uploaderId: String(userId),
    url,
    publicId,
    purpose: COMPLAINT_ATTACHMENT_PURPOSE,
    createdAt: new Date(now),
    expiresAt: new Date(now + GRANT_TTL_MS),
  });
};

export const validateComplaintAttachments = async (attachments, userId, { now = Date.now(), grantModel = ComplaintAttachmentGrant } = {}) => {
  if (attachments == null) return [];
  if (!Array.isArray(attachments)) throw new TypeError('Attachments must be an array');
  return Promise.all(attachments.map(async (attachment) => {
    if (typeof attachment === 'string') {
      if (!isTrustedComplaintAttachmentUrl(attachment)) throw new TypeError('Invalid complaint attachment URL');
      const grant = await grantModel.findOne({
        uploaderId: String(userId),
        url: attachment,
        purpose: COMPLAINT_ATTACHMENT_PURPOSE,
        expiresAt: { $gt: new Date(now) },
      });
      const grantExpiresAt = grant?.expiresAt instanceof Date ? grant.expiresAt.getTime() : Number.NaN;
      if (!Number.isFinite(grantExpiresAt) || grantExpiresAt <= now) {
        throw new TypeError('No valid upload grant exists for this attachment');
      }
      return attachment;
    }
    if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) throw new TypeError('Each attachment must be a verified upload result');
    const { url, publicId, receipt } = attachment;
    if (!isTrustedComplaintAttachmentUrl(url) || !String(publicId).startsWith(`${COMPLAINT_ATTACHMENT_FOLDER}/`)) throw new TypeError('Invalid complaint attachment URL');
    const [payload, signature, extra] = String(receipt || '').split('.');
    const expected = payload ? sign(payload) : '';
    if (!payload || !signature || extra || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) throw new TypeError('Invalid complaint attachment receipt');
    let claims;
    try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw new TypeError('Invalid complaint attachment receipt'); }
    if (claims.url !== url || claims.publicId !== publicId || claims.userId !== String(userId) || claims.purpose !== COMPLAINT_ATTACHMENT_PURPOSE || !Number.isFinite(claims.exp) || claims.exp < now) throw new TypeError('Expired or mismatched complaint attachment receipt');
    return url;
  }));
};

export const authorizeComplaintAttachments = async (attachments, userId, options) => Object.freeze({
  [VALIDATED_ATTACHMENTS]: true,
  urls: Object.freeze(await validateComplaintAttachments(attachments, userId, options)),
});

export const getAuthorizedComplaintAttachmentUrls = (authorization) => {
  if (!authorization || authorization[VALIDATED_ATTACHMENTS] !== true || !Array.isArray(authorization.urls)) {
    throw new TypeError('Complaint attachments were not authorized');
  }
  return authorization.urls;
};
