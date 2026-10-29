import mongoose from 'mongoose';

const complaintAttachmentGrantSchema = new mongoose.Schema({
  uploaderId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  purpose: { type: String, required: true, enum: ['complaint-attachment'] },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

complaintAttachmentGrantSchema.index(
  { uploaderId: 1, url: 1, purpose: 1, expiresAt: 1 },
  { name: 'complaint_attachment_grant_lookup' },
);
complaintAttachmentGrantSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'complaint_attachment_grant_ttl' },
);

export default mongoose.models.ComplaintAttachmentGrant
  || mongoose.model('ComplaintAttachmentGrant', complaintAttachmentGrantSchema);
