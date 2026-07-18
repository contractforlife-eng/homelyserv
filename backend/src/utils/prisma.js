// backend/src/utils/prisma.js (MongoDB version)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  // No localhost fallback: a silent local connection is ephemeral and loses data.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ FATAL: MONGODB_URI is not set. Refusing to connect to an ephemeral local database.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, retryWrites: true });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
