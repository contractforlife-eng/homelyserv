import mongoose from 'mongoose';

const EVENT_TYPES = ['LOGIN_PAGE_VIEW', 'APK_DOWNLOAD'];
const SOURCES = ['web', 'android'];

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: EVENT_TYPES,
    required: true,
    immutable: true,
  },
  source: {
    type: String,
    enum: SOURCES,
    required: true,
    immutable: true,
  },
  dayKey: {
    type: String,
    required: true,
    immutable: true,
  },
  dedupeKey: {
    type: String,
    required: true,
    immutable: true,
    maxlength: 160,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  collection: 'analytics_events',
  versionKey: false,
});

analyticsEventSchema.index(
  { eventType: 1, source: 1, dayKey: 1, dedupeKey: 1 },
  { unique: true, name: 'analytics_event_dedupe_key' },
);
analyticsEventSchema.index(
  { eventType: 1, createdAt: 1 },
  { name: 'analytics_event_type_created_at' },
);
analyticsEventSchema.index(
  { eventType: 1, source: 1, createdAt: 1 },
  { name: 'analytics_event_source_created_at' },
);

export { EVENT_TYPES, SOURCES };
const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export const ensureAnalyticsIndexes = () => AnalyticsEvent.createIndexes();
export default AnalyticsEvent;
