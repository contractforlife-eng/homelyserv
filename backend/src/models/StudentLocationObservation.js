import mongoose from 'mongoose';

const studentLocationObservationSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    observationId: { type: String, required: true, lowercase: true, trim: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, required: true, min: 0, max: 10000 },
    recordedAt: { type: Date, required: true },
    receivedAt: { type: Date, required: true, default: Date.now },
    speed: { type: Number, default: null, min: 0, max: 400 },
    heading: { type: Number, default: null, min: 0, max: 359.999 }
  },
  { timestamps: false, collection: 'student_location_observations' }
);

studentLocationObservationSchema.index({ studentUserId: 1, recordedAt: -1 });
studentLocationObservationSchema.index(
  { studentUserId: 1, observationId: 1 },
  { unique: true, partialFilterExpression: { observationId: { $type: 'string' } } }
);

export default mongoose.models.StudentLocationObservation
  || mongoose.model('StudentLocationObservation', studentLocationObservationSchema);
