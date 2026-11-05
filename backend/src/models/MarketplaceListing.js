import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  reason: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const marketplaceListingSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
  country: { type: String, required: true, uppercase: true, trim: true, maxlength: 2, index: true },
  region: { type: String, required: true, trim: true, maxlength: 120, index: true },
  city: { type: String, required: true, trim: true, maxlength: 120 },
  locationDescription: { type: String, required: true, trim: true, maxlength: 500 },
  phone: { type: String, required: true, trim: true, maxlength: 32 },
  whatsapp: { type: String, default: null, trim: true, maxlength: 32 },
  image: {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    bytes: { type: Number, required: true, min: 1 },
    mimeType: { type: String, required: true }
  },
  status: { type: String, enum: ['ACTIVE', 'SOLD', 'HIDDEN'], default: 'ACTIVE', index: true },
  preHiddenStatus: { type: String, enum: ['ACTIVE', 'SOLD'], default: null },
  reports: { type: [reportSchema], default: [] },
  moderatedBy: { type: String, default: null },
  moderatedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, collection: 'marketplace_listings' });

marketplaceListingSchema.index({ status: 1, deletedAt: 1, createdAt: -1 });
marketplaceListingSchema.index({ title: 'text', description: 'text' });
marketplaceListingSchema.index({ ownerId: 1, createdAt: -1 });

const MarketplaceListing = mongoose.models.MarketplaceListing || mongoose.model('MarketplaceListing', marketplaceListingSchema);
export const ensureMarketplaceIndexes = () => MarketplaceListing.createIndexes();
export default MarketplaceListing;
