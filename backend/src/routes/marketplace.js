import express from 'express';
import mongoose from 'mongoose';
import MarketplaceListing from '../models/MarketplaceListing.js';
import Conversation from '../models/Conversation.js';
import { authenticate } from '../middleware/auth.js';
import { getSupportedCountryByCode } from '../utils/supportedCountries.js';
import { getCallingCodeByCountry } from '../utils/countryCallingCodes.js';
import {
  marketplaceImageUpload,
  validateMarketplaceImage,
  uploadMarketplaceImage,
  deleteMarketplaceImage,
  detectMarketplaceImageType
} from '../utils/marketplaceImageUpload.js';
import { renderMarketplacePreviewHtml } from '../utils/marketplaceSocialPreview.js';
import User from '../models/User.js';
import { getPublicVerification } from '../services/profileVerificationService.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';

const router = express.Router();
const ADMIN_ROLES = new Set(['ADMIN', 'SUPPORT']);
export const MARKETPLACE_ROLES = new Set(['WORKER', 'EMPLOYER', 'ADMIN', 'DOCTOR', 'TEACHER', 'STUDENT', 'SUPPORT', 'SUPPORT_HELPER']);
const text = (value) => String(value ?? '').trim();
const validId = (value) => mongoose.Types.ObjectId.isValid(String(value));
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const isMarketplaceOwner = (listing, userId) => String(listing?.ownerId || '') === String(userId || '');
export const canModerateMarketplace = (role) => ADMIN_ROLES.has(String(role || '').toUpperCase());
export const buildMarketplaceConversationId = (listingId, viewerId, sellerId) => {
  const ids = [String(viewerId), String(sellerId)].sort();
  return `conv_market_${String(listingId)}_${ids.join('_')}`;
};

/**
 * Normalizes a WhatsApp number to E.164 (+<country_code><digits>).
 * Handles:
 * - Already fully qualified international with leading '+' (e.g. '+201012345678')
 * - International with '00' prefix (e.g. '00201012345678' -> '+201012345678')
 * - Local number with country context (e.g. '01012345678' with 'EG' -> '+201012345678')
 * Does NOT merely prepend '+' to a raw local number.
 */
export const normalizeWhatsAppNumber = (value, countryCode = null) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Reject invalid characters early
  if (!/^\+?[0-9\s()\-.]{6,30}$/.test(raw)) return false;

  const callingCode = countryCode ? getCallingCodeByCountry(countryCode) : null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return false;

  let normalized = '';

  if (raw.startsWith('+')) {
    // Explicit international with +
    normalized = digits;
  } else if (raw.startsWith('00')) {
    // International prefix with 00
    normalized = digits.replace(/^00/, '');
  } else if (callingCode) {
    // Local number with country context
    let localDigits = digits;
    if (localDigits.startsWith('0')) {
      localDigits = localDigits.replace(/^0+/, '');
    }
    // If the user already typed the calling code without +
    if (digits.startsWith(callingCode)) {
      normalized = digits;
    } else {
      normalized = callingCode + localDigits;
    }
  } else {
    // No leading +, no 00, and no country calling code provided
    return false;
  }

  if (normalized.length < 7 || normalized.length > 15) {
    return false;
  }

  return '+' + normalized;
};

export const serializeMarketplaceListing = (listing, { includePhone = false, sellerSummary = null } = {}) => {
  const item = listing.toObject ? listing.toObject() : { ...listing };
  delete item.reports;
  delete item.moderatedBy;
  if (!includePhone) {
    delete item.phone;
    delete item.whatsapp;
  }
  if (sellerSummary) {
    item.seller = sellerSummary;
  }
  return item;
};

export const resolveMarketplaceSellerSummaries = async (ownerIds = []) => {
  const uniqueIds = [...new Set((ownerIds || []).filter(Boolean).map(String))];
  const summaryMap = new Map();
  if (uniqueIds.length === 0) return summaryMap;

  const validMongoIds = uniqueIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  const idQuery = { _id: { $in: validMongoIds } };
  const [users, activePremiumIds] = await Promise.all([
    validMongoIds.length > 0
      ? User.find(idQuery)
          .select('_id fullName role verifiedProfileStatus')
          .lean()
      : [],
    getActivePremiumUserIds(validMongoIds).catch(() => new Set())
  ]);

  const activePremiumSet = activePremiumIds instanceof Set ? activePremiumIds : new Set(activePremiumIds || []);

  for (const user of users) {
    const uid = String(user._id);
    const verification = getPublicVerification(user);
    summaryMap.set(uid, {
      id: uid,
      displayName: user.fullName || 'Seller',
      isVerified: verification?.isVerified === true,
      verifiedProfileStatus: verification?.verifiedProfileStatus || 'NOT_VERIFIED',
      isPremium: activePremiumSet.has(uid)
    });
  }

  for (const uid of uniqueIds) {
    if (!summaryMap.has(uid)) {
      summaryMap.set(uid, {
        id: uid,
        displayName: 'Seller',
        isVerified: false,
        verifiedProfileStatus: 'NOT_VERIFIED',
        isPremium: activePremiumSet.has(uid)
      });
    }
  }

  return summaryMap;
};

export const validateMarketplaceFields = (body) => {
  const data = {
    title: text(body.title), description: text(body.description), currency: text(body.currency).toUpperCase(),
    country: text(body.country).toUpperCase(), region: text(body.region), city: text(body.city),
    locationDescription: text(body.locationDescription), phone: text(body.phone),
    whatsapp: body.whatsapp !== undefined && body.whatsapp !== null ? text(body.whatsapp) : undefined,
    price: Number(body.price)
  };
  if (text(body.price) === '') return { code: 'INVALID_PRICE' };
  if (data.title.length < 3 || data.title.length > 120) return { code: 'INVALID_TITLE' };
  if (data.description.length < 10 || data.description.length > 3000) return { code: 'INVALID_DESCRIPTION' };
  if (!Number.isFinite(data.price) || data.price < 0 || data.price > 1_000_000_000) return { code: 'INVALID_PRICE' };
  if (!/^[A-Z]{3}$/.test(data.currency)) return { code: 'INVALID_CURRENCY' };
  if (!getSupportedCountryByCode(data.country)) return { code: 'INVALID_COUNTRY' };
  if (!data.region || data.region.length > 120 || !data.city || data.city.length > 120) return { code: 'INVALID_LOCATION' };
  if (!data.locationDescription || data.locationDescription.length > 500) return { code: 'INVALID_LOCATION_DESCRIPTION' };
  if (!/^\+?[0-9][0-9 ()-]{6,30}$/.test(data.phone)) return { code: 'INVALID_PHONE' };
  if (data.whatsapp !== undefined && data.whatsapp !== '') {
    const norm = normalizeWhatsAppNumber(data.whatsapp, data.country);
    if (norm === false) return { code: 'INVALID_WHATSAPP' };
    data.whatsapp = norm;
  } else {
    data.whatsapp = null;
  }
  return { data };
};

const uploadSingle = (req, res, next) => marketplaceImageUpload(req, res, (error) => {
  if (error) {
    const code = error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE'
      ? 'EXACTLY_ONE_IMAGE'
      : error.code === 'INVALID_IMAGE_TYPE' || error.code === 'LIMIT_FILE_SIZE'
        ? 'INVALID_IMAGE_CONTENT'
        : 'INVALID_IMAGE';
    return res.status(400).json({ success: false, code });
  }
  next();
});

router.get('/preview/:id', asyncHandler(async (req, res) => {
  const listing = validId(req.params.id) ? await MarketplaceListing.findById(req.params.id).lean() : null;
  res.type('html').send(renderMarketplacePreviewHtml({ listing }));
}));

router.use(authenticate);
router.use((req, res, next) => MARKETPLACE_ROLES.has(String(req.userRole || '').toUpperCase())
  ? next()
  : res.status(403).json({ success: false, code: 'MARKETPLACE_FORBIDDEN' }));

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const query = { status: 'ACTIVE', deletedAt: null };
  if (req.query.country) query.country = text(req.query.country).toUpperCase();
  if (req.query.region) query.region = text(req.query.region);
  if (text(req.query.search)) query.$text = { $search: text(req.query.search).slice(0, 120) };
  const [items, total] = await Promise.all([
    MarketplaceListing.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    MarketplaceListing.countDocuments(query)
  ]);
  const sellerMap = await resolveMarketplaceSellerSummaries(items.map((it) => it.ownerId));
  res.json({
    success: true,
    listings: items.map((item) => serializeMarketplaceListing(item, { sellerSummary: sellerMap.get(String(item.ownerId)) })),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total
  });
}));

router.get('/mine', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const query = { ownerId: String(req.userId), deletedAt: null };
  const [items, total] = await Promise.all([
    MarketplaceListing.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    MarketplaceListing.countDocuments(query)
  ]);
  const sellerMap = await resolveMarketplaceSellerSummaries([req.userId]);
  const mySummary = sellerMap.get(String(req.userId));
  res.json({
    success: true,
    listings: items.map((item) => serializeMarketplaceListing(item, { includePhone: true, sellerSummary: mySummary })),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total
  });
}));

router.get('/admin/reports', asyncHandler(async (req, res) => {
  if (!canModerateMarketplace(req.userRole)) return res.status(403).json({ success: false, code: 'MODERATION_FORBIDDEN' });
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const query = { 'reports.0': { $exists: true }, deletedAt: null };
  const [items, total] = await Promise.all([
    MarketplaceListing.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
    MarketplaceListing.countDocuments(query)
  ]);
  const sellerMap = await resolveMarketplaceSellerSummaries(items.map((it) => it.ownerId));
  res.json({
    success: true,
    listings: items.map((item) => ({ ...serializeMarketplaceListing(item, { sellerSummary: sellerMap.get(String(item.ownerId)) }), reports: item.reports })),
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  const listing = await MarketplaceListing.findOne({ _id: req.params.id, deletedAt: null, status: { $ne: 'HIDDEN' } });
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  const sellerMap = await resolveMarketplaceSellerSummaries([listing.ownerId]);
  const sellerSummary = sellerMap.get(String(listing.ownerId));
  res.json({ success: true, listing: serializeMarketplaceListing(listing, { includePhone: true, sellerSummary }), isOwner: isMarketplaceOwner(listing, req.userId) });
}));

router.post('/', uploadSingle, validateMarketplaceImage, asyncHandler(async (req, res) => {
  const validation = validateMarketplaceFields(req.body);
  if (!validation.data) return res.status(400).json({ success: false, code: validation.code });
  let uploaded;
  try {
    uploaded = await uploadMarketplaceImage(req.file.buffer);
    const listing = await MarketplaceListing.create({
      ...validation.data,
      ownerId: String(req.userId),
      image: { publicId: uploaded.public_id, url: uploaded.secure_url, bytes: uploaded.bytes || req.file.size, mimeType: req.marketplaceImageType }
    });
    const sellerMap = await resolveMarketplaceSellerSummaries([listing.ownerId]);
    const sellerSummary = sellerMap.get(String(listing.ownerId));
    res.status(201).json({ success: true, listing: serializeMarketplaceListing(listing, { includePhone: true, sellerSummary }) });
  } catch (error) {
    if (uploaded?.public_id) await deleteMarketplaceImage(uploaded.public_id).catch(() => {});
    if (
      error?.name === 'CloudinaryConfigurationError' ||
      error?.code === 'CLOUDINARY_NOT_CONFIGURED' ||
      (error?.http_code === 400 && String(error?.message).includes('Invalid image file'))
    ) {
      return res.status(503).json({ success: false, code: 'IMAGE_STORAGE_UNAVAILABLE' });
    }
    throw error;
  }
}));

router.put('/:id', uploadSingle, asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  const listing = await MarketplaceListing.findOne({ _id: req.params.id, ownerId: String(req.userId), deletedAt: null });
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  const validation = validateMarketplaceFields(req.body);
  if (!validation.data) return res.status(400).json({ success: false, code: validation.code });
  let uploaded;
  if (req.file) {
    const detected = detectMarketplaceImageType(req.file.buffer);
    if (!detected || detected !== String(req.file.mimetype).toLowerCase()) return res.status(400).json({ success: false, code: 'INVALID_IMAGE_CONTENT' });
    uploaded = await uploadMarketplaceImage(req.file.buffer);
  }
  const oldPublicId = listing.image.publicId;
  Object.assign(listing, validation.data);
  if (uploaded) listing.image = { publicId: uploaded.public_id, url: uploaded.secure_url, bytes: uploaded.bytes || req.file.size, mimeType: req.file.mimetype };
  try {
    await listing.save();
  } catch (error) {
    if (uploaded?.public_id) await deleteMarketplaceImage(uploaded.public_id).catch(() => {});
    throw error;
  }
  if (uploaded && oldPublicId !== uploaded.public_id) await deleteMarketplaceImage(oldPublicId).catch((error) => console.warn('Marketplace old image cleanup failed:', error.message));
  const sellerMap = await resolveMarketplaceSellerSummaries([listing.ownerId]);
  const sellerSummary = sellerMap.get(String(listing.ownerId));
  res.json({ success: true, listing: serializeMarketplaceListing(listing, { includePhone: true, sellerSummary }) });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const status = text(req.body.status).toUpperCase();
  if (!['ACTIVE', 'SOLD'].includes(status)) return res.status(400).json({ success: false, code: 'INVALID_STATUS' });
  const listing = validId(req.params.id) && await MarketplaceListing.findOneAndUpdate(
    { _id: req.params.id, ownerId: String(req.userId), deletedAt: null, status: { $ne: 'HIDDEN' } },
    { status }, { new: true }
  );
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  res.json({ success: true, listing: serializeMarketplaceListing(listing, { includePhone: true }) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const listing = validId(req.params.id) && await MarketplaceListing.findOne({ _id: req.params.id, ownerId: String(req.userId), deletedAt: null });
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  listing.deletedAt = new Date();
  await listing.save();
  await deleteMarketplaceImage(listing.image.publicId).catch((error) => console.warn('Marketplace image cleanup failed:', error.message));
  res.json({ success: true });
}));

router.post('/:id/chat', asyncHandler(async (req, res) => {
  const listing = validId(req.params.id) && await MarketplaceListing.findOne({ _id: req.params.id, deletedAt: null, status: 'ACTIVE' });
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  const sellerId = String(listing.ownerId);
  const viewerId = String(req.userId);
  if (sellerId === viewerId) return res.status(400).json({ success: false, code: 'CANNOT_CHAT_SELF' });
  const ids = [viewerId, sellerId].sort();
  const conversationId = buildMarketplaceConversationId(listing._id, viewerId, sellerId);
  await Conversation.findOneAndUpdate(
    { conversationId },
    { $setOnInsert: { type: 'PRIVATE', participantIds: ids }, $set: { marketplaceListingId: String(listing._id), marketplaceListingTitle: listing.title } },
    { upsert: true, new: true }
  );
  res.json({ success: true, conversationId, sellerId, context: { type: 'MARKETPLACE_LISTING', id: String(listing._id), title: listing.title } });
}));

router.post('/:id/report', asyncHandler(async (req, res) => {
  const reason = text(req.body.reason);
  if (reason.length < 10 || reason.length > 500) return res.status(400).json({ success: false, code: 'INVALID_REPORT' });
  const listing = validId(req.params.id) && await MarketplaceListing.findOne({ _id: req.params.id, deletedAt: null, status: { $ne: 'HIDDEN' } });
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });
  if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, code: 'CANNOT_REPORT_SELF' });
  if (listing.reports.some((report) => report.reporterId === String(req.userId))) return res.status(409).json({ success: false, code: 'ALREADY_REPORTED' });
  listing.reports.push({ reporterId: String(req.userId), reason });
  await listing.save();
  res.status(201).json({ success: true });
}));

router.patch('/admin/:id/moderate', asyncHandler(async (req, res) => {
  if (!canModerateMarketplace(req.userRole)) return res.status(403).json({ success: false, code: 'MODERATION_FORBIDDEN' });
  const action = text(req.body.action).toUpperCase();
  if (!['HIDE', 'REMOVE', 'RESTORE'].includes(action)) return res.status(400).json({ success: false, code: 'INVALID_MODERATION_ACTION' });
  const listing = validId(req.params.id) && await MarketplaceListing.findById(req.params.id);
  if (!listing) return res.status(404).json({ success: false, code: 'LISTING_NOT_FOUND' });

  // Do not resurrect removed listings whose images and records were destroyed
  if (listing.deletedAt) {
    return res.status(400).json({ success: false, code: 'LISTING_REMOVED' });
  }

  if (action === 'HIDE') {
    if (listing.status !== 'HIDDEN') {
      listing.preHiddenStatus = listing.status || 'ACTIVE';
      listing.status = 'HIDDEN';
    }
  } else if (action === 'RESTORE') {
    if (listing.status === 'HIDDEN') {
      listing.status = listing.preHiddenStatus || 'ACTIVE';
      listing.preHiddenStatus = null;
    }
  } else if (action === 'REMOVE') {
    listing.deletedAt = new Date();
    if (listing.image?.publicId) {
      await deleteMarketplaceImage(listing.image.publicId).catch((error) => console.warn('Marketplace image cleanup failed:', error.message));
    }
  }

  await listing.save();
  res.json({ success: true, listing: serializeMarketplaceListing(listing, { includePhone: true }) });
}));

export default router;
