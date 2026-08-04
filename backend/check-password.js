import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const MONGODB_URI =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI;

await mongoose.connect(MONGODB_URI);

const user = await User.findOne({
  email: 'rania@homelyserv.com'
});

const result = await bcrypt.compare(
  'Support@123',
  user.password
);

console.log("Password matches:", result);

await mongoose.disconnect();