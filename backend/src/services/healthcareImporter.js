// backend/src/services/healthcareImporter.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import xlsx from 'xlsx';
import HealthcareProvider from '../models/HealthcareProvider.js';

// Canonical provider types mapping
const TYPE_MAP = {
  // Doctor
  doctor: 'doctor',
  physician: 'doctor',
  dr: 'doctor',
  consultant: 'doctor',
  specialist: 'doctor',
  gp: 'doctor',
  general_practitioner: 'doctor',
  practitioner: 'doctor',

  // Hospital
  hospital: 'hospital',
  hospitals: 'hospital',
  medical_center_hospital: 'hospital',
  general_hospital: 'hospital',
  specialized_hospital: 'hospital',

  // Clinic
  clinic: 'clinic',
  clinics: 'clinic',
  polyclinic: 'clinic',
  polyclinics: 'clinic',
  center: 'clinic',
  centre: 'clinic',
  medical_center: 'clinic',
  health_centre: 'clinic',
  health_center: 'clinic',
  surgery: 'clinic',
  practice: 'clinic',
  ambulatory: 'clinic',

  // Pharmacy
  pharmacy: 'pharmacy',
  pharmacies: 'pharmacy',
  chemist: 'pharmacy',
  dispensary: 'pharmacy',
  drugstore: 'pharmacy',

  // Laboratory
  laboratory: 'laboratory',
  laboratories: 'laboratory',
  lab: 'laboratory',
  labs: 'laboratory',
  pathology: 'laboratory',

  // Diagnostic / Imaging
  diagnostic: 'diagnostic_center',
  diagnostics: 'diagnostic_center',
  scan: 'diagnostic_center',
  imaging: 'diagnostic_center',
  radiology: 'diagnostic_center',
  xray: 'diagnostic_center',
  mri: 'diagnostic_center',

  // Care Home
  care_home: 'care_home',
  nursing_home: 'care_home',
  residential_home: 'care_home',

  // Optical
  optical: 'optical',
  optics: 'optical',
  optician: 'optical',
  eyewear: 'optical',

  // Day Surgery / Specialized
  day_surgery: 'specialized_center',
  day_case: 'specialized_center',
  specialized_center: 'specialized_center',
  specialized_centre: 'specialized_center'
};

export const normalizeProviderType = (rawType = '', rawName = '') => {
  const combined = `${rawType} ${rawName}`.toLowerCase();
  
  if (/pharmac|chemist|dispensary|صيدلية/.test(combined)) return 'pharmacy';
  if (/laborat|patholog|lab\b|تحاليل|معمل/.test(combined)) return 'laboratory';
  if (/radiolog|scan|imaging|mri|x-?ray|أشعة|رنين/.test(combined)) return 'diagnostic_center';
  if (/hospital|مستشفى/.test(combined)) return 'hospital';
  if (/optica|optician|نظارات|بصريات/.test(combined)) return 'optical';
  if (/care\s*home|nursing\s*home|دار\s*مسنين/.test(combined)) return 'care_home';
  if (/day\s*surgery|جراحة\s*يوم\s*واحد/.test(combined)) return 'specialized_center';
  if (/\bdr[\.\s]|doctor|\bprof[\.\s]|طبيب|دكتور|عيادة\s*د/.test(combined)) return 'doctor';
  if (/clinic|polyclinic|centre|center|عيادة|مجمع\s*طبي/.test(combined)) return 'clinic';

  const cleaned = String(rawType).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  return TYPE_MAP[cleaned] || 'clinic';
};

export const cleanString = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
};

export const cleanPhone = (val) => {
  if (!val) return '';
  const raw = cleanString(val);
  const parts = raw.split(/[\/,|;]/).map(s => s.trim()).filter(Boolean);
  return {
    primary: parts[0] || '',
    secondary: parts.slice(1).join(' / ') || ''
  };
};

export const cleanEmail = (val) => {
  const s = cleanString(val).toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return s;
  return '';
};

export const cleanNumber = (val) => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (!val) return null;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : null;
};

// Generate robust deduplication keys
export const generateDedupeKeys = ({
  providerName = '',
  licenseNumber = '',
  phone = '',
  country = '',
  city = '',
  address = '',
  lat = null,
  lon = null
}) => {
  const keys = [];
  const normName = cleanString(providerName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCity = cleanString(city).toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCountry = cleanString(country).toLowerCase().replace(/[^a-z0-9]/g, '');
  const normPhone = cleanString(phone).replace(/[^0-9]/g, '').slice(-9);

  if (licenseNumber) {
    const normLic = cleanString(licenseNumber).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normLic.length > 3) {
      keys.push(`lic:${normCountry}:${normLic}`);
    }
  }

  if (normName.length > 3 && normCity.length > 2) {
    keys.push(`name_city:${normCountry}:${normCity}:${normName}`);
  }

  if (normName.length > 3 && normPhone.length >= 7) {
    keys.push(`name_phone:${normName}:${normPhone}`);
  }

  if (normPhone.length >= 8 && normCity.length > 2) {
    keys.push(`phone_city:${normCountry}:${normCity}:${normPhone}`);
  }

  if (lat && lon) {
    const latRounded = lat.toFixed(3);
    const lonRounded = lon.toFixed(3);
    keys.push(`geo:${latRounded}:${lonRounded}:${normName.slice(0, 10)}`);
  }

  return keys;
};

export const mergeProviderRecords = (existing, incoming) => {
  const merged = existing._id ? { ...existing } : existing;

  if (!merged.providerName && incoming.providerName) merged.providerName = incoming.providerName;
  if (!merged.providerNameArabic && incoming.providerNameArabic) merged.providerNameArabic = incoming.providerNameArabic;

  if (!merged.specialty && incoming.specialty) merged.specialty = incoming.specialty;
  if (incoming.services && incoming.services.length > 0) {
    const set = new Set([...(merged.services || []), ...incoming.services]);
    merged.services = Array.from(set);
  }

  if (!merged.country && incoming.country) merged.country = incoming.country;
  if (!merged.region && incoming.region) merged.region = incoming.region;
  if (!merged.city && incoming.city) merged.city = incoming.city;
  if (!merged.area && incoming.area) merged.area = incoming.area;
  if (!merged.address && incoming.address) merged.address = incoming.address;
  if (!merged.postalCode && incoming.postalCode) merged.postalCode = incoming.postalCode;

  if (!merged.latitude && incoming.latitude) merged.latitude = incoming.latitude;
  if (!merged.longitude && incoming.longitude) merged.longitude = incoming.longitude;
  if (!merged.googleMapsUrl && incoming.googleMapsUrl) merged.googleMapsUrl = incoming.googleMapsUrl;

  if (!merged.phone && incoming.phone) merged.phone = incoming.phone;
  if (!merged.phoneSecondary && incoming.phoneSecondary) merged.phoneSecondary = incoming.phoneSecondary;
  if (!merged.email && incoming.email) merged.email = incoming.email;
  if (!merged.website && incoming.website) merged.website = incoming.website;
  if (!merged.fax && incoming.fax) merged.fax = incoming.fax;

  if (incoming.hasEmergency) merged.hasEmergency = true;
  if (incoming.hasDental) merged.hasDental = true;

  if (!merged.rating && incoming.rating) {
    merged.rating = incoming.rating;
    merged.reviewsCount = incoming.reviewsCount || 0;
  }

  const rank = { official_registry: 3, verified: 2, unverified: 1 };
  if ((rank[incoming.verificationStatus] || 1) > (rank[merged.verificationStatus] || 1)) {
    merged.verificationStatus = incoming.verificationStatus;
  }

  const allKeys = new Set([...(merged.dedupeKeys || []), ...(incoming.dedupeKeys || [])]);
  merged.dedupeKeys = Array.from(allKeys);

  return merged;
};

// High-speed batch processor using bulkWrite & memory dedupe cache
export async function importHealthcareFile(filePath, config = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const summary = {
    filePath,
    filename: path.basename(filePath),
    rowsRead: 0,
    validRecords: 0,
    newCreated: 0,
    mergedUpdated: 0,
    skipped: 0,
    errors: []
  };

  if (!fs.existsSync(filePath)) {
    summary.errors.push(`File not found: ${filePath}`);
    return summary;
  }

  let rows = [];

  try {
    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath, { cellDates: true, raw: false });
      const sheetName = config.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rangeOpt = config.range ? { range: config.range } : (config.headerRow ? { range: config.headerRow - 1 } : {});
      rows = xlsx.utils.sheet_to_json(worksheet, { ...rangeOpt, defval: '' });
    } else if (ext === '.csv') {
      const buffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const opts = { defval: '' };
      if (config.header !== undefined) opts.header = config.header;
      rows = xlsx.utils.sheet_to_json(worksheet, opts);
    } else {
      summary.errors.push(`Unsupported extension: ${ext}`);
      return summary;
    }
  } catch (err) {
    summary.errors.push(`Failed reading file: ${err.message}`);
    return summary;
  }

  summary.rowsRead = rows.length;
  const BATCH_SIZE = 500;

  for (let b = 0; b < rows.length; b += BATCH_SIZE) {
    const chunk = rows.slice(b, b + BATCH_SIZE);
    const parsedBatch = [];
    const allChunkKeys = new Set();

    // 1. Map & Validate Chunk
    for (let i = 0; i < chunk.length; i++) {
      const rawRow = chunk[i];
      const mapped = config.mapRow(rawRow, b + i);
      if (!mapped || !mapped.providerName || !mapped.country) {
        summary.skipped++;
        continue;
      }

      summary.validRecords++;

      const dedupeKeys = generateDedupeKeys({
        providerName: mapped.providerName,
        licenseNumber: mapped.licenseNumber,
        phone: mapped.phone,
        country: mapped.country,
        city: mapped.city,
        address: mapped.address,
        lat: mapped.latitude,
        lon: mapped.longitude
      });

      mapped.dedupeKeys = dedupeKeys;
      dedupeKeys.forEach(k => allChunkKeys.add(k));
      parsedBatch.push(mapped);
    }

    if (parsedBatch.length === 0) continue;

    // 2. Query DB once for any existing providers matching allChunkKeys
    let existingProviders = [];
    if (allChunkKeys.size > 0) {
      existingProviders = await HealthcareProvider.find({
        dedupeKeys: { $in: Array.from(allChunkKeys) }
      }).lean();
    }

    // Map existing providers by key for O(1) lookup
    const existingByKey = new Map();
    for (const ep of existingProviders) {
      for (const k of ep.dedupeKeys || []) {
        existingByKey.set(k, ep);
      }
    }

    // 3. Prepare bulk operations
    const bulkOps = [];

    for (const item of parsedBatch) {
      // Find match
      let match = null;
      for (const k of item.dedupeKeys) {
        if (existingByKey.has(k)) {
          match = existingByKey.get(k);
          break;
        }
      }

      if (match) {
        // Merge & update
        const merged = mergeProviderRecords(match, item);
        bulkOps.push({
          updateOne: {
            filter: { _id: match._id },
            update: { $set: merged }
          }
        });
        // Update local map so intra-chunk duplicates merge onto the same record
        for (const k of merged.dedupeKeys) {
          existingByKey.set(k, merged);
        }
        summary.mergedUpdated++;
      } else {
        // Insert new doc
        const newId = new HealthcareProvider()._id;
        const newDoc = {
          _id: newId,
          providerId: item.providerId || `hp_${crypto.randomBytes(8).toString('hex')}`,
          providerName: item.providerName,
          providerNameArabic: item.providerNameArabic || '',
          providerType: item.providerType || 'clinic',
          specialty: item.specialty || '',
          services: item.services || [],
          ownershipType: item.ownershipType || '',
          country: item.country,
          region: item.region || '',
          city: item.city || '',
          area: item.area || '',
          address: item.address || '',
          postalCode: item.postalCode || '',
          latitude: item.latitude || null,
          longitude: item.longitude || null,
          googleMapsUrl: item.googleMapsUrl || '',
          phone: item.phone || '',
          phoneSecondary: item.phoneSecondary || '',
          fax: item.fax || '',
          email: item.email || '',
          website: item.website || '',
          hasEmergency: Boolean(item.hasEmergency),
          hasDental: Boolean(item.hasDental),
          rating: item.rating || null,
          reviewsCount: item.reviewsCount || 0,
          workingHours: item.workingHours || '',
          verificationStatus: item.verificationStatus || 'unverified',
          dedupeKeys: item.dedupeKeys
        };

        bulkOps.push({
          insertOne: {
            document: newDoc
          }
        });

        // Add to map for subsequent items in chunk
        for (const k of item.dedupeKeys) {
          existingByKey.set(k, newDoc);
        }
        summary.newCreated++;
      }
    }

    if (bulkOps.length > 0) {
      await HealthcareProvider.bulkWrite(bulkOps, { ordered: false });
    }
  }

  return summary;
}
