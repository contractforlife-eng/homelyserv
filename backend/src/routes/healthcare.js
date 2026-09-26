// backend/src/routes/healthcare.js
import express from 'express';
import axios from 'axios';
import HealthcareProvider from '../models/HealthcareProvider.js';

const router = express.Router();

// Helper to escape regex special characters safely
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Sanitizer to guarantee zero internal/import/source metadata leaks
const sanitizeProvider = (provider) => {
  if (!provider) return null;
  return {
    providerId: provider.providerId,
    providerName: provider.providerName,
    providerNameArabic: provider.providerNameArabic || '',
    providerType: provider.providerType,
    specialty: provider.specialty || '',
    services: provider.services || [],
    ownershipType: provider.ownershipType || '',
    country: provider.country,
    region: provider.region || '',
    city: provider.city || '',
    area: provider.area || '',
    address: provider.address || '',
    postalCode: provider.postalCode || '',
    latitude: provider.latitude ?? null,
    longitude: provider.longitude ?? null,
    googleMapsUrl: provider.googleMapsUrl || '',
    phone: provider.phone || '',
    phoneSecondary: provider.phoneSecondary || '',
    fax: provider.fax || '',
    email: provider.email || '',
    website: provider.website || '',
    hasEmergency: Boolean(provider.hasEmergency),
    hasDental: Boolean(provider.hasDental),
    rating: provider.rating ?? null,
    reviewsCount: provider.reviewsCount || 0,
    workingHours: provider.workingHours || '',
    verificationStatus: provider.verificationStatus || 'unverified'
  };
};

// ============================================================
// 1. GET /api/healthcare/providers
// Paginated, filterable, searchable list of verified/registered healthcare providers
// ============================================================
router.get('/providers', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const {
      search,
      location,
      country,
      region,
      city,
      providerType,
      specialty
    } = req.query;

    const filter = {};

    // 1. Keyword search (Name, Specialty, Services)
    if (search && typeof search === 'string' && search.trim()) {
      const escaped = escapeRegex(search.trim());
      filter.$or = [
        { providerName: { $regex: escaped, $options: 'i' } },
        { providerNameArabic: { $regex: escaped, $options: 'i' } },
        { specialty: { $regex: escaped, $options: 'i' } },
        { services: { $elemMatch: { $regex: escaped, $options: 'i' } } }
      ];
    }

    // 2. Location search (City, Area, Address, Region)
    if (location && typeof location === 'string' && location.trim()) {
      const locEscaped = escapeRegex(location.trim());
      const locConditions = [
        { city: { $regex: locEscaped, $options: 'i' } },
        { area: { $regex: locEscaped, $options: 'i' } },
        { region: { $regex: locEscaped, $options: 'i' } },
        { country: { $regex: locEscaped, $options: 'i' } },
        { address: { $regex: locEscaped, $options: 'i' } }
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: locConditions }];
        delete filter.$or;
      } else {
        filter.$or = locConditions;
      }
    }

    // 3. Structured Filters
    if (country && country !== 'All' && country !== 'all') {
      filter.country = { $regex: `^${escapeRegex(country.trim())}$`, $options: 'i' };
    }

    if (region && region !== 'All' && region !== 'all') {
      filter.region = { $regex: `^${escapeRegex(region.trim())}$`, $options: 'i' };
    }

    if (city && city !== 'All' && city !== 'all') {
      filter.city = { $regex: `^${escapeRegex(city.trim())}$`, $options: 'i' };
    }

    if (providerType && providerType !== 'All Types' && providerType !== 'all') {
      // Allow searching by canonical type or lowercase
      const normalizedType = providerType.toLowerCase().replace(/\s+/g, '_');
      filter.providerType = { $in: [providerType.toLowerCase(), normalizedType] };
    }

    if (specialty && specialty !== 'All Specialties' && specialty !== 'all') {
      filter.specialty = { $regex: `^${escapeRegex(specialty.trim())}$`, $options: 'i' };
    }

    const [total, rawProviders] = await Promise.all([
      HealthcareProvider.countDocuments(filter),
      HealthcareProvider.find(filter)
        .sort({ rating: -1, verificationStatus: 1, providerName: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const sanitized = rawProviders.map(sanitizeProvider);

    return res.json({
      success: true,
      providers: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching healthcare providers:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve healthcare providers',
      providers: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1 }
    });
  }
});

// ============================================================
// 2. GET /api/healthcare/countries
// Distinct list of countries with provider counts
// ============================================================
router.get('/countries', async (req, res) => {
  try {
    const countries = await HealthcareProvider.distinct('country');
    const filtered = countries.filter(Boolean).sort();
    return res.json({ success: true, countries: filtered });
  } catch (err) {
    console.error('Error fetching healthcare countries:', err);
    return res.status(500).json({ success: false, countries: [] });
  }
});

// ============================================================
// 3. GET /api/healthcare/regions
// Distinct list of regions/governorates, optionally scoped by country
// ============================================================
router.get('/regions', async (req, res) => {
  try {
    const query = {};
    if (req.query.country && req.query.country !== 'All') {
      query.country = { $regex: `^${escapeRegex(req.query.country.trim())}$`, $options: 'i' };
    }
    const regions = await HealthcareProvider.distinct('region', query);
    const filtered = regions.filter(Boolean).sort();
    return res.json({ success: true, regions: filtered });
  } catch (err) {
    console.error('Error fetching healthcare regions:', err);
    return res.status(500).json({ success: false, regions: [] });
  }
});

// ============================================================
// 4. GET /api/healthcare/cities
// Distinct list of cities, optionally scoped by country and region
// ============================================================
router.get('/cities', async (req, res) => {
  try {
    const query = {};
    if (req.query.country && req.query.country !== 'All') {
      query.country = { $regex: `^${escapeRegex(req.query.country.trim())}$`, $options: 'i' };
    }
    if (req.query.region && req.query.region !== 'All') {
      query.region = { $regex: `^${escapeRegex(req.query.region.trim())}$`, $options: 'i' };
    }
    const cities = await HealthcareProvider.distinct('city', query);
    const filtered = cities.filter(Boolean).sort();
    return res.json({ success: true, cities: filtered });
  } catch (err) {
    console.error('Error fetching healthcare cities:', err);
    return res.status(500).json({ success: false, cities: [] });
  }
});

// ============================================================
// 5. GET /api/healthcare/specialties
// Distinct list of specialties
// ============================================================
router.get('/specialties', async (req, res) => {
  try {
    const query = {};
    if (req.query.providerType && req.query.providerType !== 'All Types') {
      query.providerType = req.query.providerType.toLowerCase();
    }
    const specialties = await HealthcareProvider.distinct('specialty', query);
    const filtered = specialties.filter(Boolean).sort();
    return res.json({ success: true, specialties: filtered });
  } catch (err) {
    console.error('Error fetching healthcare specialties:', err);
    return res.status(500).json({ success: false, specialties: [] });
  }
});

// ============================================================
// 6. POST /api/healthcare/translate-provider-name
// Dedicated Healthcare provider-name translation via local LibreTranslate
// ============================================================
const SUPPORTED_TRANSLATION_LANGUAGES = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

router.post('/translate-provider-name', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    // 1. Validate input text
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "text" must be a non-empty string.',
        translation: null
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "text" exceeds maximum allowed length of 500 characters.',
        translation: null
      });
    }

    // 2. Validate target language
    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: "targetLanguage" is required.',
        translation: null
      });
    }

    const normalizedTarget = targetLanguage.trim().toLowerCase();
    if (!SUPPORTED_TRANSLATION_LANGUAGES.includes(normalizedTarget)) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: unsupported targetLanguage "${targetLanguage}". Supported languages: ${SUPPORTED_TRANSLATION_LANGUAGES.join(', ')}`,
        translation: null
      });
    }

    const normalizedSource = typeof sourceLanguage === 'string'
      ? sourceLanguage.trim().toLowerCase()
      : 'en';

    // 3. If target is English or identical to source, return original text immediately (no translation service call needed)
    if (normalizedTarget === normalizedSource || normalizedTarget === 'en') {
      return res.json({
        success: true,
        translation: trimmedText,
        sourceLanguage: normalizedSource,
        targetLanguage: normalizedTarget
      });
    }

    // 4. Resolve local LibreTranslate endpoint
    const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5001';

    try {
      const response = await axios.post(
        `${libreTranslateUrl.replace(/\/+$/, '')}/translate`,
        {
          q: trimmedText,
          source: normalizedSource,
          target: normalizedTarget,
          format: 'text'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 4000 // 4s timeout prevents backend hanging if LibreTranslate is sluggish or down
        }
      );

      const translatedText = response.data?.translatedText;
      if (translatedText && typeof translatedText === 'string' && translatedText.trim()) {
        return res.json({
          success: true,
          translation: translatedText.trim(),
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget
        });
      }

      // If response lacks translatedText, return fallback
      return res.status(502).json({
        success: false,
        error: 'LibreTranslate returned empty or invalid translation.',
        translation: null
      });
    } catch (apiErr) {
      // Graceful fallback when local LibreTranslate is unavailable / offline
      return res.status(503).json({
        success: false,
        error: 'Local LibreTranslate service is unavailable.',
        translation: null
      });
    }
  } catch (err) {
    console.error('Error translating provider name:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during provider name translation.',
      translation: null
    });
  }
});

export default router;

