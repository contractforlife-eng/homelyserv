// backend/src/models/HealthcareProvider.js
import mongoose from 'mongoose';

const HealthcareProviderSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  providerName: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  providerNameArabic: {
    type: String,
    default: '',
    trim: true
  },
  providerType: {
    type: String,
    required: true,
    enum: [
      'doctor',
      'hospital',
      'clinic',
      'pharmacy',
      'laboratory',
      'diagnostic_center',
      'care_home',
      'optical',
      'specialized_center',
      'other'
    ],
    default: 'other',
    index: true
  },
  specialty: {
    type: String,
    default: '',
    index: true,
    trim: true
  },
  services: {
    type: [String],
    default: []
  },
  ownershipType: {
    type: String,
    default: '',
    trim: true
  },
  country: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  region: {
    type: String,
    default: '',
    index: true,
    trim: true
  },
  city: {
    type: String,
    default: '',
    index: true,
    trim: true
  },
  area: {
    type: String,
    default: '',
    index: true,
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  postalCode: {
    type: String,
    default: '',
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  googleMapsUrl: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    index: true,
    trim: true
  },
  phoneSecondary: {
    type: String,
    default: '',
    trim: true
  },
  fax: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  hasEmergency: {
    type: Boolean,
    default: false
  },
  hasDental: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: null
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  workingHours: {
    type: String,
    default: '',
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['official_registry', 'verified', 'unverified'],
    default: 'unverified',
    index: true
  },
  // Normalized deduplication keys used internally by the importer (NEVER exposed in public API)
  dedupeKeys: {
    type: [String],
    default: [],
    index: true
  }
}, {
  collection: 'healthcare_providers',
  timestamps: true,
  versionKey: false
});

// Compound indexes for performant searching and filtering
HealthcareProviderSchema.index({ country: 1, region: 1, city: 1 });
HealthcareProviderSchema.index({ country: 1, providerType: 1 });
HealthcareProviderSchema.index({ providerType: 1, specialty: 1 });
HealthcareProviderSchema.index({ providerName: 'text', specialty: 'text', city: 'text', area: 'text', services: 'text' });

export default mongoose.models.HealthcareProvider || mongoose.model('HealthcareProvider', HealthcareProviderSchema);
