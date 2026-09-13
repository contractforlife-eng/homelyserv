// backend/src/models/VerificationDocument.js
import mongoose from 'mongoose';

const verificationDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    verificationType: {
      type: String,
      enum: ['identity', 'experience', 'certificates', 'phone'],
      default: 'identity',
      required: true,
      index: true
    },
    publicId: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      enum: ['image', 'raw', 'auto'],
      default: 'image'
    },
    originalFilename: {
      type: String,
      default: ''
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    userNotes: {
      type: String,
      default: null,
      maxlength: 1000
    },
    adminNotes: {
      type: String,
      default: null,
      maxlength: 1000
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 1000
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for finding user's active/latest verification documents
verificationDocumentSchema.index({ userId: 1, verificationType: 1, createdAt: -1 });

const VerificationDocument = mongoose.model('VerificationDocument', verificationDocumentSchema);

export default VerificationDocument;
