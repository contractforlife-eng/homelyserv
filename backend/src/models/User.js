// backend/src/models/User.js
import mongoose from 'mongoose';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'EMPLOYER', 'WORKER', 'SUPPORT'],
    default: 'WORKER'
  },
  // Session/token version. Bumped whenever an admin changes a user's role,
  // which invalidates all previously issued JWTs for that user.
  tokenVersion: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    default: ''
  },
  // Country fields - optional at the schema level so existing users
  // remain valid. The registration endpoint enforces these for NEW
  // email/password registrations.
  countryCode: {
    type: String,
    default: ''
  },
  countryName: {
    type: String,
    default: ''
  },
  // Explicit account preference only. It remains nullable so country-derived
  // defaults and legacy fallback are distinguishable from a user choice.
  preferredCurrency: {
    type: String,
    default: null,
    validate: {
      validator: (value) => value === null || (
        normalizeCurrencyCode(value) === value && isSupportedCurrency(value)
      ),
      message: 'Preferred currency must be a supported uppercase ISO currency code'
    }
  },
  location: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  experience: {
    type: String,
    default: ''
  },
  hourlyRate: {
    type: String,
    default: '0'
  },
  // Currency attached to the saved worker-advertised hourly rate. Nullable
  // preserves legacy implicit-EGP records without fabricating an explicit
  // currency or coupling the rate to the account preference.
  hourlyRateCurrency: {
    type: String,
    default: null,
    validate: {
      validator: (value) => value === null || (
        normalizeCurrencyCode(value) === value && isSupportedCurrency(value)
      ),
      message: 'Hourly rate currency must be a supported uppercase ISO currency code'
    }
  },
  companyName: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  desiredJob: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'en'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetAt: {
    type: Date,
    default: null
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  // ============================================================
  // PASSWORD RESET FIELDS
  // ============================================================
  // SHA-256 hash of the raw reset token. The raw token is NEVER
  // stored in the database.
  passwordResetTokenHash: {
    type: String,
    default: null
  },
  passwordResetExpiresAt: {
    type: Date,
    default: null
  },
  // ============================================================
  // EMAIL VERIFICATION FIELDS (Phase 3)
  // ============================================================
  // Optional fields - existing users remain fully compatible.
  // No migration required for existing MongoDB documents.
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  // SHA-256 hash of the raw verification token. The raw token is
  // NEVER stored in the database.
  emailVerificationTokenHash: {
    type: String,
    default: null
  },
  emailVerificationExpiresAt: {
    type: Date,
    default: null
  },
  // Timestamp of the last verification email resend request.
  // Used for the 60-second rate limit.
  emailVerificationLastSentAt: {
    type: Date,
    default: null
  },
  settings: {
    type: Object,
    default: {
      darkMode: false,
      notifications: true,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      twoFactorAuth: false,
      autoSave: true,
      timezone: 'UTC+2',
      currency: 'EGP',
      dateFormat: 'DD/MM/YYYY',
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true,
      saveSearchHistory: true,
      showRecommended: true,
      availableForHire: true
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);
