// backend/src/models/DoctorProfile.js
import mongoose from 'mongoose';
import { CANONICAL_DOCTOR_SPECIALTIES } from '../constants/doctorSpecialties.js';

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    professionalTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    specialty: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function(val) {
          if (!val) return true;
          return CANONICAL_DOCTOR_SPECIALTIES.includes(val);
        },
        message: 'Invalid doctor specialty'
      }
    },
    // Secondary specialties. Each entry must come from the SAME canonical
    // taxonomy as `specialty`. 'other' may appear at most once across
    // (specialty, subspecialty) combined with these extras.
    additionalSpecialties: {
      type: [String],
      default: [],
      validate: {
        validator: function(vals) {
          if (!Array.isArray(vals)) return false;
          return vals.every((val) => CANONICAL_DOCTOR_SPECIALTIES.includes(val));
        },
        message: 'Invalid doctor specialty'
      }
    },
    subspecialty: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    experienceSummary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative']
    },
    languages: {
      type: [String],
      default: []
    },
    qualifications: {
      type: [String],
      default: []
    },
    // Academic education history (degrees, universities, graduation years).
    education: {
      type: [String],
      default: []
    },
    // Issued certifications, fellowships and licences. Distinct from
    // `qualifications` (which are self-declared academic titles).
    certifications: {
      type: [String],
      default: []
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100
    },
    licenseAuthority: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150
    },
    // Doctor-advertised consultation fee. A plain non-negative numeric amount
    // with at most two decimal places, so no monetary value is ever derived by
    // accumulating floating-point arithmetic.
    //
    // The currency is deliberately NOT stored here. It is derived from the
    // Doctor's existing account currency preference
    // (utils/currencyMetadata.js -> resolveAccountDefaultCurrency), which keeps
    // this inside the one currency convention the platform already has instead
    // of introducing a second one.
    //
    // Existing documents without this field keep working: the value is absent
    // until the Doctor sets it and reads back as 0.
    //
    // This is a profile display value only. It is NOT wired to PayPal, Paymob,
    // Vodafone Cash, InstaPay, Bank Transfer, or any other payment flow.
    consultationFee: {
      type: Number,
      default: 0,
      min: [0, 'Consultation fee cannot be negative'],
      max: [1000000, 'Consultation fee must not exceed 1000000']
    },
    // Doctor-advertised examination fee. A completely separate amount from
    // `consultationFee`: identical type, identical limits, identical monetary
    // handling, and the two are never derived from or written into each other.
    // Changing one must never overwrite the other.
    //
    // Same rules as above: currency is derived from the Doctor's existing
    // account currency preference rather than stored here, documents written
    // before this field existed remain valid and read back as 0, and the value
    // is a profile display value only — never wired to PayPal, Paymob, Vodafone
    // Cash, InstaPay, Bank Transfer, or any other payment flow.
    examinationFee: {
      type: Number,
      default: 0,
      min: [0, 'Examination fee cannot be negative'],
      max: [1000000, 'Examination fee must not exceed 1000000']
    },
    profileImage: {
      type: String,
      default: ''
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    searchVisibility: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'doctor_profiles',
    timestamps: true
  }
);

const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
