// backend/src/models/User.js
import mongoose from 'mongoose';

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
    enum: ['ADMIN', 'EMPLOYER', 'WORKER'],
    default: 'WORKER'
  },
  phone: {
    type: String,
    default: ''
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
  }
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);