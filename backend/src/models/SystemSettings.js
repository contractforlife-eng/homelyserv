// backend/src/models/SystemSettings.js
import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'platform'
  },
  data: {
    type: Object,
    required: true,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('SystemSettings', SystemSettingsSchema);
