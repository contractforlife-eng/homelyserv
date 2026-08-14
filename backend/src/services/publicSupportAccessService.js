import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import PublicSupportConversation from '../models/PublicSupportConversation.js';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtSecret.js';

export const hashGuestToken = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
export const createGuestToken = () => crypto.randomBytes(32).toString('base64url');

export async function verifyGuestConversation(publicId, token) {
  if (!publicId || !token) return null;
  return PublicSupportConversation.findOne({ publicId, accessTokenHash: hashGuestToken(token) }).select('+accessTokenHash');
}

export async function verifyStaffToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('role tokenVersion');
    if (!user || !['ADMIN', 'SUPPORT'].includes(user.role)) return null;
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) return null;
    return { userId: String(user._id), role: user.role };
  } catch {
    return null;
  }
}
