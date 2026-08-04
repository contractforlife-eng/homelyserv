import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dotenv.config();

const MONGODB_URI =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/homelyserv';

console.log("Mongo URI exists:", !!MONGODB_URI);

await mongoose.connect(MONGODB_URI);

console.log("Database:", mongoose.connection.db.databaseName);

const user = await User.findOne({
  email: 'rania@homelyserv.com'
});

console.log("Rania:", user);

await mongoose.disconnect();